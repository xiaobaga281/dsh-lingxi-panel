/**
 * 灵犀 · 记忆卫生自测
 * 运行：node test-hygiene.mjs
 */
import assert from 'node:assert/strict';
import {
  DECAY_HALF_LIFE_DAYS,
  importanceOf,
  noiseReasons,
  planHygiene,
  usableForInjection,
} from './hygiene.js';

const checks = [];
async function check(name, fn) {
  try {
    await fn();
    checks.push(`  ok  ${name}`);
  } catch (error) {
    checks.push(`  FAIL ${name}: ${error.message}`);
    throw error;
  }
}

const base = {
  text: '当「read」遇到「FS_NOT_FOUND」时：先用 glob 确认路径存在',
  kind: 'lesson',
  status: 'active',
  evidence: 5,
  confidence: 0.8,
  hitCount: 1,
  missCount: 0,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  provenance: [{ source: 'tool-failure' }],
};

await check('噪音识别：问句、占位符、请求句式', async () => {
  assert.deepEqual(noiseReasons({ ...base, kind: 'constraint', text: '不要下载一些其他素材吗？' }), ['question-not-rule']);
  assert.ok(noiseReasons({ ...base, text: '读取文件时路径是 <path> 这种' }).includes('placeholder'));
  assert.ok(noiseReasons({ ...base, kind: 'skill', text: '读取/查看文件：你做个创意广告视频我看看' }).includes('user-request-not-rule'));
  assert.deepEqual(noiseReasons({ ...base, text: '当「read」遇到「FS_NOT_FOUND」时：先用 glob 确认路径存在' }), []);
});

await check('技能必须是做法：无步骤连接词的被标出', async () => {
  assert.ok(noiseReasons({ ...base, kind: 'skill', text: '代码实现：关于灵犀插件你觉得还有什么欠缺' }).includes('not-procedural'));
  assert.ok(noiseReasons({ ...base, kind: 'skill', text: '创建/写入文件：你可以创建团队将数人日的工作量压到今日完成' }).includes('not-procedural'));
  assert.deepEqual(noiseReasons({ ...base, kind: 'skill', text: '常用流程（5 步）：read → edit → read' }), []);
  assert.deepEqual(noiseReasons({ ...base, kind: 'skill', text: '打包/发布：先整理工作区再打包' }), []);
});

await check('只观察一次的流程按一次性路径处理', async () => {
  const once = { ...base, kind: 'skill', text: '常用流程（5 步）：a → b → c', meta: { procedure: true }, evidence: 1 };
  assert.ok(noiseReasons(once).includes('single-observation'));
  const twice = { ...once, evidence: 2 };
  assert.deepEqual(noiseReasons(twice), []);
});

await check('重要度随时间衰减', async () => {
  const now = Date.now();
  const fresh = importanceOf({ ...base, updatedAt: now }, now);
  const old = importanceOf({ ...base, updatedAt: now - DECAY_HALF_LIFE_DAYS * 86_400_000 }, now);
  assert.ok(fresh > old, `fresh=${fresh} old=${old}`);
  assert.ok(old > 0);
});

await check('注入门控：弱候选与噪音不注入，强候选可用', async () => {
  const now = Date.now();
  assert.equal(usableForInjection({ ...base, status: 'candidate', confidence: 0.4, evidence: 1 }, { now }), false);
  assert.equal(usableForInjection({ ...base, status: 'candidate', confidence: 0.8, evidence: 3 }, { now }), true);
  assert.equal(usableForInjection({ ...base, status: 'retired' }, { now }), false);
  assert.equal(usableForInjection({ ...base, kind: 'constraint', text: '要不要现在做？' }, { now }), false);
});

await check('体检计划：可疑隔离、重复合并、过时淘汰', async () => {
  const now = Date.now();
  const records = [
    { ...base, id: 'a', text: '当「read」遇到「FS_NOT_FOUND」时：先用 glob 确认路径存在', hitCount: 0 },
    { ...base, id: 'b', text: '当「read」遇到「FS_NOT_FOUND」时：先用 glob 确认路径存在', evidence: 2, hitCount: 0 },
    { ...base, id: 'c', kind: 'constraint', text: '要不要现在做？', hitCount: 0 },
    {
      ...base,
      id: 'd',
      text: '很久以前的通用建议内容',
      confidence: 0.2,
      evidence: 1,
      hitCount: 0,
      updatedAt: now - 400 * 86_400_000,
      lastUsedAt: now - 400 * 86_400_000,
      provenance: [{ source: 'efficacy-scan' }],
    },
  ];
  const plan = planHygiene(records, { now });
  assert.deepEqual(plan.quarantine.map((item) => item.id), ['c']);
  assert.equal(plan.merge.length, 1);
  assert.deepEqual(plan.merge[0], { keep: 'a', drop: 'b' });
  assert.deepEqual(plan.evict.map((item) => item.id), ['d']);
});


await check('自我纠错：反复被证伪且从未命中的候选被隔离', async () => {
  const now = Date.now();
  const bad = {
    ...base,
    id: 'bad',
    status: 'candidate',
    text: '当「read」遇到「FS_NOT_FOUND」时：先确认参数',
    hitCount: 0,
    missCount: 4,
    confidence: 0.6,
  };
  const used = { ...bad, id: 'used', missCount: 4, hitCount: 2 };
  const plan = planHygiene([bad, used], { now });
  assert.deepEqual(plan.quarantine, [{ id: 'bad', reasons: ['contradicted-by-use'] }]);
});

await check('近似去重：措辞略有差异的同类教训合并', async () => {
  const now = Date.now();
  const a = { ...base, id: 'a', evidence: 5, text: '先用 glob 或列目录确认目标存在，再读取；不要反复重试同一路径' };
  const b = { ...base, id: 'b', evidence: 2, text: '先用 glob 或列目录确认目标存在，再读取；不要反复重试同一路径。' };
  const plan = planHygiene([a, b], { now });
  assert.equal(plan.merge.length, 1);
  assert.deepEqual(plan.merge[0], { keep: 'a', drop: 'b' });
});

await check('自我纠错更保守：3 次证伪不隔离，4 次才隔离', async () => {
  const now = Date.now();
  const three = { ...base, id: 'three', status: 'candidate', hitCount: 0, missCount: 3, confidence: 0.6 };
  assert.equal(planHygiene([three], { now }).quarantine.length, 0);
  const four = { ...three, id: 'four', missCount: 4 };
  assert.equal(planHygiene([four], { now }).quarantine[0].id, 'four');
});

await check('降级：反复证伪且从未命中的生效教训退回候选', async () => {
  const now = Date.now();
  const active = { ...base, id: 'act', status: 'active', hitCount: 0, missCount: 3, confidence: 0.9 };
  const usedOnce = { ...base, id: 'used', status: 'active', hitCount: 1, missCount: 5 };
  const fewMisses = { ...base, id: 'few', status: 'active', hitCount: 0, missCount: 2 };
  const plan = planHygiene([active, usedOnce, fewMisses], { now });
  assert.deepEqual(plan.demote.map((item) => item.id), ['act']);
});

await check('启发式抽取的历史记录视为不可靠', async () => {
  const record = {
    ...base,
    id: 'heur',
    text: '用户消息里提取明确的指令句太片面了',
    provenance: [{ source: 'heuristic-instruction' }],
  };
  assert.ok(noiseReasons(record).includes('unreliable-heuristic'));
  const plan = planHygiene([record], { now: Date.now() });
  assert.deepEqual(plan.quarantine.map((item) => item.id), ['heur']);
});
console.log(checks.join('\n'));
console.log(`\n通过 ${checks.length} 项`);
