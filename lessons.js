/**
 * 灵犀 · 教训文案（本地规则，无模型调用）
 *
 * 自动捕获最容易变成"正确的废话"：同一句"先确认参数与前置条件"套在所有错误上，
 * 模型看完还是不知道下一步该做什么。这里按错误码给出**可执行动作**，
 * 没有匹配的码才退回通用文案。
 */
const REMEDIES = [
  {
    match: ['FS_NOT_FOUND', 'ENOENT', 'NOT_FOUND', 'not found'],
    action: '先用 glob 或列目录确认目标存在，再读取；不要反复重试同一路径',
    verify: '路径拼写、工作区根目录、大小写',
  },
  {
    match: ['FS_STALE_VERSION'],
    action: '写之前先 read 一次当前内容，再 edit，避免版本过期',
    verify: '文件是否在别处被改过',
  },
  {
    match: ['FS_NOT_OBSERVED'],
    action: '先 read 目标文件再编辑（读后写），不要凭记忆直接改',
    verify: '是否本轮读过该文件',
  },
  {
    match: ['EACCES', 'EPERM', 'PERMISSION'],
    action: '先检查权限与文件占用，必要时换可写目录或先关闭占用方',
    verify: '只读属性、进程占用、目录权限',
  },
  {
    match: ['TOOL_TIMEOUT', 'TIMEOUT', 'ETIMEDOUT'],
    action: '缩小单次输入或分批执行，再重试',
    verify: '输入规模、外部服务是否可用',
  },
  {
    match: ['WEB_PROVIDER_ERROR', 'WEB_REDIRECT_BLOCKED'],
    action: '换更短更具体的检索词或换来源，避免对同一查询反复重试',
    verify: '查询长度、来源是否可达',
  },
  {
    match: ['SEARCH_FAILED'],
    action: '先确认搜索根目录与模式（glob 语法/正则）再检索',
    verify: '工作区根、模式是否合法',
  },
  {
    match: ['FS_EXISTS'],
    action: '目标已存在：先读取再决定覆盖或换名，不要直接写入',
    verify: '是否应当覆盖',
  },
];

const GENERIC = {
  action: '先确认参数与前置条件（路径、权限、依赖、目标是否存在），再执行，不要直接重试',
  verify: '输入参数、前置条件',
};

export function remedyFor(code) {
  const value = String(code ?? '').toLowerCase();
  if (value === '') return GENERIC;
  for (const remedy of REMEDIES) {
    if (remedy.match.some((needle) => value.includes(String(needle).toLowerCase()))) return remedy;
  }
  return GENERIC;
}

/**
 * 生成一条可执行的教训。detail 是规范化后的错误细节（可能含 <path>/<n>），
 * 会被截短以免把易变内容写进长期记忆。
 */
export function lessonTextFor({ tool, code, detail = '' }) {
  const name = String(tool ?? 'tool');
  const remedy = remedyFor(code);
  const label = String(code ?? '') !== '' ? String(code) : '反复失败';
  const tail = detail === '' ? '' : '（最近一次：' + String(detail).slice(0, 60) + '）';
  return '当「' + name + '」遇到「' + label + '」时：' + remedy.action + '；先核对' + remedy.verify + '，再重试。' + tail;
}

const KNOWN_TOOLS = [
  'read', 'write', 'edit', 'glob', 'grep', 'lsp',
  'pwsh', 'bash', 'terminal_open', 'terminal_read',
  'web_fetch', 'web_search', 'skill', 'subagent', 'workflow', 'present',
];

/**
 * 从一条教训文本里推断工具与错误码，用于回填旧记录的 meta。
 * 只在确实出现已知工具名时返回，避免瞎猜污染统计。
 */
export function inferToolMeta(text) {
  const value = String(text ?? '');
  const lower = value.toLowerCase();
  let tool = '';
  for (const name of KNOWN_TOOLS) {
    if (tool === '') {
      if (lower.includes(name)) tool = name;
    }
  }
  // 错误码：全大写蛇形标识（FS_NOT_FOUND、EACCES、WEB_PROVIDER_ERROR…）
  const codeMatch = /\b([A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+)\b/.exec(value);
  const code = codeMatch === null ? '' : codeMatch[1];
  if (tool === '') return null;
  return { tool, code };
}

/** 只取动作句，供工具守卫的拒绝理由使用。 */
export function remedyActionFor(code) {
  return remedyFor(code).action;
}

/** 该错误码是否有明确动作（不是通用兜底）。 */
export function remedyIsSpecific(code) {
  const remedy = remedyFor(code);
  return remedy !== GENERIC;
}

/** 提示之后"理想的下一步工具"：用来衡量建议是否被采纳，而不是只看有没有命中记忆。 */
const EXPECTED_TOOLS = {
  FS_NOT_FOUND: ['glob', 'read', 'bash', 'pwsh'],
  FS_STALE_VERSION: ['read'],
  FS_NOT_OBSERVED: ['read'],
  SEARCH_FAILED: ['glob', 'grep', 'bash', 'pwsh'],
  TOOL_TIMEOUT: ['web_fetch', 'pwsh'],
  WEB_PROVIDER_ERROR: ['web_fetch', 'web_search'],
  WEB_REDIRECT_BLOCKED: ['web_fetch', 'web_search'],
  EACCES: ['pwsh', 'bash'],
};

/**
 * 自学习覆盖表：某错误码的建议被持续无视时，把"模型实际会用的工具"并入期望表。
 * 持久化在记忆目录 meta.adoption，重启不丢。
 */
const EXPECTED_OVERRIDES = new Map();

export function applyAdoptionOverrides(overrides) {
  for (const [code, tools] of Object.entries(overrides ?? {})) {
    if (code === '' || !Array.isArray(tools) || tools.length === 0) continue;
    EXPECTED_OVERRIDES.set(code, tools.filter((tool) => typeof tool === 'string' && tool !== ''));
  }
}

export function adoptionOverrides() {
  return Object.fromEntries(EXPECTED_OVERRIDES.entries());
}


export function expectedToolsFor(code) {
  const key = String(code ?? '');
  const override = EXPECTED_OVERRIDES.get(key);
  if (override !== undefined && override.length > 0) return override;
  const list = EXPECTED_TOOLS[key];
  return Array.isArray(list) ? list : [];
}

