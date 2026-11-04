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
const pending = run('git log --reverse --format=%H origin/main..main').split('\n').filter(Boolean);
if (pending.length === 0) {
  console.log('nothing to push');
  process.exit(0);
}

const refRes = await api('git/ref/heads/main');
if (!refRes.ok) {
  console.error('cannot read remote ref:', refRes.status);
  process.exit(1);
}
let remoteHead = (await refRes.json()).object.sha;
console.log('remote head:', remoteHead.slice(0, 7));

for (const commit of pending) {
  const treeSha = execFileSync('git', ['rev-parse', `${commit}^{tree}`], { encoding: 'utf8' }).trim();
  const parent = execFileSync('git', ['rev-parse', `${commit}^`], { encoding: 'utf8' }).trim();

  // 该 commit 相对其父的新增/修改文件
  const files = run(`git diff-tree --no-commit-id --name-only -r ${commit}`).split('\n').filter(Boolean);
  const blobs = [];
  for (const file of files) {
    // 用 git show 拿入库内容（autocrlf=true 时工作区是 CRLF，直接读会算出不同的 blob sha）。
    const content = Buffer.from(execFileSync('git', ['show', `${commit}:${file}`], { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }), 'utf8');
    const blobRes = await api('git/blobs', {
      method: 'POST',
      body: JSON.stringify({ content: content.toString('base64'), encoding: 'base64' }),
    });
    if (!blobRes.ok) {
      console.error(`blob fail ${file}:`, blobRes.status, await blobRes.text());
      process.exit(1);
    }
    blobs.push({ path: file, sha: (await blobRes.json()).sha, mode: '100644', type: 'blob' });
    console.log('  blob', file);
  }

  // 基于远端 head + 本 commit 的完整树：用 git 生成该 commit 的树与其父树的 diff 基线不通用，
  // 所以改用"远端树 + 变更文件"合成新树。
  const baseTreeRes = await api(`git/trees/${remoteHead}?recursive=1`);
  const baseTree = await baseTreeRes.json();
  const entries = [...baseTree.tree.filter((entry) => entry.type === 'blob')];
  for (const blob of blobs) {
    const index = entries.findIndex((entry) => entry.path === blob.path);
    if (index >= 0) entries[index] = blob;
    else entries.push(blob);
  }
  const treeRes = await api('git/trees', {
    method: 'POST',
    body: JSON.stringify({ tree: entries }),
  });
  if (!treeRes.ok) {
    console.error('tree fail:', treeRes.status, await treeRes.text());
    process.exit(1);
  }
  const newTree = (await treeRes.json()).sha;
  if (newTree !== treeSha) {
    console.error(`tree mismatch: api=${newTree} local=${treeSha}`);
    process.exit(1);
  }

  const message = run(`git log -1 --format=%B ${commit}`);
  const commitRes = await api('git/commits', {
    method: 'POST',
    body: JSON.stringify({ message, tree: newTree, parents: [remoteHead] }),
  });
  if (!commitRes.ok) {
    console.error('commit fail:', commitRes.status, await commitRes.text());
    process.exit(1);
  }
  const newCommit = (await commitRes.json()).sha;
  // sha 不可能逐字节一致（时间戳/时区），内容等价由树校验保证：
  const checkRes = await api(`git/commits/${newCommit}`);
  const remoteTreeOfCommit = (await checkRes.json()).tree.sha;
  if (remoteTreeOfCommit !== treeSha) {
    console.error(`tree still mismatch after commit: ${remoteTreeOfCommit}`);
    process.exit(1);
  }

  const refRes2 = await api('git/refs/heads/main', {
    method: 'PATCH',
    body: JSON.stringify({ sha: newCommit, force: false }),
  });
  if (!refRes2.ok) {
    console.error('ref fail:', refRes2.status, await refRes2.text());
    process.exit(1);
  }
  remoteHead = newCommit;
  console.log('pushed commit', newCommit.slice(0, 7), '(local-equivalent', commit.slice(0, 7) + ')', message.split('\n')[0].slice(0, 40));
}

console.log('all pending commits pushed via API');
