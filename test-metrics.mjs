/**
 * 灵犀 · 指标与疗效统计自测（纯本地）
 * 运行：node test-metrics.mjs
 */
import assert from 'node:assert/strict';
import {
  aggregateFailures,
  attachLessonEfficacy,
  classifyCorrection,
  selectAutoActivatable,
  splitSceneBeforeAfter,
  summarizeSceneFailures,
  summarizeCorrections,
  countRetiredForKey,
  dailySeriesByKey,
  findCoverage,
  findPromotable,
  findRegressions,
  attributeLessons,
  summarizeQuality,
  compareWindows,
  dayKey,
  emptyCounters,
  mergeDelta,
  pruneDays,
  series,
} from './metrics.js';

import { checks, check, report } from './test-helpers.mjs';

await check('日期键为 YYYY-MM-DD', async () => {
  assert.equal(dayKey(new Date('2026-10-26T12:00:00').getTime()), '2026-10-26');
  assert.match(dayKey(Date.now()), /^\d{4}-\d{2}-\d{2}$/);
});

await check('增量并入当日桶并累加，未知字段被忽略', async () => {
  const at = new Date('2026-10-26T12:00:00').getTime();
  let days = mergeDelta({}, { injected: 2, hits: 1, bogus: 9 }, dayKey(at));
  days = mergeDelta(days, { injected: 3, misses: 2 }, dayKey(at));
  const bucket = days['2026-10-26'];
  assert.equal(bucket.injected, 5);
  assert.equal(bucket.hits, 1);
  assert.equal(bucket.misses, 2);
  assert.equal('bogus' in bucket, false);
  const defaults = emptyCounters();
  for (const key of Object.keys(defaults)) assert.ok(key in bucket, `missing ${key}`);
});

await check('旧日期被裁剪', async () => {
  const now = new Date('2026-10-26T12:00:00').getTime();
  const days = { '2020-01-01': emptyCounters(), [dayKey(now)]: emptyCounters() };
  const pruned = pruneDays(days, now);
  assert.equal('2020-01-01' in pruned, false);
  assert.ok(dayKey(now) in pruned);
});

await check('序列连续补齐且升序', async () => {
  const now = new Date('2026-10-26T12:00:00').getTime();
  const days = { [dayKey(now)]: { ...emptyCounters(), injected: 4 } };
  const out = series(days, 7, now);
  assert.equal(out.length, 7);
  assert.equal(out[6].day, dayKey(now));
  assert.equal(out[6].injected, 4);
  assert.equal(out[0].injected, 0);
  assert.ok(out[0].day < out[1].day);
});

await check('本周 vs 上周窗口分离', async () => {
  const now = new Date('2026-10-26T12:00:00').getTime();
  const today = dayKey(now);
  const lastWeek = dayKey(now - 10 * 86_400_000);
  const days = {
    [today]: { ...emptyCounters(), hits: 5 },
    [lastWeek]: { ...emptyCounters(), hits: 2 },
  };
  const compare = compareWindows(days, 7, now);
  assert.equal(compare.recent.hits, 5);
  assert.equal(compare.previous.hits, 2);
});

await check('复发率：键聚合与 repeated 判定', async () => {
  const at = Date.now();
  const result = aggregateFailures([
    { key: 'pwsh|ENOENT|路径不存在', at: at - 5000 },
    { key: 'pwsh|ENOENT|路径不存在', at: at - 1000 },
    { key: 'edit|EACCES|权限不足', at: at - 2000 },
  ]);
  assert.equal(result.totalFailures, 3);
  assert.equal(result.distinctKeys, 2);
  assert.equal(result.repeatedKeys, 1);
  assert.equal(result.repeatRate, 0.5);
  assert.equal(result.top[0].count, 2);
  assert.ok(result.top[0].first <= result.top[0].last);
});

await check('空样本不炸且比率为 0', async () => {
  const result = aggregateFailures([]);
  assert.equal(result.totalFailures, 0);
  assert.equal(result.distinctKeys, 0);
  assert.equal(result.repeatRate, 0);
  assert.deepEqual(result.top, []);
});

await check('学习效果归因：捕获前后按 tool|code 分开计数', async () => {
  const now = new Date('2026-10-27T12:00:00').getTime();
  const day = 86_400_000;
  const capturedAt = now - 3 * day;
  const failures = [
    { key: 'read|FS_NOT_FOUND|a', at: now - 6 * day },
    { key: 'read|FS_NOT_FOUND|b', at: now - 5 * day },
    { key: 'read|FS_NOT_FOUND|c', at: now - 4 * day },
    { key: 'read|FS_NOT_FOUND|d', at: now - 1 * day },
    { key: 'edit|EACCES|x', at: now - 2 * day },
  ];
  const lessons = [
    { tool: 'read', code: 'FS_NOT_FOUND', capturedAt },
    { tool: 'edit', code: 'EACCES', capturedAt: now - 1 * day },
  ];
  const result = attributeLessons({ failures, lessons, now });
  const read = result.pairs.find((pair) => pair.tool === 'read');
  assert.equal(read.before, 3);
  assert.equal(read.after, 1);
  assert.ok(read.beforePerDay > 0);
  assert.ok(read.windowDays >= 2);
  const totals = result.totals;
  assert.equal(totals.lessons, 2);
  assert.equal(totals.before, 4);
  assert.equal(totals.after, 1);
  assert.equal(totals.delta, -3);
});

await check('归因容错：没有捕获时间/没有样本的教训被跳过', async () => {
  const result = attributeLessons({
    failures: [{ key: 'glob|SEARCH_FAILED|z', at: Date.now() }],
    lessons: [
      { tool: 'glob', code: 'SEARCH_FAILED', capturedAt: 0 },
      { tool: 'read', code: 'NOPE', capturedAt: Date.now() },
    ],
    now: Date.now(),
  });
  assert.equal(result.pairs.length, 0);
  assert.equal(result.totals.lessons, 0);
});


await check('注入有效性汇总：按是否注入分组算失败率', async () => {
  const result = summarizeQuality([
    { injectedChars: 300, toolCalls: 10, toolFailures: 1 },
    { injectedChars: 200, toolCalls: 10, toolFailures: 3 },
    { injectedChars: 0, toolCalls: 10, toolFailures: 6 },
    { injectedChars: 0, toolCalls: 0, toolFailures: 0 },
    { injectedChars: 0, toolCalls: 10, toolFailures: 4 },
  ]);
  assert.equal(result.sessions, 5);
  assert.equal(result.injected.sessions, 2);
  assert.equal(result.injected.calls, 20);
  assert.equal(result.injected.failures, 4);
  assert.equal(result.injected.failureRate, 0.2);
  assert.equal(result.empty.sessions, 3);
  assert.equal(result.empty.failureRate, 0.5);
  assert.equal(summarizeQuality([]).injected.failureRate, null);
});


await check('每条教训的独立疗效：按 tool|code 映射前后与命中', async () => {
  const pairs = [
    { tool: 'read', code: 'FS_NOT_FOUND', before: 77, after: 4 },
    { tool: 'web_fetch', code: 'WEB_PROVIDER_ERROR', before: 24, after: 0 },
  ];
  const lessons = [
    { id: 'a', tool: 'read', code: 'FS_NOT_FOUND', hits: 3, misses: 1 },
    { id: 'b', tool: 'web_fetch', code: 'WEB_PROVIDER_ERROR', hits: 0, misses: 2 },
    { id: 'c', tool: 'glob', code: 'SEARCH_FAILED', hits: 0, misses: 0 },
  ];
  const out = attachLessonEfficacy(pairs, lessons);
  assert.equal(out.length, 2);
  assert.equal(out[0].id, 'a');
  assert.equal(out[0].delta, -73);
  assert.equal(out[1].delta, -24);
  assert.equal(attachLessonEfficacy(null, lessons).length, 0);
});


await check('疗效为负：捕获后反而变多的教训被挑出', async () => {
  const list = [
    { id: 'a', before: 5, after: 1 },
    { id: 'b', before: 2, after: 6 },
    { id: 'c', before: 0, after: 1 },
    { id: 'd', before: 0, after: 3 },
  ];
  const out = findRegressions(list);
  assert.deepEqual(out.map((entry) => entry.id), ['b', 'd']);
  assert.equal(findRegressions(null).length, 0);
});


await check('纠错识别与频率：近 7 天 vs 前 7 天', async () => {
  assert.equal(classifyCorrection('不对，我要的是短视频'), true);
  assert.equal(classifyCorrection('你又错了，跑偏了'), true);
  assert.equal(classifyCorrection('继续做吧，辛苦了'), false);
  assert.equal(classifyCorrection('这个方案太片面了，准确度还不够'), true);
  assert.equal(classifyCorrection('我说的删除保障的意思是要能数据清洗删除'), true);
  const now = Date.now();
  const day = 86_400_000;
  const events = [
    { at: now - 1 * day, text: '不对，这里应该用 pnpm' },
    { at: now - 2 * day, text: '继续' },
    { at: now - 3 * day, text: '好的，按这个来' },
    { at: now - 10 * day, text: '不是这样，重来' },
    { at: now - 11 * day, text: '再试一次' },
  ];
  const out = summarizeCorrections(events, { now });
  assert.equal(out.totalMessages, 5);
  assert.equal(out.totalCorrections, 2);
  assert.equal(out.recent.messages, 3);
  assert.equal(out.recent.corrections, 1);
  assert.equal(out.previous.messages, 2);
  assert.equal(out.previous.corrections, 1);
  assert.equal(out.recent.ratePer100, 33.3);
  assert.equal(summarizeCorrections([], { now }).ratePer100, null);
});


await check('注入有效性：按注入量分档对比失败率', async () => {
  const result = summarizeQuality([
    { injectedChars: 0, toolCalls: 10, toolFailures: 5 },
    { injectedChars: 400, toolCalls: 10, toolFailures: 2 },
    { injectedChars: 1500, toolCalls: 10, toolFailures: 1 },
  ]);
  const byKey = new Map(result.buckets.map((b) => [b.key, b]));
  assert.equal(byKey.get('none').failureRate, 0.5);
  assert.equal(byKey.get('small').failureRate, 0.2);
  assert.equal(byKey.get('large').failureRate, 0.1);
});


await check('跨会话复现：私有教训命中多个会话时应建议提升', async () => {
  const lessons = [
    { id: 'a', tool: 'read', code: 'FS_NOT_FOUND', sharing: 'private' },
    { id: 'b', tool: 'edit', code: 'FS_STALE_VERSION', sharing: 'global' },
    { id: 'c', tool: 'glob', code: 'SEARCH_FAILED', sharing: 'private' },
  ];
  const cross = [
    { tool: 'read', code: 'FS_NOT_FOUND', sessions: 3, count: 12 },
    { tool: 'edit', code: 'FS_STALE_VERSION', sessions: 4, count: 9 },
    { tool: 'glob', code: 'SEARCH_FAILED', sessions: 1, count: 1 },
  ];
  const out = findPromotable(lessons, cross);
  assert.deepEqual(out.map((entry) => entry.id), ['a']);
  assert.equal(out[0].sessions, 3);
  assert.equal(findPromotable(lessons, []).length, 0);
});

await check('自动转正：只动共享候选，不碰 private', async () => {
  const lessons = [
    { id: 'shared', tool: 'read', code: 'FS_NOT_FOUND', sharing: 'global', status: 'candidate' },
    { id: 'priv', tool: 'read', code: 'FS_NOT_FOUND', sharing: 'private', status: 'candidate' },
    { id: 'already', tool: 'read', code: 'FS_NOT_FOUND', sharing: 'global', status: 'active' },
    { id: 'rare', tool: 'glob', code: 'SEARCH_FAILED', sharing: 'global', status: 'candidate' },
  ];
  const cross = [
    { tool: 'read', code: 'FS_NOT_FOUND', sessions: 13, count: 79 },
    { tool: 'glob', code: 'SEARCH_FAILED', sessions: 2, count: 3 },
  ];
  const out = selectAutoActivatable(lessons, cross);
  assert.deepEqual(out.map((entry) => entry.id), ['shared']);
  assert.equal(selectAutoActivatable(lessons, cross, { minSessions: 20 }).length, 0);
});

await check('复活计数：同一场景被淘汰过几次', async () => {
  const lessons = [
    { kind: 'lesson', status: 'retired', text: '当「read」遇到「FS_NOT_FOUND」时：旧文案', meta: { tool: 'read', code: 'FS_NOT_FOUND' } },
    { kind: 'lesson', status: 'retired', text: '当「read」遇到「FS_NOT_FOUND」时：再旧', meta: { tool: 'read', code: 'FS_NOT_FOUND' } },
    { kind: 'lesson', status: 'active', text: '当「read」遇到「FS_NOT_FOUND」时：在用', meta: { tool: 'read', code: 'FS_NOT_FOUND' } },
    { kind: 'lesson', status: 'retired', text: '当「edit」遇到「FS_STALE_VERSION」时：旧', meta: { tool: 'edit', code: 'FS_STALE_VERSION' } },
  ];
  assert.equal(countRetiredForKey(lessons, 'read', 'FS_NOT_FOUND'), 2);
  assert.equal(countRetiredForKey(lessons, 'edit', 'FS_STALE_VERSION'), 1);
  assert.equal(countRetiredForKey(lessons, 'glob', 'X'), 0);
  assert.equal(countRetiredForKey(null, 'read', 'X'), 0);
});

await check('按场景汇总：失败次数与复发率', async () => {
  const sceneOf = (tool) => (tool === 'read' ? 'file' : tool === 'pwsh' ? 'command' : 'other');
  const failures = [
    { key: 'read|FS_NOT_FOUND|x' },
    { key: 'read|FS_NOT_FOUND|x' },
    { key: 'read|FS_STALE_VERSION|y' },
    { key: 'pwsh|TOOL_TIMEOUT|z' },
  ];
  const out = summarizeSceneFailures(failures, sceneOf);
  const file = out.find((entry) => entry.scene === 'file');
  const command = out.find((entry) => entry.scene === 'command');
  assert.equal(file.failures, 3);
  assert.equal(file.distinct, 2);
  assert.equal(file.repeated, 1);
  assert.equal(file.repeatRate, 0.5);
  assert.equal(command.failures, 1);
  assert.equal(command.repeatRate, 0);
  assert.equal(summarizeSceneFailures(null, sceneOf).length, 0);
});

await check('场景治理前后：按首条教训时间切分', async () => {
  const sceneOf = (tool) => (tool === 'read' ? 'file' : 'other');
  const startByScene = new Map([['file', 1000]]);
  const failures = [
    { key: 'read|FS_NOT_FOUND|x', at: 500 },
    { key: 'read|FS_NOT_FOUND|x', at: 900 },
    { key: 'read|FS_NOT_FOUND|y', at: 1500 },
    { key: 'web_fetch|WEB_PROVIDER_ERROR|z', at: 800 },
  ];
  const out = splitSceneBeforeAfter(failures, sceneOf, startByScene);
  const file = out.find((entry) => entry.scene === 'file');
  const other = out.find((entry) => entry.scene === 'other');
  assert.equal(file.before, 2, JSON.stringify(file));
  assert.equal(file.after, 1);
  assert.equal(file.lessonFrom, 1000);
  assert.equal(other.before, 1);
  assert.equal(other.after, 0, JSON.stringify(other));
});

await check('指标计数器包含守卫三项', async () => {
  const counters = emptyCounters();
  assert.equal(counters.guardDenied, 0);
  assert.equal(counters.guardEffective, 0);
  assert.equal(counters.guardIneffective, 0);
  assert.equal(counters.corrections, 0);
  assert.equal(counters.correctionPenalized, 0);
  assert.equal(counters.searches, 0);
  assert.equal(counters.searchAbstained, 0);
  assert.equal(counters.quarantined, 0);
  assert.equal(counters.evicted, 0);
  assert.equal(counters.mergedMemory, 0);
  assert.equal(counters.demoted, 0);
  assert.equal(counters.upgraded, 0);
  assert.equal(counters.alertsRaised, 0);
  assert.equal(counters.adviceAdopted, 0);
  assert.equal(counters.adviceIgnored, 0);
  assert.equal(counters.coreGated, 0);
  const days = mergeDelta({}, { guardDenied: 2, guardEffective: 1 });
  const today = days[dayKey(Date.now())];
  assert.equal(today.guardDenied, 2);
  assert.equal(today.guardEffective, 1);
  assert.equal(today.guardIneffective, 0);
});

await check('记忆覆盖率：重复场景里有教训的比例与缺口', async () => {
  const cross = [
    { tool: 'read', code: 'FS_NOT_FOUND', sessions: 13, count: 79 },
    { tool: 'edit', code: 'FS_STALE_VERSION', sessions: 8, count: 17 },
    { tool: 'glob', code: 'SEARCH_FAILED', sessions: 2, count: 2 },
  ];
  const lessons = [
    { tool: 'read', code: 'FS_NOT_FOUND', status: 'active' },
    { tool: 'edit', code: 'FS_STALE_VERSION', status: 'candidate' },
  ];
  const out = findCoverage(cross, lessons);
  assert.equal(out.total, 2);
  assert.equal(out.covered, 2);
  assert.equal(out.ratio, 1);
  const partial = findCoverage(cross, lessons.slice(0, 1));
  assert.equal(partial.ratio, 0.5);
  assert.deepEqual(partial.holes.map((hole) => hole.tool), ['edit']);
});

await check('按 key 的每日趋势：缺数据天补 0', async () => {
  const now = new Date('2026-10-27T12:00:00').getTime();
  const day = 86_400_000;
  const failures = [
    { key: 'read|FS_NOT_FOUND|a', at: now - 2 * day },
    { key: 'read|FS_NOT_FOUND|b', at: now - 2 * day },
    { key: 'read|FS_NOT_FOUND|c', at: now - 1 * day },
    { key: 'edit|FS_STALE_VERSION|x', at: now - 1 * day },
  ];
  const out = dailySeriesByKey(failures, ['read|FS_NOT_FOUND'], { now, days: 5 });
  assert.equal(out.length, 1);
  assert.equal(out[0].points.length, 5);
  assert.equal(out[0].points[4].count, 0);
  assert.equal(out[0].points[2].count, 2);
  assert.equal(out[0].values ?? out[0].total, 3);
});

await check('载荷字段位置：客户端读路径必须与后端写入位置一致', async () => {
  const fs = await import('node:fs');
  const server = fs.readFileSync(new URL('./index.js', import.meta.url), 'utf8');
  const client = fs.readFileSync(new URL('./client.js', import.meta.url), 'utf8');
  // 客户端读 efficacy.lessonEfficacy / efficacy.regressions：
  // 后端若把它们放在 efficacy 同级，界面就永远显示为空（真实发生过）。
  assert.ok(client.includes('efficacy?.lessonEfficacy'), 'client reads efficacy.lessonEfficacy');
  const idx = server.indexOf('lessonEfficacy,');
  assert.ok(idx > 0, 'server writes lessonEfficacy');
  // 它必须出现在 efficacy: { ... } 块内：往回找最近的 "efficacy: {" 比最近的对象收尾更近
  const before = server.slice(Math.max(0, idx - 2000), idx);
  const lastEfficacyOpen = before.lastIndexOf('efficacy: {');
  // 该字段前不应已经出现过与 efficacy 平级的 attribution,
  const seg = before.slice(lastEfficacyOpen);
  assert.equal(seg.includes('attribution,'), false, 'lessonEfficacy must sit inside the efficacy block, before attribution');
});

await check('同一载荷对象里不出现重复键（coverage 曾写两次）', async () => {
  const fs = await import('node:fs');
  const server = fs.readFileSync(new URL('./index.js', import.meta.url), 'utf8');
  const lines = server.split('\n');
  let dup = 0;
  for (let i = 0; i < lines.length; i += 1) {
    if (!lines[i].includes('coverage: efficacy.coverage ?? null,')) continue;
    for (let j = i + 1; j <= Math.min(i + 8, lines.length - 1); j += 1) {
      if (lines[j].includes('coverage: efficacy.coverage ?? null,')) { dup += 1; break; }
    }
  }
  assert.equal(dup, 0, 'no duplicated coverage key in the same payload object, found ' + dup);
});

await check('因果对照：能识别有效教训，且样本不足时拒绝下结论', async () => {
  const { analyzeCausalExperiment } = await import('./metrics.js');
  const entries = [];
  // A：注入时 2% 失败，保留时 20% 失败 → 教训确实有效，样本充足
  for (let i = 0; i < 50; i += 1) {
    entries.push({ experimentOn: true, byTool: { read: 1 }, failByKey: { 'read|FS_NOT_FOUND': i < 1 ? 1 : 0 }, injectedKeys: ['read|FS_NOT_FOUND'], heldOutKeys: [] });
    entries.push({ experimentOn: true, byTool: { read: 1 }, failByKey: { 'read|FS_NOT_FOUND': i < 10 ? 1 : 0 }, injectedKeys: [], heldOutKeys: ['read|FS_NOT_FOUND'] });
  }
  // B：两组都有样本但都很少 → 必须 inconclusive（区间必然跨 0）
  for (let i = 0; i < 2; i += 1) {
    entries.push({ experimentOn: true, byTool: { pwsh: 1 }, failByKey: { 'pwsh|TIMEOUT': i < 1 ? 1 : 0 }, injectedKeys: ['pwsh|TIMEOUT'], heldOutKeys: [] });
    entries.push({ experimentOn: true, byTool: { pwsh: 1 }, failByKey: {}, injectedKeys: [], heldOutKeys: ['pwsh|TIMEOUT'] });
  }
  // C：只有注入组、没有对照组 → insufficient（连可比基线都没有）
  for (let i = 0; i < 5; i += 1) {
    entries.push({ experimentOn: true, byTool: { glob: 1 }, failByKey: {}, injectedKeys: ['glob|FS_NOT_FOUND'], heldOutKeys: [] });
  }
  // C：没开实验的轮次不算数
  entries.push({ experimentOn: false, byTool: { read: 1 }, failByKey: {}, injectedKeys: [], heldOutKeys: [] });

  const r = analyzeCausalExperiment(entries);
  const helping = r.rows.find((row) => row.key === 'read|FS_NOT_FOUND');
  assert.equal(helping.verdict, 'helps', 'effective lesson detected: ' + helping.verdict);
  assert.ok(helping.delta > 0, 'held-out arm fails more: ' + helping.delta);
  const tiny = r.rows.find((row) => row.key === 'pwsh|TIMEOUT');
  assert.equal(tiny.verdict, 'inconclusive', 'tiny two-arm sample must not conclude: ' + tiny.verdict);
  assert.ok(tiny.ci.low < 0 && tiny.ci.high > 0, 'interval straddles zero: ' + JSON.stringify(tiny.ci));
  const noControl = r.rows.find((row) => row.key === 'glob|FS_NOT_FOUND');
  assert.equal(noControl.verdict, 'insufficient', 'no control arm → insufficient: ' + noControl.verdict);
  assert.equal(noControl.delta, null, 'no delta without a control arm');
  // 未开启实验的轮次不应计入
  assert.equal(r.turns, 109, 'only experiment turns counted, got ' + r.turns);
});

await check('因果对照：区间跨 0 时不给结论（不把噪声当发现）', async () => {
  const { analyzeCausalExperiment } = await import('./metrics.js');
  const entries = [];
  // 8/40 vs 2/40：看起来有差别，但 n 太小，区间跨 0 → inconclusive
  for (let i = 0; i < 40; i += 1) {
    entries.push({ experimentOn: true, byTool: { edit: 1 }, failByKey: { 'edit|FS_STALE_VERSION': i < 8 ? 1 : 0 }, injectedKeys: ['edit|FS_STALE_VERSION'], heldOutKeys: [] });
    entries.push({ experimentOn: true, byTool: { edit: 1 }, failByKey: { 'edit|FS_STALE_VERSION': i < 2 ? 1 : 0 }, injectedKeys: [], heldOutKeys: ['edit|FS_STALE_VERSION'] });
  }
  const r = analyzeCausalExperiment(entries);
  const row = r.rows[0];
  assert.equal(row.verdict, 'inconclusive', 'must not conclude from weak evidence: ' + row.verdict);
  assert.ok(row.ci.low < 0 && row.ci.high > 0, 'interval straddles zero: ' + JSON.stringify(row.ci));
});

await check('因果对照：空输入不崩，且只抽守卫教训', async () => {
  const { analyzeCausalExperiment } = await import('./metrics.js');
  const empty = analyzeCausalExperiment([]);
  assert.equal(empty.keys, 0);
  assert.equal(empty.turns, 0);
  const g = await import('./injector.js');
  // 守卫教训 = 带工具与错误码的 lesson
  assert.equal(g.guardKeyOf({ kind: 'lesson', meta: { tool: 'read', code: 'FS_NOT_FOUND' } }), 'read|FS_NOT_FOUND');
  assert.equal(g.guardKeyOf({ kind: 'lesson', meta: {} }), null, 'no tool/code → not a guard');
  assert.equal(g.guardKeyOf({ kind: 'preference', meta: { tool: 'read', code: 'X' } }), null, 'non-lesson never sampled');
  // 用户意志永不参与对照
  assert.equal(g.neverHoldOut({ kind: 'constraint' }), true);
  assert.equal(g.neverHoldOut({ kind: 'preference' }), true);
  assert.equal(g.neverHoldOut({ kind: 'lesson' }), false);
});

await check('同一对象里不出现重复的设置键（重复键会静默覆盖，曾多次发生）', async () => {
  const fs = await import('node:fs');
  const src = fs.readFileSync(new URL('./index.js', import.meta.url), 'utf8');
  const lines = src.split('\n');
  const group = ['semantic', 'semanticModel', 'reviewModel', 'autoReview', 'autoReviewDays', 'causalExperiment', 'causalHoldoutRate'];
  const dups = [];
  /* 同一对象 = 同缩进 + 邻近（中间没有更浅缩进的 } 收尾）。这里用保守判据：
     同缩进且行距 < 20 视为同一对象内的重复。 */
  const seen = [];
  for (let i = 0; i < lines.length; i += 1) {
    const m = /^(\s*)(\w+):/.exec(lines[i]);
    if (m === null || !group.includes(m[2])) continue;
    const indent = m[1].length;
    const hit = seen.filter((s) => s.key === m[2] && s.indent === indent && i - s.line < 20);
    if (hit.length > 0) dups.push(m[2] + ' @' + (i + 1));
    seen.push({ key: m[2], indent, line: i });
  }
  assert.deepEqual(dups, [], 'duplicate setting keys in one object: ' + dups.join(', '));
});

await check('因果实验开关与结论都能被外部读到（便于核对）', async () => {
  const fs = await import('node:fs');
  const src = fs.readFileSync(new URL('./index.js', import.meta.url), 'utf8');
  assert.ok(src.includes('causalExperiment: settings.causalExperiment === true'), 'status exposes experiment switch');
  assert.ok(src.includes('injectionPatch.causalExperiment !== undefined'), 'config route accepts the switch');
  assert.ok(src.includes('injectionPatch.causalHoldoutRate !== undefined'), 'config route accepts the rate');
  assert.ok(src.includes('analyzeCausalExperiment'), 'analysis is wired');
});
report();
