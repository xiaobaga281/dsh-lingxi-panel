/**
 * 灵犀 · 全量回归门槛
 *
 *   改检索、改记忆模型、改卫生规则后跑这一条：
 *   node test-all.mjs
 *
 * 覆盖：记忆库、注入器、指标、进化、卫生、记忆工具、检索质量基准。
 */
import { spawnSync } from 'node:child_process';

const suites = [
  ['记忆库', 'memory/test.mjs'],
  ['注入器', 'test-injector.mjs'],
  ['指标', 'test-metrics.mjs'],
  ['进化', 'test-evolve.mjs'],
  ['卫生', 'test-hygiene.mjs'],
  ['复盘', 'test-review.mjs'],
  ['记忆工具', 'test-memorytool.mjs'],
  ['检索基准', 'test-eval.mjs'],
  ['打包完整性', 'test-package.mjs'],
  ['边界契约', 'test-boundaries.mjs'],
  ['字段契约', 'test-contract.mjs'],
];

let failed = 0;
const rows = [];
for (const [name, file] of suites) {
  const started = Date.now();
  const result = spawnSync(process.execPath, [file], { encoding: 'utf8' });
  const ms = Date.now() - started;
  const ok = result.status === 0;
  if (!ok) failed += 1;
  const output = String(result.stdout ?? '') + String(result.stderr ?? '');
  const match = /通过\s+(\d+)\s+项/.exec(output);
  const detail = match === null ? '' : match[1] + ' 项';
  rows.push('  ' + (ok ? 'ok  ' : 'FAIL') + '  ' + name.padEnd(6, ' ') + '  ' + detail.padEnd(8, ' ') + '  ' + ms + 'ms');
  if (!ok) {
    console.log('\n[' + name + '] 失败输出：');
    console.log(output.split('\n').slice(-12).join('\n'));
  }
}

console.log('灵犀回归');
for (const row of rows) console.log(row);
console.log(failed === 0 ? '\n全部通过' : '\n失败 ' + failed + ' 项');
process.exit(failed === 0 ? 0 : 1);
