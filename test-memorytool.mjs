/**
 * 灵犀 · 模型写记忆自测
 * 运行：node test-memorytool.mjs
 */
import assert from 'node:assert/strict';
import { createMemoryReader, createMemoryWriter, validateMemoryWrite } from './memoryTool.js';

import { checks, check, report } from './test-helpers.mjs';

await check('校验：kind/长度/占位符/问句都会被拒', async () => {
  assert.equal(validateMemoryWrite({ kind: 'wrong', text: '一些内容' }).ok, false);
  assert.equal(validateMemoryWrite({ kind: 'fact', text: '短' }).ok, false);
  assert.equal(validateMemoryWrite({ kind: 'fact', text: '路径是 <path> 的时候' }).ok, false);
  assert.equal(validateMemoryWrite({ kind: 'fact', text: '你知道这个项目是什么吗？' }).ok, false);
  const ok = validateMemoryWrite({ kind: 'constraint', text: '以后都用 pnpm 安装依赖', sharing: 'workspace', evidence: 3 });
  assert.equal(ok.ok, true);
  assert.equal(ok.value.sharing, 'workspace');
  assert.equal(ok.value.evidence, 3);
});

await check('校验：默认 private、证据至少 1、上限 100', async () => {
  const a = validateMemoryWrite({ kind: 'preference', text: '回答尽量简短' });
  assert.equal(a.value.sharing, 'private');
  const b = validateMemoryWrite({ kind: 'preference', text: '回答尽量简短', evidence: 0 });
  assert.equal(b.value.evidence, 1);
  const c = validateMemoryWrite({ kind: 'preference', text: '回答尽量简短', evidence: 9999 });
  assert.equal(c.value.evidence, 100);
});

await check('写入：以 candidate + private 落库，来源标记 model-tool', async () => {
  const calls = [];
  const memory = {
    async remember(input) {
      calls.push(input);
      return { action: 'created', record: { id: 'm-1', status: 'candidate' } };
    },
  };
  const writer = createMemoryWriter({ memory });
  const result = await writer.write(
    { kind: 'skill', text: '先 glob 定位 → 再 read → 最后 edit', evidence: 2 },
    { sessionId: 's1', workspaceId: 'ws' },
  );
  assert.equal(result.isError, false);
  assert.equal(result.value.action, 'created');
  assert.equal(result.value.status, 'candidate');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].sharing, 'private');
  assert.equal(calls[0].status, 'candidate');
  assert.equal(calls[0].origin.sessionId, 's1');
  assert.equal(calls[0].provenance[0].source, 'model-tool');
  assert.equal(calls[0].confidence, 0.7);
});

await check('写入：非法输入不落库并返回错误', async () => {
  const calls = [];
  const writer = createMemoryWriter({ memory: { async remember(input) { calls.push(input); return { action: 'no-op' }; } } });
  const result = await writer.write({ kind: 'lesson', text: '' });
  assert.equal(result.isError, true);
  assert.equal(calls.length, 0);
});

await check('写入：no-op 去重时如实返回', async () => {
  const writer = createMemoryWriter({
    memory: { async remember() { return { action: 'no-op', record: { id: 'm-2', status: 'active' } }; } },
  });
  const result = await writer.write({ kind: 'fact', text: '本机输出目录是 D 盘' });
  assert.equal(result.value.action, 'no-op');
  assert.equal(result.value.status, 'active');
});


await check('检索：映射条目并如实返回 abstain', async () => {
  const calls = [];
  const memory = {
    async recall(query, options) {
      calls.push({ query, options });
      return {
        items: [
          { record: { kind: 'constraint', text: '不要动 D 盘那个目录', confidence: 0.9, sharing: 'global' } },
        ],
        abstain: false,
      };
    },
  };
  const reader = createMemoryReader({ memory });
  const result = await reader.read({ query: 'D 盘', limit: 99 }, { sessionId: 's1' });
  assert.equal(result.isError, false);
  assert.equal(result.value.count, 1);
  assert.equal(result.value.items[0].kind, 'constraint');
  assert.equal(result.value.items[0].confidence, 0.9);
  assert.equal(calls[0].options.limit, 12, 'limit clamps to 12');
  assert.equal(calls[0].options.context.sessionId, 's1');
});

await check('检索：空查询报错，无结果时 abstain=true', async () => {
  const reader = createMemoryReader({ memory: { async recall() { return { items: [], abstain: true }; } } });
  const bad = await reader.read({ query: '   ' });
  assert.equal(bad.isError, true);
  const empty = await reader.read({ query: '不存在的东西' });
  assert.equal(empty.value.abstain, true);
  assert.equal(empty.value.count, 0);
});

report();
