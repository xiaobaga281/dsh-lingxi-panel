import { readFileSync, writeFileSync } from 'node:fs';
const miss = [];
const rep = (s, from, to) => {
  if (!s.includes(from)) {
    miss.push(from.slice(0, 60));
    return s;
  }
  return s.split(from).join(to);
};

/* 宿主：采纳数据持久化（meta）+ 低采纳自动收紧 */
let h = readFileSync('index.js', 'utf8');

/* 1) 启动时从 meta 恢复 overrides 并应用到 lessons */
h = rep(
  h,
  '  await backfillLessonMeta();',
  [
    '  await backfillLessonMeta();',
    '  // 恢复采纳覆盖表：低采纳场景的期望工具修正，重启不丢。',
    '  try {',
    '    const meta0 = await readMeta();',
    "    applyAdoptionOverrides(meta0?.adoptionOverrides ?? {});",
    '  } catch {',
    '    // meta 读不到就按默认表跑',
    '  }',
  ].join('\n'),
);

/* 2) writeMeta 后同步应用（refreshEfficacy 里低采纳检测已有；这里在 flush 指标处自动收紧） */
h = rep(
  h,
  "import { canonicalFailure, createInjector, userMessageText } from './injector.js';",
  "import { applyAdoptionOverrides, canonicalFailure, createInjector, userMessageText } from './injector.js';",
);
h = rep(
  h,
  "import { annotate } from './noise.js';",
  "import { annotate } from './noise.js';\nimport { applyAdoptionOverrides as applyOverridesLessons } from './lessons.js';",
);
writeFileSync('index.js', h, 'utf8');
console.log(miss.length === 0 ? 'host restore hooks wired' : 'MISSED: ' + JSON.stringify(miss));
