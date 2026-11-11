/**
 * 灵犀记忆库 · 对外门面（纯本地）
 *
 * 一个门面把四件事收在一起：
 *   1) 记住（remember）：写入即去重/冲突判定，凭据入库前脱敏；
 *   2) 回忆（recall）：词法混合检索 + 字符预算，产出可直接塞进 prompt 的块；
 *   3) 反馈（observe/confirm）：命中或证伪都回流到置信度；
 *   4) 巩固（consolidate）：合并近重复、衰减、解冲突。
 *
 * 只走本地：没有任何网络请求、没有外部服务依赖，检索为纯词法（BM25 + 结构化信号）。
 * 这样记忆永远不会因为"外面连不上"而失效，也不存在数据出本机的路径。
 */
import { MemoryStore } from './store.js';
import { createRecord, effectiveConfidence, nowMs, redactSecrets } from './schema.js';

const KIND_LABELS = {
  constraint: '用户约束',
  preference: '用户偏好',
  fact: '环境事实',
  lesson: '教训',
  skill: '技能',
  episode: '情景',
  strategy: '策略',
};

export class LingxiMemory {
  constructor(options = {}) {
    this.dir = options.dir;
    this.store = new MemoryStore({ dir: options.dir });
    this.indexCache = { key: null, index: null };
  }

  get schemaVersion() {
    return this.store.schemaVersion ?? null;
  }

  async init() {
    await this.store.load();
    return this;
  }

  /**
   * 写入一条记忆：入口即脱敏。
   * context（{sessionId, workspaceId}）会被记成 origin：有会话来源的记录默认 private，
   * 只回原会话，跨会话注入必须显式 promote。
   */
  async remember(input, { context = null } = {}) {
    await this.store.load();
    const redacted = redactSecrets(input?.text);
    const prepared = redacted.redacted
      ? { ...input, text: redacted.text, pii: true }
      : { ...input };
    if (context !== null && prepared.origin === undefined) {
      prepared.origin = { sessionId: context.sessionId ?? '', workspaceId: context.workspaceId ?? '' };
    }
    return this.store.remember(prepared);
  }

  /**
   * 检索并组装成 prompt 注入块。
   *
   * 返回 abstain 时 text 为空：宁可让模型说"不知道"，也不塞一条不相干的记忆进去。
   * @returns {{items:object[], text:string, chars:number, confident:boolean, abstain:boolean, topScore:number}}
   */
  async recall(query, options = {}) {
    await this.store.load();
    const { charBudget = 900, ...rest } = options;
    const queryText = query === undefined || query === null ? '' : String(query);
    const result = this.store.search(queryText, { ...rest, charBudget, indexCache: this.indexCache, indexVersion: this.store.version });
    if (result.abstain) {
      return {
        items: [],
        text: '',
        chars: 0,
        confident: false,
        abstain: true,
        topScore: result.topScore,
      };
    }
    const fitted = buildRecallTextWithin(result.items, charBudget);
    return {
      items: fitted.items,
      text: fitted.text,
      chars: fitted.text.length,
      confident: result.confident,
      abstain: false,
      topScore: result.topScore,
    };
  }

  async observe(id, outcome) {
    return this.store.observe(id, outcome);
  }

  /** 批量反馈：一次落盘。outcomes: [{ id, outcome }] */
  async observeMany(outcomes) {
    return this.store.observeMany(outcomes);
  }

  async confirm(id, decision, reason = '') {
    return this.store.confirm(id, decision, reason);
  }

  /** 显式提升/收紧共享范围：跨会话可见必须由用户动作触发。 */
  async promote(id, sharing) {
    return this.store.promote(id, sharing);
  }

  /** 只返回当前上下文可见的记录（面板列表用，禁止绕过隔离闸门）。 */
  async listVisible(options = {}) {
    await this.store.load();
    const { context = null, ...rest } = options;
    return this.store.listVisible(context, rest);
  }

  async consolidate() {
    await this.store.backup();
    return this.store.consolidate();
  }

  async health() {
    return this.store.health();
  }

  async pending(limit = 8) {
    await this.store.load();
    return this.store.pendingConfirmation(limit);
  }

  async findByTopic(topic, options = {}) {
    await this.store.load();
    const { context = null, ...rest } = options;
    return this.store.findByTopic(topic, { context, ...rest });
  }

  async listRecords(options = {}) {
    await this.store.load();
    return this.store.listRecords(options);
  }

  async noteExposure(ids) {
    await this.store.load();
    return this.store.noteExposure(ids);
  }

  async demote(id, reason = '') {
    await this.store.load();
    return this.store.demote(id, reason);
  }

  async exportAll() {
    await this.store.load();
    return this.store.exportAll();
  }

  /** 按 id 取一条（修复流程用）。 */
  async find(id) {
    await this.store.load();
    return this.store.records.get(String(id)) ?? null;
  }

  async restoreLastDeleted() {
    await this.store.load();
    return this.store.restoreLastDeleted();
  }

  async importRecords(records, options = {}) {
    await this.store.load();
    return this.store.importRecords(records, options);
  }

  async patchText(id, text) {
    await this.store.load();
    return this.store.patchText(id, text);
  }

  async patchMeta(id, patch) {
    await this.store.load();
    return this.store.patchMeta(id, patch);
  }

  /** 改类型（复盘纠正误分类时使用）。 */
  async patchKind(id, kind) {
    await this.store.load();
    return this.store.patchKind(id, kind);
  }

  async purge(filter = {}, options = {}) {
    await this.store.load();
    return this.store.purge(filter, options);
  }

  async deleteRecords(ids) {
    await this.store.load();
    return this.store.deleteRecords(ids);
  }

  async listBackups() {
    await this.store.load();
    return this.store.listBackups();
  }

  async restoreBackup(file) {
    await this.store.load();
    return this.store.restoreBackup(file);
  }

  async reset(options = {}) {
    await this.store.load();
    return this.store.reset(options);
  }

  async list(options) {
    await this.store.load();
    return this.store.list(options);
  }
}

const KIND_ORDER = ['constraint', 'preference', 'fact', 'skill', 'lesson', 'strategy', 'episode'];

/** 把检索结果拼成等宽紧凑的注入块；只给模型看，不做花哨排版。 */
function buildRecallText(items, { header = '【灵犀记忆】' } = {}) {
  if (!Array.isArray(items) || items.length === 0) return '';
  const grouped = new Map();
  for (const entry of items) {
    const kind = entry.record?.kind ?? 'fact';
    if (!grouped.has(kind)) grouped.set(kind, []);
    grouped.get(kind).push(entry);
  }
  const lines = [];
  for (const kind of KIND_ORDER) {
    const group = grouped.get(kind);
    if (!group || group.length === 0) continue;
    lines.push(`${KIND_LABELS[kind] ?? kind}：`);
    for (const entry of group) {
      const record = entry.record;
      const confidence = Math.round(effectiveConfidence(record) * 100);
      const scope = record.scope.kind === 'machine' ? '全局' : record.scope.kind === 'workspace' ? '本工作区' : record.scope.kind;
      lines.push(`- ${record.text}（${scope}·置信 ${confidence}%${record.evidence > 1 ? `·证据 ${record.evidence}` : ''}）`);
    }
  }
  return [header, ...lines].join('\n');
}

/**
 * 在字符预算内产出注入块：超预算就从最低名次开始丢，直到放下为止。
 * 标题与每条元信息也计入预算，避免"记录长度合规、整体超窗"。
 */
export function buildRecallTextWithin(items, budget) {
  const limit = Number.isFinite(budget) && budget > 0 ? budget : 900;
  let slice = Array.isArray(items) ? items : [];
  while (slice.length > 0) {
    const text = buildRecallText(slice);
    if (text.length <= limit) return { text, items: slice };
    slice = slice.slice(0, -1);
  }
  return { text: '', items: [] };
}

export { MemoryStore, createRecord, effectiveConfidence };
