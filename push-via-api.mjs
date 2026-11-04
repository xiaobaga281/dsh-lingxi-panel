/**
 * 通过 GitHub REST API 推送本地 commit（git HTTPS 不通、API 可达时的替代通道）。
 * 只支持"远端是本地祖先"的快进：本地多 commit 时按序逐个上传。
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const TOKEN = process.env.GH_TOKEN ?? (() => {
  console.error('GH_TOKEN not set');
  process.exit(1);
})();

const REPO = 'xiaobaga281/dsh-lingxi-panel';
const api = (path, init = {}) =>
  fetch(`https://api.github.com/repos/${REPO}/${path}`, {
    ...init,
    headers: {
      Authorization: `token ${TOKEN}`,
      'User-Agent': 'dsh-lingxi',
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });

const run = (cmd) => execSync(cmd, { encoding: 'utf8' }).trim();

// 本地待推的 commit 链（旧→新）
  // 远端真实 head（API 通道，git fetch 可能不通）
  const refRes0 = await api('git/ref/heads/main');
  const remoteHead0 = (await refRes0.json()).object.sha;

  // 本地树 vs 远端树的差异文件（内容级 diff，而非 commit 链）
  const remoteTreeRes = await api(`git/trees/${remoteHead0}?recursive=1`);
  const remoteTree = (await remoteTreeRes.json()).tree.filter((entry) => entry.type === 'blob');
  const remoteMap = new Map(remoteTree.map((entry) => [entry.path, entry.sha]));

  const localTreeSha = execFileSync('git', ['rev-parse', 'HEAD^{tree}'], { encoding: 'utf8' }).trim();
  const localTree = execFileSync('git', ['ls-tree', '-r', localTreeSha], { encoding: 'utf8' }).trim().split('\n').filter(Boolean)
    .map((line) => { const [meta, path] = line.split('\t'); const mode = meta.split(' ')[0]; const sha = meta.split(' ')[2]; return { path, sha, mode }; });

  const changed = localTree.filter((entry) => remoteMap.get(entry.path) !== entry.sha);
  const removed = [...remoteMap.keys()].filter((path) => !localTree.some((entry) => entry.path === path));
  if (changed.length === 0 && removed.length === 0) {
    console.log('nothing to push (tree identical)');
    process.exit(0);
  }
  console.log('changed:', changed.map((entry) => entry.path).join(', ') || '(none)', '| removed:', removed.join(', ') || '(none)');
  const pending = null; // legacy marker
const refRes = await api('git/ref/heads/main');
if (!refRes.ok) {
  console.error('cannot read remote ref:', refRes.status);
  process.exit(1);
}
let remoteHead = (await refRes.json()).object.sha;
console.log('remote head:', remoteHead.slice(0, 7));

if (pending !== null) { /* legacy marker retained intentionally */ }

// 上传变更 blob（cat-file 拿到的是入库内容，sha 与本地一致）
for (const entry of changed) {
  const content = execFileSync('git', ['cat-file', 'blob', entry.sha], { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
  const blobRes = await api('git/blobs', {
    method: 'POST',
    body: JSON.stringify({ content: Buffer.from(content, 'utf8').toString('base64'), encoding: 'base64' }),
  });
  if (!blobRes.ok) { console.error('blob fail', entry.path, await blobRes.text()); process.exit(1); }
  entry.newSha = (await blobRes.json()).sha;
  console.log('  blob', entry.path);
}

// 合成新树：远端保留项 + 变更项（删除项剔除）
const entries = remoteTree.filter((entry) => !removed.includes(entry.path) && !changed.some((c) => c.path === entry.path))
  .map((entry) => ({ path: entry.path, sha: entry.sha, mode: entry.mode ?? '100644', type: 'blob' }));
for (const entry of changed) entries.push({ path: entry.path, sha: entry.newSha, mode: entry.mode, type: 'blob' });
const treeRes = await api('git/trees', { method: 'POST', body: JSON.stringify({ tree: entries }) });
if (!treeRes.ok) { console.error('tree fail:', await treeRes.text()); process.exit(1); }
const newTree = (await treeRes.json()).sha;

// 提交（时间戳用当下；sha 与本地不同是预期内的，内容等价由树保证）
const message = 'sync: local working tree (' + new Date().toISOString() + ')\n\n' +
  (changed.length > 0 ? 'changed: ' + changed.map((entry) => entry.path).join(', ') + '\n' : '') +
  (removed.length > 0 ? 'removed: ' + removed.join(', ') : '');
const commitRes = await api('git/commits', { method: 'POST', body: JSON.stringify({ message, tree: newTree, parents: [remoteHead0] }) });
if (!commitRes.ok) { console.error('commit fail:', await commitRes.text()); process.exit(1); }
const newCommit = (await commitRes.json()).sha;

// 快进引用（非强制，远端被他人推进时会拒绝）
const refRes2 = await api('git/refs/heads/main', { method: 'PATCH', body: JSON.stringify({ sha: newCommit, force: false }) });
if (!refRes2.ok) { console.error('ref fail:', await refRes2.text()); process.exit(1); }
console.log('pushed snapshot commit', newCommit.slice(0, 7), 'on top of', remoteHead0.slice(0, 7));