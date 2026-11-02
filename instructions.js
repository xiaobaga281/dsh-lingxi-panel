/**
 * 灵犀 · 从用户消息里提取规则（纯本地启发式，无模型调用）
 *
 * 为什么需要：现在只会从"失败"和"纠正"里学，用户明确说过的规则（"以后都用 pnpm"、
 * "不要动那个目录"）反而没进记忆库。没有云端 LLM，就用保守的规则抽取：
 * 只取含明确指令词、且不是疑问句的短句；宁可少抓，不要抓错。
 */
const DIRECTIVE = /(记住|以后|今后|下次|往后|总是|永远|一定要|必须|务必|不要|别|禁止|不能|不得|避免|只用|统一用|改用)/;
const NEGATIVE = /(不要|别|禁止|不能|不得|避免)/;
const PREFERENCE = /(喜欢|偏好|更希望|更喜欢|习惯|倾向于|最好)/;
const QUESTION = /[?？]\s*$/;

export function extractInstructions(text, { limit = 2, minLength = 6, maxLength = 120 } = {}) {
  const raw = String(text ?? '');
  if (raw.trim() === '') return [];
  // 按句末标点与换行切句，保留原句内容
  const sentences = raw
    .split(/(?<=[。！？!?；;])|\n+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence !== '');
  const picked = [];
  const seen = new Set();
  for (const sentence of sentences) {
    if (sentence.length < minLength || sentence.length > maxLength) continue;
    if (QUESTION.test(sentence)) continue;
    if (sentence.includes('？') || sentence.includes('?')) continue;
    if (!DIRECTIVE.test(sentence) && !PREFERENCE.test(sentence)) continue;
    // 去掉常见寒暄/语气前缀，保留可执行部分
    const cleaned = sentence
      .replace(/^(好的?|嗯+|行|ok|okay)[，,。\s]*/i, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (cleaned.length < minLength) continue;
    if (seen.has(cleaned)) continue;
    seen.add(cleaned);
    const kind = PREFERENCE.test(cleaned) && !NEGATIVE.test(cleaned) ? 'preference' : 'constraint';
    picked.push({ text: cleaned, kind });
    if (picked.length >= limit) break;
  }
  return picked;
}
