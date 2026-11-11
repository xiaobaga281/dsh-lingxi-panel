/**
 * 灵犀记忆库 · 存储与生命周期
 *
 * 落盘形态刻意简单：一个 `memory.json` + 滚动备份。理由：
 *  - 桌面场景的记录量在千级到万级，整库读入内存比数据库依赖更稳；
 *  - 原子写（tmp + rename）保证崩溃不写坏；
 *  - 版本号 + revive 让老记录可迁移。
 *
 * 生命周期（写入即判定，巩固时再收敛）：
 *   candidate  由自动抽取产生，等用户确认或多次命中后转正
 *   active     生效，进入检索
 *   dormant    长期未命中或置信度衰减到阈值以下，暂时不注入但不删除
 *   retired    明确废弃，保留为历史（可被"遗忘清单"展示）
 */
import { promises as fsp } from 'node:fs';
import path from 'node:path';
import {
  CONFIDENCE_CEILING,
  HALF_LIFE_DAYS,
  SCHEMA_VERSION,
  clamp01,
  contradicts,
  createRecord,
  effectiveConfidence,
  isCurrent,
  isSameClaim,
  injectBlockReason,
  mayInject,
  samePartition,
  nowMs,
  normalizeText,
  reviveRecord,
  textSimilarity,
} from './schema.js';
import { deriveTopics, search as searchRecords } from './retrieve.js';

const STORE_FILE = 'memory.json';
const SHARING_LEVELS = ['private', 'workspace', 'global'];
const BACKUP_DIR = 'backup';
const BACKUP_KEEP = 5;
const MAX_RECORDS = 8000;
const PROMOTE_EVIDENCE = 3;
const PROMOTE_CONFIDENCE = 0.7;

export class MemoryStore {
  constructor(options = {}) {
    this.dir = options.dir;
    this.records = new Map();
    this.loaded = false;
    this.dirty = false;
    this.version = 0;
    this.lastSaveAt = 0;
    this.lastError = null;
  }

  get file() {
    return path.join(this.dir, STORE_FILE);
  }

  async load() {
    if (this.loaded) return this;
    await fsp.mkdir(this.dir, { recursive: true });
    let raw = null;
    try {
      raw = JSON.parse(await fsp.readFile(this.file, 'utf8'));
    } catch {
      raw = null;
    }
    this.records.clear();
    const list = Array.isArray(raw?.records) ? raw.records : [];
    for (const entry of list) {
      const record = reviveRecord(entry);
      if (record === null) continue;
      const existing = this.records.get(record.id);
      if (existing === undefined || (record.updatedAt ?? 0) >= (existing.updatedAt ?? 0)) {
        this.records.set(record.id, record);
      }
    }
    this.loaded = true;
    this.schemaVersion = Number(raw?.schemaVersion ?? SCHEMA_VERSION);
    return this;
  }

  async save() {
    if (!this.dirty) return;
    const payload = {
      schemaVersion: SCHEMA_VERSION,
      updatedAt: nowMs(),
      records: [...this.records.values()],
    };
    const tmp = `${this.file}.tmp`;
    try {
      await fsp.mkdir(this.dir, { recursive: true });
      await fsp.writeFile(tmp, JSON.stringify(payload), 'utf8');
      await fsp.rename(tmp, this.file);
      this.dirty = false;
    this.version = (this.version ?? 0) + 1;
      this.lastSaveAt = Date.now();
      this.lastError = null;
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error);
      try {
        await fsp.rm(tmp, { force: true });
      } catch {
        // 清理失败不影响主流程
      }
    }
  }

  /**
   * 数据清洗：按条件硬删除（不是退役）。dryRun 只算数量不动数据。
   * 真正删除前一定先 backup()，保证可回滚。
   */
  async purge(filter = {}, { dryRun = false } = {}) {
    await this.load();
    const status = filter.status ?? null;
    const kind = filter.kind ?? null;
    const sharing = filter.sharing ?? null;
    const source = filter.source ?? null;
    const needle = String(filter.q ?? '').trim().toLowerCase();
    const days = Number(filter.olderThanDays);
    const cutoff = Number.isFinite(days) && days > 0 ? Date.now() - days * 86_400_000 : 0;
    const matches = (record) => {
      if (status !== null && status !== '' && record.status !== status) return false;
      if (kind !== null && kind !== '' && record.kind !== kind) return false;
      if (sharing !== null && sharing !== '' && (record.sharing ?? 'private') !== sharing) return false;
      if (source !== null && source !== '') {
        const hit = (record.provenance ?? []).some((entry) => entry.source === source);
        if (!hit) return false;
      }
      if (needle !== '') {
        const hay = (String(record.text ?? '') + ' ' + (record.topics ?? []).join(' ')).toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      if (cutoff > 0 && Number(record.updatedAt ?? 0) >= cutoff) return false;
      return true;
    };
    const targets = [...this.records.values()].filter(matches);
    if (dryRun) return { dryRun: true, wouldRemove: targets.length, remaining: this.records.size };
    if (targets.length === 0) return { removed: 0, remaining: this.records.size, backup: false };
    await this.backup();
    // 保留精确副本，支持"撤销最近一次删除"。
    this.lastDeleted = targets.map((record) => ({ ...record }));
    for (const record of targets) this.records.delete(record.id);
    this.version += 1;
    await this.save();
    return { removed: targets.length, remaining: this.records.size, backup: true };
  }

  /** 导出全部记录（含退役，便于完整迁移/留档）。 */
  async exportAll() {
    await this.load();
    return {
      version: SCHEMA_VERSION,
      exportedAt: nowMs(),
      total: this.records.size,
      records: [...this.records.values()].map((record) => ({ ...record })),
    };
  }

  /**
   * 导入记录：只做"缺则补"，不覆盖已有记录（id 或正文完全相同视为已存在）。
   * 导入不改变目标库的既有判定，避免把别人的取舍强加过来。
   */
  async importRecords(records, { dryRun = false } = {}) {
    await this.load();
    const list = Array.isArray(records) ? records : [];
    const existingTexts = new Set([...this.records.values()].map((record) => normalizeText(record.text)));
    let imported = 0;
    let skipped = 0;
    for (const entry of list) {
      const record = reviveRecord(entry);
      if (record === null) { skipped += 1; continue; }
      const textKey = normalizeText(record.text);
      if (this.records.has(record.id) || existingTexts.has(textKey)) {
        skipped += 1;
        continue;
      }
      // 预览模式只计数，不动内存与磁盘。
      if (dryRun !== true) {
        this.records.set(record.id, record);
        existingTexts.add(textKey);
      }
      imported += 1;
    }
    if (dryRun !== true && imported > 0) await this.save();
    return { imported, skipped, total: this.records.size, dryRun: dryRun === true };
  }

  /** 改写正文（用于修复历史合并造成的 meta/正文错位）。 */
  async patchText(id, text) {
    await this.load();
    const record = this.records.get(String(id));
    if (record === undefined) return null;
    const next = String(text ?? '').trim();
    if (next === '') return null;
    record.text = next;
    record.updatedAt = Date.now();
    this.dirty = true;
    this.version += 1;
    await this.save();
    return record;
  }

  /** 记录"被注入过"（曝光），只用于算相关命中率，不改置信度。 */
  async noteExposure(ids) {
    await this.load();
    const wanted = new Set((Array.isArray(ids) ? ids : []).map((id) => String(id)));
    if (wanted.size === 0) return 0;
    let touched = 0;
    for (const id of wanted) {
      const record = this.records.get(id);
      if (record === undefined) continue;
      record.exposures = Math.max(0, Number(record.exposures ?? 0)) + 1;
      touched += 1;
    }
    if (touched > 0) {
      this.dirty = true;
      this.version += 1;
    await this.save();
    }
    return touched;
  }

  /** 降级：退回候选（不删除，只是退出注入队列）。 */
  async demote(id, reason = '') {
    await this.load();
    const record = this.records.get(String(id));
    if (record === undefined) return null;
    record.status = 'candidate';
    if (reason !== '') record.meta = { ...(record.meta ?? {}), demoteReason: String(reason), demotedAt: Date.now() };
    record.updatedAt = Date.now();
    this.dirty = true;
    this.version += 1;
    await this.save();
    return record;
  }

  /** 打补丁：合并 meta 并保存（用于回填旧记录的 tool/code）。 */
  /**
   * 改类型（kind）。复盘会据此纠正被误分类的记录：
   * 例如"纠正时该怎么做"本属约束，却被自动抽取标成了 lesson。
   */
  /** 改类型。**原地修改**内部记录并返回同一个对象（调用方如需前后对比请自行拷贝）。 */
  async patchKind(id, kind) {
    await this.load();
    const record = this.records.get(String(id));
    if (record === undefined) return null;
    const allowed = ['constraint', 'preference', 'fact', 'lesson', 'skill'];
    if (!allowed.includes(String(kind))) return null;
    record.kind = String(kind);
    record.updatedAt = Date.now();
    this.dirty = true;
    this.version += 1;
    await this.save();
    return record;
  }

  async patchMeta(id, patch) {
    await this.load();
    const record = this.records.get(String(id));
    if (record === undefined) return null;
    record.meta = { ...(record.meta ?? {}), ...(patch ?? {}) };
    record.updatedAt = Date.now();
    this.version += 1;
    await this.save();
    return record;
  }

  /** 按 id 硬删除（单条），同样先备份。 */
  /** 最近一次删除的记录（用于精确撤销，不动其它条目）。 */
  async restoreLastDeleted() {
    const targets = Array.isArray(this.lastDeleted) ? this.lastDeleted : [];
    if (targets.length === 0) return { restored: 0, total: this.records.size };
    let restored = 0;
    for (const record of targets) {
      if (this.records.has(record.id)) continue;
      this.records.set(record.id, record);
      restored += 1;
    }
    this.lastDeleted = [];
    if (restored > 0) await this.save();
    return { restored, total: this.records.size };
  }

  async deleteRecords(ids) {
    await this.load();
    const wanted = new Set((Array.isArray(ids) ? ids : []).map((id) => String(id)));
    const targets = [...this.records.values()].filter((record) => wanted.has(record.id));
    if (targets.length === 0) return { removed: 0, remaining: this.records.size, backup: false };
    await this.backup();
    // 保留精确副本，支持"撤销最近一次删除"。
    this.lastDeleted = targets.map((record) => ({ ...record }));
    for (const record of targets) this.records.delete(record.id);
    this.version += 1;
    await this.save();
    return { removed: targets.length, remaining: this.records.size, backup: true };
  }

  /** 列表：按状态/类型/关键词过滤，供面板下钻查看。 */
  listRecords({ status = null, kind = null, q = '', source = null, minHits = 0, minMisses = 0, limit = 50 } = {}) {
    const needle = String(q ?? '').trim().toLowerCase();
    return [...this.records.values()]
      .filter((record) => (status === null || status === '' ? true : record.status === status))
      .filter((record) => (kind === null || kind === '' ? true : record.kind === kind))
      .filter((record) =>
        source === null || source === '' ? true : (record.provenance ?? []).some((entry) => entry.source === source),
      )
      .filter((record) => Number(record.hitCount ?? 0) >= Number(minHits ?? 0))
      .filter((record) => Number(record.missCount ?? 0) >= Number(minMisses ?? 0))
      .filter((record) =>
        needle === '' ? true : `${record.text} ${(record.topics ?? []).join(' ')}`.toLowerCase().includes(needle),
      )
      .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
      .slice(0, Math.max(1, Math.min(500, Number(limit) || 50)));
  }

  /**
   * 重置：先备份再清空。mode=all 清空全部；mode=candidates 只退役候选。
   * 任何重置都会先在 backup/ 落一份快照，保证可回滚。
   */
  async reset({ mode = 'all' } = {}) {
    await this.load();
    await this.backup();
    let removed = 0;
    if (mode === 'candidates') {
      for (const record of this.records.values()) {
        if (record.status !== 'candidate') continue;
        record.status = 'retired';
        record.updatedAt = Date.now();
        removed += 1;
      }
    } else {
      removed = this.records.size;
      this.records.clear();
    }
    this.version += 1;
    await this.save();
    return { mode, removed, remaining: this.records.size, at: Date.now() };
  }

  /** 列出 backup/ 下的快照（新的在前）。 */
  async listBackups() {
    const dir = path.join(this.dir, BACKUP_DIR);
    const names = await fsp.readdir(dir).catch(() => []);
    const out = [];
    for (const name of names.filter((entry) => entry.endsWith('.json')).sort().reverse()) {
      const full = path.join(dir, name);
      const stat = await fsp.stat(full).catch(() => null);
      out.push({ file: name, size: stat?.size ?? 0, at: stat?.mtimeMs ?? 0 });
    }
    return out.slice(0, 20);
  }

  /** 恢复前先备份当前库，保证"恢复"本身也可回滚。 */
  async restoreBackup(file) {
    const dir = path.join(this.dir, BACKUP_DIR);
    const name = path.basename(String(file ?? ''));
    if (!name.endsWith('.json')) throw new Error('invalid-backup');
    const full = path.join(dir, name);
    const raw = JSON.parse(await fsp.readFile(full, 'utf8'));
    const list = Array.isArray(raw?.records) ? raw.records : [];
    if (list.length === 0) throw new Error('empty-backup');
    await this.load();
    await this.backup();
    this.records.clear();
    for (const entry of list) {
      const record = reviveRecord(entry);
      if (record !== null) this.records.set(record.id, record);
    }
    this.version += 1;
    await this.save();
    return { restored: this.records.size, from: name };
  }

  async backup() {
    try {
      await this.load();
      const dir = path.join(this.dir, BACKUP_DIR);
      await fsp.mkdir(dir, { recursive: true });
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      await fsp.copyFile(this.file, path.join(dir, `memory-${stamp}.json`)).catch(() => {});
      const files = (await fsp.readdir(dir)).filter((name) => name.endsWith('.json')).sort();
      for (const stale of files.slice(0, Math.max(0, files.length - BACKUP_KEEP))) {
        await fsp.rm(path.join(dir, stale), { force: true }).catch(() => {});
      }
    } catch {
      // 备份是尽力而为
    }
  }

  /**
   * 写入一条记忆：add / update / no-op / supersede / contradicted 五态。
   *
   * - add：新断言，直接入库
   * - update：同一断言的追加证据，置信度按递减增益提升
   * - no-op：重复写入且没有新信息，只刷新时间戳（幂等）
   * - supersede：与之冲突且新断言证据更强 → 旧记录闭合 validTo，新记录带 supersedesId
   * - contradicted：冲突但新断言证据不足 → 双方留待确认，不擅自改写历史
   * @returns {{action:'created'|'update'|'noop'|'supersede'|'contradicted', record:object, related:object[]}}
   */
  async remember(input) {
    await this.load();
    const at = Number.isFinite(input?.at) ? Number(input.at) : nowMs();
    const draft = createRecord({
      ...input,
      at,
      topics: input?.topics !== undefined && input.topics !== null && input.topics.length > 0
        ? input.topics
        : deriveTopics({ text: input?.text, kind: input?.kind, meta: input?.meta }),
    });

    // provenance 门控：没有来源的自动写入不准直接生效，先降置信度当候选。
    if (draft.provenance.length === 0) {
      draft.provenance = [{ source: 'unspecified', sessionId: '', seq: null, at, excerpt: '' }];
      draft.confidence = Math.min(draft.confidence, 0.45);
      draft.status = 'candidate';
    }

    let sameClaim = null;
    let bestSimilarity = 0;
    const contradicting = [];
    for (const record of this.records.values()) {
      if (record.status === 'retired' || !isCurrent(record, at)) continue;
      // 不同可见性分区之间互不可见：既不合并，也不互相消解矛盾（防跨会话串门）。
      if (!samePartition(record, draft)) continue;
      // 先判冲突：相反断言的相似度往往也很高，先合并会把矛盾吞掉。
      if (contradicts(record, draft)) {
        contradicting.push(record);
        continue;
      }
      if (isSameClaim(record, draft)) {
        const similarity = textSimilarity(record.text, draft.text);
        if (sameClaim === null || similarity > bestSimilarity) {
          sameClaim = record;
          bestSimilarity = similarity;
        }
      }
    }

    if (sameClaim !== null) {
      // 同一次抽取被重复提交（文本与来源都相同）：no-op，只刷新时间戳，不虚增证据。
      const duplicateWrite =
        normalizeText(sameClaim.text) === normalizeText(draft.text) &&
        draft.provenance.length > 0 &&
        draft.provenance.every((entry) =>
          sameClaim.provenance.some(
            (existing) => existing.source === entry.source && existing.excerpt === entry.excerpt,
          ),
        );
      if (duplicateWrite) {
        sameClaim.lastUsedAt = at;
        sameClaim.updatedAt = at;
        this.dirty = true;
        this.version += 1;
    await this.save();
        return { action: 'noop', record: sameClaim, related: [] };
      }
      const before = {
        evidence: sameClaim.evidence,
        confidence: sameClaim.confidence,
        provenance: sameClaim.provenance.length,
        status: sameClaim.status,
      };
      // 合并：证据累加，置信度按"新证据权重递减"提升，来源与主题合并。
      sameClaim.evidence += Math.max(1, draft.evidence);
      const ceiling = CONFIDENCE_CEILING[sameClaim.kind] ?? 0.9;
      const lift = Math.max(0.04, (1 - sameClaim.confidence) * 0.22);
      sameClaim.confidence = clamp01(Math.min(ceiling, sameClaim.confidence + lift));
      sameClaim.updatedAt = at;
      sameClaim.lastUsedAt = at;
      sameClaim.topics = [...new Set([...sameClaim.topics, ...draft.topics])].slice(0, 8);
      sameClaim.provenance = [...sameClaim.provenance, ...draft.provenance].slice(-12);
      if (sameClaim.status === 'candidate' && sameClaim.evidence >= PROMOTE_EVIDENCE && sameClaim.confidence >= PROMOTE_CONFIDENCE) {
        sameClaim.status = 'active';
      }
      if (sameClaim.status === 'dormant' && sameClaim.evidence >= PROMOTE_EVIDENCE) {
        sameClaim.status = 'active';
      }
      sameClaim.meta = { ...sameClaim.meta, ...draft.meta, lastMergeAt: at };
      const changed =
        sameClaim.evidence !== before.evidence ||
        sameClaim.confidence !== before.confidence ||
        sameClaim.provenance.length !== before.provenance ||
        sameClaim.status !== before.status;
      this.dirty = true;
      this.version += 1;
    await this.save();
      return { action: changed ? 'update' : 'noop', record: sameClaim, related: [] };
    }

    if (contradicting.length > 0) {
      // 找证据最强的冲突者，判断谁有资格改写历史。
      contradicting.sort((a, b) => b.evidence - a.evidence || b.confidence - a.confidence);
      const target = contradicting[0];
      const canSupersede = draft.evidence >= target.evidence || draft.confidence >= target.confidence + 0.1;
      for (const other of contradicting) {
        other.contradictions += 1;
        other.updatedAt = at;
        other.links = pushLink(other.links, { to: draft.id, type: 'contradicts' });
        draft.links = pushLink(draft.links, { to: other.id, type: 'contradicts' });
        draft.contradictions += 1;
      }
      if (canSupersede) {
        target.validTo = at;
        target.status = 'retired';
        target.meta = { ...target.meta, supersededBy: draft.id, supersededAt: at };
        draft.supersedesId = target.id;
        draft.status = draft.evidence >= PROMOTE_EVIDENCE && draft.confidence >= PROMOTE_CONFIDENCE ? 'active' : draft.status;
        this.records.set(draft.id, draft);
        this.trim();
        this.dirty = true;
        this.version += 1;
    await this.save();
        return { action: 'supersede', record: draft, related: [target] };
      }
      draft.status = 'candidate';
      for (const other of contradicting) {
        if (other.status === 'active') other.status = 'candidate';
      }
    }

    if (draft.status === 'candidate' && draft.evidence >= PROMOTE_EVIDENCE && draft.confidence >= PROMOTE_CONFIDENCE) {
      draft.status = 'active';
    }
    this.records.set(draft.id, draft);
    this.trim();
    this.dirty = true;
    this.version += 1;
    await this.save();
    return { action: contradicting.length > 0 ? 'contradicted' : 'created', record: draft, related: contradicting };
  }

  /** 用户确认：把候选记忆转为生效，或明确退休。 */
  async confirm(id, decision = 'accept', reason = '') {
    await this.load();
    const record = this.records.get(id);
    if (record === undefined) return null;
    const at = nowMs();
    if (decision === 'accept') {
      record.status = 'active';
      record.confidence = clamp01(Math.max(record.confidence, 0.75));
      record.updatedAt = at;
      record.lastUsedAt = at;
    } else if (decision === 'retire' || decision === 'forget') {
      record.status = 'retired';
      if (reason !== '') record.meta = { ...(record.meta ?? {}), retireReason: String(reason), retiredAt: Date.now() };
      record.updatedAt = at;
    }
    this.dirty = true;
    this.version += 1;
    await this.save();
    return record;
  }

  /**
   * 显式提升共享范围。跨会话/跨工作区可见必须由用户动作触发，绝不自动放宽。
   * 降级（global→private）同样允许，用于事后收紧。
   */
  async promote(id, sharing) {
    await this.load();
    const record = this.records.get(id);
    if (record === undefined) return null;
    if (!SHARING_LEVELS.includes(sharing)) return null;
    const at = nowMs();
    const previous = record.sharing ?? 'private';
    if (previous === sharing) return record;
    record.meta = { ...record.meta, promotedFrom: previous, promotedAt: at };
    record.sharing = sharing;
    record.updatedAt = at;
    this.dirty = true;
    this.version += 1;
    await this.save();
    return record;
  }

  /** 检索结果被使用后的反馈：注入后被采纳算 hit，被忽略算 miss。 */
  /** 批量反馈：一次遍历 + 一次落盘。outcomes: [{ id, outcome }] */
  async observeMany(outcomes) {
    await this.load();
    let touched = 0;
    for (const entry of Array.isArray(outcomes) ? outcomes : []) {
      const done = await this.observe(entry.id, { ...entry.outcome, flush: false });
      if (done !== null) touched += 1;
    }
    if (touched > 0) await this.save();
    return touched;
  }

  async observe(id, outcome = {}) {
    await this.load();
    const record = this.records.get(id);
    if (record === undefined) return null;
    const at = Number.isFinite(outcome.at) ? Number(outcome.at) : nowMs();
    const ceiling = CONFIDENCE_CEILING[record.kind] ?? 0.9;
    record.usedCount += 1;
    record.lastUsedAt = at;
    if (outcome.hit === true) {
      record.hitCount += 1;
      record.confidence = clamp01(Math.min(ceiling, record.confidence + 0.03));
      if (record.status === 'candidate' && record.hitCount >= 2) record.status = 'active';
    }
    if (outcome.miss === true) {
      record.missCount += 1;
      record.confidence = clamp01(Math.max(0, record.confidence - 0.06));
      if (record.status === 'active' && effectiveConfidence(record, at) < 0.22) record.status = 'dormant';
    }
    record.updatedAt = at;
    this.dirty = true;
    if (outcome.flush === true) await this.save();
    return record;
  }

  /**
   * 巩固：合并近重复、收敛状态、解冲突。可由定时任务或面板按钮触发。
   */
  async consolidate({ at = nowMs() } = {}) {
    await this.load();
    const report = { merged: 0, promoted: 0, dormanted: 0, retired: 0, consolidatd: 0, total: 0 };
    const alive = [...this.records.values()].filter((record) => record.status !== 'retired');

    // 1) 近重复合并：同 kind/scope、相似度 ≥0.9（isSameClaim 已含 ≥0.82 与主题规则）。
    outer: for (let i = 0; i < alive.length; i += 1) {
      const base = alive[i];
      if (!this.records.has(base.id)) continue;
      for (let j = i + 1; j < alive.length; j += 1) {
        const other = alive[j];
        if (!this.records.has(other.id)) continue;
        if (!isSameClaim(base, other)) continue;
        const [keep, drop] = base.evidence >= other.evidence ? [base, other] : [other, base];
        keep.evidence += drop.evidence;
        keep.confidence = clamp01(Math.max(keep.confidence, drop.confidence));
        keep.provenance = [...keep.provenance, ...drop.provenance].slice(-12);
        keep.topics = [...new Set([...keep.topics, ...drop.topics])].slice(0, 8);
        keep.updatedAt = at;
        keep.meta = { ...drop.meta, ...keep.meta, mergedIds: [...(keep.meta.mergedIds ?? []), drop.id].slice(-8) };
        this.records.delete(drop.id);
        report.merged += 1;
        if (keep === base) continue;
        continue outer;
      }
    }

    // 2) 状态收敛：衰减 + 证据转正。
    for (const record of this.records.values()) {
      const effective = effectiveConfidence(record, at);
      if (record.status === 'candidate' && record.evidence >= PROMOTE_EVIDENCE && record.confidence >= PROMOTE_CONFIDENCE) {
        record.status = 'active';
        report.promoted += 1;
      }
      if (record.status === 'active' && effective < 0.25) {
        record.status = 'dormant';
        report.dormanted += 1;
      }
      if (record.status === 'dormant' && effective < 0.1) {
        record.status = 'retired';
        report.retired += 1;
      }
      if (record.status === 'candidate' && effective < 0.12) {
        record.status = 'retired';
        report.retired += 1;
      }
    }

    // 3) 冲突收敛：证据多的一方留下，另一方休眠并保留链接。
    const list = [...this.records.values()];
    for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) {
        const a = list[i];
        const b = list[j];
        if (a.status === 'retired' || b.status === 'retired') continue;
        if (!contradicts(a, b)) continue;
        const [win, lose] = a.evidence >= b.evidence ? [a, b] : [b, a];
        if (lose.status !== 'dormant' && lose.status !== 'retired') {
          lose.status = 'dormant';
          report.dormanted += 1;
        }
        win.links = pushLink(win.links, { to: lose.id, type: 'contradicts' });
        lose.links = pushLink(lose.links, { to: win.id, type: 'contradicts' });
      }
    }

    this.trim();
    report.total = this.records.size;
    this.dirty = true;
    this.version += 1;
    await this.save();
    return report;
  }

  /** 超量时按"已退休 → 有效置信度最低"淘汰，保留可解释性。 */
  trim() {
    if (this.records.size <= MAX_RECORDS) return;
    const ordered = [...this.records.values()].sort((a, b) => {
      const rank = (record) => (record.status === 'retired' ? 0 : record.status === 'dormant' ? 1 : 2);
      return rank(a) - rank(b) || effectiveConfidence(a) - effectiveConfidence(b);
    });
    const overflow = this.records.size - MAX_RECORDS;
    for (const record of ordered.slice(0, overflow)) this.records.delete(record.id);
  }

  search(query, options) {
    return searchRecords([...this.records.values()], query, options);
  }

  /**
   * 按主题精确取记忆：`tool:read` 这类键能稳定命中"同一个工具"的历史教训，
   * 不像词法检索那样在中文短句上容易保守 abstain。
   */
  findByTopic(topic, { context = null, limit = 3, at = nowMs() } = {}) {
    const wanted = String(topic ?? '');
    if (wanted === '') return [];
    const hits = [];
    for (const record of this.records.values()) {
      if (record.status === 'retired') continue;
      if (!Array.isArray(record.topics) || !record.topics.includes(wanted)) continue;
      if (!mayInject(record, context, at)) continue;
      hits.push(record);
    }
    hits.sort((a, b) => effectiveConfidence(b, at) - effectiveConfidence(a, at));
    return hits.slice(0, limit);
  }

  /**
   * 面板列表：先过隔离闸门，再按可见性/置信度排序。
   * 返回 {visible, blocked}，blocked 只给计数与原因分布，不回传别人的内容。
   */
  listVisible(context, { kind, status, limit = 50, at = nowMs() } = {}) {
    const visible = [];
    const blockedReasons = {};
    let blocked = 0;
    for (const record of this.records.values()) {
      if (kind !== undefined && record.kind !== kind) continue;
      if (status !== undefined && record.status !== status) continue;
      if (mayInject(record, context, at)) {
        visible.push(record);
      } else {
        blocked += 1;
        const reason = injectBlockReason(record, context, at);
        blockedReasons[reason] = (blockedReasons[reason] ?? 0) + 1;
      }
    }
    visible.sort((a, b) => effectiveConfidence(b, at) - effectiveConfidence(a, at));
    return { items: visible.slice(0, limit), total: visible.length, blocked, blockedReasons };
  }

  /**
   * 按条件列出记录。
   *
   * 注意：返回的是**内部记录对象本身**（不是副本），并且已按有效置信度排序。
   * 只读使用没问题；若要"先取值、再改动、然后比较前后差异"，
   * 必须自己先深拷贝一份——否则 before 与内部对象是同一个引用，比较会误判。
   */
  list({ kind, status, scope, limit = 50 } = {}) {
    let list = [...this.records.values()];
    if (kind !== undefined) list = list.filter((record) => record.kind === kind);
    if (status !== undefined) list = list.filter((record) => record.status === status);
    if (scope !== undefined) {
      list = list.filter((record) => record.scope.kind === scope.kind && record.scope.id === scope.id);
    }
    list.sort((a, b) => effectiveConfidence(b) - effectiveConfidence(a));
    return list.slice(0, limit);
  }

  /** 待确认队列：候选且已经足够可信，问用户一句就能长期生效。 */
  pendingConfirmation(limit = 8) {
    return [...this.records.values()]
      // 待确认 = 所有候选：旧的 >=0.55 门槛会让低置信候选永远看不见、也无法忽略。
      .filter((record) => record.status === 'candidate')
      .sort((a, b) => b.confidence - a.confidence || b.evidence - a.evidence)
      .slice(0, limit);
  }

  async health({ at = nowMs() } = {}) {
    await this.load();
    const byKind = {};
    const byStatus = {};
    let confidenceSum = 0;
    let usedRecent = 0;
    for (const record of this.records.values()) {
      byKind[record.kind] = (byKind[record.kind] ?? 0) + 1;
      byStatus[record.status] = (byStatus[record.status] ?? 0) + 1;
      confidenceSum += effectiveConfidence(record, at);
      if (at - (record.lastUsedAt ?? 0) < 7 * 86_400_000) usedRecent += 1;
    }
    let bytes = 0;
    try {
      bytes = (await fsp.stat(this.file)).size;
    } catch {
      bytes = 0;
    }
    const total = this.records.size;
    return {
      dir: this.dir,
      file: this.file,
      bytes,
      total,
      byKind,
      byStatus,
      pendingConfirmation: this.pendingConfirmation(100).length,
      contradictionPairs: countContradictions(this.records),
      averageEffectiveConfidence: total > 0 ? confidenceSum / total : 0,
      usedLast7Days: usedRecent,
      lastSaveAt: this.lastSaveAt,
    };
  }
}

function pushLink(links, link) {
  const next = Array.isArray(links) ? links.filter((entry) => !(entry.to === link.to && entry.type === link.type)) : [];
  next.push(link);
  return next.slice(-24);
}

function countContradictions(records) {
  let pairs = 0;
  const list = [...records.values()].filter((record) => record.status !== 'retired');
  for (let i = 0; i < list.length; i += 1) {
    for (let j = i + 1; j < list.length; j += 1) {
      if (contradicts(list[i], list[j])) pairs += 1;
    }
  }
  return pairs;
}

export { HALF_LIFE_DAYS, normalizeText };





