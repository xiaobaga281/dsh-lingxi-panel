import { readFileSync, writeFileSync } from 'node:fs';

let lines = readFileSync('client.js', 'utf8').split('\n');

/* 校验前置：Collapsible 定义与 opsTitle 文案必须在 */
const hasDef = lines.some((l) => l.includes('function Collapsible'));
const hasLabel = lines.some((l) => l.includes("opsTitle: '运维工具"));
if (!hasDef || !hasLabel) {
  console.error('missing def/label', hasDef, hasLabel);
  process.exit(1);
}

/* 找清洗卡开头与存储卡尾行 */
const purgeIdx = lines.findIndex((l) => l.includes("t('purgeTitle'), hint: t('purgeHint')"));
const storageTailIdx = lines.findIndex((l, i) => i > purgeIdx && l.includes("t('storageMigrate')));
"));
if (purgeIdx < 0 || storageTailIdx < 0) {
  console.error('boundaries missing', purgeIdx, storageTailIdx);
  process.exit(1);
}

/* 包裹：清洗卡 → 存储卡（含其间卫生 IIFE）全部收进运维折叠区 */
lines.splice(storageTailIdx + 1, 0, '        ),');
lines.splice(purgeIdx, 0, "        h(Collapsible, { title: t('opsTitle'), hint: t('opsHint') },");

/* 间距：折叠区 children 20 → 28 */
for (let i = 0; i < lines.length; i += 1) {
  lines[i] = lines[i].replace(
    "? h('div', { style: { marginTop: 14, display: 'grid', gap: 20 } }, children)",
    "? h('div', { style: { marginTop: 14, display: 'grid', gap: 28 } }, children)",
  );
}

writeFileSync('client.js', lines.join('\n'), 'utf8');
console.log('ops collapsible re-applied, gap 28');
