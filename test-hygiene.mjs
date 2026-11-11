/**
 * 灵犀 · 记忆卫生自测
 * 运行：node test-hygiene.mjs
 */
import assert from 'node:assert/strict';
import {
  DECAY_HALF_LIFE_DAYS,
  importanceOf,
  isDerivable,
  scarcityOf,
  noiseReasons,
  planHygiene,
  usableForInjection,
} from './hygiene.js';

import { checks, check, report } from './test-helpers.mjs';

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

await check('降级：按相关命中率降级，样本不足或命中率达标的不动', async () => {
  const now = Date.now();
  // 命中率 0/13=0% < 30%，样本 13 ≥ 10 → 降级
  const active = { ...base, id: 'act', status: 'active', hitCount: 0, missCount: 13, confidence: 0.9 };
  // 命中率 10/26 ≈ 38% ≥ 30% → 不降（高曝光场景 miss 多是正常的）
  const healthy = { ...base, id: 'healthy', status: 'active', hitCount: 10, missCount: 16, confidence: 0.9 };
  // 样本 5 < 10 → 不降
  const fewSamples = { ...base, id: 'few', status: 'active', hitCount: 0, missCount: 5 };
  const plan = planHygiene([active, healthy, fewSamples], { now });
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

await check('优胜：反复验证有效的经验获得重要度加成且不被淘汰', async () => {
  const now = Date.now();
  // 15 天半衰期下用 10 天未用：衰减后仍可分辨 proven 加成（200 天会归零，比较无意义）
  const stale = now - 10 * 86_400_000;
  // 同条件（陈旧、零命中）下唯一区别是"被验证过"
  const proven = { ...base, id: "proven", status: "active", hitCount: 10, missCount: 1, exposures: 12, evidence: 5, confidence: 0.9, lastUsedAt: stale };
  const plain = { ...base, id: "plain", status: "active", hitCount: 0, missCount: 0, exposures: 12, evidence: 5, confidence: 0.9, lastUsedAt: stale };
  const impProven = importanceOf(proven, now);
  const impPlain = importanceOf(plain, now);
  assert.ok(impProven > impPlain, "proven should outrank plain: " + impProven + " vs " + impPlain);
  const plan = planHygiene([proven, plain], { now });
  const evicted = plan.evict.map((item) => item.id);
  assert.equal(evicted.includes("proven"), false, "proven must survive evict");
});

await check('相对淘汰：同场景超过 2 条时保留最重要的', async () => {
  const now = Date.now();
  const mk = (id, ev) => ({ ...base, id, status: "active", kind: "lesson", text: "当「read」遇到「FS_NOT_FOUND」时：先确认路径", evidence: ev, hitCount: 0, missCount: 0, confidence: 0.8, lastUsedAt: now - 86_400_000 });
  const plan = planHygiene([mk("a", 5), mk("b", 4), mk("c", 3), mk("d", 1)], { now });
  const demoted = plan.demote.map((item) => item.id);
  assert.equal(demoted.includes("a"), false, "top record kept");
  assert.equal(demoted.includes("b"), false, "second record kept");
  assert.ok(demoted.length >= 2, "crowded scene demotes the rest: " + JSON.stringify(demoted));
});

await check('衰减：半衰期 15 天，且 proven 不延长衰减', async () => {
  const now = Date.now();
  const day = 86_400_000;
  const mk = (id, days, hits, exposures) => ({ ...base, id, kind: 'lesson', text: '当「read」遇到「FS_NOT_FOUND」时：先确认路径', evidence: 5, confidence: 0.9, hitCount: hits, missCount: 0, exposures, lastUsedAt: now - days * day, updatedAt: now - days * day });
  assert.equal(DECAY_HALF_LIFE_DAYS, 15, 'half life must be 15 days (one model-capability generation)');
  const fresh = importanceOf(mk('a', 0, 10, 12), now);
  const half = importanceOf(mk('b', 15, 10, 12), now);
  // 60 天后应接近减半（允许 proven 加成带来的偏差）
  assert.ok(half < fresh * 0.75, 'after one half-life: ' + half + ' vs ' + fresh);
  // proven 与普通同条件衰减速率一致（不延长）
  const provenRatio = importanceOf(mk('p', 15, 10, 12), now) - 0.12;
  const plainRatio = importanceOf(mk('q', 15, 0, 12), now);
  assert.ok(Math.abs(provenRatio - plainRatio) < 0.15, 'decay must be identical: ' + provenRatio + ' vs ' + plainRatio);
});

await check('稀缺度：通用流程下沉，含具体知识的上浮（只调排序不删除）', async () => {
  const generic = { text: '改写流程（5 步）：write → pwsh → write → pwsh → write' };
  const generic2 = { text: '先确认路径再重试' };
  const withCode = { text: '当「read」遇到「FS_NOT_FOUND」时：先用 glob 确认目标存在' };
  const withPath = { text: '存储在 C:\\Users\\x\\.dsh\\lingxi-memory' };
  const withModel = { text: '语义模型用 trae/deepseek-v4.1-flash' };
  assert.ok(scarcityOf(generic) <= 0.55, 'pure tool sequence sinks: ' + scarcityOf(generic));
  assert.ok(scarcityOf(generic2) <= 0.55, 'generic advice sinks: ' + scarcityOf(generic2));
  assert.ok(scarcityOf(withCode) > 0.55, 'error code counts as knowledge: ' + scarcityOf(withCode));
  assert.ok(scarcityOf(withPath) >= 1.0, 'path is specific: ' + scarcityOf(withPath));
  assert.ok(scarcityOf(withModel) >= 1.0, 'model name is specific: ' + scarcityOf(withModel));
  // 中文边界：错误码夹在「」里也必须识别（\\b 在 CJK 上不成立）
  assert.ok(isDerivable(generic) === true, 'derivable flag');
  assert.ok(isDerivable(withCode) === false, 'error-code lesson is NOT derivable');
});

await check('约束与偏好永不判为可推导（那是用户的意志，不是可推导常识）', async () => {
  // 措辞极通用，但 kind 是 constraint/preference → 不下沉
  assert.equal(scarcityOf({ text: '先确认再动手', kind: 'constraint' }), 1.0, 'generic constraint stays at baseline');
  assert.equal(scarcityOf({ text: '不要重复劳动', kind: 'preference' }), 1.0, 'generic preference stays at baseline');
  assert.equal(isDerivable({ text: '先确认再动手', kind: 'constraint' }), false, 'constraint never derivable');
  // 同样措辞换成 lesson → 下沉
  assert.ok(scarcityOf({ text: '先确认再动手', kind: 'lesson' }) <= 0.55, 'same words as lesson sink');
  // 含具体错误码的 lesson 不下沉（FS 只有两个字符，曾因量词写错漏判）
  const coded = { text: '当「read」遇到「FS_NOT_FOUND」时：先用 glob 确认目标存在', kind: 'lesson' };
  assert.ok(scarcityOf(coded) >= 1.0, 'two-char prefix error code counts: ' + scarcityOf(coded));
  // 约束即使含错误码也只是更高，不会下沉
  assert.ok(scarcityOf({ text: '遇到 FS_NOT_FOUND 必须先 glob 确认', kind: 'constraint' }) >= 1.0, 'coded constraint');
});
report();
