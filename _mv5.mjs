import { readFileSync, writeFileSync } from 'node:fs';

let lines = readFileSync('client.js', 'utf8').split('\n');

const storageStartIdx = lines.findIndex((l) => l.includes("t('storageTitle'), hint: t('storageHint"));
const storageEndIdx = lines.findIndex((l, i) => i > storageStartIdx && l.includes("t('storageMigrate')"));
const storageBlock = lines.slice(storageStartIdx, storageEndIdx + 1);

lines.splice(storageStartIdx, storageBlock.length);

const iifeCloseIdx = lines.findIndex((l, i) => i >= storageStartIdx && l.trim() === '})(),');
if (iifeCloseIdx < 0) {
  console.error('IIFE close missing');
  process.exit(1);
}
// 尾行 `;` → `,`（兼容 \r 行尾）
const fixedBlock = storageBlock.map((l, i) => (i === storageBlock.length - 1 ? l.replace(/\);\s*$/, '),' ) : l));
console.log('storage tail after:', JSON.stringify(fixedBlock[fixedBlock.length - 1].trim().slice(-30)));
lines.splice(iifeCloseIdx + 1, 0, ...fixedBlock);

writeFileSync('client.js', lines.join('\n'), 'utf8');
