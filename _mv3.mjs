import { readFileSync, writeFileSync } from 'node:fs';

let lines = readFileSync('client.js', 'utf8').split('\n');

/* ---- 步骤 1：把存储卡（含首尾）从卫生 IIFE 内剪出 ---- */
const storageStartIdx = lines.findIndex((l) => l.includes("t('storageTitle'), hint: t('storageHint"));
const storageEndIdx = lines.findIndex((l, i) => i > storageStartIdx && l.includes("t('storageMigrate')"));
if (storageStartIdx < 0 || storageEndIdx < 0) {
  console.error('storage block not found', storageStartIdx, storageEndIdx);
  process.exit(1);
}
// 存储块 = storageStartIdx .. storageEndIdx（含）
const storageBlock = lines.slice(storageStartIdx, storageEndIdx + 1);
// 块尾 `))));`（含外层闭合）→ `))),`（Card 闭合 + 列表逗号）；但外层闭合是什么要靠验证
const tailLine = storageBlock[storageBlock.length - 1];
console.log('storage tail:', JSON.stringify(tailLine.trim().slice(-40)));

// 从原位删除
lines.splice(storageStartIdx, storageBlock.length);

/* ---- 步骤 2：找到卫生 IIFE 的闭合 `})(),`（storageStartIdx 之后的第一个）---- */
const iifeCloseIdx = lines.findIndex((l, i) => i >= storageStartIdx && l.trim() === '})(),');
if (iifeCloseIdx < 0) {
  console.error('hygiene IIFE close not found');
  process.exit(1);
}
// 存储块插到 IIFE 闭合之后（成为 Collapsible/栈的独立元素）
const insertAt = iifeCloseIdx + 1;
// 块尾处理：原 `))));` 的第 4 个 `)` 属于外层——移出后改为 `)),`（Card 闭合 + 列表逗号）
const fixedBlock = storageBlock.map((l, i) => (i === storageBlock.length - 1 ? l.replace(/\)\)\);$/, ')),') : l));
lines.splice(insertAt, 0, ...fixedBlock);

console.log('storage moved: was', storageStartIdx + 1, '-> now after', iifeCloseIdx + 1);

writeFileSync('client.js', lines.join('\n'), 'utf8');
