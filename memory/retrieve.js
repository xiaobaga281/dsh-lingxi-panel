/**
 * 灵犀记忆库 · 检索
 *
 * 本地词法检索：BM25（字符 bigram，中文免分词）+ 结构化信号
 * （置信度、作用域匹配、新近度、使用频次）。最后做一次主题级去冗余，
 * 让注入的前 k 条不是同一个意思的五种说法。
 */
import { bigrams, effectiveConfidence, isCurrent, mayInject, normalizeText, textSimilarity } from './schema.js';

const K1 = 1.2;
const B = 0.75;

/** 默认权重：可被调用方按场景覆盖（例如"排错"场景提高向量与置信度权重）。 */
export const DEFAULT_WEIGHTS = {
  lexical: 2.0,
  confidence: 1.2,
  scope: 0.9,
  recency: 0.5,
  usage: 0.35,
};

export function tokenize(text) {
  const tokens = [];
  const value = String(text ?? '').toLowerCase();
  const latin = value.match(/[a-z0-9_./-]{2,}/g) ?? [];
  for (const word of latin) tokens.push(word);
  for (const gram of bigrams(normalizeText(value))) tokens.push(gram);
  return tokens;
}

/** 为一个查询建一次性倒排索引；记忆规模在万级以内，这个成本可以忽略。 */
export function buildIndex(records) {
  const docs = [];
  const df = new Map();
  for (const record of records) {
    const tokens = tokenize(`${record.text} ${record.topics.join(' ')} ${record.kind}`);
    const tf = new Map();
    for (const token of tokens) tf.set(token, (tf.get(token) ?? 0) + 1);
    for (const token of tf.keys()) df.set(token, (df.get(token) ?? 0) + 1);
    docs.push({ record, tf, length: tokens.length });
  }
  const averageLength = docs.length > 0
    ? Math.max(1, docs.reduce((sum, doc) => sum + doc.length, 0) / docs.length)
    : 1;
  return { docs, df, averageLength, total: docs.length };
}

function bm25(index, doc, queryTokens) {
  const n = Math.max(1, index.total);
  let score = 0;
  for (const token of queryTokens) {
    const df = index.df.get(token) ?? 0;
    if (df === 0) continue;
    const idf = Math.log(1 + (n - df + 0.5) / (df + 0.5));
    const tf = doc.tf.get(token) ?? 0;
    if (tf === 0) continue;
    const denominator = tf + K1 * (1 - B + (B * doc.length) / index.averageLength);
    score += idf * ((tf * (K1 + 1)) / denominator);
  }
  return score;
}

/**
 * 作用域与共享闸门：委托给 schema.mayInject，保证"跨会话不串门"只有一处判据。
 * 这里是唯一入口——检索、列表、面板都不允许绕开它自己判断。
 */
export function scopeApplies(record, context, at = Date.now()) {
  return mayInject(record, context, at);
}

/**
 * 检索入口：RRF 融合 + 结构化重排 + 弃答判定。
 *
 * 词法与向量两路各自排序，用 Reciprocal Rank Fusion（k=60）融合——比加权求和更稳，
 * 因为它只用名次、不吃两路分数的量纲差异；融合后再叠加置信度/作用域/使用频次这类
 * 结构化信号。两路信号都弱时明确返回 abstain，让调用方"承认不知道"而不是硬凑一条。
 *
 * @param {object[]} records 记忆记录
 * @param {string} query 自然语言查询；空查询等于"按重要性列出"（用于常驻记忆块）
 * @param {object} [options] { context, kinds, statuses, limit, charBudget, weights, at }
 * @returns {{items:object[], confident:boolean, abstain:boolean, topScore:number}}
 */
/**
 * 从查询文本推导主题：命中工具名就给 `tool:x`，命中场景词就给 `scene:y`，
 * 提到"教训/规则/偏好"再补一个 kind 主题。
 * 这样"read 又报错了"能直接命中原先按工具沉淀的教训，不依赖中文 bigram 恰好匹配。
 */
const CODE_HINTS = [
  [/(找不到|不存在|没有这个文件|文件不存在)/, 'FS_NOT_FOUND'],
  [/(版本|过期|已被修改)/, 'FS_STALE_VERSION'],
  [/(超时|timeout)/i, 'TOOL_TIMEOUT'],
  [/(权限|拒绝访问)/, 'EACCES'],
  [/(搜索失败|搜不到)/, 'SEARCH_FAILED'],
  [/(重定向|跳转被拦)/, 'WEB_REDIRECT_BLOCKED'],
];

export function inferCodeHints(query) {
  const text = String(query ?? '');
  const codes = new Set();
  for (const [pattern, code] of CODE_HINTS) {
    if (pattern.test(text)) codes.add(code);
  }
  return [...codes];
}

export function deriveQueryTopics(query) {
  const text = String(query ?? '');
  const lower = text.toLowerCase();
  const topics = new Set();
  for (const tool of TOOL_HINTS) if (lower.includes(tool)) topics.add(`tool:${tool}`);
  for (const [hint, topic] of SCENE_HINTS) if (text.includes(hint)) topics.add(topic);
  if (/(教训|踩坑|报错|失败)/.test(text)) topics.add('kind:lesson');
  if (/(规则|约束|必须|不要|禁止)/.test(text)) topics.add('kind:constraint');
  if (/(偏好|希望|喜欢)/.test(text)) topics.add('kind:preference');
  // 问“该怎么做/有什么方案”时，偏好型记忆往往正是答案，补一条意图主题。
  if (/(怎么办|怎么做|方案|建议|应该|最好)/.test(text)) topics.add('kind:preference');
  if (/(教训|踩坑|报错|失败|出错|找不到|超时)/.test(text)) topics.add('kind:lesson');
  if (/(技能|流程|步骤)/.test(text)) topics.add('kind:skill');
  return [...topics];
}

export function search(records, query, options = {}) {
  const {
    context = null,
    kinds = null,
    statuses = ['active', 'candidate'],
    limit = 8,
    charBudget = 1200,
    weights = DEFAULT_WEIGHTS,
    at = Date.now(),
  } = options;

  const candidates = records.filter((record) => {
    if (Array.isArray(statuses) && statuses.length > 0 && !statuses.includes(record.status)) return false;
    if (Array.isArray(kinds) && kinds.length > 0 && !kinds.includes(record.kind)) return false;
    if (!isCurrent(record, at)) return false;
    return scopeApplies(record, context);
  });
  if (candidates.length === 0) return { items: [], confident: false, abstain: true, topScore: 0 };

  const index = buildIndex(candidates);
  const queryTokens = tokenize(query);
  const rawLexical = index.docs.map((doc) => (queryTokens.length === 0 ? 0 : bm25(index, doc, queryTokens)));
  const maxLexical = Math.max(...rawLexical, 0.0001);

  const lexicalRanks = rankOf(rawLexical, (value) => value > 0.0001);
  const K = 60;

  const queryEmptyEarly = queryTokens.length === 0;
  const queryTopics = queryEmptyEarly ? [] : deriveQueryTopics(query);
  const codeHints = queryEmptyEarly ? [] : inferCodeHints(query);
  const fused = index.docs.map((doc, i) => {
    const record = doc.record;
    let rrf = 0;
    if (lexicalRanks.has(i)) rrf += 1 / (K + lexicalRanks.get(i));
    const lexical = rawLexical[i] / maxLexical;
    const vector = 0;
    const effective = effectiveConfidence(record, at);
    const scopeBoost = record.scope.kind === 'machine' ? 1 : 1.08;
    const usage = Math.min(1, Math.log1p(record.usedCount + record.hitCount) / 2);
    const structural =
      weights.confidence * effective + weights.scope * scopeBoost + weights.usage * usage;
    // 查询非空时给词法命中加一笔，否则排序会被置信度主导，真正相关的反而排在后面。
    const lexicalBonus = queryEmptyEarly ? 0 : lexical * 3;
    // 主题命中：与"最近用过的工具/场景"精确对齐的教训优先，
    // 弥补中文短句词法召回不稳定的问题。
    const topicHit = queryTopics.filter((topic) => Array.isArray(record.topics) && record.topics.includes(topic));
    let topicBonus = topicHit.length === 0 ? 0 : 2.5 + 0.8 * Math.min(2, topicHit.length - 1);
    if (topicHit.some((topic) => topic.startsWith('tool:'))) topicBonus += 3;
    // 实测可靠性：被采纳过（hit）加分，被证伪过（miss）减分。
    // 这是"越用越聪明"的排序侧闭环：有用的记忆自然浮上来，错的沉下去。
    const rawHits = Number(record.hitCount ?? 0);
    const rawMisses = Number(record.missCount ?? 0);
    const exposures = Number(record.exposures ?? 0);
    // 曝光感知：命中数不能超过被注入的次数（历史虚高按曝光封顶）。
    const hits = exposures > 0 ? Math.min(rawHits, exposures) : rawHits;
    const misses = exposures > 0 ? Math.min(rawMisses, exposures) : rawMisses;
    const denominator = Math.max(exposures, hits + misses) + 5;
    const reliability = (hits - misses) / denominator;
    const reliabilityBonus = Math.max(-0.8, Math.min(0.8, reliability));
    // 查询里的中文意图若对应到某个错误码，命中该错误码的记忆再加权。
    const recordCode = String(record.meta?.code ?? '');
    const textHasCode = codeHints.some((code) => recordCode === code || String(record.text ?? '').includes(code));
    const codeBonus = textHasCode ? 4 : 0;
    const score = rrf * 100 + structural + lexicalBonus + topicBonus + reliabilityBonus + codeBonus;
    return { record, score, lexical, vector, effective, topicHit: topicHit.length };
  });

  fused.sort((a, b) => b.score - a.score || b.effective - a.effective);

  const top = fused[0];
  const queryEmpty = queryTokens.length === 0;
  // 弃答：查询存在时，词法要有命中、且**前几名里**至少一条的实测置信够高，就不硬塞记忆。
  // 只看第一名会误判：长查询里排第一的可能是一条低置信记录，把整批真实相关的都拖成 abstain。
  const topEffective = Math.max(
    0,
    ...fused.slice(0, 3).map((entry) => entry.effective),
  );
  const hasLexical =
    fused.slice(0, 5).some((entry) => entry.lexical >= 0.18) ||
    fused.slice(0, 5).some((entry) => Number(entry.topicHit ?? 0) > 0);
  const confident = queryEmpty
    ? topEffective >= 0.3
    : hasLexical && topEffective >= 0.25;

  // 主题级去冗余：同一主题最多留两条，且与已选结果过于相似的跳过。
  const picked = [];
  const perTopic = new Map();
  let chars = 0;
  for (const entry of fused) {
    if (picked.length >= limit) break;
    if (entry.score <= 0 && picked.length > 0) break;
    if (picked.some((kept) => textSimilarity(kept.record.text, entry.record.text) >= 0.88)) continue;
    let blocked = false;
    for (const topic of entry.record.topics) {
      if ((perTopic.get(topic) ?? 0) >= 2) {
        blocked = true;
        break;
      }
    }
    if (blocked) continue;
    if (chars + entry.record.text.length > charBudget && picked.length > 0) continue;
    chars += entry.record.text.length;
    for (const topic of entry.record.topics) perTopic.set(topic, (perTopic.get(topic) ?? 0) + 1);
    picked.push(entry);
  }

  return { items: picked, confident, abstain: !confident || picked.length === 0, topScore: top?.score ?? 0 };
}

/** 只按名次生成 rank 表，供 RRF 使用。 */
function rankOf(values, accept) {
  const order = values
    .map((value, index) => ({ value, index }))
    .filter((entry) => accept(entry.value))
    .sort((a, b) => b.value - a.value);
  const ranks = new Map();
  order.forEach((entry, i) => ranks.set(entry.index, i + 1));
  return ranks;
}

/** 从文本里推导检索键：工具名、场景、错误特征。不追求完美，只求可命中。 */
const TOOL_HINTS = ['pwsh', 'bash', 'read', 'edit', 'write', 'glob', 'grep', 'web_search', 'web_fetch', 'skill', 'subagent', 'workflow', 'present'];
const SCENE_HINTS = [
  ['视频', 'scene:video'],
  ['web', 'scene:web'],
  ['插件', 'scene:plugin'],
  ['安装', 'scene:install'],
  ['路径', 'scene:path'],
  ['编码', 'scene:encoding'],
  ['端口', 'scene:port'],
  ['权限', 'scene:permission'],
  ['中文', 'scene:zh'],
  ['样式', 'scene:style'],
];

export function deriveTopics({ text, kind, meta } = {}) {
  const topics = [];
  const lower = String(text ?? '').toLowerCase();
  for (const tool of TOOL_HINTS) if (lower.includes(tool)) topics.push(`tool:${tool}`);
  for (const [hint, topic] of SCENE_HINTS) if (String(text ?? '').includes(hint)) topics.push(topic);
  const category = meta?.category;
  if (typeof category === 'string' && category !== '') topics.push(`cat:${category}`);
  if (kind) topics.push(`kind:${kind}`);
  return topics.slice(0, 8);
}

