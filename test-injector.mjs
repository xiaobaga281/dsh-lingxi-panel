/**
 * 灵犀 · 记忆注入器自测（纯本地，无网络）
 * 运行：node test-injector.mjs
 */
import assert from 'node:assert/strict';
import { canonicalFailure, createInjector, looksLikeCorrection, userMessageText } from './injector.js';

const calls = [];
function fakeMemory(options = {}) {
  const { topicHits = null, text = '【灵犀记忆】\n用户约束：\n- 先读再改', items = [{ record: { id: 'm1', kind: 'lesson', text: '当「read」遇到「FS_NOT_FOUND」时先确认路径存在', confidence: 0.8, topics: ['tool:read'], scope: { kind: 'machine', id: '' }, evidence: 2, status: 'candidate', provenance: [], meta: {} } }], ...memory } = options;
  return {
    async recall(query, options) {
      calls.push(['recall', query, options?.context?.sessionId]);
      return { items, text, chars: text.length, confident: text !== '', abstain: text === '' };
    },
    async observe(id, outcome) {
      calls.push(['observe', id, outcome]);
      return { id };
    },
    async findByTopic(topic, options) {
      calls.push(['findByTopic', topic, options?.context?.sessionId]);
      return typeof topicHits === 'function' ? topicHits(topic) : [];
    },

    ...(memory.listVisible !== undefined
      ? { listVisible: typeof memory.listVisible === 'function' ? memory.listVisible : async () => memory.listVisible }
      : { listVisible: async () => ({ items: [], total: 0, blocked: 0 }) }),
    noteExposure: async () => 0,
    async find() { return null; },
    async exportAll() { return { records: [] }; },
    async importRecords() { return { imported: 0, skipped: 0 }; },

    async remember(input, options) {
      calls.push(['remember', input, options?.context?.sessionId]);
      const seen = calls.filter((c) => c[0] === 'remember' && c[1].text === input.text).length;
      return { action: seen > 1 ? 'update' : 'created' };
    },
  };
}

const checks = [];
async function check(name, fn) {
  try {
    await fn();
    checks.push(`  ok  ${name}`);
  } catch (error) {
    checks.push(`  FAIL ${name}: ${error.message}`);
    throw error;
  }
}

await check('刷新后 section 文本可同步读取；未刷新的会话为空', async () => {
  const injector = createInjector({ memory: fakeMemory(), listWorkspace: async () => 'ws-1' });
  await injector.refresh('s1', 'pwsh 路径报错');
  assert.ok(injector.textFor('s1').includes('灵犀记忆'));
  assert.ok(injector.textFor('s1').includes('用户当前指令为准'));
  assert.equal(injector.textFor('s2'), '');
  assert.ok(calls.some((c) => c[0] === 'recall' && c[2] === 's1'));
});

await check('无相关记忆时不注入（abstain → 空文本）', async () => {
  const injector = createInjector({ memory: fakeMemory({ text: '', items: [] }) });
  await injector.refresh('s1', '量子退相干');
  assert.equal(injector.textFor('s1'), '');
});

await check('注入后用户纠正 → 对注入的记忆记 miss', async () => {
  calls.length = 0;
  const injector = createInjector({ memory: fakeMemory() });
  await injector.refresh('s1', '改面板');
  await injector.onUserMessage('s1', '我说了不要这样做');
  assert.ok(calls.some((c) => c[0] === 'observe' && c[2]?.miss === true));
  assert.ok(injector.stats().misses >= 1);
});

await check('注入后工具成功 → 记一次 hit，且不重复计数', async () => {
  calls.length = 0;
  const injector = createInjector({ memory: fakeMemory() });
  await injector.refresh('s1', '改面板');
  await injector.onToolResult({ name: 'read', agent: { id: 's1' } }, { isError: false, value: 1 });
  await injector.onToolResult({ name: 'read', agent: { id: 's1' } }, { isError: false, value: 2 });
  const hits = calls.filter((c) => c[0] === 'observe' && c[2]?.hit === true);
  assert.equal(hits.length, 1, `hits=${hits.length}`);
  assert.equal(injector.stats().hits, 1);
});

await check('同一失败第 2 次 → 自动沉淀为 private lesson 并刷新', async () => {
  calls.length = 0;
  const injector = createInjector({ memory: fakeMemory(), listWorkspace: async () => 'ws-1', config: { captureThreshold: 2 } });
  const failure = { isError: true, error: { info: { code: 'ENOENT' }, message: '路径不存在，命令失败' } };
  await injector.onToolResult({ name: 'pwsh', agent: { id: 's1' } }, failure);
  assert.equal(calls.filter((c) => c[0] === 'remember').length, 0, 'first failure must not capture');
  await injector.onToolResult({ name: 'pwsh', agent: { id: 's1' } }, failure);
  const captured = calls.find((c) => c[0] === 'remember');
  assert.ok(captured !== undefined, 'second failure must capture');
  assert.equal(captured[1].kind, 'lesson');
  assert.equal(captured[1].origin.sessionId, 's1');
  assert.ok(captured[1].text.includes('pwsh'));
  assert.ok(captured[1].text.includes('ENOENT'));
  assert.equal(captured[2], 's1');
  assert.ok(injector.stats().captured >= 1);
  const afterCapture = calls.filter((c) => c[0] === 'recall').length;
  assert.ok(afterCapture >= 1, 'capture should refresh the session block');
});

await check('纠正判据与消息文本提取', async () => {
  assert.equal(looksLikeCorrection('我说了不要这样做'), true);
  assert.equal(looksLikeCorrection('继续实现'), false);
  const text = userMessageText({ content: [{ type: 'text', text: '第一行' }, { type: 'image' }, { type: 'text', text: '第二行' }] });
  assert.equal(text, '第一行\n第二行');
});

await check('会话销毁后清空状态', async () => {
  const injector = createInjector({ memory: fakeMemory() });
  await injector.refresh('s1', 'x');
  assert.ok(injector.textFor('s1') !== '');
  injector.drop('s1');
  assert.equal(injector.textFor('s1'), '');
  assert.equal(injector.stats().sessions, 0);
});


await check('失败文本规范化：同一场景得到同一键', async () => {
  const a = canonicalFailure('C:\\work\\demo\\foo.mjs 第 12 行报错，exit code 1');
  const b = canonicalFailure('D:\\9\\other\\bar.mjs 第 874 行报错，exit code 2');
  assert.equal(a, b);
  assert.ok(a.includes('<path>'));
  assert.ok(a.includes('<n>'));
});

await check('沉淀后同一失败再犯 → 加强同一条而不是新增', async () => {
  calls.length = 0;
  const injector = createInjector({ memory: fakeMemory(), listWorkspace: async () => 'ws-1', config: { captureThreshold: 2 } });
  const failure = { isError: true, error: { info: { code: 'EACCES' }, message: '权限不足 D:\\a\\b.txt' } };
  await injector.onToolResult({ name: 'edit', agent: { id: 's1' } }, failure);
  await injector.onToolResult({ name: 'edit', agent: { id: 's1' } }, failure);
  const captured = calls.filter((c) => c[0] === 'remember');
  assert.equal(captured.length, 1, 'first capture');
  const text = captured[0][1].text;
  await injector.onToolResult({ name: 'edit', agent: { id: 's1' } }, { isError: true, error: { info: { code: 'EACCES' }, message: '权限不足 D:\\c\\d.txt' } });
  const capturedAgain = calls.filter((c) => c[0] === 'remember');
  assert.equal(capturedAgain.length, 2, 'repeat should reinforce the same record');
  assert.equal(capturedAgain[1][1].text, text, 'must reuse the same text so the store merges it');
  assert.equal(injector.stats().repeatFailures, 1);
  assert.equal(injector.stats().refined, 1);
});

await check('开关：暂停后不再注入，恢复后重新注入', async () => {
  const injector = createInjector({ memory: fakeMemory() });
  await injector.refresh('s1', 'pwsh');
  assert.ok(injector.textFor('s1') !== '');
  injector.configure({ enabled: false });
  assert.equal(injector.config().enabled, false);
  await injector.refresh('s1', 'pwsh');
  assert.equal(injector.textFor('s1'), '');
  injector.configure({ enabled: true });
  await injector.refresh('s1', 'pwsh');
  assert.ok(injector.textFor('s1') !== '');
});

await check('预算可运行时调整', async () => {
  const injector = createInjector({ memory: fakeMemory() });
  const next = injector.configure({ charBudget: 1200, captureThreshold: 3 });
  assert.equal(next.charBudget, 1200);
  assert.equal(next.captureThreshold, 3);
  assert.equal(injector.stats().charBudget, 1200);
});


await check('同轮纠错：失败后返回相关记忆提示，且一轮内不重复', async () => {
  calls.length = 0;
  const injector = createInjector({ memory: fakeMemory(), listWorkspace: async () => 'ws-1' });
  const failure = { isError: true, error: { info: { code: 'FS_NOT_FOUND' }, message: '文件不存在' } };
  const warning = await injector.warningFor({ name: 'read', agent: { id: 's1' } }, failure);
  assert.ok(warning !== null);
  assert.ok(warning.text.includes('灵犀提示'));
  assert.ok(warning.ids.length >= 1);
  const again = await injector.warningFor({ name: 'read', agent: { id: 's1' } }, failure);
  assert.equal(again, null, 'same turn must not repeat the warning');
  await injector.onUserMessage('s1', '继续');
  const after = await injector.warningFor({ name: 'read', agent: { id: 's1' } }, failure);
  assert.ok(after !== null, 'a new user message resets the warning cache');
  assert.ok(injector.stats().warned >= 2);
});

await check('成功结果不产生提示', async () => {
  const injector = createInjector({ memory: fakeMemory() });
  const warning = await injector.warningFor({ name: 'read', agent: { id: 's1' } }, { isError: false, value: 1 });
  assert.equal(warning, null);
});


await check('词法 abstain 时按 tool 主题兜底命中', async () => {
  const memory = fakeMemory({ text: '', items: [] });
  memory.findByTopic = async (topic) => {
    if (topic !== 'tool:read') return [];
    return [{ id: 'topic-1', kind: 'lesson', text: '当「read」遇到「FS_NOT_FOUND」时先确认路径存在', topics: ['tool:read'] }];
  };
  const injector = createInjector({ memory, listWorkspace: async () => 'ws-1' });
  const warning = await injector.warningFor(
    { name: 'read', agent: { id: 's1' } },
    { isError: true, error: { info: { code: 'FS_NOT_FOUND' }, message: 'object not found' } },
  );
  assert.ok(warning !== null, 'topic fallback should produce a warning');
  assert.ok(warning.text.includes('read'));
  assert.deepEqual(warning.ids, ['topic-1']);
  assert.equal(injector.stats().warnChecked >= 1, true);
});

await check('未知错误码且无相关记忆时不打扰', async () => {
  const memory = fakeMemory({ text: '', items: [] });
  memory.findByTopic = async () => [];
  const injector = createInjector({ memory });
  const warning = await injector.warningFor(
    { name: 'whatever', agent: { id: 's2' } },
    { isError: true, error: { info: { code: 'TOTALLY_UNKNOWN' }, message: '失败' } },
  );
  assert.equal(warning, null);
});


await check('主动召回：最近用过的工具，其教训不依赖问题里的关键词', async () => {
  const memory = fakeMemory({ text: '', items: [] });
  memory.findByTopic = async (topic) => {
    if (topic !== 'tool:pwsh') return [];
    return [{ id: 'tool-lesson', kind: 'lesson', text: '当「pwsh」报错时先确认路径与依赖', topics: ['tool:pwsh'], scope: { kind: 'machine', id: '' }, evidence: 2, confidence: 0.8, status: 'candidate', provenance: [], meta: {} }];
  };
  const injector = createInjector({ memory, listWorkspace: async () => 'ws-1' });
  await injector.onToolResult({ name: 'pwsh', agent: { id: 's1' } }, { isError: false, value: 1 });
  await injector.onUserMessage('s1', '继续');
  assert.ok(injector.textFor('s1').includes('pwsh'), injector.textFor('s1'));
  const ids = injector.stats().samples?.[0]?.records ?? 0;
  assert.ok(ids >= 0);
});


await check('提示之后工具成功 → 判为有效，并给相关记忆记 hit', async () => {
  calls.length = 0;
  const injector = createInjector({ memory: fakeMemory(), listWorkspace: async () => 'ws-1' });
  const failure = { isError: true, error: { info: { code: 'FS_NOT_FOUND' }, message: '文件不存在' } };
  const warning = await injector.warningFor({ name: 'read', agent: { id: 's1' } }, failure);
  assert.ok(warning !== null);
  await injector.onToolResult({ name: 'read', agent: { id: 's1' } }, { isError: false, value: 1 });
  assert.equal(injector.stats().warnEffective, 1);
  assert.ok(calls.some((c) => c[0] === 'observe' && c[2]?.hit === true));
});

await check('提示之后同一失败再犯 → 判为无效，并给相关记忆记 miss', async () => {
  calls.length = 0;
  const injector = createInjector({ memory: fakeMemory(), listWorkspace: async () => 'ws-1' });
  const failure = { isError: true, error: { info: { code: 'FS_NOT_FOUND' }, message: '文件不存在' } };
  const warning = await injector.warningFor({ name: 'read', agent: { id: 's1' } }, failure);
  assert.ok(warning !== null);
  await injector.onToolResult({ name: 'read', agent: { id: 's1' } }, failure);
  assert.equal(injector.stats().warnIneffective, 1);
  assert.ok(calls.some((c) => c[0] === 'observe' && c[2]?.miss === true));
});


await check('教训文案：按错误码给可执行动作，未知码退回通用', async () => {
  const { lessonTextFor, remedyFor } = await import('./lessons.js');
  const notFound = lessonTextFor({ tool: 'read', code: 'FS_NOT_FOUND', detail: '<path>' });
  assert.ok(notFound.includes('glob'), notFound);
  assert.ok(notFound.includes('read'));
  assert.ok(notFound.includes('最近一次'));
  const stale = lessonTextFor({ tool: 'edit', code: 'FS_STALE_VERSION' });
  assert.ok(stale.includes('read'));
  const unknown = lessonTextFor({ tool: 'foo', code: 'SOMETHING_ELSE' });
  assert.ok(unknown.includes('先确认参数与前置条件'));
  assert.equal(remedyFor('').action.includes('先确认参数'), true);
});


await check('场景分类与每场景预算', async () => {
  const { sceneOf } = await import('./scenes.js');
  assert.equal(sceneOf('read'), 'file');
  assert.equal(sceneOf('glob'), 'file');
  assert.equal(sceneOf('pwsh'), 'command');
  assert.equal(sceneOf('web_fetch'), 'web');
  assert.equal(sceneOf('present'), 'other');

  const injector = createInjector({ memory: fakeMemory(), listWorkspace: async () => 'ws-1' });
  await injector.onToolResult(
    { name: 'read', agent: { id: 's1' } },
    { isError: true, error: { info: { code: 'FS_NOT_FOUND' }, message: '文件不存在' } },
  );
  const scene = injector.sceneSnapshot().file;
  assert.ok(scene.failures >= 1, JSON.stringify(scene));
  const configured = injector.configureScene('file', { charBudget: 400 });
  assert.equal(configured.charBudget, 400);
  assert.equal(injector.sceneSnapshot().file.charBudget, 400);
});


await check('程序性记忆：窗口滑动与流程描述', async () => {
  const { MIN_REPEAT, WINDOW, describeSequence, pushStep, sequenceKey } = await import('./procedures.js');
  assert.ok(WINDOW >= 4);
  assert.ok(MIN_REPEAT >= 1);

  let seq = [];
  let candidate = null;
  for (const tool of ['read', 'edit', 'read', 'edit', 'read', 'edit']) {
    const stepped = pushStep(seq, tool);
    seq = stepped.sequence;
    if (stepped.candidate !== null) candidate = stepped.candidate;
  }
  assert.ok(candidate !== null, 'window should produce a candidate');
  assert.equal(candidate.tools.length, WINDOW);
  assert.ok(sequenceKey(candidate.tools).length > 0);
  assert.ok(describeSequence(candidate.tools).includes('流程'));
  assert.ok(candidate.text.length > 0);
  // 窗口满后保留 overlap 步，序列可以继续滑动
  assert.ok(seq.length < WINDOW);
});

await check('程序性记忆：单一工具连刷不算流程', async () => {
  const { pushStep } = await import('./procedures.js');
  let seq = [];
  let candidate = null;
  for (let i = 0; i < 8; i += 1) {
    const stepped = pushStep(seq, 'pwsh');
    seq = stepped.sequence;
    if (stepped.candidate !== null) candidate = stepped.candidate;
  }
  assert.equal(candidate, null, 'single-tool repetition must not be a procedure');
});

await check('程序性记忆：失败不应产生流程候选', async () => {
  const { pushStep } = await import('./procedures.js');
  const stepped = pushStep(['read'], 'edit');
  assert.equal(stepped.candidate, null);
  assert.deepEqual(stepped.sequence, ['read', 'edit']);
});

await check('程序性记忆：跨会话门槛', async () => {
  const { shouldCreateProcedure } = await import('./procedures.js');
  assert.equal(shouldCreateProcedure({ sessions: new Set(['a']) }), false);
  assert.equal(shouldCreateProcedure({ sessions: new Set(['a', 'b']) }), true);
  assert.equal(shouldCreateProcedure({ sessions: new Set(['a', 'b']), created: true }), false);
  assert.equal(shouldCreateProcedure({ sessions: 2 }), true);
  assert.equal(shouldCreateProcedure({}), false);
});

await check('程序性记忆：模式键对滑动不敏感', async () => {
  const { sequenceKey } = await import('./procedures.js');
  assert.equal(sequenceKey(['read', 'glob', 'read']), sequenceKey(['glob', 'read', 'glob']));
  assert.notEqual(sequenceKey(['read', 'edit']), sequenceKey(['edit', 'write']));
  assert.equal(sequenceKey([]), '');
});


await check('核心记忆弱相关门：相关注入，无关不硬塞', async () => {
  const memory = fakeMemory({ text: '', items: [] });
  // recall 返回 abstain，但核心注入走 listVisible，与 recall 无关 —— 修 fixture：让 text 含核心条目文本以便断言可区分
  memory.listVisible = async () => ({
    items: [
      { id: 'core-1', kind: 'constraint', text: '改文件前先 read 一次当前内容', status: 'active', scope: { kind: 'machine', id: '' }, evidence: 9, confidence: 0.95, topics: ['tool:edit'], provenance: [], meta: {} },
      { id: 'core-2', kind: 'fact', text: '本机输出目录是 D 盘', status: 'active', scope: { kind: 'machine', id: '' }, evidence: 3, confidence: 0.8, topics: [], provenance: [], meta: {} },
    ],
    total: 2,
    blocked: 0,
  });
  memory.findByTopic = async () => [];
  const injector = createInjector({ memory, listWorkspace: async () => 'ws-1' });
  // 问输出目录 → 目录相关注入，文件约束无关被挡
  await injector.refresh('s1', '本机的输出目录在哪');
  const text = injector.textFor('s1');
  assert.ok(text.includes('输出目录'), text.slice(0, 150));
  assert.equal(text.includes('先 read'), false, 'unrelated core must be gated');
  assert.ok((injector.stats().coreGated ?? 0) >= 1);

  // 换成改文件任务 → 文件约束相关注入
  await injector.refresh('s2', '帮我改一下这个文件');
  const text2 = injector.textFor('s2');
  assert.ok(text2.includes('先 read'), 'related core should inject: ' + text2.slice(0, 150));
});


await check('规则提取：只抓明确指令，跳过疑问句与寒暄', async () => {
  const { extractInstructions } = await import('./instructions.js');
  const rules = extractInstructions('以后都用 pnpm 装依赖。为什么不用 npm？好的，不要动 D 盘那个目录。这个文件是什么？我更喜欢简短的回复。');
  assert.ok(rules.length >= 2, JSON.stringify(rules));
  assert.equal(rules[0].kind, 'constraint');
  assert.ok(rules.some((rule) => rule.text.includes('pnpm')));
  assert.ok(rules.some((rule) => rule.text.includes('不要动')));
  assert.ok(rules.every((rule) => !rule.text.includes('为什么')));
  assert.ok(rules.every((rule) => !rule.text.includes('？')));
  assert.equal(extractInstructions('你好').length, 0);
  assert.equal(extractInstructions('').length, 0);
  const pref = extractInstructions('我更喜欢简短一点的回答。');
  assert.equal(pref[0].kind, 'preference');
});


await check('回填元数据：从文本推断工具与错误码', async () => {
  const { inferToolMeta } = await import('./lessons.js');
  assert.deepEqual(inferToolMeta('当「read」遇到「FS_NOT_FOUND」时：先用 glob 确认路径'), { tool: 'read', code: 'FS_NOT_FOUND' });
  assert.equal(inferToolMeta('这条没有任何工具名和错误码'), null);
  const glob = inferToolMeta('用 grep 搜索时注意模式');
  assert.equal(glob.tool, 'grep');
  assert.equal(glob.code, '');
});


await check('工具守卫：同一调用原样重试会被拒，换参数放行', async () => {
  const injector = createInjector({ memory: fakeMemory(), listWorkspace: async () => 'ws-1' });
  const exec = { name: 'read', agent: { id: 's1' }, arguments: { path: 'a.txt', limit: 5 } };
  const failure = { isError: true, error: { info: { code: 'FS_NOT_FOUND' }, message: '文件不存在' } };
  await injector.onToolResult(exec, failure);
  const denied = injector.guardCall({ ...exec, arguments: { limit: 5, path: 'a.txt' } });
  assert.equal(typeof denied, 'string');
  assert.ok(denied.includes('不要原样重试'), denied);
  assert.ok(denied.includes('glob') || denied.includes('列目录'), denied);
  assert.equal(injector.guardCall({ ...exec }), undefined, 'already denied once');
  const otherArgs = { name: 'read', agent: { id: 's1' }, arguments: { path: 'b.txt' } };
  assert.equal(injector.guardCall(otherArgs), undefined);
  assert.equal(injector.stats().guardDenied, 1);
  await injector.onToolResult(exec, { isError: false, value: 1 });
  assert.equal(injector.stats().guardEffective, 1);
});

await check('工具守卫：拒了还失败记为无效', async () => {
  const injector = createInjector({ memory: fakeMemory(), listWorkspace: async () => 'ws-1' });
  const exec = { name: 'edit', agent: { id: 's1' }, arguments: { path: 'x.md' } };
  const failure = { isError: true, error: { info: { code: 'FS_STALE_VERSION' }, message: '版本过期' } };
  await injector.onToolResult(exec, failure);
  assert.equal(typeof injector.guardCall({ ...exec }), 'string');
  await injector.onToolResult(exec, failure);
  assert.equal(injector.stats().guardIneffective, 1);
});

await check('同轮提示只留相关条目：流程型教训不参与报错提示', async () => {
  const memory = fakeMemory({ text: '', items: [] });
  memory.findByTopic = async () => [];
  memory.recall = async () => ({
    items: [
      { record: { id: 'p1', kind: 'lesson', text: '当用户重问同一件事时：先复述约束', confidence: 0.9, topics: ['kind:lesson'], scope: { kind: 'machine', id: '' }, evidence: 3 } },
      { record: { id: 'p2', kind: 'lesson', text: '当「read」遇到「FS_NOT_FOUND」时：先用 glob 确认路径', confidence: 0.8, topics: ['tool:read', 'kind:lesson'], scope: { kind: 'machine', id: '' }, evidence: 2 } },
    ],
    abstain: false,
  });
  const injector = createInjector({ memory, listWorkspace: async () => 'ws-1' });
  const warning = await injector.warningFor(
    { name: 'read', agent: { id: 's1' } },
    { isError: true, error: { info: { code: 'FS_NOT_FOUND' }, message: '文件不存在' } },
  );
  assert.ok(warning !== null);
  assert.ok(warning.text.includes('glob'), warning.text);
  assert.equal(warning.text.includes('重问'), false, warning.text);
});

await check('守卫有效判定：拒绝后换个参数成功也算有效', async () => {
  const injector = createInjector({ memory: fakeMemory(), listWorkspace: async () => 'ws-1' });
  const exec = { name: 'read', agent: { id: 's1' }, arguments: { path: 'missing.md' } };
  const failure = { isError: true, error: { info: { code: 'FS_NOT_FOUND' }, message: '文件不存在' } };
  await injector.onToolResult(exec, failure);
  assert.equal(typeof injector.guardCall({ ...exec }), 'string');
  await injector.onToolResult({ name: 'read', agent: { id: 's1' }, arguments: { path: 'found.md' } }, { isError: false, value: 1 });
  assert.equal(injector.stats().guardEffective, 1);
  assert.equal(injector.stats().guardIneffective, 0);
});


await check('命中只算场景相关：无关工具成功不刷命中', async () => {
  const memory = fakeMemory({
    text: '【灵犀记忆】\n- 当「read」遇到「FS_NOT_FOUND」时先确认路径',
    items: [{ record: { id: 'rel', kind: 'lesson', status: 'active', text: '当「read」遇到「FS_NOT_FOUND」时先确认路径', confidence: 0.8, topics: ['tool:read', 'kind:lesson'], scope: { kind: 'machine', id: '' }, evidence: 2, provenance: [] } }],
  });
  const injector = createInjector({ memory, listWorkspace: async () => 'ws-1' });
  await injector.onUserMessage('s1', '继续');
  await injector.onToolResult({ name: 'pwsh', agent: { id: 's1' } }, { isError: false });
  const observed = () => calls.filter((c) => c[0] === 'observe' && c[2]?.hit === true).length;
  assert.equal(observed(), 0, 'unrelated tool must not credit the lesson');
  await injector.onToolResult({ name: 'read', agent: { id: 's1' } }, { isError: false });
  assert.equal(observed(), 1, 'related tool credits the lesson once');
});

await check('同轮提示：库里无教训时按错误码给动作', async () => {
  const memory = fakeMemory({ text: '', items: [] });
  memory.findByTopic = async () => [];
  const injector = createInjector({ memory, listWorkspace: async () => 'ws-1' });
  const warning = await injector.warningFor(
    { name: 'read', agent: { id: 's1' } },
    { isError: true, error: { info: { code: 'FS_NOT_FOUND' }, message: '文件不存在' } },
  );
  assert.ok(warning !== null);
  assert.ok(warning.text.includes('glob'), warning.text);
  assert.equal(injector.stats().warned, 1);
  const unknown = await injector.warningFor(
    { name: 'whatever', agent: { id: 's1' } },
    { isError: true, error: { info: { code: 'SOMETHING_WEIRD' }, message: '未知错误' } },
  );
  assert.equal(unknown, null, 'generic fallback should stay silent');
});

await check('用户纠正只惩罚相关记忆，不连坐', async () => {
  const memory = fakeMemory({
    text: '【灵犀记忆】\n- read 教训\n- edit 教训',
    items: [
      { record: { id: 'read-lesson', kind: 'lesson', status: 'active', text: '当「read」遇到「FS_NOT_FOUND」时先用 glob', topics: ['tool:read', 'kind:lesson'], confidence: 0.8, scope: { kind: 'machine', id: '' }, evidence: 2, provenance: [] } },
      { record: { id: 'edit-lesson', kind: 'lesson', status: 'active', text: '当「edit」遇到「FS_STALE_VERSION」时先 read', topics: ['tool:edit', 'kind:lesson'], confidence: 0.8, scope: { kind: 'machine', id: '' }, evidence: 2, provenance: [] } },
    ],
  });
  const injector = createInjector({ memory, listWorkspace: async () => 'ws-1' });
  await injector.onUserMessage('s1', '继续');
  await injector.onUserMessage('s1', '不对，read 又报错了，路径还是错的');
  const missed = calls.filter((call) => call[0] === 'observe' && call[2]?.miss === true).map((call) => call[1]);
  assert.ok(missed.includes('read-lesson'), JSON.stringify(missed));
  assert.equal(missed.includes('edit-lesson'), false, 'unrelated lesson must not be punished');
});

await check('注入样本带全文，便于核对是否真的进了上下文', async () => {
  const memory = fakeMemory({
    text: '【灵犀记忆】\n- 当「edit」遇到「FS_STALE_VERSION」时先 read 再改',
    items: [{ record: { id: 'e1', kind: 'lesson', status: 'active', text: '当「edit」遇到「FS_STALE_VERSION」时先 read 再改', topics: ['tool:edit'], confidence: 0.8, scope: { kind: 'machine', id: '' }, evidence: 2, provenance: [] } }],
  });
  const injector = createInjector({ memory, listWorkspace: async () => 'ws-1' });
  await injector.refresh('s1', '改文件');
  const sample = (injector.stats().samples ?? []).at(-1);
  assert.ok(sample !== undefined);
  assert.ok(String(sample.text ?? '').length > 0, 'sample must carry full text');
  assert.ok(String(sample.text).includes('FS_STALE_VERSION'), String(sample.text));
});

await check('写入失败后必须先读同一个文件，否则拒绝再次写入', async () => {
  const injector = createInjector({ memory: fakeMemory(), listWorkspace: async () => 'ws-1' });
  const exec = { name: 'edit', agent: { id: 's1' }, arguments: { path: 'a.md' } };
  await injector.onToolResult(exec, { isError: true, error: { info: { code: 'FS_STALE_VERSION' }, message: '过期' } });
  const denied = injector.guardCall({ name: 'edit', agent: { id: 's1' }, arguments: { path: 'a.md' } });
  assert.ok(typeof denied === 'string' && denied.includes('read'), String(denied));
  assert.equal(injector.guardCall({ name: 'read', agent: { id: 's1' }, arguments: { path: 'a.md' } }), undefined);
  await injector.onToolResult({ name: 'read', agent: { id: 's1' }, arguments: { path: 'a.md' } }, { isError: false, value: 1 });
  const afterRead = injector.guardCall({ name: 'edit', agent: { id: 's1' }, arguments: { path: 'a.md' } });
  assert.ok(afterRead === undefined || !String(afterRead).includes('要先 read'), 'after read the sequence guard no longer blocks: ' + String(afterRead));
  assert.equal(injector.guardCall({ name: 'edit', agent: { id: 's1' }, arguments: { path: 'other.md' } }), undefined, 'other files unaffected');
});

await check('建议采纳：提示后改用期望工具即记为采纳', async () => {
  const memory = fakeMemory({ text: '', items: [] });
  memory.findByTopic = async () => [];
  const injector = createInjector({ memory, listWorkspace: async () => 'ws-1' });
  await injector.warningFor(
    { name: 'read', agent: { id: 's1' } },
    { isError: true, error: { info: { code: 'FS_NOT_FOUND' }, message: '不存在' } },
  );
  await injector.onToolResult({ name: 'glob', agent: { id: 's1' } }, { isError: false });
  assert.equal(injector.stats().adviceAdopted, 1);
  assert.equal(injector.stats().adviceIgnored, 0);
  await injector.warningFor(
    { name: 'read', agent: { id: 's2' } },
    { isError: true, error: { info: { code: 'FS_NOT_FOUND' }, message: '不存在' } },
  );
  await injector.onToolResult({ name: 'edit', agent: { id: 's2' } }, { isError: false });
  assert.equal(injector.stats().adviceIgnored, 1);
});

await check('按错误码统计采纳：样本够 3 才汇总', async () => {
  const memory = fakeMemory({ text: '', items: [] });
  memory.findByTopic = async () => [];
  const injector = createInjector({ memory, listWorkspace: async () => 'ws-1' });
  for (let i = 0; i < 3; i += 1) {
    const sessionId = 's' + i;
    await injector.warningFor(
      { name: 'read', agent: { id: sessionId } },
      { isError: true, error: { info: { code: 'FS_NOT_FOUND' }, message: '不存在' } },
    );
    await injector.onToolResult({ name: 'edit', agent: { id: sessionId } }, { isError: false });
  }
  const summary = injector.stats().adviceByCode ?? {};
  assert.ok(summary.FS_NOT_FOUND !== undefined, JSON.stringify(summary));
  assert.equal(summary.FS_NOT_FOUND.ignored, 3);
  assert.equal(summary.FS_NOT_FOUND.rate, 0);
});

await check('升级阶梯：建议无视且同码再犯 → 同工具下次调用被硬拦，改用期望工具解除', async () => {
  const memory = fakeMemory({ text: '', items: [] });
  memory.findByTopic = async () => [];
  const injector = createInjector({ memory, listWorkspace: async () => 'ws-1' });
  const fail = { isError: true, error: { info: { code: 'FS_NOT_FOUND' }, message: '不存在' } };
  // 第 1 次失败 → 同轮提示
  await injector.onToolResult({ name: 'read', agent: { id: 's1' }, arguments: { path: 'a' } }, fail);
  // 宿主在失败后请求同轮提示（设置 pendingAdvice）
  await injector.warningFor({ name: 'read', agent: { id: 's1' } }, fail);
  // 模型无视建议，改调 edit（仍失败同码）→ 记入升级
  await injector.onToolResult({ name: 'edit', agent: { id: 's1' }, arguments: { path: 'a' } }, fail);
  assert.equal(injector.stats().adviceIgnored, 1);
  // 同工具（edit）下一次调用被硬拦
  const denied = injector.guardCall({ name: 'edit', agent: { id: 's1' }, arguments: { path: 'a' } });
  assert.ok(typeof denied === 'string' && denied.includes('期望用'), String(denied));
  // 改用期望工具 glob → 解除
  await injector.onToolResult({ name: 'glob', agent: { id: 's1' } }, { isError: false });
  const after = injector.guardCall({ name: 'edit', agent: { id: 's1' }, arguments: { path: 'a' } });
  // 升级已解除；残余拦截只可能是签名守卫（同码失败仍在窗口内），不再是"期望用"升级拦
  assert.ok(after === undefined || !String(after).includes('期望用'), 'escalation cleared: ' + String(after));
  assert.equal(injector.stats().adviceAdopted, 1);
});

await check('采纳覆盖表：低采纳场景的期望工具可被自学习覆盖', async () => {
  const { expectedToolsFor, applyAdoptionOverrides, adoptionOverrides } = await import('./lessons.js');
  const base = expectedToolsFor('FS_NOT_FOUND');
  assert.ok(base.includes("glob"), "base table should contain glob");
  applyAdoptionOverrides({ FS_NOT_FOUND: ["glob", "pwsh"] });
  const after = expectedToolsFor("FS_NOT_FOUND");
  assert.deepEqual(after, ["glob", "pwsh"], "override replaces base");
  assert.deepEqual(adoptionOverrides().FS_NOT_FOUND, ["glob", "pwsh"]);
  // 空覆盖不生效，回落基表
  applyAdoptionOverrides({ FS_STALE_VERSION: [] });
  assert.ok(expectedToolsFor("FS_STALE_VERSION").length > 0, "empty override falls back to base");
});

await check('语义召回：默认关闭，开关状态由 settingsRef 实时反映', async () => {
  const { createSemantic } = await import('./semantic.js');
  let settings = { semantic: false, semanticModel: null };
  const s = createSemantic({ ctx: null, settingsRef: () => settings });
  assert.equal(s.snapshot().enabled, false, "disabled by default");
  settings = { semantic: true, semanticModel: null };
  assert.equal(s.snapshot().enabled, true, "reflects live setting (no restart needed)");
  assert.equal(await s.expandQuery("测试"), "", "disabled model path yields no expansion");
});

await check('注入块整体不超预算（header/footer 也计入）', async () => {
  const memory = fakeMemory({
    text: '【灵犀记忆】\n' + '很长的记忆正文。'.repeat(200),
    items: Array.from({ length: 20 }, (_, i) => ({
      record: { id: 'm' + i, kind: 'fact', status: 'active', text: '事实条目' + i + '：' + '内容'.repeat(40), confidence: 0.9, scope: { kind: 'machine', id: '' }, evidence: 5, topics: ['kind:fact'], provenance: [], meta: {} },
    })),
  });
  const injector = createInjector({ memory, listWorkspace: async () => 'ws-1' });
  await injector.refresh('s1', '查一下事实');
  const text = injector.textFor("s1");
  const budget = injector.stats().lastBlock?.budget ?? 0;
  assert.ok(budget > 0, "budget recorded: " + budget);
  assert.ok(text.length <= budget, "block " + text.length + " must fit budget " + budget);
});

await check('语义连续失败会被计数并在成功后清零（告警的依据）', async () => {
  const { createSemantic } = await import('./semantic.js');
  let reply = '';
  const llm = {
    stream: () => (async function* () {
      yield { type: 'finish', reason: 'stop' };
    })(),
  };
  const ctx = {
    get: (name) => {
      if (name === 'llm') return llm;
      if (name === 'agentDefaultModel') return { currentSelection: () => ({ provider: 'p', model: 'm' }) };
      return undefined;
    },
  };
  const s = createSemantic({ ctx, settingsRef: () => ({ semantic: true, semanticModel: null }) });
  // 空回复：失败被计数（节流会跳过紧邻的第二次，这本身是对的行为）
  await s.expandQuery('第一次查询');
  assert.equal(s.snapshot().consecutiveFailures, 1, 'one attempt counted: ' + s.snapshot().consecutiveFailures);
  assert.equal(s.snapshot().lastError, 'empty-reply', 'last error recorded');
  // 等到节流窗口过去再试一次：连续失败应继续累积（这是告警的触发条件）
  await new Promise((resolve) => setTimeout(resolve, 900));
  await s.expandQuery('第二次查询');
  assert.equal(s.snapshot().consecutiveFailures, 2, 'accumulates to 2: ' + s.snapshot().consecutiveFailures);
});

await check('语义告警条件：开启且连续失败≥2 才告警', async () => {
  const { semanticAlert } = await import('./semantic.js');
  assert.equal(semanticAlert({ enabled: false, consecutiveFailures: 9 }), null, 'disabled never alerts');
  assert.equal(semanticAlert({ enabled: true, consecutiveFailures: 1 }), null, 'single failure below threshold');
  assert.equal(semanticAlert(null), null, 'null snapshot safe');
  const hit = semanticAlert({ enabled: true, consecutiveFailures: 2, lastError: 'empty-reply' });
  assert.ok(hit !== null, 'two failures alert');
  assert.equal(hit.kind, 'semantic-empty', 'kind');
  assert.equal(hit.count, 2, 'count');
  assert.equal(hit.detail, 'empty-reply', 'detail carries the reason');
  // 阈值可调：诊断场景可以更灵敏
  assert.ok(semanticAlert({ enabled: true, consecutiveFailures: 1 }, { threshold: 1 }) !== null, 'custom threshold');
});
console.log(checks.join('\n'));
console.log(`\n通过 ${checks.length} 项`);
