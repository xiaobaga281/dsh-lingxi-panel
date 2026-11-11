window.__ModuleLoader__.load({
  id: 'dsh-lingxi-panel',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const PLUGIN_ID = 'dsh-lingxi-panel';
    const NS = 'dsh-lingxi-panel';
    const OVERVIEW = 'lingxi/overview';
    const MEMORY = 'lingxi/memory';

    /* ================================================================ 文案 */

    const dicts = {
      zh: {
        tab: '灵犀',
        eyebrow: 'LINGXI · 自进化',
        title: '灵犀',
        subtitle: '闸门、环境事实、技能提名与记忆库：同一场景的错，不犯第二次。',
        refresh: '刷新',
        refreshing: '正在刷新',
        memoryLabel: '记忆库',

        tabOverview: '总览',
        tabMemory: '记忆库',
        tabEvolution: '学习效果',

        before: '之前',
        after: '之后',
        verdict: '结论',


        sessions: '会话',

        noInsights: '还没有洞察。',

        searchPlaceholder: '例如：pwsh 路径报错、面板样式、安装',
        noResults: '没有命中。记忆库会随着纠正与复盘继续长。',
        searchAction: '搜索',
        browseTitle: '浏览记忆',
        browseHint: '选状态后打开列表：每行都能看详情、删除（删除可撤销）。',
        browseStatusAll: '全部状态',
        pendingQueue: '待确认记忆',
        noPending: '没有待确认的记忆。',
        accept: '确认',
        retire: '忽略',
        consolidate: '巩固一次',
        active: '生效',
        statusBreakdown: '状态构成',
        injectPaused: '注入已暂停',
        injectRunning: '注入运行中',
        snapshotBanner: '数据来自页面启动快照（实时通道不可用）；刷新页面可更新。',
        refreshFailed: '刷新失败：{error}',
        staleSince: '当前显示的是 {time} 的缓存',
        lastLoaded: '上次读取 {time}',
        evolveTitle: '参数进化（UCB1）',
        evolveTrials: '评估轮次',
        sectionsFailed: '部分区块读取失败（其余正常显示）',
        qualityTitle: '注入有效性（关联）',
        attrTitle: '学习效果（前后对照）',
        attrHint: '同类失败在教训沉淀前后的次数；窗口太短只作参考',
        attrBefore: '捕获前',
        attrAfter: '捕获后',
        gateTitle: '闸门与纠错',
        adviceAdopted: '建议被采纳',
        adviceIgnored: '建议未采纳',
        detailOpen: '看详情',
        detailLoading: '加载中…',
        detailEmpty: '没有条目',
        detailClose: '关闭',
        detailAll: '全部记忆',
        detailActive: '生效中的记忆',
        detailRetired: '已退役（优胜劣汰）',
        lifeOpen: '生命周期',
        lifeTitle: '记忆生命周期',
        lifeCreated: '创建 {t}',
        lifeUpdated: '更新 {t}',
        lifeStatus: '状态 {s}',
        lifeUsage: '命中 {h} · 证伪 {m}',
        lifeEvidence: '证据 {n}',
        lifeRetireReason: '退役原因：{s}',
        lifeDemoteReason: '降级原因：{s}',
        lifeResurrections: '复活 {n} 次',
        lifeProvenance: '来源 {s}（{t}）',
        lifeNone: '暂无来源记录',
        lessonObserving: '观察中（<1 天）',
        promoteTitle: '跨会话复现（建议提升）',
        promoteHint: '同一失败在多个会话里复现，而教训还是私有：提升后别的会话也能直接用。',
        promoteNone: '没有需要提升的教训。',
        trendTitle: '复发趋势（Top 场景 · 14 天）',
        trendHint: '柱高=当天该场景失败次数；看尾部是否递减。',
        coverageTitle: '记忆覆盖（反复场景 → 是否已有教训）',
        coverageHint: '高频复发但还没有教训的场景，是最该补的缺口。',
        coverageRatio: '覆盖 {c}/{t}',
        coverageSeed: '生成教训',
        coverageNone: '暂无高频未覆盖场景。',
        loopTitle: '学习闭环',
        loopHint: '写 → 用 → 排 → 汰：每一步都有实测数字，不是口号',
        searchQualityTitle: '检索质量（实时）',
        searchQuality: '主动检索 {n} 次 · 弃答 {m} 次（{r}）',
        regressTitle: '疗效为负的教训',
        detailHits: '被采纳过的记忆',
        detailFailures: '重复失败场景',
        restoreOpen: '从备份恢复',
        alertTitle: '需要注意',
        alertDemote: '今天降级了 {n} 条记忆，可能是误杀，建议看详情',
        alertQuarantine: '今天隔离了 {n} 条，归档是否太激进？',
        alertCoverage: '高频复发的 {n} 个场景都没有教训（覆盖率为 0）',
        selfcheckOk: '自检通过',
        selfcheckBad: '自检失败',
        selfcheckNever: '尚未自检',
        auditOk: '体检通过',
        auditBad: '体检异常',
        repairTitle: '修复（先预览）',
        repairPreview: '将修复 {t} 条错位正文、退役 {d} 条重复',
        repairHint: '确认后执行；修复与退役都会写入原因，可追溯。',
        repairDone: '已修复 {t} 条、退役 {d} 条',
        sysTitle: '系统状态（回归 / 闸门 / 实时）',
        detailTitle: '记忆明细（教训 / 事实 / 技能）',
        opsTitle: '运维工具（清洗 / 卫生 / 体检 / 存储）',
        opsHint: '低频操作收在这里；日常只需要上面的检索、浏览与待确认。',
        browseRefresh: '刷新',
        browseEmpty: '该状态下没有记忆。',
        browseCount: '{n} 条',
        semanticCalls: '调用 {n} 次 · 成功 {ok} · 失败 {fail} · 超时 {to}',
        semanticIdle: '尚未调用（开启后需有真实对话触发）',
        localOnlyNote: '全部数据仅存本机，不联网、不上传；关掉插件即完全停止。',
        settingsTitle: '设定',
        settingsInject: '注入',
        settingsMaintain: '维护',
        injectEnabled: '启用记忆注入',
        injectEnabledHint: '关闭后完全不进入上下文',
        injectBudgetLabel: '字符预算',
        injectBudgetHint: '每个回合注入记忆的上限，按场景自动微调',
        semanticShort: '启用语义召回',
        storageCurrentLabel: '当前位置',
        flowInject: '注入',
        flowHit: '命中',
        flowMiss: '证伪',
        flowGuard: '拦截重试',
        flowPrune: '淘汰合并',
        attrScene: '场景',
        attrBeforeShort: '前',
        attrAfterShort: '后',
        attrDeltaShort: '变化',
        attrHitShort: '命中率',
        attrEmpty: '暂无对照数据',
        coverageSessions: '会话',
        coverageCount: '次数',
        selfcheckRun: '运行',
        times: '次',
        alertAudit: '体检发现异常，建议在设定里运行修复',
        alertSemantic: '语义召回连续 {n} 次未返回内容（{reason}），已自动回退关键词检索',
        semanticCheckFail: '语义模型未返回内容：{reason}',
        semanticCheckHint: '已自动回退关键词检索，记忆功能不受影响。可在设定里换一个模型。',
        semanticCheckOk: '语义模型可用：{text}',
        semanticFallbackNote: '回退中：仍使用关键词检索',
        reviewTitle: '记忆复盘',
        reviewHint: '让模型逐条审查：分类是否错误、是否已经没有价值。只给建议，不自动改。',
        reviewRun: '开始复盘',
        reviewModelLabel: '复盘模型',
        autoReviewLabel: '自动复盘',
        autoReviewHint: '每 {d} 天自动审查一次（后台跑，只花少量额度）。关闭后只能手动点。',
        autoReviewLast: '上次复盘：{when}',
        autoReviewNever: '尚未自动复盘过',
        reviewModelHint: '复盘用哪个模型审查记忆。与语义召回相互独立，可以各选各的。',
        reviewNoModel: '没有可用模型：请在下方选择一个，或在模型配置里设置默认模型',
        reviewUsedModel: '本次使用：{model}',
        reviewRunning: '复盘进行中…',
        reviewProgress: '已审查 {done} / {total} 条',
        reviewStarting: '正在准备…',
        reviewElapsed: '用时 {s} 秒',
        reviewNone: '模型认为当前记忆都合理',
        reviewScanned: '已审查 {n} 条',
        reviewApply: '应用选中项',
        reviewApplied: '已应用：改类型 {r} 条，清除 {d} 条',
        reviewVerdictKeep: '保留',
        reviewVerdictReclass: '改类型',
        reviewVerdictDrop: '清除',
        reviewNoneSelected: '未选择任何项',
        semanticDiagTitle: '语义诊断',
        semanticTestNow: '测试当前模型',
        semanticTestOk: '模型可用',
        semanticTestTitle: '语义召回不可用',
        semanticDiagRun: '诊断全部模型',
        semanticDiagHint: '逐个模型发一次真实请求（会消耗少量额度），用来确认哪些可用',
        semanticDiagNone: '没有任何 provider 返回内容',
        colContent: '内容',
        colKind: '类型',
        colStatus: '状态',
        colSharing: '共享',
        colHits: '命中',
        colSource: '来源',
        memoryListTitle: '记忆清单',
        memoryListHint: '显示 {n} 条 · 全库 {total} 条',
        purgeDryRun: '预览',
        colLesson: '教训',
        colState: '状态',
        colSessions: '会话',
        lessonEfficacyTitle: '教训疗效',
        lessonEfficacyHint: '每条教训沉淀前后，对应场景的失败次数变化',
        lessonEfficacyEmpty: '暂无对照数据（需要教训沉淀后产生新的失败样本）',
        corrPrecisionShort: '反馈精准度',
        attrPerCorrection: '条/次',
        statTotal: '记忆总量',
        statActive: '生效中',
        statCorr: '纠错率',
        statFeedback: '反馈率',
        statFeedbackHint: '含质疑式反馈（不生效/没显示/难看等），比显式纠错更接近真实',
        corrSplit: '显式纠错 {a}% · 含质疑 {b}%',
        statCoverage: '场景覆盖',
        alertNone: '当前没有异常',
        alertCount: '共 {n} 项异常',
        globalAlertTitle: '灵犀记忆：语义召回不可用',
        globalAlertHint: '已自动回退关键词检索，记忆功能不受影响。可在灵犀面板「设定」里换一个模型。',
        statAlerts: '异常告警',
        semanticFollow: '跟随默认模型',
        semanticChoice: '语义模型',
        semanticToggle: '语义召回（使用当前配置的模型）',
        semanticHint: '开启后：查询扩展与写时关键词会调用你在模型配置里选中的模型；失败自动回退词法路径。',
        storageTitle: '存储位置',
        storageHint: '迁移会复制全部数据并校验，写入指针后重启生效；当前数据不动。',
        storageCurrent: '当前：{dir}',
        storageNew: '新目录',
        storageMigrate: '迁移并切换',
        storageDone: '已迁移到 {dir}，重启应用后生效',
        auditTitle: '体检记忆库',
        auditPass: '体检通过',
        auditFail: '体检发现问题',
        selfcheckTitle: '运行回归自检',
        selfcheckRunning: '正在运行…',
        selfcheckPass: '全部通过（{n} 组 · {ms}ms）',
        selfcheckFail: '有失败项（{n} 组失败）',
        exportTitle: '导出记忆库',
        exportDone: '已导出 {n} 条记录',
        importTitle: '导入记忆库',
        importPreview: '将新增 {i} 条、跳过 {s} 条',
        importHint: '确认后写入本机记忆库；重复条目会被跳过，不会覆盖现有内容。',
        importConfirm: '确认导入',
        importVersion: '版本不兼容，已拒绝导入',
        importDone: '导入完成：新增 {i} 条，跳过 {s} 条',
        importFailed: '导入失败：{error}',
        purgeTitle: '数据清洗',
        purgeStatus: '状态',
        purgeKind: '类型',
        purgeAll: '全部',
        purgeRun: '执行清洗',
        purgePreviewDone: '预计删除 {n} 条（剩余 {left} 条）',
        purgeDone: '已删除 {n} 条，剩余 {left} 条（已备份）',
        purgeRemoveOne: '删除',
        purgeDeleteDone: '已删除 {n} 条',
        undoTitle: '可撤销',
        undoHint: '刚刚的删除已备份，点恢复即可回到删除前。',
        undoExact: '撤销最近一次删除（只恢复被删的那几条）',
        undoExactDone: '已恢复 {n} 条',
        undoExactNone: '没有可撤销的删除。',
        restoreTitle: '备份快照',
        restoreHint: '恢复前会先把当前库再备份一次，所以恢复本身也可回滚。',
        restoreRun: '恢复',
        restoreDone: '已从备份恢复 {n} 条记录',
        resetTitle: '重置记忆库',
        resetHint: '重置前会自动在 backup/ 留一份快照；清空后不可撤回，但可从备份恢复。',
        resetAll: '清空全部',
        resetCandidates: '只退役候选',
        resetCancel: '取消',
        resetDone: '已重置：移除 {n} 条，剩余 {left} 条',
        hygieneTitle: '记忆体检',
        hygieneProven: '已验证',
        hygieneScan: '扫描',
        hygieneQuarantined: '隔离',
        hygieneEvicted: '淘汰',
        hygieneMerged: '合并',
        hygieneRun: '立即体检',
        hygieneDone: '体检完成：隔离 {q}、淘汰 {e}、合并 {m}、升级 {u}',
        gateGuardDenied: '拦截重试',
        liveLessons: '教训（记忆库）',
        liveFacts: '约束与事实（记忆库）',
        liveSkills: '技能候选（记忆库）',
        injectFullText: '查看全文',
        injectSamplesTitle: '最近注入',
        injectSamplesHint: '每个会话最近一次真正进入模型的记忆块',
        effSeeded: '已沉淀',
        shareWorkspace: '共享到工作区',
        shareGlobal: '共享到全局',
        forget: '遗忘',
        deleteOne: '删除',
        evidence: '证据 {n}',
        used: '用过 {n} 次',
        contradictionCount: '冲突 {n}',
        scopeMachine: '全局',
        scopeWorkspace: '工作区',
        scopeProject: '项目',
        scopeSession: '会话',

        kindConstraint: '约束',
        kindPreference: '偏好',
        kindFact: '事实',
        kindLesson: '教训',
        kindSkill: '技能',
        kindEpisode: '情景',
        kindStrategy: '策略',
        statusCandidate: '待确认',
        statusActive: '生效',
        statusDormant: '休眠',
        statusRetired: '已退休',


        loadFailed: '读取失败',
        retry: '重试',
        justNow: '刚刚',
        minutesAgo: '{n} 分钟前',
        hoursAgo: '{n} 小时前',
        daysAgo: '{n} 天前',
        consolidateDone: '合并 {merged} · 休眠 {dormanted} · 退休 {retired}',
        confirmed: '已确认',
        ignored: '已忽略',
        noiseNear: '已折叠 {n} 条近似',
        noiseHidden: '已隐藏 {n} 条低信号',
        noiseShowCta: '显示低信号',
        noiseHideCta: '收起低信号',
        liveTitle: '实时（宿主会话日志）',
        liveSessions: '会话',
        liveTurns: '轮次',
        liveToolErrors: '工具失败',
      },
      en: {
        tab: 'Lingxi',
        eyebrow: 'LINGXI · SELF-EVOLUTION',
        title: 'Lingxi',
        subtitle: 'Retry gate, environment facts, skill nominations and memory: never repeat the same mistake twice.',
        refresh: 'Refresh',
        refreshing: 'Refreshing',
        memoryLabel: 'Memory',

        tabOverview: 'Overview',
        tabMemory: 'Library',
        tabEvolution: 'Effect',

        before: 'before',
        after: 'after',
        verdict: 'Verdict',


        sessions: 'Sessions',

        noInsights: 'No insights yet.',

        searchPlaceholder: 'e.g. pwsh path error, panel style, install',
        noResults: 'No match. The library grows with corrections and retrospectives.',
        searchAction: 'Search',
        browseTitle: 'Browse memories',
        browseHint: 'Pick a status, then open the list: every row has details and delete (undoable).',
        browseStatusAll: 'All statuses',
        pendingQueue: 'Pending memories',
        noPending: 'No pending memories.',
        accept: 'Accept',
        retire: 'Ignore',
        consolidate: 'Consolidate',
        active: 'Active',
        statusBreakdown: 'By status',
        injectPaused: 'Injection paused',
        injectRunning: 'Injection running',
        snapshotBanner: 'Showing the page-start snapshot (live channel unavailable); refresh the page to update.',
        refreshFailed: 'Refresh failed: {error}',
        staleSince: 'Showing cached data from {time}',
        lastLoaded: 'Read at {time}',
        evolveTitle: 'Parameter evolution (UCB1)',
        evolveTrials: 'Rounds',
        sectionsFailed: 'Some sections failed (the rest still render)',
        qualityTitle: 'Injection effectiveness (association)',
        attrTitle: 'Learning effect (before/after)',
        attrHint: 'Same-scene failures before and after the lesson was captured; short windows are indicative only',
        attrBefore: 'Before',
        attrAfter: 'After',
        gateTitle: 'Gate and corrections',
        detailOpen: 'Details',
        detailLoading: 'Loading…',
        detailEmpty: 'Nothing here',
        detailClose: 'Close',
        detailRetired: 'Retired (survival of the fittest)',
        lifeOpen: 'Lifecycle',
        lifeTitle: 'Memory lifecycle',
        lifeCreated: 'created {t}',
        lifeUpdated: 'updated {t}',
        lifeStatus: 'status {s}',
        lifeUsage: 'hits {h} · misses {m}',
        lifeEvidence: 'evidence {n}',
        lifeResurrections: 'revived {n}×',
        lifeProvenance: 'source {s} ({t})',
        lifeNone: 'no provenance yet',
        lessonObserving: 'observing (<1 day)',
        promoteTitle: 'Recurring across sessions',
        promoteHint: 'Same failure shows up in several sessions while the lesson is still private; promote it so other sessions benefit.',
        promoteNone: 'Nothing to promote right now.',
        trendTitle: 'Recurrence trend (top scenes · 14 days)',
        trendHint: 'Bar height = failures that day; watch whether the tail declines.',
        coverageTitle: 'Memory coverage (recurring scenes → lesson exists?)',
        coverageHint: 'High-frequency scenes without a lesson are the biggest gaps.',
        coverageRatio: 'covered {c}/{t}',
        coverageSeed: 'Create lesson',
        coverageNone: 'No high-frequency gaps right now.',
        loopTitle: 'Learning loop',
        loopHint: 'Write → use → rank → prune; every step has a measured number',
        searchQualityTitle: 'Search quality (live)',
        searchQuality: '{n} searches · {m} abstained ({r})',
        regressTitle: 'Lessons with negative effect',
        detailHits: 'Memories that helped',
        detailFailures: 'Repeated failure scenes',
        restoreOpen: 'Restore from backup',
        alertTitle: 'Needs attention',
        alertDemote: '{n} memories demoted today — possible over-pruning',
        alertQuarantine: '{n} records quarantined today — archive may be too aggressive',
        alertCoverage: 'none of the {n} recurring scenes has a lesson (coverage 0)',
        selfcheckOk: 'self-check passed',
        selfcheckBad: 'self-check failed',
        selfcheckNever: 'not run yet',
        auditOk: 'audit passed',
        auditBad: 'audit issues',
        repairTitle: 'Repair (preview first)',
        repairPreview: 'will fix {t} misaligned texts, retire {d} duplicates',
        repairHint: 'Applies after confirmation; every change records a reason.',
        repairDone: 'fixed {t}, retired {d}',
        sysTitle: 'System status (regression / gate / live)',
        detailTitle: 'Memory details (lessons / facts / skills)',
        opsTitle: 'Ops tools (cleanup / hygiene / audit / storage)',
        opsHint: 'Low-frequency tools live here; daily work needs only search, browse and pending above.',
        browseRefresh: 'Refresh',
        browseEmpty: 'No records in this status.',
        browseCount: '{n} records',
        semanticCalls: '{n} calls · {ok} ok · {fail} failed · {to} timeout',
        semanticIdle: 'not called yet (needs a real turn after enabling)',
        localOnlyNote: 'All data stays on this machine: no network, no upload. Disabling the plugin stops it entirely.',
        settingsTitle: 'Settings',
        settingsInject: 'Injection',
        settingsMaintain: 'Maintenance',
        injectEnabled: 'Enable memory injection',
        injectEnabledHint: 'When off, nothing enters the context',
        injectBudgetLabel: 'Character budget',
        injectBudgetHint: 'Upper bound per turn, tuned per scene',
        semanticShort: 'Enable semantic recall',
        storageCurrentLabel: 'Current location',
        flowInject: 'Injected',
        flowHit: 'Hit',
        flowMiss: 'Falsified',
        flowGuard: 'Blocked',
        flowPrune: 'Pruned',
        attrScene: 'Scene',
        attrBeforeShort: 'Before',
        attrAfterShort: 'After',
        attrDeltaShort: 'Change',
        attrHitShort: 'Hit rate',
        attrEmpty: 'No comparison data yet',
        coverageSessions: 'Sessions',
        coverageCount: 'Count',
        selfcheckRun: 'Run',
        times: 'runs',
        alertAudit: 'Audit found issues; run repair in Settings',
        alertSemantic: 'Semantic recall returned nothing {n} times in a row ({reason}); fell back to keyword search',
        semanticCheckFail: 'Semantic model returned nothing: {reason}',
        semanticCheckHint: 'Keyword search is still active, memory works. Try another model in Settings.',
        semanticCheckOk: 'Semantic model OK: {text}',
        semanticFallbackNote: 'Falling back: keyword search in use',
        reviewTitle: 'Memory review',
        reviewHint: 'The model audits each memory: misclassified, or no longer worth keeping. Suggestions only.',
        reviewRun: 'Run review',
        reviewModelLabel: 'Review model',
        autoReviewLabel: 'Automatic review',
        autoReviewHint: 'Audits every {d} days in the background (small cost). Off = manual only.',
        autoReviewLast: 'Last review: {when}',
        autoReviewNever: 'Never reviewed automatically yet',
        reviewModelHint: 'Which model audits the memories. Independent from semantic recall.',
        reviewNoModel: 'No model available: pick one below, or set a default in model settings',
        reviewUsedModel: 'used: {model}',
        reviewRunning: 'Reviewing…',
        reviewProgress: 'reviewed {done} / {total}',
        reviewStarting: 'preparing…',
        reviewElapsed: '{s}s elapsed',
        reviewNone: 'The model found nothing to change',
        reviewScanned: '{n} reviewed',
        reviewApply: 'Apply selected',
        reviewApplied: 'Applied: {r} reclassified, {d} cleared',
        reviewVerdictKeep: 'Keep',
        reviewVerdictReclass: 'Reclassify',
        reviewVerdictDrop: 'Clear',
        reviewNoneSelected: 'Nothing selected',
        semanticDiagTitle: 'Semantic diagnosis',
        semanticTestNow: 'Test current model',
        semanticTestOk: 'Model is working',
        semanticTestTitle: 'Semantic recall unavailable',
        semanticDiagRun: 'Test all models',
        semanticDiagHint: 'Sends one real request per model (small cost) to see which work',
        semanticDiagNone: 'No provider returned content',
        colContent: 'Content',
        colKind: 'Kind',
        colStatus: 'Status',
        colSharing: 'Sharing',
        colHits: 'Hits',
        colSource: 'Source',
        memoryListTitle: 'Memories',
        memoryListHint: 'showing {n} · {total} total',
        purgeDryRun: 'Preview',
        colLesson: 'Lesson',
        colState: 'State',
        colSessions: 'Sessions',
        lessonEfficacyTitle: 'Lesson efficacy',
        lessonEfficacyHint: 'Failures in the matching scene before vs after the lesson existed',
        lessonEfficacyEmpty: 'No comparison data yet',
        corrPrecisionShort: 'Feedback precision',
        attrPerCorrection: 'per correction',
        statTotal: 'Total',
        statActive: 'Active',
        statCorr: 'Correction rate',
        statFeedback: 'Feedback rate',
        statFeedbackHint: 'Includes pushback (not working / not showing / ugly), closer to reality than explicit corrections',
        corrSplit: 'explicit {a}% · with pushback {b}%',
        statCoverage: 'Coverage',
        alertNone: 'No alerts',
        alertCount: '{n} alert(s)',
        globalAlertTitle: 'Lingxi memory: semantic recall unavailable',
        globalAlertHint: 'Fell back to keyword search; memory still works. Pick another model in the Lingxi Settings.',
        statAlerts: 'Alerts',
        semanticFollow: 'Follow default model',
        semanticChoice: 'Semantic model',
        semanticToggle: 'Semantic recall (uses your configured model)',
        semanticHint: 'When on: query expansion and write-time keywords call the model selected in your model config; failures fall back to lexical.',
        storageTitle: 'Storage location',
        storageHint: 'Migration copies all data with verification; takes effect after app restart. Current data is untouched.',
        storageCurrent: 'current: {dir}',
        storageNew: 'new dir',
        storageMigrate: 'Migrate & switch',
        storageDone: 'Migrated to {dir}; restart to apply',
        auditTitle: 'Audit store',
        auditPass: 'audit passed',
        auditFail: 'audit found problems',
        selfcheckTitle: 'Run self-check',
        selfcheckRunning: 'running…',
        selfcheckPass: 'all passed ({n} suites · {ms}ms)',
        selfcheckFail: '{n} suites failed',
        exportTitle: 'Export memory',
        exportDone: 'Exported {n} records',
        importTitle: 'Import memory',
        importPreview: 'will add {i}, skip {s}',
        importHint: 'Writes into the local store; duplicates are skipped, existing records are never overwritten.',
        importConfirm: 'Import',
        importVersion: 'Incompatible schema version; import refused',
        importDone: 'Imported {i}, skipped {s}',
        importFailed: 'Import failed: {error}',
        purgeTitle: 'Data cleanup',
        purgeStatus: 'Status',
        purgeKind: 'Kind',
        purgeAll: 'All',
        purgeRun: 'Run cleanup',
        purgePreviewDone: 'Would delete {n} (remaining {left})',
        purgeDone: 'Deleted {n}, remaining {left} (backed up)',
        purgeRemoveOne: 'Delete',
        purgeDeleteDone: 'Deleted {n}',
        undoTitle: 'Undo available',
        undoHint: 'The deletion was backed up; restore to go back.',
        undoExact: 'Undo last deletion (only those records)',
        undoExactDone: 'Restored {n} records',
        undoExactNone: 'Nothing to undo.',
        restoreTitle: 'Backup snapshots',
        restoreHint: 'The current store is backed up before restoring, so a restore is itself reversible.',
        restoreRun: 'Restore',
        restoreDone: 'Restored {n} records from backup',
        resetTitle: 'Reset memory store',
        resetHint: 'A snapshot is written to backup/ before resetting. Clearing cannot be undone, but the snapshot can be restored.',
        resetAll: 'Clear everything',
        resetCandidates: 'Retire candidates only',
        resetCancel: 'Cancel',
        resetDone: 'Reset done: removed {n}, remaining {left}',
        hygieneTitle: 'Memory hygiene',
        hygieneScan: 'Scanned',
        hygieneQuarantined: 'Quarantined',
        hygieneEvicted: 'Evicted',
        hygieneMerged: 'Merged',
        hygieneRun: 'Run check',
        hygieneDone: 'Done: quarantined {q}, evicted {e}, merged {m}, upgraded {u}',
        gateGuardDenied: 'Retry blocked',
        liveLessons: 'Lessons (memory)',
        liveFacts: 'Constraints and facts (memory)',
        liveSkills: 'Skill candidates (memory)',
        injectFullText: 'Show full text',
        injectSamplesTitle: 'Latest injections',
        injectSamplesHint: 'The memory block that most recently entered the model, per session',
        effSeeded: 'Captured',
        shareWorkspace: 'Share to workspace',
        shareGlobal: 'Share globally',
        forget: 'Forget',
        deleteOne: 'Delete',
        evidence: '{n} evidence',
        used: 'used {n}×',
        contradictionCount: '{n} conflicts',
        scopeMachine: 'Global',
        scopeWorkspace: 'Workspace',
        scopeProject: 'Project',
        scopeSession: 'Session',

        kindConstraint: 'Constraint',
        kindPreference: 'Preference',
        kindFact: 'Fact',
        kindLesson: 'Lesson',
        kindSkill: 'Skill',
        kindEpisode: 'Episode',
        kindStrategy: 'Strategy',
        statusCandidate: 'Pending',
        statusActive: 'Active',
        statusDormant: 'Dormant',
        statusRetired: 'Retired',


        loadFailed: 'Could not load',
        retry: 'Retry',
        justNow: 'just now',
        minutesAgo: '{n} min ago',
        hoursAgo: '{n} h ago',
        daysAgo: '{n} d ago',
        consolidateDone: 'Merged {merged} · dormant {dormanted} · retired {retired}',
        confirmed: 'Accepted',
        ignored: 'Ignored',
        noiseNear: '{n} near-duplicates folded',
        noiseHidden: '{n} low-signal hidden',
        noiseShowCta: 'Show low signal',
        noiseHideCta: 'Hide low signal',
        liveTitle: 'Live (host session logs)',
        liveSessions: 'Sessions',
        liveTurns: 'Turns',
        liveToolErrors: 'Tool errors',
        hygieneProven: 'proven',
        detailAll: 'All memories',
        detailActive: 'Active memories',
        lifeRetireReason: 'Retired because: {s}',
        lifeDemoteReason: 'Demoted because: {s}',
        adviceAdopted: 'advice adopted',
        adviceIgnored: 'advice ignored',
      },
    };

    /* ================================================================ 样式 */

    const css = `
    .lg-metric-clickable { cursor: pointer; }
    .lg-metric-clickable:hover .lg-metric-value { color: var(--dsw-alias-brand-primary); }

    /* 表单控件：圆角、内嵌标签、自绘箭头、柔和焦点环 */
    .lg-select-open { border-color: var(--dsw-alias-brand-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-brand-primary) 20%, transparent); }
    .lg-select-label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: left; }
    .lg-select-chevron {
      width: 6px; height: 6px; margin-left: 8px; flex: none;
      border-right: 1.5px solid var(--dsw-alias-label-tertiary);
      border-bottom: 1.5px solid var(--dsw-alias-label-tertiary);
      transform: rotate(45deg) translateY(-2px);
      transition: transform .15s ease;
    }
    .lg-select-open .lg-select-chevron { transform: rotate(-135deg) translateY(-2px); }
    .lg-select-backdrop { position: fixed; inset: 0; z-index: 45; background: transparent; }
    .lg-select-pop {
      position: absolute; left: 0; right: 0; top: calc(100% + 6px); z-index: 46;
      background: var(--dsw-alias-bg-layer-2);
      border: 1px solid var(--dsw-alias-border-l1);
      border-radius: 12px; padding: 6px;
      box-shadow: var(--dsw-alias-shadow-lv1);
      max-height: 260px; overflow-y: auto;
    }
    .lg-select-option {
      display: block; width: 100%; box-sizing: border-box;
      padding: 7px 10px; margin: 0; border: 0; border-radius: 8px;
      background: transparent; color: var(--dsw-alias-label-primary);
      font: inherit; font-size: 13px; text-align: left; cursor: pointer;
    }
    .lg-select-option:hover { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 10%, transparent); }
    .lg-select-option.is-selected { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 16%, transparent); color: var(--dsw-alias-brand-primary); font-weight: 600; }

    .lg-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
    .lg-field .lg-input, .lg-field .lg-select {
      display: flex; align-items: center; justify-content: space-between;
      width: 100%; height: 34px; box-sizing: border-box;
      padding: 0 12px; border-radius: 10px;
      background: var(--dsw-alias-bg-layer-1);
      border: 1px solid var(--dsw-alias-border-l1);
      color: var(--dsw-alias-label-primary);
      font-size: 13px; line-height: 32px; outline: none;
      transition: border-color .15s ease, box-shadow .15s ease, background .15s ease;
    }
    .lg-input:hover, .lg-select:hover { background: var(--dsw-alias-bg-layer-2); }
    .lg-input:focus-visible, .lg-select:focus-visible {
      border-color: var(--dsw-alias-brand-primary);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-brand-primary) 20%, transparent);
      background: var(--dsw-alias-bg-layer-2);
    }
    .lg-input::placeholder { color: var(--dsw-alias-label-tertiary); }
    .lg-select { appearance: none; -webkit-appearance: none; padding-right: 30px; cursor: pointer; }
    /* 容器只负责定位浮层；箭头由 .lg-select-chevron 画，避免出现两个箭头 */
    .lg-select-wrap { position: relative; }

    /* 抽屉/工具栏里的表单控件：这些容器没有 .lg-field 父级，
       需要自带完整外观，否则会退回浏览器默认的方角灰底。 */
    .lx-field-ctl .lg-select,
    .lx-field-ctl .lg-input,
    .lx-toolbar .lg-select,
    .lx-toolbar .lg-input {
      display: flex; align-items: center; justify-content: space-between;
      width: 100%; height: 34px; box-sizing: border-box;
      padding: 0 12px; border-radius: 10px;
      background: var(--dsw-alias-bg-layer-1);
      border: 1px solid var(--dsw-alias-border-l1);
      color: var(--dsw-alias-label-primary);
      font-size: 13px; line-height: 32px; outline: none;
      transition: border-color .15s ease, box-shadow .15s ease, background .15s ease;
    }
    .lx-field-ctl .lg-select { padding-right: 30px; cursor: pointer; appearance: none; -webkit-appearance: none; }
    .lx-field-ctl .lg-select:hover,
    .lx-field-ctl .lg-input:hover,
    .lx-toolbar .lg-select:hover,
    .lx-toolbar .lg-input:hover { background: var(--dsw-alias-bg-layer-2); }
    .lx-field-ctl .lg-select:focus-visible,
    .lx-field-ctl .lg-input:focus-visible,
    .lx-toolbar .lg-select:focus-visible,
    .lx-toolbar .lg-input:focus-visible {
      border-color: var(--dsw-alias-brand-primary);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-brand-primary) 20%, transparent);
      background: var(--dsw-alias-bg-layer-2);
    }
    /* 让下拉在抽屉里撑满宽度，而不是被内容撑成小方块 */
    .lx-field-ctl .lg-select-wrap { position: relative; flex: 1 1 auto; min-width: 0; width: 100%; }
    .lx-toolbar .lg-select-wrap { position: relative; flex: 1 1 140px; min-width: 0; }
    .lx-field-ctl .lg-select-label,
    .lx-toolbar .lg-select-label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: left; }

    .lg-input[type="number"]::-webkit-outer-spin-button,
    .lg-input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
    .lg-input[type="number"] { -moz-appearance: textfield; appearance: textfield; }


    .lg-drawer-mask {
      position: fixed; inset: 0; z-index: 60;
      background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 55%, transparent);
      backdrop-filter: blur(6px);
      display: flex; justify-content: flex-end;
    }
    .lg-drawer {
      width: min(520px, 92vw); height: 100%; overflow-y: auto;
      background: var(--dsw-alias-bg-layer-2);
      border-left: 1px solid var(--dsw-alias-border-l1);
      box-shadow: var(--dsw-alias-shadow-lv1);
      padding: 18px 18px 28px; display: flex; flex-direction: column; gap: 12px;
    }
    .lg-drawer-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
    /* 抽屉是 fixed 全屏浮层，右上角与宿主的窗口控制按钮（最小化/最大化/关闭）重叠：
       头部整行下移让出标题栏，关闭按钮右侧再留 92px，避免误点系统按钮。 */
    .lg-drawer { padding-top: 52px; }
    .lg-drawer-head { padding-right: 92px; }
    .lg-drawer-close { flex: 0 0 auto; }
.lg-root {
  height: 100%; width: 100%; overflow-y: auto; overflow-x: hidden;
  background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", "Microsoft YaHei", system-ui, "Segoe UI", sans-serif;
  font-size: 13px; line-height: 1.5; -webkit-font-smoothing: antialiased;
}
.lg-shell { width: 100%; max-width: 1000px; margin: 0 auto; padding: 26px 22px 72px; box-sizing: border-box; }
.lg-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; margin-bottom: 20px; }
.lg-eyebrow { font-size: 10px; font-weight: 650; letter-spacing: .16em; text-transform: uppercase; color: var(--dsw-alias-label-tertiary); }
.lg-title { margin: 6px 0 0; font-size: 28px; line-height: 1.15; font-weight: 650; letter-spacing: -.03em; }
.lg-subtitle { margin: 6px 0 0; font-size: 13px; color: var(--dsw-alias-label-secondary); max-width: 56ch; }
.lg-actions { display: flex; align-items: center; gap: 8px; padding-top: 14px; flex: none; flex-wrap: wrap; justify-content: flex-end; }

.lg-pill {
  display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 11px;
  border-radius: 999px; background: var(--dsw-alias-bg-layer-2); border: 1px solid var(--dsw-alias-border-l1);
  color: var(--dsw-alias-label-secondary); font-size: 12px; white-space: nowrap;
}
    .lg-pill-dot { padding: 0; width: 26px; height: 26px; justify-content: center; }
.lg-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--dsw-alias-state-idle-primary); flex: none; }
.lg-dot-ok { background: var(--dsw-alias-state-success-primary); }
.lg-dot-warn { background: var(--dsw-alias-state-warn-primary); }

.lg-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  height: 30px; padding: 0 13px; border-radius: 10px; cursor: pointer;
  background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-border-l1);
  color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px; font-weight: 500;
  transition: background-color .16s ease, border-color .16s ease, transform .12s ease;
  white-space: nowrap; flex: 0 0 auto;
}
.lg-btn:hover { background: var(--dsw-alias-interactive-bg-hover); border-color: var(--dsw-alias-border-l2); }
.lg-btn:active { transform: scale(.98); }
.lg-btn:focus-visible { outline: var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color); outline-offset: 2px; }
.lg-btn[disabled] { opacity: .6; cursor: default; }
.lg-btn-primary { background: var(--dsw-alias-brand-primary); border-color: transparent; color: var(--dsw-alias-label-primary-inverted); }
.lg-btn-ghost { background: transparent; border-color: transparent; color: var(--dsw-alias-label-secondary); }
.lg-btn-ghost:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
.lg-iconbtn {
  display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; padding: 0;
  border-radius: 10px; background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-border-l1);
  color: var(--dsw-alias-label-secondary); cursor: pointer;
  transition: background-color .16s ease, color .16s ease;
}
.lg-iconbtn:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
.lg-iconbtn:focus-visible { outline: var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color); outline-offset: 2px; }
.lg-iconbtn[disabled] { opacity: .6; cursor: default; }
.lg-iconbtn svg { width: 15px; height: 15px; display: block; }
.lg-spin { display: inline-flex; align-items: center; justify-content: center; width: 15px; height: 15px; line-height: 0; }
.lg-spin svg { animation: lg-rotate .9s linear infinite; transform-origin: 50% 50%; transform-box: view-box; }
@keyframes lg-rotate { to { transform: rotate(360deg); } }

.lg-segmented {
  display: inline-flex; align-items: center; gap: 2px; padding: 3px; margin-bottom: 18px;
  border-radius: 12px; background: var(--dsw-alias-bg-layer-2); border: 1px solid var(--dsw-alias-border-l1);
}
.lg-seg {
  appearance: none; border: 0; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 14px; border-radius: 9px; background: transparent; color: var(--dsw-alias-label-secondary);
  font: inherit; font-size: 13px; font-weight: 500;
  transition: background-color .2s cubic-bezier(.32,.72,0,1), color .2s ease, box-shadow .2s ease;
}
.lg-seg:hover { color: var(--dsw-alias-label-primary); }
.lg-seg[data-active="true"] { background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); box-shadow: var(--dsw-shadow-lv1); font-weight: 600; }
.lg-seg:focus-visible { outline: var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color); outline-offset: 1px; }
.lg-seg-count { min-width: 17px; height: 17px; padding: 0 5px; box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; background: var(--dsw-alias-brand-primary); color: var(--dsw-alias-label-primary-inverted); font-size: 10px; font-weight: 650; }

.lg-stack > * + * { margin-top: 14px; }

/* ===== 新布局：状态条 / 数据表 / 分区标题 / 流程条 / 抽屉 / 图表 ===== */
.lx-statbar { display: flex; align-items: stretch; background: var(--dsw-alias-bg-layer-2); border: 1px solid var(--dsw-alias-border-l1); border-radius: 14px; overflow: hidden; margin-bottom: 14px; }
.lx-stat { flex: 1 1 0; min-width: 0; padding: 11px 14px; display: flex; flex-direction: column; gap: 3px; border: none; border-right: 1px solid var(--dsw-alias-border-l1); background: none; text-align: left; font: inherit; color: inherit; box-sizing: border-box; }
.lx-stat:last-child { border-right: none; }
.lx-stat-btn { cursor: pointer; transition: background-color .14s ease; }
.lx-stat-btn:hover { background: var(--dsw-alias-interactive-bg-hover); }
.lx-stat-value { font-size: 19px; font-weight: 650; line-height: 1.15; letter-spacing: -.01em; font-variant-numeric: tabular-nums; color: var(--dsw-alias-label-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lx-stat-value[data-tone="ok"] { color: var(--dsw-alias-brand-primary); }
.lx-stat-value[data-tone="mute"] { color: var(--dsw-alias-label-tertiary); }
.lx-stat-value[data-tone="warn"] { color: var(--dsw-alias-state-warn-primary); }
.lx-stat-label { font-size: 11px; line-height: 1.3; color: var(--dsw-alias-label-tertiary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.lx-table-wrap { width: 100%; overflow-x: auto; }
.lx-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.lx-table th { text-align: left; font-weight: 600; font-size: 11px; color: var(--dsw-alias-label-tertiary); padding: 8px 12px; border-bottom: 1px solid var(--dsw-alias-border-l1); white-space: nowrap; }
.lx-table td { padding: 10px 12px; vertical-align: top; line-height: 1.5; border-bottom: 1px solid var(--dsw-alias-border-l1); color: var(--dsw-alias-label-secondary); }
.lx-table tr:last-child td { border-bottom: none; }
.lx-table tbody tr { transition: background-color .14s ease; }
.lx-table tbody tr:hover { background: var(--dsw-alias-interactive-bg-hover); }
.lx-cell-main { color: var(--dsw-alias-label-primary); }
.lx-cell-num { font-variant-numeric: tabular-nums; white-space: nowrap; }
.lx-cell-nowrap { white-space: nowrap; }
.lx-table-empty { padding: 22px 12px; text-align: center; font-size: 12.5px; color: var(--dsw-alias-label-tertiary); }
.lx-actions { display: flex; gap: 6px; justify-content: flex-end; flex-wrap: nowrap; opacity: .32; transition: opacity .14s ease; }
.lx-table tbody tr:hover .lx-actions, .lx-actions:focus-within { opacity: 1; }

.lx-section { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; margin: 4px 0 2px; }
.lx-section-title { font-size: 13px; font-weight: 650; color: var(--dsw-alias-label-primary); }
.lx-section-hint { font-size: 11.5px; color: var(--dsw-alias-label-tertiary); margin-top: 2px; }
.lx-section-actions { display: flex; gap: 8px; flex-wrap: wrap; }

.lx-flow { display: flex; align-items: center; flex-wrap: wrap; }
.lx-flow-step { display: flex; align-items: center; gap: 9px; padding: 7px 11px; border: none; background: none; border-radius: 10px; font: inherit; color: inherit; transition: background-color .14s ease; box-sizing: border-box; }
.lx-flow-num { font-size: 16px; font-weight: 650; font-variant-numeric: tabular-nums; }
.lx-flow-label { font-size: 11.5px; color: var(--dsw-alias-label-tertiary); }
.lx-flow-arrow { color: var(--dsw-alias-label-tertiary); opacity: .5; padding: 0 1px; }

.lx-bars { display: flex; align-items: flex-end; gap: 3px; height: 132px; }
.lx-bar { flex: 1 1 0; min-width: 2px; border-radius: 3px; background: var(--dsw-alias-brand-primary); opacity: .85; transition: opacity .12s ease; }
.lx-bar.is-zero { background: var(--dsw-alias-label-tertiary); opacity: .16; }
.lx-bar:hover { opacity: 1; }
.lx-axis { display: flex; justify-content: space-between; font-size: 11px; color: var(--dsw-alias-label-tertiary); margin-top: 6px; }
.lx-trend-row { margin-bottom: 16px; }
.lx-trend-row:last-child { margin-bottom: 0; }
.lx-trend-head { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; margin-bottom: 6px; }
.lx-trend-name { font-size: 12px; color: var(--dsw-alias-label-primary); }
.lx-trend-total { font-size: 11.5px; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; }
.lx-toolbar { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.lx-toolbar .lg-input { flex: 1 1 220px; min-width: 0; }

.lx-scrim { position: fixed; inset: 0; z-index: 70; background: rgba(0,0,0,.26); backdrop-filter: blur(3px); }
.lx-drawer { position: fixed; top: 0; right: 0; height: 100%; width: min(430px, 92vw); z-index: 71; display: flex; flex-direction: column; box-sizing: border-box; background: var(--dsw-alias-bg-layer-2); border-left: 1px solid var(--dsw-alias-border-l1); box-shadow: -8px 0 30px rgba(0,0,0,.14); padding-top: 40px; }
.lx-drawer-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 6px 100px 14px 18px; border-bottom: 1px solid var(--dsw-alias-border-l1); }
.lx-drawer-title { font-size: 14px; font-weight: 650; }
.lx-drawer-body { padding: 16px 18px 40px; overflow-y: auto; }
.lx-group { font-size: 11px; font-weight: 650; letter-spacing: .06em; text-transform: uppercase; color: var(--dsw-alias-label-tertiary); margin: 14px 0 8px; }
.lx-group:first-child { margin-top: 0; }
.lx-field { margin-bottom: 14px; }
.lx-field-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.lx-field-label { font-size: 12.5px; font-weight: 600; }
.lx-field-hint { font-size: 11.5px; color: var(--dsw-alias-label-tertiary); margin-top: 3px; }
.lx-field-ctl { margin-top: 8px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.lx-divider { height: 1px; background: var(--dsw-alias-border-l1); margin: 6px 0 2px; }
.lx-switch { position: relative; width: 40px; height: 24px; flex: 0 0 auto; display: inline-block; }
.lx-switch input { position: absolute; inset: 0; opacity: 0; margin: 0; cursor: pointer; }
.lx-switch-track { position: absolute; inset: 0; border-radius: 999px; pointer-events: none; background: var(--dsw-alias-border-l2); transition: background-color .16s ease; }
.lx-switch-knob { position: absolute; top: 2px; left: 2px; width: 20px; height: 20px; border-radius: 50%; background: #fff; pointer-events: none; box-shadow: 0 1px 3px rgba(0,0,0,.28); transition: transform .16s ease; }
.lx-switch input:checked ~ .lx-switch-track { background: var(--dsw-alias-brand-primary); }
.lx-switch input:checked ~ .lx-switch-knob { transform: translateX(16px); }

/* 复盘进度条 */
.lx-progress-track { height: 6px; border-radius: 999px; background: var(--dsw-alias-bg-layer-1); overflow: hidden; margin-top: 6px; }
.lx-progress-fill { height: 100%; border-radius: 999px; background: var(--dsw-alias-brand-primary); transition: width .3s ease; }

/* 浮层提示：fixed 定位在窗口右上，不随面板内容滚动，也不会被容器裁剪。 */
.lx-toast-host { position: fixed; top: 96px; right: 24px; z-index: 90; display: flex; flex-direction: column; gap: 8px; max-width: min(400px, calc(100vw - 48px)); pointer-events: none; }
.lx-toast { pointer-events: auto; display: flex; align-items: flex-start; gap: 10px; padding: 11px 13px; border-radius: 12px; background: var(--dsw-alias-bg-overlay, var(--dsw-alias-bg-layer-2)); border: 1px solid var(--dsw-alias-border-l1); box-shadow: 0 6px 24px rgba(0,0,0,.18), 0 1px 3px rgba(0,0,0,.10); color: var(--dsw-alias-label-primary); font-size: 12.5px; line-height: 1.5; animation: lx-toast-in .18s cubic-bezier(.32,.72,0,1); }
@keyframes lx-toast-in { from { opacity: 0; transform: translateY(-6px) scale(.98); } to { opacity: 1; transform: none; } }
.lx-toast.is-error { border-color: var(--dsw-alias-state-error-primary); }
.lx-toast.is-ok { border-color: var(--dsw-alias-state-success-primary); }
.lx-toast-icon { flex: 0 0 auto; width: 16px; height: 16px; margin-top: 1px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; }
.lx-toast.is-error .lx-toast-icon { color: var(--dsw-alias-state-error-primary); }
.lx-toast.is-ok .lx-toast-icon { color: var(--dsw-alias-state-success-primary); }
.lx-toast-body { flex: 1 1 auto; min-width: 0; }
.lx-toast-title { font-weight: 600; }
.lx-toast-text { color: var(--dsw-alias-label-secondary); margin-top: 2px; word-break: break-word; }
.lx-toast-close { flex: 0 0 auto; appearance: none; border: none; background: none; color: var(--dsw-alias-label-tertiary); font-size: 15px; line-height: 1; cursor: pointer; padding: 2px 4px; border-radius: 6px; }
.lx-toast-close:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
.lg-grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 14px; }
.lg-tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(132px, 1fr)); gap: 12px; }
.lg-tile { background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-border-l1); border-radius: 16px; padding: 14px 16px; box-sizing: border-box; transition: background-color .16s ease, border-color .16s ease; }
.lg-tile:hover { background: var(--dsw-alias-interactive-bg-hover); border-color: var(--dsw-alias-border-l2); }
.lg-tile-label { font-size: 11px; color: var(--dsw-alias-label-tertiary); }
.lg-tile-value { margin-top: 3px; font-size: 22px; font-weight: 650; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }
.lg-tile-note { margin-top: 2px; font-size: 11px; color: var(--dsw-alias-label-secondary); }

.lg-card { background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-border-l1); border-radius: 18px; padding: 18px 20px; box-shadow: var(--dsw-shadow-lv1); box-sizing: border-box; min-width: 0; }
.lg-card-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.lg-card-title { font-size: 13px; font-weight: 650; letter-spacing: -.01em; }
.lg-card-hint { font-size: 11px; color: var(--dsw-alias-label-tertiary); }

.lg-metric-cell { min-width: 0; }
.lg-metric-label { font-size: 11px; color: var(--dsw-alias-label-tertiary); margin-bottom: 3px; }
.lg-metric { display: flex; align-items: baseline; gap: 8px; }
.lg-metric-value { font-size: 30px; line-height: 1.05; font-weight: 650; letter-spacing: -.03em; font-variant-numeric: tabular-nums; }
.lg-metric-unit { font-size: 12px; color: var(--dsw-alias-label-secondary); }
.lg-metric-caption { margin-top: 6px; font-size: 12px; color: var(--dsw-alias-label-secondary); }

.lg-delta { display: inline-flex; align-items: center; gap: 4px; padding: 1px 7px; border-radius: 999px; font-size: 11px; font-weight: 650; font-variant-numeric: tabular-nums; }
.lg-delta-good { color: var(--dsw-alias-state-success-primary); background: var(--dsw-alias-bg-layer-1); border: 1px solid color-mix(in srgb, var(--dsw-alias-state-success-primary) 45%, transparent); }
.lg-delta-bad { color: var(--dsw-alias-state-error-primary); background: var(--dsw-alias-bg-layer-1); border: 1px solid color-mix(in srgb, var(--dsw-alias-state-error-primary) 45%, transparent); }
.lg-delta-flat { color: var(--dsw-alias-label-secondary); background: var(--dsw-alias-bg-layer-2); }

.lg-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; padding: 11px 10px; margin: 0 -10px; border-radius: 12px; border-top: 1px solid var(--dsw-alias-border-l1); }
.lg-row:first-child { border-top: 0; }
.lg-row:hover { background: var(--dsw-alias-interactive-bg-hover); }
.lg-row-main { min-width: 0; flex: 1 1 auto; }
.lg-row-title { font-size: 13px; word-break: break-word; }
.lg-row-meta { margin-top: 5px; display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; font-size: 11px; color: var(--dsw-alias-label-tertiary); }
.lg-row-side { flex: none; display: flex; align-items: center; gap: 6px; }

.lg-chip { display: inline-flex; align-items: center; gap: 4px; height: 20px; padding: 0 8px; border-radius: 999px; font-size: 11px; line-height: 1; white-space: nowrap; background: var(--dsw-alias-bg-layer-2); border: 1px solid var(--dsw-alias-border-l1); color: var(--dsw-alias-label-secondary); box-sizing: border-box; }
/* 彩色块统一用中性底 + 彩色字/描边：比"彩色底+彩色字"在明暗主题下都更清楚 */
.lg-chip-accent { color: var(--dsw-alias-brand-primary); border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 45%, transparent); background: var(--dsw-alias-bg-layer-1); }
.lg-chip-ok { color: var(--dsw-alias-state-success-primary); border-color: color-mix(in srgb, var(--dsw-alias-state-success-primary) 45%, transparent); background: var(--dsw-alias-bg-layer-1); }
.lg-chip-warn { color: var(--dsw-alias-state-warn-primary); border-color: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 45%, transparent); background: var(--dsw-alias-bg-layer-1); }
.lg-chip-mute { color: var(--dsw-alias-label-tertiary); background: transparent; border-style: dashed; }

.lg-bar { height: 4px; border-radius: 999px; background: var(--dsw-alias-bg-layer-2); overflow: hidden; }
.lg-bar-fill { height: 100%; border-radius: 999px; background: var(--dsw-alias-brand-primary); }
.lg-bar-wrap { margin-top: 8px; display: flex; align-items: center; gap: 8px; }
.lg-bar-wrap .lg-bar { flex: 1 1 auto; }
.lg-bar-value { font-size: 11px; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; flex: none; }



.lg-search { display: flex; gap: 8px; align-items: center; }
.lg-search .lg-input { width: auto; flex: 1 1 auto; min-width: 0; height: 36px; padding: 0 13px; border-radius: 11px; }
.lg-search .lg-btn { flex: none; white-space: nowrap; }
.lg-input { flex: 1 1 auto; height: 36px; padding: 0 13px; box-sizing: border-box; border-radius: 11px; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); font: inherit; font-size: 13px; outline: none; transition: border-color .16s ease, background-color .16s ease; }
.lg-input::placeholder { color: var(--dsw-alias-label-tertiary); }
.lg-input:focus { border-color: var(--dsw-alias-brand-primary); background: var(--dsw-alias-bg-layer-1); }


.lg-noise { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 10px 0 4px; font-size: 11px; color: var(--dsw-alias-label-tertiary); }
.lg-noise .lg-btn { height: 24px; padding: 0 10px; font-size: 11px; }
.lg-toast { position: sticky; top: 8px; z-index: 5; display: flex; align-items: center; gap: 8px; margin: 0 0 14px; padding: 9px 14px; border-radius: 12px; background: var(--dsw-alias-toast-bg, var(--dsw-alias-bg-overlay)); border: 1px solid var(--dsw-alias-border-l1); color: var(--dsw-alias-toast-label, var(--dsw-alias-label-primary)); font-size: 12px; box-shadow: var(--dsw-shadow-lv2); }
.lg-toast-error { border-color: var(--dsw-alias-state-error-primary); color: var(--dsw-alias-state-error-primary); }
.lg-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 40px 16px; text-align: center; }
.lg-empty-icon { width: 40px; height: 40px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-tertiary); }
.lg-empty-icon svg { width: 18px; height: 18px; }
.lg-empty-title { font-size: 13px; font-weight: 600; color: var(--dsw-alias-label-secondary); }
.lg-empty-hint { font-size: 12px; color: var(--dsw-alias-label-tertiary); max-width: 46ch; }

.lg-status { font-size: 11px; color: var(--dsw-alias-label-tertiary); margin-top: 10px; }
.lg-status-error { color: var(--dsw-alias-state-error-primary); }
.lg-foot { margin-top: 22px; padding-top: 12px; border-top: 1px solid var(--dsw-alias-border-l1); display: flex; flex-wrap: wrap; align-items: center; gap: 6px 14px; font-size: 11px; color: var(--dsw-alias-label-tertiary); }
.lg-foot code { font-family: ui-monospace, "SF Mono", Consolas, monospace; font-size: 10px; color: var(--dsw-alias-label-secondary); word-break: break-all; }
.lg-skeleton { height: 12px; border-radius: 6px; margin-bottom: 9px; background: linear-gradient(90deg, var(--dsw-alias-bg-skeleton) 0%, var(--dsw-alias-bg-layer-2) 45%, var(--dsw-alias-bg-skeleton) 90%); background-size: 220% 100%; animation: lg-shimmer 1.35s ease-in-out infinite; }
.lg-skeleton-lg { height: 28px; width: 42%; }
.lg-skeleton-sm { width: 62%; }
@keyframes lg-shimmer { from { background-position: 140% 0; } to { background-position: -60% 0; } }

@media (max-width: 640px) {
  .lg-shell { padding: 20px 14px 56px; }
  .lg-title { font-size: 24px; }
  .lg-header { flex-direction: column; gap: 10px; }
  .lg-actions { padding-top: 0; justify-content: flex-start; }
  .lg-segmented { width: 100%; overflow-x: auto; }
  .lg-seg { flex: 1 0 auto; justify-content: center; }
}
@media (prefers-reduced-motion: reduce) {
  .lg-skeleton, .lg-spin svg { animation: none; }
  .lg-btn, .lg-seg, .lg-row, .lg-tile, .lg-iconbtn { transition: none; }
}

/* JS 里用作结构容器、无视觉职责的类也需要定义，否则样式表不自洽 */
.lx-section-text { display: flex; flex-direction: column; min-width: 0; }
.lg-rows { display: grid; gap: 10px; }
`;

    /* ================================================================ 访问 */

    /**
     * 请求基址自动探测：桌面端新构建只把 /api 前缀代理给宿主，
     * 浏览器构建则直接暴露 /lingxi/*。先试哪一个，成功后就记住。
     */
    let routeBase = '';

    function apiUrl(routePath, base) {
      const relative = String(base) + String(routePath).replace(/^\/+/, '');
      if (typeof document === 'undefined') return '/' + relative;
      const url = new URL(relative, document.baseURI);
      return url.pathname + url.search;
    }

    async function requestJson(routePath, init) {
      const bases = routeBase === '' ? ['', 'api/'] : [routeBase];
      let lastError = null;
      for (const base of bases) {
        try {
          const response = await fetch(apiUrl(routePath, base), init);
          const text = await response.text().catch(() => '');
          let body = null;
          try {
            body = JSON.parse(text);
          } catch {
            body = null;
          }
          if (!response.ok) throw new Error(body?.error ?? 'HTTP ' + response.status);
          if (body === null) throw new Error('non-json-response');
          if (body.ok !== true) throw new Error(body?.error ?? 'request-failed');
          routeBase = base;
          return body;
        } catch (error) {
          lastError = error;
        }
      }
      throw lastError ?? new Error('request-failed');
    }

    function getJson(routePath) {
      return requestJson(routePath, { cache: 'no-store', headers: { accept: 'application/json' } });
    }

    function postJson(routePath, payload) {
      return requestJson(routePath, {
        method: 'POST',
        cache: 'no-store',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(payload ?? {}),
      });
    }
    /* ================================================================ 格式化 */

    /** 把语义失败原因翻译成人话：用户不该看到 empty-reply 这种机器码。 */
    function semanticReason(code, t) {
      const value = String(code ?? '');
      if (value === '') return '—';
      if (value.startsWith('provider-not-registered:')) {
        return t('semReasonProvider').replace('{name}', value.slice('provider-not-registered:'.length));
      }
      if (value === 'empty-reply') return t('semReasonEmpty');
      if (value === 'timeout') return t('semReasonTimeout');
      if (value === 'no-model') return t('semReasonNoModel');
      if (value === 'no-llm-service') return t('semReasonNoService');
      return value;
    }

    function int(value) {
      const n = Number.isFinite(value) ? Math.round(value) : 0;
      return n.toLocaleString();
    }
    function pct(value) {
      const n = Number.isFinite(value) ? value : 0;
      return `${Math.round(n * 100)}%`;
    }
    function bytes(value) {
      const n = Number.isFinite(value) ? value : 0;
      if (n < 1024) return `${n} B`;
      if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
      return `${(n / 1024 / 1024).toFixed(1)} MB`;
    }
    function relTime(at, t) {
      if (!Number.isFinite(at) || at <= 0) return '—';
      const diff = Date.now() - at;
      if (diff < 60 * 1000) return t('justNow');
      if (diff < 3_600_000) return t('minutesAgo').replace('{n}', String(Math.round(diff / 60000)));
      if (diff < 86_400_000) return t('hoursAgo').replace('{n}', String(Math.round(diff / 3_600_000)));
      if (diff < 30 * 86_400_000) return t('daysAgo').replace('{n}', String(Math.round(diff / 86_400_000)));
      try {
        return new Date(at).toLocaleDateString();
      } catch {
        return '—';
      }
    }

    const KIND_LABEL = { constraint: 'kindConstraint', preference: 'kindPreference', fact: 'kindFact', lesson: 'kindLesson', skill: 'kindSkill', episode: 'kindEpisode', strategy: 'kindStrategy' };
    const STATUS_LABEL = { candidate: 'statusCandidate', active: 'statusActive', dormant: 'statusDormant', retired: 'statusRetired' };
    const SCOPE_LABEL = { machine: 'scopeMachine', workspace: 'scopeWorkspace', project: 'scopeProject', session: 'scopeSession' };

    /* ================================================================ 基础组件 */

    /**
     * 图标表：每项自带 viewBox 与绘制方式。
     * 刷新用标准的 24×24 实心圆弧箭头（Material 几何），不再手绘 16×16 描边路径——
     * 手绘那版的箭头位置算错，15px 下会糊成一个小墨点。
     */
    const ICONS = {
    settings: { viewBox: '0 0 24 24', d: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z' },
      refresh: {
        viewBox: '0 0 24 24',
        fill: true,
        d: 'M17.65 6.35A7.958 7.958 0 0 0 12 4a8 8 0 1 0 7.73 10h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4z',
      },
      memory: {
        fill: true,
        d: 'M8 2.2c2.6 0 4.4 1.3 4.4 3.2 0 1.1-.6 1.9-1.5 2.4 1.3.4 2.3 1.4 2.3 2.9 0 2.1-2 3.5-4.9 3.5H3.6V2.2H8Zm-.5 4.9c1.2 0 1.9-.5 1.9-1.4S8.7 3.9 7.5 3.9H5.4v3.2h2.1Zm.3 5.3c1.4 0 2.2-.6 2.2-1.6S9.2 9.2 7.8 9.2H5.4v3.2h2.4Z',
      },
      check: {
        fill: true,
        d: 'M13.4 4.2 6.4 11.2 2.8 7.6l1.1-1.1 2.5 2.5 5.9-5.9 1.1 1.1Z',
      },
      spark: { d: 'M8 1.6l1.3 3.5 3.5 1.3-3.5 1.3L8 11.2 6.7 7.7 3.2 6.4l3.5-1.3L8 1.6Z' },
      gate: { d: 'M2.5 4.5h11M2.5 8h11M2.5 11.5h11M5.5 2.5v11M10.5 2.5v11' },
      fact: { d: 'M4 2.5h8a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1ZM5.6 6h4.8M5.6 8.4h4.8M5.6 10.8h2.8' },
      lesson: { d: 'M8 2.2l5 2.6v3.1c0 2.6-2 4.6-5 5.9-3-1.3-5-3.3-5-5.9V4.8l5-2.6Z' },
      folder: { d: 'M2.4 4.6h4l1.2 1.4h4a1 1 0 0 1 1 1v4.6a1 1 0 0 1-1 1H2.4a1 1 0 0 1-1-1V5.6a1 1 0 0 1 1-1Z' },
    };

    function Icon({ name }) {
      const def = ICONS[name] ?? ICONS.spark;
      const filled = def.fill === true;
      const props = {
        viewBox: def.viewBox ?? '0 0 16 16',
        fill: filled ? 'currentColor' : 'none',
        stroke: filled ? undefined : 'currentColor',
        strokeWidth: filled ? undefined : 1.4,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
      };
      return h('svg', props, h('path', { d: def.d }));
    }
    /**
     * 由后端返回的 provider 目录构造下拉选项。
     * 语义召回与记忆复盘共用：两者都需要"跟随默认 + 自选已配置模型"。
     */
    function buildModelPairs(source, t) {
      // 入参有两种形状，都要认：
      //   1) 概览载荷：provider 目录在 source.semanticOptions
      //   2) options 路由的原始响应：目录直接在 source.providers（顶层）
      // 只认第一种会让"传给它的原始响应"解析成空，下拉只剩「跟随默认」。
      const options = Array.isArray(source?.providers)
        ? source
        : (source?.semanticOptions ?? source?.injection?.semanticOptions ?? null);
      const list = [{ value: '', label: t('semanticFollow') }];
      const providers = Array.isArray(options) ? options : (options?.providers ?? []);
      for (const provider of providers) {
        const models = Array.isArray(provider.models) ? provider.models : [];
        if (models.length === 0) {
          list.push({ value: provider.id + '|', label: provider.label });
          continue;
        }
        for (const model of models) {
          const friendly = (provider.labels ?? {})[model];
          const text = typeof friendly === 'string' && friendly !== '' ? friendly + ' · ' + model : model;
          list.push({ value: provider.id + '|' + model, label: text });
        }
      }
      return list;
    }

    /** 自绘下拉：原生 select 的弹出列表无法样式化，这里换成圆角浮层。 */
    /** 极小趋势条：一行内展示某场景最近 14 天的次数。 */
    function MiniBars({ points }) {
      const list = Array.isArray(points) ? points : [];
      if (list.length === 0) return null;
      const width = 150;
      const height = 26;
      const max = Math.max(1, ...list.map((point) => point.count ?? 0));
      const step = width / list.length;
      return h('svg', { viewBox: '0 0 ' + width + ' ' + height, width, height, 'aria-hidden': true, style: { display: 'block' } },
        list.map((point, index) => {
          const value = Number(point.count ?? 0);
          const barHeight = value === 0 ? 1 : Math.max(2, Math.round((value / max) * (height - 4)));
          return h('rect', {
            key: point.day + index,
            x: Math.round(index * step),
            y: height - barHeight,
            width: Math.max(1, Math.round(step) - 1),
            height: barHeight,
            rx: 1,
            fill: 'var(--dsw-alias-brand-primary)',
            opacity: value === 0 ? 0.15 : 0.85,
          }, h('title', null, point.day + ' · ' + value + ' 次'));
        }),
      );
    }

    /** 折叠区：低频内容默认收起，避免页面信息过载。 */
    function Collapsible({ title, hint, children, defaultOpen = false }) {
      const [open, setOpen] = React.useState(defaultOpen);
      return h('div', { className: 'lg-card' },
        h('button', {
          type: 'button',
          style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 10, background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', color: 'inherit', textAlign: 'left' },
          onClick: () => setOpen(!open),
          'aria-expanded': open,
        },
          h('div', null,
            h('div', { className: 'lg-row-title' }, title),
            hint !== undefined ? h('div', { className: 'lg-row-meta' }, hint) : null),
          h('span', { style: { fontSize: 11, color: 'var(--dsw-alias-label-tertiary)' } }, open ? '▾' : '▸')),
        open
          ? h('div', { style: { marginTop: 14, display: 'grid', gap: 28 } }, children)
          : h('div', { className: 'lg-row-meta', style: { marginTop: 6 } }, '展开使用'));
    }

    /** 浏览记忆：状态下拉 + 内联记录列表，行级删除。 */
    function BrowseCard({ t, busy, status, setStatus, items, loading, onDelete, onRefresh }) {
      const rows = (items ?? []).map((record) =>
        h('div', { className: 'lg-row', key: record.id },
          h('div', { className: 'lg-row-main' },
            h('div', { className: 'lg-row-title' }, record.text),
            h('div', { className: 'lg-row-meta' },
              h(Chip, { kind: 'accent', children: t(KIND_LABEL[record.kind] ?? 'kindFact') }),
              h(Chip, { children: record.status ?? '' }),
              h(Chip, { kind: 'mute', children: record.sharing ?? 'private' }))),
          h('div', { className: 'lg-row-side' },
            h('button', { type: 'button', className: 'lg-btn lg-btn-ghost', disabled: busy !== '', onClick: () => onDelete(record.id) }, t('deleteOne')))));
      return h(Card, { title: t('browseTitle'), hint: t('browseHint') },
        h('div', { className: 'lg-search' },
          h('div', { className: 'lg-field', style: { minWidth: 150 } },
            h(Select, {
              value: status,
              options: [
                { value: '', label: t('browseStatusAll') },
                { value: 'active', label: t('statusActive') },
                { value: 'candidate', label: t('statusCandidate') },
                { value: 'retired', label: t('statusRetired') },
              ],
              onChange: (next) => setStatus(next),
              ariaLabel: t('browseTitle'),
            })),
          h('button', { type: 'button', className: 'lg-btn lg-btn-ghost', onClick: onRefresh }, t('browseRefresh'))),
        items === null
          ? h('div', { className: 'lg-status' }, '…')
          : rows.length === 0
            ? h('div', { className: 'lg-status' }, t('browseEmpty'))
            : h('div', null,
              h('div', { className: 'lg-row-meta', style: { marginBottom: 6 } }, t('browseCount').replace('{n}', int(rows.length))),
              rows));
    }

    function Select({ value, options, onChange, ariaLabel }) {
      const [open, setOpen] = React.useState(false);
      const current = (Array.isArray(options) ? options : []).find((option) => option.value === value);
      return h('div', { className: 'lg-select-wrap' },
        h('button', {
          type: 'button',
          className: 'lg-select' + (open ? ' lg-select-open' : ''),
          onClick: () => setOpen(!open),
          'aria-haspopup': 'listbox',
          'aria-expanded': open,
          'aria-label': ariaLabel,
        },
          h('span', { className: 'lg-select-label' }, current?.label ?? '—'),
          h('span', { className: 'lg-select-chevron', 'aria-hidden': true }),
        ),
        open ? h('div', { className: 'lg-select-backdrop', onClick: () => setOpen(false) }) : null,
        open
          ? h('div', { className: 'lg-select-pop', role: 'listbox' },
              (Array.isArray(options) ? options : []).map((option) =>
                h('button', {
                  type: 'button',
                  key: String(option.value),
                  className: 'lg-select-option' + (option.value === value ? ' is-selected' : ''),
                  role: 'option',
                  'aria-selected': option.value === value,
                  onClick: () => { onChange(option.value); setOpen(false); },
                }, option.label),
              ))
          : null,
      );
    }

    function Chip({ kind, children }) {
      return h('span', { className: `lg-chip${kind ? ` lg-chip-${kind}` : ''}` }, children);
    }

    function Drawer({ t, detail, onClose, onReset, busy }) {
      if (detail === null) return null;
      const rows = Array.isArray(detail.rows) ? detail.rows : [];
      const items = Array.isArray(detail.items) ? detail.items : [];

      const head = h('div', { className: 'lg-drawer-head' },
        h('div', null,
          h('div', { className: 'lg-row-title' }, detail.title),
          detail.subtitle !== undefined ? h('div', { className: 'lg-row-meta' }, detail.subtitle) : null),
        h('button', { type: 'button', className: 'lg-btn lg-btn-ghost lg-drawer-close', onClick: onClose }, t('detailClose')),
      );

      let body;
      if (detail.confirm === true) {
        const actions = Array.isArray(detail.confirmActions) ? detail.confirmActions : null;
        body = h('div', { className: 'lg-stack' },
          h('div', { className: 'lg-status' }, detail.confirmHint ?? t('resetHint')),
          h('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
            actions !== null
              ? actions.map((action, index) =>
                  h('button', {
                    type: 'button',
                    key: 'action-' + index,
                    className: index === 0 ? 'lg-btn' : 'lg-btn lg-btn-ghost',
                    disabled: busy !== '',
                    onClick: action.onClick,
                  }, action.label))
              : [
                  h('button', { type: 'button', className: 'lg-btn', disabled: busy !== '', onClick: () => onReset('all') }, t('resetAll')),
                  h('button', { type: 'button', className: 'lg-btn lg-btn-ghost', disabled: busy !== '', onClick: () => onReset('candidates') }, t('resetCandidates')),
                  h('button', { type: 'button', className: 'lg-btn lg-btn-ghost', onClick: detail.onRestore }, t('restoreOpen')),
                ],
            h('button', { type: 'button', className: 'lg-btn lg-btn-ghost', onClick: onClose }, t('resetCancel'))),
        );
      } else if (detail.loading === true) {
        body = h('div', { className: 'lg-status' }, t('detailLoading'));
      } else if (rows.length > 0) {
        body = h('div', null, rows.map((row, index) =>
          h('div', { className: 'lg-row', key: 'row-' + index },
            h('div', { className: 'lg-row-main' },
              h('div', { className: 'lg-row-title' }, row.title),
              row.meta !== undefined ? h('div', { className: 'lg-row-meta' }, h('span', null, row.meta)) : null),
            row.action !== undefined && row.action !== null
              ? h('div', { className: 'lg-row-side' },
                  h('button', { type: 'button', className: 'lg-btn lg-btn-ghost', disabled: busy !== '', onClick: row.action.onClick }, row.action.label))
              : row.side !== undefined
                ? h('div', { className: 'lg-row-side' }, h(Chip, { children: row.side }))
                : null),
        ));
      } else if (items.length === 0) {
        body = h('div', { className: 'lg-status' }, t('detailEmpty'));
      } else {
        body = h('div', null, items.map((record) =>
          h('div', { className: 'lg-row', key: record.id },
            h('div', { className: 'lg-row-main' },
              h('div', { className: 'lg-row-title' }, record.text),
              h('div', { className: 'lg-row-meta' },
                h(Chip, { kind: 'mute', children: record.kind }),
                h(Chip, { kind: 'mute', children: record.status }),
                h(Chip, { kind: 'mute', children: record.sharing ?? 'private' }),
                h('span', null, 'conf ' + String(record.confidence)),
                h('span', null, 'ev ' + int(record.evidence ?? 0)),
                (record.provenance ?? [])[0]?.source !== undefined
                  ? h('span', null, String(record.provenance[0].source))
                  : null)),
            detail.onLife !== undefined
              ? h('div', { className: 'lg-row-side' },
                  h('button', { type: 'button', className: 'lg-btn lg-btn-ghost', disabled: busy !== '', onClick: () => detail.onLife(record) }, t('lifeOpen')))
              : null,
            detail.onDelete !== undefined
              ? h('div', { className: 'lg-row-side' },
                  h('button', { type: 'button', className: 'lg-btn lg-btn-ghost', disabled: busy !== '', onClick: () => detail.onDelete(record.id) }, t('purgeRemoveOne')))
              : null),
        ));
      }

      return h('div', { className: 'lg-drawer-mask', onClick: onClose },
        h('div', { className: 'lg-drawer', onClick: (event) => event.stopPropagation() }, head, body),
      );
    }
    function Tile({ label, value, note }) {
      return h('div', { className: 'lg-tile' },
        h('div', { className: 'lg-tile-label' }, label),
        h('div', { className: 'lg-tile-value' }, value),
        note !== undefined ? h('div', { className: 'lg-tile-note' }, note) : null);
    }

    function Metric({ label, value, unit, caption, onClick }) {
      const clickable = typeof onClick === 'function';
      return h('div', {
        className: 'lg-metric-cell' + (clickable ? ' lg-metric-clickable' : ''),
        onClick: clickable ? onClick : undefined,
        role: clickable ? 'button' : undefined,
        tabIndex: clickable ? 0 : undefined,
      },
        h('div', { className: 'lg-metric-label' }, label),
        h('div', { className: 'lg-metric' },
          h('span', { className: 'lg-metric-value' }, value),
          unit !== undefined ? h('span', { className: 'lg-metric-unit' }, unit) : null),
        caption !== undefined ? h('div', { className: 'lg-metric-caption' }, caption) : null);
    }

    function Delta({ value }) {
      const n = Number.isFinite(value) ? value : 0;
      const kind = n > 0 ? 'good' : n < 0 ? 'bad' : 'flat';
      const sign = n > 0 ? '+' : '';
      return h('span', { className: `lg-delta lg-delta-${kind}` }, `${sign}${Math.round(n * 1000) / 10}%`);
    }

    function Card({ title, hint, children }) {
      return h('section', { className: 'lg-card' },
        title !== undefined
          ? h('div', { className: 'lg-card-head' },
              h('div', { className: 'lg-card-title' }, title),
              hint !== undefined ? h('div', { className: 'lg-card-hint' }, hint) : null)
          : null,
        children);
    }
    /** 状态条：一行紧凑关键指标，替代散落的小卡片。 */
    function StatBar({ items }) {
      const list = (Array.isArray(items) ? items : []).filter((item) => item !== null && item !== undefined);
      if (list.length === 0) return null;
      const cells = list.map((item, index) => {
        const clickable = typeof item.onClick === 'function';
        const props = {
          key: item.label + index,
          className: clickable ? 'lx-stat lx-stat-btn' : 'lx-stat',
          title: item.hint ?? undefined,
        };
        if (clickable) { props.type = 'button'; props.onClick = item.onClick; }
        const inner = [
          h('div', { key: 'v', className: 'lx-stat-value', 'data-tone': item.tone ?? 'plain' }, item.value),
          h('div', { key: 'l', className: 'lx-stat-label' }, item.label),
        ];
        return h(clickable ? 'button' : 'div', props, inner);
      });
      return h('div', { className: 'lx-statbar' }, cells);
    }

    /**
     * 数据表：列定义驱动。列 = { key, label, width, align, render(row) }。
     * 行操作放最后一列，默认低透明度，hover 才清晰（减少视觉噪音）。
     */
    function DataTable({ columns, rows, empty, rowKey }) {
      const cols = Array.isArray(columns) ? columns : [];
      const list = Array.isArray(rows) ? rows : [];
      if (list.length === 0) return h('div', { className: 'lx-table-empty' }, empty ?? '—');
      const headCells = cols.map((col) => {
        const style = { textAlign: col.align ?? 'left' };
        if (col.width !== undefined) style.width = col.width;
        return h('th', { key: col.key, style }, col.label);
      });
      const bodyRows = list.map((row, index) => {
        const cells = cols.map((col) => {
          const style = { textAlign: col.align ?? 'left' };
          const value = typeof col.render === 'function' ? col.render(row) : row[col.key];
          return h('td', { key: col.key, className: col.className ?? undefined, style }, value);
        });
        const key = typeof rowKey === 'function' ? rowKey(row) : index;
        return h('tr', { key }, cells);
      });
      const head = h('thead', null, h('tr', null, headCells));
      const body = h('tbody', null, bodyRows);
      const table = h('table', { className: 'lx-table' }, head, body);
      return h('div', { className: 'lx-table-wrap' }, table);
    }

    /** 分区标题：替代卡片标题，用于页内分组。 */
    function SectionTitle({ title, hint, actions }) {
      const text = h('div', { className: 'lx-section-text' },
        h('div', { key: 't', className: 'lx-section-title' }, title),
        hint !== undefined && hint !== '' ? h('div', { key: 'h', className: 'lx-section-hint' }, hint) : null);
      const side = actions !== undefined && actions !== null ? h('div', { className: 'lx-section-actions' }, actions) : null;
      return h('div', { className: 'lx-section' }, text, side);
    }
    /**
     * 浮层提示：固定在窗口右上角，自动消失，可手动关闭。
     * 与内嵌 .lg-toast 的区别：不随内容滚动、不被容器裁剪。
     */
    function ToastHost({ toasts, onDismiss }) {
      const list = Array.isArray(toasts) ? toasts : [];
      if (list.length === 0) return null;
      return h('div', { className: 'lx-toast-host', role: 'status', 'aria-live': 'polite' },
        list.map((item) => {
          const isError = item.kind === 'error';
          const isOk = item.kind === 'ok';
          const tone = isError ? ' is-error' : (isOk ? ' is-ok' : '');
          return h('div', { key: item.id, className: 'lx-toast' + tone },
            h('span', { className: 'lx-toast-icon', 'aria-hidden': true }, isError ? '!' : (isOk ? '✓' : 'i')),
            h('div', { className: 'lx-toast-body' },
              item.title !== undefined && item.title !== '' ? h('div', { className: 'lx-toast-title' }, item.title) : null,
              h('div', { className: 'lx-toast-text' }, item.text)),
            h('button', { type: 'button', className: 'lx-toast-close', 'aria-label': 'close', onClick: () => onDismiss(item.id) }, '×'));
        }));
    }

    /**
     * 全局告警浮层：挂在 shell.overlay 上，所以**任何界面**（对话、灵犀、御屏）都能看到。
     * 语义召回失败这类问题不该要求用户先打开灵犀页才发现。
     *
     * 数据来源：轻量端点 /lingxi/alerts（不拉整份 overview）。
     * 去重：同一条告警 10 分钟内只弹一次，避免刷屏。
     */
    function GlobalAlerts({ t }) {
      const [items, setItems] = React.useState([]);
      const seenRef = React.useRef(new Map());
      const seqRef = React.useRef(0);

      React.useEffect(() => {
        let alive = true;
        const tick = async () => {
          try {
            const body = await getJson('lingxi/alerts');
            if (!alive || body?.ok !== true) return;
            const alerts = Array.isArray(body.alerts) ? body.alerts : [];
            const now = Date.now();
            const fresh = [];
            for (const alert of alerts) {
              const key = String(alert.code ?? '') + '|' + String(alert.reason ?? '');
              const last = seenRef.current.get(key) ?? 0;
              // 同一条 10 分钟内不重复打扰
              if (now - last < 10 * 60_000) continue;
              seenRef.current.set(key, now);
              seqRef.current += 1;
              fresh.push({ id: seqRef.current, code: key, reason: String(alert.reason ?? ''), model: String(alert.model ?? '') });
            }
            if (fresh.length === 0) return;
            setItems((current) => [...current, ...fresh].slice(-3));
            for (const item of fresh) {
              setTimeout(() => {
                setItems((current) => current.filter((entry) => entry.id !== item.id));
              }, 15000);
            }
          } catch {
            // 轮询失败静默：不要因为网络抖动弹窗
          }
        };
        tick();
        const timer = setInterval(tick, 60_000);
        return () => { alive = false; clearInterval(timer); };
      }, []);

      const dismiss = (id) => setItems((current) => current.filter((entry) => entry.id !== id));
      if (items.length === 0) return null;
      return h('div', { className: 'lx-toast-host', role: 'status', 'aria-live': 'polite' },
        items.map((item) => h('div', { key: item.id, className: 'lx-toast is-error' },
          h('span', { className: 'lx-toast-icon', 'aria-hidden': true }, '!'),
          h('div', { className: 'lx-toast-body' },
            h('div', { className: 'lx-toast-title' }, t('globalAlertTitle')),
            h('div', { className: 'lx-toast-text' }, semanticReason(item.reason, t) + (item.model !== '' ? ' · ' + item.model : '')),
            h('div', { className: 'lx-toast-text' }, t('globalAlertHint'))),
          h('button', { type: 'button', className: 'lx-toast-close', 'aria-label': 'close', onClick: () => dismiss(item.id) }, '×'))));
    }

    /**
     * 设定抽屉：低频配置集中在一处（注入 / 语义 / 存储 / 维护）。
     * 日常页面只留高频操作，配置不再和查看混在一起。
     */
    function SettingsDrawer({ t, open, onClose, busy, data, actions }) {
      const [dir, setDir] = React.useState('');
      if (open !== true) return null;
      const injection = data?.injection ?? null;
      const storage = data?.storage ?? null;
      const stats = data?.semanticStats ?? null;
      const injectionOn = injection?.enabled !== false;
      const semanticOn = injection?.semantic === true;
      const budget = Number(injection?.charBudget ?? 700);
      const selectedModel = (() => {
        const saved = injection?.semanticModel ?? null;
        if (saved === null || saved === undefined) return '';
        return String(saved.provider ?? '') + '|' + String(saved.model ?? '');
      })();
      const modelPairs = buildModelPairs(data, t);

      const sw = (checked, onChange) => h('span', { className: 'lx-switch' },
        h('input', { type: 'checkbox', checked, disabled: busy !== '', onChange: (event) => onChange(event.target.checked) }),
        h('span', { className: 'lx-switch-track' }),
        h('span', { className: 'lx-switch-knob' }));

      return [
        h('div', { key: 'scrim', className: 'lx-scrim', onClick: onClose }),
        h('aside', { key: 'drawer', className: 'lx-drawer' },
          h('div', { className: 'lx-drawer-head' },
            h('div', { className: 'lx-drawer-title' }, t('settingsTitle')),
            h('button', { type: 'button', className: 'lg-btn lg-btn-ghost', onClick: onClose }, t('detailClose'))),
          h('div', { className: 'lx-drawer-body' },

            h('div', { className: 'lx-group', key: 'g1' }, t('settingsInject')),
            h('div', { className: 'lx-field', key: 'f1' },
              h('div', { className: 'lx-field-head' },
                h('div', null,
                  h('div', { className: 'lx-field-label' }, t('injectEnabled')),
                  h('div', { className: 'lx-field-hint' }, t('injectEnabledHint'))),
                sw(injectionOn, (next) => actions.onInjection({ enabled: next })))),
            h('div', { className: 'lx-field', key: 'f2' },
              h('div', { className: 'lx-field-label' }, t('injectBudgetLabel')),
              h('div', { className: 'lx-field-ctl' }, [400, 700, 1200].map((value) => h('button', {
                key: value,
                type: 'button',
                className: value === budget ? 'lg-btn lg-btn-primary' : 'lg-btn',
                disabled: busy !== '',
                onClick: () => actions.onInjection({ charBudget: value }),
              }, String(value)))),
              h('div', { className: 'lx-field-hint' }, t('injectBudgetHint'))),

            h('div', { className: 'lx-divider', key: 'd1' }),
            h('div', { className: 'lx-group', key: 'g2' }, t('semanticToggle')),
            h('div', { className: 'lx-field', key: 'f3' },
              h('div', { className: 'lx-field-head' },
                h('div', null,
                  h('div', { className: 'lx-field-label' }, t('semanticShort')),
                  h('div', { className: 'lx-field-hint' }, t('semanticHint'))),
                sw(semanticOn, actions.onSemantic))),
            h('div', { className: 'lx-field', key: 'f4' },
              h('div', { className: 'lx-field-label' }, t('semanticChoice')),
              h('div', { className: 'lx-field-ctl' },
                h(Select, {
                  value: selectedModel,
                  options: modelPairs,
                  onChange: (next) => {
                    const sep = next.indexOf('|');
                    const provider = next.slice(0, sep);
                    const model = next.slice(sep + 1);
                    actions.onSemanticChoice(provider === '' || model === '' ? null : { provider, model });
                  },
                  ariaLabel: t('semanticChoice'),
                }))),
            stats !== null && stats !== undefined && semanticOn
              ? h('div', { className: 'lx-field', key: 'f5' },
                // 连续失败时用醒目颜色 + 明确说明，避免"已开启但零产出"看起来一切正常
                Number(stats.consecutiveFailures ?? 0) >= 1
                  ? h('div', { className: 'lx-field-hint', style: { color: 'var(--dsw-alias-state-warn-primary)' } },
                    t('semanticFallbackNote') + ' · ' + t('semanticCheckFail').replace('{reason}', semanticReason(stats.lastError, t)))
                  : null,
            // 手动诊断：全量扫描会消耗多次调用，只在用户点击时运行
            stats !== null && stats !== undefined && semanticOn
              ? h('div', { className: 'lx-field', key: 'f5diag' },
                h('div', { className: 'lx-field-label' }, t('semanticDiagTitle')),
                h('div', { className: 'lx-field-hint' }, t('semanticDiagHint')),
                h('div', { className: 'lx-field-ctl' },
                  h('button', { key: 'test', type: 'button', className: 'lg-btn', disabled: busy !== '', onClick: actions.onSemanticTest }, t('semanticTestNow')),
                  h('button', { key: 'diag', type: 'button', className: 'lg-btn', disabled: busy !== '', onClick: actions.onSemanticDiag }, t('semanticDiagRun'))))
              : null,
                h('div', { className: 'lx-field-hint' },
                  stats.calls === 0
                    ? t('semanticIdle')
                    : t('semanticCalls')
                      .replace('{n}', int(stats.calls))
                      .replace('{ok}', int(stats.ok))
                      .replace('{fail}', int(stats.failed))
                      .replace('{to}', int(stats.timeout))))
              : null,

            h('div', { className: 'lx-divider', key: 'd2' }),
            h('div', { className: 'lx-group', key: 'g3' }, t('storageTitle')),
            h('div', { className: 'lx-field', key: 'f0' },
              h('div', { className: 'lx-field-hint' }, t('localOnlyNote'))),
            h('div', { className: 'lx-field', key: 'f6' },
              h('div', { className: 'lx-field-label' }, t('storageCurrentLabel')),
              h('div', { className: 'lx-field-hint', style: { wordBreak: 'break-all' } }, String(storage?.dir ?? '—')),
              h('div', { className: 'lx-field-ctl' },
                h('input', { className: 'lg-input', style: { flex: '1 1 160px' }, placeholder: 'D:\\lingxi-memory', value: dir, onChange: (event) => setDir(event.target.value) }),
                h('button', { type: 'button', className: 'lg-btn', disabled: busy !== '' || dir.trim() === '', onClick: () => actions.onMigrate(dir.trim()) }, t('storageMigrate')))),

            h('div', { className: 'lx-divider', key: 'd3' }),
            h('div', { className: 'lx-group', key: 'g4' }, t('settingsMaintain')),
            h('div', { className: 'lx-field-ctl', key: 'f7' },
              h('button', { type: 'button', className: 'lg-btn', disabled: busy !== '', onClick: actions.onConsolidate }, t('consolidate')),
              h('button', { type: 'button', className: 'lg-btn', disabled: busy !== '', onClick: actions.onAudit }, t('auditTitle')),
              h('button', { type: 'button', className: 'lg-btn', disabled: busy !== '', onClick: actions.onRepair }, t('repairTitle')),
              h('button', { type: 'button', className: 'lg-btn', disabled: busy !== '', onClick: actions.onSelfcheck }, t('selfcheckTitle'))),
            h('div', { className: 'lx-field-ctl', key: 'f8' },
              h('button', { type: 'button', className: 'lg-btn', disabled: busy !== '', onClick: actions.onExport }, t('exportTitle')),
              h('button', { type: 'button', className: 'lg-btn', disabled: busy !== '', onClick: actions.onReset }, t('resetTitle')))
          ))
      ];
    }


    function Empty({ icon, title, hint }) {
      return h('div', { className: 'lg-empty' },
        h('span', { className: 'lg-empty-icon' }, h(Icon, { name: icon })),
        h('div', { className: 'lg-empty-title' }, title),
        hint !== undefined ? h('div', { className: 'lg-empty-hint' }, hint) : null);
    }

    function Segmented({ value, options, onChange }) {
      return h('div', { className: 'lg-segmented' },
        options.map((option) =>
          h('button', {
            key: option.id,
            type: 'button',
            className: 'lg-seg',
            'data-active': value === option.id ? 'true' : 'false',
            onClick: () => onChange(option.id),
          },
            option.label,
            option.count > 0
              ? h('span', { className: 'lg-seg-count' }, String(option.count > 99 ? '99+' : option.count))
              : null)));
    }

    /** 默认隐藏：低信号条目 + 近似簇里被代表掉的重复项。 */
    function noiseVisible(items, showAll, threshold = 0.5) {
      const list = Array.isArray(items) ? items : [];
      if (showAll) return list;
      return list.filter((item) =>
        (item.noise?.score ?? 0) < threshold && !(item.noise?.reasons ?? []).includes('duplicate-in-cluster'));
    }

    function noiseCount(items, threshold = 0.5) {
      const list = Array.isArray(items) ? items : [];
      let hidden = 0;
      let near = 0;
      for (const item of list) {
        const reasons = item.noise?.reasons ?? [];
        if (reasons.includes('duplicate-in-cluster')) near += 1;
        else if ((item.noise?.score ?? 0) >= threshold) hidden += 1;
      }
      return { hidden, near };
    }

    function NoiseHint({ t, items, showAll, onToggle, threshold = 0.5 }) {
      const counts = noiseCount(items, threshold);
      if (counts.hidden === 0 && counts.near === 0) return null;
      const parts = [];
      if (counts.near > 0) parts.push(t('noiseNear').replace('{n}', String(counts.near)));
      if (counts.hidden > 0) parts.push(t('noiseHidden').replace('{n}', String(counts.hidden)));
      return h('div', { className: 'lg-noise' },
        h('span', null, parts.join(' · ')),
        h('button', { type: 'button', className: 'lg-btn lg-btn-ghost', onClick: onToggle },
          showAll ? t('noiseHideCta') : t('noiseShowCta')));
    }

    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { error: null };
      }

      static getDerivedStateFromError(error) {
        return { error };
      }

      render() {
        if (this.state.error !== null) {
          return h('div', { className: 'lg-root' },
            h('div', { className: 'lg-shell' },
              h('div', { className: 'lg-card' },
                h('div', { className: 'lg-card-title' }, '灵犀面板渲染出错'),
                h('div', { className: 'lg-status lg-status-error' }, String(this.state.error?.message ?? this.state.error)),
                h('div', { className: 'lg-status' }, '请把这段错误发给开发者；其余面板功能不受影响。'))));
        }
        return this.props.children;
      }
    }

    function CorrBars({ series, t }) {
      const points = Array.isArray(series) ? series : [];
      if (points.length === 0) return null;
      const width = 320;
      const height = 72;
      const max = Math.max(1, ...points.map((point) => point.ratePer100 ?? 0));
      const step = width / points.length;
      const latestIndex = points.length - 1;
      const recentFrom = Math.max(0, points.length - 7);
      return h('svg', { viewBox: '0 0 ' + width + ' ' + height, style: { display: 'block', width: '100%', height: 'auto' }, role: 'img', 'aria-label': 'correction rate by day' },
        points.map((point, index) => {
          const rate = point.ratePer100 ?? 0;
          const barHeight = point.ratePer100 === null ? 2 : Math.max(2, Math.round((rate / max) * (height - 14)));
          const x = Math.round(index * step) + 1;
          const isRecent = index >= recentFrom;
          return h('rect', {
            key: point.day,
            x,
            y: height - barHeight - 10,
            width: Math.max(2, Math.round(step) - 2),
            height: barHeight,
            rx: 2,
            fill: 'var(--dsw-alias-brand-primary)',
            opacity: point.ratePer100 === null ? 0.18 : isRecent ? 0.95 : 0.45,
          },
            h('title', null, point.day + (point.ratePer100 === null ? ' · 无消息' : ' · ' + point.ratePer100 + '% (' + point.corrections + '/' + point.messages + ')')));
        }),
        h('line', { x1: 0, y1: height - 10, x2: width, y2: height - 10, stroke: 'var(--dsw-alias-border-l1)', strokeWidth: 1 }),
      );
    }

    /** 注入/命中：双色分组柱（浅=注入、深=命中），与纠错图同规格。 */
    function Sparkline({ points }) {
      const list = Array.isArray(points) ? points : [];
      if (list.length === 0) return null;
      const width = 320;
      const height = 72;
      const max = Math.max(1, ...list.map((p) => Math.max(p.injected ?? 0, p.hits ?? 0)));
      const step = width / list.length;
      const barWidth = Math.max(1, Math.round(step * 0.34));
      const bar = (day, value, x, opacity) => {
        const h2 = value === 0 ? 2 : Math.max(2, Math.round((value / max) * (height - 14)));
        return h('rect', {
          key: day + '-' + x,
          x,
          y: height - h2 - 10,
          width: barWidth,
          height: h2,
          rx: 2,
          fill: 'var(--dsw-alias-brand-primary)',
          opacity,
        });
      };
      return h('svg', {
        viewBox: '0 0 ' + width + ' ' + height,
        style: { display: 'block', width: '100%', height: 'auto' },
        role: 'img',
        'aria-label': 'injection and hits by day',
      },
        list.flatMap((p, index) => {
          const x = Math.round(index * step) + 1;
          return [
            bar('injected-' + index, p.injected ?? 0, x, p.injected > 0 ? 0.45 : 0.18),
            bar('hits-' + index, p.hits ?? 0, x + barWidth + 1, p.hits > 0 ? 0.95 : 0.18),
          ];
        }),
        h('line', { x1: 0, y1: height - 10, x2: width, y2: height - 10, stroke: 'var(--dsw-alias-border-l1)', strokeWidth: 1 }),
      );
    }
    function Sparkline({ points }) {
      const list = Array.isArray(points) ? points : [];
      if (list.length === 0) return null;
      const width = 320;
      const height = 72;
      const totals = list.map((p) => (p.injected ?? 0) + (p.hits ?? 0));
      const max = Math.max(1, ...totals);
      const step = width / list.length;
      return h('svg', {
        viewBox: '0 0 ' + width + ' ' + height,
        style: { display: 'block', width: '100%', height: 'auto' },
        role: 'img',
        'aria-label': 'injection and hits by day',
      },
        list.map((p, index) => {
          const total = totals[index];
          const barHeight = total === 0 ? 2 : Math.max(2, Math.round((total / max) * (height - 14)));
          return h('rect', {
            key: p.day ?? index,
            x: Math.round(index * step) + 1,
            y: height - barHeight - 10,
            width: Math.max(2, Math.round(step) - 2),
            height: barHeight,
            rx: 2,
            fill: 'var(--dsw-alias-brand-primary)',
            opacity: total === 0 ? 0.18 : 0.8,
          },
            h('title', null, (p.day ?? '') + ' · 注入 ' + (p.injected ?? 0) + ' · 命中 ' + (p.hits ?? 0)));
        }),
        h('line', { x1: 0, y1: height - 10, x2: width, y2: height - 10, stroke: 'var(--dsw-alias-border-l1)', strokeWidth: 1 }),
      );
    }
    function Skeleton() {
      return h('div', { className: 'lg-stack' },

        h('div', { className: 'lg-grid-2' },
          h('div', { className: 'lg-card' },
            h('div', { className: 'lg-skeleton lg-skeleton-lg' }),
            h('div', { className: 'lg-skeleton' }),
            h('div', { className: 'lg-skeleton lg-skeleton-sm' })),
          h('div', { className: 'lg-card' },
            h('div', { className: 'lg-skeleton lg-skeleton-lg' }),
            h('div', { className: 'lg-skeleton' }),
            h('div', { className: 'lg-skeleton lg-skeleton-sm' }))),
        h('div', { className: 'lg-tiles' },
          [0, 1, 2, 3].map((i) =>
            h('div', { className: 'lg-tile', key: i },
              h('div', { className: 'lg-skeleton lg-skeleton-sm' }),
              h('div', { className: 'lg-skeleton' })))));
    }

    /* ================================================================ 使用习惯 */

    const USAGE_KEY = 'dsh-lingxi-panel-usage';

    function readUsage() {
      try {
        const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(USAGE_KEY);
        if (raw === null) return { tabs: {}, lastTab: null, lastSearch: '' };
        const parsed = JSON.parse(raw);
        return {
          tabs: typeof parsed?.tabs === 'object' && parsed.tabs !== null ? parsed.tabs : {},
          lastTab: typeof parsed?.lastTab === 'string' ? parsed.lastTab : null,
          lastSearch: typeof parsed?.lastSearch === 'string' ? parsed.lastSearch : '',
        };
      } catch {
        return { tabs: {}, lastTab: null, lastSearch: '' };
      }
    }

    function writeUsage(patch) {
      try {
        if (typeof localStorage === 'undefined') return;
        const next = { ...readUsage(), ...patch };
        localStorage.setItem(USAGE_KEY, JSON.stringify(next));
      } catch {
        // 隐私模式或配额满时忽略
      }
    }

    /** 页签顺序：用过的按次数降序，没用过的保持原序跟在后面。 */
    function orderTabs(tabs) {
      // 固定顺序：概览永远第一位。按使用频率重排会让面板"开在一个意外的页签"。
      return tabs;
    }

    /** 默认页签：固定概览。 */
    function initialTab(tabs) {
      return tabs.some((tab) => tab.id === 'overview') ? 'overview' : tabs[0]?.id ?? 'overview';
    }

    /* ================================================================ 数据 */

    function useOverview(context = {}) {
      const bootSnapshot = typeof window !== 'undefined' ? window.__LINGXI_BOOT__ ?? null : null;
      const [data, setData] = React.useState(bootSnapshot);
      const [error, setError] = React.useState(null);
      const [loading, setLoading] = React.useState(bootSnapshot === null);
      const [refreshing, setRefreshing] = React.useState(false);
      const [lastLoadedAt, setLastLoadedAt] = React.useState(0);

      const load = React.useCallback(async (force) => {
        if (force) setRefreshing(true);
        try {
          const params = new URLSearchParams();
          if (context.sessionId) params.set('sessionId', context.sessionId);
          if (context.workspaceId) params.set('workspaceId', context.workspaceId);
          if (force) params.set('refresh', '1');
          const suffix = params.toString();
          const body = await getJson(`${OVERVIEW}${suffix === '' ? '' : `?${suffix}`}`);
          setData(body);
          setError(null);
          setLastLoadedAt(Date.now());
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      }, [context.sessionId, context.workspaceId]);

      React.useEffect(() => {
        let alive = true;
        const tick = (force) => {
          if (!alive) return;
          if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
          load(force).catch(() => {});
        };
        tick(false);
        const timer = setInterval(() => tick(false), 30 * 1000);
        return () => {
          alive = false;
          clearInterval(timer);
        };
      }, [load]);

      return { data, error, loading, refreshing, lastLoadedAt, reload: load };
    }

    /* ================================================================ 概览 */

    function OverviewTab({ t, derived, memory, live, injection, efficacy, evolution, scenes, quality, selfcheck, auditState, alerts, samples, busy, onSeed, onDetail, onFailures, onSelfcheck, onShowSamples }) {
      const health = memory?.health ?? null;
      const hygiene = memory?.hygiene ?? null;
      const coverage = efficacy?.failures?.coverage ?? null;
      const trend = efficacy?.failures?.trend ?? [];
      const attribution = efficacy?.attribution ?? null;
      const gate = derived?.gate ?? null;
      const lessons = derived?.lessons ?? [];
      const holes = coverage?.holes ?? [];

      /* ---------- 学习闭环：五个环节的实测数字 ---------- */
      const flowSteps = [
        { label: t('flowInject'), value: int(injection?.injected ?? 0) },
        { label: t('flowHit'), value: int(injection?.hits ?? 0) },
        { label: t('flowMiss'), value: int(injection?.misses ?? 0) },
        { label: t('flowGuard'), value: int(injection?.guardDenied ?? 0) },
        { label: t('flowPrune'), value: int((hygiene?.quarantined ?? 0) + (hygiene?.evicted ?? 0) + (hygiene?.demoted ?? 0) + (hygiene?.merged ?? 0)) },
      ];

      /* ---------- 复发治理表 ---------- */
      const attrColumns = [
        { key: 'scene', label: t('attrScene'), render: (row) => h('span', { className: 'lx-cell-main lx-cell-nowrap' }, row.tool + (row.code === '' ? '' : ' · ' + row.code)) },
        { key: 'before', label: t('attrBeforeShort'), align: 'right', className: 'lx-cell-num', render: (row) => int(row.before) },
        { key: 'after', label: t('attrAfterShort'), align: 'right', className: 'lx-cell-num', render: (row) => int(row.after) },
        {
          key: 'delta',
          label: t('attrDeltaShort'),
          align: 'right',
          render: (row) => {
            const before = Number(row.before ?? 0);
            const after = Number(row.after ?? 0);
            if (before <= 0) return h('span', { className: 'lx-cell-num' }, '—');
            const ratio = Math.round(((after - before) / before) * 100);
            return h(Chip, { kind: ratio < 0 ? 'ok' : 'warn', children: (ratio > 0 ? '+' : '') + String(ratio) + '%' });
          },
        },
        { key: 'hits', label: t('attrHitShort'), align: 'right', className: 'lx-cell-num', render: (row) => (row.hits === undefined ? '—' : int(row.hits)) },
      ];
      const attrRows = (attribution?.pairs ?? []).filter((row) => Number(row.before ?? 0) > 0);

      return h('div', { className: 'lg-stack' },

        /* 告警：只有异常时出现 */
        (Array.isArray(alerts) ? alerts : []).length > 0
          ? h(Card, { title: t('alertTitle') }, h('div', { className: 'lg-rows' }, alerts.map((alert, index) =>
              h('div', { className: 'lg-row', key: alert.kind + index },
                h('div', { className: 'lg-row-main' }, h('div', { className: 'lg-row-title' },
                  alert.kind === 'demote-spike' ? t('alertDemote').replace('{n}', int(alert.count))
                    : alert.kind === 'quarantine-spike' ? t('alertQuarantine').replace('{n}', int(alert.count))
                    : alert.kind === 'audit-failed' ? t('alertAudit')
                    : alert.kind === 'semantic-empty' ? t('alertSemantic').replace('{n}', int(alert.count)).replace('{reason}', String(alert.detail ?? 'empty-reply'))
                    : t('alertCoverage').replace('{n}', int(alert.count))))))))
          : null,

        /* 1. 学习闭环 */
        h(Card, { title: t('loopTitle'), hint: t('loopHint') },
          h('div', { className: 'lx-flow' }, flowSteps.map((step, index) => [
            index > 0 ? h('span', { className: 'lx-flow-arrow', key: 'a' + index }, '→') : null,
            h('div', { className: 'lx-flow-step', key: step.label },
              h('span', { className: 'lx-flow-num' }, step.value),
              h('span', { className: 'lx-flow-label' }, step.label)),
          ]))),

        /* 2. 14 天趋势（主视觉） */
        trend.length > 0
          ? h(Card, { title: t('trendTitle'), hint: t('trendHint') },
            h('div', null, trend.map((row) => {
              const points = Array.isArray(row.points) ? row.points : [];
              const max = Math.max(1, ...points.map((p) => Number(p.count ?? 0)));
              const bars = points.map((point, index) => {
                const value = Number(point.count ?? 0);
                const pctHeight = value === 0 ? 2 : Math.max(6, Math.round((value / max) * 100));
                return h('div', {
                  key: point.day + index,
                  className: value === 0 ? 'lx-bar is-zero' : 'lx-bar',
                  style: { height: pctHeight + '%' },
                  title: point.day + ' · ' + value + ' ' + t('times'),
                });
              });
              return h('div', { className: 'lx-trend-row', key: row.key },
                h('div', { className: 'lx-trend-head' },
                  h('span', { className: 'lx-trend-name' }, String(row.key).replace('|', ' · ')),
                  h('span', { className: 'lx-trend-total' }, int(row.total ?? 0) + ' ' + t('times'))),
                h('div', { className: 'lx-bars' }, bars));
            })),
            h('div', { className: 'lx-axis' }, [
              h('span', { key: 'a' }, String(trend[0]?.points?.[0]?.day ?? '').slice(5)),
              h('span', { key: 'b' }, String(trend[0]?.points?.[Math.floor((trend[0]?.points?.length ?? 1) / 2)]?.day ?? '').slice(5)),
              h('span', { key: 'c' }, String(trend[0]?.points?.[(trend[0]?.points?.length ?? 1) - 1]?.day ?? '').slice(5)),
            ]))
          : null,

        /* 3. 复发治理 */
        attrRows.length > 0
          ? h(Card, { title: t('attrTitle'), hint: t('attrHint') },
            h(DataTable, {
              columns: attrColumns,
              rows: attrRows.slice(0, 8),
              rowKey: (row) => String(row.tool) + '|' + String(row.code),
              empty: t('attrEmpty'),
            }))
          : null,

        /* 4. 记忆覆盖 */
        coverage !== null && Number(coverage.total ?? 0) > 0
          ? h(Card, { title: t('coverageTitle'), hint: t('coverageHint') },
            h('div', { className: 'lx-section' },
              h('div', { className: 'lx-section-title' }, t('coverageRatio').replace('{c}', int(coverage.covered)).replace('{t}', int(coverage.total))),
              h('span', { className: 'lx-cell-num' }, coverage.ratio === null ? '—' : pct(coverage.ratio))),
            holes.length === 0
              ? h('div', { className: 'lx-table-empty' }, t('coverageNone'))
              : h(DataTable, {
                columns: [
                  { key: 'scene', label: t('attrScene'), render: (row) => h('span', { className: 'lx-cell-main lx-cell-nowrap' }, row.tool + (row.code === '' ? '' : ' · ' + row.code)) },
                  { key: 'sessions', label: t('coverageSessions'), align: 'right', className: 'lx-cell-num', render: (row) => int(row.sessions) },
                  { key: 'count', label: t('coverageCount'), align: 'right', className: 'lx-cell-num', render: (row) => int(row.count) },
                  { key: 'act', label: '', align: 'right', render: (row) => h('button', { type: 'button', className: 'lg-btn lg-btn-ghost', disabled: busy !== '', onClick: () => onSeed({ tool: row.tool, code: row.code, count: row.count }) }, t('coverageSeed')) },
                ],
                rows: holes,
                rowKey: (row) => String(row.tool) + '|' + String(row.code),
                empty: t('coverageNone'),
              }))
          : null,

        /* 折叠：系统状态（回归 / 闸门 / 实时 / 质量 / 进化） */
        h(Collapsible, { title: t('sysTitle') },

          h('div', { className: 'lx-section' },
            h('div', { className: 'lx-section-title' }, t('selfcheckTitle')),
            h('button', { type: 'button', className: 'lg-btn lg-btn-ghost', disabled: busy !== '', onClick: () => onSelfcheck() }, t('selfcheckRun'))),
          selfcheck === null || selfcheck === undefined
            ? h('div', { className: 'lx-table-empty' }, t('selfcheckNever'))
            : h('div', { className: 'lg-status' }, [
                h(Chip, { kind: selfcheck.ok === true ? 'ok' : 'warn', key: 's' }, selfcheck.ok === true ? t('selfcheckOk') : t('selfcheckBad')),
                h('span', { key: 'n', className: 'lg-card-hint' }, int(selfcheck.suites?.length ?? 0) + ' · ' + int(selfcheck.ms ?? 0) + 'ms'),
                auditState !== null && auditState !== undefined
                  ? h(Chip, { kind: auditState.ok === true ? 'ok' : 'warn', key: 'a' }, auditState.ok === true ? t('auditOk') : t('auditBad'))
                  : null,
              ]),

          gate !== null
            ? h('div', { className: 'lx-section' },
                h('div', { className: 'lx-section-title' }, t('gateTitle')),
                h('div', { className: 'lx-section-actions' }, [
                  h('span', { key: 'g1', className: 'lg-card-hint' }, t('gateGuardDenied') + ' ' + int(gate.guardDenied ?? 0)),
                  h('span', { key: 'g2', className: 'lg-card-hint' }, t('adviceAdopted') + ' ' + int(gate.adviceAdopted ?? 0)),
                  h('span', { key: 'g3', className: 'lg-card-hint' }, t('adviceIgnored') + ' ' + int(gate.adviceIgnored ?? 0)),
                ]))
            : null,

          live !== null && live !== undefined
            ? h('div', { className: 'lx-section' },
                h('div', { className: 'lx-section-title' }, t('liveTitle')),
                h('div', { className: 'lx-section-actions' }, [
                  h('span', { key: 'l1', className: 'lg-card-hint' }, t('liveSessions') + ' ' + int(live.sessions ?? 0)),
                  h('span', { key: 'l2', className: 'lg-card-hint' }, t('liveTurns') + ' ' + int(live.turns ?? 0)),
                  h('span', { key: 'l3', className: 'lg-card-hint' }, t('liveToolErrors') + ' ' + int(live.toolErrors ?? 0)),
                ]))
            : null,

          quality !== null && quality !== undefined
            ? h('div', { className: 'lx-section' },
                h('div', { className: 'lx-section-title' }, t('qualityTitle')),
                h('div', { className: 'lx-section-actions' }, (quality.buckets ?? []).map((bucket) =>
                  h('span', { key: bucket.key, className: 'lg-card-hint' }, String(bucket.key) + ' ' + int(bucket.sessions ?? 0) + ' · ' + (bucket.failureRate === null ? '—' : pct(bucket.failureRate))))))
            : null,

          evolution !== null && evolution !== undefined
            ? h('div', { className: 'lx-section' },
                h('div', { className: 'lx-section-title' }, t('evolveTitle')),
                h('div', { className: 'lx-section-actions' }, [
                  h('span', { key: 'e1', className: 'lg-card-hint' }, t('evolveTrials') + ' ' + int(evolution.trials ?? 0)),
                  h('span', { key: 'e2', className: 'lg-card-hint' }, String(evolution.bestArmId ?? '—')),
                ]))
            : null,

          samples !== undefined && (samples ?? []).length > 0
            ? h('div', { className: 'lx-section' },
                h('div', { className: 'lx-section-title' }, t('injectSamplesTitle')),
                h('button', { type: 'button', className: 'lg-btn lg-btn-ghost', disabled: busy !== '', onClick: () => onShowSamples(samples ?? []) }, t('injectFullText')))
            : null,

          lessons.length > 0
            ? h('div', { className: 'lx-section' },
                h('div', { className: 'lx-section-title' }, t('liveLessons')),
                h('div', { className: 'lx-section-actions' },
                  h('span', { className: 'lg-card-hint' }, int(lessons.length) + ' ' + t('times')),
                  h('button', { type: 'button', className: 'lg-btn lg-btn-ghost', disabled: busy !== '', onClick: () => onDetail(t('detailHits'), { minHits: 1, limit: 100 }) }, t('detailOpen'))))
            : null),
      );
    }

    function memoryMeta(t, record) {
      const parts = [];
      if (record.evidence > 1) parts.push(t('evidence').replace('{n}', int(record.evidence)));
      if (record.usedCount > 0) parts.push(t('used').replace('{n}', int(record.usedCount)));
      if (record.contradictions > 0) parts.push(t('contradictionCount').replace('{n}', int(record.contradictions)));
      if (record.updatedAt > 0) parts.push(relTime(record.updatedAt, t));
      return parts;
    }

    function MemoryRow({ t, record, actions }) {
      const effective = record.effective !== undefined ? record.effective : record.confidence;
      return h('div', { className: 'lg-row' },
        h('div', { className: 'lg-row-main' },
          h('div', { className: 'lg-row-title' }, record.text),
          h('div', { className: 'lg-row-meta' },
            h(Chip, { kind: record.kind === 'constraint' ? 'accent' : record.status === 'active' ? 'ok' : undefined, children: t(KIND_LABEL[record.kind] ?? 'kindFact') }),
            h(Chip, { children: t(SCOPE_LABEL[record.scope?.kind] ?? 'scopeMachine') }),
            h(Chip, { kind: record.status === 'candidate' ? 'warn' : 'mute', children: t(STATUS_LABEL[record.status] ?? 'statusActive') }),
            ...memoryMeta(t, record).map((text, index) => h('span', { key: index }, text))),
          h('div', { className: 'lg-bar-wrap' },
            h('div', { className: 'lg-bar' },
              h('div', { className: 'lg-bar-fill', style: { width: `${Math.round((Number.isFinite(effective) ? effective : 0) * 100)}%` } })),
            h('span', { className: 'lg-bar-value' }, pct(effective)))),
        actions !== undefined ? h('div', { className: 'lg-row-side' }, actions) : null);
    }

    function MemoryActions({ t, record, onPromote, onForget, onDelete }) {
      const nextSharing = record.sharing === 'workspace' ? 'global' : 'workspace';
      return h('span', { style: { display: 'flex', gap: 6 } },
        record.sharing === 'global'
          ? null
          : h('button', {
              type: 'button',
              className: 'lg-btn lg-btn-ghost',
              onClick: () => onPromote(record.id, nextSharing),
            }, t(record.sharing === 'workspace' ? 'shareGlobal' : 'shareWorkspace')),
        h('button', {
          type: 'button',
          className: 'lg-btn lg-btn-ghost',
          onClick: () => onForget(record.id),
        }, t('forget')),
        onDelete === undefined ? null : h('button', {
          type: 'button',
          className: 'lg-btn lg-btn-ghost',
          onClick: () => onDelete(record.id),
        }, t('deleteOne')));
    }

    function MemoryTab({ t, memory, busy, context, injection, search, onDecide, onPromote, onForget, onDetail, onDeleteOne, onPurge, onExport, onImport, onImportError, onHygiene, onReset, onSeed, onSelfcheck, onAudit, onRepair, semanticStats, onReview, onApplyReview, reviewState, reviewPicked, setReviewPicked, modelPairs, reviewModelChoice, onReviewModel, reviewModelUsed, reviewProgress, autoReview, autoReviewDays, autoReviewLastAt, onAutoReview }) {
      const health = memory?.health ?? null;
      const hygiene = memory?.hygiene ?? null;
      const pending = memory?.pending ?? [];
      const [query, setQuery] = React.useState('');
      const [status, setStatus] = React.useState('active');
      const [kind, setKind] = React.useState('');
      const [list, setList] = React.useState(null);
      const [listTotal, setListTotal] = React.useState(0);

      const load = React.useCallback(async () => {
        const parts = ["limit=60"];
        if (status !== '') parts.push('status=' + encodeURIComponent(status));
        if (kind !== '') parts.push('kind=' + encodeURIComponent(kind));
        if (query.trim() !== '') parts.push('q=' + encodeURIComponent(query.trim()));
        try {
          const body = await getJson('lingxi/memory/list?' + parts.join('&'));
          const items = Array.isArray(body.items) ? body.items : [];
          setList(items);
          setListTotal(items.length);
        } catch {
          setList([]);
          setListTotal(0);
        }
      }, [status, kind, query]);

      React.useEffect(() => { load(); }, [status, kind]);

      const columns = [
        { key: 'text', label: t('colContent'), width: '40%', render: (row) => h('span', { className: 'lx-cell-main' }, row.text) },
        { key: 'kind', label: t('colKind'), render: (row) => h(Chip, { kind: 'accent', children: t(KIND_LABEL[row.kind] ?? 'kindFact') }) },
        { key: 'status', label: t('colStatus'), render: (row) => h(Chip, { kind: row.status === 'active' ? 'ok' : row.status === 'retired' ? 'mute' : 'warn', children: String(row.status ?? '') }) },
        { key: 'sharing', label: t('colSharing'), render: (row) => h('span', { className: 'lg-card-hint' }, String(row.sharing ?? 'private')) },
        { key: 'hits', label: t('colHits'), align: 'right', className: 'lx-cell-num', render: (row) => int(row.hitCount ?? 0) },
        {
          key: 'act',
          label: '',
          align: 'right',
          width: '150px',
          render: (row) => {
            const isCandidate = String(row.status ?? '') === 'candidate';
            const buttons = [];
            if (isCandidate) {
              buttons.push(h('button', { key: 'a', type: 'button', className: 'lg-btn lg-btn-ghost', disabled: busy !== '', onClick: () => onDecide(row.id, 'accept') }, t('accept')));
              buttons.push(h('button', { key: 'r', type: 'button', className: 'lg-btn lg-btn-ghost', disabled: busy !== '', onClick: () => onDecide(row.id, 'retire') }, t('retire')));
            } else {
              buttons.push(h('button', { key: 'd', type: 'button', className: 'lg-btn lg-btn-ghost', onClick: () => onDetail(t('lifeTitle'), { status: row.status, limit: 100 }) }, t('detailOpen')));
            }
            buttons.push(h('button', { key: 'x', type: 'button', className: 'lg-btn lg-btn-ghost', disabled: busy !== '', onClick: () => onDeleteOne(row.id) }, t('deleteOne')));
            return h('div', { className: 'lx-actions' }, buttons);
          },
        },
      ];

      return h('div', { className: 'lg-stack' },

        /* 工具栏：搜索 + 筛选 */
        h(Card, null,
          h('div', { className: 'lx-toolbar' },
            h('input', {
              className: 'lg-input',
              type: 'search',
              value: query,
              placeholder: t('searchPlaceholder'),
              onChange: (event) => setQuery(event.target.value),
              onKeyDown: (event) => { if (event.key === 'Enter') load(); },
            }),
            h('div', { className: 'lg-field', style: { minWidth: 130 } },
              h(Select, {
                value: status,
                options: [
                  { value: '', label: t('browseStatusAll') },
                  { value: 'active', label: t('statusActive') },
                  { value: 'candidate', label: t('statusCandidate') },
                  { value: 'retired', label: t('statusRetired') },
                ],
                onChange: (next) => setStatus(next),
                ariaLabel: t('purgeStatus'),
              })),
            h('div', { className: 'lg-field', style: { minWidth: 130 } },
              h(Select, {
                value: kind,
                options: [
                  { value: '', label: t('purgeAll') },
                  { value: 'constraint', label: t(KIND_LABEL.constraint) },
                  { value: 'preference', label: t(KIND_LABEL.preference) },
                  { value: 'fact', label: t(KIND_LABEL.fact) },
                  { value: 'lesson', label: t(KIND_LABEL.lesson) },
                  { value: 'skill', label: t(KIND_LABEL.skill) },
                ],
                onChange: (next) => setKind(next),
                ariaLabel: t('purgeKind'),
              })),
            h('button', { type: 'button', className: 'lg-btn lg-btn-primary', onClick: () => load() }, t('searchAction')))),

        /* 记忆清单 */
        h(SectionTitle, {
          title: t('memoryListTitle'),
          hint: list === null
            ? '…'
            : t('memoryListHint').replace('{n}', int(listTotal)).replace('{total}', int(health?.total ?? 0)),
          actions: h('button', { type: 'button', className: 'lg-btn lg-btn-ghost', disabled: busy !== '', onClick: () => onExport() }, t('exportTitle')),
        }),
        h(Card, null,
          h(DataTable, {
            columns,
            rows: list ?? [],
            rowKey: (row) => row.id,
            empty: list === null ? '…' : t('noResults'),
          })),

        /* 待确认队列 */
        h(Collapsible, { title: t('pendingQueue') + ' · ' + int(memory?.pendingTotal ?? 0) },
          pending.length === 0
            ? h('div', { className: 'lx-table-empty' }, t('noPending'))
            : h(DataTable, {
              columns: [
                { key: 'text', label: t('colContent'), render: (row) => h('span', { className: 'lx-cell-main' }, row.text) },
                { key: 'kind', label: t('colKind'), render: (row) => h(Chip, { kind: 'accent', children: t(KIND_LABEL[row.kind] ?? 'kindFact') }) },
                { key: 'source', label: t('colSource'), render: (row) => h('span', { className: 'lg-card-hint' }, String((row.provenance ?? [])[0]?.source ?? '')) },
                {
                  key: 'act',
                  label: '',
                  align: 'right',
                  render: (row) => h('div', { className: 'lx-actions' }, [
                    h('button', { key: 'a', type: 'button', className: 'lg-btn lg-btn-primary', disabled: busy !== '', onClick: () => onDecide(row.id, 'accept') }, t('accept')),
                    h('button', { key: 'r', type: 'button', className: 'lg-btn lg-btn-ghost', disabled: busy !== '', onClick: () => onDecide(row.id, 'retire') }, t('retire')),
                    h('button', { key: 'x', type: 'button', className: 'lg-btn lg-btn-ghost', disabled: busy !== '', onClick: () => onDeleteOne(row.id) }, t('deleteOne')),
                  ]),
                },
              ],
              rows: pending,
              rowKey: (row) => row.id,
              empty: t('noPending'),
            })),

        /* 记忆复盘：模型审查分类与价值，只给建议 */
        h(Collapsible, { title: t('reviewTitle'), hint: t('reviewHint') },

          h('div', { className: 'lx-section' },
            h('div', { className: 'lx-section-title' }, t('reviewTitle')),
            h('div', { className: 'lx-section-actions' }, [
              h('button', { key: 'run', type: 'button', className: 'lg-btn lg-btn-primary', disabled: busy !== '', onClick: onReview },
                busy === 'review' ? t('reviewRunning') : t('reviewRun')),
              reviewState !== null && (reviewState.suggestions ?? []).length > 0
                ? h('button', { key: 'apply', type: 'button', className: 'lg-btn', disabled: busy !== '', onClick: onApplyReview }, t('reviewApply'))
                : null,
            ])),

          // 进度：把"进行中"变成可量化的等待（第几条 / 共几条 / 已用几秒）
          reviewProgress !== null
            ? h('div', { className: 'lx-field', key: 'reviewProgress' },
              h('div', { className: 'lx-field-hint' },
                reviewProgress.total > 0
                  ? t('reviewProgress').replace('{done}', int(reviewProgress.done)).replace('{total}', int(reviewProgress.total))
                    + ' · ' + t('reviewElapsed').replace('{s}', int(Math.round((reviewProgress.elapsedMs ?? 0) / 1000)))
                  : t('reviewStarting')),
              h('div', { className: 'lx-progress-track' },
                h('div', { className: 'lx-progress-fill', style: { width: (reviewProgress.total > 0 ? Math.round((reviewProgress.done / reviewProgress.total) * 100) : 10) + '%' } })))
            : null,

          // 自动复盘：默认周级。记忆持续增长，靠人记得点不现实。
          h('div', { className: 'lx-field', key: 'autoReview' },
            h('div', { className: 'lx-field-head' },
              h('div', null,
                h('div', { className: 'lx-field-label' }, t('autoReviewLabel')),
                h('div', { className: 'lx-field-hint' }, t('autoReviewHint').replace('{d}', int(autoReviewDays ?? 7))),
                h('div', { className: 'lx-field-hint' },
                  autoReviewLastAt > 0
                    ? t('autoReviewLast').replace('{when}', relTime(autoReviewLastAt, t))
                    : t('autoReviewNever'))),
              h('span', { className: 'lx-switch' },
                h('input', { type: 'checkbox', checked: autoReview === true, disabled: busy !== '', onChange: (event) => onAutoReview(event.target.checked) }),
                h('span', { className: 'lx-switch-track' }),
                h('span', { className: 'lx-switch-knob' })))),

          // 复盘模型：与语义召回并列的独立选择（两个任务可以各用各的模型）
          h('div', { className: 'lx-field', key: 'reviewModel' },
            h('div', { className: 'lx-field-label' }, t('reviewModelLabel')),
            h('div', { className: 'lx-field-hint' }, t('reviewModelHint')),
            h('div', { className: 'lx-field-ctl' },
              h(Select, {
                value: reviewModelChoice ?? '',
                options: modelPairs ?? [],
                onChange: onReviewModel,
                ariaLabel: t('reviewModelLabel'),
              })),
            String(reviewModelUsed ?? '') !== ''
              ? h('div', { className: 'lx-field-hint' }, t('reviewUsedModel').replace('{model}', String(reviewModelUsed)))
              : null),

          reviewState === null
            ? h('div', { className: 'lx-table-empty' }, t('reviewHint'))
            : (reviewState.suggestions ?? []).length === 0
              ? h('div', { className: 'lx-table-empty' }, t('reviewNone'))
              : h(DataTable, {
                columns: [
                  {
                    key: 'pick',
                    label: '',
                    width: '34px',
                    render: (row) => h('input', {
                      type: 'checkbox',
                      checked: reviewPicked[row.id] === true,
                      disabled: row.verdict === 'keep',
                      onChange: (event) => setReviewPicked({ ...reviewPicked, [row.id]: event.target.checked }),
                    }),
                  },
                  { key: 'text', label: t('colContent'), width: '38%', render: (row) => h('span', { className: 'lx-cell-main' }, String(row.text ?? '').slice(0, 70)) },
                  {
                    key: 'verdict',
                    label: t('colStatus'),
                    render: (row) => {
                      if (row.verdict === 'keep') return h(Chip, { kind: 'ok', children: t('reviewVerdictKeep') });
                      if (row.verdict === 'drop') return h(Chip, { kind: 'warn', children: t('reviewVerdictDrop') });
                      return h(Chip, { kind: 'accent', children: t('reviewVerdictReclass') + ' → ' + String(row.kind ?? '') });
                    },
                  },
                  { key: 'from', label: t('colKind'), render: (row) => h('span', { className: 'lg-card-hint' }, String(row.currentKind ?? '')) },
                  { key: 'reason', label: t('colSource'), render: (row) => h('span', { className: 'lg-card-hint' }, String(row.reason ?? '')) },
                ],
                rows: reviewState.suggestions ?? [],
                rowKey: (row) => row.id,
                empty: t('reviewNone'),
              }),

          reviewState !== null && String(reviewState.error ?? '') !== ''
            ? h('div', { className: 'lx-field-hint', style: { color: 'var(--dsw-alias-state-warn-primary)' } }, String(reviewState.error))
            : null,
        ),

        /* 运维工具 */
        /* 运维工具 */
        h(Collapsible, { title: t('opsTitle'), hint: t('opsHint') },

          h('div', { className: 'lx-section' },
            h('div', { className: 'lx-section-title' }, t('purgeTitle')),
            h('div', { className: 'lx-section-actions' },[
              h('button', { key: 'f', type: 'button', className: 'lg-btn lg-btn-ghost', disabled: busy !== '', onClick: () => onPurge({ status: 'retired' }, true) }, t('purgeDryRun')),
              h('button', { key: 'p', type: 'button', className: 'lg-btn', disabled: busy !== '', onClick: () => onPurge({ status: 'retired' }, false) }, t('purgeRun')),
              h('label', { key: 'i', className: 'lg-btn lg-btn-ghost', style: { cursor: 'pointer' } }, t('importTitle'),
                h('input', { type: 'file', accept: 'application/json', style: { display: 'none' },
                  onChange: (event) => {
                    const file = event.target.files?.[0];
                    if (file === undefined) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      try { onImport(JSON.parse(String(reader.result ?? '{}'))); }
                      catch (error) { onImportError(error instanceof Error ? error.message : String(error)); }
                    };
                    reader.readAsText(file);
                    event.target.value = '';
                  } })),
            ])),

          hygiene !== null
            ? h('div', { className: 'lx-section' },
                h('div', { className: 'lx-section-title' }, t('hygieneTitle')),
                h('div', { className: 'lx-section-actions' }, [
                  h('span', { key: 's', className: 'lg-card-hint' }, t('hygieneScan') + ' ' + int(hygiene.scanned ?? 0)),
                  h('span', { key: 'q', className: 'lg-card-hint' }, t('hygieneQuarantined') + ' ' + int(hygiene.quarantined ?? 0)),
                  h('span', { key: 'e', className: 'lg-card-hint' }, t('hygieneEvicted') + ' ' + int(hygiene.evicted ?? 0)),
                  h('span', { key: 'm', className: 'lg-card-hint' }, t('hygieneMerged') + ' ' + int(hygiene.merged ?? 0)),
                  h('span', { key: 'p', className: 'lg-card-hint' }, t('hygieneProven') + ' ' + int(hygiene.proven ?? 0)),
                  h('button', { key: 'run', type: 'button', className: 'lg-btn lg-btn-ghost', disabled: busy !== '', onClick: onHygiene }, t('hygieneRun')),
                  h('button', { key: 'v', type: 'button', className: 'lg-btn lg-btn-ghost', onClick: () => onDetail(t('detailRetired'), { status: 'retired', limit: 100 }) }, t('detailOpen')),
                  h('button', { key: 'r', type: 'button', className: 'lg-btn lg-btn-ghost', onClick: onReset }, t('resetTitle')),
                ]))
            : null,

          h('div', { className: 'lx-section' },
            h('div', { className: 'lx-section-title' }, t('searchQualityTitle')),
            h('div', { className: 'lx-section-actions' },[
              h('span', { key: 'q', className: 'lg-card-hint' }, t('searchQuality')
                .replace('{n}', int(search?.total ?? 0))
                .replace('{m}', int(search?.abstained ?? 0))
                .replace('{r}', (search?.total ?? 0) === 0 ? '—' : String(Math.round(((search?.abstained ?? 0) / search.total) * 1000) / 10) + '%')),
              semanticStats !== undefined && semanticStats !== null
                ? h('span', { key: 's', className: 'lg-card-hint' }, t('semanticCalls')
                  .replace('{n}', int(semanticStats.calls ?? 0))
                  .replace('{ok}', int(semanticStats.ok ?? 0))
                  .replace('{fail}', int(semanticStats.failed ?? 0))
                  .replace('{to}', int(semanticStats.timeout ?? 0)))
                : null,
            ])),

          h('div', { className: 'lx-section' },
            h('div', { className: 'lx-section-title' }, t('statusBreakdown')),
            h('div', { className: 'lx-section-actions' }, Object.entries(health?.byStatus ?? {}).map(([key, value]) =>
              h('span', { key, className: 'lg-card-hint' }, key + ' ' + int(value))))),
        ),
      );
    }

    function EvolutionTab({ t, derived, efficacy, memory, injection, busy, onDecide, onPromote, onDetail, onFailures }) {
      const lessonEff = new Map((efficacy?.lessonEfficacy ?? []).map((entry) => [entry.id, entry]));
      const lessons = derived?.lessons ?? [];
      const facts = derived?.facts ?? [];
      const skills = derived?.skills ?? [];
      const attribution = efficacy?.attribution ?? null;
      const corrections = efficacy?.failures?.corrections ?? null;
      const compare = efficacy?.metrics?.compare ?? null;
      const promotable = efficacy?.promotable ?? [];
      const regressions = efficacy?.regressions ?? [];
      const proven = Number(memory?.hygiene?.proven ?? 0);

      const recent = compare?.recent ?? {};
      const previous = compare?.previous ?? {};
      const ratio = (bucket) => {
        const total = Number(bucket?.corrections ?? 0);
        if (total <= 0) return null;
        return Math.round((Number(bucket?.correctionPenalized ?? 0) / total) * 10) / 10;
      };
      const nowRatio = ratio(recent);
      const adoptRate = (() => {
        const adopted = Number(recent.adviceAdopted ?? 0);
        const ignored = Number(recent.adviceIgnored ?? 0);
        if (adopted + ignored === 0) return null;
        return Math.round((adopted / (adopted + ignored)) * 1000) / 10;
      })();

      /* 教训疗效表：每条教训沉淀前后，对应场景的失败次数变化 */
      const effRows = lessons
        .map((item) => ({ item, eff: lessonEff.get(item.id) ?? null }))
        .filter((row) => row.eff !== null && Number(row.eff.before ?? 0) > 0)
        .sort((a, b) => Number(a.eff.after ?? 0) - Number(b.eff.after ?? 0));

      const effColumns = [
        { key: 'text', label: t('colLesson'), width: '42%', render: (row) => h('span', { className: 'lx-cell-main' }, String(row.item.action ?? row.item.text ?? '').slice(0, 90)) },
        { key: 'before', label: t('attrBeforeShort'), align: 'right', className: 'lx-cell-num', render: (row) => int(row.eff.before) },
        { key: 'after', label: t('attrAfterShort'), align: 'right', className: 'lx-cell-num', render: (row) => int(row.eff.after) },
        {
          key: 'delta',
          label: t('attrDeltaShort'),
          align: 'right',
          render: (row) => {
            const before = Number(row.eff.before ?? 0);
            const after = Number(row.eff.after ?? 0);
            if (before <= 0) return h('span', { className: 'lx-cell-num' }, '—');
            const value = Math.round(((after - before) / before) * 100);
            return h(Chip, { kind: value < 0 ? 'ok' : 'warn', children: (value > 0 ? '+' : '') + String(value) + '%' });
          },
        },
        {
          key: 'state',
          label: t('colState'),
          render: (row) => {
            const shortWindow = Number(row.eff.windowDays ?? 0) < 1;
            if (shortWindow) return h(Chip, { kind: 'mute', children: t('lessonObserving') });
            const hits = Number(row.item.hits ?? row.item.hitCount ?? 0);
            const misses = Number(row.item.misses ?? row.item.missCount ?? 0);
            const rate = hits + misses === 0 ? null : hits / (hits + misses);
            const isProven = rate !== null && hits >= 3 && rate >= 0.8;
            return h(Chip, { kind: isProven ? 'ok' : 'mute', children: isProven ? t('hygieneProven') : t('lessonObserving') });
          },
        },
        {
          key: 'act',
          label: '',
          align: 'right',
          render: (row) => h('div', { className: 'lx-actions' }, [
            h('button', { key: 'd', type: 'button', className: 'lg-btn lg-btn-ghost', onClick: () => onDetail(t('lifeTitle'), { minHits: 0, limit: 100 }) }, t('detailOpen')),
            h('button', { key: 'r', type: 'button', className: 'lg-btn lg-btn-ghost', disabled: busy !== '', onClick: () => onDecide(row.item.id, 'retire') }, t('retire')),
          ]),
        },
      ];

      return h('div', { className: 'lg-stack' },

        /* 指标行 */
        h(StatBar, { items: [
          {
            label: t('statCorr'),
            value: corrections === null ? '—' : String(corrections.ratePer100) + '%',
            hint: t('corrSplit')
              .replace('{a}', String(corrections?.ratePer100 ?? '—'))
              .replace('{b}', String(corrections?.feedbackPer100 ?? '—')),
          },
          {
            label: t('adviceAdopted'),
            value: adoptRate === null ? '—' : String(adoptRate) + '%',
            hint: int(recent.adviceAdopted ?? 0) + '/' + int((recent.adviceAdopted ?? 0) + (recent.adviceIgnored ?? 0)),
          },
          {
            label: t('corrPrecisionShort'),
            value: nowRatio === null ? '—' : String(nowRatio),
            hint: t('attrPerCorrection'),
          },
          { label: t('hygieneProven'), value: int(proven), tone: 'ok' },
        ] }),

        /* 教训疗效 */
        h(SectionTitle, {
          title: t('lessonEfficacyTitle'),
          hint: t('lessonEfficacyHint'),
        }),
        h(Card, null,
          h(DataTable, {
            columns: effColumns,
            rows: effRows,
            rowKey: (row) => row.item.id,
            empty: t('lessonEfficacyEmpty'),
          })),

        /* 跨会话建议：需要行动，独立成卡 */
        promotable.length > 0
          ? h(Card, { title: t('promoteTitle'), hint: t('promoteHint') },
            h(DataTable, {
              columns: [
                { key: 'text', label: t('colLesson'), render: (row) => { const hit = lessons.find((entry) => entry.id === row.id); return h('span', { className: 'lx-cell-main' }, String(hit?.action ?? row.text ?? (String(row.tool ?? '') + ' · ' + String(row.code ?? ''))).slice(0, 80)); } },
                { key: 'sessions', label: t('colSessions'), align: 'right', className: 'lx-cell-num', render: (row) => int(row.sessions ?? 0) },
                {
                  key: 'act',
                  label: '',
                  align: 'right',
                  render: (row) => h('div', { className: 'lx-actions' }, [
                    h('button', { key: 'p', type: 'button', className: 'lg-btn lg-btn-primary', disabled: busy !== '', onClick: () => onPromote(row.id, 'global') }, t('shareGlobal')),
                    h('button', { key: 'd', type: 'button', className: 'lg-btn lg-btn-ghost', onClick: () => onDetail(t('lifeTitle'), { limit: 100 }) }, t('detailOpen')),
                  ]),
                },
              ],
              rows: promotable,
              rowKey: (row) => row.id,
              empty: t('promoteNone'),
            }))
          : null,

        /* 折叠：归因明细 / 疗效为负 / 事实与技能 */
        h(Collapsible, { title: t('detailTitle') },

          attribution !== null && Number((attribution.totals ?? {}).lessons ?? 0) > 0
            ? h('div', { className: 'lx-section' },
                h('div', { className: 'lx-section-title' }, t('attrTitle')),
                h('div', { className: 'lx-section-actions' }, [
                  h('span', { key: 'l', className: 'lg-card-hint' }, t('attrLessons') + ' ' + int((attribution.totals ?? {}).lessons ?? 0)),
                  h('span', { key: 'b', className: 'lg-card-hint' }, t('attrBefore') + ' ' + int((attribution.totals ?? {}).before ?? 0)),
                  h('span', { key: 'a', className: 'lg-card-hint' }, t('attrAfter') + ' ' + int((attribution.totals ?? {}).after ?? 0)),
                  h('button', { key: 'd', type: 'button', className: 'lg-btn lg-btn-ghost', disabled: busy !== '', onClick: () => onFailures(t('detailFailures')) }, t('detailOpen')),
                ]))
            : null,

          regressions.length > 0
            ? h('div', { className: 'lx-section' },
                h('div', { className: 'lx-section-title' }, t('regressTitle')),
                h('div', { className: 'lx-section-actions' }, regressions.map((row, index) =>
                  h('span', { key: index, className: 'lg-card-hint' }, String(row.tool ?? '') + ' ' + String(row.code ?? '') + ' ' + int(row.before ?? 0) + '→' + int(row.after ?? 0)))))
            : null,

          facts.length > 0
            ? h('div', { className: 'lx-section' },
                h('div', { className: 'lx-section-title' }, t('liveFacts')),
                h('div', { className: 'lx-section-actions' }, [
                  h('span', { key: 'n', className: 'lg-card-hint' }, int(facts.length) + ' ' + t('times')),
                  h('button', { key: 'd', type: 'button', className: 'lg-btn lg-btn-ghost', onClick: () => onDetail(t('liveFacts'), { kind: 'fact', limit: 100 }) }, t('detailOpen')),
                ]))
            : null,

          skills.length > 0
            ? h('div', { className: 'lx-section' },
                h('div', { className: 'lx-section-title' }, t('liveSkills')),
                h('div', { className: 'lx-section-actions' }, [
                  h('span', { key: 'n', className: 'lg-card-hint' }, int(skills.length) + ' ' + t('times')),
                  h('button', { key: 'd', type: 'button', className: 'lg-btn lg-btn-ghost', onClick: () => onDetail(t('liveSkills'), { kind: 'skill', limit: 100 }) }, t('detailOpen')),
                ]))
            : null,

          lessons.length === 0 && facts.length === 0 && skills.length === 0
            ? h('div', { className: 'lx-table-empty' }, t('noInsights'))
            : null),
      );
    }

    function Panel({ t, sessionId }) {
      const context = { sessionId: typeof sessionId === 'string' ? sessionId : '', workspaceId: '' };
      const { data, error, loading, refreshing, lastLoadedAt, reload } = useOverview(context);
      const usageRef = React.useRef(null);
      if (usageRef.current === null) usageRef.current = readUsage();
      const usage = usageRef.current;
      const [tab, setTab] = React.useState(initialTab([
        { id: 'overview' },
        { id: 'memory' },
        { id: 'evolution' },
      ]));
      const chooseTab = (next) => {
        const tabs = { ...readUsage().tabs, [next]: Number(readUsage().tabs?.[next] ?? 0) + 1 };
        writeUsage({ tabs, lastTab: next });
        setTab(next);
      };
      const [busy, setBusy] = React.useState('');
      // 权威状态来自后端（meta 持久化后回传），刷新/重启后开关不回弹
      const [semanticOn, setSemanticOn] = React.useState(data?.injection?.semantic === true);
      const [settingsOpen, setSettingsOpen] = React.useState(false);
      const rootRef = React.useRef(null);

      // 视图切换复用了宿主的滚动容器：聊天一直停在最底部，
      // 切到灵犀时那个 scrollTop 被继承，面板一进来就停在底部。
      // 进入面板（挂载）时，把面板自身与最近的可滚动祖先归零。
      React.useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        const resetOnce = () => {
          const node = rootRef.current;
          if (node === null || node === undefined) return;
          if (node.scrollTop !== 0) node.scrollTop = 0;
          let parent = node.parentElement;
          let guard = 0;
          while (parent !== null && parent !== undefined && guard < 12) {
            const style = window.getComputedStyle(parent);
            const scrollable = /(auto|scroll|overlay)/.test(style.overflowY)
              && parent.scrollHeight > parent.clientHeight + 1;
            if (scrollable) {
              if (parent.scrollTop !== 0) parent.scrollTop = 0;
              break;
            }
            parent = parent.parentElement;
            guard += 1;
          }
        };
        resetOnce();
        // 首次挂载时内容还是骨架屏，摸不到高度；数据到达后再补一次。
        const timer = setTimeout(resetOnce, 300);
        return () => clearTimeout(timer);
      }, []);
      // 浮层提示队列：每条自动消失，也可手动关。
      const [toasts, setToasts] = React.useState([]);
      const toastSeq = React.useRef(0);
      const pushToast = React.useCallback((kind, text, title) => {
        toastSeq.current += 1;
        const id = toastSeq.current;
        setToasts((current) => [...current, { id, kind, text: String(text ?? ''), title: String(title ?? '') }].slice(-4));
        const ttl = kind === 'error' ? 12000 : 5000;
        setTimeout(() => { setToasts((current) => current.filter((item) => item.id !== id)); }, ttl);
      }, []);
      const dismissToast = React.useCallback((id) => {
        setToasts((current) => current.filter((item) => item.id !== id));
      }, []);

      // 所有 setNotice 调用自动弹浮层：一次改动覆盖全部提示点，
      // 同时保留内嵌 banner（用于"数据陈旧"这类常驻状态）。
      const setNotice = React.useCallback((next) => {
        setNoticeState(next);
        if (next !== null && next !== undefined && next.text !== undefined) {
          pushToast(next.kind ?? 'ok', next.text, next.title ?? '');
        }
      }, [pushToast]);
      React.useEffect(() => {
        if (data?.injection?.semantic !== undefined) setSemanticOn(data.injection.semantic === true);
        // 复盘模型来自后端持久化，刷新后要能读回来
        const savedReview = data?.injection?.reviewModel ?? null;
        const nextReview = savedReview === null ? '' : String(savedReview.provider ?? '') + '|' + String(savedReview.model ?? '');
        setReviewModelChoice((current) => (current === '' ? nextReview : current));
      }, [data?.injection?.semantic]);
      const [semanticChoice, setSemanticChoice] = React.useState('');
      const [semanticOptions, setSemanticOptions] = React.useState(null);
      const [reviewModelChoice, setReviewModelChoice] = React.useState('');
      // 记忆页的复盘模型下拉与设定抽屉共用同一份 provider 目录
      const modelPairsForTabs = React.useMemo(
        () => buildModelPairs(semanticOptions ?? data, t),
        [semanticOptions, data, t],
      );

      React.useEffect(() => {
        requestJson('lingxi/semantic/options').then((body) => {
          if (body.ok !== true) return;
          setSemanticOptions(body);
          const saved = body.saved ?? data?.injection?.semanticModel ?? null;
          const next = saved === null ? '' : String(saved.provider ?? '') + '|' + String(saved.model ?? '');
          // 只在首次回填，避免轮询覆盖用户正在浏览的选择
          setSemanticChoice((current) => (current === '' ? next : current));
        }).catch(() => {});
        // 依赖轮询时间戳：用户改了模型配置后，30 秒内列表自动跟随（无需刷新页面）
      }, [lastLoadedAt]);

      const [reviewState, setReviewState] = React.useState(null);
      const [reviewPicked, setReviewPicked] = React.useState({});
      const [reviewProgress, setReviewProgress] = React.useState(null);

      const runReview = () => run('review', async () => {
        // 复盘在后台跑：先拿回执，再轮询进度，用户能看到审查到第几条。
        setReviewProgress({ done: 0, total: 0, elapsedMs: 0 });
        const body = await postJson('lingxi/memory/review', {});
        if (body.ok !== true) {
          setReviewProgress(null);
          if (body.error === 'no-model' || body.error === 'semantic-disabled') {
            setNotice({ kind: 'error', text: t('reviewNoModel') });
            return t('reviewNoModel');
          }
          setNotice({ kind: 'error', text: String(body.error ?? '') });
          return t('reviewNone');
        }
        let state = body;
        // 最多等约 5 分钟，期间持续刷新进度。
        // finally 里清进度：轮询一旦出错也要把"正在准备"收掉，不能让它永久挂着。
        try {
          for (let i = 0; i < 250; i += 1) {
            if (state.running !== true) break;
            setReviewProgress({
              done: Number(state.done ?? 0),
              total: Number(state.total ?? 0),
              elapsedMs: Number(state.elapsedMs ?? 0),
            });
            await new Promise((resolve) => setTimeout(resolve, 1200));
            state = await getJson('lingxi/memory/review');
          }
        } finally {
          setReviewProgress(null);
        }
        const suggestions = Array.isArray(state.suggestions) ? state.suggestions : [];
        setReviewState({ suggestions, scanned: Number(state.scanned ?? 0), error: String(state.error ?? '') });
        // 默认勾选所有需要变更的项（保留项无需处理）
        const picked = {};
        for (const item of suggestions) {
          if (item.verdict === 'reclass' || item.verdict === 'drop') picked[item.id] = true;
        }
        setReviewPicked(picked);
        await reload(true);
        if (suggestions.length === 0) {
          setNotice({ kind: 'ok', text: t('reviewNone') });
          return t('reviewNone');
        }
        return t('reviewScanned').replace('{n}', int(state.scanned ?? 0));
      });

      const applyReview = () => run('reviewApply', async () => {
        const items = (reviewState?.suggestions ?? [])
          .filter((item) => reviewPicked[item.id] === true)
          .map((item) => ({ id: item.id, verdict: item.verdict, kind: item.kind }));
        if (items.length === 0) {
          setNotice({ kind: 'error', text: t('reviewNoneSelected') });
          return t('reviewNoneSelected');
        }
        const body = await postJson('lingxi/memory/review/apply', { items });
        setNotice({ kind: body.ok === true ? 'ok' : 'error', text: t('reviewApplied').replace('{r}', int(body.reclassed ?? 0)).replace('{d}', int(body.dropped ?? 0)) });
        setReviewState(null);
        setReviewPicked({});
        await reload(true);
        return t('confirmed');
      });

      // 测试当前模型：失败时弹浮层（用户能直接看到的弹窗形态）。
      const semanticTest = () => run('semanticTest', async () => {
        const body = await postJson('lingxi/semantic/probe', {});
        const selected = body?.selected ?? null;
        if (selected !== null && selected.ok === true) {
          setNotice({ kind: 'ok', text: t('semanticTestOk') + ' · ' + String(selected.text ?? '').slice(0, 40) });
          return t('semanticTestOk');
        }
        const reason = semanticReason(selected?.error ?? body?.error ?? 'empty-reply', t);
        setNotice({
          kind: 'error',
          title: t('semanticTestTitle'),
          text: reason + ' · ' + t('semanticCheckHint'),
        });
        return t('semanticTestTitle');
      });

      const semanticDiag = () => run('semanticDiag', async () => {
        const body = await postJson('lingxi/semantic/probe', {});
        const attempts = Array.isArray(body.attempts) ? body.attempts : [];
        const rows = attempts.map((entry) => ({
          title: (String(entry.text ?? '') !== '' ? '✓ ' : '✗ ') + String(entry.provider),
          meta: String(entry.text ?? '') !== '' ? String(entry.text) : String(entry.error ?? t('semanticIdle')),
        }));
        const working = Array.isArray(body.working) ? body.working : [];
        setDetail({
          title: t('semanticDiagTitle'),
          subtitle: working.length === 0 ? t('semanticDiagNone') : working.join(', '),
          rows,
        });
        if (body.ok !== true) {
          setNotice({ kind: 'error', text: t('semanticCheckFail').replace('{reason}', String(body.selected?.error ?? 'empty-reply')) });
        }
        return t('confirmed');
      });

      // 自动复盘开关：写进 settings 并持久化。
      const autoReviewConfig = (next) => run('autoReview', async () => {
        await postJson('lingxi/injection/config', { autoReview: next === true });
        await reload(true);
        return t('confirmed');
      });

      // 复盘模型：独立于语义召回的开关与选择。
      const reviewModelConfig = (value) => run('reviewModel', async () => {
        const sep = String(value ?? '').indexOf('|');
        const provider = sep < 0 ? '' : String(value).slice(0, sep);
        const model = sep < 0 ? '' : String(value).slice(sep + 1);
        const picked = provider === '' || model === '' ? null : { provider, model };
        await postJson('lingxi/injection/config', { reviewModel: picked });
        setReviewModelChoice(picked === null ? '' : provider + '|' + model);
        await reload(true);
        return t('confirmed');
      });

      const semanticChoiceConfig = (picked) => run('semanticModel', async () => {
        await postJson('lingxi/injection/config', { semanticModel: picked });
        setSemanticChoice(picked === null ? '' : String(picked.provider) + '|' + String(picked.model));
        return t('confirmed');
      });
      const [notice, setNoticeState] = React.useState(null);
      const [detail, setDetail] = React.useState(null);

      const openDetail = async (title, params, subtitle) => {
        setDetail({ title, subtitle, loading: true, items: [] });
        try {
          const query = Object.entries(params ?? {}).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(String(v))).join('&');
          const body = await requestJson('lingxi/memory/list' + (query === '' ? '' : '?' + query));
          setDetail({ title, subtitle, loading: false, items: body.items ?? [], error: body.ok === false ? body.error : undefined, onDelete: deleteOne, onLife: openLife });
        } catch (err) {
          setDetail({ title, subtitle, loading: false, items: [], error: err instanceof Error ? err.message : String(err) });
        }
      };

      const openReset = () => setDetail({ title: t('resetTitle'), confirm: true, onRestore: openBackups });

      const openLife = (record) => {
        const rows = [];
        rows.push({ title: t('lifeStatus').replace('{s}', String(record.status ?? '')) });
        rows.push({ title: t('lifeCreated').replace('{t}', relTime(Number(record.createdAt ?? 0), t)) });
        rows.push({ title: t('lifeUpdated').replace('{t}', relTime(Number(record.updatedAt ?? 0), t)) });
        rows.push({ title: t('lifeUsage').replace('{h}', int(record.hitCount ?? 0)).replace('{m}', int(record.missCount ?? 0)) });
        rows.push({ title: t('lifeEvidence').replace('{n}', int(record.evidence ?? 0)) });
        if (String(record.retireReason ?? '') !== '') {
          rows.push({ title: t('lifeRetireReason').replace('{s}', String(record.retireReason)) });
        }
        if (String(record.demoteReason ?? '') !== '') {
          rows.push({ title: t('lifeDemoteReason').replace('{s}', String(record.demoteReason)) });
        }
        if (Number(record.resurrections ?? 0) > 0) {
          rows.push({ title: t('lifeResurrections').replace('{n}', int(record.resurrections)) });
        }
        const provenance = Array.isArray(record.provenance) ? record.provenance : [];
        if (provenance.length === 0) rows.push({ title: t('lifeNone') });
        for (const entry of provenance) {
          rows.push({
            title: t('lifeProvenance').replace('{s}', String(entry.source ?? '')).replace('{t}', relTime(Number(entry.at ?? 0), t)),
            meta: entry.excerpt === undefined ? undefined : String(entry.excerpt).slice(0, 80),
          });
        }
        setDetail({ title: t('lifeTitle'), subtitle: record.text, loading: false, items: [], rows });
      };

      const purge = (filter, dryRun) => run('purge', async () => {
        const body = await postJson('lingxi/memory/purge', { filter, dryRun });
        const report = body.report ?? {};
        if (dryRun === true) {
          return t('purgePreviewDone').replace('{n}', int(report.wouldRemove ?? 0)).replace('{left}', int(report.remaining ?? 0));
        }
        const message = t('purgeDone').replace('{n}', int(report.removed ?? 0)).replace('{left}', int(report.remaining ?? 0));
        if ((report.removed ?? 0) > 0) await showUndo(t('undoHint'));
        return message;
      });

      const repairStore = () => run('repair', async () => {
        try {
          const preview = await postJson('lingxi/memory/repair', { dryRun: true });
          const plan = preview.plan ?? {};
          const fixes = Array.isArray(plan.textFixes) ? plan.textFixes.length : 0;
          const drops = Array.isArray(plan.duplicateRetires) ? plan.duplicateRetires.length : 0;
          if (fixes === 0 && drops === 0) return t('auditPass');
          setDetail({
            title: t('repairTitle'),
            subtitle: t('repairPreview').replace('{t}', int(fixes)).replace('{d}', int(drops)),
            confirm: true,
            confirmHint: t('repairHint'),
            confirmActions: [
              {
                label: t('repairTitle'),
                onClick: () => run('repair:apply', async () => {
                  const body = await postJson('lingxi/memory/repair', {});
                  const report = body.report ?? {};
                  setDetail(null);
                  return t('repairDone').replace('{t}', int(report.rewritten ?? 0)).replace('{d}', int(report.retired ?? 0));
                }),
              },
            ],
          });
          return t('repairPreview').replace('{t}', int(fixes)).replace('{d}', int(drops));
        } catch (error) {
          return error instanceof Error ? error.message : String(error);
        }
      });

      const migrateStorage = () => run('migrate', async () => {
        const dir = String(storageDir ?? '').trim();
        if (dir === '') return t('storageNew') + '?';
        const preview = await postJson('lingxi/memory/storage/migrate', { dir, dryRun: true });
        setDetail({
          title: t('storageTitle'),
          subtitle: t('storageHint'),
          confirm: true,
          confirmHint: t('storageCurrent').replace('{dir}', data?.storage?.dir ?? ''),
          confirmActions: [
            {
              label: t('storageMigrate'),
              onClick: () => run('migrate:apply', async () => {
                const body = await postJson('lingxi/memory/storage/migrate', { dir });
                  setDetail(null);
                  return body.ok === false ? String(body.error) : t('storageDone').replace('{dir}', body.report?.target ?? dir);
                }),
              },
            ],
          });
        return t('storageTitle');
      });

      const auditStore = () => run('audit', async () => {
        try {
          const body = await postJson('lingxi/diagnostics/audit', {});
          const lines = Array.isArray(body.lines) ? body.lines : [];
          setDetail({
            title: t('auditTitle'),
            subtitle: body.ok === true ? t('auditPass') : t('auditFail'),
            rows: lines.map((line, index) => ({ title: String(line), key: 'line-' + index })),
          });
          return body.ok === true ? t('auditPass') : t('auditFail');
        } catch (error) {
          return error instanceof Error ? error.message : String(error);
        }
      });

      const showSamples = (list) => {
        const rows = (Array.isArray(list) ? list : []).map((sample) => ({
          title: String(sample.sessionId ?? '').slice(0, 12) + ' · ' + int(sample.chars ?? 0) + ' 字符 / ' + int(sample.records ?? 0) + ' 条',
          meta: String(sample.text ?? ''),
        }));
        setDetail({ title: t('injectSamplesTitle'), subtitle: t('injectSamplesHint'), rows });
      };

      const selfcheck = () => run('selfcheck', async () => {
        setNotice({ kind: 'ok', text: t('selfcheckRunning') });
        const body = await postJson('lingxi/diagnostics/selfcheck', {});
        const suites = body.suites ?? [];
        const failed = suites.filter((suite) => suite.ok !== true);
        setDetail({
          title: t('selfcheckTitle'),
          subtitle: body.ok === true ? t('selfcheckPass').replace('{n}', int(suites.length)).replace('{ms}', int(body.ms ?? 0)) : t('selfcheckFail').replace('{n}', int(failed.length)),
          rows: suites.map((suite) => ({
            title: (suite.ok === true ? '✓ ' : '✗ ') + String(suite.name),
            meta: [String(suite.detail ?? '')],
          })),
        });
        return body.ok === true ? t('selfcheckPass').replace('{n}', int(suites.length)).replace('{ms}', int(body.ms ?? 0)) : t('selfcheckFail').replace('{n}', int(failed.length));
      });

      const exportAll = () => run('export', async () => {
        const body = await requestJson('lingxi/memory/export');
        const data = body.data ?? { records: [] };
        const text = JSON.stringify(data, null, 2);
        const blob = new Blob([text], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'lingxi-memory-' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        return t('exportDone').replace('{n}', int(data.records?.length ?? 0));
      });

      const importAll = async (parsed) => {
        try {
          const preview = await postJson('lingxi/memory/import', { data: parsed, dryRun: true });
          if (preview.ok === false) {
            importError(preview.error === 'version-mismatch' ? t('importVersion') : String(preview.error));
            return;
          }
          const report = preview.report ?? {};
          setDetail({
            title: t('importTitle'),
            subtitle: t('importPreview')
              .replace('{i}', int(report.imported ?? 0))
              .replace('{s}', int(report.skipped ?? 0)),
            confirm: true,
            confirmHint: t('importHint'),
            confirmActions: [
              {
                label: t('importConfirm'),
                onClick: () => run('import', async () => {
                  const body = await postJson('lingxi/memory/import', { data: parsed });
                  const done = body.report ?? {};
                  setDetail(null);
                  return t('importDone')
                    .replace('{i}', int(done.imported ?? 0))
                    .replace('{s}', int(done.skipped ?? 0));
                }),
              },
            ],
          });
        } catch (error) {
          importError(error instanceof Error ? error.message : String(error));
        }
      };

      const importError = (message) => setNotice({ kind: 'error', text: t('importFailed').replace('{error}', message) });

      const deleteOne = (id) => run('delete:' + id, async () => {
        const body = await postJson('lingxi/memory/delete', { ids: [id] });
        setDetail(null);
        const message = t('purgeDeleteDone').replace('{n}', int(body.report?.removed ?? 0));
        if ((body.report?.removed ?? 0) > 0) await showUndo(t('undoHint'));
        return message;
      });

      const doRestore = (file) => run('restore', async () => {
        const body = await postJson('lingxi/memory/restore', { file });
        setDetail(null);
        return t('restoreDone').replace('{n}', int(body.report?.restored ?? 0));
      });

      async function showUndo(note) {
        try {
          const body = await requestJson('lingxi/memory/backups');
          const items = body.items ?? [];
          if (items.length === 0) {
            setDetail({ title: t('undoTitle'), subtitle: note, loading: false, items: [], rows: [] });
            return;
          }
          const exact = {
            title: t('undoExact'),
            meta: note,
            action: {
              label: t('restoreRun'),
              onClick: () => run('undo', async () => {
                const result = await postJson('lingxi/memory/undo-delete', {});
                const restored = result.report?.restored ?? 0;
                setDetail(null);
                return restored > 0 ? t('undoExactDone').replace('{n}', int(restored)) : t('undoExactNone');
              }),
            },
          };
          const rows = [exact, ...items.slice(0, 3).map((entry) => ({
            title: String(entry.file),
            meta: Math.max(1, Math.round(Number(entry.size ?? 0) / 1024)) + ' KB · ' + relTime(Number(entry.at ?? 0), t),
            action: { label: t('restoreRun'), onClick: () => doRestore(String(entry.file)) },
          }))];
          setDetail({ title: t('undoTitle'), subtitle: note, loading: false, items: [], rows });
        } catch {
          setDetail({ title: t('undoTitle'), subtitle: note, loading: false, items: [], rows: [] });
        }
      }

      async function openBackups() {
        setDetail({ title: t('restoreTitle'), subtitle: t('restoreHint'), loading: true, items: [] });
        try {
          const body = await requestJson('lingxi/memory/backups');
          const rows = (body.items ?? []).map((entry) => ({
            title: String(entry.file),
            meta: Math.max(1, Math.round(Number(entry.size ?? 0) / 1024)) + ' KB · ' + relTime(Number(entry.at ?? 0), t),
            action: { label: t('restoreRun'), onClick: () => doRestore(String(entry.file)) },
          }));
          setDetail({ title: t('restoreTitle'), subtitle: t('restoreHint'), loading: false, items: [], rows });
        } catch (err) {
          setDetail({ title: t('restoreTitle'), loading: false, items: [], rows: [], error: err instanceof Error ? err.message : String(err) });
        }
      }

      const openFailures = (title) => {
        const top = data?.efficacy?.failures?.top ?? [];
        setDetail({
          title,
          subtitle: t('detailFailures') + ' · ' + int(top.length),
          loading: false,
          items: [],
          rows: top.map((entry) => ({
            title: String(entry.key).replace(/\|/g, ' · '),
            meta: int(entry.count) + ' 次' + (entry.first > 0 ? ' · 首次 ' + relTime(entry.first, t) : '') + (entry.last > 0 ? ' · 最近 ' + relTime(entry.last, t) : ''),
            side: int(entry.count),
          })),
        });
      };

      const doReset = (mode) => run('reset', async () => {
        const body = await postJson('lingxi/memory/reset', { mode });
        const report = body.report ?? {};
        setDetail(null);
        const message = t('resetDone').replace('{n}', int(report.removed ?? 0)).replace('{left}', int(report.remaining ?? 0));
        await showUndo(t('undoHint'));
        return message;
      });

      const derived = data?.derived ?? null;
      const memory = data?.memory ?? null;
      const health = memory?.health ?? null;
      const gate = derived?.gate ?? null;

      const run = async (label, action) => {
        setBusy(label);
        try {
          const message = await action();
          if (typeof message === 'string') setNotice({ kind: 'ok', text: message });
          await reload(true);
        } catch (err) {
          setNotice({ kind: 'error', text: err instanceof Error ? err.message : String(err) });
        } finally {
          setBusy('');
        }
      };

      const consolidate = () => run('consolidate', async () => {
        const body = await postJson(`${MEMORY}/consolidate`, {});
        const report = body.report ?? {};
        return t('consolidateDone').replace('{merged}', int(report.merged)).replace('{dormanted}', int(report.dormanted)).replace('{retired}', int(report.retired));
      });

      const decide = (id, decision) => run(id, async () => {
        await postJson(`${MEMORY}/confirm`, { id, decision });
        return decision === 'accept' ? t('confirmed') : t('ignored');
      });

      const promote = (id, sharing) => run('promote:' + id, async () => {
        await postJson(`${MEMORY}/promote`, { id, sharing });
        return t('confirmed');
      });

      const forget = (id) => run('forget:' + id, async () => {
        await postJson(`${MEMORY}/confirm`, { id, decision: 'retire' });
        return t('ignored');
      });

      const seedSuggestion = (item) => run('seed:' + item.key, async () => {
        await postJson('lingxi/memory/suggest', { tool: item.tool, code: item.code, count: item.count });
        return t('effSeeded');
      });

      const hygieneNow = () => run('hygiene', async () => {
        const body = await postJson(`${MEMORY}/hygiene`, {});
        const report = body.report ?? {};
        return t('hygieneDone')
          .replace('{q}', int(report.quarantined ?? 0))
          .replace('{e}', int(report.evicted ?? 0))
          .replace('{m}', int(report.merged ?? 0))
          .replace('{u}', int(report.upgraded ?? 0));
      });

      const semanticConfig = (next) => run('semantic', async () => {
        const body = await postJson('lingxi/injection/config', { semantic: next === true });
        setSemanticOn(next === true);
        await reload(true);
        // 开启时后端会当场探一次模型；返回空就立刻说清楚，而不是让它静默降级。
        const check = body?.semanticCheck ?? null;
        if (next === true && check !== null && check.ok !== true) {
          setNotice({
            kind: 'error',
            text: t('semanticCheckFail').replace('{reason}', semanticReason(check.error, t)) + ' · ' + t('semanticCheckHint'),
          });
        } else if (next === true && check !== null && check.ok === true) {
          setNotice({ kind: 'ok', text: t('semanticCheckOk').replace('{text}', String(check.text ?? '')) });
        }
        return next === true ? t('confirmed') : t('confirmed');
      });

      const injectionConfig = (patch) => run('injection', async () => {
        await postJson('lingxi/injection/config', patch);
        return t('confirmed');
      });

      let body;
      if (loading && data === null) body = h(Skeleton);
      else if (error !== null && data === null) {
        body = h('div', { className: 'lg-card' },
          h('div', { className: 'lg-status lg-status-error' }, `${t('loadFailed')} · ${error}`),
          h('div', { style: { marginTop: 12 } },
            h('button', { type: 'button', className: 'lg-btn', onClick: () => reload(true) }, t('retry'))));
      } else if (data !== null) {
        if (tab === 'memory') body = h(MemoryTab, { t, memory, busy, context, injection: data.injection, onDecide: decide, onPromote: promote, onForget: forget, onInjection: injectionConfig, onHygiene: hygieneNow, onDetail: openDetail, onReset: openReset, onPurge: purge, onExport: exportAll, onImport: importAll, onImportError: importError, search: data.search, onSelfcheck: selfcheck, onDeleteOne: deleteOne, onAudit: auditStore, onRepair: repairStore, storage: data.storage, onMigrate: migrateStorage, semantic: semanticOn, onSemantic: semanticConfig, onSemanticChoice: semanticChoiceConfig, semanticChoice, setSemanticChoice, semanticOptions, semanticStats: data.semanticStats, onSeed: seedSuggestion, onReview: runReview, onApplyReview: applyReview, reviewState, reviewPicked, setReviewPicked,
onReviewModel: reviewModelConfig, reviewModelChoice,
modelPairs: modelPairsForTabs, reviewModelUsed: data.reviewModelUsed, reviewProgress, autoReview: data.autoReview, autoReviewDays: data.autoReviewDays, autoReviewLastAt: Number(data?.review?.at ?? 0), onAutoReview: autoReviewConfig });
        else if (tab === 'evolution') body = h(EvolutionTab, { t, derived: data.derived, efficacy: data.efficacy, memory: data.memory, injection: data.injection, busy, onDecide: decide, onPromote: promote, onDetail: openDetail, onFailures: openFailures });
        else body = h(OverviewTab, {
          t,
          derived,
          memory,
          live: data.live,
          injection: data.injection,
          efficacy: data.efficacy,
          evolution: data.evolution,
          scenes: data.scenes,
          onDetail: openDetail,
          onFailures: openFailures,
          quality: data.quality,
          selfcheck: data.selfcheck ?? null,
          auditState: data.audit ?? null,
          alerts: data.alerts ?? [],
          samples: data.samples ?? [],
          onShowSamples: showSamples,
          busy,
          onSeed: seedSuggestion,
          onSelfcheck: selfcheck,
        });
      } else {
        body = h(Empty, { icon: 'spark', title: t('noInsights') });
      }

      return h('div', { className: 'lg-root', ref: rootRef },
        h('div', { className: 'lg-shell' },
          h('header', { className: 'lg-header' },
            h('div', null,
              h('div', { className: 'lg-eyebrow' }, t('eyebrow')),
              h('h1', { className: 'lg-title' }, t('title')),
              h('p', { className: 'lg-subtitle' }, t('subtitle'))),
            h('div', { className: 'lg-actions' },
              h('span', {
                className: 'lg-pill lg-pill-dot',
                title: gate?.enabled === true ? t('injectRunning') : t('injectPaused'),
                'aria-label': gate?.enabled === true ? t('injectRunning') : t('injectPaused'),
              },
                h('span', { className: `lg-dot ${gate?.enabled === true ? 'lg-dot-ok' : 'lg-dot-warn'}` })),

              h('button', {
                type: 'button',
                className: 'lg-iconbtn',
                title: t('settingsTitle'),
                'aria-label': t('settingsTitle'),
                onClick: () => setSettingsOpen(true),
              }, h(Icon, { name: 'settings' })),
              h('button', {
                type: 'button',
                className: 'lg-iconbtn',
                title: refreshing ? t('refreshing') : t('refresh'),
                'aria-label': t('refresh'),
                disabled: refreshing,
                onClick: () => reload(true),
              }, h('span', { className: refreshing ? 'lg-spin' : undefined }, h(Icon, { name: 'refresh' }))))),

          // 状态条：一屏看懂系统状态，每个数字可点开明细
          h(StatBar, {
            items: [
              { label: t('statTotal'), value: int(health?.total ?? 0), onClick: () => openDetail(t('detailAll'), { limit: 100 }) },
              { label: t('statActive'), value: int(health?.byStatus?.active ?? 0), onClick: () => openDetail(t('detailActive'), { status: 'active', limit: 100 }) },
              { label: t('hygieneProven'), value: int(memory?.hygiene?.proven ?? 0), tone: 'ok' },
              {
                label: t('statCoverage'),
                value: (data?.efficacy?.failures?.coverage?.total ?? 0) === 0
                  ? '—'
                  : int(data.efficacy.failures.coverage.covered) + '/' + int(data.efficacy.failures.coverage.total),
                tone: data?.efficacy?.failures?.coverage?.ratio === 1 ? 'ok' : undefined,
              },
              {
                label: t('statFeedback'),
                // 反馈率 = 显式纠错 + 质疑式反馈；两者都已是百分数，不再乘 100
                value: data?.efficacy?.failures?.corrections === undefined || data?.efficacy?.failures?.corrections === null
                  ? '—'
                  : String(data.efficacy.failures.corrections.feedbackPer100 ?? data.efficacy.failures.corrections.ratePer100) + '%',
                hint: t('statFeedbackHint'),
              },
              {
                label: t('statAlerts'),
                value: int((data?.alerts ?? []).length),
                tone: (data?.alerts ?? []).length > 0 ? 'warn' : 'ok',
                onClick: () => {
                  const list = Array.isArray(data?.alerts) ? data.alerts : [];
                  setDetail({
                    title: t('statAlerts'),
                    subtitle: list.length === 0 ? t('alertNone') : t('alertCount').replace('{n}', int(list.length)),
                    rows: list.map((alert, index) => ({
                      title: String(alert.kind ?? '') + ' · ' + int(alert.count ?? 0),
                      meta: String(alert.detail ?? ''),
                      key: 'alert-' + index,
                    })),
                  });
                },
              },
            ],
          }),

          notice !== null
            ? h('div', { className: 'lg-toast' + (notice.kind === 'error' ? ' lg-toast-error' : '') }, notice.text)
            : null,

          data !== null && data.sections !== undefined && Object.keys(data.sections).length > 0
            ? h('div', { className: 'lg-toast lg-toast-error' },
                t('sectionsFailed') + ' · ' + Object.entries(data.sections).map(([key, value]) => key + ': ' + value).join(' | '))
            : null,

          data !== null && data.offlineSnapshot === true
            ? h('div', { className: 'lg-toast' }, t('snapshotBanner'))
            : null,

          data !== null && error !== null
            ? h('div', { className: 'lg-toast lg-toast-error' },
                t('refreshFailed').replace('{error}', error) + (lastLoadedAt > 0 ? ' · ' + t('staleSince').replace('{time}', relTime(lastLoadedAt, t)) : ''))
            : null,

          h(Segmented, {
            value: tab,
            options: orderTabs([
              { id: 'overview', label: t('tabOverview') },
              { id: 'memory', label: t('tabMemory'), count: memory?.pendingTotal ?? 0 },
              { id: 'evolution', label: t('tabEvolution'), count: derived?.lessons?.length ?? 0 },
            ]),
            onChange: chooseTab,
          }),

          body,

          h(ToastHost, { toasts, onDismiss: dismissToast }),

          h(SettingsDrawer, {
            t,
            open: settingsOpen,
            onClose: () => setSettingsOpen(false),
            busy,
            data,
            actions: {
              onInjection: injectionConfig,
              onSemantic: semanticConfig,
              onSemanticChoice: semanticChoiceConfig,
              onMigrate: migrateStorage,
              onAudit: auditStore,
              onConsolidate: consolidate,
              onSemanticDiag: semanticDiag,
              onSemanticTest: semanticTest,
              onRepair: repairStore,
              onSelfcheck: selfcheck,
              onExport: exportAll,
              onReset: openReset,
            },
          }),

          h(Drawer, { t, detail, onClose: () => setDetail(null), onReset: doReset, busy }),

          h('div', { className: 'lg-foot' },
            h('span', null, `${t('memoryLabel')} `),
            h('code', null, memory?.dir ?? '—'),
            lastLoadedAt > 0 ? h('span', null, t('lastLoaded').replace('{time}', relTime(lastLoadedAt, t))) : null)));
    }

    /* ================================================================ 注册 */

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, dicts), 'dsh-lingxi-panel: dictionaries');
        ctx.effect(() => {
          const style = document.createElement('style');
          style.dataset.plugin = PLUGIN_ID;
          style.dataset.pluginCss = `${PLUGIN_ID}/panel`;
          style.textContent = css;
          document.head.appendChild(style);
          return () => style.remove();
        }, 'dsh-lingxi-panel: panel styles');

        const t = ctx.locale.bind(NS);

      // 全局告警浮层：挂在 frame-wide overlay 上，任何界面都能看到。
      ctx.slots.inject('shell.overlay', () => ctx.slots.register({
        name: 'shell.overlay',
        id: 'lingxi-alerts',
        order: 10,
        locale: NS,
        inject: () => ({ t }),
      }, (props) => h(ErrorBoundary, null, h(GlobalAlerts, { t: props?.t ?? t }))));
        ctx.slots.inject('conversation.view', () => ctx.slots.register({
          name: 'conversation.view',
          id: 'lingxi',
          order: 50,
          label: () => t('tab'),
          locale: NS,
          inject: () => ({ t }),
        }, (props) => h(ErrorBoundary, null, h(Panel, {
          t: props?.t ?? t,
          sessionId: typeof props?.sessionId === 'string' ? props.sessionId : '',
        }))));
      },
    };
  },
});

