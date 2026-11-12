/**
 * 契约：客户端读取的每个载荷字段，后端必须真的产出它。
 *
 * 背景：因果对照的 causal 只写进了状态文件（writeStatus），overview 载荷没给，
 * 面板读 data.causal 恒为 undefined，显示永远是 0——而且不报错、不崩溃。
 * 这类"少写一个字段"的问题静态可查，不该靠人眼发现。
 *
 * 检查范围要覆盖**所有**可能的载荷来源：
 *   - overview 路由的响应体
 *   - diagnostic/status 状态文件
 *   - bootSnapshot（离线降级快照）
 * 任一来源产出即算满足。
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { check, report } from './test-helpers.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const host = readFileSync(path.join(root, 'index.js'), 'utf8');
const client = readFileSync(path.join(root, 'client.js'), 'utf8');

await check('客户端读取的每个载荷字段，后端都有产出', () => {
  const skip = new Set([
    'length', 'map', 'filter', 'slice', 'toLocaleString', 'includes',
    'forEach', 'find', 'some', 'then', 'catch', 'toString',
  ]);
  /* 客户端读取的 data.* 顶层字段 */
  const clientFields = new Set();
  for (const m of client.matchAll(/\bdata\??\.(\w+)/g)) {
    if (!skip.has(m[1])) clientFields.add(m[1]);
  }
  assert.ok(clientFields.size > 10, 'sanity: client reads a meaningful number of fields');

  /* 收集所有载荷来源：overview 响应体 + 状态文件 + bootSnapshot */
  const sources = [];
  /* (a) overview 路由的 sendJson 载荷 */
  const ovStart = host.indexOf('route(OVERVIEW');
  const ovSend = host.indexOf('sendJson(response, 200, {', ovStart);
  if (ovSend > 0) sources.push(host.slice(ovSend, ovSend + 9000));
  /* (b) writeStatus 的状态对象 */
  const wsStart = host.indexOf('async function writeStatus');
  if (wsStart > 0) sources.push(host.slice(wsStart, wsStart + 6000));
  /* (c) bootSnapshot */
  const bsStart = host.indexOf('async function refreshBootSnapshot');
  if (bsStart > 0) sources.push(host.slice(bsStart, bsStart + 6000));

  const allSources = sources.join('\n');

  const missing = [];
  for (const f of [...clientFields].sort()) {
    /* 三种写法：f: v / f, （简写）/ "f": v */
    const re = new RegExp('(^|[\\s{,])(\'|")?' + f + '(\'|")?\\s*[:,]', 'm');
    if (!re.test(allSources)) missing.push(f);
  }
  assert.deepEqual(missing, [],
    'client reads these fields but no payload produces them: ' + missing.join(', '));
});

await check('overview 载荷本身覆盖核心字段（不能只靠状态文件）', () => {
  /* 面板读的是 overview，不是状态文件。
     所以关键字段必须在 overview 响应体里，否则界面永远是空。 */
  const ovStart = host.indexOf('route(OVERVIEW');
  assert.ok(ovStart > 0, 'overview route exists');
  const ovEnd = host.indexOf('});\n\n', ovStart);
  const payload = host.slice(ovStart, ovEnd > 0 ? ovEnd : ovStart + 12000);

  /* 面板直接展示、必须走 overview 的字段 */
  const mustBeInOverview = [
    'injection', 'efficacy', 'alerts', 'storage', 'memory',
    'semanticStats', 'derived', 'review', 'causal',
  ];
  const missing = [];
  for (const f of mustBeInOverview) {
    const re = new RegExp('(^|[\\s{,])(\'|")?' + f + '(\'|")?\\s*[:,]', 'm');
    if (!re.test(payload)) missing.push(f);
  }
  assert.deepEqual(missing, [],
    'overview payload must carry these (panel reads them): ' + missing.join(', '));
});

report();
