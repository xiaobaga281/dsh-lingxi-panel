/**
 * 灵犀 · 检索质量基准（本地、可复算）
 *
 * 目的：不靠"感觉有用"来评价记忆库。固定一组查询与期望结果，测：
 *   - recall@3：期望的记忆是否进前三
 *   - 弃答准确率：无关查询是否真的说"没有"
 *   - 场景键命中：按 tool|code 查询时是否命中原场景教训
 */
import assert from 'node:assert/strict';
import { promises as fsp } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { LingxiMemory } from './memory/index.js';

const root = await fsp.mkdtemp(path.join(tmpdir(), 'lingxi-eval-'));
const memory = new LingxiMemory({ dir: path.join(root, 'eval') });
await memory.init();

const seed = [
  ['constraint', '回答不要用表格，用短句', 'global'],
  ['preference', '先借鉴市场先进做法再转化', 'global'],
  ['fact', '本机输出目录是 D 盘', 'global'],
  ['lesson', '当「read」遇到「FS_NOT_FOUND」时：先用 glob 确认路径', 'global'],
  ['lesson', '当「edit」遇到「FS_STALE_VERSION」时：写前先 read', 'global'],
  ['lesson', '当「web_fetch」遇到「WEB_PROVIDER_ERROR」时：换更短的检索词', 'global'],
  ['skill', '研究流程：检索 → 归纳 → 验证 → 落地', 'global'],
  ['lesson', '改文件之前先 read 一次当前内容，避免版本过期', 'global'],
];
for (const [kind, text, sharing] of seed) {
  await memory.remember({
    kind,
    text,
    scope: { kind: 'machine', id: '' },
    sharing,
    evidence: 3,
    meta: /^当「(.+)」遇到「(.+)」时/.exec(text)
      ? { tool: /^当「(.+)」遇到「(.+)」时/.exec(text)[1], code: /^当「(.+)」遇到「(.+)」时/.exec(text)[2] }
      : {},
  });
}
// 全部转正，模拟"已被确认"的库
for (const record of await memory.list({ limit: 100 })) {
  await memory.confirm(record.id, 'accept');
}

const cases = [
  ['read 找不到文件怎么办', '先用 glob 确认路径'],
  ['edit 版本过期', '写前先 read'],
  ['web_fetch 报错', '换更短的检索词'],
  ['回答格式有什么要求', '不要用表格'],
  ['本机输出目录', 'D 盘'],
  ['做方案应该怎么做', '先借鉴市场先进做法'],
];

let hit = 0;
const details = [];
for (const [query, expected] of cases) {
  const result = await memory.recall(query, { limit: 3, context: { sessionId: '', workspaceId: '' } });
  const texts = result.items.map((item) => item.record.text);
  const ok = texts.some((text) => text.includes(expected));
  if (ok) hit += 1;
  details.push({ query, expected, ok, top: texts.slice(0, 2) });
}

const negatives = ['量子色动力学的渐近自由', '推荐一部科幻电影', '今天股票行情如何'];
let abstained = 0;
for (const query of negatives) {
  const result = await memory.recall(query, { limit: 3, context: { sessionId: '', workspaceId: '' } });
  if (result.abstain === true) abstained += 1;
}

const recall3 = hit / cases.length;
const abstainRate = abstained / negatives.length;

console.log('检索质量基准');
for (const row of details) {
  console.log('  ' + (row.ok ? 'ok ' : 'FAIL') + '  ' + row.query + ' -> ' + (row.top[0] ?? '—').slice(0, 34));
}
console.log('  recall@3 = ' + recall3.toFixed(2) + '（' + hit + '/' + cases.length + '）');
console.log('  abstain  = ' + abstainRate.toFixed(2) + '（' + abstained + '/' + negatives.length + '）');

assert.ok(recall3 >= 0.8, 'recall@3 too low: ' + recall3);
assert.equal(abstainRate, 1, 'negative queries must abstain');
console.log('\n通过：检索基准达到阈值');

await fsp.rm(root, { recursive: true, force: true });
