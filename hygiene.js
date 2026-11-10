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

export const DECAY_HALF_LIFE_DAYS = 15;

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

/**
 * 表现分：只统计"真的被相关验证过"的次数（曝光感知的命中率）。
 * 与 reliability 同源，但这里回答的是"这条值不值得更强"。
 */
export function performanceOf(record) {
  const hits = Number(record?.hitCount ?? 0);
  const misses = Number(record?.missCount ?? 0);
  const exposures = Number(record?.exposures ?? 0);
  const cappedHits = exposures > 0 ? Math.min(hits, exposures) : hits;
  const samples = cappedHits + Math.min(misses, exposures > 0 ? exposures : misses);
  const rate = samples === 0 ? null : cappedHits / samples;
  // proven：至少 5 次验证、命中率 ≥0.8 —— 这条经验被反复证明有效。
  const proven = samples >= 5 && rate !== null && rate >= 0.8;
  return { hits: cappedHits, misses, exposures, samples, rate, proven };
}

/**
 * 稀缺度：这条内容对模型来说有多少"意外"。
 *
 * 动机：记忆的价值 = 模型不知道的信息量，而不是它被用了多少次。
 * 「write → pwsh → write」这类通用流程，模型本来就会做；注入它不增加信息，
 * 却占掉注入预算，并在模型能力升级后变成多余的约束。
 *
 * 返回 0.55 ~ 1.15 的乘数：含具体项目知识的上浮，纯通用做法的下沉。
 * 只调排序，不删除任何记录——随时可回退，也不会误杀。
 */

/* 具体知识标记：路径、错误码、配置文件名、插件名、URL、端口、具体模型名。 */
const SPECIFIC_MARKERS = [
  /[A-Za-z]:[\\/]/,
  /\/(Users|home|root|workspace|opt|etc)\//,
  /~\/\.\w+/,
  // 用显式边界代替 \b：中文汉字不属于 \w，\b 在「FS_NOT_FOUND」这类位置不成立。
  /(?:^|[^A-Za-z0-9_])[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+(?:$|[^A-Za-z0-9_])/,
  /(?:^|[^A-Za-z0-9_])E[A-Z]{2,}(?:$|[^A-Za-z0-9_])/,
  /(?:^|[^A-Za-z0-9_])[\w.-]+\.(json|ya?ml|toml|ini|mjs|ts|js)(?:$|[^A-Za-z0-9_])/,
  /(?:^|[^A-Za-z0-9_@])(dsh-[\w-]+|@[\w-]+\/[\w-]+)/,
  /https?:\/\//,
  /:\d{4,5}(?:$|[^0-9])/,
  /(?:^|[^A-Za-z0-9_])(gpt|claude|deepseek|glm|qwen|spark|trae|loom)[\w.-]*/i,
];

/* 通用做法标记：纯工具序列、通用建议用语。 */
const GENERIC_PATTERNS = [
  /(流程|步骤)[^：:]{0,12}[：:]\s*[\w_]+\s*(→|->)\s*[\w_]+/,
  /^[\s\w（）()：:→|、,，-]*(write|read|edit|pwsh|bash|glob|grep|present|apply_patch)[\s\w（）()：:→|、,，-]*$/i,
  /(先确认|先检查|再重试|不要重复|先读|再改|确认路径|确认存在)/,
];

export function scarcityOf(record) {
  const text = String(record?.text ?? '');
  const kind = String(record?.kind ?? '');
  if (text === '') return 0.85;

  // 约束与偏好是"用户教我"的：它们表达的是**你的要求**，不是模型能自己推导的常识。
  // 所以无论措辞多通用，都不判为可推导——这是用户的意志，不是知识密度问题。
  if (kind === 'constraint' || kind === 'preference') {
    let ownSpecific = 0;
    for (const pattern of SPECIFIC_MARKERS) {
      if (pattern.test(text)) ownSpecific += 1;
    }
    if (ownSpecific >= 3) return 1.15;
    if (ownSpecific === 2) return 1.08;
    // 至少保持在基准线，绝不因为"看着像常识"而下沉
    return 1.0;
  }

  // 具体知识优先：只要含路径/错误码/配置名/模型名，就是模型不一定知道的东西，
  // 不该因为句子里有"先确认"这类通用词就被下沉。
  let specific = 0;
  for (const pattern of SPECIFIC_MARKERS) {
    if (pattern.test(text)) specific += 1;
  }
  if (specific >= 3) return 1.15;
  if (specific === 2) return 1.08;
  if (specific === 1) return 1.0;

  // 到这里已确认：全文没有任何具体知识标记。
  // 此时若仍是通用做法（纯工具序列 / 通用建议语），才算"模型本来就会"。
  const generic = GENERIC_PATTERNS.some((pattern) => pattern.test(text));
  if (generic) return 0.55;

  // 无具体标记也不像通用流程：轻度下沉（信息量存疑但不武断）。
  return 0.85;
}

/**
 * 是否属于"模型本来就会做"的通用做法（供面板审阅，不用于删除）。
 * 约束与偏好永不视为可推导：那是用户的明确要求，不是可推导的常识。
 */
export function isDerivable(record) {
  const kind = String(record?.kind ?? '');
  if (kind === 'constraint' || kind === 'preference') return false;
  return scarcityOf(record) <= 0.55;
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

  // 优胜：被反复验证有效的经验获得重要度加成。
  // 衰减不再延长——15 天约等于模型能力的一次换代周期：更久只会让过时内容占位。
  const perf = performanceOf(record);
  if (perf.proven) score += 0.12;
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
export function planHygiene(records, { now = Date.now(), evictBelow = 0.12, staleDays = 30 } = {}) {
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
    const perf = performanceOf(record);
    // 优胜保护：反复验证有效的经验不因"暂时陈旧"被淘汰。
    if (!perf.proven && importance < evictBelow && Number(record.hitCount ?? 0) === 0 && stale) {
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
    // 用相关命中率而不是 miss 绝对数：高曝光场景 miss 天然多，
    // 只有命中率确实差（<0.3）且样本足够（≥10 次相关判定）才降级。
    const hits = Number(record.hitCount ?? 0);
    const misses = Number(record.missCount ?? 0);
    if (hits + misses < 10) continue;
    if (hits / (hits + misses) >= 0.3) continue;
    if (String(record.kind ?? '') !== 'lesson' && String(record.kind ?? '') !== 'constraint') continue;
    if (quarantine.some((item) => item.id === record.id)) continue;
    // 优胜保护：已验证有效的经验不因低命中率被降级。
    if (performanceOf(record).proven) continue;
    demote.push({ id: record.id, misses: Number(record.missCount ?? 0), reason: 'warn-ineffective' });
  }

  // 相对淘汰：同一场景键（tool|code）下活教训过多会互相稀释注入位，
  // 只保留重要度最高的 2 条，其余退回候选（不是删除，可再验证复活）。
  const bySceneKey = new Map();
  for (const record of list) {
    if (String(record.status ?? '') === 'retired') continue;
    if (quarantine.some((item) => item.id === record.id)) continue;
    if (evict.some((item) => item.id === record.id)) continue;
    const meta = record.meta ?? {};
    const match = /当「([^」]+)」遇到「([^」]+)」时/.exec(String(record.text ?? ''));
    const tool = String(match?.[1] ?? meta.tool ?? '');
    if (tool === '') continue;
    const key = tool + '|' + String(match?.[2] ?? meta.code ?? '');
    if (!bySceneKey.has(key)) bySceneKey.set(key, []);
    bySceneKey.get(key).push(record);
  }
  for (const [key, bucket] of bySceneKey.entries()) {
    if (bucket.length <= 2) continue;
    const ranked = [...bucket].sort((a, b) => importanceOf(b, now) - importanceOf(a, now));
    // 前 2 条保留；若其余里有 proven 的，先保护 proven 再谈淘汰
    const keep = ranked.slice(0, 2);
    for (const record of ranked.slice(2)) {
      if (performanceOf(record).proven) { keep.push(record); continue; }
      if (keep.some((item) => item.id === record.id)) continue;
      if (demote.some((item) => item.id === record.id)) continue;
      demote.push({ id: record.id, misses: Number(record.missCount ?? 0), reason: 'scene-crowded:' + key });
    }
  }

  return { quarantine, evict, merge, demote };
}
