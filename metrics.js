/**
 * 灵犀 · 本地指标与疗效统计（纯本地，无网络）
 *
 * 两个用途：
 *   1) 日粒度计数落盘：注入/命中/证伪/捕获/加强/重复失败，按天桶存；
 *      面板据此画趋势，也能回答"这周比上周好吗"。
 *   2) 复发率：从宿主会话日志里把 tool/result 报错规范化后按键聚合，
 *      得到 totalFailures / distinctKeys / repeatedKeys / repeatRate ——
 *      这是"同一场景不犯第二次"最直接的可测口径。
 */
import { promises as fsp } from 'node:fs';
import path from 'node:path';

const FILE = 'metrics.json';
const KEEP_DAYS = 90;

/** 本地日期键 YYYY-MM-DD（按系统时区，不引第三方库）。 */
export function dayKey(at) {
  const d = new Date(at);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function emptyCounters() {
  return {
    injected: 0,
    hits: 0,
    misses: 0,
    captured: 0,
    refined: 0,
    repeatFailures: 0,
    warnEffective: 0,
    warnIneffective: 0,
    guardDenied: 0,
    guardEffective: 0,
    guardIneffective: 0,
    corrections: 0,
    correctionPenalized: 0,
    searches: 0,
    searchAbstained: 0,
    quarantined: 0,
    evicted: 0,
    mergedMemory: 0,
    demoted: 0,
    upgraded: 0,
    alertsRaised: 0,
    adviceAdopted: 0,
    adviceIgnored: 0,
    coreGated: 0,
    chars: 0,
    refreshes: 0,
  };
}

/** 把一次增量并入日桶（返回新对象，便于测试）。 */
export function mergeDelta(days, delta, day = dayKey(Date.now())) {
  const next = { ...days };
  const current = { ...emptyCounters(), ...(next[day] ?? {}) };
  for (const key of Object.keys(emptyCounters())) {
    const value = Number(delta?.[key]);
    if (Number.isFinite(value) && value !== 0) current[key] = Math.round((current[key] + value) * 1000) / 1000;
  }
  next[day] = current;
  return next;
}

/** 只保留最近 KEEP_DAYS 天。 */
export function pruneDays(days, now = Date.now()) {
  const keys = Object.keys(days).sort();
  const cutoff = dayKey(now - KEEP_DAYS * 86_400_000);
  const next = {};
  for (const key of keys) if (key >= cutoff) next[key] = days[key];
  return next;
}

/** 生成最近 n 天的连续序列（缺的天补 0），升序。 */
export function series(days, n = 14, now = Date.now()) {
  const out = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const key = dayKey(now - i * 86_400_000);
    out.push({ day: key, ...emptyCounters(), ...(days[key] ?? {}) });
  }
  return out;
}

/** 区间汇总：最近 n 天与再往前 n 天，用于"这周 vs 上周"。 */
export function compareWindows(days, n = 7, now = Date.now()) {
  const sum = (fromMs, toMs) => {
    const total = emptyCounters();
    for (const [key, value] of Object.entries(days)) {
      const at = Date.parse(`${key}T00:00:00`);
      if (!Number.isFinite(at) || at < fromMs || at >= toMs) continue;
      for (const field of Object.keys(total)) total[field] += Number(value?.[field] ?? 0) || 0;
    }
    return total;
  };
  const dayMs = 86_400_000;
  const recent = sum(now - n * dayMs, now + dayMs);
  const previous = sum(now - 2 * n * dayMs, now - n * dayMs);
  return { recent, previous, n };
}

/**
 * 学习效果归因：一条教训被沉淀之后，同类失败真的少了吗？
 *
 * 失败事件按 tool|code|reason 归一，教训只知道 tool/code（capturedAt 是写入时间），
 * 因此按 tool|code 前缀匹配，统计捕获前后各自的次数与日均速率。
 * 只做事后归因，不假装因果：窗口太短的样本会标出 windowDays。
 */
export function attributeLessons({ failures = [], lessons = [], now = Date.now(), minDays = 0.5 } = {}) {
  const pairs = [];
  for (const lesson of Array.isArray(lessons) ? lessons : []) {
    const tool = String(lesson?.tool ?? '');
    const code = String(lesson?.code ?? '');
    const capturedAt = Number(lesson?.capturedAt);
    if (tool === '' || !Number.isFinite(capturedAt) || capturedAt <= 0) continue;
    const prefix = tool + '|' + (code === '' ? '' : code + '|');
    let before = 0;
    let after = 0;
    let firstAt = Infinity;
    for (const failure of failures) {
      const key = String(failure?.key ?? '');
      if (!key.startsWith(prefix)) continue;
      const at = Number(failure?.at);
      if (!Number.isFinite(at) || at <= 0) continue;
      if (at < firstAt) firstAt = at;
      if (at < capturedAt) before += 1;
      else after += 1;
    }
    if (before + after === 0) continue;
    const beforeDays = Math.max(minDays, (capturedAt - (Number.isFinite(firstAt) ? firstAt : capturedAt)) / 86_400_000);
    const afterDays = Math.max(minDays, (now - capturedAt) / 86_400_000);
    pairs.push({
      tool,
      code,
      capturedAt,
      before,
      after,
      beforePerDay: Math.round((before / beforeDays) * 100) / 100,
      afterPerDay: Math.round((after / afterDays) * 100) / 100,
      windowDays: Math.round(afterDays * 10) / 10,
    });
  }
  pairs.sort((a, b) => b.after - a.after || b.before - a.before);
  const before = pairs.reduce((sum, pair) => sum + pair.before, 0);
  const after = pairs.reduce((sum, pair) => sum + pair.after, 0);
  return {
    pairs: pairs.slice(0, 12),
    totals: { lessons: pairs.length, before, after, delta: after - before },
  };
}

/**
 * 复发率：把报错按规范化键聚合。
 * repeated = 出现 ≥2 次的键（同一场景又犯了一次）。
 * @param {{key:string, at:number}[]} failures
 */
/**
 * 注入有效性（关联口径，不是因果）：
 * 按会话记录"是否注入了非空记忆块"、工具调用数与失败数，
 * 再比较两组会话的失败率。样本少时会如实标出 sessions 数量。
 */
export function summarizeQuality(entries) {
  const list = Array.isArray(entries) ? entries.filter((entry) => entry !== null && entry !== undefined) : [];
  const groups = {
    injected: { sessions: 0, calls: 0, failures: 0 },
    empty: { sessions: 0, calls: 0, failures: 0 },
  };
  for (const entry of list) {
    const group = Number(entry.injectedChars) > 0 ? groups.injected : groups.empty;
    group.sessions += 1;
    group.calls += Math.max(0, Number(entry.toolCalls) || 0);
    group.failures += Math.max(0, Number(entry.toolFailures) || 0);
  }
  const BUCKET_KEYS = ['none', 'small', 'large'];
  const bucketMap = {};
  for (const key of BUCKET_KEYS) bucketMap[key] = { sessions: 0, calls: 0, failures: 0 };
  for (const entry of list) {
    const chars = Number(entry.injectedChars) || 0;
    const key = chars === 0 ? 'none' : chars <= 800 ? 'small' : 'large';
    bucketMap[key].sessions += 1;
    bucketMap[key].calls += Math.max(0, Number(entry.toolCalls) || 0);
    bucketMap[key].failures += Math.max(0, Number(entry.toolFailures) || 0);
  }
  const rate = (group) => (group.calls === 0 ? null : Math.round((group.failures / group.calls) * 1000) / 1000);
  return {
    sessions: list.length,
    buckets: BUCKET_KEYS.map((key) => ({ key, ...bucketMap[key], failureRate: rate(bucketMap[key]) })),
    injected: { ...groups.injected, failureRate: rate(groups.injected) },
    empty: { ...groups.empty, failureRate: rate(groups.empty) },
  };
}
/**
 * 把"按 tool|code 的前后对照"映射回具体教训条目，得到每条教训的独立疗效。
 * 一条教训可能和别的教训共享同一个 tool|code（例如改写前后），因此按 id 各自计数。
 */
export function attachLessonEfficacy(pairs, lessons) {
  const list = Array.isArray(pairs) ? pairs : [];
  const out = [];
  for (const lesson of Array.isArray(lessons) ? lessons : []) {
    const tool = String(lesson?.tool ?? '');
    const code = String(lesson?.code ?? '');
    if (tool === '') continue;
    const pair = list.find((entry) => String(entry.tool) === tool && String(entry.code ?? '') === code);
    if (pair === undefined) continue;
    out.push({
      id: lesson.id,
      tool,
      code,
      before: Number(pair.before ?? 0),
      after: Number(pair.after ?? 0),
      delta: Number(pair.after ?? 0) - Number(pair.before ?? 0),
      hits: Number(lesson.hits ?? 0),
      misses: Number(lesson.misses ?? 0),
      windowDays: Number(pair.windowDays ?? 0),
      updatedAt: lesson.updatedAt ?? 0,
    });
  }
  return out;
}

/**
 * 疗效为负：捕获后同类失败反而变多（after > before 且 after>=2）。
 * 这类教训要么表述不对、要么场景判断错了，应优先改写或淘汰。
 */
export function findRegressions(lessonEfficacy, { minAfter = 2 } = {}) {
  const list = Array.isArray(lessonEfficacy) ? lessonEfficacy : [];
  return list
    .filter((entry) => Number(entry.after ?? 0) > Number(entry.before ?? 0))
    .filter((entry) => Number(entry.after ?? 0) >= minAfter)
    .sort((a, b) => (b.after - b.before) - (a.after - a.before));
}

/**
 * 用户纠错识别（纯本地规则）。
 * 只看"显式否定上一轮"的表达，避免把正常讨论误判成纠正。
 */
const CORRECTION_PATTERNS = [
  /不对/, /不是这样/, /不是这个/, /错了/, /搞错/,
  /我说的是/, /我说的/, /我说过/, /我指的是/, /我的意思是/,
  /重来/, /重新做/, /重新改/, /别这样/, /你怎么又/, /又错了/,
  /没按要求/, /跑偏了/, /理解错/, /没听懂/, /不是我要的/,
  /太片面/, /不够准/, /不准确/, /不理想/, /不满意/, /还是差/
];

/**
 * 质疑式反馈：中文里最常见的纠正形式并不是"你错了"，
 * 而是"为什么还不…""怎么还…""根本没好""太难看了"。
 * 这些是真反馈，但比显式否定弱，单独一档统计。
 */
const PUSHBACK_PATTERNS = [
  // 否定式疑问：指向"上一个动作没达成"
  /为什么[^。？！]{0,20}(不|没|没有)/, /咋[^。？！]{0,12}(不|没)/, /怎么[^。？！]{0,12}(还不|还没|没有|不)/,
  // 仍然/还是 + 旧状态
  /(还是|仍然|依然)[^。？！]{0,10}(旧|以前|老|原来|空的|没)/, /(根本|完全)(没|不)/,
  // 缺失与不足
  /(连|连个)[^。？！]{0,10}(都)?(没|没有)/, /(少|缺|漏)了/, /没有[^。？！]{0,8}(吗|吧|啊)/,
  // 外观/质量不满
  /太难(看|用|懂|乱)/, /太(乱|丑|差|低|少)/, /不(一致|匹配|协调|统一)/, /(就)?是(个)?摆设/,
  /(和|跟|与)[^。？！]{0,14}(不一样|不同|差别)/, /(不是|并不是)我要(的|求)/,
  // 不生效/未达成
  /(不|没)生效/, /(不|没)起作用/, /(不|没)起作用/, /(不|没)(持久|保存住|显示出来)/, /(显示|出来|读到)的是(空|旧)/,
];

/** 返回 none | explicit | pushback：两档强度不同，分开计数才诚实。 */
export function classifyCorrectionKind(text) {
  const value = String(text ?? '').trim();
  if (value === '') return 'none';
  if (CORRECTION_PATTERNS.some((pattern) => pattern.test(value))) return 'explicit';
  if (PUSHBACK_PATTERNS.some((pattern) => pattern.test(value))) return 'pushback';
  return 'none';
}

export function classifyCorrection(text) {
  return classifyCorrectionKind(text) !== 'none';
}

/**
 * 纠错频率：整体 + 近 7 天 / 前 7 天对比。
 * events: [{ at: number, text: string }]（来自会话日志的 user/message）
 */
export function summarizeCorrections(events, { now = Date.now(), windowDays = 7 } = {}) {
  const list = Array.isArray(events) ? events.filter((entry) => entry !== null && entry !== undefined) : [];
  const day = 86_400_000;
  const recentFrom = now - windowDays * day;
  const previousFrom = now - 2 * windowDays * day;
  const samples = [];
  const buckets = {
    all: { messages: 0, corrections: 0, pushback: 0 },
    recent: { messages: 0, corrections: 0, pushback: 0 },
    previous: { messages: 0, corrections: 0, pushback: 0 },
  };
  for (const entry of list) {
    const at = Number(entry.at);
    const text = String(entry.text ?? '');
    if (!Number.isFinite(at)) continue;
    // 两档强度分开计数：显式否定 vs 质疑式反馈
    const kind = classifyCorrectionKind(text);
    const hit = kind === 'explicit' ? 1 : 0;
    const soft = kind === 'pushback' ? 1 : 0;
    buckets.all.messages += 1;
    buckets.all.corrections += hit;
    buckets.all.pushback += soft;
    if (samples.length < 3 && text !== '' && (hit === 1 || soft === 1)) samples.push(text.slice(0, 40));
    if (at >= recentFrom) {
      buckets.recent.messages += 1;
      buckets.recent.corrections += hit;
      buckets.recent.pushback += soft;
    } else if (at >= previousFrom) {
      buckets.previous.messages += 1;
      buckets.previous.corrections += hit;
      buckets.previous.pushback += soft;
    }
  }
  // 14 天日序列，供前端画柱状图（无消息的天不画柱子）。
  const seriesDays = windowDays * 2;
  const dayBuckets = new Map();
  for (const entry of list) {
    const at = Number(entry.at);
    if (!Number.isFinite(at)) continue;
    const key = dayKey(at);
    const bucket = dayBuckets.get(key) ?? { day: key, messages: 0, corrections: 0, pushback: 0 };
    bucket.messages += 1;
    const kind = classifyCorrectionKind(String(entry.text ?? ''));
    if (kind === 'explicit') bucket.corrections += 1;
    if (kind === 'pushback') bucket.pushback += 1;
    dayBuckets.set(key, bucket);
  }
  const series = [];
  for (let offset = seriesDays - 1; offset >= 0; offset -= 1) {
    const at = now - offset * day;
    const key = dayKey(at);
    const bucket = dayBuckets.get(key) ?? { day: key, messages: 0, corrections: 0, pushback: 0 };
    const feedback = bucket.corrections + bucket.pushback;
    series.push({
      day: key,
      messages: bucket.messages,
      corrections: bucket.corrections,
      pushback: bucket.pushback,
      ratePer100: bucket.messages === 0
        ? null
        : Math.round((bucket.corrections / bucket.messages) * 1000) / 10,
      feedbackPer100: bucket.messages === 0
        ? null
        : Math.round((feedback / bucket.messages) * 1000) / 10,
    });
  }

  const rate = (bucket) =>
    bucket.messages === 0 ? null : Math.round((bucket.corrections / bucket.messages) * 1000) / 10;
  const feedbackRate = (bucket) =>
    bucket.messages === 0 ? null : Math.round(((bucket.corrections + bucket.pushback) / bucket.messages) * 1000) / 10;
  return {
    totalMessages: buckets.all.messages,
    totalCorrections: buckets.all.corrections,
    totalPushback: buckets.all.pushback,
    ratePer100: rate(buckets.all),
    feedbackPer100: feedbackRate(buckets.all),
    // 显式否定的权重更高：它才是"确实做错了"的信号
    recent: { ...buckets.recent, ratePer100: rate(buckets.recent), feedbackPer100: feedbackRate(buckets.recent) },
    previous: { ...buckets.previous, ratePer100: rate(buckets.previous), feedbackPer100: feedbackRate(buckets.previous) },
    windowDays,
    samples,
    series,
  };
}

/**
 * 同一 tool|code 失败在 ≥minSessions 个会话里复现，而对应教训还是 private → 建议推广。
 * 这就是"私有经验该不该变成团队知识"的判据，避免每个会话重新踩坑。
 */
export function findPromotable(lessons, crossSession, { minSessions = 2 } = {}) {
  const list = Array.isArray(crossSession) ? crossSession : [];
  const byKey = new Map();
  for (const entry of list) {
    if (Number(entry.sessions ?? 0) < minSessions) continue;
    byKey.set(String(entry.tool ?? '') + '|' + String(entry.code ?? ''), entry);
  }
  const out = [];
  for (const lesson of Array.isArray(lessons) ? lessons : []) {
    if (String(lesson.sharing ?? 'private') !== 'private') continue;
    const key = String(lesson.tool ?? '') + '|' + String(lesson.code ?? '');
    const hit = byKey.get(key);
    if (hit === undefined) continue;
    out.push({
      id: lesson.id,
      tool: lesson.tool,
      code: lesson.code,
      sessions: Number(hit.sessions ?? 0),
      failures: Number(hit.count ?? 0),
    });
  }
  return out;
}

/**
 * 自动转正的候选：共享范围（非 private）+ 候选状态 + 该 tool|code 已在 ≥minSessions 个会话复现。
 * 注意：**不会**把 private 提升为共享——跨会话共享始终需要人来点头。
 */
export function selectAutoActivatable(lessons, crossSession, { minSessions = 5 } = {}) {
  const keys = new Set(
    (Array.isArray(crossSession) ? crossSession : [])
      .filter((entry) => Number(entry.sessions ?? 0) >= minSessions)
      .map((entry) => String(entry.tool ?? '') + '|' + String(entry.code ?? '')),
  );
  const out = [];
  for (const lesson of Array.isArray(lessons) ? lessons : []) {
    if (String(lesson.status ?? '') !== 'candidate') continue;
    if (String(lesson.sharing ?? 'private') === 'private') continue;
    const key = String(lesson.tool ?? '') + '|' + String(lesson.code ?? '');
    if (!keys.has(key)) continue;
    out.push({ id: lesson.id, tool: lesson.tool, code: lesson.code, sharing: lesson.sharing });
  }
  return out;
}

/**
 * 某个 tool|code 场景被淘汰过几次（只看 retired 记录）。
 * 复活机制用它判断"是否已反复重建"，避免淘汰↔重建死循环。
 */
export function countRetiredForKey(lessons, tool, code) {
  const wantedTool = String(tool ?? '');
  const wantedCode = String(code ?? '');
  if (wantedTool === '') return 0;
  let count = 0;
  for (const record of Array.isArray(lessons) ? lessons : []) {
    if (String(record.status ?? '') !== 'retired') continue;
    if (String(record.kind ?? '') !== 'lesson') continue;
    const meta = record.meta ?? {};
    const text = String(record.text ?? '');
    const match = /当「([^」]+)」遇到「([^」]+)」时/.exec(text);
    const recordTool = String(meta.tool ?? match?.[1] ?? '');
    const recordCode = String(meta.code ?? match?.[2] ?? '');
    if (recordTool !== wantedTool) continue;
    if (recordCode !== wantedCode) continue;
    count += 1;
  }
  return count;
}

/**
 * 按场景（file/command/web/other）汇总失败：次数、不同键数、复发率。
 * sceneOf 由调用方注入，metrics 不关心具体工具清单。
 */
export function summarizeSceneFailures(failures, sceneOf) {
  const map = new Map();
  for (const item of Array.isArray(failures) ? failures : []) {
    const key = String(item?.key ?? '');
    if (key === '') continue;
    const tool = key.split('|')[0] ?? '';
    const scene = typeof sceneOf === 'function' ? String(sceneOf(tool)) : 'other';
    const entry = map.get(scene) ?? { scene, failures: 0, keys: new Map() };
    entry.failures += 1;
    entry.keys.set(key, (entry.keys.get(key) ?? 0) + 1);
    map.set(scene, entry);
  }
  const out = [];
  for (const entry of map.values()) {
    const distinct = entry.keys.size;
    const repeated = [...entry.keys.values()].filter((count) => count >= 2).length;
    out.push({
      scene: entry.scene,
      failures: entry.failures,
      distinct,
      repeated,
      repeatRate: distinct === 0 ? 0 : Math.round((repeated / distinct) * 1000) / 1000,
    });
  }
  return out.sort((a, b) => b.failures - a.failures);
}

/**
 * 场景级"治理前/后"：给定每个场景的首条教训时间，统计之前的失败次数与之后的失败次数。
 * 这是场景版的归因，用于回答"这个场景到底有没有因为学习而变好"。
 */
export function splitSceneBeforeAfter(failures, sceneOf, startByScene) {
  const out = new Map();
  for (const item of Array.isArray(failures) ? failures : []) {
    const key = String(item?.key ?? '');
    if (key === '') continue;
    const tool = key.split('|')[0] ?? '';
    const scene = typeof sceneOf === 'function' ? String(sceneOf(tool)) : 'other';
    const start = Number(startByScene?.get?.(scene));
    const at = Number(item?.at) || 0;
    const entry = out.get(scene) ?? { scene, before: 0, after: 0, lessonFrom: Number.isFinite(start) ? start : 0 };
    if (Number.isFinite(start) && start > 0 && at >= start) entry.after += 1;
    else entry.before += 1;
    out.set(scene, entry);
  }
  return [...out.values()];
}

/**
 * 记忆覆盖率：反复出错的场景里，有多少已经有"活着的"教训。
 * 缺口（holes）就是最该补的地方：高频、无教训。
 */
export function findCoverage(crossSession, lessons, { minCount = 5 } = {}) {
  const covered = new Set();
  for (const lesson of Array.isArray(lessons) ? lessons : []) {
    if (String(lesson.status ?? '') === 'retired') continue;
    covered.add(String(lesson.tool ?? '') + '|' + String(lesson.code ?? ''));
  }
  const holes = [];
  let total = 0;
  let hit = 0;
  for (const entry of Array.isArray(crossSession) ? crossSession : []) {
    if (Number(entry.count ?? 0) < minCount) continue;
    total += 1;
    const key = String(entry.tool ?? '') + '|' + String(entry.code ?? '');
    if (covered.has(key)) {
      hit += 1;
    } else {
      holes.push({ tool: entry.tool, code: entry.code, sessions: entry.sessions, count: entry.count });
    }
  }
  holes.sort((a, b) => b.count - a.count);
  return {
    total,
    covered: hit,
    ratio: total === 0 ? null : Math.round((hit / total) * 1000) / 1000,
    holes: holes.slice(0, 10),
  };
}

/**
 * 指定场景键的按天次数（用于画"复发趋势"）。
 * keys: ['tool|code']；返回 [{ key, points: [{ day, count }] }]，缺数据的天为 0。
 */
export function dailySeriesByKey(failures, keys, { now = Date.now(), days = 14 } = {}) {
  const wanted = new Set((Array.isArray(keys) ? keys : []).map((key) => String(key)));
  const dayMs = 86_400_000;
  const buckets = new Map();
  for (const key of wanted) buckets.set(key, new Map());
  for (const item of Array.isArray(failures) ? failures : []) {
    const key = String(item?.key ?? '');
    const parts = key.split('|');
    const shortKey = parts[0] + '|' + (parts[1] ?? '');
    if (!wanted.has(shortKey)) continue;
    const at = Number(item?.at);
    if (!Number.isFinite(at) || at <= 0) continue;
    const day = dayKey(at);
    const map = buckets.get(shortKey);
    map.set(day, (map.get(day) ?? 0) + 1);
  }
  const out = [];
  for (const [key, map] of buckets.entries()) {
    const points = [];
    for (let offset = days - 1; offset >= 0; offset -= 1) {
      const day = dayKey(now - offset * dayMs);
      points.push({ day, count: map.get(day) ?? 0 });
    }
    out.push({ key, points, total: points.reduce((sum, point) => sum + point.count, 0) });
  }
  return out.sort((a, b) => b.total - a.total);
}

export function aggregateFailures(failures) {
  const map = new Map();
  for (const item of Array.isArray(failures) ? failures : []) {
    const key = String(item?.key ?? '');
    if (key === '') continue;
    const at = Number(item?.at);
    const entry = map.get(key) ?? { key, count: 0, first: at, last: at };
    entry.count += 1;
    if (Number.isFinite(at)) {
      if (!Number.isFinite(entry.first) || at < entry.first) entry.first = at;
      if (!Number.isFinite(entry.last) || at > entry.last) entry.last = at;
    }
    map.set(key, entry);
  }
  const keys = [...map.values()].sort((a, b) => b.count - a.count);
  const total = keys.reduce((sum, entry) => sum + entry.count, 0);
  const repeatedKeys = keys.filter((entry) => entry.count >= 2).length;
  return {
    totalFailures: total,
    distinctKeys: keys.length,
    repeatedKeys,
    repeatRate: keys.length === 0 ? 0 : repeatedKeys / keys.length,
    top: keys.slice(0, 8),
  };
}

/** 指标文件（只本机读写）。 */
export class MetricsFile {
  constructor(dir) {
    this.dir = dir;
    this.file = path.join(dir, FILE);
    this.days = {};
    this.loaded = false;
    this.dirty = false;
  }

  async load() {
    if (this.loaded) return this;
    try {
      const raw = JSON.parse(await fsp.readFile(this.file, 'utf8'));
      this.days = raw?.days ?? {};
    } catch {
      this.days = {};
    }
    this.loaded = true;
    return this;
  }

  async record(delta, now = Date.now()) {
    await this.load();
    const before = JSON.stringify(this.days[dayKey(now)] ?? {});
    this.days = pruneDays(mergeDelta(this.days, delta, dayKey(now)), now);
    const after = JSON.stringify(this.days[dayKey(now)] ?? {});
    if (before !== after) {
      this.dirty = true;
      await this.save();
    }
  }

  async save() {
    if (!this.dirty) return;
    try {
      await fsp.mkdir(this.dir, { recursive: true });
      await fsp.writeFile(this.file, JSON.stringify({ version: 1, updatedAt: Date.now(), days: this.days }), 'utf8');
      this.dirty = false;
    } catch {
      // 指标写失败不影响注入
    }
  }

  summary(now = Date.now()) {
    return {
      series: series(this.days, 14, now),
      compare: compareWindows(this.days, 7, now),
    };
  }
}
