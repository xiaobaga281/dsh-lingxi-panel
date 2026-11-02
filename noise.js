/**
 * 灵犀 · 低信号条目去噪
 *
 * 面板里最容易变成噪音的几类东西（都有实证来源）：
 *   1. 占位/测试文案：旧任务池里抽出来的"继续""测试""demo"之类；
 *   2. 过短条目：一句话都不够，检索和阅读都是负收益；
 *   3. 重复簇：同一类事被不同会话重复提名，散成一堆近似条目；
 *   4. 过时低置信：很久没动、从没被用过、置信度还低的候选项；
 *   5. 纯符号/纯数字：没有语义。
 *
 * 原则：不删除数据，只标注 + 默认隐藏。用户点开"显示低信号"仍然能看到全部。
 */
import { normalizeText, textSimilarity } from './memory/schema.js';

const PLACEHOLDER = /^(继续|好的?|嗯+|哦+|ok|okay|test|testing|demo|示例|样例|占位|tbd|foo|bar|todo|\d+)$/i;
const PLACEHOLDER_INNER = /(lorem ipsum|占位符|待补充|待定|测试用例|test data)/i;
const SYMBOL_ONLY = /^[\s\p{P}\p{S}\d]+$/u;

export function scoreNoise(record, { at = Date.now() } = {}) {
  const text = String(record?.text ?? record?.goal ?? record?.action ?? record?.detail ?? '').trim();
  const reasons = [];
  let score = 0;

  if (text.length === 0) {
    return { score: 1, reasons: ['empty'] };
  }
  if (PLACEHOLDER.test(normalizeText(text))) {
    score = Math.max(score, 0.95);
    reasons.push('placeholder');
  }
  if (PLACEHOLDER_INNER.test(text)) {
    score = Math.max(score, 0.7);
    reasons.push('placeholder-inner');
  }
  if (SYMBOL_ONLY.test(text)) {
    score = Math.max(score, 0.85);
    reasons.push('symbol-only');
  }
  if (text.length < 6) {
    score = Math.max(score, 0.6);
    reasons.push('too-short');
  }

  const evidence = Number(record?.evidence ?? 1);
  const confidence = Number(record?.confidence ?? 0.5);
  const used = Number(record?.usedCount ?? 0) + Number(record?.hitCount ?? 0);
  const updatedAt = Number(record?.updatedAt ?? 0);
  const ageDays = updatedAt > 0 ? (at - updatedAt) / 86_400_000 : 0;

  if (evidence <= 1 && confidence < 0.55 && used === 0) {
    score = Math.max(score, 0.45);
    reasons.push('single-shot-low-confidence');
  }
  if (ageDays > 30 && used === 0 && confidence < 0.6) {
    score = Math.max(score, 0.55);
    reasons.push('stale-unused');
  }
  if (record?.status === 'dormant') {
    score = Math.max(score, 0.5);
    reasons.push('dormant');
  }
  if (record?.status === 'retired') {
    score = Math.max(score, 0.9);
    reasons.push('retired');
  }

  return { score: Math.min(1, score), reasons };
}

/**
 * 把近似条目折成一簇：同分组键 + 文本相似度 ≥ threshold。
 * 返回 { items（带 noise 标注与 clusterId）, clusters, hidden }。
 */
export function annotate(items, options = {}) {
  const { at = Date.now(), groupKey = defaultGroupKey, threshold = 0.5, hideAbove = 0.5 } = options;
  const list = Array.isArray(items) ? items : [];
  const clusters = [];
  const annotated = [];

  for (const raw of list) {
    const noise = scoreNoise(raw, { at });
    const key = groupKey(raw);
    let cluster = null;
    for (const candidate of clusters) {
      if (candidate.key !== key) continue;
      if (textSimilarity(candidate.text, raw.text) >= threshold) {
        cluster = candidate;
        break;
      }
    }
    if (cluster === null) {
      cluster = { id: `c${clusters.length + 1}`, key, text: raw.text, items: [] };
      clusters.push(cluster);
    }
    cluster.items.push(raw);
    annotated.push({ ...raw, noise, clusterId: cluster.id });
  }

  // 一簇里保留信息量最大的一条作为代表，其余标成 duplicate。
  for (const cluster of clusters) {
    if (cluster.items.length <= 1) continue;
    const ranked = [...cluster.items].sort((a, b) => scoreStrength(b) - scoreStrength(a));
    for (const item of ranked.slice(1)) {
      const target = annotated.find((entry) => entry.id === item.id);
      if (target === undefined) continue;
      target.noise = {
        score: Math.max(target.noise.score, 0.4),
        reasons: [...target.noise.reasons, 'duplicate-in-cluster'],
      };
      target.clusterSize = cluster.items.length;
    }
    const representative = annotated.find((entry) => entry.id === ranked[0].id);
    if (representative !== undefined) representative.clusterSize = cluster.items.length;
  }

  const hidden = annotated.filter((entry) => entry.noise.score >= hideAbove).length;
  return { items: annotated, clusters: clusters.length, hidden };
}

function scoreStrength(record) {
  return Number(record?.evidence ?? 1) * 2 + Number(record?.confidence ?? 0) * 3 + Number(record?.usedCount ?? 0);
}

function defaultGroupKey(record) {
  // 按类型聚簇而不是按分类：同一件事常被不同会话记到不同 category 下。
  return String(record?.kind ?? '');
}

export function isNoisy(entry, threshold = 0.5) {
  return (entry?.noise?.score ?? 0) >= threshold;
}



