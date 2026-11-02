/**
 * 灵犀 · 参数进化自测（UCB1）
 * 运行：node test-evolve.mjs
 */
import assert from 'node:assert/strict';
import { createEvolver, fitnessFromDelta } from './evolve.js';

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

await check('初始：默认均衡臂，四组参数可选', async () => {
  const evolver = createEvolver();
  const current = evolver.current();
  assert.equal(current.charBudget, 700);
  assert.equal(current.captureThreshold, 2);
  assert.equal(evolver.snapshot().arms.length, 4);
});

await check('未尝试的臂优先（探索）', async () => {
  const evolver = createEvolver();
  const first = evolver.current();
  evolver.observe({ fitness: 2 });
  const next = evolver.select();
  assert.notEqual(next.armId, first.armId, 'should explore an unseen arm');
  const snap = evolver.snapshot();
  assert.equal(snap.trials, 1);
  const tried = snap.arms.find((arm) => arm.id === first.armId);
  assert.equal(tried.n, 1);
  assert.ok(tried.mean !== null);
});

await check('得分归一到 0..1，正分优于负分', async () => {
  const good = createEvolver();
  const goodReward = good.observe({ fitness: 10 });
  const bad = createEvolver();
  const badReward = bad.observe({ fitness: -10 });
  assert.ok(goodReward > 0.5 && goodReward <= 1);
  assert.ok(badReward < 0.5 && badReward >= 0);
});

await check('多轮后选择偏向均值更高的臂', async () => {
  const evolver = createEvolver();
  // 每轮：选中后按该臂给一个固定的好坏结果，模拟"某组参数更适合当前负载"
  for (let i = 0; i < 60; i += 1) {
    const arm = evolver.current();
    const fitness = arm.charBudget === 400 ? 8 : -2;
    evolver.observe({ fitness });
    evolver.select();
  }
  const snap = evolver.snapshot();
  assert.ok(snap.trials >= 60);
  const lean = snap.arms.find((arm) => arm.id === 'lean');
  const rich = snap.arms.find((arm) => arm.id === 'rich');
  assert.ok(lean.mean > rich.mean, `lean=${lean.mean} rich=${rich.mean}`);
  assert.equal(snap.bestArmId === 'lean' || snap.bestMean >= 0.9, true);
});

await check('恢复：从 trials 重建统计与当前臂', async () => {
  const evolver = createEvolver();
  evolver.observe({ fitness: 3 });
  evolver.select();
  const exported = evolver.exportTrials();
  const restored = createEvolver();
  restored.restore({ trials: exported, current: evolver.current() });
  const snap = restored.snapshot();
  assert.equal(snap.trials, exported.length);
  assert.equal(snap.currentArmId, evolver.current().armId);
});


await check('得分公式：命中得分，证伪与重复失败扣分更重', async () => {
  assert.equal(fitnessFromDelta({ hits: 3 }), 3);
  assert.equal(fitnessFromDelta({ hits: 3, misses: 1 }), 2);
  assert.equal(fitnessFromDelta({ hits: 3, repeatFailures: 1 }), 1);
  assert.equal(fitnessFromDelta({ captured: 2, refined: 2 }), 2);
  assert.equal(fitnessFromDelta({}), 0);
  assert.equal(fitnessFromDelta(undefined), 0);
});

console.log(checks.join('\n'));
console.log(`\n通过 ${checks.length} 项`);
