/**
 * 灵犀 · 语义召回（使用宿主已配置的模型）
 *
 * 设计原则：
 *  - 模型选择永远实时读取 agentDefaultModel.currentSelection()：用户改配置，下一次调用立即跟随；
 *  - best-effort：模型不可用 / 超时 / 输出不可解析 → 静默回退词法路径，绝不阻塞注入；
 *  - 节流：查询扩展按查询文本缓存 + 最小间隔；写时关键词每条记忆只做一次。
 */

const EXPAND_SYSTEM = '你是检索助手。把用户查询扩展成用于记忆检索的关键词：输出 5-10 个同义/相关中文短语或词，每行一个，不要解释，不要序号。';
const KEYWORDS_SYSTEM = '你是检索助手。为下面这条记忆生成 5-8 个语义检索关键词（同义词、相关词、英文缩写），每行一个，不要解释，不要序号。';

export function createSemantic({ ctx, settingsRef }) {
  let inflightQuery = null;
  const queryCache = new Map(); // queryText -> { at, keywords }
  const keywordCache = new Map(); // textHash -> { at, keywords }
  let lastCallAt = 0;
  const MIN_INTERVAL = 5000;
  const CALL_TIMEOUT = 12000;
  const QUERY_TTL = 10 * 60_000;
  const KEYWORD_TTL = Infinity;

  const enabled = () => {
    const s = settingsRef();
    return s !== undefined && (s?.semantic ?? false) === true;
  };

  /** 实时解析当前模型配置（不缓存：用户改配置立即生效） */
  async function currentModel() {
    try {
      // 面板选择的模型优先（用户自选权）；否则跟随当前默认模型（实时读取，改配置立即生效）。
      const picked = settingsRef()?.semanticModel ?? null;
      if (picked !== null && typeof picked.provider === 'string' && picked.provider !== '' && typeof picked.model === 'string' && picked.model !== '') {
        return { provider: picked.provider, model: picked.model };
      }
      const selector = ctx?.get?.('agentDefaultModel');
      const selection = selector?.currentSelection?.();
      if (selection === undefined || selection === null) return null;
      const provider = String(selection.provider ?? '');
      const model = String(selection.model ?? '');
      if (provider === '' || model === '') return null;
      return { provider, model };
    } catch {
      return null;
    }
  }

  /** 用 llm.stream 发一次补全，收集文本；失败返回空串 */
  async function complete(system, user) {
    const model = await currentModel();
    if (model === null) return '';
    const llm = ctx?.get?.('llm');
    if (llm === undefined || typeof llm.stream !== 'function') return '';
    try {
      const iterable = llm.stream({
        provider: model.provider,
        model: model.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        maxTokens: 200,
      });
      let text = '';
      const deadline = Date.now() + CALL_TIMEOUT;
      for await (const chunk of iterable) {
        text += typeof chunk === 'string' ? chunk : (chunk?.delta ?? chunk?.text ?? chunk?.content ?? '');
        if (Date.now() > deadline) break;
      }
      return text;
    } catch {
      return '';
    }
  }

  function parseLines(text) {
    return String(text ?? '')
      .split(/\r?\n/)
      .map((line) => line.replace(/^[-*\d.\s]+/, '').trim())
      .filter((line) => line.length >= 2 && line.length <= 40)
      .slice(0, 10);
  }

  async function throttle() {
    const wait = lastCallAt + MIN_INTERVAL - Date.now();
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    lastCallAt = Date.now();
  }

  /** 查询扩展：同义关键词并入查询串（按查询文本缓存 10 分钟） */
  async function expandQuery(query) {
    if (!enabled()) return '';
    const text = String(query ?? '').trim();
    if (text.length < 2) return '';
    const cached = queryCache.get(text);
    if (cached !== undefined && Date.now() - cached.at < QUERY_TTL) return cached.keywords;
    if (inflightQuery !== null) return inflightQuery;
    inflightQuery = (async () => {
      try {
        await throttle();
        const raw = await complete(EXPAND_SYSTEM, text);
        const keywords = parseLines(raw);
        const merged = keywords.join(' ');
        queryCache.set(text, { at: Date.now(), keywords: merged });
        return merged;
      } catch {
        return '';
      } finally {
        inflightQuery = null;
      }
    })();
    return inflightQuery;
  }

  /** 写时关键词：为记忆文本生成语义关键词（每条文本只做一次） */
  function textHash(text) {
    let hash = 0;
    const value = String(text ?? '');
    for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
    return String(hash);
  }

  async function keywordsFor(text) {
    if (!enabled()) return [];
    const key = textHash(text);
    const cached = keywordCache.get(key);
    if (cached !== undefined) return cached.keywords;
    try {
      await throttle();
      const raw = await complete(KEYWORDS_SYSTEM, String(text ?? '').slice(0, 400));
      const keywords = parseLines(raw);
      keywordCache.set(key, { at: Date.now(), keywords });
      return keywords;
    } catch {
      return [];
    }
  }

  return { isEnabled: enabled, expandQuery, keywordsFor, currentModel };
}
