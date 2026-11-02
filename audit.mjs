/**
 * 灵犀 · 只读体检（可随时运行）
 *
 *    node audit.mjs
 *
 * 检查真实库的完整性，不改任何数据：
 *   1. 活教训的场景键是否重复（同 tool|code 多条会互相稀释）
 *   2. meta 与正文场景是否一致（历史合并留下的错位）
 *   3. 高频复发场景是否都有教训（覆盖率缺口）
 *   4. 是否还有已废弃来源的记录（启发式抽取）
 *   5. 空正文 / 无来源的可疑记录
 */
import { promises as fsp } from 'node:fs';
import path from 'node:path';
import { homedir } from 'node:os';
import { LingxiMemory } from './memory/index.js';

const dir = process.env.LINGXI_DIR ?? path.join(homedir(), '.dsh', 'lingxi-memory');
const memory = new LingxiMemory({ dir });
await memory.init();

const all = await memory.list({ limit: 5000 });
const live = all.filter((record) => record.status !== 'retired' && record.status !== 'dormant');
const problems = [];

const keyOf = (record) => {
  const meta = record.meta ?? {};
  const match = /当「([^」]+)」遇到「([^」]+)」时/.exec(String(record.text ?? ''));
  return String(match?.[1] ?? meta.tool ?? '') + '|' + String(match?.[2] ?? meta.code ?? '');
};

/* 1) 场景键重复 */
const byKey = new Map();
for (const record of live) {
  const key = keyOf(record);
  if (key === '|') continue;
  if (!byKey.has(key)) byKey.set(key, []);
  byKey.get(key).push(record);
}
for (const [key, records] of byKey.entries()) {
  if (records.length > 1) {
    problems.push({
      check: '重复场景键',
      detail: key + ' × ' + records.length + '（' + records.map((r) => r.status).join('/') + '）',
    });
  }
}

/* 2) meta 与正文错位 */
for (const record of live) {
  const meta = record.meta ?? {};
  if (String(meta.tool ?? '') === '') continue;
  const match = /当「([^」]+)」遇到「([^」]+)」时/.exec(String(record.text ?? ''));
  if (match === null) continue;
  if (match[1] !== String(meta.tool) || match[2] !== String(meta.code ?? '')) {
    problems.push({ check: 'meta/正文错位', detail: (meta.tool ?? '') + '|' + (meta.code ?? '') + ' vs ' + match[1] + '|' + match[2] });
  }
}

/* 3) 覆盖率缺口（复用检索到的失败统计） */
const failures = await memory.failureStats?.();
if (failures !== undefined) {
  for (const entry of failures) {
    if (Number(entry.count ?? 0) < 5) continue;
    const key = String(entry.tool) + '|' + String(entry.code);
    if (!byKey.has(key)) problems.push({ check: '覆盖缺口', detail: key + '（' + entry.count + ' 次）' });
  }
}

/* 3.5) 注入块是否超预算 */
try {
  const status = JSON.parse(await fsp.readFile(path.join(dir, 'injection-status.json'), 'utf8'));
  // 只比较"最近一个注入块"：status.chars 是各会话之和，拿来比预算会误报。
  const chars = Number(status?.lastChars ?? 0);
  const budget = Number(status?.charBudget ?? 0);
  if (budget > 0 && chars > budget) {
    problems.push({ check: '注入块超预算', detail: String(chars) + ' > ' + String(budget) });
  }
} catch {
  // 还没有状态文件时跳过
}

/* 3.6) 同一场景的活教训是否互相矛盾（极性相反） */
const NEG = ['不要', '禁止', '不能', '避免', 'never', "don't"];
const POS = ['要', '必须', '应该', '需要', 'always', 'must'];
const polarity = (text) => {
  const value = String(text ?? '');
  const neg = NEG.some((word) => value.includes(word));
  const pos = POS.some((word) => value.includes(word));
  return neg === pos ? 0 : neg ? -1 : 1;
};
for (const [key, records] of byKey.entries()) {
  const polarities = new Set(records.map((record) => polarity(record.text)));
  if (polarities.has(-1) && polarities.has(1)) {
    problems.push({ check: '同场景矛盾', detail: key + '（' + records.length + ' 条极性相反）' });
  }
}

/* 4) 废弃来源 */
for (const record of live) {
  const sources = (record.provenance ?? []).map((entry) => entry.source);
  if (sources.includes('heuristic-instruction')) {
    problems.push({ check: '废弃来源仍活跃', detail: record.id.slice(0, 10) + ' ' + String(record.text).slice(0, 24) });
  }
}

/* 5) 可疑记录 */
for (const record of live) {
  if (String(record.text ?? '').trim() === '') problems.push({ check: '空正文', detail: record.id.slice(0, 10) });
  if ((record.provenance ?? []).length === 0) problems.push({ check: '无来源', detail: record.id.slice(0, 10) });
}

const counts = { total: all.length, live: live.length, retired: all.filter((record) => record.status === 'retired').length };
console.log('灵犀体检 · ' + dir);
console.log('  记录：总 ' + counts.total + ' · 活跃 ' + counts.live + ' · 退役 ' + counts.retired);
console.log('  活教训场景键：' + byKey.size);

if (problems.length === 0) {
  console.log('\n全部检查通过');
} else {
  console.log('\n发现 ' + problems.length + ' 项：');
  for (const problem of problems.slice(0, 20)) console.log('  - [' + problem.check + '] ' + problem.detail);
}

await fsp.access(dir).catch(() => {});
process.exit(problems.length === 0 ? 0 : 1);
