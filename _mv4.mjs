import { readFileSync, writeFileSync } from 'node:fs';

let lines = readFileSync('client.js', 'utf8').split('\n');

const storageStartIdx = lines.findIndex((l) => l.includes("t('storageTitle'), hint: t('storageHint"));
const storageEndIdx = lines.findIndex((l, i) => i > storageStartIdx && l.includes("t('storageMigrate')"));
if (storageStartIdx < 0 || storageEndIdx < 0) {
  console.error('storage block not found');
  process.exit(1);
}
const storageBlock = lines.slice(storageStartIdx, storageEndIdx + 1);
console.log('storage tail before:', JSON.stringify(storageBlock[storageBlock.length - 1].trim().slice(-30)));

// 从原位删除
lines.splice(storageStartIdx, storageBlock.length);

// IIFE 闭合 `})(),` 之后插入：块保持原括号数，仅 `;` → `,`
const iifeCloseIdx = lines.findIndex((l, i) => i >= storageStartIdx && l.trim() === '})(),');
if (iifeCloseIdx < 0) {
  console.error('IIFE close missing');
  process.exit(1);
}
const fixedBlock = storageBlock.map((l, i) => (i === storageBlock.length - 1 ? l.replace(/\);$/, '),' ) : l));
const insertAt = iifeCloseIdx + 1;
lines.splice(insertAt, 0, ...fixedBlock);

console.log('storage tail after:', JSON.stringify(fixedBlock[fixedBlock.length - 1].trim().slice(-30)));
writeFileSync('client.js', lines.join('\n'), 'utf8');
