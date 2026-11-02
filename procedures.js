/**
 * 灵犀 · 程序性记忆（成功流程 → 技能候选）
 *
 * 借鉴 Voyager（技能库）与 Agent Workflow Memory（从轨迹归纳工作流）的最小实现：
 * 只记录**成功**调用的工具序列；同一序列在多次运行里重复出现，才沉淀成技能记忆。
 * 失败会打断序列——失败轨迹不该被当成"流程"。
 */
const WINDOW = 5;
const MIN_REPEAT = 1;

/**
 * 工具序列 → 稳定的模式键：用相邻工具对的无序集合。
 * 这样 read→glob→read 与 glob→read→glob 视为同一类流程（窗口滑动不换键），
 * 同一流程才能累计到重复次数；同时仍区分不同工具的搭配。
 */
export function sequenceKey(tools) {
  const list = (Array.isArray(tools) ? tools : [])
    .map((tool) => String(tool ?? ''))
    .filter((name) => name !== '');
  const pairs = new Set();
  for (let i = 0; i < list.length - 1; i += 1) pairs.add(list[i] + '+' + list[i + 1]);
  return [...pairs].sort().join('|');
}

/** 按文件名给流程起个用途短句，让注入时模型能一眼判断相关性。 */
export function describeSequence(tools) {
  const list = Array.isArray(tools) ? tools.map((tool) => String(tool)) : [];
  if (list.length === 0) return '';
  const first = list[0];
  const chain = list.join(' → ');
  let purpose = '常用流程';
  if (['read', 'glob', 'grep'].includes(first)) purpose = '检索/定位流程';
  else if (['edit', 'write'].includes(first)) purpose = '改写流程';
  else if (['pwsh', 'bash'].includes(first)) purpose = '命令排查流程';
  else if (['web_fetch', 'web_search'].includes(first)) purpose = '联网查证流程';
  return purpose + '（' + list.length + ' 步）：' + chain;
}

/**
 * 追加一步；返回需要沉淀的候选（窗口满时）或 null。
 * 满窗口后保留末尾 overlap 步，让序列可以滑动而不是整段重来。
 */
export function pushStep(sequence, tool, { overlap = 2 } = {}) {
  const list = Array.isArray(sequence) ? sequence : [];
  const next = [...list, String(tool ?? '')].filter((name) => name !== '');
  if (next.length < WINDOW) return { sequence: next, candidate: null };
  const window = next.slice(-WINDOW);
  // 单一工具连刷不算"流程"：至少两种工具才算可复用步骤组合。
  if (new Set(window).size < 2) {
    return { sequence: window.slice(-overlap), candidate: null };
  }
  return {
    sequence: window.slice(-overlap),
    candidate: { tools: window, key: sequenceKey(window), text: describeSequence(window) },
  };
}

/**
 * 是否值得把这条流程沉淀成技能：
 * 必须在 ≥ minSessions 个不同会话里出现过，避免把"一次性调试路径"当成流程。
 * 已经沉淀过的返回 false（后续只加强证据，不重复新增）。
 */
export function shouldCreateProcedure({ sessions, created = false, minSessions = 2 } = {}) {
  if (created === true) return false;
  const distinct = sessions instanceof Set ? sessions.size : Number(sessions ?? 0);
  return Number.isFinite(distinct) && distinct >= Math.max(1, minSessions);
}

export { WINDOW, MIN_REPEAT };
