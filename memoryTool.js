/**
 * 灵犀 · 模型写记忆（tool-based write path）
 *
 * 为什么不再靠关键词抽规则：正则只能猜"这句话像不像指令"，猜错就会把请求当规则。
 * 业界做法（Mem0/Letta）是把写入交给模型判断，再用 schema 校验落地。
 * 这里把"判断"交给模型，"合法性/隔离/去重"交给本地：
 *   - kind 限定在记忆分型内；
 *   - 文本长度与占位符校验；
 *   - 一律以 private + candidate 落库，跨会话共享必须由人 promote。
 */
export const MEMORY_KINDS = ['constraint', 'preference', 'fact', 'lesson', 'skill'];

export const TOOL_NAME = 'lingxi_remember';

export const TOOL_DESCRIPTION = [
  '把一条**长期有效**的信息写进灵犀记忆库。',
  '只在以下情况使用：用户明确给出的规则/偏好、被纠正后确认的教训、稳定的事实、可复用的做法。',
  '不要记录：一次性的任务细节、猜测、可以从代码里直接读到的内容、用户没有确认的推断。',
  'kind 选择：constraint=硬规则，preference=偏好，fact=环境/项目事实，lesson=踩坑教训，skill=可复用步骤（写成 A → B → C）。',
].join('');

export const TOOL_PARAMETERS = {
  type: 'object',
  properties: {
    kind: {
      type: 'string',
      enum: MEMORY_KINDS,
      description: '记忆类型。',
    },
    text: {
      type: 'string',
      description: '一句话写清楚；技能写成「步骤1 → 步骤2」。不要写占位符或临时路径。',
    },
    sharing: {
      type: 'string',
      enum: ['private', 'workspace', 'global'],
      description: '默认 private（只回本会话）；只有用户说“以后都这样”才考虑 global。',
      default: 'private',
    },
    evidence: {
      type: 'number',
      description: '支持这条记忆的证据次数（用户说过几次/踩坑几次），默认 1。',
    },
  },
  required: ['kind', 'text'],
  additionalProperties: false,
};

export const TOOL_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    action: { type: 'string' },
    id: { type: 'string' },
    status: { type: 'string' },
    text: { type: 'string' },
  },
  required: ['action', 'status'],
  additionalProperties: false,
};

const PLACEHOLDER = /(<path>|<n>|<hex>|TODO|FIXME|\{\{[^}]*\}\})/i;

export function validateMemoryWrite(args) {
  const kind = String(args?.kind ?? '');
  const text = String(args?.text ?? '').trim();
  if (!MEMORY_KINDS.includes(kind)) return { ok: false, error: 'kind 必须是 ' + MEMORY_KINDS.join('/') };
  if (text.length < 4) return { ok: false, error: '文本太短，写清楚一点' };
  if (text.length > 300) return { ok: false, error: '文本太长，压到 300 字以内' };
  if (PLACEHOLDER.test(text)) return { ok: false, error: '不要写占位符或临时路径' };
  if (/[？?]\s*$/.test(text)) return { ok: false, error: '问句不是记忆，请写成结论' };
  const sharing = ['private', 'workspace', 'global'].includes(String(args?.sharing ?? ''))
    ? String(args.sharing)
    : 'private';
  const evidence = Number.isFinite(Number(args?.evidence))
    ? Math.max(1, Math.min(100, Math.round(Number(args.evidence))))
    : 1;
  return { ok: true, value: { kind, text, sharing, evidence } };
}

/**
 * 与 harness 无关的核心：给定 memory 门面与调用上下文，写入并返回可序列化结果。
 * 便于单测，也便于换 transport。
 */
export function createMemoryWriter({ memory }) {
  async function write(args, { sessionId = '', workspaceId = '' } = {}) {
    const checked = validateMemoryWrite(args);
    if (checked.ok === false) {
      return { isError: true, message: checked.error };
    }
    const { kind, text, sharing, evidence } = checked.value;
    const written = await memory.remember({
      kind,
      text,
      scope: { kind: 'machine', id: '' },
      origin: { sessionId, workspaceId },
      sharing,
      status: 'candidate',
      confidence: 0.7,
      evidence,
      topics: ['kind:' + kind, 'source:model-tool'],
      provenance: [{ source: 'model-tool', sessionId, excerpt: text.slice(0, 120) }],
    });
    return {
      isError: false,
      value: {
        action: String(written?.action ?? 'no-op'),
        id: String(written?.record?.id ?? ''),
        status: String(written?.record?.status ?? 'candidate'),
        text,
      },
    };
  }

  return { write };
}

export const TOOL_RECALL_NAME = 'lingxi_recall';

export const TOOL_RECALL_DESCRIPTION = [
  '按主题检索灵犀记忆库（只读）。',
  '用于：需要确认用户以前定过的规则/偏好、同类失败的历史教训、或某个项目的稳定事实时。',
  '返回与查询最相关的记忆条目（已按会话隔离过滤）；没有相关记忆时会明确说没有，不要编造。',
].join('');

export const TOOL_RECALL_PARAMETERS = {
  type: 'object',
  properties: {
    query: { type: 'string', description: '要查的主题或关键词。' },
    limit: { type: 'number', description: '最多返回条数，默认 5，上限 12。' },
  },
  required: ['query'],
  additionalProperties: false,
};

export const TOOL_RECALL_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    abstain: { type: 'boolean' },
    count: { type: 'number' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          kind: { type: 'string' },
          text: { type: 'string' },
          confidence: { type: 'number' },
          sharing: { type: 'string' },
        },
        required: ['kind', 'text'],
        additionalProperties: false,
      },
    },
  },
  required: ['abstain', 'count', 'items'],
  additionalProperties: false,
};

export function createMemoryReader({ memory }) {
  async function read(args, { sessionId = '', workspaceId = '' } = {}) {
    const query = String(args?.query ?? '').trim();
    if (query === '') return { isError: true, message: 'query 不能为空' };
    const limit = Number.isFinite(Number(args?.limit))
      ? Math.max(1, Math.min(12, Math.round(Number(args.limit))))
      : 5;
    const result = await memory.recall(query, {
      limit,
      context: { sessionId, workspaceId },
      charBudget: 1600,
    });
    const items = (result.items ?? []).slice(0, limit).map((entry) => ({
      kind: String(entry.record.kind),
      text: String(entry.record.text),
      confidence: Math.round(Number(entry.record.confidence ?? 0) * 100) / 100,
      sharing: String(entry.record.sharing ?? 'private'),
    }));
    return {
      isError: false,
      value: { abstain: items.length === 0 || result.abstain === true, count: items.length, items },
    };
  }
  return { read };
}
