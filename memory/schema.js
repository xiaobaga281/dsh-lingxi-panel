/**
 * 灵犀记忆库 · 记录模型
 *
 * 一条记忆不是一句聊天摘录，而是一条「可复用、可溯源、可衰减、可冲突」的断言。
 * 字段设计对齐业界记忆系统（Mem0 / Zep / A-MEM / Letta）的公共部分：
 *   - kind        分型：约束、偏好、事实、教训、技能、情景、策略
 *   - scope       作用域：机器 / 工作区 / 项目 / 会话
 *   - text        自包含的规范化陈述（换一个会话也能读懂）
 *   - topics      归一化检索键（tool:xxx、scene:xxx），用于精确命中与合并
 *   - provenance  证据链：谁产生、哪次会话、第几事件
 *   - confidence  置信度 0..1；evidence / contradictions 为支持与反对计数
 *   - status      candidate（待确认）/ active / dormant（休眠）/ retired（退休）
 *   - halfLifeDays 半衰期：越久未被使用，有效置信度越低
 *   - links       记录间关系：supports / contradicts / refines / derived-from
 */
import { createHash } from 'node:crypto';

export const SCHEMA_VERSION = 2;

export const KINDS = ['constraint', 'preference', 'fact', 'lesson', 'skill', 'episode', 'strategy'];
export const STATUSES = ['candidate', 'active', 'dormant', 'retired'];
export const SCOPE_KINDS = ['machine', 'workspace', 'project', 'session'];
export const LINK_TYPES = ['supports', 'contradicts', 'refines', 'derived-from'];

/** 各类记忆的默认半衰期（天）。越"硬"的事实衰减越慢。 */
export const HALF_LIFE_DAYS = {
  constraint: 180,
  preference: 90,
  fact: 120,
  lesson: 60,
  skill: 90,
  episode: 21,
  strategy: 45,
};

/** 每类记忆允许的最高置信度：情景记忆永远不该和用户明确约束一样硬。 */
export const CONFIDENCE_CEILING = {
  constraint: 0.99,
  preference: 0.95,
  fact: 0.9,
  lesson: 0.9,
  skill: 0.92,
  episode: 0.6,
  strategy: 0.8,
};

const DIGEST_LIMIT = 8;

export function nowMs() {
  return Date.now();
}

export function clamp01(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

/**
 * 稳定的记录 id：同一 kind+scope+normalized text 永远得到同一个 id，天然去重。
 * partition 把私有/工作区记录隔离开：同一句话分别从两个会话学到，
 * 必须得到两个 id，否则后写入的会覆盖前一个，直接造成跨会话串门。
 */
export function recordId(kind, scopeKind, scopeId, text, partition = '') {
  const digest = createHash('sha256')
    .update(`${kind}\u0000${scopeKind}\u0000${scopeId}\u0000${partition}\u0000${normalizeText(text)}`)
    .digest('hex');
  return `mem_${digest.slice(0, 24)}`;
}

/** 私有记录按来源会话分区，工作区记录按来源工作区分区，全局记录不分区。 */
export function partitionOf(sharing, origin) {
  if (sharing === 'private') return `s:${origin?.sessionId ?? ''}`;
  if (sharing === 'workspace') return `w:${origin?.workspaceId ?? ''}`;
  return '';
}

/** 两条记录是否处在同一个可见性分区（跨分区既不能合并，也不能互相消解矛盾）。 */
export function samePartition(a, b) {
  return partitionOf(a.sharing ?? 'private', a.origin) === partitionOf(b.sharing ?? 'private', b.origin);
}

export function normalizeText(text) {
  return String(text ?? '')
    .replace(/[\u3000\s]+/g, ' ')
    .replace(/[，。；！？、,.!?;:："'“”‘’()（）\[\]【】]/g, '')
    .trim()
    .toLowerCase();
}

export function normalizeScope(scope) {
  const kind = SCOPE_KINDS.includes(scope?.kind) ? scope.kind : 'machine';
  const id = kind === 'machine' ? '' : String(scope?.id ?? '').slice(0, 128);
  return { kind, id };
}

export function normalizeTopics(topics) {
  const seen = new Set();
  const out = [];
  for (const raw of Array.isArray(topics) ? topics : []) {
    const topic = String(raw ?? '').trim().slice(0, 64);
    if (topic === '' || seen.has(topic)) continue;
    seen.add(topic);
    out.push(topic);
    if (out.length >= DIGEST_LIMIT) break;
  }
  return out;
}

export function normalizeProvenance(provenance) {
  const list = Array.isArray(provenance) ? provenance : [];
  return list
    .slice(-12)
    .map((entry) => ({
      source: String(entry?.source ?? 'unknown').slice(0, 32),
      sessionId: String(entry?.sessionId ?? '').slice(0, 128),
      seq: Number.isFinite(entry?.seq) ? Number(entry.seq) : null,
      at: Number.isFinite(entry?.at) ? Number(entry.at) : nowMs(),
      excerpt: String(entry?.excerpt ?? '').replace(/\s+/g, ' ').slice(0, 200),
    }))
    .filter((entry) => entry.excerpt !== '' || entry.sessionId !== '' || entry.source !== 'unknown');
}

/** 造一条新记录（不做去重，去重由 store 负责）。 */
export function createRecord(input) {
  const kind = KINDS.includes(input?.kind) ? input.kind : 'fact';
  const scope = normalizeScope(input?.scope);
  const text = String(input?.text ?? '').replace(/\s+/g, ' ').trim();
  const at = Number.isFinite(input?.at) ? Number(input.at) : nowMs();
  const halfLifeDays = Number.isFinite(input?.halfLifeDays)
    ? Math.max(1, Number(input.halfLifeDays))
    : HALF_LIFE_DAYS[kind];
  // 先定可见性分区，再算 id：否则两个会话的同一句话会撞成一条记录。
  const origin = normalizeOrigin(input?.origin ?? input?.context, scope);
  const sharing = normalizeSharing(input?.sharing, origin);
  const partition = partitionOf(sharing, origin);
  return {
    id: input?.id !== undefined && String(input.id).startsWith('mem_')
      ? String(input.id)
      : recordId(kind, scope.kind, scope.id, text, partition),
    schemaVersion: SCHEMA_VERSION,
    kind,
    text,
    scope,
    topics: normalizeTopics(input?.topics),
    provenance: normalizeProvenance(input?.provenance),
    confidence: clamp01(input?.confidence ?? 0.5),
    evidence: Math.max(0, Number(input?.evidence ?? 1) || 0),
    contradictions: Math.max(0, Number(input?.contradictions ?? 0) || 0),
    status: STATUSES.includes(input?.status) ? input.status : 'candidate',
    createdAt: Number.isFinite(input?.createdAt) ? Number(input.createdAt) : at,
    updatedAt: at,
    lastUsedAt: Number.isFinite(input?.lastUsedAt) ? Number(input.lastUsedAt) : 0,
    usedCount: Math.max(0, Number(input?.usedCount ?? 0) || 0),
    exposures: Math.max(0, Number(input?.exposures ?? 0) || 0),
    hitCount: Math.max(0, Number(input?.hitCount ?? 0) || 0),
    missCount: Math.max(0, Number(input?.missCount ?? 0) || 0),
    // 双时态：validFrom/validTo 是"世界时间"（这条断言何时成立），ingestAt 是"入库时间"。
    // 知识更新时旧记录不删除，只把 validTo 闭合，供时间推理与审计回溯。
    validFrom: Number.isFinite(input?.validFrom) ? Number(input.validFrom) : at,
    validTo: Number.isFinite(input?.validTo) ? Number(input.validTo) : null,
    ingestAt: Number.isFinite(input?.ingestAt) ? Number(input.ingestAt) : at,
    supersedesId: typeof input?.supersedesId === 'string' ? input.supersedesId : null,
    pii: input?.pii === true,
    // 会话隔离：origin 记录"从哪个会话/工作区学到的"，sharing 决定它能被哪些会话看到。
    // 默认值刻意最保守：有来源会话就是 private（只回原会话），只有显式提升才允许跨会话。
    origin,
    sharing,
    halfLifeDays,
    links: Array.isArray(input?.links)
      ? input.links
          .filter((link) => LINK_TYPES.includes(link?.type) && typeof link?.to === 'string')
          .slice(0, 24)
          .map((link) => ({ to: link.to, type: link.type }))
      : [],
    meta: typeof input?.meta === 'object' && input.meta !== null ? input.meta : {},
  };
}

/** 反序列化老记录：补默认值，坏记录返回 null。 */
export function reviveRecord(raw) {
  if (typeof raw !== 'object' || raw === null) return null;
  if (typeof raw.text !== 'string' || raw.text.trim() === '') return null;
  const record = createRecord({
    ...raw,
    id: typeof raw.id === 'string' && raw.id.startsWith('mem_') ? raw.id : undefined,
    createdAt: Number.isFinite(raw.createdAt) ? raw.createdAt : undefined,
    updatedAt: undefined,
  });
  record.updatedAt = Number.isFinite(raw.updatedAt) ? Number(raw.updatedAt) : record.createdAt;
  return record;
}

/** 有效置信度：置信度 × 新鲜度；已被闭合（validTo）的断言不再可信。 */
export function effectiveConfidence(record, at = nowMs()) {
  if (record.validTo !== null && record.validTo !== undefined && record.validTo <= at) return 0;
  const anchor = Math.max(record.lastUsedAt || 0, record.updatedAt || 0, record.createdAt || 0);
  const ageDays = anchor > 0 ? Math.max(0, at - anchor) / 86_400_000 : 0;
  const halfLife = Math.max(1, record.halfLifeDays || HALF_LIFE_DAYS[record.kind] || 60);
  const decay = Math.pow(0.5, ageDays / halfLife);
  const usage = Math.min(1, (record.usedCount || 0) / 5);
  const freshness = decay + (1 - decay) * usage;
  return clamp01(Math.min(clamp01(record.confidence) * freshness, CONFIDENCE_CEILING[record.kind] ?? 0.9));
}

/** 这条断言在 at 时刻是否成立（时间区间语义）。 */
export function isCurrent(record, at = nowMs()) {
  if (record.validFrom !== null && record.validFrom !== undefined && record.validFrom > at) return false;
  if (record.validTo !== null && record.validTo !== undefined && record.validTo <= at) return false;
  return true;
}

/* ---------------------------------------------------------------- 会话隔离 */

export const SHARING_LEVELS = ['private', 'workspace', 'global'];

export function normalizeOrigin(origin, scope) {
  const sessionId = String(origin?.sessionId ?? '').slice(0, 128);
  const workspaceId = String(origin?.workspaceId ?? (scope.kind !== 'machine' ? scope.id : '')).slice(0, 128);
  return { sessionId, workspaceId };
}

/** 默认最保守：有来源会话 → private；没有来源会话的历史聚合数据才允许 global。 */
export function normalizeSharing(sharing, origin) {
  if (SHARING_LEVELS.includes(sharing)) return sharing;
  const hasSession = typeof origin?.sessionId === 'string' && origin.sessionId !== '';
  return hasSession ? 'private' : 'global';
}

/**
 * 注入闸门：这条记忆能不能出现在当前会话的上下文里。
 *
 * 规则（越往下越严）：
 *   private   只有来源会话本身
 *   workspace 只有同一个工作区根
 *   global    任何会话（必须显式提升或来自历史聚合数据）
 *
 * 除此之外还要满足记录自身的 scope：session 型记录永不出原会话；
 * workspace/project 型记录必须命中当前工作区；machine 型记录仍受 sharing 约束。
 * 没有会话上下文的请求（例如面板未带 sessionId）只允许 global。
 */
export function mayInject(record, context, at = nowMs()) {
  if (!isCurrent(record, at)) return false;
  const sharing = record.sharing ?? 'private';
  const origin = record.origin ?? { sessionId: '', workspaceId: '' };
  const sessionId = String(context?.sessionId ?? '');
  const workspaceId = String(context?.workspaceId ?? '');

  if (record.scope.kind === 'session') {
    return sessionId !== '' && record.scope.id === sessionId;
  }
  if (record.scope.kind === 'workspace' || record.scope.kind === 'project') {
    if (workspaceId === '' || record.scope.id !== workspaceId) return false;
    return sharing !== 'private' || (sessionId !== '' && origin.sessionId === sessionId);
  }
  // machine 作用域：仍要过 sharing 闸门
  if (sharing === 'global') return true;
  if (sharing === 'workspace') return workspaceId !== '' && origin.workspaceId !== '' && workspaceId === origin.workspaceId;
  return sessionId !== '' && origin.sessionId !== '' && origin.sessionId === sessionId;
}

/** 供面板解释"为什么这条没被注入"。 */
export function injectBlockReason(record, context, at = nowMs()) {
  if (!isCurrent(record, at)) return 'expired';
  const sharing = record.sharing ?? 'private';
  const origin = record.origin ?? { sessionId: '', workspaceId: '' };
  const sessionId = String(context?.sessionId ?? '');
  const workspaceId = String(context?.workspaceId ?? '');
  if (record.scope.kind === 'session' && record.scope.id !== sessionId) return 'other-session';
  if (sharing === 'private' && origin.sessionId !== sessionId) return 'other-session-private';
  if (sharing === 'workspace' && (workspaceId === '' || origin.workspaceId !== workspaceId)) return 'other-workspace';
  if ((record.scope.kind === 'workspace' || record.scope.kind === 'project') && record.scope.id !== workspaceId) return 'other-workspace';
  return 'unknown';
}

/* ---------------------------------------------------------------- 凭据脱敏 */

const SECRET_PATTERNS = [
  /(sk-[A-Za-z0-9_-]{12,})/g,
  /(gh[pousr]_[A-Za-z0-9]{16,})/g,
  /(xox[abprs]-[A-Za-z0-9-]{10,})/g,
  /((?:api[_-]?key|access[_-]?token|secret|password|passwd|pwd|authorization)\s*[:=]\s*)([^\s,;'"]{6,})/gi,
  /(Bearer\s+)([A-Za-z0-9._~+/-]{12,})/gi,
];

/**
 * 记忆入库与送云端之前必须过的脱敏：凭据永远不进入长期记忆，也不出本机。
 * 返回脱敏后的文本；调用方据此决定是否标记 pii。
 */
export function redactSecrets(text) {
  let value = String(text ?? '');
  let redacted = false;
  for (const pattern of SECRET_PATTERNS) {
    value = value.replace(pattern, (match, prefix, secret) => {
      if (typeof secret === 'string') {
        redacted = true;
        return `${prefix}⟨redacted⟩`;
      }
      redacted = true;
      return '⟨redacted⟩';
    });
  }
  return { text: value, redacted };
}

/** 文本相似度（字符 bigram Dice 系数）：中文不需要分词也能稳定工作。 */
export function textSimilarity(a, b) {
  const left = bigrams(normalizeText(a));
  const right = bigrams(normalizeText(b));
  if (left.size === 0 || right.size === 0) return 0;
  let shared = 0;
  for (const gram of left) if (right.has(gram)) shared += 1;
  return (2 * shared) / (left.size + right.size);
}

export function bigrams(text) {
  const grams = new Set();
  const value = String(text ?? '');
  if (value.length <= 2) {
    if (value !== '') grams.add(value);
    return grams;
  }
  for (let i = 0; i < value.length - 1; i += 1) grams.add(value.slice(i, i + 2));
  return grams;
}

/** 判断两条记录是否在说同一件事：同 kind、同 scope，且高相似（极性必须一致）。 */
export function isSameClaim(a, b) {
  if (a.kind !== b.kind) return false;
  if (a.scope.kind !== b.scope.kind || a.scope.id !== b.scope.id) return false;
  if (a.id === b.id) return true;
  // 场景不同就不是同一条断言：edit 与 write 的同名错误码、
  // 同一工具的两种错误码，文案几乎一样，但合并会直接吃掉覆盖。
  const aTool = String(a.meta?.tool ?? '');
  const bTool = String(b.meta?.tool ?? '');
  if (aTool !== '' && bTool !== '' && aTool !== bTool) return false;
  const aCode = String(a.meta?.code ?? '');
  const bCode = String(b.meta?.code ?? '');
  if (aCode !== '' && bCode !== '' && aCode !== bCode) return false;
  const similarity = textSimilarity(a.text, b.text);
  if (similarity >= 0.82) return true;
  if (hasNegation(a.text) !== hasNegation(b.text)) return false;
  const shared = a.topics.filter((topic) => b.topics.includes(topic)).length;
  return shared > 0 && similarity >= 0.72;
}

/* 极性词：用来判断"矛盾"而不是"重复"。中文约束里最常见的正反面对。 */
const NEGATIVE_MARKERS = ['不要', '别', '禁止', '不能', '不得', '避免', 'never', "don't", 'do not', 'avoid', 'must not'];
const POSITIVE_MARKERS = ['要', '必须', '应该', '需要', '务必', 'always', 'must', 'should', 'need to'];

export function hasNegation(text) {
  const value = normalizeText(text);
  return NEGATIVE_MARKERS.some((marker) => value.includes(normalizeText(marker)));
}

/** 去掉否定成分后的"谓词内核"，用于判断两句话是不是在说同一件事的正反两面。 */
export function stripNegation(text) {
  let value = normalizeText(text);
  for (const marker of NEGATIVE_MARKERS) value = value.split(normalizeText(marker)).join('');
  for (const marker of POSITIVE_MARKERS) value = value.split(normalizeText(marker)).join('');
  return value;
}

export function polarity(text) {
  const value = normalizeText(text);
  let negative = 0;
  let positive = 0;
  for (const marker of NEGATIVE_MARKERS) if (value.includes(normalizeText(marker))) negative += 1;
  for (const marker of POSITIVE_MARKERS) if (value.includes(normalizeText(marker))) positive += 1;
  if (negative > 0 && positive === 0) return -1;
  if (positive > 0 && negative === 0) return 1;
  return 0;
}

/**
 * 两条记录是否互相矛盾。
 *
 * 现实里的用户约束经常是"不要 X，必须 Y"这种混合句，单纯数极性词会失效，
 * 所以主判据改成：同主题 + 去掉否定词后的谓词内核高度相似 + 一方带否定、另一方不带。
 */
export function contradicts(a, b) {
  if (a.kind !== b.kind || a.scope.kind !== b.scope.kind || a.scope.id !== b.scope.id) return false;
  const shared = a.topics.filter((topic) => b.topics.includes(topic)).length;
  if (shared === 0) return false;
  const similarity = textSimilarity(a.text, b.text);
  const negationA = hasNegation(a.text);
  const negationB = hasNegation(b.text);
  if (negationA === negationB) {
    // 都带否定或都不带：只有谓词相同而结论不同才算矛盾（此处保守放过，交给巩固期人工确认）。
    return similarity >= 0.9 ? false : false;
  }
  const core = textSimilarity(stripNegation(a.text), stripNegation(b.text));
  return core >= 0.5;
}
