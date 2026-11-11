/**
 * 灵犀 · 测试小工具
 *
 * 为什么单独一份：check / checks / 汇总输出 曾经是 6 个测试文件里逐字复制的同一段代码，
 * 副本会各自漂移（有的抛错中断、有的只设 exitCode），结果判定不一致。
 */
export const checks = [];

/** 记录一项断言；失败时记录并抛出（调用方需要立即中断时用它）。 */
export async function check(name, fn) {
  try {
    await fn();
    checks.push(`  ok  ${name}`);
  } catch (error) {
    checks.push(`  FAIL ${name}: ${error.message}`);
    throw error;
  }
}

/** 同上，但失败不中断：适合一次跑完全部断言再汇总。 */
export async function checkAsync(name, fn) {
  try {
    await fn();
    checks.push(`  ok  ${name}`);
  } catch (error) {
    checks.push(`  FAIL ${name} :: ${error.message}`);
    process.exitCode = 1;
  }
}

/** 打印结果，并按失败数决定退出码（失败即非零退出，供回归门槛判定）。 */
export function report() {
  console.log(checks.join('\n'));
  const failed = checks.filter((line) => line.includes('FAIL')).length;
  if (failed === 0) {
    console.log(`\n通过 ${checks.length} 项`);
    return;
  }
  console.log(`\n失败 ${failed} 项`);
  process.exit(1);
}
