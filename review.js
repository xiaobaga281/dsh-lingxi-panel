/**
 * 灵犀 · 记忆复盘（用模型做回归审查）
 *
 * 为什么需要：启发式判据（稀缺度、命中率、类型白名单）只能做粗筛，
 * 它看不到"这条内容对模型来说是不是废话"这种语义问题。
 *
 * 设计要点：
 *  - 只给模型看内容，不给命中率等数字——避免它被"用了很多次"影响判断；
 *  - 模型只做判定，不做写入：所有变更由调用方审核后执行（可回退）；
 *  - 失败一律返回空，绝不影响主流程；
 *  - 每条都要求给出理由，便于用户判断模型是否在胡说。
 */

const REVIEW_SYSTEM = [
  '你是记忆库的审查员。下面给你若干条"AI 助手沉淀的记忆"，请逐条判断。',
  '',
  '对每一条，判断三件事：',
  '1. verdict：',
  '   - keep     = 有价值，保留',
  '   - reclass  = 内容有价值，但类型标错了（给出正确的 kind）',
  '   - drop     = 没有价值，应该清除',
  '2. kind（仅 verdict=reclass 时需要）：constraint / preference / fact / lesson / skill 之一',
  '3. reason：一句话说明理由（不超过 30 字）',
  '',
  '判断标准：',
  '- 模型本来就会做的事（通用流程、常识性建议）→ drop 或降级',
  '- 用户明确表达的要求/偏好 → constraint 或 preference',
  '- 具体环境知识（路径、错误码、配置项、版本坑）→ fact 或 lesson',
  '- 可复用的操作步骤 → skill',
  '- 只是纠正对话的记录、不是可复用知识 → drop',
  '- 含占位符或残缺内容 → drop',
  '',
  '严格输出 JSON 数组，不要任何解释文字、不要 markdown 代码块：',
  '[{"id":"xxx","verdict":"keep|reclass|drop","kind":"...","reason":"..."}]',
].join('\n');

export function createReviewer({ ctx, settingsRef, semantic }) {
  /**
   * 复盘一批记忆。
   * @param {Array<{id,text,kind}>} items 最多 20 条
   * @returns {Promise<{ok:boolean, verdicts:Array, error:string}>}
   */
  async function review(items, { batchSize = 12, onProgress } = {}) {
    const list = (Array.isArray(items) ? items : [])
      .filter((item) => item !== null && typeof item === 'object' && String(item.text ?? '') !== '')
      .slice(0, 60);
    if (list.length === 0) return { ok: true, verdicts: [], error: '' };

    const out = [];
    const errors = [];
    for (let offset = 0; offset < list.length; offset += batchSize) {
      const batch = list.slice(offset, offset + batchSize);
      const payload = batch.map((item, index) => ({
        id: String(item.id ?? ''),
        kind: String(item.kind ?? ''),
        text: String(item.text ?? '').slice(0, 300),
      }));
      const prompt = '请审查下面这些记忆：\n\n' + JSON.stringify(payload, null, 1);
      // 复盘是独立任务：用自己的模型（reviewModel），
      // 也不受"语义召回开关"约束——关掉语义召回仍应能复盘。
      if (typeof onProgress === 'function') {
        try {
          onProgress(Math.min(offset, list.length), list.length);
        } catch {
          // 进度回调不该影响复盘本身
        }
      }
      const raw = await semantic.completeRaw(REVIEW_SYSTEM, prompt, {
        maxTokens: 1200,
        kind: 'review',
        requireEnabled: false,
      });
      if (raw === '') {
        errors.push('empty-reply@' + offset);
        continue;
      }
      const parsed = parseVerdicts(raw);
      if (parsed.length === 0) {
        errors.push('unparsable@' + offset);
        continue;
      }
      // 只接受批次里真实存在的 id，防止模型编造
      const known = new Set(batch.map((item) => String(item.id ?? '')));
      for (const verdict of parsed) {
        const id = String(verdict?.id ?? '');
        if (!known.has(id)) continue;
        const decision = String(verdict?.verdict ?? '');
        if (decision !== 'keep' && decision !== 'reclass' && decision !== 'drop') continue;
        const kind = String(verdict?.kind ?? '');
        const allowed = ['constraint', 'preference', 'fact', 'lesson', 'skill'];
        out.push({
          id,
          verdict: decision,
          kind: decision === 'reclass' && allowed.includes(kind) ? kind : '',
          reason: String(verdict?.reason ?? '').slice(0, 60),
        });
      }
    }
    if (typeof onProgress === 'function') {
      try {
        onProgress(list.length, list.length);
      } catch {
        // 同上
      }
    }
    return { ok: errors.length === 0, verdicts: out, error: errors.join(';') };
  }

  /** 从模型回复里抠出 JSON 数组（容忍代码块与前后废话）。 */
  function parseVerdicts(raw) {
    const text = String(raw ?? '');
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start < 0 || end <= start) return [];
    const slice = text.slice(start, end + 1);
    try {
      const parsed = JSON.parse(slice);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      // 常见脏数据：尾逗号
      try {
        return JSON.parse(slice.replace(/,\s*([\]}])/g, '$1'));
      } catch {
        return [];
      }
    }
  }

  return { review };
}
