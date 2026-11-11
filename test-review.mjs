/**
 * 复盘模块测试：模型审查记忆时，解析与防错必须有确定性。
 */
import assert from 'node:assert/strict';
import { createReviewer } from './review.js';

const checks = [];
const check = (name, fn) => {
  try {
    fn();
    checks.push('  ok  ' + name);
  } catch (error) {
    checks.push('  FAIL ' + name + ' :: ' + error.message);
    process.exitCode = 1;
  }
};
const checkAsync = async (name, fn) => {
  try {
    await fn();
    checks.push('  ok  ' + name);
  } catch (error) {
    checks.push('  FAIL ' + name + ' :: ' + error.message);
    process.exitCode = 1;
  }
};

const makeReviewer = (reply) => createReviewer({
  ctx: null,
  settingsRef: () => ({ semantic: true }),
  semantic: { completeRaw: async () => reply },
});

await checkAsync('复盘：能从 markdown 代码块里抠出 JSON', async () => {
  const r = makeReviewer('结果：\n```json\n[{"id":"a","verdict":"drop","reason":"无用"}]\n```');
  const out = await r.review([{ id: 'a', kind: 'skill', text: '通用流程' }]);
  assert.equal(out.verdicts.length, 1);
  assert.equal(out.verdicts[0].verdict, 'drop');
});

await checkAsync('复盘：剔除模型编造的 id', async () => {
  const r = makeReviewer('[{"id":"real","verdict":"keep","reason":"x"},{"id":"FAKE","verdict":"drop","reason":"y"}]');
  const out = await r.review([{ id: 'real', kind: 'lesson', text: '具体知识' }]);
  assert.equal(out.verdicts.length, 1);
  assert.equal(out.verdicts[0].id, 'real');
});

await checkAsync('复盘：非法 verdict 与非法 kind 被拒绝', async () => {
  const r = makeReviewer('[{"id":"a","verdict":"maybe"},{"id":"b","verdict":"reclass","kind":"nonsense"}]');
  const out = await r.review([{ id: 'a', text: 'x' }, { id: 'b', text: 'y' }]);
  // a 的 verdict 非法被丢；b 的 kind 非法则清空但保留 reclass 判定
  assert.equal(out.verdicts.length, 1);
  assert.equal(out.verdicts[0].id, 'b');
  assert.equal(out.verdicts[0].kind, '');
});

await checkAsync('复盘：模型返回空则报错且不产生裁决', async () => {
  const r = makeReviewer('');
  const out = await r.review([{ id: 'a', text: 'x' }]);
  assert.equal(out.verdicts.length, 0);
  assert.equal(out.ok, false);
  assert.ok(out.error.includes('empty-reply'));
});

await checkAsync('复盘：垃圾输出不崩溃', async () => {
  const r = makeReviewer('我无法完成这个任务。');
  const out = await r.review([{ id: 'a', text: 'x' }]);
  assert.equal(out.verdicts.length, 0);
});

await checkAsync('复盘：不把命中率等数字喂给模型（避免被使用次数影响判断）', async () => {
  let captured = '';
  const r = createReviewer({
    ctx: null,
    settingsRef: () => ({ semantic: true }),
    semantic: { completeRaw: async (s, u) => { captured = u; return '[]'; } },
  });
  await r.review([{ id: 'a', kind: 'lesson', text: '内容', hitCount: 999, hit: 999, exposures: 1000 }]);
  assert.equal(/hitCount|exposures|命中/.test(captured), false, 'prompt must not leak usage numbers');
});


await checkAsync('复盘不受语义召回开关约束（可独立选模型）', async () => {
  const { createSemantic } = await import('./semantic.js');
  const llm = {
    listProviders: () => [{ id: 'p' }],
    stream: () => (async function* () { yield { type: 'text-delta', text: '[]' }; })(),
  };
  const ctx = {
    get: (n) => n === 'llm' ? llm
      : n === 'agentDefaultModel' ? { currentSelection: () => ({ provider: 'p', model: 'm' }) }
      : undefined,
  };
  // 语义召回关闭，且未选任何模型 → 跟随默认
  const settings = { semantic: false, semanticModel: null, reviewModel: null };
  const sem = createSemantic({ ctx, settingsRef: () => settings });

  // 1) 语义路径被开关挡住
  const blocked = await sem.completeRaw('s', 'u');
  assert.equal(blocked, '', 'semantic path blocked while disabled');

  // 2) 复盘路径仍可用（这是本次修复的核心）
  const viaReview = await sem.completeRaw('s', 'u', { kind: 'review', requireEnabled: false });
  assert.ok(viaReview !== '', 'review must work with semantic disabled');

  // 3) 复盘记账进自己的桶，不污染语义统计（否则会误触发"语义不可用"告警）
  const rs = sem.reviewSnapshot();
  const ss = sem.snapshot();
  assert.equal(rs.calls, 1, 'review call recorded: ' + rs.calls);
  assert.equal(ss.calls, 0, 'semantic stats not polluted: ' + ss.calls);
  assert.equal(ss.consecutiveFailures, 0, 'no false semantic failure');
});

await checkAsync('复盘可指定自己的模型（reviewModel 优先于默认）', async () => {
  const { createSemantic } = await import('./semantic.js');
  let used = null;
  const llm = {
    listProviders: () => [{ id: 'picked-provider' }],
    stream: (opts) => {
      used = opts.provider + '/' + opts.model;
      return (async function* () { yield { type: 'text-delta', text: '[]' }; })();
    },
  };
  const ctx = {
    get: (n) => n === 'llm' ? llm
      : n === 'agentDefaultModel' ? { currentSelection: () => ({ provider: 'default-p', model: 'default-m' }) }
      : undefined,
  };
  const settings = {
    semantic: false,
    semanticModel: { provider: 'sem-p', model: 'sem-m' },
    reviewModel: { provider: 'picked-provider', model: 'review-m' },
  };
  const sem = createSemantic({ ctx, settingsRef: () => settings });
  await sem.completeRaw('s', 'u', { kind: 'review', requireEnabled: false });
  assert.equal(used, 'picked-provider/review-m', 'review must use its own model, got: ' + used);
});

await checkAsync('复盘进度回调：按批回报，结束时到总数', async () => {
  const { createReviewer } = await import('./review.js');
  const seen = [];
  const r = createReviewer({
    ctx: null,
    settingsRef: () => ({ semantic: true }),
    semantic: { completeRaw: async () => '[{"id":"x","verdict":"keep","reason":"r"}]' },
  });
  const items = Array.from({ length: 25 }, (_, i) => ({ id: 'm' + i, kind: 'lesson', text: 't' + i }));
  await r.review(items, { batchSize: 12, onProgress: (done, total) => seen.push([done, total]) });
  assert.ok(seen.length >= 2, 'progress reported per batch: ' + JSON.stringify(seen));
  // 每次回报的 total 必须是全集大小，而不是批次大小
  assert.ok(seen.every(([, total]) => total === 25), 'total is the whole set: ' + JSON.stringify(seen));
  assert.equal(seen[seen.length - 1][0], 25, 'final progress reaches total');
});

await checkAsync('进度回调抛错不影响复盘结果', async () => {
  const { createReviewer } = await import('./review.js');
  const r = createReviewer({
    ctx: null,
    settingsRef: () => ({ semantic: true }),
    semantic: { completeRaw: async () => '[{"id":"a","verdict":"drop","reason":"r"}]' },
  });
  const out = await r.review([{ id: 'a', kind: 'skill', text: 'x' }], {
    onProgress: () => { throw new Error('boom'); },
  });
  assert.equal(out.verdicts.length, 1, 'verdicts still produced');
  assert.equal(out.verdicts[0].verdict, 'drop');
});
console.log(checks.join('\n'));
const failed = checks.filter((line) => line.includes('FAIL')).length;
console.log(failed === 0 ? '通过 ' + checks.length + ' 项' : '失败 ' + failed + ' 项');
if (failed > 0) process.exit(1);
