/**
 * 灵犀 · Host 半边（自闭环）
 *
 * 数据来源只有三处：自己的记忆库、自己的运行统计、宿主会话日志（只读）。
 * 不读任何旧插件的数据目录。
 */
import { spawn } from 'node:child_process';
import { readFileSync, promises as fsp } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LingxiMemory } from './memory/index.js';
import { canonicalFailure, createInjector, userMessageText } from './injector.js';
import { createSemantic } from './semantic.js';
import { MetricsFile, aggregateFailures, attachLessonEfficacy, attributeLessons, countRetiredForKey, dailySeriesByKey, dayKey, findCoverage, findPromotable, findRegressions, selectAutoActivatable, splitSceneBeforeAfter, summarizeCorrections, summarizeQuality, summarizeSceneFailures } from './metrics.js';
import { annotate } from './noise.js';
import { mayInject } from './memory/schema.js';
import { createEvolver, fitnessFromDelta } from './evolve.js';
import { applyAdoptionOverrides, inferToolMeta, lessonTextFor } from './lessons.js';
import { sceneOf } from './scenes.js';
import { extractInstructions } from './instructions.js';
import { planHygiene } from './hygiene.js';
import {
  TOOL_DESCRIPTION,
  TOOL_RECALL_DESCRIPTION,
  TOOL_RECALL_NAME,
  TOOL_RECALL_OUTPUT_SCHEMA,
  TOOL_RECALL_PARAMETERS,
  TOOL_NAME,
  TOOL_OUTPUT_SCHEMA,
  TOOL_PARAMETERS,
  validateMemoryWrite,
} from './memoryTool.js';
import { MIN_REPEAT, pushStep, shouldCreateProcedure } from './procedures.js';

export const name = 'dsh-lingxi-panel';
export const inject = [];

const OVERVIEW = '/lingxi/overview';
const MEMORY = '/lingxi/memory';

export function apply(ctx, config) {
  const settings = {
    memoryDir: '',
    consolidateHours: 12,
    staleAfterMs: 10 * 60_000,
    autoSeed: true,
    autoSeedThreshold: 10,
    procedureSessions: 2,
    semantic: false,
    // 启发式抽规则默认关闭：用户已明确它是"太片面"的方案，只留模型主动写入。
    instructions: false,
    evolve: true,
    evolveEveryMs: 10 * 60_000,
    injection: {},
    ...(config ?? {}),
  };

  // 存储位置指针：固定路径（不随记忆目录迁移），面板可改，重启生效。
  const storagePointerFile = path.join(homedir(), '.dsh', 'lingxi-storage.json');
  const readStoragePointer = () => {
    try {
      const dir = String(JSON.parse(readFileSync(storagePointerFile, 'utf8')).dir ?? '').trim();
      return dir === '' ? null : dir;
    } catch {
      return null;
    }
  };
  const memoryDir = settings.memoryDir !== ''
    ? settings.memoryDir
    : (readStoragePointer()
        ?? (String(process.env.DSH_LINGXI_MEMORY_DIR ?? '').trim() !== ''
            ? String(process.env.DSH_LINGXI_MEMORY_DIR).trim()
            : path.join(homedir(), '.dsh', 'lingxi-memory')));
  const metaFile = path.join(memoryDir, '.meta.json');
  const statusFile = path.join(memoryDir, 'injection-status.json');
  const qualityFile = path.join(memoryDir, 'quality.jsonl');

  const memory = new LingxiMemory({ dir: memoryDir });
  const metrics = new MetricsFile(memoryDir);
  const semantic = createSemantic({ ctx, settingsRef: () => settings });
  const injector = createInjector({ memory, listWorkspace, config: settings.injection ?? {}, semantic });
  const evolver = createEvolver();
  /** 分场景进化器：读文件 / 命令 / 联网 / 其它 各自学预算 */
  const sceneEvolvers = {
    file: createEvolver(),
    command: createEvolver(),
    web: createEvolver(),
    other: createEvolver(),
  };
  let lastSceneStats = null;

  let persistence = null;
  let bootPromise = null;
  let lastError = null;
  let lastStats = null;
  let efficacy = null;
  let efficacyError = null;
  let autoSeeded = 0;
  let lastConsolidate = null;
  let lastEvolveAt = 0;
  let lastSceneEvolveAt = 0;
  let evolution = null;
  let attribution = null;
  let lessonEfficacyCache = null;
  let promotableCache = null;
  /** sessionId → 正在累积的成功工具序列 */
  const toolSequences = new Map();
  /** 已观察到的流程模式 → { count, key, tools } */
  const procedureCounts = new Map();
  let proceduresCreated = 0;
  let instructionsCaptured = 0;
  let toolsWrote = 0;
  let lastHygiene = null;
  let backfilledLessons = 0;
  let lastRepairedLessons = 0;
  let selfcheck = null;
  let alerts = [];
  let lastAudit = null;
  let autoActivated = 0;
  let gapFilled = 0;
  let reseedBlocked = 0;
  let bootSnapshot = null;
  let bootSnapshotAt = 0;
  let sectionSkipped = 0;
  const searchStats = { total: 0, abstained: 0, lastAt: 0 };
  let lastSearchStats = { total: 0, abstained: 0 };
  const routeDiagnostic = { origin: null, registered: 0, errors: [], requests: 0, requestsByPath: {}, lastAt: 0, lastPath: '', firstAt: 0, lastHasSessionParam: false, handlerErrors: 0, lastHandlerError: '', lastHandlerErrorPath: '' };
  let lastRequestPersistedAt = 0;

  /* ---------------- 会话 → 工作区 ---------------- */

  const workspaceCache = { at: 0, map: new Map() };
  async function listWorkspace(sessionId) {
    const now = Date.now();
    if (persistence !== null && now - workspaceCache.at > 60_000) {
      try {
        const snapshots = await persistence.list();
        const map = new Map();
        for (const snapshot of snapshots) {
          const id = String(snapshot?.header?.id ?? '');
          if (id !== '') map.set(id, String(snapshot?.header?.cwd ?? ''));
        }
        workspaceCache.at = now;
        workspaceCache.map = map;
      } catch {
        workspaceCache.at = now;
      }
    }
    return workspaceCache.map.get(sessionId) ?? '';
  }

  /* ---------------- 启动 / 元数据 ---------------- */

  const ensureMemory = () => {
    if (bootPromise === null) {
      bootPromise = boot().catch((error) => {
        lastError = errorMessage(error);
        bootPromise = null;
        throw error;
      });
    }
    return bootPromise;
  };

  async function boot() {
    await memory.init();
    try {
      const meta = await readMeta();
      if (meta.injection !== undefined && meta.injection !== null) injector.configure(meta.injection);
      if (meta.lastRequest !== undefined && meta.lastRequest !== null) routeDiagnostic.previousRequest = meta.lastRequest;
      if (meta.sceneEvolution !== undefined && meta.sceneEvolution !== null) {
        for (const [scene, state] of Object.entries(meta.sceneEvolution)) {
          const evolverForScene = sceneEvolvers[scene];
          if (evolverForScene === undefined || state === null) continue;
          evolverForScene.restore({ trials: state.trials, current: state.current });
          if (Number.isFinite(state.charBudget)) injector.configureScene(scene, { charBudget: state.charBudget });
        }
      }
      if (Array.isArray(meta.evolutionTrials)) {
        evolver.restore({ trials: meta.evolutionTrials, current: meta.evolutionCurrent });
      }
    } catch {
      // 读不到配置就用默认值
    }
    // 合并与回填放到后台：它们要读写全库，不该挡首屏。
    setTimeout(() => {
      maybeConsolidate()
        .then((report) => { lastConsolidate = report; })
        .catch((error) => { lastError = errorMessage(error); });
      backfillLessonMeta()
        .then((filled) => { backfilledLessons = filled; })
        .catch(() => {});
      // 恢复采纳覆盖表：自学习得出的期望工具修正，重启不丢。
      readMeta()
        .then((metaBoot) => {
        applyAdoptionOverrides(metaBoot?.adoptionOverrides ?? {});
        if (metaBoot?.semantic !== undefined) settings.semantic = metaBoot.semantic === true;
        settings.semanticModel = metaBoot?.semanticModel ?? null;
      })
        .catch(() => {});
    }, 0);
    return memory;
  }

  async function readMeta() {
    try {
      return JSON.parse(await fsp.readFile(metaFile, 'utf8'));
    } catch {
      return {};
    }
  }

  async function writeMeta(patch) {
    try {
      await fsp.mkdir(memoryDir, { recursive: true });
      const next = { ...(await readMeta()), ...patch };
      await fsp.writeFile(metaFile, JSON.stringify(next, null, 2), 'utf8');
    } catch {
      // 元数据写失败不影响主流程
    }
  }

  /** 记忆体检：隔离可疑、淘汰过时、合并重复。只在启动与每天执行一次。 */
  async function runHygiene() {
    await ensureMemory();
    const records = await memory.list({ limit: 2000 });
    const plan = planHygiene(records);
    let quarantined = 0;
    let evicted = 0;
    let merged = 0;
    let demoted = 0;
    for (const item of plan.quarantine) {
      const done = await memory.confirm(item.id, 'retire', 'hygiene').catch(() => null);
      if (done !== null) quarantined += 1;
    }
    for (const item of plan.evict) {
      const done = await memory.confirm(item.id, 'retire', 'hygiene').catch(() => null);
      if (done !== null) evicted += 1;
    }
    for (const item of plan.merge) {
      const done = await memory.confirm(item.drop, 'retire', 'duplicate').catch(() => null);
      if (done !== null) {
        merged += 1;
        await memory.observe(item.keep, { hit: true }).catch(() => {});
      }
    }
    for (const item of plan.demote ?? []) {
      const done = await memory.demote(item.id, item.reason ?? 'warn-ineffective').catch(() => null);
      if (done !== null) demoted += 1;
    }

    lastHygiene = { at: Date.now(), quarantined, evicted, merged, demoted, upgraded: 0, scanned: records.length };
    if (quarantined + evicted + merged + demoted > 0) {
      await metrics.record({
        quarantined,
        evicted,
        mergedMemory: merged,
        demoted,
      }).catch(() => {});
    }

    // 旧模板教训（"先确认参数与前置条件"）升级为按错误码的可执行文案。
    for (const record of records) {
      if (String(record.kind) !== 'lesson' || String(record.status) === 'retired') continue;
      if (!String(record.text ?? '').includes('先确认参数与前置条件')) continue;
      const meta = record.meta ?? {};
      const match = /当「([^」]+)」遇到「([^」]+)」时/.exec(String(record.text ?? ''));
      const tool = String(meta.tool ?? match?.[1] ?? '');
      const code = String(meta.code ?? match?.[2] ?? '');
      if (tool === '') continue;
      const upgradedText = lessonTextFor({ tool, code });
      await memory.remember({
        kind: 'lesson',
        text: upgradedText,
        scope: record.scope ?? { kind: 'machine', id: '' },
        sharing: record.sharing ?? 'global',
        status: 'candidate',
        confidence: Number(record.confidence ?? 0.5),
        evidence: Number(record.evidence ?? 1),
        meta: { tool, code },
        topics: ['tool:' + tool, 'kind:lesson'],
        provenance: [{
          source: 'migrated',
          sessionId: '',
          excerpt: String(record.text ?? '').slice(0, 120),
        }],
      }).catch(() => {});
      await memory.confirm(record.id, 'retire', 'contradicted').catch(() => {});
      lastHygiene.upgraded += 1;
    }
    return lastHygiene;
  }

  async function maybeConsolidate() {
    const hours = Number(settings.consolidateHours);
    const window = Number.isFinite(hours) && hours > 0 ? hours : 12;
    const meta = await readMeta();
    if (Number.isFinite(meta.lastConsolidateAt) && Date.now() - meta.lastConsolidateAt < window * 3_600_000) {
      return { skipped: true, lastReport: meta.lastReport ?? null };
    }
    const report = await memory.consolidate();
    await writeMeta({ lastConsolidateAt: Date.now(), lastReport: report });
    return report;
  }

  /* ---------------- 指标 / 复发率 / 归因 ---------------- */

  async function flushMetrics() {
    const current = injector.stats();
    if (lastStats === null) {
      lastStats = current;
      lastSearchStats = { total: searchStats.total, abstained: searchStats.abstained };
      return null;
    }
    // 自学习：模型用表外工具成功 → 并入采纳覆盖表（持久化 + 应用）。
    try {
      const learned = current.adviceLearned ?? {};
      const metaNow = await readMeta();
      const overrides = { ...(metaNow?.adoptionOverrides ?? {}) };
      let changed = false;
      for (const [code, tools] of Object.entries(learned)) {
        const merged = new Set(overrides[code] ?? []);
        for (const tool of tools) if (!merged.has(tool)) { merged.add(tool); changed = true; }
        if (merged.size > 0) overrides[code] = [...merged];
      }
      if (changed) {
        await writeMeta({ adoptionOverrides: overrides });
        applyAdoptionOverrides(overrides);
      }
    } catch {
      // 学习失败不影响主流程
    }
    const delta = {
      injected: current.injected - lastStats.injected,
      hits: current.hits - lastStats.hits,
      misses: current.misses - lastStats.misses,
      captured: current.captured - lastStats.captured,
      refined: current.refined - lastStats.refined,
      repeatFailures: current.repeatFailures - lastStats.repeatFailures,
      warnEffective: current.warnEffective - lastStats.warnEffective,
      warnIneffective: current.warnIneffective - lastStats.warnIneffective,
      guardDenied: current.guardDenied - lastStats.guardDenied,
      guardEffective: current.guardEffective - lastStats.guardEffective,
      guardIneffective: current.guardIneffective - lastStats.guardIneffective,
      corrections: current.corrections - lastStats.corrections,
      correctionPenalized: current.correctionPenalized - lastStats.correctionPenalized,
      adviceAdopted: current.adviceAdopted - lastStats.adviceAdopted,
      coreGated: (current.coreGated ?? 0) - (lastStats.coreGated ?? 0),
      adviceIgnored: current.adviceIgnored - lastStats.adviceIgnored,
      searches: searchStats.total - lastSearchStats.total,
      searchAbstained: searchStats.abstained - lastSearchStats.abstained,
      refreshes: current.refreshed - lastStats.refreshed,
      chars: current.lastChars,
    };
    lastStats = current;
    lastSearchStats = { total: searchStats.total, abstained: searchStats.abstained };
    await metrics.record(delta);
    return delta;
  }

  async function scanEfficacy() {
    const db = persistence ?? ctx.get?.('sessionPersistence');
    if (db === undefined || db === null) return null;
    const snapshots = await db.list();
    const recent = [...snapshots]
      .sort((a, b) => (b.header?.createdAt ?? 0) - (a.header?.createdAt ?? 0))
      .slice(0, 40);
    const failures = [];
    const userMessages = [];
    const keySessions = new Map();
    for (const snapshot of recent) {
      try {
        const handle = await db.open(snapshot.header.id, 'read');
        try {
          const result = await handle.read();
          const names = new Map();
          for (const event of result.events ?? []) {
            if (event.type === 'tool/call') {
              names.set(String(event.data?.callId ?? ''), String(event.data?.name ?? 'tool'));
            } else if (event.type === 'user/message') {
              try {
                const message = event.data?.message ?? event.data;
                userMessages.push({ at: Number(event.time) || 0, text: userMessageText(message) });
              } catch {
                // 单条消息取不到文本就跳过
              }
            } else if (event.type === 'tool/result' && event.data?.error !== undefined) {
              const callId = String(event.data?.callId ?? event.data?.message?.toolCallId ?? '');
              const tool = names.get(callId) ?? 'tool';
              const code = String(event.data.error?.code ?? '');
              const reason = canonicalFailure(event.data.error?.reason ?? '');
              const sessionKey = tool + '|' + code + '|' + reason;
              failures.push({ key: sessionKey, at: Number(event.time) || 0 });
              const bucket = keySessions.get(sessionKey) ?? { tool, code, count: 0, sessions: new Set() };
              bucket.count += 1;
              bucket.sessions.add(String(snapshot.header.id));
              keySessions.set(sessionKey, bucket);
            }
          }
        } finally {
          await Promise.resolve(handle.close()).catch(() => {});
        }
      } catch {
        // 跳过不可读会话
      }
    }
    const summary = aggregateFailures(failures);
    summary.corrections = summarizeCorrections(userMessages);
    summary.scenes = summarizeSceneFailures(failures, sceneOf);
    // 场景级治理前后：每个场景取"最早一条活教训"的时间作为分界。
    const lessonsForScenes = await memory.list({ kind: 'lesson', limit: 500 }).catch(() => []);
    const startByScene = new Map();
    for (const record of lessonsForScenes) {
      if (String(record.status ?? '') === 'retired') continue;
      const tool = String(record.meta?.tool ?? '');
      if (tool === '') continue;
      const scene = String(sceneOf(tool));
      const at = Number(record.createdAt ?? 0);
      if (!Number.isFinite(at) || at <= 0) continue;
      const current = startByScene.get(scene);
      if (current === undefined || at < current) startByScene.set(scene, at);
    }
    const splits = splitSceneBeforeAfter(failures, sceneOf, startByScene);
    const splitByScene = new Map(splits.map((entry) => [entry.scene, entry]));
    summary.scenes = summary.scenes.map((entry) => ({
      ...entry,
      ...(splitByScene.get(entry.scene) ?? { before: entry.failures, after: 0, lessonFrom: 0 }),
    }));
    // 跨会话复现：同一 tool|code 在几个不同会话里都出现过
    const crossMap = new Map();
    for (const bucket of keySessions.values()) {
      const key = bucket.tool + '|' + bucket.code;
      const entry = crossMap.get(key) ?? { tool: bucket.tool, code: bucket.code, count: 0, sessions: 0 };
      entry.count += bucket.count;
      entry.sessions += bucket.sessions.size;
      crossMap.set(key, entry);
    }
    summary.crossSession = [...crossMap.values()]
      .filter((entry) => entry.sessions >= 2)
      .sort((a, b) => b.sessions - a.sessions || b.count - a.count)
      .slice(0, 20);
    summary.events = failures.slice(-3000);
    // 覆盖率：重复失败场景里有多少已有活教训（缺口最该补）。
    const lessonSnapshot = await memory.list({ kind: 'lesson', limit: 500 }).catch(() => []);
    const lessonKeys = lessonSnapshot.map((record) => {
      const meta = record.meta ?? {};
      const match = /当「([^」]+)」遇到「([^」]+)」时/.exec(String(record.text ?? ''));
      // 文本里写明的场景优先：历史合并可能让 meta.code 与正文不一致。
      return {
        tool: String(match?.[1] ?? meta.tool ?? ''),
        code: String(match?.[2] ?? meta.code ?? ''),
        status: String(record.status ?? ''),
      };
    });
    summary.coverage = findCoverage(summary.crossSession, lessonKeys);
    // Top 场景 14 天复发趋势（只取前 3，控制载荷）
    const topKeys = summary.crossSession.slice(0, 3).map((entry) => String(entry.tool) + '|' + String(entry.code));
    summary.trend = dailySeriesByKey(failures, topKeys, { now: Date.now(), days: 14 });
    summary.suggestions = summary.top
      .filter((entry) => entry.count >= 5)
      .map((entry) => {
        const parts = String(entry.key).split('|');
        return { key: entry.key, tool: parts[0] ?? 'tool', code: parts[1] ?? '', count: entry.count };
      });
    return summary;
  }

  async function autoSeedFromEfficacy() {
    if (settings.autoSeed === false) return;
    if (efficacy === null || !Array.isArray(efficacy.suggestions)) return;
    const threshold = Number.isFinite(settings.autoSeedThreshold) ? settings.autoSeedThreshold : 10;
    const meta = await readMeta();
    const seeded = new Set(Array.isArray(meta.seededKeys) ? meta.seededKeys : []);
    const allLessons = await memory.list({ kind: 'lesson', limit: 500 });
    const liveKeys = new Set();
    for (const record of allLessons) {
      if (String(record.status ?? '') === 'retired') continue;
      liveKeys.add(String(record.meta?.tool ?? '') + '|' + String(record.meta?.code ?? ''));
    }
    for (const item of efficacy.suggestions) {
      const liveKey = String(item.tool) + '|' + String(item.code);
      // 已有活着的教训且该场景已播种过 → 跳过；否则允许重新沉淀（教训被淘汰后要能重建）。
      if (item.count < threshold) continue;
      if (seeded.has(item.key) && liveKeys.has(liveKey)) continue;
      const retiredTimes = countRetiredForKey(allLessons, item.tool, item.code);
      // 同一场景已淘汰两次还复活 → 停止重建，避免淘汰/重建死循环。
      if (retiredTimes >= 2) {
        reseedBlocked += 1;
        seeded.add(item.key);
        continue;
      }
      const text = lessonTextFor({ tool: item.tool, code: item.code });
      try {
        await memory.remember({
          kind: 'lesson',
          text,
          scope: { kind: 'machine', id: '' },
          sharing: 'global',
          status: 'candidate',
          confidence: 0.5,
          evidence: item.count,
          meta: {
            tool: item.tool,
            code: item.code,
            resurrected: retiredTimes > 0,
            resurrections: retiredTimes,
          },
          topics: ['tool:' + item.tool, 'kind:lesson'],
          provenance: [{ source: 'efficacy-scan', sessionId: '', excerpt: String(item.count) + ' 次历史重复失败' }],
        });
        seeded.add(item.key);
      } catch {
        // 单条失败不影响其它
      }
    }
    if (seeded.size > 0) {
      await writeMeta({ seededKeys: [...seeded].slice(-200), autoSeededAt: Date.now() });
      autoSeeded = seeded.size;
    }
  }

  /**
   * 自动补缺：对"高频复发但没有活教训"的场景生成候选教训。
   * 只在跨会话证据足够（覆盖率缺口本身就要求 ≥2 会话）时触发，且每次最多 3 条。
   * 不碰被判过两次死刑的场景（避免淘汰↔重建死循环）。
   */
  async function fillCoverageGaps() {
    if (settings.autoSeed === false) return 0;
    if (efficacy === null || efficacy.coverage === undefined || efficacy.coverage === null) return 0;
    const holes = Array.isArray(efficacy.coverage.holes) ? efficacy.coverage.holes.slice(0, 3) : [];
    if (holes.length === 0) return 0;
    await ensureMemory();
    const allLessons = await memory.list({ kind: 'lesson', limit: 500 });
    let filled = 0;
    for (const hole of holes) {
      const retiredTimes = countRetiredForKey(allLessons, hole.tool, hole.code);
      // 3 次以上才停止重建：之前 2 次会把被误伤的高频场景永久堵死。
      if (retiredTimes >= 3) continue;
      const text = lessonTextFor({ tool: hole.tool, code: hole.code });
      try {
        await memory.remember({
          kind: 'lesson',
          text,
          scope: { kind: 'machine', id: '' },
          sharing: 'global',
          status: 'candidate',
          confidence: 0.5,
          evidence: Math.max(2, Number(hole.count ?? 0)),
          meta: { tool: hole.tool, code: hole.code, gapFilled: true, resurrected: retiredTimes > 0, resurrections: retiredTimes },
          topics: ['tool:' + hole.tool, 'kind:lesson', 'scene:gap'],
          provenance: [{
            source: 'coverage-fill',
            sessionId: '',
            excerpt: String(hole.sessions) + ' 个会话 / ' + String(hole.count) + ' 次失败',
          }],
        });
        filled += 1;
      } catch {
        // 单条失败不影响其它缺口
      }
    }
    if (filled > 0) gapFilled += filled;
    // 修复历史合并造成的错位：meta 说 A 场景，正文写 B 场景 → 按 meta 重写正文。
    let repaired = 0;
    for (const record of await memory.list({ kind: 'lesson', limit: 500 })) {
      if (String(record.status) === 'retired') continue;
      const meta = record.meta ?? {};
      const tool = String(meta.tool ?? '');
      if (tool === '') continue;
      const match = /当「([^」]+)」遇到「([^」]+)」时/.exec(String(record.text ?? ''));
      const textTool = String(match?.[1] ?? '');
      const textCode = String(match?.[2] ?? '');
      const metaCode = String(meta.code ?? '');
      if (textTool === tool && textCode === metaCode) continue;
      const next = lessonTextFor({ tool, code: metaCode });
      const done = await memory.patchText(record.id, next).catch(() => null);
      if (done !== null) repaired += 1;
    }
    if (repaired > 0) lastRepairedLessons = repaired;

    return filled;
  }

  /** 护栏：单日淘汰/降级异常、覆盖率归零等，供面板显式提示。 */
  /**
   * 修复计划：只处理两类确定性问题——
   *   1) meta 与正文场景不一致 → 按 meta 重写正文；
   *   2) 同一场景键有多条活教训 → 保留证据最高的，其余退役。
   */
  async function buildRepairPlan() {
    const all = await memory.list({ limit: 5000 });
    const live = all.filter((record) => String(record.status ?? '') !== 'retired');
    const textFixes = [];
    for (const record of live) {
      const meta = record.meta ?? {};
      const tool = String(meta.tool ?? '');
      if (tool === '') continue;
      const match = /当「([^」]+)」遇到「([^」]+)」时/.exec(String(record.text ?? ''));
      if (match === null) continue;
      if (match[1] === tool && match[2] === String(meta.code ?? '')) continue;
      textFixes.push({
        id: record.id,
        before: String(record.text ?? '').slice(0, 50),
        after: lessonTextFor({ tool, code: String(meta.code ?? '') }).slice(0, 50),
      });
    }
    const groups = new Map();
    for (const record of live) {
      const meta = record.meta ?? {};
      const match = /当「([^」]+)」遇到「([^」]+)」时/.exec(String(record.text ?? ''));
      const key = String(match?.[1] ?? meta.tool ?? '') + '|' + String(match?.[2] ?? meta.code ?? '');
      if (key === '|') continue;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(record);
    }
    const duplicateRetires = [];
    for (const [key, records] of groups.entries()) {
      if (records.length < 2) continue;
      const sorted = [...records].sort((a, b) => Number(b.evidence ?? 0) - Number(a.evidence ?? 0));
      for (const drop of sorted.slice(1)) {
        duplicateRetires.push({ id: drop.id, key, text: String(drop.text ?? '').slice(0, 40) });
      }
    }
    return { textFixes, duplicateRetires };
  }

  async function applyRepair(plan) {
    let rewritten = 0;
    let retired = 0;
    for (const item of plan.textFixes) {
      const record = await memory.find(item.id);
      if (record === null) continue;
      const meta = record.meta ?? {};
      const full = lessonTextFor({ tool: String(meta.tool ?? ''), code: String(meta.code ?? '') });
      const done = await memory.patchText(item.id, full).catch(() => null);
      if (done !== null) rewritten += 1;
    }
    for (const item of plan.duplicateRetires) {
      const done = await memory.confirm(item.id, 'retire', 'duplicate').catch(() => null);
      if (done !== null) retired += 1;
    }
    await writeStatus();
    return { rewritten, retired };
  }

  /** 只读体检：开机跑一次，结果进状态；失败时进告警。 */
  async function runAuditOnce() {
    try {
      const base = path.dirname(fileURLToPath(import.meta.url));
      const child = spawn(process.execPath, [path.join(base, 'audit.mjs')], { cwd: base });
      let out = '';
      child.stdout.on('data', (chunk) => { out += String(chunk); });
      child.stderr.on('data', (chunk) => { out += String(chunk); });
      const timer = setTimeout(() => { try { child.kill(); } catch { /* ignore */ } }, 60_000);
      child.on('close', (code) => {
        clearTimeout(timer);
        lastAudit = { ok: code === 0, at: Date.now(), lines: out.split('\n').filter((line) => line.trim() !== '').slice(-30) };
      });
    } catch {
      lastAudit = { ok: false, at: Date.now(), lines: [] };
    }
  }

  async function computeAlerts() {
    const list = [];
    try {
      const summary = metrics.summary();
      const today = dayKey(Date.now());
      const counters = (summary.series ?? []).find((entry) => entry.day === today) ?? null;
      const demoted = Number(counters?.demoted ?? 0);
      const quarantined = Number(counters?.quarantined ?? 0);
      // 阈值随库规模自适应：库越大，每天几条降级属正常。
      const health = await memory.health().catch(() => null);
      const live = Number(health?.byStatus?.active ?? 0) + Number(health?.byStatus?.candidate ?? 0);
      const demoteLimit = Math.max(5, Math.round(live * 0.1));
      if (demoted > demoteLimit) list.push({ kind: 'demote-spike', count: demoted });
      if (lastAudit !== null && lastAudit.ok !== true) list.push({ kind: 'audit-failed', count: (lastAudit.lines ?? []).length });
      if (quarantined > Math.max(20, Math.round(live * 0.2))) list.push({ kind: 'quarantine-spike', count: quarantined });
      const coverage = efficacy?.coverage ?? null;
      if (coverage !== null && Number(coverage.total ?? 0) > 0 && Number(coverage.covered ?? 0) === 0) {
        list.push({ kind: 'coverage-zero', count: Number(coverage.total ?? 0) });
      }
    } catch {
      // 告警失败不影响主流程
    }
    const previousKinds = new Set((alerts ?? []).map((alert) => alert.kind));
    const fresh = list.filter((alert) => !previousKinds.has(alert.kind));
    alerts = list;
    if (fresh.length > 0) {
      await metrics.record({ alertsRaised: fresh.length }).catch(() => {});
    }
  }

  async function computeAttribution() {
    if (efficacy === null || !Array.isArray(efficacy.events)) return null;
    await ensureMemory();
    const lessons = await memory.list({ kind: 'lesson', limit: 200 });
    const parsed = lessons.map((record) => {
      const meta = record.meta ?? {};
      const match = /当「([^」]+)」遇到「([^」]+)」时/.exec(String(record.text ?? ''));
      return {
        tool: String(meta.tool ?? match?.[1] ?? ''),
        code: String(meta.code ?? match?.[2] ?? ''),
        capturedAt: record.createdAt,
      };
    });
    if (parsed.length === 0) return null;
    return attributeLessons({ failures: efficacy.events, lessons: parsed, now: Date.now() });
  }

  /** 每条教训的独立疗效：把前后对照按 tool/code 映射回条目。 */
  /** 回填旧教训的 meta.tool/code：只补缺的，不覆盖已有。 */
  async function backfillLessonMeta() {
    // 只在 boot() 内部调用：此时 memory 已 init，不能再走 ensureMemory（会等自己 → 死锁）。
    const lessons = await memory.list({ kind: 'lesson', limit: 500 });
    let filled = 0;
    for (const record of lessons) {
      const meta = record.meta ?? {};
      if (String(meta.tool ?? '') !== '') {
        // 已有 meta：补一次复活标记（早期重建的记录没有这个字段）。
        if (meta.resurrected !== true) {
          const times = countRetiredForKey(lessons, meta.tool, meta.code ?? '');
          if (times > 0) {
      
      await memory.patchMeta(record.id, { resurrected: true, resurrections: times }).catch(() => null);
          }
        }
        continue;
      }
      const inferred = inferToolMeta(record.text);
      if (inferred === null) continue;
      const times = countRetiredForKey(lessons, inferred.tool, inferred.code);
      await memory.patchMeta(record.id, {
        tool: inferred.tool,
        code: inferred.code,
        backfilled: true,
        resurrected: times > 0,
        resurrections: times,
      }).catch(() => null);
      filled += 1;
    }
    return filled;
  }

  async function computeLessonEfficacy() {
    if (attribution === null || !Array.isArray(attribution.pairs)) return null;
    await ensureMemory();
    const lessons = await memory.list({ kind: 'lesson', limit: 200 });
    const mapped = lessons.map((record) => {
      const meta = record.meta ?? {};
      const match = /当「([^」]+)」遇到「([^」]+)」时/.exec(String(record.text ?? ''));
      return {
        id: record.id,
        tool: String(meta.tool ?? match?.[1] ?? ''),
        code: String(meta.code ?? match?.[2] ?? ''),
        hits: Number(record.hitCount ?? 0),
        misses: Number(record.missCount ?? 0),
        updatedAt: record.updatedAt ?? 0,
      };
    });
    return attachLessonEfficacy(attribution.pairs, mapped);
  }

  /** 私有教训 + 跨会话复现 → 建议提升。 */
  /**
   * 共享候选的自动转正：只在"已经是共享范围"的候选上做，
   * 不碰 private —— 跨会话共享必须由用户点头（硬规则）。
   */
  async function autoActivateSharedLessons() {
    if (efficacy === null || !Array.isArray(efficacy.crossSession)) return 0;
    await ensureMemory();
    const lessons = await memory.list({ kind: 'lesson', limit: 300 });
    const mapped = lessons.map((record) => {
      const meta = record.meta ?? {};
      const match = /当「([^」]+)」遇到「([^」]+)」时/.exec(String(record.text ?? ''));
      return {
        id: record.id,
        tool: String(meta.tool ?? match?.[1] ?? ''),
        code: String(meta.code ?? match?.[2] ?? ''),
        sharing: String(record.sharing ?? 'private'),
        status: String(record.status ?? ''),
      };
    });
    const targets = selectAutoActivatable(mapped, efficacy.crossSession);
    let activated = 0;
    for (const target of targets) {
      const done = await memory.confirm(target.id, 'accept').catch(() => null);
      if (done !== null) activated += 1;
    }
    autoActivated += activated;
    return activated;
  }

  async function computePromotable() {
    if (efficacy === null || !Array.isArray(efficacy.crossSession)) return null;
    await ensureMemory();
    const lessons = await memory.list({ kind: 'lesson', limit: 200 });
    const mapped = lessons.map((record) => {
      const meta = record.meta ?? {};
      const match = /当「([^」]+)」遇到「([^」]+)」时/.exec(String(record.text ?? ''));
      return {
        id: record.id,
        tool: String(meta.tool ?? match?.[1] ?? ''),
        code: String(meta.code ?? match?.[2] ?? ''),
        sharing: String(record.sharing ?? 'private'),
      };
    });
    return findPromotable(mapped, efficacy.crossSession);
  }

  async function recordAttributionTrend() {
    if (attribution === null || attribution?.totals === undefined) return;
    const meta = await readMeta();
    const trend = Array.isArray(meta.attributionTrend) ? meta.attributionTrend : [];
    const day = new Date().toISOString().slice(0, 10);
    const entry = { day, totals: attribution.totals, at: Date.now() };
    const existing = trend.findIndex((item) => item.day === day);
    if (existing >= 0) {
      if (JSON.stringify(trend[existing]?.totals) === JSON.stringify(entry.totals)) return;
      trend[existing] = entry;
    } else {
      trend.push(entry);
    }
    await writeMeta({ attributionTrend: trend.slice(-30) });
  }

  async function refreshEfficacy() {
    try {
      efficacy = await scanEfficacy();
      computeAlerts().catch(() => {});
      efficacyError = null;
      attribution = await computeAttribution();
      await autoSeedFromEfficacy();
      await fillCoverageGaps();
      efficacy = await scanEfficacy();
      await autoActivateSharedLessons();
      await recordAttributionTrend();
    } catch (error) {
      efficacyError = errorMessage(error);
    }
  }

  /* ---------------- 参数进化 ---------------- */

  async function evolveOnce(delta, now = Date.now()) {
    if (settings.evolve === false) return evolution;
    const windowMs = Number(settings.evolveEveryMs) || 10 * 60_000;
    if (now - lastEvolveAt < windowMs) return evolution;
    lastEvolveAt = now;
    const current = evolver.current();
    const fitness = fitnessFromDelta(delta ?? {});
    evolver.observe({ ...current, fitness, at: now });
    const nextArm = evolver.select();
    injector.configure(nextArm);
    evolution = { ...evolver.snapshot(), current: nextArm, lastFitness: fitness, at: now };
    await writeMeta({ evolutionTrials: evolver.exportTrials(), evolutionCurrent: nextArm, evolutionAt: now });
    return evolution;
  }

  /** 分场景进化：每场景用自己的成败算分，选自己的注入预算。 */
  async function evolveScenes(now = Date.now()) {
    if (settings.evolve === false) return;
    const windowMs = Number(settings.evolveEveryMs) || 10 * 60_000;
    if (now - lastSceneEvolveAt < windowMs) return;
    lastSceneEvolveAt = now;
    const snapshot = injector.sceneSnapshot();
    if (lastSceneStats === null) {
      lastSceneStats = snapshot;
      return;
    }
    const persisted = {};
    for (const scene of ['file', 'command', 'web', 'other']) {
      const nowStats = snapshot[scene] ?? {};
      const prev = lastSceneStats[scene] ?? {};
      const delta = {
        hits: (nowStats.hits ?? 0) - (prev.hits ?? 0),
        misses: (nowStats.misses ?? 0) - (prev.misses ?? 0),
        repeatFailures: (nowStats.repeats ?? 0) - (prev.repeats ?? 0),
        warnEffective: (nowStats.warnEffective ?? 0) - (prev.warnEffective ?? 0),
        warnIneffective: (nowStats.warnIneffective ?? 0) - (prev.warnIneffective ?? 0),
      };
      const activity = Math.abs(delta.hits) + Math.abs(delta.misses) + Math.abs(delta.repeatFailures) + Math.abs(delta.warnEffective);
      const evolverForScene = sceneEvolvers[scene];
      if (activity > 0 && evolverForScene !== undefined) {
        evolverForScene.observe({ fitness: fitnessFromDelta(delta), at: now });
        const arm = evolverForScene.select();
        injector.configureScene(scene, { charBudget: arm.charBudget });
      }
      persisted[scene] = {
        trials: evolverForScene?.exportTrials() ?? [],
        current: evolverForScene?.current() ?? null,
        charBudget: injector.sceneSnapshot()[scene]?.charBudget ?? null,
      };
    }
    lastSceneStats = snapshot;
    await writeMeta({ sceneEvolution: persisted, sceneEvolutionAt: now });
  }

  /* ---------------- 实时会话指标 ---------------- */

  const liveCache = { at: 0, value: null, pending: false };
  /** 概览响应缓存：轮询/来回切页签时直接复用，避免重复扫描。 */
  const overviewCache = { at: 0, key: '', body: null };
  if (liveCache === undefined) {
    // 占位，真实定义在下方
  }

  /** 重活：真正读会话日志统计。只在后台跑，结果进 liveCache。 */
  async function computeLive() {
    const db = persistence ?? ctx.get?.('sessionPersistence');
    if (db === undefined || db === null) return null;
    const now = Date.now();
    try {
      const snapshots = await db.list();
      const recent = [...snapshots]
        .sort((a, b) => (b.header?.createdAt ?? 0) - (a.header?.createdAt ?? 0))
        .slice(0, 60);
      const stats = {
        sessions: snapshots.length, sampled: recent.length,
        turns: 0, toolCalls: 0, toolErrors: 0, userMessages: 0, assistantMessages: 0, failedTurns: 0,
        sampledAt: now,
      };
      for (const snapshot of recent) {
        try {
          const handle = await db.open(snapshot.header.id, 'read');
          try {
            const result = await handle.read();
            for (const event of result.events ?? []) {
              switch (event.type) {
                case 'turn/start': stats.turns += 1; break;
                case 'tool/call': stats.toolCalls += 1; break;
                case 'tool/result':
                  if (event.data?.message?.isError === true || event.data?.error !== undefined) stats.toolErrors += 1;
                  break;
                case 'user/message': stats.userMessages += 1; break;
                case 'assistant/message': stats.assistantMessages += 1; break;
                case 'turn/end':
                  if (event.data?.reason?.kind === 'error') stats.failedTurns += 1;
                  break;
                default: break;
              }
            }
          } finally {
            await Promise.resolve(handle.close()).catch(() => {});
          }
        } catch {
          // 跳过不可读会话
        }
      }
      return stats;
    } catch (error) {
      return { error: errorMessage(error), sessions: 0, sampled: 0 };
    }
  }

  /** 读缓存；过期就后台刷新，本次先返回旧值（首屏不阻塞）。 */
  function readLive() {
    const db = persistence ?? ctx.get?.('sessionPersistence');
    if (db === undefined || db === null) return null;
    const now = Date.now();
    if (liveCache.value !== null && now - liveCache.at < 60_000) return liveCache.value;
    if (liveCache.pending !== true) {
      liveCache.pending = true;
      setTimeout(() => {
        computeLive()
          .then((value) => { liveCache.value = value; liveCache.at = Date.now(); })
          .catch(() => {})
          .finally(() => { liveCache.pending = false; });
      }, 0);
    }
    return liveCache.value;
  }
  /* ---------------- 自产进化视图 ---------------- */

  async function buildDerived(context) {
    await ensureMemory();
    const visible = await memory.listVisible({ context, limit: 120 });
    const byKind = (kinds) => visible.items.filter((record) => kinds.includes(record.kind));
    const injection = injector.stats();
    return {
      lessons: byKind(['lesson']).slice(0, 12).map((record) => ({
        id: record.id,
        action: record.text,
        category: (record.topics ?? []).find((topic) => topic.startsWith('cat:'))?.slice(4) ?? '',
        votes: record.evidence,
        confidence: record.confidence,
        sharing: record.sharing,
        hits: record.hitCount,
        misses: record.missCount,
        resurrected: record.meta?.resurrected === true,
        retireReason: String(record.meta?.retireReason ?? ''),
        demoteReason: String(record.meta?.demoteReason ?? ''),
        gapFilled: record.meta?.gapFilled === true,
        demoteReason: String(record.meta?.demoteReason ?? ''),
        updatedAt: record.updatedAt,
      })),
      facts: byKind(['constraint', 'preference', 'fact']).slice(0, 12).map((record) => ({
        id: record.id,
        text: record.text,
        kind: record.kind,
        evidence: record.evidence,
        confidence: record.confidence,
        sharing: record.sharing,
        lastSeen: record.lastUsedAt || record.updatedAt,
      })),
      skills: byKind(['skill']).slice(0, 8).map((record) => ({
        id: record.id,
        goal: record.text,
        category: (record.topics ?? []).find((topic) => topic.startsWith('cat:'))?.slice(4) ?? '',
        state: record.status,
        evidence: record.evidence,
        confidence: record.confidence,
      })),
      gate: {
        injected: injection.injected,
        warned: injection.warned,
        warnEffective: injection.warnEffective,
        warnIneffective: injection.warnIneffective,
        guardDenied: injection.guardDenied,
        guardEffective: injection.guardEffective,
        guardIneffective: injection.guardIneffective,
        captured: injection.captured,
        refined: injection.refined,
        repeatFailures: injection.repeatFailures,
        hits: injection.hits,
        misses: injection.misses,
        enabled: injection.enabled,
      },
      total: visible.total,
      blocked: visible.blocked,
      generatedAt: Date.now(),
    };
  }

  /** 会话结束时落一条质量记录：是否注入、工具调用数与失败数。 */
  async function appendQuality(outcome, sessionId = '') {
    if (outcome === null || outcome === undefined) return;
    if ((outcome.toolCalls ?? 0) === 0) return;
    try {
      await fsp.mkdir(memoryDir, { recursive: true });
      await fsp.appendFile(qualityFile, JSON.stringify({ at: Date.now(), sessionId: String(sessionId), ...outcome }) + '\n', 'utf8');
    } catch {
      // 质量日志失败不影响主流程
    }
  }

  async function readQuality() {
    try {
      const text = await fsp.readFile(qualityFile, 'utf8');
      const lines = text.trim().split('\n').slice(-500);
      const entries = [];
      for (const line of lines) {
        try {
          entries.push(JSON.parse(line));
        } catch {
          // 跳过坏行
        }
      }
      return summarizeQuality(entries);
    } catch {
      return summarizeQuality([]);
    }
  }

  /** 构建"页面启动快照"：通道不可用时前端至少能显示真实数据。 */
  async function refreshBootSnapshot() {
    try {
      await ensureMemory();
      const health = await memory.health();
      const pending = await memory.pending(20);
      const derived = await buildDerived({ sessionId: '', workspaceId: '' });
      const stats = injector.stats();
      bootSnapshot = {
        ok: true,
        offlineSnapshot: true,
        generatedAt: Date.now(),
        injection: { ...stats, autoSeeded, autoActivated },
        evolution,
        scenes: injector.sceneSnapshot(),
        derived,
        efficacy: {
          failures: efficacy === null ? null : {
            totalFailures: efficacy.totalFailures,
            distinctKeys: efficacy.distinctKeys,
            repeatedKeys: efficacy.repeatedKeys,
            repeatRate: efficacy.repeatRate,
            top: Array.isArray(efficacy.top) ? efficacy.top.slice(0, 20) : [],
            suggestions: Array.isArray(efficacy.suggestions) ? efficacy.suggestions.slice(0, 8) : [],
            corrections: efficacy.corrections,
            coverage: efficacy.coverage ?? null,
            scenes: Array.isArray(efficacy.scenes) ? efficacy.scenes : [],
          },
          attribution,
          lessonEfficacy: lessonEfficacyCache,
          regressions: findRegressions(lessonEfficacyCache),
          promotable: promotableCache,
          attributionTrend: (await readMeta()).attributionTrend ?? [],
          metrics: metrics.summary(),
        },
        memory: {
          health,
          pending: pending.slice(0, 20).map(publicRecord),
          pendingTotal: pending.filter((record) => ((record.provenance ?? [])[0]?.source ?? '') !== 'model-tool').length,
          modelPendingTotal: pending.filter((record) => ((record.provenance ?? [])[0]?.source ?? '') === 'model-tool').length,
          dir: memoryDir,
          hygiene: lastHygiene,
        },
      };
      bootSnapshotAt = bootSnapshot.generatedAt;
    } catch (error) {
      lastError = errorMessage(error);
    }
  }

  /* ---------------- 遥测 ---------------- */

  async function writeStatus() {
    try {
      await fsp.mkdir(memoryDir, { recursive: true });
      await fsp.writeFile(statusFile, JSON.stringify({
        at: Date.now(),
        ...injector.stats(),
        autoSeeded,
        efficacy,
        efficacyError,
        evolution,
        scenes: injector.sceneSnapshot(),
        guardRegistered,
        hygiene: lastHygiene,
        instructions: { captured: instructionsCaptured, toolWrites: toolsWrote },
        backfilledLessons,
        sectionSkipped,
        search: { ...searchStats },
        storage: { dir: memoryDir, pointer: readStoragePointer() },
        selfcheck,
        audit: lastAudit,
        alerts,
        gapFilled,
        repairedLessons: lastRepairedLessons,
        autoActivated,
        reseedBlocked,
        procedures: {
          tracked: procedureCounts.size,
          created: proceduresCreated,
          pending: [...procedureCounts.values()].filter((entry) => entry.created !== true).length,
        },
        attribution,
        quality: await readQuality().catch(() => null),
        attributionTrend: (await readMeta()).attributionTrend ?? [],
        metrics: metrics.summary(),
        lastError,
        routes: routeDiagnostic,
      }, null, 2), 'utf8');
    } catch {
      // 遥测失败不影响功能
    }
  }

  ctx.effect(() => {
    const timer = setInterval(async () => {
      const delta = await flushMetrics().catch(() => null);
      if (efficacy === null) await refreshEfficacy().catch(() => {});
      // 二次机会：首轮扫描可能早于 sessionPersistence 注入，拿到跨会话数据后再转正一次。
      if (efficacy !== null && Array.isArray(efficacy.crossSession)) {
        await autoActivateSharedLessons().catch(() => 0);
      }
      if (delta !== null) await evolveOnce(delta).catch(() => {});
      await evolveScenes().catch(() => {});
      await refreshBootSnapshot().catch(() => {});
      await writeStatus().catch(() => {});
    }, 30_000);
    if (typeof timer.unref === 'function') timer.unref();
    return () => {
      clearInterval(timer);
      writeStatus().catch(() => {});
    };
  }, 'dsh-lingxi-panel: telemetry');

  ctx.effect(() => {
    refreshEfficacy().catch(() => {});
    ensureMemory()
      .then(() => runHygiene())
      .catch(() => {});
    const timer = setInterval(() => refreshEfficacy().catch(() => {}), 5 * 60_000);
    const daily = setInterval(() => {
      ensureMemory()
        .then(() => runHygiene())
        .catch(() => {});
    }, 24 * 3_600_000);
    if (typeof daily.unref === 'function') daily.unref();
    if (typeof timer.unref === 'function') timer.unref();
    return () => {
      clearInterval(timer);
      clearInterval(daily);
    };
  }, 'dsh-lingxi-panel: efficacy scan');

  /* ---------------- 路由 ---------------- */

  ctx.inject(['webServer', 'sessionPersistence'], (hctx) => {
    hctx.effect(() => {
      persistence = hctx.sessionPersistence;
      try {
        routeDiagnostic.origin = typeof hctx.webServer.getOrigin === 'function' ? hctx.webServer.getOrigin() : null;
      } catch {
        routeDiagnostic.origin = null;
      }
      const disposers = [];
      const route = (routePath, handler) => {
        const register = (actualPath) => {
          const disposer = hctx.webServer.register({
            kind: 'exact',
            path: actualPath,
            handler: async (request, response) => {
              routeDiagnostic.requests += 1;
              routeDiagnostic.lastAt = Date.now();
              routeDiagnostic.lastPath = actualPath;
              let hasSessionParam = false;
              try {
                const parsed = new URL(request.url ?? '/', 'http://localhost');
                hasSessionParam = (parsed.searchParams.get('sessionId') ?? '') !== '';
              } catch {
                hasSessionParam = false;
              }
              routeDiagnostic.lastHasSessionParam = hasSessionParam || routeDiagnostic.lastHasSessionParam === true;
              if (routeDiagnostic.firstAt === 0) routeDiagnostic.firstAt = routeDiagnostic.lastAt;
              if (routeDiagnostic.lastAt - lastRequestPersistedAt > 60_000) {
                lastRequestPersistedAt = routeDiagnostic.lastAt;
                writeMeta({
                  lastRequest: {
                    at: routeDiagnostic.lastAt,
                    path: actualPath,
                    hasSessionParam: routeDiagnostic.lastHasSessionParam === true,
                    requests: routeDiagnostic.requests,
                  },
                }).catch(() => {});
              }
              routeDiagnostic.requestsByPath[actualPath] = (routeDiagnostic.requestsByPath[actualPath] ?? 0) + 1;
              const rejection = requestRejection(hctx, request);
              if (rejection !== undefined) {
                sendJson(response, rejection, { ok: false, error: 'forbidden' });
                return;
              }
              try {
                await handler(request, response);
              } catch (error) {
                routeDiagnostic.lastHandlerError = errorMessage(error);
                routeDiagnostic.lastHandlerErrorPath = actualPath;
                routeDiagnostic.handlerErrors = (routeDiagnostic.handlerErrors ?? 0) + 1;
                sendJson(response, 200, { ok: false, error: errorMessage(error) });
              }
            },
          });
          disposers.push(disposer);
          routeDiagnostic.registered += 1;
        };
        try {
          register(routePath);
        } catch (error) {
          routeDiagnostic.errors.push(routePath + ': ' + errorMessage(error));
        }
        if (routePath.startsWith('/lingxi/')) {
          try {
            register('/api' + routePath);
          } catch (error) {
            routeDiagnostic.errors.push('/api' + routePath + ': ' + errorMessage(error));
          }
        }
        if (routeDiagnostic.errors.length > 8) routeDiagnostic.errors.shift();
      };

      // 页面 HTML 内嵌启动快照：HTTP/协议通道不可用时的兜底。
      try {
        hctx.webServer.tapIndex((html) => {
          if (bootSnapshot === null) return html;
          const json = JSON.stringify(bootSnapshot).replace(/</g, '\u003c');
          const tag = '<script>window.__LINGXI_BOOT__=' + json + ';</script>';
          return html.includes('</head>') ? html.replace('</head>', tag + '</head>') : tag + html;
        });
      } catch (error) {
        routeDiagnostic.errors.push('tapIndex: ' + errorMessage(error));
      }

      route(OVERVIEW, async (request, response) => {
        if (!allowGet(request, response)) return;
        let sessionId = '';
        let workspaceId = '';
        let force = false;
        try {
          const url = new URL(request.url ?? OVERVIEW, 'http://localhost');
          sessionId = url.searchParams.get('sessionId') ?? '';
          workspaceId = url.searchParams.get('workspaceId') ?? '';
          force = url.searchParams.get('refresh') === '1';
        } catch {
          sessionId = '';
          workspaceId = '';
          force = false;
        }
        const context = { sessionId, workspaceId };
        const cacheKey = sessionId + '|' + workspaceId;
        const nowMs0 = Date.now();
        if (!force && overviewCache.body !== null && overviewCache.key === cacheKey && nowMs0 - overviewCache.at < 8000) {
          sendJson(response, 200, { ...overviewCache.body, cachedAt: overviewCache.at, servedFromCache: true });
          return;
        }
        let health = null;
        let pending = [];
        let pendingTotal = 0;
        let modelPendingTotal = 0;
        let pendingHidden = 0;
        let visible = null;
        try {
          await ensureMemory();
          health = await memory.health();
          const allPending = await memory.pending(200);
          pendingTotal = allPending.filter((record) => ((record.provenance ?? [])[0]?.source ?? '') !== 'model-tool').length;
          modelPendingTotal = allPending.filter((record) => ((record.provenance ?? [])[0]?.source ?? '') === 'model-tool').length;
          pending = allPending.slice(0, 20).map(publicRecord);
          pendingHidden = Math.max(0, Number(health?.byStatus?.candidate ?? 0) - allPending.length);
          visible = await memory.listVisible({ context, limit: 1 });
        } catch (error) {
          lastError = errorMessage(error);
        }
        let derived = null;
        try {
          derived = await buildDerived(context);
        } catch (error) {
          lastError = errorMessage(error);
        }
        if (efficacy === null) refreshEfficacy().catch(() => {});
        const live = readLive();
        let lessonEfficacy = null;
        let promotable = null;
        try {
          lessonEfficacy = await computeLessonEfficacy();
          promotable = await computePromotable();
          lessonEfficacyCache = lessonEfficacy;
          promotableCache = promotable;
        } catch (error) {
          lastError = errorMessage(error);
        }
        const stats = injector.stats();
        const sectionErrors = {};
        const safe = async (label, run, fallback) => {
          try {
            return await run();
          } catch (error) {
            sectionErrors[label] = errorMessage(error);
            return fallback;
          }
        };
        const qualitySafe = await safe('quality', () => readQuality(), null);
        const trendSafe = await safe('trend', async () => (await readMeta()).attributionTrend ?? [], []);
        const body = {
          ok: true,
          sections: sectionErrors,
          generatedAt: Date.now(),
          timing: { total: Date.now() - nowMs0 },
          context,
          live,
          derived,
          injection: { ...stats, autoSeeded, autoActivated },
          search: { ...searchStats },
          storage: { dir: memoryDir, pointer: readStoragePointer() },
          samples: (injector.stats().samples ?? []).slice(-5).map((sample) => ({ sessionId: sample.sessionId, chars: sample.chars, records: sample.records, text: sample.text ?? sample.preview })),
          selfcheck,
          audit: lastAudit,
          alerts,
          evolution,
          scenes: injector.sceneSnapshot(),
          quality: qualitySafe,
          efficacy: {
            failures: efficacy === null
              ? null
              : {
                  totalFailures: efficacy.totalFailures,
                  distinctKeys: efficacy.distinctKeys,
                  repeatedKeys: efficacy.repeatedKeys,
                  repeatRate: efficacy.repeatRate,
                  top: Array.isArray(efficacy.top) ? efficacy.top.slice(0, 20) : [],
                  suggestions: Array.isArray(efficacy.suggestions) ? efficacy.suggestions.slice(0, 8) : [],
                  corrections: efficacy.corrections,
            coverage: efficacy.coverage ?? null,
                  crossSession: Array.isArray(efficacy.crossSession) ? efficacy.crossSession.slice(0, 10) : [],
                  scenes: Array.isArray(efficacy.scenes) ? efficacy.scenes : [],
                  coverage: efficacy.coverage ?? null,
                  trend: Array.isArray(efficacy.trend) ? efficacy.trend : [],
                },
            attribution,
            attributionTrend: trendSafe,
            lessonEfficacy,
            regressions: findRegressions(lessonEfficacy),
            promotable,
            metrics: metrics.summary(),
            error: efficacyError,
          },
          memory: {
            health,
            pending,
            pendingTotal,
            modelPendingTotal,
            pendingHidden,
            visible,
            error: lastError,
            dir: memoryDir,
            consolidate: lastConsolidate,
            hygiene: lastHygiene,
          },
          freshness: {
            memory: { at: health?.lastSaveAt ?? null },
            injection: { at: stats.lastAt || null },
            staleAfterMs: Number(settings.staleAfterMs) || 10 * 60_000,
            generatedAt: Date.now(),
          },
        };
        routeDiagnostic.lastDurationMs = Date.now() - nowMs0;
        try {
          routeDiagnostic.lastBytes = JSON.stringify(body).length;
        } catch {
          routeDiagnostic.lastBytes = -1;
        }
        overviewCache.at = Date.now();
        overviewCache.key = cacheKey;
        overviewCache.body = body;
        sendJson(response, 200, body);
      });

      route(MEMORY + '/search', async (request, response) => {
        if (!allowGet(request, response)) return;
        await ensureMemory();
        const url = new URL(request.url ?? MEMORY, 'http://localhost');
        const query = url.searchParams.get('q') ?? '';
        const limit = clampInt(url.searchParams.get('limit'), 1, 40, 12);
        const context = {
          workspaceId: url.searchParams.get('workspaceId') ?? '',
          sessionId: url.searchParams.get('sessionId') ?? '',
        };
        const result = await memory.recall(query, { limit, context, charBudget: 1600 });
        searchStats.total += 1;
        searchStats.lastAt = Date.now();
        if (result.abstain === true) searchStats.abstained += 1;
        const annotated = annotate(
          result.items.map((entry) => ({ ...entry.record, effective: entry.effective, score: entry.score, lexical: entry.lexical })),
          { groupKey: () => 'memory', hideAbove: 0.5 },
        );
        const blocked = await memory.listVisible({ context, limit: 1 });
        sendJson(response, 200, {
          ok: true,
          query,
          items: annotated.items.map((record) => ({
            ...publicRecord(record),
            score: round(record.score),
            effective: round(record.effective),
            noise: record.noise,
            clusterId: record.clusterId,
            clusterSize: record.clusterSize,
          })),
          hidden: annotated.hidden,
          isolation: { blocked: blocked.blocked, reasons: blocked.blockedReasons },
          block: result.text,
          chars: result.chars,
          confident: result.confident,
          abstain: result.abstain,
        });
      });

      route(MEMORY + '/pending', async (request, response) => {
        if (!allowGet(request, response)) return;
        await ensureMemory();
        sendJson(response, 200, { ok: true, items: (await memory.pending(40)).map(publicRecord) });
      });

      route(MEMORY + '/confirm', async (request, response) => {
        if (!allowPost(request, response)) return;
        await ensureMemory();
        const body = await readBody(request);
        const id = String(body?.id ?? '');
        if (id === '') {
          sendJson(response, 200, { ok: false, error: 'missing-id' });
          return;
        }
        const decision = body?.decision === 'retire' || body?.decision === 'forget' ? 'retire' : 'accept';
        const record = await memory.confirm(id, decision);
        sendJson(response, 200, { ok: record !== null, record: record !== null ? publicRecord(record) : null });
      });

      route(MEMORY + '/promote', async (request, response) => {
        if (!allowPost(request, response)) return;
        await ensureMemory();
        const body = await readBody(request);
        const id = String(body?.id ?? '');
        const sharing = String(body?.sharing ?? '');
        if (id === '' || !['private', 'workspace', 'global'].includes(sharing)) {
          sendJson(response, 200, { ok: false, error: 'bad-request' });
          return;
        }
        const record = await memory.promote(id, sharing);
        sendJson(response, 200, { ok: record !== null, record: record !== null ? publicRecord(record) : null });
      });

      route(MEMORY + '/suggest', async (request, response) => {
        if (!allowPost(request, response)) return;
        await ensureMemory();
        const body = await readBody(request);
        const tool = String(body?.tool ?? '').slice(0, 40);
        const code = String(body?.code ?? '').slice(0, 40);
        const count = clampInt(body?.count, 1, 100000, 5);
        if (tool === '') {
          sendJson(response, 200, { ok: false, error: 'missing-tool' });
          return;
        }
        const text = lessonTextFor({ tool, code });
        const written = await memory.remember({
          kind: 'lesson',
          text,
          scope: { kind: 'machine', id: '' },
          sharing: 'global',
          status: 'candidate',
          confidence: 0.5,
          evidence: count,
          meta: { tool, code },
          topics: ['tool:' + tool, 'kind:lesson'],
          provenance: [{ source: 'efficacy-scan', sessionId: '', excerpt: String(count) + ' 次重复失败' }],
        });
        sendJson(response, 200, { ok: true, action: written.action, record: publicRecord(written.record) });
      });

      route(MEMORY + '/list', async (request, response) => {
        if (!allowGet(request, response)) return;
        await ensureMemory();
        try {
          const url = new URL(request.url ?? MEMORY, 'http://localhost');
          const records = await memory.listRecords({
            status: url.searchParams.get('status') ?? '',
            kind: url.searchParams.get('kind') ?? '',
            q: url.searchParams.get('q') ?? '',
            source: url.searchParams.get('source') ?? '',
            minHits: clampInt(url.searchParams.get('minHits'), 0, 1000, 0),
            minMisses: clampInt(url.searchParams.get('minMisses'), 0, 1000, 0),
            limit: clampInt(url.searchParams.get('limit'), 1, 500, 50),
          });
          sendJson(response, 200, { ok: true, items: records.map(publicRecord) });
        } catch (error) {
          sendJson(response, 200, { ok: false, error: errorMessage(error) });
        }
      });

      route(MEMORY.replace('/memory', '') + '/diagnostics/selfcheck', async (request, response) => {
        if (!allowPost(request, response)) return;
        const base = path.dirname(fileURLToPath(import.meta.url));
        const script = path.join(base, 'test-all.mjs');
        const started = Date.now();
        const child = spawn(process.execPath, [script], { cwd: base });
        let out = '';
        child.stdout.on('data', (chunk) => { out += String(chunk); });
        child.stderr.on('data', (chunk) => { out += String(chunk); });
        const timer = setTimeout(() => { try { child.kill(); } catch { /* ignore */ } }, 180_000);
        child.on('close', (code) => {
          clearTimeout(timer);
          const suites = out.split('\n')
            .map((line) => /^\s+(ok|FAIL)\s+(\S+)\s*(.*)$/.exec(line))
            .filter((match) => match !== null)
            .map((match) => ({ ok: match[1] === 'ok', name: match[2], detail: match[3].trim() }));
          selfcheck = { ok: code === 0, ms: Date.now() - started, suites, at: Date.now() };
          sendJson(response, 200, {
            ok: code === 0,
            ms: Date.now() - started,
            suites,
            tail: out.split('\n').slice(-6).join('\n'),
          });
        });
      });

      route(MEMORY.replace('/memory', '') + '/diagnostics/audit', async (request, response) => {
        if (!allowPost(request, response)) return;
        const base = path.dirname(fileURLToPath(import.meta.url));
        const child = spawn(process.execPath, [path.join(base, 'audit.mjs')], { cwd: base });
        let out = '';
        child.stdout.on('data', (chunk) => { out += String(chunk); });
        child.stderr.on('data', (chunk) => { out += String(chunk); });
        const timer = setTimeout(() => { try { child.kill(); } catch { /* ignore */ } }, 60_000);
        child.on('close', (code) => {
          clearTimeout(timer);
          sendJson(response, 200, { ok: code === 0, lines: out.split('\n').filter((line) => line.trim() !== '') });
        });
      });

      route(MEMORY + '/export', async (request, response) => {
        if (!allowGet(request, response)) return;
        await ensureMemory();
        try {
          const data = await memory.exportAll();
          sendJson(response, 200, { ok: true, data });
        } catch (error) {
          sendJson(response, 200, { ok: false, error: errorMessage(error) });
        }
      });

      route(MEMORY + '/import', async (request, response) => {
        if (!allowPost(request, response)) return;
        await ensureMemory();
        const body = await readBody(request);
        try {
          const payload = body?.data ?? body;
          const version = payload?.version;
          if (version !== undefined && version !== null && Number(version) !== Number(memory.schemaVersion ?? version)) {
            sendJson(response, 200, { ok: false, error: 'version-mismatch', expected: memory.schemaVersion ?? null, got: version });
            return;
          }
          const records = Array.isArray(payload?.records) ? payload.records : [];
          const report = await memory.importRecords(records, { dryRun: body?.dryRun === true });
          await writeStatus();
          sendJson(response, 200, { ok: true, report });
        } catch (error) {
          sendJson(response, 200, { ok: false, error: errorMessage(error) });
        }
      });

      route(MEMORY + '/purge', async (request, response) => {
        if (!allowPost(request, response)) return;
        await ensureMemory();
        const body = await readBody(request);
        try {
          const filter = body?.filter ?? {};
          const dryRun = body?.dryRun === true;
          const report = await memory.purge(filter, { dryRun });
          if (!dryRun) await writeStatus();
          sendJson(response, 200, { ok: true, report });
        } catch (error) {
          sendJson(response, 200, { ok: false, error: errorMessage(error) });
        }
      });

      route(MEMORY + '/delete', async (request, response) => {
        if (!allowPost(request, response)) return;
        await ensureMemory();
        const body = await readBody(request);
        try {
          const report = await memory.deleteRecords(body?.ids ?? []);
          await writeStatus();
          sendJson(response, 200, { ok: true, report });
        } catch (error) {
          sendJson(response, 200, { ok: false, error: errorMessage(error) });
        }
      });

      route(MEMORY + '/storage/migrate', async (request, response) => {
        if (!allowPost(request, response)) return;
        await ensureMemory();
        const body = await readBody(request);
        try {
          const target = String(body?.dir ?? '').trim();
          if (target === '') {
            sendJson(response, 200, { ok: false, error: 'target dir required' });
            return;
          }
          if (path.resolve(target) === path.resolve(memoryDir)) {
            sendJson(response, 200, { ok: false, error: 'same as current dir' });
            return;
          }
          await fsp.mkdir(target, { recursive: true });
          // 验证可写
          const probe = path.join(target, '.lingxi-probe');
          await fsp.writeFile(probe, 'ok', 'utf8');
          await fsp.rm(probe, { force: true });
          // 复制数据文件
          const files = ["memory.json", ".meta.json", "metrics.json", "quality.jsonl", "injection-status.json"];
          const copied = [];
          for (const name of files) {
            const from = path.join(memoryDir, name);
            try {
              const content = await fsp.readFile(from);
              await fsp.writeFile(path.join(target, name), content);
              copied.push(name);
            } catch {
              // 该文件不存在就跳过
            }
          }
          if (!copied.includes("memory.json")) {
            sendJson(response, 200, { ok: false, error: 'memory.json missing in source' });
            return;
          }
          // 校验：源与目标的 memory.json 逐字节一致
          const srcSha = (await fsp.readFile(path.join(memoryDir, "memory.json"))).toString("base64");
          const dstSha = (await fsp.readFile(path.join(target, "memory.json"))).toString("base64");
          if (srcSha !== dstSha) {
            sendJson(response, 200, { ok: false, error: 'copy verification failed' });
            return;
          }
          // 写指针（重启后生效）
          await fsp.writeFile(storagePointerFile, JSON.stringify({ dir: path.resolve(target), setAt: Date.now() }, null, 2), 'utf8');
          await writeStatus();
          sendJson(response, 200, { ok: true, report: { copied, target: path.resolve(target), restartRequired: true } });
        } catch (error) {
          sendJson(response, 200, { ok: false, error: errorMessage(error) });
        }
      });

      route(MEMORY + '/repair', async (request, response) => {
        if (!allowPost(request, response)) return;
        await ensureMemory();
        const body = await readBody(request);
        try {
          const plan = await buildRepairPlan();
          if (body?.dryRun === true) {
            sendJson(response, 200, { ok: true, plan });
            return;
          }
          const report = await applyRepair(plan);
          sendJson(response, 200, { ok: true, report });
        } catch (error) {
          sendJson(response, 200, { ok: false, error: errorMessage(error) });
        }
      });

      route(MEMORY + '/undo-delete', async (request, response) => {
        if (!allowPost(request, response)) return;
        await ensureMemory();
        try {
          const report = await memory.restoreLastDeleted();
          await writeStatus();
          sendJson(response, 200, { ok: true, report });
        } catch (error) {
          sendJson(response, 200, { ok: false, error: errorMessage(error) });
        }
      });

      route(MEMORY + '/backups', async (request, response) => {
        if (!allowGet(request, response)) return;
        await ensureMemory();
        try {
          const items = await memory.listBackups();
          sendJson(response, 200, { ok: true, items });
        } catch (error) {
          sendJson(response, 200, { ok: false, error: errorMessage(error) });
        }
      });

      route(MEMORY + '/restore', async (request, response) => {
        if (!allowPost(request, response)) return;
        await ensureMemory();
        const body = await readBody(request);
        try {
          const report = await memory.restoreBackup(String(body?.file ?? ''));
          await writeStatus();
          sendJson(response, 200, { ok: true, report });
        } catch (error) {
          sendJson(response, 200, { ok: false, error: errorMessage(error) });
        }
      });

      route(MEMORY + '/reset', async (request, response) => {
        if (!allowPost(request, response)) return;
        await ensureMemory();
        const body = await readBody(request);
        const mode = body?.mode === 'candidates' ? 'candidates' : 'all';
        try {
          const report = await memory.reset({ mode });
          await writeStatus();
          sendJson(response, 200, { ok: true, report });
        } catch (error) {
          sendJson(response, 200, { ok: false, error: errorMessage(error) });
        }
      });

      route(MEMORY + '/hygiene', async (request, response) => {
        if (!allowPost(request, response)) return;
        const report = await runHygiene();
        await writeStatus();
        sendJson(response, 200, { ok: true, report });
      });

      route(MEMORY + '/consolidate', async (request, response) => {
        if (!allowPost(request, response)) return;
        await ensureMemory();
        lastConsolidate = await memory.consolidate();
        await writeMeta({ lastConsolidateAt: Date.now(), lastReport: lastConsolidate });
        sendJson(response, 200, { ok: true, report: lastConsolidate });
      });

      route('/lingxi/semantic/options', async (request, response) => {
        if (!allowGetPost(request, response)) return;
        try {
        const llm = ctx?.get?.('llm');
        const selector = ctx?.get?.('agentDefaultModel');
        const current = selector?.currentSelection?.() ?? null;
        // 1) 有适配器的注册路由（当前真正可调用的）
        const registered = (() => {
          try {
            const raw = llm?.listProviders?.() ?? [];
            return (Array.isArray(raw) ? raw : []).map((entry) => ({ id: String(entry?.id ?? ''), label: String(entry?.name ?? entry?.id ?? '') }))
              .filter((entry) => entry.id !== '');
          } catch {
            return [];
          }
        })();
        // 2) 可配置目录（含休眠的，字段是 provider/displayName）
        const configurable = (() => {
          try {
            const raw = llm?.listConfigurableProviders?.() ?? [];
            return (Array.isArray(raw) ? raw : []).map((entry) => ({ id: String(entry?.provider ?? ''), label: String(entry?.displayName ?? entry?.provider ?? '') }))
              .filter((entry) => entry.id !== '');
          } catch {
            return [];
          }
        })();
        // 合并去重（按 id），registered 在前
        const seen = new Set();
        const providers = [];
        for (const entry of [...registered, ...configurable]) {
          if (seen.has(entry.id)) continue;
          seen.add(entry.id);
          providers.push(entry);
        }
        // 3) 逐 provider 拉模型目录（LlmModelInfo: { provider, id, name }）
        const settled = await Promise.allSettled(providers.map((entry) => llm?.listModels?.(entry.id) ?? Promise.resolve([])));
        const withModels = providers.map((entry, i) => {
          const outcome = settled[i];
          const models = outcome.status === 'fulfilled' && Array.isArray(outcome.value)
            ? outcome.value.map((model) => String(typeof model === 'string' ? model : (model?.id ?? model?.name ?? ''))).filter((x) => x !== '')
            : [];
          return { id: entry.id, label: entry.label, models };
        });
        // 4) 当前默认模型并入列表（即使用户 provider 不在目录里也能显式选到）
        if (current !== null && current.provider !== undefined && current.model !== undefined) {
          const hit = withModels.find((entry) => entry.id === current.provider);
          if (hit === undefined) {
            withModels.push({ id: String(current.provider), label: String(current.provider), models: [String(current.model)] });
          } else if (!hit.models.includes(String(current.model))) {
            hit.models.unshift(String(current.model));
          }
        }
        sendJson(response, 200, { ok: true, current, providers: withModels, saved: settings.semanticModel ?? null });
        } catch (error) {
          sendJson(response, 200, { ok: false, error: errorMessage(error) });
        }
      });

      route('/lingxi/injection/config', async (request, response) => {
        if (!allowGetPost(request, response)) return;
        await ensureMemory();
        if ((request.method ?? 'GET') === 'GET') {
          sendJson(response, 200, { ok: true, config: injector.config(), evolution });
          return;
        }
        const body = await readBody(request);
        let injectionPatch = { ...(body ?? {}) };
        if (injectionPatch.semantic !== undefined) {
          settings.semantic = injectionPatch.semantic === true;
          await writeMeta({ semantic: settings.semantic });
          delete injectionPatch.semantic;
        }
        if (injectionPatch.semanticModel !== undefined) {
        const picked = injectionPatch.semanticModel ?? null;
        const valid = picked !== null && typeof picked === 'object' && typeof picked.provider === 'string' && picked.provider !== '' && typeof picked.model === 'string' && picked.model !== '';
        settings.semanticModel = valid ? { provider: picked.provider, model: picked.model } : null;
        await writeMeta({ semanticModel: settings.semanticModel });
        delete injectionPatch.semanticModel;
        }
    const next = injector.configure(injectionPatch);
        await writeMeta({ injection: next });
        await writeStatus();
        sendJson(response, 200, { ok: true, config: next });
      });

      return () => {
        for (const dispose of disposers) {
          try {
            dispose();
          } catch {
            // 卸载期清理失败不阻塞
          }
        }
      };
    }, 'dsh-lingxi-panel: routes');
  });

  /* ---------------- 工具：让模型自己写记忆 ---------------- */

  const registerMemoryTool = () => {
    const tools = ctx.get?.('tools');
    if (tools === undefined || tools === null) return null;
    const disposer = tools.register({
      name: TOOL_NAME,
      description: TOOL_DESCRIPTION,
      parameters: TOOL_PARAMETERS,
      output: {
        schema: TOOL_OUTPUT_SCHEMA,
        render(args, value) {
          const action = String(value?.action ?? '');
          const kind = String(args?.kind ?? '');
          const status = value?.status === 'candidate' ? '待确认' : String(value?.status ?? '');
          return [{ type: 'text', text: '已记入灵犀（' + kind + ' · ' + status + ' · ' + action + '）：' + String(args?.text ?? '').slice(0, 80) }];
        },
      },
      async execute(args, exec) {
        const checked = validateMemoryWrite(args);
        if (checked.ok === false) throw new Error(checked.error);
        const value = checked.value;
        const sessionId = String(exec?.agent?.id ?? '');
        const workspaceId = sessionId === '' ? '' : await listWorkspace(sessionId);
        const written = await memory.remember({
          kind: value.kind,
          text: value.text,
          scope: { kind: 'machine', id: '' },
          origin: { sessionId, workspaceId },
          sharing: value.sharing,
          status: 'candidate',
          confidence: 0.7,
          evidence: value.evidence,
          topics: ['kind:' + value.kind, 'source:model-tool'],
          provenance: [{ source: 'model-tool', sessionId, excerpt: value.text.slice(0, 120) }],
        });
        toolsWrote += 1;
        return {
          action: String(written?.action ?? 'no-op'),
          id: String(written?.record?.id ?? ''),
          status: String(written?.record?.status ?? 'candidate'),
          text: value.text,
        };
      },
    });
    return disposer;
  };

  let guardRegistered = false;

  /** 工具守卫：阻止同一调用原样重试。 */
  const registerToolGuard = () => {
    const tools = ctx.get?.('tools');
    if (tools === undefined || tools === null) return null;
    const disposer = tools.guard((exec) => injector.guardCall(exec));
    guardRegistered = true;
    return disposer;
  };

  const registerRecallTool = () => {
    const tools = ctx.get?.('tools');
    if (tools === undefined || tools === null) return null;
    return tools.register({
      name: TOOL_RECALL_NAME,
      description: TOOL_RECALL_DESCRIPTION,
      parameters: TOOL_RECALL_PARAMETERS,
      output: {
        schema: TOOL_RECALL_OUTPUT_SCHEMA,
        render(args, value) {
          const items = Array.isArray(value?.items) ? value.items : [];
          if (items.length === 0) {
            return [{ type: 'text', text: '灵犀里没有与「' + String(args?.query ?? '') + '」相关的记忆（不要编造）。' }];
          }
          const lines = items.map((item, index) =>
            (index + 1) + '. [' + item.kind + '/' + item.sharing + '] ' + item.text,
          );
          return [{ type: 'text', text: '灵犀记忆（' + items.length + ' 条）：\n' + lines.join('\n') }];
        },
      },
      async execute(args, exec) {
        const query = String(args?.query ?? '').trim();
        if (query === '') throw new Error('query 不能为空');
        const limit = Number.isFinite(Number(args?.limit))
          ? Math.max(1, Math.min(12, Math.round(Number(args.limit))))
          : 5;
        const sessionId = String(exec?.agent?.id ?? '');
        const workspaceId = sessionId === '' ? '' : await listWorkspace(sessionId);
        const result = await memory.recall(query, { limit, context: { sessionId, workspaceId }, charBudget: 1600 });
        const items = (result.items ?? []).slice(0, limit).map((entry) => ({
          kind: String(entry.record.kind),
          text: String(entry.record.text),
          confidence: Math.round(Number(entry.record.confidence ?? 0) * 100) / 100,
          sharing: String(entry.record.sharing ?? 'private'),
        }));
        return { abstain: items.length === 0 || result.abstain === true, count: items.length, items };
      },
    });
  };

  ctx.effect(() => {
    const disposer = registerMemoryTool();
    const recallDisposer = registerRecallTool();
    const guardDisposer = registerToolGuard();
    if (disposer !== null) injector.setCapabilities({ tool: TOOL_NAME, recall: TOOL_RECALL_NAME });
    return () => {
      if (disposer !== null) disposer();
      if (recallDisposer !== null) recallDisposer();
      if (guardDisposer !== null) guardDisposer();
    };
  }, 'dsh-lingxi-panel: memory tool');

  /* ---------------- 记忆 → 上下文 ---------------- */

  const agentDisposers = new Map();
  const sectionAttempted = new Set();

  const attachAgent = (agentCtx, sessionId, { scopedListeners = false } = {}) => {
    // 同一个会话只挂一次：agent/created 与存量 agent 补挂可能同时到达。
    if (agentDisposers.has(sessionId) || sectionAttempted.has(sessionId)) return;
    sectionAttempted.add(sessionId);
    let promptService = null;
    try {
      // 必须用 agent 作用域上的直接属性：ctx.get() 拿到的是全局实例，注册会落在全局层。
      promptService = agentCtx?.systemPrompt ?? null;
    } catch {
      promptService = null;
    }
    if (promptService === null || promptService === undefined) {
      // 拿不到作用域服务就不挂：宁可不注入，也不跨会话串记忆。
      sectionSkipped += 1;
      return;
    }
    // agent.ctx 不一定带 effect（不同来源的 agent 对象形态不同），退回插件作用域注册。
    const effectOf = typeof agentCtx?.effect === 'function' ? agentCtx.effect.bind(agentCtx) : ctx.effect.bind(ctx);
    let disposer = null;
    try {
      disposer = effectOf(
        () => promptService.section({
          name: injector.sectionName,
          order: 96,
          text: () => injector.textFor(sessionId),
        }),
        'dsh-lingxi-panel: memory section',
      );
    } catch (error) {
      // 已有同名 section（例如同一 agent 被两条路径挂载）：宁可不挂，也不跨会话串记忆。
      sectionSkipped += 1;
      lastError = errorMessage(error);
      return;
    }
    const disposers = [disposer];
    // 插件重载后，已运行的 agent 不会把作用域事件派发给新实例；
    // 因此在这些 agent 自己的作用域里补挂监听，保证注入/提示/守卫继续生效。
    if (scopedListeners && typeof agentCtx?.on === 'function') {
      disposers.push(agentCtx.on('tools/result', (exec, result) => handleToolResult(exec, result)));
      disposers.push(agentCtx.on('tools/post-execute', (exec, result, next) => handlePostExecute(exec, result, next)));
      disposers.push(agentCtx.on('agent/inbox/claimed', (payload) => handleInboxClaimed(payload)));
    }
    agentDisposers.set(sessionId, disposers);
    injector.refresh(sessionId, '').catch(() => {});
  };

  ctx.on('agent/created', function (payload) {
    const sessionId = String(payload?.agent?.id ?? '');
    if (sessionId === '') return;
    try {
      attachAgent(this, sessionId);
    } catch (error) {
      lastError = errorMessage(error);
    }
  });

  ctx.on('agent/disposed', function (payload) {
    const sessionId = String(payload?.agent?.id ?? '');
    const disposers = agentDisposers.get(sessionId);
    if (disposers !== undefined) {
      for (const dispose of disposers) {
        try {
          dispose();
        } catch {
          // 作用域已收摊
        }
      }
      agentDisposers.delete(sessionId);
    }
    const outcome = injector.drop(sessionId);
    appendQuality(outcome).catch(() => {});
    toolSequences.delete(sessionId);
  });

  const handleInboxClaimed = (payload) => {
    const sessionId = String(payload?.agent?.id ?? '');
    if (sessionId === '') return;
    const text = userMessageText(payload?.message);
    injector.onUserMessage(sessionId, text).catch(() => {});
    // 用户明确说过的规则：立刻进记忆库当候选（private，只回本会话）。
    try {
      const rules = settings.instructions === true ? extractInstructions(text) : [];
      for (const rule of rules) {
        memory.remember({
          kind: rule.kind,
          text: rule.text,
          scope: { kind: 'machine', id: '' },
          origin: { sessionId, workspaceId: '' },
          confidence: 0.4,
          evidence: 1,
          status: 'candidate',
          topics: ['kind:' + rule.kind, 'source:user-instruction'],
          provenance: [{ source: 'heuristic-instruction', sessionId, excerpt: rule.text.slice(0, 120) }],
        }).then((written) => {
          if (written?.action === 'created') instructionsCaptured += 1;
        }).catch(() => {});
      }
    } catch {
      // 规则提取失败不影响注入
    }
  };

  ctx.on('agent/inbox/claimed', (payload) => handleInboxClaimed(payload));

  /** 按 session 累计本轮的工具调用/失败，供按轮质量记录使用。 */
  const turnStats = new Map();


  ctx.on('agent/turn-stopping', (payload) => {
    const sessionId = String(payload?.agent?.id ?? '');
    if (sessionId === '') return;
    const entry = turnStats.get(sessionId);
    if (entry === undefined) return;
    turnStats.delete(sessionId);
    const snapshot = injector.sessionSnapshot(sessionId);
    appendQuality({
      turn: Number(payload?.turn ?? 0),
      injectedChars: snapshot.injectedChars,
      records: snapshot.records,
      toolCalls: entry.toolCalls,
      toolFailures: entry.toolErrors,
    }, sessionId).catch(() => {});
  });

  const handleToolResult = (exec, result) => {
    injector.onToolResult(exec, result).catch(() => {});
    try {
      const sessionId = String(exec?.agent?.id ?? '');
      if (sessionId !== '') {
        const entry = turnStats.get(sessionId) ?? { toolCalls: 0, toolErrors: 0 };
        entry.toolCalls += 1;
        if (result?.isError === true) entry.toolErrors += 1;
        turnStats.set(sessionId, entry);
      }
    } catch {
      // 计数失败不影响工具结果
    }
      const sessionId = String(exec?.agent?.id ?? '');
      const tool = String(exec?.name ?? '');
      if (sessionId === '' || tool === '') return;
      if (result?.isError === true) {
        toolSequences.delete(sessionId);
        return;
      }
      const current = toolSequences.get(sessionId) ?? [];
      const stepped = pushStep(current, tool);
      if (stepped.candidate === null) {
        toolSequences.set(sessionId, stepped.sequence);
        return;
      }
      toolSequences.set(sessionId, stepped.sequence);
      const candidate = stepped.candidate;
      const entry = procedureCounts.get(candidate.key) ?? {
        count: 0,
        tools: candidate.tools,
        text: candidate.text,
        sessions: new Set(),
        created: false,
      };
      entry.count += 1;
      if (entry.sessions.size < 8) entry.sessions.add(sessionId);
      procedureCounts.set(candidate.key, entry);
      if (shouldCreateProcedure({ sessions: entry.sessions, created: entry.created, minSessions: Number(settings.procedureSessions) || 2 })) {
        entry.created = true;
        memory.remember({
          kind: 'skill',
          text: candidate.text,
          scope: { kind: 'machine', id: '' },
          sharing: 'global',
          status: 'candidate',
          confidence: 0.55,
          evidence: entry.count,
          topics: ['kind:skill', 'scene:procedure', 'tool:' + (candidate.tools[0] ?? 'tool')],
          meta: { pattern: candidate.tools, procedure: true },
          provenance: [{ source: 'tool-sequence', sessionId, excerpt: candidate.key.slice(0, 160) }],
        }).then((written) => {
          if (written?.action === 'created') proceduresCreated += 1;
        }).catch(() => {});
      } else if (entry.created === true) {
        // 同一流程再次出现：加强既有技能，而不是重复新增。
        memory.remember({
          kind: 'skill',
          text: candidate.text,
          scope: { kind: 'machine', id: '' },
          sharing: 'global',
          status: 'candidate',
          evidence: 1,
          topics: ['kind:skill', 'scene:procedure'],
          meta: { pattern: candidate.tools, procedure: true },
          provenance: [{ source: 'tool-sequence', sessionId, excerpt: candidate.key.slice(0, 160) }],
        }).catch(() => {});
      }
  };

  ctx.on('tools/result', (exec, result) => handleToolResult(exec, result));

  const handlePostExecute = async (exec, result, next) => {
    const decision = await next();
    try {
      if (result?.isError !== true) return decision;
      if (decision?.kind !== 'accept') return decision;
      const warning = await injector.warningFor(exec, result);
      if (warning === null) return decision;
      const block = { type: 'text', text: warning.text };
      const base = Array.isArray(decision.content)
        ? decision.content
        : Array.isArray(result.content)
          ? result.content
          : [];
      return { ...decision, content: [...base, block] };
    } catch {
      return decision;
    }
  };

  ctx.on('tools/post-execute', (exec, result, next) => handlePostExecute(exec, result, next));

  ctx.effect(() => {
    try {
      const liveAgents = ctx.get('agents')?.list?.() ?? [];
      for (const agent of liveAgents) {
        const sessionId = String(agent?.id ?? '');
        if (sessionId === '' || agentDisposers.has(sessionId)) continue;
        if (agent?.ctx === undefined) continue;
        try {
          attachAgent(agent.ctx, sessionId, { scopedListeners: true });
        } catch (error) {
          lastError = errorMessage(error);
        }
      }
    } catch (error) {
      lastError = errorMessage(error);
    }
    writeStatus().catch(() => {});
    return () => {
      for (const disposers of agentDisposers.values()) {
        for (const dispose of disposers) {
          try {
            dispose();
          } catch {
            // 已收摊
          }
        }
      }
      agentDisposers.clear();
    };
  }, 'dsh-lingxi-panel: attach live agents');
}

/* ---------------- helpers ---------------- */

function requestRejection(ctx, request) {
  try {
    const connection = ctx.get?.('connection');
    const rejection = connection?.requestRejection?.(request);
    return typeof rejection === 'number' ? rejection : undefined;
  } catch {
    return 403;
  }
}

function sendJson(response, status, body) {
  try {
    const text = JSON.stringify(body);
    response.statusCode = status;
    response.setHeader('content-type', 'application/json; charset=utf-8');
    response.setHeader('cache-control', 'no-store');
    response.end(text);
    return;
  } catch {
    // 序列化失败时退回最小响应，避免连接悬挂
  }
  response.statusCode = status;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.setHeader('cache-control', 'no-store');
  response.end(JSON.stringify({ ok: false, error: 'serialize-failed' }));
}

function allowGet(request, response) {
  if ((request.method ?? 'GET') === 'GET') return true;
  sendJson(response, 405, { ok: false, error: 'method-not-allowed' });
  return false;
}

function allowPost(request, response) {
  if ((request.method ?? '') === 'POST') return true;
  sendJson(response, 405, { ok: false, error: 'method-not-allowed' });
  return false;
}

function allowGetPost(request, response) {
  const method = request.method ?? 'GET';
  if (method === 'GET' || method === 'POST') return true;
  sendJson(response, 405, { ok: false, error: 'method-not-allowed' });
  return false;
}

async function readBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 64 * 1024) throw new Error('body-too-large');
    chunks.push(chunk);
  }
  if (size === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function publicRecord(record) {
  return {
    id: record.id,
    kind: record.kind,
    text: record.text,
    scope: record.scope,
    topics: record.topics,
    confidence: round(record.confidence),
    evidence: record.evidence,
    contradictions: record.contradictions,
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    lastUsedAt: record.lastUsedAt,
    hitCount: record.hitCount,
    missCount: record.missCount,
    usedCount: record.usedCount,
    validTo: record.validTo ?? null,
    sharing: record.sharing ?? 'private',
    tool: record.meta?.tool ?? '',
    code: record.meta?.code ?? '',
    resurrected: record.meta?.resurrected === true,
    resurrections: Number(record.meta?.resurrections ?? 0),
    backfilled: record.meta?.backfilled === true,
    provenance: record.provenance.slice(-2).map((entry) => ({ source: entry.source, at: entry.at, excerpt: entry.excerpt })),
  };
}

function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function round(value) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value * 1000) / 1000 : 0;
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
