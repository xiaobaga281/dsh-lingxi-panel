/**
 * 灵犀 · 参数进化（UCB1 多臂老虎机，纯本地）
 *
 * 为什么要它：记忆和纠错本身不会自己变好——注入多少、多严格地捕获，
 * 这组参数直接决定"帮忙"还是"添乱"。业界做法（ExpeL/GEPA 一类的经验优化、
 * AlphaEvolve 式的候选选择）共同点是：**保留候选、用实测结果选**。
 * 这里用一个极小的 UCB1：每期评估当前参数得分，再按"均值 + 探索项"选下一组。
 *
 * 得分由宿主提供（命中 - 证伪 - 2×重复失败 + 捕获/加强小奖励），
 * 这里只负责把得分归一到 [0,1] 并做选择，不碰业务。
 */
const ARMS = [
  { id: 'lean', charBudget: 400, captureThreshold: 2, label: '轻注入·快捕获' },
  { id: 'balanced', charBudget: 700, captureThreshold: 2, label: '均衡（默认）' },
  { id: 'rich', charBudget: 1200, captureThreshold: 2, label: '重注入·快捕获' },
  { id: 'strict', charBudget: 700, captureThreshold: 3, label: '均衡·慢捕获' },
];

const EXPLORE = 1.2;

function armOf(value) {
  const byId = ARMS.find((arm) => arm.id === value);
  if (byId !== undefined) return byId;
  const byShape = ARMS.find(
    (arm) => arm.charBudget === value?.charBudget && arm.captureThreshold === value?.captureThreshold,
  );
  return byShape ?? ARMS[1];
}

/**
 * 一期得分：命中奖励、证伪惩罚（更重）、重复失败双倍惩罚，
 * 捕获/加强只是小奖励（鼓励真正沉淀而不是刷数量）。
 */
export function fitnessFromDelta(delta) {
  const num = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);
  return (
    num(delta?.hits) -
    num(delta?.misses) -
    2 * num(delta?.repeatFailures) +
    0.5 * num(delta?.captured) +
    0.5 * num(delta?.refined) +
    0.5 * num(delta?.warnEffective) -
    0.5 * num(delta?.warnIneffective) +
    0.5 * num(delta?.guardEffective) -
    0.5 * num(delta?.guardIneffective)
  );
}

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x / 3));
}

export function createEvolver(options = {}) {
  const maxTrials = Number.isFinite(options.maxTrials) ? options.maxTrials : 200;
  /** id → { n, sum, last } */
  const stats = new Map(ARMS.map((arm) => [arm.id, { n: 0, sum: 0, last: null }]));
  let currentArm = ARMS[1];
  let trials = 0;
  let history = [];

  function restore(data = {}) {
    if (Array.isArray(data.trials)) {
      for (const trial of data.trials.slice(-maxTrials)) {
        if (trial === null || trial === undefined) continue;
        const arm = armOf(trial);
        const entry = stats.get(arm.id);
        if (entry === undefined) continue;
        const reward = Number(trial.reward);
        if (!Number.isFinite(reward)) continue;
        entry.n += 1;
        entry.sum += reward;
        entry.last = reward;
        trials += 1;
        history.push({ arm: arm.id, reward, at: Number(trial.at) || 0 });
      }
      if (history.length > maxTrials) history = history.slice(-maxTrials);
    }
    if (data.current !== undefined && data.current !== null) currentArm = armOf(data.current);
    return snapshot();
  }

  function current() {
    return { charBudget: currentArm.charBudget, captureThreshold: currentArm.captureThreshold, armId: currentArm.id };
  }

  /** 记录一期实测结果。fitness 是原始得分，内部归一。 */
  function observe({ fitness, at = Date.now() } = {}) {
    const reward = sigmoid(Number(fitness) || 0);
    const entry = stats.get(currentArm.id);
    entry.n += 1;
    entry.sum += reward;
    entry.last = reward;
    trials += 1;
    history.push({ arm: currentArm.id, reward, at });
    if (history.length > maxTrials) history = history.slice(-maxTrials);
    return reward;
  }

  /** UCB1：没试过的先试，之后选 均值 + c·sqrt(ln N / n)。 */
  function select() {
    let best = null;
    let bestScore = -Infinity;
    const total = trials;
    for (const arm of ARMS) {
      const entry = stats.get(arm.id);
      const score = entry.n === 0
        ? Number.POSITIVE_INFINITY
        : entry.sum / entry.n + EXPLORE * Math.sqrt(Math.log(Math.max(1, total)) / entry.n);
      if (score > bestScore) {
        bestScore = score;
        best = arm;
      }
    }
    currentArm = best ?? ARMS[1];
    return { charBudget: currentArm.charBudget, captureThreshold: currentArm.captureThreshold, armId: currentArm.id };
  }

  function snapshot() {
    const arms = ARMS.map((arm) => {
      const entry = stats.get(arm.id);
      return {
        id: arm.id,
        label: arm.label,
        charBudget: arm.charBudget,
        captureThreshold: arm.captureThreshold,
        n: entry.n,
        mean: entry.n === 0 ? null : Math.round((entry.sum / entry.n) * 1000) / 1000,
        last: entry.last === null ? null : Math.round(entry.last * 1000) / 1000,
      };
    });
    const scored = arms.filter((arm) => arm.n > 0 && arm.mean !== null);
    const best = scored.sort((a, b) => b.mean - a.mean)[0] ?? null;
    return {
      arms,
      trials,
      currentArmId: currentArm.id,
      bestArmId: best?.id ?? null,
      bestMean: best?.mean ?? null,
      history: history.slice(-20),
    };
  }

  function exportTrials() {
    return history.map((entry) => ({ arm: entry.arm, reward: entry.reward, at: entry.at }));
  }

  return { restore, current, observe, select, snapshot, exportTrials };
}
