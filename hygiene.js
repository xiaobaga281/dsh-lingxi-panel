/**
 * 灵犀 · 记忆卫生（写入门控 + 衰减 + 淘汰，纯本地）
 *
 * 为什么需要：记忆越多不等于越聪明。参考业界的 keep/merge/decay/evict 与 write gate：
 *   1. 写入前先算"重要度"，太弱的不该进注入；
 *   2. 注入只用 active 且不吵的记录，候选只进待确认队列；
 *   3. 长期没被用到的记录按半衰期衰减，低于阈值就淘汰（不是永久占位）。
 */

import { textSimilarity } from './memory/schema.js';

const QUESTION_LIKE = /[？?]\s*$/;
const ADDRESSING = /(我看看|给我做|帮你|帮我|你先|你在|我要|你安装|我看不了|你做个|你可以)/;
const PROCEDURAL = /(→|->|步骤|流程|先|然后|再)/;
const PLACEHOLDER = /(<path>|<n>|<hex>|TODO|FIXME|\{\{[^}]*\}\})/i;

export const DECAY_HALF_LIFE_DAYS = 90;

/** 单条记录的可疑原因（空数组表示干净）。 */
export function noiseReasons(record) {
  const reasons = [];
  const text = String(record?.text ?? '').trim();
  const kind = String(record?.kind ?? '');
  if (text === '') reasons.push('empty');
  if (text !== '' && text.length < 6) reasons.push('too-short');
  if (text.length > 400) reasons.push('too-long');
  if (QUESTION_LIKE.test(text)) reasons.push('question-not-rule');
  // "不要下载一些其他素材吗"：没有问号但带疑问语气词，也不是规则。
  if (kind === 'constraint' || kind === 'preference') {
    if (/[吗呢吧][。\s]*$/.test(text)) reasons.push('question-not-rule');
  }
  if (PLACEHOLDER.test(text)) reasons.push('placeholder');
  if ((kind === 'constraint' || kind === 'skill' || kind === 'preference') && ADDRESSING.test(text)) {
    reasons.push('user-request-not-rule');
  }
  // 只出现一次的流程等于一次性路径，不该当成技能（与跨会话门槛一致）。
  if (kind === 'skill' && record?.meta?.procedure === true && Number(record?.evidence ?? 0) < 2) {
    reasons.push('single-observation');
  }

  // 技能必须是"做法"：没有步骤连接词/流程词，说明这条只是被误标成 skill 的普通句子。
  if (kind === 'skill' && !PROCEDURAL.test(text)) reasons.push('not-procedural');
  if (kind === 'skill' && /你做个|我想要|能不能|你安装|你看/.test(text)) reasons.push('wrong-kind');
  // 历史遗留：正则抽出来的"规则"准确度不足，不再作为记忆保留。
  if ((record?.provenance ?? []).some((entry) => entry.source === 'heuristic-instruction')) {
    reasons.push('unreliable-heuristic');
  }
  return reasons;
}

/** 重要度：证据、置信、命中率、来源可信度、时间衰减。 */
export function importanceOf(record, now = Date.now()) {
  const evidence = Number(record?.evidence ?? 0);
  const confidence = Number(record?.confidence ?? 0);
  const hits = Number(record?.hitCount ?? 0);
  const misses = Number(record?.missCount ?? 0);
  const source = String((record?.provenance ?? [])[0]?.source ?? '');
  const kind = String(record?.kind ?? '');

  let score = 0.15;
  score += Math.min(0.3, Math.log1p(Math.max(0, evidence)) / 10);
  score += Math.min(0.25, Math.max(0, confidence) * 0.25);
  score += Math.min(0.2, (hits - misses) / 20);
  // 用户明确纠正/失败沉淀 > 自动扫描 > 猜测
  if (/correction|user-instruction|tool-failure|model-tool/.test(source)) score += 0.12;
  if (/tool-sequence|efficacy-scan/.test(source)) score += 0.04;
  if (kind === 'skill') score -= 0.05;

  const lastUsed = Number(record?.lastUsedAt ?? record?.updatedAt ?? record?.createdAt ?? 0);
  if (lastUsed > 0) {
    const days = Math.max(0, (now - lastUsed) / 86_400_000);
    score *= Math.pow(0.5, days / DECAY_HALF_LIFE_DAYS);
  }
  return Math.max(0, Math.min(1, Math.round(score * 1000) / 1000));
}

/** 注入可用性：active、不吵、重要度够。 */
/**
 * 注入可用性：active 直接可用；candidate 必须置信与证据都够强（否则只进待确认队列）；
 * 任何有噪音原因的一律不注入，避免"学到的垃圾"污染上下文。
 */
export function usableForInjection(
  record,
  { now = Date.now(), minImportance = 0.2, candidateConfidence = 0.7, candidateEvidence = 2 } = {},
) {
  if (record === null || record === undefined) return false;
  const status = String(record.status ?? '');
  if (status !== 'active' && status !== 'candidate') return false;
  if (status === 'candidate') {
    if (Number(record.confidence ?? 0) < candidateConfidence) return false;
    if (Number(record.evidence ?? 0) < candidateEvidence) return false;
  }
  if (noiseReasons(record).length > 0) return false;
  return importanceOf(record, now) >= minImportance;
}

/**
 * 体检计划：
 * - quarantine：可疑且从未被用过（hitCount=0）→ 退休；
 * - evict：重要度低于阈值且长期未用 → 退休；
 * - merge：正文规范化后重复 → 保留证据多的一条，其余退休。
 */
export function planHygiene(records, { now = Date.now(), evictBelow = 0.12, staleDays = 120 } = {}) {
  const list = Array.isArray(records) ? records : [];
  const quarantine = [];
  const evict = [];
  const merge = [];
  const byKey = new Map();

  for (const record of list) {
    if (record === null || record === undefined) continue;
    if (String(record.status ?? '') === 'retired') continue;
    const reasons = noiseReasons(record);
    // 自我纠错：被注入过、但反复被证伪且从未命中 → 这条经验没用（或表述不对）。
    const hits = Number(record.hitCount ?? 0);
    const misses = Number(record.missCount ?? 0);
    // 保守判据：至少 4 次证伪、0 次命中、置信度也不高，才认为这条经验没用。
    // 之前 2 次就隔离，会把"我自己为验证守卫制造的重复失败"误判成经验无效。
    if (misses >= 4 && hits === 0 && Number(record.confidence ?? 0) < 0.8 && String(record.status ?? '') === 'candidate') {
      quarantine.push({ id: record.id, reasons: ['contradicted-by-use'] });
      continue;
    }
    const lastUsed = Number(record?.lastUsedAt ?? record?.updatedAt ?? record?.createdAt ?? 0);
    const stale = lastUsed > 0 && now - lastUsed > staleDays * 86_400_000;

    // 结构性噪音（类型错、请求句、问句、占位符）即使被注入过也要隔离：
    // hit 只说明"被塞进上下文"，不说明"有用"。
    const structural = reasons.some((reason) =>
      reason === 'user-request-not-rule' ||
      reason === 'wrong-kind' ||
      reason === 'question-not-rule' ||
      reason === 'placeholder' ||
      reason === 'not-procedural' ||
      reason === 'unreliable-heuristic' ||
      reason === 'single-observation' ||
      reason === 'empty',
    );
    if (reasons.length > 0 && (structural || Number(record.hitCount ?? 0) === 0)) {
      quarantine.push({ id: record.id, reasons });
      continue;
    }
    const importance = importanceOf(record, now);
    if (importance < evictBelow && Number(record.hitCount ?? 0) === 0 && stale) {
      evict.push({ id: record.id, importance });
      continue;
    }
    const key = String(record.text ?? '')
      .toLowerCase()
      .replace(/[\s，。；、,.;:!?！？"'“”‘’()（）]/g, '');
    if (key === '') continue;
    const existing = byKey.get(key);
    if (existing === undefined) {
      byKey.set(key, record);
    } else {
      const keep = Number(existing.evidence ?? 0) >= Number(record.evidence ?? 0) ? existing : record;
      const drop = keep === existing ? record : existing;
      byKey.set(key, keep);
      merge.push({ keep: keep.id, drop: drop.id });
    }
  }

  // 近似去重：完全相同的文本在上面的 key 里已处理；这里补"措辞略有差异"的重复。
  const survivors = [];
  for (const record of list) {
    if (String(record.status ?? '') === 'retired') continue;
    if (quarantine.some((item) => item.id === record.id)) continue;
    if (evict.some((item) => item.id === record.id)) continue;
    if (merge.some((item) => item.drop === record.id)) continue;
    survivors.push(record);
  }
  const byKind = new Map();
  for (const record of survivors) {
    const kind = String(record.kind ?? '');
    const bucket = byKind.get(kind) ?? [];
    bucket.push(record);
    byKind.set(kind, bucket);
  }
  for (const bucket of byKind.values()) {
    for (let i = 0; i < bucket.length; i += 1) {
      const left = bucket[i];
      if (left === undefined) continue;
      for (let j = i + 1; j < bucket.length; j += 1) {
        const right = bucket[j];
        if (right === undefined) continue;
        // 只有同一场景（工具与错误码一致）的教训才允许合并；
        // 否则「edit」与「write」的同名错误码文案几乎一样，会被误合并、白白吃掉覆盖。
        const metaOf = (record) => {
          const meta = record.meta ?? {};
          const match = /当「([^」]+)」遇到「([^」]+)」时/.exec(String(record.text ?? ''));
          return {
            tool: String(meta.tool ?? match?.[1] ?? ''),
            code: String(meta.code ?? match?.[2] ?? ''),
          };
        };
        const leftKey = metaOf(left);
        const rightKey = metaOf(right);
        if (leftKey.tool !== '' && rightKey.tool !== '' && leftKey.tool !== rightKey.tool) continue;
        if (leftKey.code !== '' && rightKey.code !== '' && leftKey.code !== rightKey.code) continue;
        if (textSimilarity(String(left.text ?? ''), String(right.text ?? '')) < 0.92) continue;
        const keep = Number(left.evidence ?? 0) >= Number(right.evidence ?? 0) ? left : right;
        const drop = keep === left ? right : left;
        merge.push({ keep: keep.id, drop: drop.id });
        if (keep === right) bucket[i] = right;
        bucket.splice(j, 1);
        j -= 1;
      }
    }
  }

  // 降级：已生效但被反复证伪、从未命中的教训 → 退回候选，先退出注入队列。
  const demote = [];
  for (const record of list) {
    if (String(record.status ?? '') !== 'active') continue;
    if (Number(record.hitCount ?? 0) > 0) continue;
    if (Number(record.missCount ?? 0) < 3) continue;
    if (String(record.kind ?? '') !== 'lesson' && String(record.kind ?? '') !== 'constraint') continue;
    if (quarantine.some((item) => item.id === record.id)) continue;
    demote.push({ id: record.id, misses: Number(record.missCount ?? 0), reason: 'warn-ineffective' });
  }

  return { quarantine, evict, merge, demote };
}
