/**
 * 灵犀 · 边界契约自检
 *
 * 为什么需要：本项目反复出问题的都不是模块内部的算法，而是**连接处**——
 *   1. 同一对象重复键（JS 静默覆盖，界面永远显示错值）
 *   2. 响应信封被展开覆盖（{ ok:true, ...state } 里 state 自带 ok:false）
 *   3. 写进 A 容器、从 B 容器读（因果对照 turns 恒为 0）
 *   4. 客户端读路径与后端写位置不一致（界面永远为空）
 *   5. 死路由 / 死计数器 / 只有形没有实
 *
 * 这些都是静态可查的。把它们变成构建期失败，比事后靠人眼审查可靠得多。
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { check, report } from './test-helpers.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(path.join(root, f), 'utf8');
const host = read('index.js');
const client = read('client.js');

/* ── 1. 信封展开必须被"投影不产出 ok"兜住 ───────────────── */
await check('{ok:true, ...projection()} 的投影必须显式登记', () => {
  const spread = [...new Set(
    [...host.matchAll(/sendJson\([^,]+,\s*\d+,\s*\{[^}]*\.\.\.\s*(\w+)\(/g)].map((m) => m[1]),
  )];
  // 白名单 = 已确认「不产出信封字段 ok」的投影。
  // publicRecord 是字段白名单投影（逐字段挑选），天然不含 ok。
  const ALLOWED = ['reviewStateForClient', 'probeStateForClient', 'publicRecord'];
  const unknown = spread.filter((n) => !ALLOWED.includes(n));
  assert.deepEqual(unknown, [],
    'unknown projection spread into envelope (register it in test 2 first): ' + unknown.join(', '));
});

/* ── 2. 投影函数绝不产出信封字段 ok ──────────────────────── */
await check('投影函数不产出信封字段 ok（否则覆盖外层 ok:true）', () => {
  const projections = ['reviewStateForClient', 'probeStateForClient'];
  const bad = [];
  for (const name of projections) {
    const at = host.indexOf('const ' + name + ' =');
    if (at < 0) { bad.push(name + ' 未找到'); continue; }
    // 精确截取函数体：到下一个顶层 '};' 为止，避免越界抓到后面的路由代码
    const rest = host.slice(at);
    const endAt = rest.indexOf('\n  };');
    const slice = endAt > 0 ? rest.slice(0, endAt) : rest.slice(0, 2000);
    for (const m of slice.matchAll(/return\s*\{([\s\S]{0,400}?)\}/g)) {
      if (/(^|[\s,])ok\s*:/.test(m[1])) bad.push(name);
    }
  }
  assert.deepEqual([...new Set(bad)], [], 'projection emits envelope key ok: ' + bad.join(', '));
});

/* ── 3. 同一对象内不得有重复键 ───────────────────────────── */
await check('载荷对象内无重复键（重复键会静默覆盖）', () => {
  const lines = host.split("\n");
  const dup = [];
  /* 判据必须严格：两个同名键属于同一对象，需同时满足
     a) 缩进相同  b) 中间没有任何"更浅缩进的收尾 }"  c) 中间没有更浅缩进的键
     否则会把不同对象的同名字段误判为重复。 */
  for (let i = 0; i < lines.length; i += 1) {
    const m = /^(\s+)([A-Za-z_$][\w$]*)\s*:\s*[^:]/.exec(lines[i]);
    if (m === null) continue;
    const indent = m[1].length;
    const key = m[2];
    for (let j = i + 1; j < Math.min(i + 40, lines.length); j += 1) {
      const lj = lines[j];
      if (lj.trim() === "") continue;
      const indentJ = lj.match(/^(\s*)/)[1].length;
      /* 遇到更浅缩进的收尾或键 → 已离开本对象 */
      if (indentJ < indent && (lj.trim().startsWith("}") || /^\s*[A-Za-z_$][\w$]*\s*:/.test(lj))) break;
      const mj = /^(\s+)([A-Za-z_$][\w$]*)\s*:\s*[^:]/.exec(lj);
      if (mj === null) continue;
      if (mj[1].length === indent && mj[2] === key) {
        dup.push(key + "@" + (i + 1) + "/" + (j + 1));
        break;
      }
    }
  }
  assert.deepEqual(dup, [], "duplicate keys in one object: " + dup.join(", "));
});

/* ── 4. 客户端读路径与后端写位置一致 ─────────────────────── */
await check('客户端读路径与后端写位置一致（曾错位导致界面永远为空）', () => {
  /* lessonEfficacy 曾写在 efficacy 同级，客户端读 efficacy.lessonEfficacy → 永远空 */
  if (client.includes('efficacy?.lessonEfficacy')) {
    const at = host.indexOf('lessonEfficacy,');
    assert.ok(at > 0, 'server writes lessonEfficacy');
    const before = host.slice(Math.max(0, at - 2500), at);
    const lastOpen = before.lastIndexOf('efficacy: {');
    const lastSibling = before.lastIndexOf('attribution,');
    assert.ok(lastOpen > lastSibling,
      'lessonEfficacy must sit inside efficacy block, not beside attribution');
  }
});

/* ── 5. 写入与读取必须落在同一容器 ───────────────────────── */
await check('状态写入与快照读取使用同一容器（曾写错 Map 导致恒为 0）', () => {
  const inj = read('injector.js');
  const snapFn = inj.slice(inj.indexOf('function sessionSnapshot'));
  assert.ok(snapFn.includes('sessionStats'), 'snapshot reads sessionStats');
  assert.ok(inj.includes('statsEntry.guardKeys'),
    'guardKeys written via ensureSession (sessionStats), not only the slot cache');
});

/* ── 6. 无死路由 ─────────────────────────────────────────── */
await check('无死路由：每条注册的路由都有客户端调用', () => {
  const routes = [...new Set(
    [...host.matchAll(/route\(\s*(?:MEMORY\s*\+\s*)?'([^']+)'/g)].map((m) => m[1]),
  )];
  const dead = [];
  for (const r of routes) {
    const tail = r.replace(/^\//, '').split('/').pop();
    if (!client.includes(tail)) dead.push(r);
  }
  assert.deepEqual(dead, [], 'routes never called by client: ' + dead.join(', '));
});

/* ── 7. 会调模型的能力都有自己的状态与告警 ───────────────── */
await check('每个调模型的能力都有独立状态与告警（不借别人的）', () => {
  const review = read('review.js');
  assert.ok(review.includes('consecutiveFailures'), 'review tracks own failures');
  assert.ok(review.includes('reviewAlert'), 'review exposes own alert');
  assert.ok(host.includes('reviewAlert(reviewer.snapshot())'), 'review alert wired into host');
  const sem = read('semantic.js');
  assert.ok(sem.includes('consecutiveFailures'), 'semantic tracks own failures');
});

/* ── 8. 计数器都有真实写入点 ─────────────────────────────── */
await check('载荷里的计数器都有真实写入点（不是永远为 0）', () => {
  const counters = ['autoSeeded', 'autoActivated', 'gapFilled', 'backfilledLessons',
    'lastRepairedLessons', 'proceduresCreated', 'instructionsCaptured', 'toolsWrote', 'lastAudit'];
  const bad = [];
  for (const c of counters) {
    if (!new RegExp('(let|const)\\s+' + c).test(host)) continue;
    if (!new RegExp('(^|[^.\\w])' + c + '\\s*(=[^=]|\\+=|\\+\\+|--)', 'm').test(host)) bad.push(c);
  }
  assert.deepEqual(bad, [], 'counters never written: ' + bad.join(', '));
});

/* ── 9. 每个配置项都必须真的被读取 ───────────────────────── */
await check('配置项都真的接线（不是只存不用）', () => {
  const keys = ['semantic', 'semanticModel', 'reviewModel', 'autoReview',
    'autoReviewDays', 'causalExperiment', 'causalHoldoutRate'];
  const dead = [];
  for (const k of keys) {
    const uses = (host.match(new RegExp('settings\\.' + k, 'g')) ?? []).length;
    if (uses < 2) dead.push(k + '(' + uses + ')');
  }
  assert.deepEqual(dead, [], 'settings declared but barely used: ' + dead.join(', '));
});


/* ── 10. 业务成败不得用信封字段判断 ─────────────────────── */
await check('业务成败不能用信封字段 ok 判断（否则失败被静默）', () => {
  /* 背景：把投影里的 ok 改名 success 后，客户端仍读 body.ok 判断业务成败。
     而 body.ok 是信封字段（成功路径恒 true），于是"启动失败"永远不报错。
     判据：产出 success 的投影，其对应路由的客户端调用点必须读 success/error，
     不能只读 body.ok。 */
  const withSuccess = [];
  for (const m of host.matchAll(/const (\w+) = \(\) => \{/g)) {
    const name = m[1];
    const slice = host.slice(m.index, m.index + 1500);
    if (/success:/.test(slice) && /StateForClient/.test(name)) withSuccess.push(name);
  }
  assert.ok(withSuccess.length > 0, "at least one projection carries success");

  const bad = [];
  for (const name of withSuccess) {
    const at = host.indexOf('...' + name + '()');
    if (at < 0) continue;
    const last = [...host.slice(0, at).matchAll(/route\('([^']+)'/g)].pop();
    if (!last) continue;
    // 必须用完整路径：末段匹配会把 review/apply 误认成 review
    const fullPath = last[1].replace(/^\//, "");
    const re = new RegExp("(postJson|getJson)\\(\\s*[`'\"][^`'\"]*" + fullPath + "[`'\"\\s)]", "g");
    let m;
    while ((m = re.exec(client)) !== null) {
      const after = client.slice(m.index, m.index + 900);
      const usesOk = /body\.ok\s*(!==|===)\s*true/.test(after);
      const usesBusiness = /body\.success|body\.error|selected\?\.ok|state\.success/.test(after);
      if (usesOk && !usesBusiness) bad.push(last[1]);
    }
  }
  assert.deepEqual([...new Set(bad)], [],
    "routes whose business outcome is judged by envelope ok: " + [...new Set(bad)].join(", "));
});
report();
