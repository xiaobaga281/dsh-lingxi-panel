/**
 * 打包完整性自测：发布的包必须包含所有运行时依赖。
 *
 * 为什么需要：review.js 曾漏出 files 列表——本地（link 安装）一切正常，
 * 但从 npm 安装后插件会因找不到模块而完全加载失败。这类缺陷静默且致命。
 */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checks, check, report } from './test-helpers.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(path.join(root, f), 'utf8');
const pkg = JSON.parse(read('package.json'));

/** files 支持 glob，这里按 npm 的语义做覆盖判断。 */
const covered = (rel) => {
  const clean = rel.replace(/^\.\.\//, '').replace(/^\.\//, '');
  if (pkg.files.includes(clean)) return true;
  return pkg.files.some((pattern) => {
    if (!pattern.includes('*')) return false;
    const rx = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '[^/]*') + '$');
    return rx.test(clean);
  });
};

await check('运行时依赖全部在 files 内（否则安装后加载失败）', () => {
  const entries = ['index.js', 'client.js'].filter((f) => existsSync(path.join(root, f)));
  assert.ok(entries.length > 0, 'at least one entry exists');
  const deps = new Set();
  const seen = new Set();
  const scan = (file) => {
    if (seen.has(file)) return;
    seen.add(file);
    let src = '';
    try {
      src = read(file);
    } catch {
      return;
    }
    for (const m of src.matchAll(/from\s+'(\.\.?\/[^']+)'/g)) {
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(file), m[1]));
      deps.add(target);
      if (target.endsWith('.js')) scan(target);
    }
  };
  for (const e of entries) scan(e);
  const missing = [...deps].filter((d) => !covered(d));
  assert.deepEqual(missing, [], 'missing from package.json files: ' + missing.join(', '));
});

await check('DSH 清单字段齐备且指向真实文件', () => {
  assert.equal(pkg.dsh?.bundle?.patch, './cordis.patch.yml');
  assert.ok(existsSync(path.join(root, 'cordis.patch.yml')), 'cordis.patch.yml exists');
  assert.equal(pkg.dsh?.client?.platform, 'web');
  assert.equal(pkg.dsh?.client?.immediately, true);
  assert.ok(Array.isArray(pkg.dsh?.client?.inject) && pkg.dsh.client.inject.length > 0);
  for (const target of Object.values(pkg.exports ?? {})) {
    if (target.includes('*')) continue;
    assert.ok(existsSync(path.join(root, target)), 'export target exists: ' + target);
  }
});

await check('主机以子进程方式调用的脚本必须在 files 内', () => {
  const host = read('index.js');
  /* 形如 spawn(process.execPath, [path.join(base, 'audit.mjs')]) */
  const scripts = [...host.matchAll(/path\.join\(base,\s*'([^']+)'\)/g)].map((m) => m[1]);
  assert.ok(scripts.length > 0, 'host spawns at least one script');
  const missing = scripts.filter((s) => !covered(s));
  assert.deepEqual(missing, [], 'spawned scripts missing from files: ' + missing.join(', '));
});

report();
