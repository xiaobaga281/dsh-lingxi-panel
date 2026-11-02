/**
 * 灵犀记忆库 · 自测
 *
 * 只跑真实代码路径，不 mock 业务逻辑；云端未配置，验证降级路径。
 * 运行：node memory/test.mjs
 */
import assert from 'node:assert/strict';
import { promises as fsp } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { LingxiMemory } from './index.js';
import { effectiveConfidence, textSimilarity } from './schema.js';

const root = await fsp.mkdtemp(path.join(tmpdir(), 'lingxi-memory-test-'));
const dir = path.join(root, 'store');
let passed = 0;
const checks = [];
function check(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      passed += 1;
      checks.push(`  ok  ${name}`);
    })
    .catch((error) => {
      checks.push(`  FAIL ${name}: ${error.message}`);
      throw error;
    });
}

const memory = new LingxiMemory({ dir });
await memory.init();

await check('写入约束 → 新建记录', async () => {
  const result = await memory.remember({
    kind: 'constraint',
    text: '不要硬编码像素尺寸，必须读取真实渲染尺寸',
    scope: { kind: 'machine', id: '' },
    confidence: 0.9,
    evidence: 3,
    topics: ['kind:constraint', 'scene:style'],
    provenance: [{ source: 'user-correction', excerpt: '不要硬编码' }],
  });
  assert.equal(result.action, 'created');
  assert.equal(result.record.status, 'active');
  assert.equal(result.record.kind, 'constraint');
  assert.equal(result.record.schemaVersion, 2);
});

await check('近重复写入 → 合并而不是新增', async () => {
  const before = (await memory.health()).total;
  const result = await memory.remember({
    kind: 'constraint',
    text: '不要硬编码像素尺寸，必须读取真实渲染尺寸。',
    scope: { kind: 'machine', id: '' },
    confidence: 0.6,
    evidence: 2,
  });
  assert.equal(result.action, 'update');
  assert.ok(result.record.evidence >= 5, `evidence=${result.record.evidence}`);
  assert.equal((await memory.health()).total, before);
});

await check('教训写入 + 检索命中排序', async () => {
  await memory.remember({
    kind: 'lesson',
    text: 'pwsh 报错时先确认路径与依赖是否就绪，再重试，不要直接重跑',
    topics: ['tool:pwsh', 'kind:lesson'],
    confidence: 0.7,
    evidence: 4,
    status: 'active',
  });
  await memory.remember({
    kind: 'fact',
    text: '本机插件目录是 D 盘的 5 号工作区',
    topics: ['kind:fact'],
    confidence: 0.6,
    evidence: 1,
    status: 'active',
  });
  const result = await memory.recall('pwsh 路径报错怎么办', { limit: 3, charBudget: 600 });
  assert.ok(result.items.length >= 1);
  assert.equal(result.items[0].record.kind, 'lesson');
  assert.ok(result.text.includes('教训'));
});

await check('作用域隔离：别的工作区看不到对方事实', async () => {
  await memory.remember({
    kind: 'constraint',
    text: '这个工作区里所有构建命令走 pnpm 而不是 npm',
    scope: { kind: 'workspace', id: 'ws-A' },
    confidence: 0.8,
    evidence: 2,
    status: 'active',
    topics: ['kind:constraint'],
  });
  const inA = await memory.recall('构建命令', { context: { workspaceId: 'ws-A' }, limit: 5 });
  const inB = await memory.recall('构建命令', { context: { workspaceId: 'ws-B' }, limit: 5 });
  assert.ok(inA.items.some((entry) => entry.record.text.includes('pnpm')));
  assert.ok(!inB.items.some((entry) => entry.record.text.includes('pnpm')));
});

await check('相反断言 → 冲突而不是合并', async () => {
  const result = await memory.remember({
    kind: 'constraint',
    text: '必须硬编码像素尺寸',
    scope: { kind: 'machine', id: '' },
    confidence: 0.7,
    evidence: 2,
    topics: ['kind:constraint', 'scene:style'],
  });
  assert.equal(result.action, 'contradicted');
  assert.equal(result.record.status, 'candidate');
  assert.ok(result.record.links.some((link) => link.type === 'contradicts'));
  assert.ok(result.related.length >= 1);
  // 原约束被降回待确认，避免旧结论压死新证据
  const health = await memory.health();
  assert.ok(health.contradictionPairs >= 1);
});

await check('重复提交同一次抽取 → no-op 幂等', async () => {
  const input = {
    kind: 'constraint',
    text: '提交前必须先跑一遍语法检查',
    scope: { kind: 'machine', id: '' },
    confidence: 0.7,
    evidence: 1,
    topics: ['kind:constraint'],
    provenance: [{ source: 'user-correction', excerpt: '先跑语法检查' }],
  };
  const first = await memory.remember(input);
  assert.equal(first.action, 'created');
  const evidenceAfterFirst = first.record.evidence;
  const second = await memory.remember(input);
  assert.equal(second.action, 'noop');
  assert.equal(second.record.evidence, evidenceAfterFirst);
});

await check('新断言证据更强 → supersede 闭合旧记录（双时态）', async () => {
  const old = await memory.remember({
    kind: 'constraint',
    text: '不要使用 npm 安装依赖',
    scope: { kind: 'machine', id: '' },
    confidence: 0.5,
    evidence: 1,
    topics: ['kind:constraint', 'scene:install'],
    provenance: [{ source: 'user-correction', excerpt: '不要 npm' }],
  });
  assert.equal(old.action, 'created');
  const next = await memory.remember({
    kind: 'constraint',
    text: '必须使用 npm 安装依赖',
    scope: { kind: 'machine', id: '' },
    confidence: 0.8,
    evidence: 5,
    topics: ['kind:constraint', 'scene:install'],
    provenance: [{ source: 'user-correction', excerpt: '必须 npm' }],
  });
  assert.equal(next.action, 'supersede');
  assert.equal(next.record.supersedesId, old.record.id);
  const retired = await memory.list({ kind: 'constraint', limit: 50 });
  const closed = retired.find((record) => record.id === old.record.id);
  assert.ok(closed !== undefined);
  assert.ok(closed.validTo !== null, 'old record must be time-closed');
  assert.equal(closed.status, 'retired');
  // 被闭合的断言不再进入检索
  const recalled = await memory.recall('npm 安装依赖', { limit: 10 });
  assert.ok(!recalled.items.some((entry) => entry.record.id === old.record.id));
});

await check('两路信号都弱 → abstain 而不是硬凑记忆', async () => {
  const result = await memory.recall('量子退相干与超导能隙的关系', { limit: 5 });
  assert.equal(result.confident, false);
  assert.equal(result.abstain, true);
  assert.equal(result.text, '');
});

await check('入库前脱敏：凭据不落库、不带 pii 标记不外发', async () => {
  const result = await memory.remember({
    kind: 'fact',
    text: '云端 key 是 sk-abcdefghijklmnop1234567890，别写进日志',
    scope: { kind: 'machine', id: '' },
    confidence: 0.6,
    evidence: 2,
    topics: ['kind:fact'],
    provenance: [{ source: 'user-correction', excerpt: '别写进日志' }],
  });
  assert.ok(!result.record.text.includes('sk-abcdefghijklmnop'), result.record.text);
  assert.ok(result.record.text.includes('⟨redacted⟩'));
  assert.equal(result.record.pii, true);
});

await check('命中/证伪反馈改变置信度', async () => {
  const record = (await memory.list({ kind: 'lesson', limit: 1 }))[0];
  const id = record.id;
  const confidenceBefore = record.confidence;
  const hit = await memory.observe(id, { hit: true });
  assert.ok(hit.confidence >= confidenceBefore);
  const afterHit = effectiveConfidence(hit);
  const hitCount = hit.hitCount;
  const miss = await memory.observe(id, { miss: true });
  const afterMiss = effectiveConfidence(miss);
  assert.ok(afterMiss < afterHit, `hit=${afterHit.toFixed(3)} miss=${afterMiss.toFixed(3)}`);
  assert.ok(miss.missCount >= 1);
  assert.ok(hitCount >= 1);
});

await check('巩固：近重复合并 + 陈旧记录退休', async () => {
  await memory.remember({
    kind: 'fact',
    text: '系统时区是 Asia/Shanghai',
    topics: ['kind:fact'],
    confidence: 0.55,
    evidence: 1,
    status: 'active',
  });
  await memory.remember({
    kind: 'fact',
    text: '系统的时区设置为 Asia/Shanghai',
    topics: ['kind:fact'],
    confidence: 0.5,
    evidence: 1,
    status: 'active',
  });
  // 造一条很老的候选记录：300 天没动过
  const stale = await memory.remember({
    kind: 'episode',
    text: '某次临时试跑的旧观察',
    topics: ['kind:episode'],
    confidence: 0.5,
    evidence: 1,
  });
  stale.record.createdAt = Date.now() - 300 * 86_400_000;
  stale.record.updatedAt = stale.record.createdAt;
  stale.record.lastUsedAt = stale.record.createdAt;
  const report = await memory.consolidate();
  assert.ok(report.total >= 1);
  const remaining = (await memory.list({ kind: 'fact', limit: 10 })).filter((r) => r.text.includes('时区'));
  assert.equal(remaining.length, 1, `timezone facts: ${remaining.length}`);
  const retired = (await memory.list({ kind: 'episode', limit: 10 }));
  assert.ok(retired.every((record) => record.status !== 'active'));
});

await check('持久化：新实例读回同一批记录', async () => {
  const snapshot = await memory.health();
  const reloaded = new LingxiMemory({ dir });
  await reloaded.init();
  const health = await reloaded.health();
  assert.equal(health.total, snapshot.total);
  assert.equal(health.byStatus.active, snapshot.byStatus.active);
});

await check('注入块受字符预算约束且分组', async () => {
  const result = await memory.recall('', { limit: 20, charBudget: 120 });
  assert.ok(result.chars <= 200, `chars=${result.chars}`);
  assert.ok(result.text === '' || result.text.startsWith('【灵犀记忆】'));
});

await check('文本相似度对中文稳定', async () => {
  assert.ok(textSimilarity('不要硬编码尺寸', '不要硬编码尺寸') === 1);
  assert.ok(textSimilarity('不要硬编码尺寸', '读取真实尺寸') < 0.5);
});

await check('会话隔离：默认私有，不跨会话注入', async () => {
  const created = await memory.remember({
    kind: 'lesson',
    text: '这个会话里 D 盘路径必须先加引号再执行 pwsh',
    origin: { sessionId: 'sess-1', workspaceId: 'ws-1' },
    confidence: 0.8,
    evidence: 2,
    provenance: [{ source: 'tool-failure', excerpt: '路径报错' }],
  });
  assert.equal(created.record.sharing, 'private');
  const inA = await memory.recall('D 盘路径 引号 pwsh', { context: { sessionId: 'sess-1', workspaceId: 'ws-1' }, limit: 8 });
  assert.ok(inA.items.some((entry) => entry.record.id === created.record.id), 'origin session must see its own memory');
  const inB = await memory.recall('D 盘路径 引号 pwsh', { context: { sessionId: 'sess-2', workspaceId: 'ws-1' }, limit: 8 });
  assert.ok(!inB.items.some((entry) => entry.record.id === created.record.id), 'other session must NOT see private memory');
});

await check('相同文本来自不同会话 → 两条记录而不是覆盖', async () => {
  const one = await memory.remember({ kind: 'fact', text: '同句不同会话的测试断言', origin: { sessionId: 's1', workspaceId: 'w1' }, confidence: 0.6 });
  const two = await memory.remember({ kind: 'fact', text: '同句不同会话的测试断言', origin: { sessionId: 's2', workspaceId: 'w1' }, confidence: 0.6 });
  assert.notEqual(one.record.id, two.record.id);
});

await check('显式提升后才允许跨会话可见', async () => {
  const created = await memory.remember({
    kind: 'lesson',
    text: '跨会话共享：这个项目所有命令走 pnpm',
    origin: { sessionId: 'sess-1', workspaceId: 'ws-1' },
    confidence: 0.8,
    evidence: 2,
  });
  const hidden = await memory.recall('项目命令 pnpm', { context: { sessionId: 'sess-2', workspaceId: 'ws-1' }, limit: 8 });
  assert.ok(!hidden.items.some((entry) => entry.record.id === created.record.id));
  await memory.promote(created.record.id, 'workspace');
  const visible = await memory.recall('项目命令 pnpm', { context: { sessionId: 'sess-2', workspaceId: 'ws-1' }, limit: 8 });
  assert.ok(visible.items.some((entry) => entry.record.id === created.record.id), 'workspace sharing must be visible in same workspace');
});

await check('无会话上下文 → 只返回全局记忆', async () => {
  const result = await memory.recall('D 盘路径 引号 pwsh', { limit: 20 });
  assert.ok(result.items.every((entry) => (entry.record.sharing ?? 'private') === 'global'));
  const list = await memory.listVisible({ context: null, limit: 100 });
  assert.ok(list.items.every((record) => (record.sharing ?? 'private') === 'global'));
});

await check('去噪：占位与近似簇被标注，默认隐藏但不删除', async () => {
  const { annotate } = await import('../noise.js');
  const result = annotate([
    { id: 'n1', kind: 'skill', text: '安装插件后重启宿主', evidence: 3, confidence: 0.8, updatedAt: Date.now() },
    { id: 'n2', kind: 'skill', text: '安装插件之后再重启宿主', evidence: 1, confidence: 0.6, updatedAt: Date.now() },
    { id: 'n3', kind: 'skill', text: '继续', evidence: 1, confidence: 0.4, updatedAt: Date.now() },
  ], { groupKey: () => 'skill' });
  assert.ok(result.hidden >= 1, 'placeholder should be hidden');
  assert.ok(result.items.some((item) => (item.noise.reasons ?? []).includes('duplicate-in-cluster')));
  assert.equal(result.items.length, 3, 'annotation must not drop records');
});

await check('检索排序：词法命中的记录排在"高置信但无关"之前', async () => {
  const memory = new LingxiMemory({ dir: path.join(root, 'rank') });
  await memory.init();
  await memory.remember({
    kind: 'constraint',
    text: '回答不要用表格，用短句',
    scope: { kind: 'machine', id: '' },
    sharing: 'global',
    status: 'active',
    confidence: 0.99,
    evidence: 9,
  });
  await memory.remember({
    kind: 'preference',
    text: '做方案时先借鉴市场上的先进做法，不要闭门钻研',
    scope: { kind: 'machine', id: '' },
    sharing: 'global',
    status: 'active',
    confidence: 0.7,
    evidence: 3,
  });
  const result = await memory.recall('闭门钻研 先进做法', { limit: 5, context: { sessionId: '', workspaceId: '' } });
  assert.ok(result.items.length > 0);
  assert.ok(result.items[0].record.text.includes('闭门钻研'), result.items[0].record.text);
});

await check('弃答：完全无关的查询不硬凑记忆', async () => {
  const memory = new LingxiMemory({ dir: path.join(root, 'abstain') });
  await memory.init();
  await memory.remember({
    kind: 'fact',
    text: '本机输出目录是 D 盘',
    scope: { kind: 'machine', id: '' },
    sharing: 'global',
    status: 'active',
    confidence: 0.9,
    evidence: 5,
  });
  const result = await memory.recall('量子色动力学的渐近自由', { limit: 5, context: { sessionId: '', workspaceId: '' } });
  assert.equal(result.abstain, true);
  assert.equal(result.items.length, 0);
});

await check('主题精确召回：按工具主题命中的教训优先', async () => {
  const memory = new LingxiMemory({ dir: path.join(root, 'topic') });
  await memory.init();
  await memory.remember({
    kind: 'constraint',
    text: '回答不要用表格，用短句',
    scope: { kind: 'machine', id: '' },
    sharing: 'global',
    status: 'active',
    confidence: 0.99,
    evidence: 9,
  });
  await memory.remember({
    kind: 'lesson',
    text: '先用 glob 确认路径存在再读，别反复重试',
    scope: { kind: 'machine', id: '' },
    sharing: 'global',
    status: 'active',
    confidence: 0.6,
    evidence: 2,
    topics: ['tool:read', 'kind:lesson'],
  });
  const result = await memory.recall('read 又报错了', { limit: 5, context: { sessionId: '', workspaceId: '' } });
  assert.ok(result.items.length > 0);
  assert.ok((result.items[0].record.topics ?? []).includes('tool:read'), JSON.stringify(result.items.map((i) => i.record.topics)));
});

await check('隔离：private 记忆不跨会话泄漏', async () => {
  const memory = new LingxiMemory({ dir: path.join(root, 'iso-private') });
  await memory.init();
  await memory.remember({
    kind: 'constraint',
    text: '会话A的私有规则：回答必须用中文',
    scope: { kind: 'machine', id: '' },
    origin: { sessionId: 'sessA', workspaceId: 'wsA' },
    sharing: 'private',
    status: 'active',
    confidence: 0.9,
    evidence: 3,
  });
  const inA = await memory.listVisible({ context: { sessionId: 'sessA', workspaceId: 'wsA' }, limit: 20 });
  const inB = await memory.listVisible({ context: { sessionId: 'sessB', workspaceId: 'wsA' }, limit: 20 });
  const noSession = await memory.listVisible({ context: { sessionId: '', workspaceId: '' }, limit: 20 });
  assert.equal(inA.items.some((r) => r.text.includes('私有规则')), true);
  assert.equal(inB.items.some((r) => r.text.includes('私有规则')), false, 'must not leak to another session');
  assert.equal(noSession.items.some((r) => r.text.includes('私有规则')), false, 'must not leak without a session');
  const recallB = await memory.recall('私有规则 中文', { limit: 5, context: { sessionId: 'sessB', workspaceId: 'wsA' } });
  assert.equal(recallB.items.some((i) => i.record.text.includes('私有规则')), false);
});

await check('隔离：workspace 共享只跨同一工作区', async () => {
  const memory = new LingxiMemory({ dir: path.join(root, 'iso-ws') });
  await memory.init();
  await memory.remember({
    kind: 'fact',
    text: '工作区A的事实：构建命令是 pnpm build',
    scope: { kind: 'machine', id: '' },
    origin: { sessionId: 'sessA', workspaceId: 'wsA' },
    sharing: 'workspace',
    status: 'active',
    confidence: 0.9,
    evidence: 3,
  });
  const sameWs = await memory.listVisible({ context: { sessionId: 'sessB', workspaceId: 'wsA' }, limit: 20 });
  const otherWs = await memory.listVisible({ context: { sessionId: 'sessC', workspaceId: 'wsB' }, limit: 20 });
  assert.equal(sameWs.items.some((r) => r.text.includes('工作区A的事实')), true);
  assert.equal(otherWs.items.some((r) => r.text.includes('工作区A的事实')), false, 'must not leak to another workspace');
});

await check('隔离：global 记忆对所有会话可见', async () => {
  const memory = new LingxiMemory({ dir: path.join(root, 'iso-global') });
  await memory.init();
  await memory.remember({
    kind: 'preference',
    text: '全局偏好：先借鉴先进做法再转化',
    scope: { kind: 'machine', id: '' },
    origin: { sessionId: 'sessA', workspaceId: 'wsA' },
    sharing: 'global',
    status: 'active',
    confidence: 0.9,
    evidence: 3,
  });
  const anywhere = await memory.listVisible({ context: { sessionId: 'sessZ', workspaceId: 'wsZ' }, limit: 20 });
  assert.equal(anywhere.items.some((r) => r.text.includes('全局偏好')), true);
});

await check('列表：按状态/类型过滤，供面板下钻', async () => {
  const memory = new LingxiMemory({ dir: path.join(root, 'list') });
  await memory.init();
  const lessonRec = await memory.remember({
    kind: 'lesson',
    text: '先用 glob 确认路径再读',
    scope: { kind: 'machine', id: '' },
    sharing: 'global',
    status: 'active',
    confidence: 0.8,
    evidence: 2,
  });
  await memory.remember({
    kind: 'fact',
    text: '构建命令是 pnpm build',
    scope: { kind: 'machine', id: '' },
    sharing: 'global',
    status: 'candidate',
    confidence: 0.4,
    evidence: 1,
  });
  await memory.confirm(lessonRec.record.id, 'accept');
  const actives = await memory.listRecords({ status: 'active' });
  const candidates = await memory.listRecords({ status: 'candidate' });
  const lessons = await memory.listRecords({ kind: 'lesson' });
  assert.equal(actives.length, 1);
  assert.equal(candidates.length, 1);
  assert.equal(lessons.length, 1);
  assert.ok(lessons[0].text.includes('glob'));
  const helped = await memory.remember({
    kind: 'lesson',
    text: '关于配乐：先用 ffmpeg 生成静音轨再混音',
    scope: { kind: 'machine', id: '' },
    sharing: 'global',
    evidence: 1,
  });
  await memory.confirm(helped.record.id, 'accept');
  await memory.observe(helped.record.id, { hit: true });
  const withHits = await memory.listRecords({ minHits: 1 });
  assert.ok(withHits.some((r) => r.text.includes('关于配乐')));
});

await check('重置：先备份再清空/退役', async () => {
  const memory = new LingxiMemory({ dir: path.join(root, 'reset') });
  await memory.init();
  const keepRec = await memory.remember({
    kind: 'lesson',
    text: '保留的教训：先读再改',
    scope: { kind: 'machine', id: '' },
    sharing: 'global',
    status: 'active',
    confidence: 0.8,
    evidence: 2,
  });
  await memory.remember({
    kind: 'fact',
    text: '待退役的候选事实',
    scope: { kind: 'machine', id: '' },
    sharing: 'private',
    origin: { sessionId: 's1', workspaceId: 'w1' },
    status: 'candidate',
    confidence: 0.4,
    evidence: 1,
  });
  await memory.confirm(keepRec.record.id, 'accept');
  const partial = await memory.reset({ mode: 'candidates' });
  assert.equal(partial.removed, 1);
  assert.equal((await memory.listRecords({ status: 'candidate' })).length, 0);
  assert.equal((await memory.listRecords({ status: 'active' })).length, 1);
  const all = await memory.reset({ mode: 'all' });
  assert.equal(all.remaining, 0);
  assert.equal((await memory.listRecords({})).length, 0);
  const backups = await fsp.readdir(path.join(root, 'reset', 'backup')).catch(() => []);
  assert.ok(backups.length >= 1, JSON.stringify(backups));
});

await check('备份：可列出并从快照恢复', async () => {
  const memory = new LingxiMemory({ dir: path.join(root, 'restore') });
  await memory.init();
  await memory.remember({
    kind: 'fact',
    text: '快照里的第一条事实',
    scope: { kind: 'machine', id: '' },
    sharing: 'global',
    evidence: 1,
  });
  await memory.store.backup();
  const backups = await memory.listBackups();
  assert.ok(backups.length >= 1, JSON.stringify(backups));
  const snapshotCount = (await memory.listRecords({})).length;
  await memory.remember({
    kind: 'fact',
    text: '快照之后新增的一条事实',
    scope: { kind: 'machine', id: '' },
    sharing: 'global',
    evidence: 1,
  });
  const report = await memory.restoreBackup(backups[0].file);
  assert.equal(report.restored, snapshotCount);
  const texts = (await memory.listRecords({})).map((r) => r.text);
  assert.ok(texts.some((text) => text.includes('快照里的第一条事实')));
  assert.equal(texts.some((text) => text.includes('快照之后新增')), false);
});

await check('数据清洗：预览不删、执行才删、单条可删', async () => {
  const memory = new LingxiMemory({ dir: path.join(root, 'purge') });
  await memory.init();
  for (const [text, kind] of [
    ['清洗候选一：先读再改', 'lesson'],
    ['清洗候选二：先 glob 再 read', 'lesson'],
    ['清洗事实：构建命令是 pnpm build', 'fact'],
  ]) {
    await memory.remember({ kind, text, scope: { kind: 'machine', id: '' }, sharing: 'global', evidence: 1 });
  }
  const preview = await memory.purge({ status: 'candidate', kind: 'lesson' }, { dryRun: true });
  assert.equal(preview.wouldRemove, 2);
  assert.equal((await memory.listRecords({})).length, 3, 'preview must not delete');
  const run = await memory.purge({ status: 'candidate', kind: 'lesson' });
  assert.equal(run.removed, 2);
  assert.equal(run.backup, true);
  assert.equal((await memory.listRecords({})).length, 1);
  const remaining = await memory.listRecords({});
  const removedOne = await memory.deleteRecords([remaining[0].id]);
  assert.equal(removedOne.removed, 1);
  assert.equal((await memory.listRecords({})).length, 0);
});

await check('实测可靠性：命中过的记忆排在同等相关但被证伪的前面', async () => {
  const memory = new LingxiMemory({ dir: path.join(root, 'reliability') });
  await memory.init();
  const good = await memory.remember({
    kind: 'lesson',
    text: '改文件之前先 read 一次当前内容，避免版本过期',
    scope: { kind: 'machine', id: '' },
    sharing: 'global',
    evidence: 2,
  });
  const bad = await memory.remember({
    kind: 'lesson',
    text: '写文件时可以直接覆盖，不需要先读取',
    scope: { kind: 'machine', id: '' },
    sharing: 'global',
    evidence: 2,
  });
  await memory.confirm(good.record.id, 'accept');
  await memory.confirm(bad.record.id, 'accept');
  for (let i = 0; i < 4; i += 1) await memory.observe(good.record.id, { hit: true });
  for (let i = 0; i < 3; i += 1) await memory.observe(bad.record.id, { miss: true });
  const result = await memory.recall('改文件 之前 先 read 当前内容', { limit: 5, context: { sessionId: '', workspaceId: '' } });
  assert.ok(result.items.length > 0);
  assert.ok(result.items[0].record.text.includes('先 read'), result.items.map((i) => i.record.text));
});

await check('曝光计数：noteExposure 只加曝光不改置信', async () => {
  const memory = new LingxiMemory({ dir: path.join(root, 'exposure') });
  await memory.init();
  const created = await memory.remember({
    kind: 'lesson',
    text: '曝光测试：先读再改',
    scope: { kind: 'machine', id: '' },
    sharing: 'global',
    evidence: 1,
  });
  const id = created.record.id;
  const beforePath = (await memory.list({ limit: 50 })).find((record) => record.id === id);
  const beforeExposures = Number(beforePath.exposures ?? 0);
  const beforeConfidence = Number(beforePath.confidence);
  await memory.noteExposure([id, id, 'not-exist']);
  const after = (await memory.list({ limit: 50 })).find((record) => record.id === id);
  assert.equal(beforeExposures, 0);
  assert.equal(after.exposures, 1, 'per-call unique ids only');
  assert.equal(after.confidence, beforeConfidence);
});

await check('合并约束：不同工具的同名错误码不会被合并', async () => {
  const memory = new LingxiMemory({ dir: path.join(root, 'no-cross-merge') });
  await memory.init();
  const edit = await memory.remember({
    kind: 'lesson',
    text: '当「edit」遇到「FS_STALE_VERSION」时：写之前先 read 一次，再 edit',
    scope: { kind: 'machine', id: '' },
    sharing: 'global',
    meta: { tool: 'edit', code: 'FS_STALE_VERSION' },
    topics: ['tool:edit', 'kind:lesson'],
    evidence: 3,
  });
  const write = await memory.remember({
    kind: 'lesson',
    text: '当「write」遇到「FS_STALE_VERSION」时：写之前先 read 一次，再 edit',
    scope: { kind: 'machine', id: '' },
    sharing: 'global',
    meta: { tool: 'write', code: 'FS_STALE_VERSION' },
    topics: ['tool:write', 'kind:lesson'],
    evidence: 3,
  });
  assert.notEqual(edit.record.id, write.record.id, 'different tools must stay separate');
  const lessons = (await memory.listRecords({ kind: 'lesson' })).filter((record) => record.status !== 'retired');
  assert.equal(lessons.length, 2, JSON.stringify(lessons.map((record) => record.meta?.tool)));
  const codes = (await memory.listRecords({ kind: 'lesson' })).filter((record) => record.status !== 'retired').map((record) => record.meta?.tool + '|' + record.meta?.code);
  assert.ok(codes.includes('edit|FS_STALE_VERSION'));
  assert.ok(codes.includes('write|FS_STALE_VERSION'));
});

await check('导出与导入往返：缺则补、重复跳过', async () => {
  const source = new LingxiMemory({ dir: path.join(root, 'export-src') });
  await source.init();
  await source.remember({ kind: 'fact', text: '导出事实一：构建命令 pnpm build', scope: { kind: 'machine', id: '' }, sharing: 'global', evidence: 1 });
  await source.remember({ kind: 'lesson', text: '导出教训二：写前先 read', scope: { kind: 'machine', id: '' }, sharing: 'global', evidence: 2 });
  const dump = await source.exportAll();
  assert.equal(dump.total, 2);

  const target = new LingxiMemory({ dir: path.join(root, 'export-dst') });
  await target.init();
  const first = await target.importRecords(dump.records);
  assert.equal(first.imported, 2);
  assert.equal(first.skipped, 0);
  const second = await target.importRecords(dump.records);
  assert.equal(second.imported, 0);
  assert.equal(second.skipped, 2);
  const texts = (await target.list({ limit: 20 })).map((record) => record.text);
  assert.ok(texts.some((text) => text.includes('pnpm build')));
});

await check('导入预览不写入：dryRun 只算数量', async () => {
  const source = new LingxiMemory({ dir: path.join(root, 'dry-src') });
  await source.init();
  await source.remember({ kind: 'fact', text: '预览事实：输出目录是 D 盘', scope: { kind: 'machine', id: '' }, sharing: 'global', evidence: 1 });
  const dump = await source.exportAll();
  const target = new LingxiMemory({ dir: path.join(root, 'dry-dst') });
  await target.init();
  const preview = await target.importRecords(dump.records, { dryRun: true });
  assert.equal(preview.imported, 1);
  assert.equal((await target.list({ limit: 10 })).length, 0, 'dryRun must not write');
  const real = await target.importRecords(dump.records);
  assert.equal(real.imported, 1);
  assert.equal((await target.list({ limit: 10 })).length, 1);
});

await check('退役与降级记录原因', async () => {
  const memory = new LingxiMemory({ dir: path.join(root, 'reasons') });
  await memory.init();
  const created = await memory.remember({ kind: 'fact', text: '原因测试：临时结论', scope: { kind: 'machine', id: '' }, sharing: 'global', evidence: 1 });
  await memory.confirm(created.record.id, 'retire', 'user-deleted');
  let record = (await memory.list({ status: 'retired', limit: 10 })).find((item) => item.id === created.record.id);
  assert.equal(record.meta?.retireReason, 'user-deleted');

  const second = await memory.remember({ kind: 'lesson', text: '原因测试：先读再写', scope: { kind: 'machine', id: '' }, sharing: 'global', evidence: 1 });
  await memory.confirm(second.record.id, 'accept');
  await memory.demote(second.record.id, 'warn-ineffective');
  record = (await memory.list({ limit: 20 })).find((item) => item.id === second.record.id);
  assert.equal(record.status, 'candidate');
  assert.equal(record.meta?.demoteReason, 'warn-ineffective');
});

await check('精确撤销最近一次删除：只恢复被删的条目', async () => {
  const memory = new LingxiMemory({ dir: path.join(root, 'undo') });
  await memory.init();
  const a = await memory.remember({ kind: 'fact', text: '撤销用：本机的临时构建缓存目录', scope: { kind: 'machine', id: '' }, sharing: 'global', evidence: 1 });
  const b = await memory.remember({ kind: 'fact', text: '保留用：发布流程需要先跑回归测试', scope: { kind: 'machine', id: '' }, sharing: 'global', evidence: 1 });
  await memory.deleteRecords([a.record.id]);
  assert.equal((await memory.list({ limit: 10 })).length, 1);
  const report = await memory.restoreLastDeleted();
  assert.equal(report.restored, 1);
  const after = await memory.list({ limit: 10 });
  assert.equal(after.length, 2);
  assert.ok(after.some((record) => record.text.includes('临时构建缓存目录')));
  assert.ok(after.some((record) => record.text.includes('发布流程需要先跑回归测试')));
  const again = await memory.restoreLastDeleted();
  assert.equal(again.restored, 0);
});
console.log(`\n${checks.join('\n')}`);
console.log(`\n通过 ${passed} 项；存储目录 ${dir}`);

const health = await memory.health();
console.log(
  JSON.stringify(
    {
      total: health.total,
      byKind: health.byKind,
      byStatus: health.byStatus,
      pendingConfirmation: health.pendingConfirmation,
      contradictionPairs: health.contradictionPairs,
      avgConfidence: Number(health.averageEffectiveConfidence.toFixed(3)),
      bytes: health.bytes,
    },
    null,
    2,
  ),
);

await fsp.rm(root, { recursive: true, force: true });

await check('检索排序：词法命中的记录排在"高置信但无关"之前', async () => {
  const memory = new LingxiMemory({ dir: path.join(root, 'rank') });
  await memory.init();
  await memory.remember({
    kind: 'constraint',
    text: '回答不要用表格，用短句',
    scope: { kind: 'machine', id: '' },
    sharing: 'global',
    status: 'active',
    confidence: 0.99,
    evidence: 9,
  });
  await memory.remember({
    kind: 'preference',
    text: '做方案时先借鉴市场上的先进做法，不要闭门钻研',
    scope: { kind: 'machine', id: '' },
    sharing: 'global',
    status: 'active',
    confidence: 0.7,
    evidence: 3,
  });
  const result = await memory.recall('闭门钻研 先进做法', { limit: 5, context: { sessionId: '', workspaceId: '' } });
  assert.ok(result.items.length > 0);
  assert.ok(result.items[0].record.text.includes('闭门钻研'), result.items[0].record.text);
});

await check('弃答：完全无关的查询不硬凑记忆', async () => {
  const memory = new LingxiMemory({ dir: path.join(root, 'abstain') });
  await memory.init();
  await memory.remember({
    kind: 'fact',
    text: '本机输出目录是 D 盘',
    scope: { kind: 'machine', id: '' },
    sharing: 'global',
    status: 'active',
    confidence: 0.9,
    evidence: 5,
  });
  const result = await memory.recall('量子色动力学的渐近自由', { limit: 5, context: { sessionId: '', workspaceId: '' } });
  assert.equal(result.abstain, true);
  assert.equal(result.items.length, 0);
});

console.log('清理完成');

