/**
 * 灵犀 · 语义召回（使用宿主已配置的模型）
 *
 * 设计原则：
 *  - 模型选择永远实时读取：面板自选优先，否则跟随 agentDefaultModel（改配置下一次调用即生效）；
 *  - best-effort 且不阻塞：任何失败/超时/限流都立即回退词法路径，注入绝不等模型；
 *  - 会话隔离：查询扩展的并发去重按"查询文本"分桶，绝不复用其它查询的在途结果；
 *  - 可观测：calls/ok/failed/timeout/latency/model/lastExpansion 全部记账。
 */

const EXPAND_SYSTEM = '你是检索助手。把用户查询扩展成用于记忆检索的关键词：输出 5-10 个同义/相关中文短语或词，每行一个，不要解释，不要序号。';
/** 合并两条同类记忆：融合成一条更完整、更短的表述。 */
const CONSOLIDATE_SYSTEM = '你是记忆整理助手。下面两条记忆说的是同一件事，请融合成一条更完整且更精炼的表述：保留双方所有不重复的信息，去掉重复部分，不要添加新信息，不要解释，只输出融合后的那一句话。';

const KEYWORDS_SYSTEM = '你是检索助手。为下面这条记忆生成 5-8 个语义检索关键词（同义词、相关词、英文缩写），每行一个，不要解释，不要序号。';

/**
 * 由快照推导告警（纯函数，便于回归测试）。
 * 语义召回开着却连续拿不到内容 → 必须让人看见，不能只躺在统计里。
 */
export function semanticAlert(snapshot, { threshold = 2 } = {}) {
  if (snapshot === null || snapshot === undefined) return null;
  if (snapshot.enabled !== true) return null;
  const failures = Number(snapshot.consecutiveFailures ?? 0);
  if (failures < threshold) return null;
  return {
    kind: 'semantic-empty',
    count: failures,
    detail: String(snapshot.lastError ?? 'empty-reply'),
  };
}

export function createSemantic({ ctx, settingsRef }) {
  /** 查询文本 → Promise<string>：按查询去重，不跨查询复用 */
  const inflight = new Map();
  const queryCache = new Map();
  const keywordCache = new Map();
  let lastCallAt = 0;

  const MIN_INTERVAL = 800;
  const CALL_TIMEOUT = 8000;
  const QUERY_TTL = 10 * 60_000;

  const stats = {
    calls: 0,
    ok: 0,
    failed: 0,
    timeout: 0,
    skippedThrottle: 0,
    expandedQueries: 0,
    keywordRuns: 0,
    usedReasoning: 0,
    consecutiveFailures: 0,
    lastFailAt: 0,
    consolidations: 0,
    consolidated: 0,
    lastLatencyMs: 0,
    lastModel: '',
    lastExpansion: '',
    lastError: '',
    lastText: '',
    lastAt: 0,
  };

  const enabled = () => {
    const s = settingsRef();
    return s !== undefined && s !== null && (s?.semantic ?? false) === true;
  };

  /** 实时解析当前模型配置（不缓存） */
  async function currentModel() {
    try {
      const picked = settingsRef()?.semanticModel ?? null;
      if (picked !== null
        && typeof picked.provider === 'string' && picked.provider !== ''
        && typeof picked.model === 'string' && picked.model !== '') {
        return { provider: picked.provider, model: picked.model, source: 'picked' };
      }
      const selector = ctx?.get?.('agentDefaultModel');
      const selection = selector?.currentSelection?.();
      if (selection === undefined || selection === null) return null;
      const provider = String(selection.provider ?? '');
      const model = String(selection.model ?? '');
      if (provider === '' || model === '') return null;
      return { provider, model, source: 'default' };
    } catch {
      return null;
    }
  }

  /** 用 llm.stream 发一次补全；带硬超时，失败返回空串 */
  async function complete(system, user, { maxTokens = 200 } = {}) {
    const model = await currentModel();
    if (model === null) {
      stats.failed += 1;
      stats.consecutiveFailures += 1;
      stats.lastFailAt = Date.now();
      stats.lastError = 'no-model';
      return '';
    }
    const llm = ctx?.get?.('llm');
    if (llm === undefined || typeof llm.stream !== 'function') {
      stats.failed += 1;
      stats.consecutiveFailures += 1;
      stats.lastFailAt = Date.now();
      stats.lastError = 'no-llm-service';
      return '';
    }
    // 配置可能已被改掉：provider 不再注册时给出准确原因，
    // 而不是发一次注定失败的请求后报 empty-reply。
    try {
      const known = llm.listProviders?.() ?? [];
      const ids = (Array.isArray(known) ? known : []).map((entry) => String(entry?.id ?? '')).filter((id) => id !== '');
      if (ids.length > 0 && !ids.includes(model.provider)) {
        stats.failed += 1;
        stats.consecutiveFailures += 1;
        stats.lastFailAt = Date.now();
        stats.lastError = 'provider-not-registered:' + model.provider;
        return '';
      }
    } catch {
      // 列表拿不到就照常尝试
    }
    const started = Date.now();
    stats.calls += 1;
    stats.lastModel = model.provider + '/' + model.model;
    stats.lastModelSource = String(model.source ?? '');
    stats.lastAt = started;

    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = setTimeout(() => {
      try {
        controller?.abort();
      } catch {
        // 忽略
      }
    }, CALL_TIMEOUT);

    try {
      // 严格按 harness 的 GenerateOptions：
      //   system 是顶层字段；messages 是 RequestMessage[]；
      //   每条消息 content 为 ContentBlock[]（{type:"text", text}），并需要 id/role/source。
      // 之前传 {role, content:"字符串"} 会被解析成空消息，模型只回 finish，
      // 表现为"语义召回已开启但零产出"。
      const iterable = llm.stream({
        provider: model.provider,
        model: model.model,
        system,
        messages: [
          {
            id: 'lingxi-semantic-' + String(stats.calls),
            role: 'user',
            content: [{ type: 'text', text: String(user ?? '') }],
            source: { kind: 'user' },
          },
        ],
        maxTokens,
        ...(controller !== null ? { signal: controller.signal } : {}),
      });
      let text = '';
      let reasoning = '';
      for await (const chunk of iterable) {
        if (chunk?.type === 'text-delta' && typeof chunk.text === 'string') {
          text += chunk.text;
        } else if (chunk?.type === 'reasoning-delta' && typeof chunk.text === 'string') {
          reasoning += chunk.text;
        } else if (typeof chunk === 'string') {
          text += chunk;
        } else if (chunk?.type === undefined && typeof chunk?.text === 'string') {
          text += chunk.text;
        }
        if (Date.now() - started > CALL_TIMEOUT) {
          stats.timeout += 1;
          stats.lastError = 'timeout';
          break;
        }
      }
      stats.lastLatencyMs = Date.now() - started;
      // 部分模型只走思考通道；对关键词扩展任务，思考结论同样可用。
      if (text.trim() === '' && reasoning.trim() !== '') {
        text = reasoning.slice(-600);
        stats.usedReasoning = (stats.usedReasoning ?? 0) + 1;
      }
      if (text.trim() === '') {
        stats.failed += 1;
        stats.consecutiveFailures += 1;
        stats.lastFailAt = Date.now();
        if (stats.lastError === '') stats.lastError = 'empty-reply';
        return '';
      }
      stats.ok += 1;
      stats.consecutiveFailures = 0;
      stats.lastError = '';
      stats.lastText = text.slice(0, 80);
      stats.lastFailAt = 0;
      return text;
    } catch (error) {
      stats.lastLatencyMs = Date.now() - started;
      const message = String(error?.message ?? error);
      if (/abort/i.test(message)) {
        stats.timeout += 1;
        stats.lastError = 'timeout';
      } else {
        stats.failed += 1;
        stats.lastError = message.slice(0, 120);
      }
      stats.consecutiveFailures += 1;
      stats.lastFailAt = Date.now();
      return '';
    } finally {
      clearTimeout(timer);
    }
  }

  function parseLines(text) {
    return String(text ?? '')
      .split(/\r?\n/)
      .map((line) => line.replace(/^[-*\d.、)\s]+/, '').trim())
      .filter((line) => line.length >= 2 && line.length <= 40)
      .slice(0, 10);
  }

  /** 限流：不足间隔就直接放弃本次（不等待），保证注入零延迟 */
  function canCallNow() {
    const now = Date.now();
    if (now - lastCallAt < MIN_INTERVAL) {
      stats.skippedThrottle += 1;
      return false;
    }
    lastCallAt = now;
    return true;
  }

  /**
   * 查询扩展：同义关键词并入查询串。
   * 关键修复：并发去重按查询文本分桶（原实现是全局单例，会把 A 会话的扩展结果返回给 B 会话）。
   */
  async function expandQuery(query) {
    if (!enabled()) return '';
    const text = String(query ?? '').trim();
    if (text.length < 2) return '';
    const cached = queryCache.get(text);
    if (cached !== undefined && Date.now() - cached.at < QUERY_TTL) return cached.keywords;
    const pending = inflight.get(text);
    if (pending !== undefined) return pending;
    if (!canCallNow()) return '';
    const task = (async () => {
      try {
        const raw = await complete(EXPAND_SYSTEM, text);
        const keywords = parseLines(raw);
        const merged = keywords.join(' ');
        queryCache.set(text, { at: Date.now(), keywords: merged });
        if (merged !== '') {
          stats.expandedQueries += 1;
          stats.lastExpansion = merged.slice(0, 120);
        }
        // 上限保护：缓存无限增长会吃内存
        if (queryCache.size > 200) {
          const oldest = [...queryCache.entries()].sort((a, b) => a[1].at - b[1].at).slice(0, 50);
          for (const [key] of oldest) queryCache.delete(key);
        }
        return merged;
      } catch {
        return '';
      } finally {
        inflight.delete(text);
      }
    })();
    inflight.set(text, task);
    return task;
  }

  function textHash(text) {
    let hash = 0;
    const value = String(text ?? '');
    for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
    return String(hash);
  }

  /** 写时关键词：每条记忆文本只做一次 */
  async function keywordsFor(text) {
    if (!enabled()) return [];
    const key = textHash(text);
    const cached = keywordCache.get(key);
    if (cached !== undefined) return cached.keywords;
    if (!canCallNow()) return [];
    stats.keywordRuns += 1;
    try {
      const raw = await complete(KEYWORDS_SYSTEM, String(text ?? '').slice(0, 400));
      const keywords = parseLines(raw);
      keywordCache.set(key, { at: Date.now(), keywords });
      if (keywordCache.size > 500) {
        const oldest = [...keywordCache.keys()].slice(0, 100);
        for (const old of oldest) keywordCache.delete(old);
      }
      return keywords;
    } catch {
      return [];
    }
  }

  /**
   * 融合两条同类记忆。失败/为空一律返回空串，调用方回退到"保留证据多的那条"。
   * 这是唯一的写入型语义调用：必须可回退，绝不因模型问题丢记忆。
   */
  async function consolidate(textA, textB) {
    if (!enabled()) return { text: '', merged: false };
    const a = String(textA ?? '').trim();
    const b = String(textB ?? '').trim();
    if (a === '' || b === '') return { text: '', merged: false };
    if (a === b) return { text: a, merged: false };
    if (!canCallNow()) return { text: '', merged: false };
    stats.consolidations += 1;
    try {
      const raw = await complete(CONSOLIDATE_SYSTEM, '记忆 A：' + a + '\n记忆 B：' + b);
      const text = String(raw ?? '')
        .split(/\r?\n/)
        .map((line) => line.replace(/^[-*\d.、)\s]+/, '').trim())
        .filter((line) => line.length >= 4)
        .join(' ')
        .trim();
      // 质量闸：不能比任一方还短太多（说明丢信息），也不能长得离谱
      const minLen = Math.min(a.length, b.length);
      const maxLen = Math.max(a.length, b.length);
      if (text === '') return { text: '', merged: false };
      if (text.length < minLen * 0.6) return { text: '', merged: false };
      if (text.length > maxLen * 1.8) return { text: '', merged: false };
      stats.consolidated += 1;
      return { text, merged: true };
    } catch {
      return { text: '', merged: false };
    }
  }

  /**
   * 原始补全：给复盘这类需要自定义提示词的场景用。
   * 与 expandQuery 共享模型解析、超时与统计，但不做关键词解析。
   */
  async function completeRaw(system, user, { maxTokens = 600 } = {}) {
    if (!enabled()) return '';
    if (!canCallNow()) return '';
    return complete(system, String(user ?? ''), { maxTokens });
  }

  /** 只读快照：面板与体检用 */
  function snapshot() {
    return {
      enabled: enabled(),
      model: stats.lastModel,
      calls: stats.calls,
      ok: stats.ok,
      failed: stats.failed,
      timeout: stats.timeout,
      skippedThrottle: stats.skippedThrottle,
      expandedQueries: stats.expandedQueries,
      keywordRuns: stats.keywordRuns,
      usedReasoning: stats.usedReasoning ?? 0,
      consecutiveFailures: stats.consecutiveFailures,
      lastFailAt: stats.lastFailAt,
      consolidations: stats.consolidations,
      consolidated: stats.consolidated,
      lastLatencyMs: stats.lastLatencyMs,
      lastExpansion: stats.lastExpansion,
      lastError: stats.lastError,
      lastText: stats.lastText,
      lastAt: stats.lastAt,
      cachedQueries: queryCache.size,
      inflight: inflight.size,
    };
  }

  return { isEnabled: enabled, expandQuery, keywordsFor, consolidate, completeRaw, currentModel, snapshot };
}
