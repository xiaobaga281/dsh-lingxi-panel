/**
 * 灵犀 · 记忆注入器（纯本地）
 *
 * 把记忆库接到模型上下文的唯一通路，同时承担写入与反馈：
 *
 *   读：每个 agent（会话）注册一个 scoped prompt section，文本是同步缓存；
 *       缓存在用户消息进入 inbox 时异步刷新（那时才知道本轮要问什么）。
 *   写：tools/result 报错按「工具 + 错误码 + 规范化消息」计数，同一失败第 2 次起
 *       自动沉淀一条 private 记忆；同一失败在沉淀之后再次出现，则加强同一条记忆的证据。
 *   评：注入后用户下一句像纠正 → 这批记忆记 miss；注入后工具成功 → 记 hit。
 *
 * 全部为进程内状态；记忆本身仍落在磁盘记忆库，进程重启不丢。
 */
import { buildRecallTextWithin } from './memory/index.js';
import { expectedToolsFor, lessonTextFor, remedyActionFor, remedyIsSpecific } from './lessons.js';
import { DEFAULT_BUDGETS, sceneOf } from './scenes.js';
import { usableForInjection } from './hygiene.js';
import { deriveTopics } from './memory/retrieve.js';

const SECTION_NAME = 'lingxi-memory';
const CORRECTION = /(不要|别再用|不对|错了|我说了|重做|重新做|还是不行|又错|没改|没生效|你怎么又)/;

/**
 * 失败文本规范化：抹掉路径、数字、引号内容等易变部分，得到"同一场景"的稳定键。
 * 否则每次报错都带不同行号/路径，会沉淀成一堆近似但不同的教训。
 */
export function canonicalFailure(text) {
  let value = String(text ?? '');
  value = value.replace(/[A-Za-z]:\\[^\s，。；;、）)]+/g, '<path>');
  value = value.replace(/\/(?:[^\s/]+\/)+[^\s/]+/g, '<path>');
  value = value.replace(/0x[0-9a-fA-F]+/g, '<hex>');
  value = value.replace(/\b\d+(?:\.\d+)?\b/g, '<n>');
  value = value.replace(/["'`][^"'`]{0,80}["'`]/g, '<q>');
  value = value.replace(/\s+/g, ' ').trim();
  return value.slice(0, 80);
}

export function createInjector({ memory, listWorkspace, now = () => Date.now(), config = {} }) {
  let enabled = config.enabled !== false;
  let charBudget = Number.isFinite(config.charBudget) ? config.charBudget : 700;
  let captureThreshold = Number.isFinite(config.captureThreshold) ? config.captureThreshold : 2;
  let coreRecords = Number.isFinite(config.coreRecords) ? Math.max(0, config.coreRecords) : 3;
  /** 宿主注册了写记忆工具时才有值：提示模型主动记录。 */
  let toolsAvailable = {};

  function setCapabilities(patch = {}) {
    toolsAvailable = { ...toolsAvailable, ...patch };
  }

  /** sessionId → { text, ids, at, pending } */
  const sessions = new Map();
  /** `${sessionId}\u0000${tool}\u0000${code}\u0000${canonical}` → 连续失败次数 */
  const failureCounts = new Map();
  /** 已沉淀过的失败键 → 记忆文本，用于"同一失败再次出现"时加强而不是重复新增 */
  const capturedKeys = new Map();
  /** sessionId → Map(tool → 次数)：用于"最近用过这个工具就把它的教训放进来" */
  const recentTools = new Map();
  /** 每场景的统计与预算：分场景进化用 */
  const sceneStats = new Map();
  const sceneBudgets = new Map();

  function ensureScene(scene) {
    let entry = sceneStats.get(scene);
    if (entry === undefined) {
      entry = { failures: 0, repeats: 0, hits: 0, misses: 0, warnEffective: 0, warnIneffective: 0, injected: 0 };
      sceneStats.set(scene, entry);
    }
    return entry;
  }

  function budgetFor(scene) {
    const override = sceneBudgets.get(scene);
    if (Number.isFinite(override)) return override;
    return DEFAULT_BUDGETS[scene] ?? charBudget;
  }

  /** 会话的主导场景：最近用过的工具里出现最多的那一类。 */
  /** 中英混合的 2-gram：拉丁词保持完整，CJK 字符两两成组。 */
  function coreGramsOf(text) {
    const grams = new Set();
    for (const word of String(text ?? '').toLowerCase().split(/[^\p{L}\p{N}]+/u)) {
      if (word.length === 0) continue;
      if (/^[\p{Script=Latin}\p{N}]+$/u.test(word)) {
        if (word.length >= 2) grams.add(word);
        continue;
      }
      const chars = [...word];
      for (let i = 0; i + 1 < chars.length; i += 1) grams.add(chars[i] + chars[i + 1]);
    }
    return [...grams];
  }

  function dominantScene(sessionId) {
    const counts = new Map();
    for (const [tool, count] of recentTools.get(sessionId)?.entries() ?? []) {
      const scene = sceneOf(tool);
      counts.set(scene, (counts.get(scene) ?? 0) + count);
    }
    let best = 'other';
    let bestCount = -1;
    for (const [scene, count] of counts.entries()) {
      if (count > bestCount) {
        best = scene;
        bestCount = count;
      }
    }
    return best;
  }

  /** 已给出同轮提示、等待结果反馈的失败键：key → { sessionId, ids, at } */
  const warnedPending = new Map();
  /** 本轮注入是否已记过 hit，避免一次注入被多个工具结果重复计数 */
  const hitRecorded = new Set();
  /** sessionId → Set(recordId)：本轮已记过功的记录，避免同一轮重复计数 */
  const credited = new Map();
  /** 已贴过的失败提示键，避免一轮里重复 */
  const warnedKeys = new Set();
  /** 同一调用的稳定签名：工具名 + 参数（键排序、长度截断）。 */
  function stableStringify(value, depth = 0) {
    if (depth > 3) return '[deep]';
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return '[' + value.map((item) => stableStringify(item, depth + 1)).join(',') + ']';
    const keys = Object.keys(value).sort();
    return '{' + keys.map((key) => JSON.stringify(key) + ':' + stableStringify(value[key], depth + 1)).join(',') + '}';
  }

  function callSignature(exec) {
    const tool = String(exec?.name ?? '');
    let args = '';
    try {
      args = String(stableStringify(exec?.arguments ?? null)).slice(0, 300);
    } catch {
      args = '';
    }
    return tool + '|' + args;
  }

  /** 最近失败的调用签名 → { at, code }（10 分钟内有效） */
  const recentFailures = new Map();
  /** 已拒绝过的签名（避免同一次错误被反复拦） */
  const deniedSignatures = new Map();
  const GUARD_WINDOW_MS = 10 * 60_000;
  /** 被拒绝后待观察的调用：sessionId → { tool, at }（下一次同工具结果决定有效/无效） */
  const deniedPending = new Map();
  /** sessionId → 需要先 read 的路径（写入因版本过期/未读而失败后置位） */
  const needsReadBeforeWrite = new Map();
  /** sessionId → 刚刚给出的建议（错误码 + 期望工具），用于衡量是否被采纳 */
  const pendingAdvice = new Map();
  /** sessionId\u0000tool → { code, expected, at }：建议被无视后的升级状态 */
  const escalated = new Map();
  /** code → { adopted, ignored }：哪类提示真正改变了动作 */
  const adviceByCode = new Map();

  /**
   * 工具守卫：同一个调用刚刚原样失败过，就直接拒绝这次重试，并给出换法建议。
   * 同步、无 IO；返回字符串即拒绝（harness 会把理由回给模型）。
   */
  /** 从调用参数里取"目标文件路径"（不同工具字段名不同）。 */
  function targetPathOf(exec) {
    const args = exec?.arguments ?? {};
    const raw = args.path ?? args.file_path ?? args.filePath ?? args.target ?? '';
    return String(raw ?? '').trim();
  }

  function guardCall(exec) {
    stats.guardChecked += 1;
    if (!enabled) return undefined;
    // 升级硬拦：建议被无视且同码再犯后，同工具的下一次调用先拦下来讲清期望动作。
    const escKey = String(exec?.agent?.id ?? '') + '\u0000' + String(exec?.name ?? '');
    const esc = escalated.get(escKey);
    if (esc !== undefined) {
      if (Date.now() - esc.at > GUARD_WINDOW_MS) {
        escalated.delete(escKey);
      } else {
        stats.guardDenied += 1;
        return '刚刚已经提示过（' + esc.code + '），但动作没有改变。这次先做提示里的事：期望用 ' +
          esc.expected.join(' / ') + '，之后再继续其他操作。';
      }
    }

    // 序列守卫：写文件因"版本过期/未读过"失败后，必须先 read 同一个路径。
    const toolName = String(exec?.name ?? '');
    const sessionId = String(exec?.agent?.id ?? '');
    const pendingPath = needsReadBeforeWrite.get(sessionId);
    if (pendingPath !== undefined && (toolName === 'edit' || toolName === 'write')) {
      const target = targetPathOf(exec);
      if (target !== '' && target === pendingPath) {
        stats.guardDenied += 1;
        deniedPending.set(sessionId, { tool: toolName, at: Date.now() });
        return '这次写入之前要先 read「' + pendingPath + '」：上一次写入因内容过期/未读被拒，直接重试不会成功。';
      }
    }

    const signature = callSignature(exec);
    const failure = recentFailures.get(signature);
    if (failure === undefined) return undefined;
    if (Date.now() - failure.at > GUARD_WINDOW_MS) {
      recentFailures.delete(signature);
      return undefined;
    }
    if (deniedSignatures.has(signature)) return undefined;
    deniedSignatures.set(signature, Date.now());
    stats.guardDenied += 1;
    deniedPending.set(String(exec?.agent?.id ?? ''), { tool: String(exec?.name ?? ''), at: Date.now() });
    const action = remedyActionFor(failure.code);
    return '刚才同一个调用失败了（' + (failure.code || '未知错误') + '）。不要原样重试：' + action + '。';
  }

  /** sessionId → 会话级统计：工具调用/失败/注入字数，用于"有没有用"的关联分析 */
  const sessionStats = new Map();
  /** sessionId → Map(recordId → topics)：最近一次注入的主题，供相关性判定 */
  const injectedTopics = new Map();

  function ensureSession(sessionId) {
    let entry = sessionStats.get(sessionId);
    if (entry === undefined) {
      entry = { toolCalls: 0, toolFailures: 0, injectedChars: 0, records: 0, at: Date.now() };
      sessionStats.set(sessionId, entry);
    }
    return entry;
  }

  /** sessionId → 最近一次注入块的摘要，用于核查"到底往模型里塞了什么" */
  const lastBlocks = new Map();
  const stats = {
    injected: 0,
    hits: 0,
    misses: 0,
    captured: 0,
    refined: 0,
    repeatFailures: 0,
    warned: 0,
    warnEffective: 0,
    warnIneffective: 0,
    guardChecked: 0,
    corrections: 0,
    adviceAdopted: 0,
    coreGated: 0,
    adviceIgnored: 0,
    adviceByCode: {},
    correctionPenalized: 0,
    guardDenied: 0,
    guardEffective: 0,
    guardIneffective: 0,
    warnChecked: 0,
    refreshed: 0,
    lastAt: 0,
    lastChars: 0,
    lastBudget: 0,
    errors: 0,
  };

  function slot(sessionId) {
    let entry = sessions.get(sessionId);
    if (entry === undefined) {
      entry = { text: '', ids: [], at: 0, pending: null };
      sessions.set(sessionId, entry);
    }
    return entry;
  }

  /** section 的同步文本：读缓存，绝不 await。 */
  function textFor(sessionId) {
    const entry = sessions.get(sessionId);
    return entry === undefined ? '' : entry.text;
  }

  /** 异步刷新某个会话的记忆块；query 是当前用户输入，用于相关性召回。 */
  async function refresh(sessionId, query = '') {
    if (sessionId === '') return;
    const entry = slot(sessionId);
    if (!enabled) {
      entry.text = '';
      entry.ids = [];
      return;
    }
    if (entry.pending !== null) {
      entry.pending = entry.pending.then(() => refresh(sessionId, query)).catch(() => {});
      return entry.pending;
    }
    const workspaceId = await resolveWorkspace(sessionId);
    const context = { sessionId, workspaceId };
    entry.pending = (async () => {
      try {
        const entries = [];
        const seen = new Set();
        // (0) 常驻核心：最强约束/事实固定在前面，避免换个问法就漏掉。
        if (coreRecords > 0 && typeof memory.listVisible === 'function') {
          try {
            const visible = await memory.listVisible({ context, limit: 60 });
            const coreAll = visible.items
              .filter((record) => record.kind === 'constraint' || record.kind === 'fact')
              .filter((record) => record.status === 'active');
            // 弱相关门：与当前任务毫无词法交集的核心记忆不注入，防止旧任务的经验干扰新任务。
            // 中文没有空格：按 2-gram 切，避免整句无法与正文匹配。
            const coreGrams = coreGramsOf(String(query ?? ''));
            const core = coreAll.filter((record) => {
              // 无词可判（空输入/纯符号）→ 放行（保守）。
              if (coreGrams.length === 0) return true;
              const haystack = (String(record.text ?? '') + ' ' + (record.topics ?? []).join(' ')).toLowerCase();
              return coreGrams.some((gram) => haystack.includes(gram));
            }).slice(0, coreRecords);
            stats.coreGated = (stats.coreGated ?? 0) + Math.max(0, coreAll.length - core.length);
            for (const record of core) {
              if (seen.has(record.id)) continue;
              seen.add(record.id);
              entries.push({ record });
            }
          } catch {
            // 取不到核心记忆就跳过
          }
        }
        // (a) 最近用过/失败过的工具：直接按主题取教训，不依赖用户这句话有没有提到工具名。
        const tools = [...(recentTools.get(sessionId)?.entries() ?? [])]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3);
        if (typeof memory.findByTopic === 'function') {
          for (const [tool] of tools) {
            try {
              const records = await memory.findByTopic('tool:' + tool, { context, limit: 1 });
              for (const record of records) {
                if (record === null || record === undefined || seen.has(record.id)) continue;
                seen.add(record.id);
                entries.push({ record });
              }
            } catch {
              // 单个工具查不到就跳过
            }
          }
        }
        // (b) 再按本轮输入做词法召回，补进没覆盖到的。
        const result = await memory.recall(query, { context, limit: 8, charBudget });
        for (const item of result.items) {
          if (seen.has(item.record.id)) continue;
          seen.add(item.record.id);
          entries.push(item);
        }
        // 写入门控的最后一关：只有"能用"的记录才进上下文（候选需够强，噪音一律不注入）。
        const usable = entries.filter((entry) => usableForInjection(entry.record));
        const fitted = buildRecallTextWithin(usable, budgetFor(dominantScene(sessionId)));
        const block = fitted.text === ''
          ? ''
          : [
              '【灵犀记忆】以下是过往会话/纠正里沉淀下来的经验，按相关度排序。',
              '与本轮无关就忽略；与用户当前指令冲突时，以用户当前指令为准。',
              fitted.text,
            ].join('\n');
        const footer = typeof toolsAvailable.tool === 'string'
          ? '\n如果本轮出现了长期有效的规则、偏好或教训，可调用 ' + toolsAvailable.tool + ' 记下；只记长期有效的，不必每条都记。'
          : '';
        entry.text = block === '' ? '' : block + footer;
        entry.ids = fitted.items.map((item) => item.record.id);
        // 曝光登记：被注入过几次（用于相关命中率，不改置信度）。
        if (typeof memory.noteExposure === 'function') {
          memory.noteExposure(fitted.items.map((item) => item.record.id)).catch(() => {});
        }
        entry.topicsById = new Map(
          fitted.items.map((item) => [item.record.id, Array.isArray(item.record.topics) ? item.record.topics : []]),
        );
        injectedTopics.set(sessionId, entry.topicsById);
        entry.at = now();
        stats.refreshed += 1;
        stats.lastAt = entry.at;
        stats.lastChars = block.length;
        stats.lastBudget = budgetFor(dominantScene(sessionId));
        if (block !== '') stats.injected += 1;
        ensureSession(sessionId).injectedChars = block.length;
        ensureSession(sessionId).records = result.items.length;
        ensureSession(sessionId).at = entry.at;
        lastBlocks.set(sessionId, {
          at: entry.at,
          chars: block.length,
          records: result.items.length,
          preview: block.slice(0, 220),
          text: block,
        });
      } catch {
        stats.errors += 1;
      } finally {
        entry.pending = null;
      }
    })();
    return entry.pending;
  }

  async function resolveWorkspace(sessionId) {
    if (typeof listWorkspace !== 'function') return '';
    try {
      return String((await listWorkspace(sessionId)) ?? '');
    } catch {
      return '';
    }
  }

  /** 用户新消息进入 inbox：先判断上一轮注入是否被纠正（反馈），再用本轮输入刷新记忆块。 */
  function noteTool(sessionId, tool) {
    if (sessionId === '' || tool === '') return;
    let map = recentTools.get(sessionId);
    if (map === undefined) {
      map = new Map();
      recentTools.set(sessionId, map);
    }
    map.set(tool, (map.get(tool) ?? 0) + 1);
    if (map.size > 8) {
      const least = [...map.entries()].sort((a, b) => a[1] - b[1])[0];
      if (least !== undefined) map.delete(least[0]);
    }
  }

  async function onUserMessage(sessionId, messageText) {
    credited.delete(sessionId);
    const entry = slot(sessionId);
    const text = String(messageText ?? '');
    for (const key of [...warnedKeys]) if (key.startsWith(sessionId + '\u0000')) warnedKeys.delete(key);
    if (entry.ids.length > 0) {
      if (CORRECTION.test(text)) {
        stats.misses += 1;
        ensureScene(dominantScene(sessionId)).misses += 1;
        // 只惩罚与纠正内容相关的记忆：提到 read 的纠正不该连无关教训一起判负。
        let correctionTopics = [];
        try {
          correctionTopics = deriveTopics({ text, kind: 'lesson' })
            // kind:/scene: 这类通用主题人人都命中，不能用来判定相关性。
            .filter((topic) => topic.startsWith('tool:') || topic.startsWith('cat:'));
        } catch {
          correctionTopics = [];
        }
        const topicsById = injectedTopics.get(sessionId) ?? entry.topicsById ?? new Map();
        const relevant = [];
        for (const id of entry.ids) {
          const topics = topicsById.get(id) ?? [];
          if (correctionTopics.length === 0) { relevant.push(id); continue; }
          if (topics.some((topic) => correctionTopics.includes(topic))) relevant.push(id);
        }
        stats.lastCorrection = { topics: correctionTopics, relevant, total: entry.ids.length };
        stats.corrections += 1;
        stats.correctionPenalized += Math.max(relevant.length, 0);
        const targets = relevant.length > 0 ? relevant : entry.ids;
        for (const id of targets) {
          await memory.observe(id, { miss: true }).catch(() => {});
        }
      } else if (!hitRecorded.has(sessionId)) {
        hitRecorded.add(sessionId);
        stats.hits += 1;
        ensureScene(dominantScene(sessionId)).hits += 1;
        for (const id of entry.ids) {
          await memory.observe(id, { hit: true }).catch(() => {});
        }
      }
    }
    await refresh(sessionId, text);
  }

  /** 工具结果：失败计数/沉淀/加强；成功则把本轮注入记一次 hit。 */
  async function onToolResult(exec, result) {
    const sessionId = String(exec?.agent?.id ?? '');
    if (sessionId === '') return;
    const toolNameNow = String(exec?.name ?? '');
    const advice = pendingAdvice.get(sessionId);
    if (advice !== undefined) {
      pendingAdvice.delete(sessionId);
      if (Array.isArray(advice.expected) && advice.expected.length > 0) {
        const bucket = adviceByCode.get(advice.code) ?? { adopted: 0, ignored: 0 };
        // 采纳 = 换到期望工具，且不是在重试刚才失败的那个工具本身。
        const adopted = advice.expected.includes(toolNameNow) && toolNameNow !== advice.failedTool;
        if (adopted) {
          stats.adviceAdopted += 1;
          bucket.adopted += 1;
          escalated.delete(sessionId + '\u0000' + toolNameNow);
        } else {
          stats.adviceIgnored += 1;
          bucket.ignored += 1;
          // 升级阶梯：无视建议后若这次调用仍是同码失败，下次同工具调用直接硬拦。
          if (result?.isError === true && String(result?.error?.info?.code ?? '') === advice.code) {
          escalated.set(sessionId + '\u0000' + toolNameNow, { code: advice.code, expected: advice.expected, at: Date.now() });
          }
        }
        adviceByCode.set(advice.code, bucket);
      }
    }
    const failed = result?.isError === true;
    ensureSession(sessionId).toolCalls += 1;
    noteTool(sessionId, String(exec?.name ?? ''));
    if (failed) ensureSession(sessionId).toolFailures += 1;
    if (failed) {
      const tool = String(exec?.name ?? 'tool');
      const code = String(result?.error?.info?.code ?? '');
      const head = canonicalFailure(result?.error?.message ?? '');
      await noteWriteFailure(sessionId, exec, code).catch(() => {});
      const key = `${sessionId}\u0000${tool}\u0000${code}\u0000${head}`;
      hitRecorded.delete(sessionId);
      const scene = sceneOf(tool);
      ensureScene(scene).failures += 1;
      const pendingDeny = deniedPending.get(sessionId);
      if (pendingDeny !== undefined && pendingDeny.tool === tool) {
        deniedPending.delete(sessionId);
        stats.guardIneffective += 1;
      }
      const signature = callSignature(exec);
      recentFailures.set(signature, { at: Date.now(), code });
      deniedSignatures.delete(signature);
      // 上一轮已经提示过、这次还犯：提示判定为无效，并把相关记忆记 miss。
      const pendingWarn = warnedPending.get(key);
      if (pendingWarn !== undefined) {
        warnedPending.delete(key);
        stats.warnIneffective += 1;
        ensureScene(sceneOf(tool)).warnIneffective += 1;
        for (const id of pendingWarn.ids) {
          await memory.observe(id, { miss: true }).catch(() => {});
        }
      }
      // 已经沉淀过还犯：说明记忆没被采纳或不够强 → 加强同一条，而不是再新增一条。
      if (capturedKeys.has(key)) {
        stats.repeatFailures += 1;
        ensureScene(sceneOf(tool)).repeats += 1;
        await reinforceFailure(sessionId, tool, code, head, key);
        return;
      }
      const count = (failureCounts.get(key) ?? 0) + 1;
      failureCounts.set(key, count);
      if (count >= captureThreshold) {
        failureCounts.set(key, 0);
        await captureFailure(sessionId, tool, code, head, key);
      }
      return;
    }
    // 成功且用的是升级里期望的工具 → 解除升级 + 记"迟来采纳"（建议最终起了作用）。
    for (const [escKey, esc] of [...escalated.entries()]) {
      if (!escKey.startsWith(sessionId + '\u0000')) continue;
      if (Array.isArray(esc.expected) && esc.expected.includes(toolNameNow)) {
        escalated.delete(escKey);
        stats.adviceAdopted += 1;
      }
    }

    // 工具成功且提示之后没有再犯同一失败 → 提示判定为有效。
    for (const [key, pending] of [...warnedPending.entries()]) {
      if (pending.sessionId !== sessionId) continue;
      warnedPending.delete(key);
      stats.warnEffective += 1;
      ensureScene(sceneOf(String(exec?.name ?? ''))).warnEffective += 1;
      for (const id of pending.ids) {
        await memory.observe(id, { hit: true }).catch(() => {});
      }
    }
    try {
      const pending = deniedPending.get(sessionId);
      if (pending !== undefined && pending.tool === String(exec?.name ?? '')) {
        deniedPending.delete(sessionId);
        if (result?.isError === true) stats.guardIneffective += 1;
        else stats.guardEffective += 1;
      }
      const signature = callSignature(exec);
      deniedSignatures.delete(signature);
      recentFailures.delete(signature);
    } catch {
      // 签名计算失败不影响其余逻辑
    }
    if (!failed && String(exec?.name ?? '') === 'read') {
      const target = targetPathOf(exec);
      const pendingPath = needsReadBeforeWrite.get(sessionId);
      if (pendingPath !== undefined && target === pendingPath) needsReadBeforeWrite.delete(sessionId);
    }

    const entry = sessions.get(sessionId);
    if (entry !== undefined && entry.ids.length > 0) {
      const tool = String(exec?.name ?? '');
      const topicsById = entry.topicsById ?? new Map();
      const relevant = [];
      for (const id of entry.ids) {
        const topics = topicsById.get(id) ?? [];
        if (topics.includes('tool:' + tool)) relevant.push(id);
      }
      // 全局命中：本轮只记一次（曝光级指标）。
      if (!hitRecorded.has(sessionId)) {
        hitRecorded.add(sessionId);
        stats.hits += 1;
      }
      // 单条命中：只记与本轮成功工具相关的，且同一轮同一条只记一次。
      const creditedThisTurn = credited.get(sessionId) ?? new Set();
      for (const id of relevant) {
        if (creditedThisTurn.has(id)) continue;
        creditedThisTurn.add(id);
        await memory.observe(id, { hit: true }).catch(() => {});
      }
      credited.set(sessionId, creditedThisTurn);
    }
  }

  /** 写入失败（过期/未读）→ 记录必须先读的路径。 */
  async function noteWriteFailure(sessionId, exec, code) {
    if (code !== 'FS_STALE_VERSION' && code !== 'FS_NOT_OBSERVED') return;
    if (String(exec?.name ?? '') !== 'edit' && String(exec?.name ?? '') !== 'write') return;
    const target = targetPathOf(exec);
    if (target === '') return;
    needsReadBeforeWrite.set(sessionId, target);
  }

  async function captureFailure(sessionId, tool, code, head, key) {
    const workspaceId = await resolveWorkspace(sessionId);
    const detail = code !== '' ? code : head;
    const text = lessonTextFor({ tool, code, detail });
    try {
      const written = await memory.remember(
        {
          kind: 'lesson',
          text,
          scope: { kind: 'machine', id: '' },
          origin: { sessionId, workspaceId },
          topics: [`tool:${tool}`, 'kind:lesson'],
          confidence: 0.55,
          evidence: captureThreshold,
          meta: { tool, code, canonical: head },
          provenance: [{ source: 'tool-failure', sessionId, excerpt: detail.slice(0, 120) }],
        },
        { context: { sessionId, workspaceId } },
      );
      if (written?.action === 'created' || written?.action === 'update') {
        stats.captured += 1;
        capturedKeys.set(key, text);
      }
      await refresh(sessionId, '');
    } catch {
      stats.errors += 1;
    }
  }

  async function reinforceFailure(sessionId, tool, code, head, key) {
    const text = capturedKeys.get(key);
    if (text === undefined) return;
    const workspaceId = await resolveWorkspace(sessionId);
    try {
      const written = await memory.remember(
        {
          kind: 'lesson',
          text,
          scope: { kind: 'machine', id: '' },
          origin: { sessionId, workspaceId },
          topics: [`tool:${tool}`, 'kind:lesson'],
          evidence: 1,
          meta: { tool, code, canonical: head },
          provenance: [{ source: 'tool-failure', sessionId, excerpt: head.slice(0, 120) }],
        },
        { context: { sessionId, workspaceId } },
      );
      if (written?.action === 'update') stats.refined += 1;
      await refresh(sessionId, '');
    } catch {
      stats.errors += 1;
    }
  }

  /**
   * 同轮纠错：一次工具失败后，如果记忆库里有与之相关的教训，
   * 就返回一段可直接附加到工具结果 content 里的文本，让模型在下一步就看到。
   * 没有相关记忆就返回 null（不打扰）。
   */
  /**
   * 候选排序：只认"教训/事实"类，且必须命中工具名或错误码，按命中强度排序。
   * 这样不会把"读取/查看文件：做个视频"这类无关技能记录当成失败提示。
   */
  /**
   * 同轮提示的候选排序：只留"真的和这次失败有关"的条目。
   * 判据优先级：主题里带同一个工具 > 正文点名工具 > 命中错误码。
   * 流程型/协作型教训（纠正、重问）不参与工具报错提示，否则就是噪音。
   */
  function rankWarningCandidates(items, tool, code) {
    const toolText = String(tool).toLowerCase();
    const codeText = String(code).toLowerCase();
    const scored = [];
    for (const entry of Array.isArray(items) ? items : []) {
      const record = entry?.record ?? entry;
      if (record === null || record === undefined) continue;
      if (!['lesson', 'fact', 'constraint'].includes(record.kind)) continue;
      const text = String(record.text ?? '');
      const lower = text.toLowerCase();
      const topics = Array.isArray(record.topics) ? record.topics : [];
      const topicHit = toolText !== '' && topics.includes('tool:' + toolText);
      const toolMentioned = toolText !== '' && lower.includes(toolText);
      const codeMentioned = codeText !== '' && lower.includes(codeText);
      // 与本次失败无关的条目直接跳过（这是之前噪音的来源）。
      if (!topicHit && !toolMentioned && !codeMentioned) continue;
      if (!topicHit && !codeMentioned) continue;
      let score = 0;
      if (record.kind === 'lesson') score += 3;
      if (topicHit) score += 4;
      if (toolMentioned) score += 2;
      if (codeMentioned) score += 3;
      if (score < 4) continue;
      const confidence = Number(entry?.effective ?? record.confidence ?? 0);
      scored.push({ record, score: score + confidence, confidence });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 1).map((item) => item.record);
  }

  async function warningFor(exec, result) {
    if (!enabled || result?.isError !== true) return null;
    const sessionId = String(exec?.agent?.id ?? '');
    const tool = String(exec?.name ?? '');
    if (sessionId === '' || tool === '') return null;
    const code = String(result?.error?.info?.code ?? '');
    const head = canonicalFailure(result?.error?.message ?? '');
    const key = sessionId + '\u0000' + tool + '\u0000' + code + '\u0000' + head;
    if (warnedKeys.has(key)) return null;
    stats.warnChecked += 1;
    const workspaceId = await resolveWorkspace(sessionId);
    const context = { sessionId, workspaceId };
    let candidates = [];
    try {
      const recalled = await memory.recall(tool + ' ' + code + ' ' + head, {
        context,
        kinds: ['lesson', 'fact', 'constraint'],
        limit: 4,
        charBudget: 300,
      });
      if (recalled !== null && !recalled.abstain) candidates = recalled.items;
    } catch {
      candidates = [];
    }
    let picked = rankWarningCandidates(candidates, tool, code);
    if (picked.length === 0) {
      if (typeof memory.findByTopic === 'function') {
        try {
          const topicHits = await memory.findByTopic('tool:' + tool, { context, limit: 8 });
          picked = rankWarningCandidates(topicHits, tool, code);
        } catch {
          picked = [];
        }
      }
    }
    if (picked.length === 0) {
      // 库里还没有这条教训，但错误码本身能映射到明确动作：先把动作给模型，
      // 不必等沉淀生效。仅在动作具体时提示，避免泛泛而谈。
      if (remedyIsSpecific(code)) {
        warnedKeys.add(key);
        stats.warned += 1;
        pendingAdvice.set(sessionId, { code, expected: expectedToolsFor(code), failedTool: String(exec?.name ?? ''), at: Date.now() });
        return { text: '【灵犀提示】' + remedyActionFor(code) + '；先核对前置条件再重试。' };
      }
      return null;
    }
    warnedKeys.add(key);
    stats.warned += 1;
    pendingAdvice.set(sessionId, { code, expected: expectedToolsFor(code), failedTool: String(exec?.name ?? ''), at: Date.now() });
    warnedPending.set(key, { sessionId, ids: picked.map((record) => record.id), at: Date.now() });
    if (warnedPending.size > 50) {
      const oldest = [...warnedPending.entries()].sort((a, b) => a[1].at - b[1].at)[0];
      if (oldest !== undefined) warnedPending.delete(oldest[0]);
    }
    const lines = picked.map((record) => '- ' + record.text);
    return {
      text: ['【灵犀提示】这次调用命中了过往同类失败经验：', ...lines, '请对照上面的前置条件再决定下一步，不要直接重试。'].join('\n'),
      ids: picked.map((record) => record.id),
    };
  }

  function drop(sessionId) {
    const outcome = sessionStats.get(sessionId) ?? null;
    sessionStats.delete(sessionId);
    injectedTopics.delete(sessionId);
    sessions.delete(sessionId);
    hitRecorded.delete(sessionId);
    lastBlocks.delete(sessionId);
    recentTools.delete(sessionId);
    for (const [key, pending] of [...warnedPending.entries()]) {
      if (pending.sessionId === sessionId) warnedPending.delete(key);
    }
    for (const key of [...warnedKeys]) if (key.startsWith(sessionId + '\u0000')) warnedKeys.delete(key);
    return outcome;
  }

  function configureScene(scene, patch = {}) {
    if (Number.isFinite(patch.charBudget) && patch.charBudget >= 100) {
      sceneBudgets.set(scene, patch.charBudget);
    }
    return { scene, charBudget: budgetFor(scene) };
  }

  /** 会话级快照：注入字数与记录数（供按轮质量记录）。 */
  function sessionSnapshot(sessionId) {
    const entry = sessionStats.get(String(sessionId ?? ''));
    if (entry === undefined) return { injectedChars: 0, records: 0, toolCalls: 0, toolFailures: 0 };
    return { ...entry };
  }

  function sceneSnapshot() {
    const out = {};
    for (const scene of ['file', 'command', 'web', 'other']) {
      out[scene] = { ...ensureScene(scene), charBudget: budgetFor(scene) };
    }
    return out;
  }

  function configure(patch = {}) {
    if (typeof patch.enabled === 'boolean') enabled = patch.enabled;
    if (Number.isFinite(patch.charBudget) && patch.charBudget >= 100) charBudget = patch.charBudget;
    if (Number.isFinite(patch.captureThreshold) && patch.captureThreshold >= 1) {
      captureThreshold = patch.captureThreshold;
    }
    if (Number.isFinite(patch.coreRecords) && patch.coreRecords >= 0) {
      coreRecords = patch.coreRecords;
    }
    if (!enabled) {
      for (const entry of sessions.values()) entry.text = '';
      lastBlocks.clear();
    }
    return configSnapshot();
  }

  function configSnapshot() {
    return { enabled, charBudget, captureThreshold, coreRecords };
  }

  function statsSnapshot() {
    let active = 0;
    let chars = 0;
    for (const entry of sessions.values()) {
      if (entry.text !== '') active += 1;
      chars += entry.text.length;
    }
    return {
      ...configSnapshot(),
      capturedKeys: capturedKeys.size,
      sessions: sessions.size,
      sessionsWithMemory: active,
      chars,
      ...stats,
      adviceByCode: (() => {
        const summary = {};
        for (const [code, bucket] of adviceByCode.entries()) {
          const total = bucket.adopted + bucket.ignored;
          // 样本 ≥2 就汇总：真实失败提示本来就少，3 太保守。
          if (total < 2) continue;
          summary[code] = { adopted: bucket.adopted, ignored: bucket.ignored, rate: Math.round((bucket.adopted / total) * 1000) / 10 };
        }
        return summary;
      })(),
      trackedFailures: failureCounts.size,
      samples: [...lastBlocks.entries()].slice(-5).map(([sessionId, block]) => ({
        sessionId,
        at: block.at,
        chars: block.chars,
        records: block.records,
        preview: block.preview,
        text: block.text,
      })),
    };
  }

  return {
    sectionName: SECTION_NAME,
    drop,
    configure,
    config: configSnapshot,
    textFor,
    refresh,
    onUserMessage,
    onToolResult,
    sessionSnapshot,
    configureScene,
    sceneSnapshot,
    guardCall,
    setCapabilities,
    warningFor,
    stats: statsSnapshot,
  };
}

/** 从 UserMessage 里取纯文本（content 为块数组）。 */
export function userMessageText(message) {
  const content = message?.content;
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  const parts = [];
  for (const block of content) {
    if (block?.type === 'text' && typeof block.text === 'string') parts.push(block.text);
  }
  return parts.join('\n');
}

/** 便于单测：暴露判据。 */
export function looksLikeCorrection(text) {
  return CORRECTION.test(String(text ?? ''));
}
