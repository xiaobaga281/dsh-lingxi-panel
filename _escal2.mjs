import { readFileSync, writeFileSync } from 'node:fs';
const miss = [];
const rep = (s, from, to) => {
  if (!s.includes(from)) {
    miss.push(from.slice(0, 60));
    return s;
  }
  return s.split(from).join(to);
};

let inj = readFileSync('injector.js', 'utf8');

/* 1) 状态 */
inj = rep(
  inj,
  '  const pendingAdvice = new Map();',
  [
    '  const pendingAdvice = new Map();',
    "  /** sessionId\\u0000tool → { code, expected, at }：建议被无视后的升级状态 */",
    '  const escalated = new Map();',
  ].join('\n'),
);

/* 2) 采纳判定：无视 + 同码失败 → 升级 */
inj = rep(
  inj,
  '        } else {\n          stats.adviceIgnored += 1;\n          bucket.ignored += 1;\n        }',
  [
    '        } else {',
    '          stats.adviceIgnored += 1;',
    '          bucket.ignored += 1;',
    '          // 升级阶梯：无视建议后若这次调用仍是同码失败，下次同工具调用直接硬拦。',
    "          if (result?.isError === true && String(result?.error?.info?.code ?? '') === advice.code) {",
    "          escalated.set(sessionId + '\\u0000' + toolNameNow, { code: advice.code, expected: advice.expected, at: Date.now() });",
    '          }',
    '        }',
  ].join('\n'),
);

/* 3) 采纳成功解除升级 */
inj = rep(
  inj,
  '        if (advice.expected.includes(toolNameNow)) {\n          stats.adviceAdopted += 1;\n          bucket.adopted += 1;',
  [
    '        if (advice.expected.includes(toolNameNow)) {',
    '          stats.adviceAdopted += 1;',
    '          bucket.adopted += 1;',
    "          escalated.delete(sessionId + '\\u0000' + toolNameNow);",
  ].join('\n'),
);

/* 4) guardCall：升级硬拦（插在 stats.guardChecked 之后、签名守卫之前） */
inj = rep(
  inj,
  '    stats.guardChecked += 1;\n    if (!enabled) return undefined;',
  [
    '    stats.guardChecked += 1;',
    '    if (!enabled) return undefined;',
    '    // 升级硬拦：建议被无视且同码再犯后，同工具的下一次调用先拦下来讲清期望动作。',
    "    const escKey = String(exec?.agent?.id ?? '') + '\\u0000' + String(exec?.name ?? '');",
    '    const esc = escalated.get(escKey);',
    '    if (esc !== undefined) {',
    '      if (Date.now() - esc.at > GUARD_WINDOW_MS) {',
    '        escalated.delete(escKey);',
    '      } else {',
    '        stats.guardDenied += 1;',
    '        return \'刚刚已经提示过（\' + esc.code + \'），但动作没有改变。这次先做提示里的事：期望用 \' +',
    '          esc.expected.join(\' / \') + \'，之后再继续其他操作。\';',
    '      }',
    '    }',
  ].join('\n'),
);

writeFileSync('injector.js', inj, 'utf8');
console.log(miss.length === 0 ? 'escalation ladder wired' : 'MISSED: ' + JSON.stringify(miss));
