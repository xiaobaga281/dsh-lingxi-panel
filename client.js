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
        updated: '更新于 {time}',
        memoryLabel: '记忆库',

        tabOverview: '概览',
        tabMemory: '记忆',
        tabEvolution: '进化',

        efficacy: '进化疗效',
        fcr: '首次正确率',
        rr: '复发率',
        chars: '每轮上下文字符',
        before: '之前',
        after: '之后',
        verdict: '结论',
        noEval: '还没有疗效对照：跑一轮评测后这里会出现前后数据。',

        gate: '闸门',
        gateDenials: '已拦下',
        gateFailures: '计数失败',
        gateCalls: '判定次数',
        gateMaxRepeat: '重复上限',
        gateReadBeforeWrite: '读前写校验',
        on: '开',
        off: '关',

        sessions: '会话',
        corrections: '纠正',
        memoryTotal: '记忆',
        memoryPending: '待确认记忆',
        nomPending: '待评审提名',
        conflicts: '冲突对',

        currentProject: '当前项目',
        projectGoal: '目标',
        projectProgress: '进度',
        projectBlocker: '阻塞',
        projectMeta: '{entries} 条记录 · {sessions} 个会话',
        noProject: '还没有项目摘要：再跑几轮会话，灵犀会自己记。',
        insights: '最近洞察',
        noInsights: '还没有洞察。',

        memorySearch: '检索记忆',
        searchPlaceholder: '例如：pwsh 路径报错、面板样式、安装',
        searchEmpty: '输入关键词，看看灵犀记住了什么。',
        noResults: '没有命中。记忆库会随着纠正与复盘继续长。',
        searchAction: '搜索',
        injectLabel: '注入块预览',
        injectHint: '命中 {n} 条，按这个形式进入模型上下文（{chars} 字）。',
        abstainHint: '两路信号都弱：本次不注入记忆，宁可让模型承认不知道。',
        browseTitle: '浏览记忆',
        browseHint: '选状态后打开列表：每行都能看详情、删除（删除可撤销）。',
        browseStatusAll: '全部状态',
        pendingQueue: '待确认记忆',
        pendingHint: '这里只列尚未确认的候选（模型写入的在上面单独一张卡），点头才长期生效。',
        pendingHiddenHint: '另有 {n} 条候选不在这批列表里（历史遗留），可先忽略。',
        noPending: '没有待确认的记忆。',
        accept: '确认',
        retire: '忽略',
        consolidate: '巩固一次',
        consolidating: '正在巩固',
        total: '记忆总量',
        active: '生效',
        avgConfidence: '平均置信',
        size: '库大小',
        kindBreakdown: '分型构成',
        statusBreakdown: '状态构成',
        localOnly: '仅本地',
        injectTitle: '记忆通路',
        injectHint: '每个会话收到你的消息后刷新一次，只注入与本会话相关的记忆；无相关记忆时不注入。',
        injectSessions: '已注入会话',
        injectHits: '命中',
        injectMisses: '证伪',
        injectCaptured: '自动捕获',
        injectChars: '当前字数',
        injectRepeat: '重复失败',
        injectRefined: '加强次数',
        injectTogglePause: '暂停注入',
        injectToggleResume: '恢复注入',
        injectBudget: '预算',
        injectPaused: '注入已暂停',
        injectRunning: '注入运行中',
        snapshotBanner: '数据来自页面启动快照（实时通道不可用）；刷新页面可更新。',
        refreshFailed: '刷新失败：{error}',
        staleSince: '当前显示的是 {time} 的缓存',
        lastLoaded: '上次读取 {time}',
        efficacyTitle: '疗效趋势',
        liveEvolution: '实时进化',
        evolveTitle: '参数进化（UCB1）',
        evolveIdle: '还没有完成一次进化评估：等注入产生足够样本后自动开始。',
        evolveTrials: '评估轮次',
        evolveFitness: '本期得分',
        evolveBest: '当前最优',
        evolveBestMean: '最优均值',
        evolveScenes: '分场景预算',
        sectionsFailed: '部分区块读取失败（其余正常显示）',
        qualityTitle: '注入有效性（关联）',
        qualityHint: '按会话比较「注入了记忆」与「没有注入」的工具失败率；只是关联，不是因果，样本少时仅供参考',
        qualBucketNone: '无注入',
        qualBucketSmall: '≤800 字符',
        qualBucketLarge: '>800 字符',
        qualityInjected: '有注入 · 失败率',
        qualityEmpty: '无注入 · 失败率',
        qualitySessions: '{n} 个会话',
        attrTitle: '学习效果（前后对照）',
        attrHint: '同类失败在教训沉淀前后的次数；窗口太短只作参考',
        attrBefore: '捕获前',
        attrAfter: '捕获后',
        attrNone: '还没有可归因的教训：等自动捕获积累一段时间。',
        attrPerDay: '{n}/天',
        attrDrop: '失败下降',
        attrFewer: '同类失败变少（学习有效）',
        attrMore: '同类失败变多（需改写）',
        attrSame: '持平',
        attrDays: '{n} 天',
        attrTrend: '按天趋势',
        attrDay: '{day}',
        gateTitle: '闸门与纠错',
        gateInjected: '注入次数',
        adviceLow: '低采纳场景：{list}',
        adviceLow: 'low-adoption scenes: {list}',
        advice7d: '近 7 天建议：采纳 {a} · 未采纳 {i}（{r}）',
        adviceAdopted: '建议被采纳',
        adviceIgnored: '建议未采纳',
        adviceLow: '低采纳场景：{list}',
        adviceLow: 'low-adoption scenes: {list}',
        advice7d: 'last 7 days: adopted {a} · ignored {i} ({r})',
        adviceAdopted: 'advice adopted',
        adviceIgnored: 'advice ignored',
        gateWarned: '同轮提示',
        gateWarnEffective: '提示有效',
        sourceModel: '模型写入',
        detailOpen: '看详情',
        detailLoading: '加载中…',
        detailEmpty: '没有条目',
        detailClose: '关闭',
        detailCandidates: '待确认候选',
        detailRetired: '已退役（优胜劣汰）',
        detailLessons: '全部教训',
        detailFacts: '全部约束/事实',
        detailSkills: '全部技能',
        detailCaptured: '自动捕获的教训',
        legendInjected: '浅色 = 注入',
        legendHits: '深色 = 命中',
        lifeOpen: '生命周期',
        lifeTitle: '记忆生命周期',
        lifeCreated: '创建 {t}',
        lifeUpdated: '更新 {t}',
        lifeStatus: '状态 {s}',
        lifeUsage: '命中 {h} · 证伪 {m}',
        lifeEvidence: '证据 {n}',
        lifeRetireReason: '退役原因：{s}',
        lifeDemoteReason: '降级原因：{s}',
        lifeRetireReason: 'Retired because: {s}',
        lifeDemoteReason: 'Demoted because: {s}',
        lifeResurrections: '复活 {n} 次',
        lifeProvenance: '来源 {s}（{t}）',
        lifeNone: '暂无来源记录',
        lessonObserving: '观察中（<1 天）',
        lessonGapFilled: '补缺',
        demoteReasonChip: '降级：{s}',
        resurrectedChip: '复活过',
        promoteTitle: '跨会话复现（建议提升）',
        promoteHint: '同一失败在多个会话里复现，而教训还是私有：提升后别的会话也能直接用。',
        promoteNone: '没有需要提升的教训。',
        promoteWorkspace: '提升到工作区',
        promoteGlobal: '提升到全局',
        promoteCross: '{s} 个会话 · {n} 次失败',
        trendTitle: '复发趋势（Top 场景 · 14 天）',
        trendHint: '柱高=当天该场景失败次数；看尾部是否递减。',
        coverageTitle: '记忆覆盖（反复场景 → 是否已有教训）',
        coverageHint: '高频复发但还没有教训的场景，是最该补的缺口。',
        coverageRatio: '覆盖 {c}/{t}',
        coverageSeed: '生成教训',
        coverageNone: '暂无高频未覆盖场景。',
        loopTitle: '学习闭环',
        loopHint: '写 → 用 → 排 → 汰：每一步都有实测数字，不是口号',
        loopWrite: '写入门控',
        loopUse: '使用反馈',
        loopRank: '排序加权',
        loopPrune: '优胜劣汰',
        loopCandActive: '候选 {c} · 生效 {a}',
        loopRetired: '累计退役 {n}',
        loopHitsMisses: '命中 {h} · 证伪 {m}',
        loopWarn: '同轮提示 {n}',
        loopReliability: '按命中率加权排序',
        loopGuard: '拦截重试 {n}',
        loopHygiene: '最近体检 隔离 {q} · 合并 {mg}',
        loopAutoActivated: '自动转正 {n}',
        loopRegress: '疗效为负 {n}',
        corrTitle: '纠错频率（学习信号）',
        search7d: '近 7 天：{n} 次检索 · 弃答 {r}',
        searchQualityTitle: '检索质量（实时）',
        searchQualityHint: '主动检索的弃答比例：过高说明召回不足，过低要警惕硬凑。',
        searchQuality: '主动检索 {n} 次 · 弃答 {m} 次（{r}）',
        corrScope: '近 7 天纠正 {n} 次 · 影响 {m} 条记忆',
        corrPrecision: '精准度 {n} 条/次（前 7 天 {m}）',
        corrRate: '整体纠错率',
        corrRecent: '近 7 天',
        corrPrevious: '前 7 天',
        corrHint: '显式纠错消息占用户消息的比例；下降说明同类问题在变少。',
        regressTitle: '疗效为负的教训',
        regressHint: '捕获后同类失败反而变多；建议改写或直接淘汰。',
        detailHits: '被采纳过的记忆',
        detailMisses: '被证伪过的记忆',
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
        analyticsTitle: '学习分析（纠错 / 疗效 / 进化 / 质量分档）',
        sysTitle: '系统状态（回归 / 闸门 / 实时）',
        detailTitle: '记忆明细（教训 / 事实 / 技能）',
        opsTitle: '运维工具（清洗 / 卫生 / 体检 / 存储）',
        opsHint: '低频操作收在这里；日常只需要上面的检索、浏览与待确认。',
        browseRefresh: '刷新',
        browseEmpty: '该状态下没有记忆。',
        browseCount: '{n} 条',
        semanticStatsTitle: '语义召回运行情况',
        semanticCalls: '调用 {n} 次 · 成功 {ok} · 失败 {fail} · 超时 {to}',
        semanticLatency: '上次耗时 {ms}ms · 模型 {model}',
        semanticLastExpansion: '最近扩展：{text}',
        semanticIdle: '尚未调用（开启后需有真实对话触发）',
        semanticError: '最近错误：{error}',
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
        purgeHint: '按条件硬删除（不是退役）；执行前自动备份，预览只算数量。',
        purgeStatus: '状态',
        purgeKind: '类型',
        purgeDays: '早于(天)',
        purgeQ: '关键词',
        purgeAll: '全部',
        purgePreview: '预览',
        purgeRun: '执行清洗',
        purgeArmed: '再点一次确认删除',
        purgePreviewDone: '预计删除 {n} 条（剩余 {left} 条）',
        purgeDone: '已删除 {n} 条，剩余 {left} 条（已备份）',
        purgeRemoveOne: '删除',
        purgeDeleteDone: '已删除 {n} 条',
        undoTitle: '可撤销',
        undoHint: '刚刚的删除已备份，点恢复即可回到删除前。',
        undoNone: '没有可用备份。',
        undoRestore: '撤销（恢复最近备份）',
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
        hygieneHint: '可疑隔离、过时淘汰、重复合并、旧文案升级',
        hygieneScan: '扫描',
        hygieneQuarantined: '隔离',
        hygieneEvicted: '淘汰',
        hygieneMerged: '合并',
        hygieneUpgraded: '升级',
        hygieneRun: '立即体检',
        hygieneDone: '体检完成：隔离 {q}、淘汰 {e}、合并 {m}、升级 {u}',
        modelPendingTitle: '模型写入的候选',
        modelPendingHint: '模型用 lingxi_remember 主动记下的条目，确认后才会长期生效。',
        modelPendingNone: '模型还没有主动写入过记忆。',
        sourceHeuristic: '正则猜测',
        sourceFailure: '失败沉淀',
        sourceScan: '扫描提案',
        gateWarnIneffective: '提示无效',
        gateGuardDenied: '拦截重试',
        gateGuardEffective: '拦截后成功',
        gateGuard7d: '近 7 天：拦截 {d} · 有效 {e} · 仍败 {i}',
        gateGuardIneffective: '拦截后仍败',
        gateCaptured: '自动捕获',
        gateRefined: '加强',
        gateRepeat: '重复失败',
        gateHits: '命中',
        gateMisses: '证伪',
        liveLessons: '教训（记忆库）',
        liveFacts: '约束与事实（记忆库）',
        liveSkills: '技能候选（记忆库）',
        noLiveLessons: '记忆库里还没有教训。',
        noLiveFacts: '记忆库里还没有约束或事实。',
        noLiveSkills: '记忆库里还没有技能候选。',
        injectFullText: '查看全文',
        injectFullText: 'Show full text',
        injectSamplesTitle: '最近注入',
        injectSamplesHint: '每个会话最近一次真正进入模型的记忆块',
        injectSamplesEmpty: '还没有注入记录。',
        effRepeatRate: '复发率',
        effFailures: '失败次数',
        effDistinct: '不同场景',
        effInject7: '7 日注入',
        effHits7: '7 日命中',
        effMiss7: '7 日证伪',
        effTrend: '本周 vs 上周',
        effSuggestTitle: '高频反复场景',
        effSeed: '沉淀为记忆',
        effSeeded: '已沉淀',
        effNone: '还没有足够的失败样本：跑一段时间后这里会出现复发率。',
        dayAxis: '近 14 天',
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

        nominationsTitle: '技能提名',
        nomAll: '全部',
        nomEmpty: '还没有技能提名。',
        nomSessions: '{n} 次会话',
        nomRecipe: '{n} 步',
        confHigh: '高信心',
        confMedium: '中信心',
        confLow: '低信心',
        factsTitle: '用户约束与环境事实',
        factsEvidence: '{n} 条证据',
        factsKindConstraint: '约束',
        factsKindPreference: '偏好',
        noTraits: '还没有积累到环境事实。',
        tombs: '遗忘清单',
        tombsHint: '灵犀不再沿用的旧判断',
        deployFacts: '部署事实',
        noFacts: '还没有经你确认的环境事实。',
        lessonsTitle: '进化教训',
        lessonVotes: '{n} 票',
        lessonHits: '命中 {n}',
        lessonMisses: '未中 {n}',
        noLessons: '还没有积累教训。',

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
        liveToolCalls: '工具调用',
        liveToolErrors: '工具失败',
        liveSampled: '抽样最近 {n} 个会话',
        contextNote: '未识别当前会话，仅展示全局记忆。',
      },
      en: {
        tab: 'Lingxi',
        eyebrow: 'LINGXI · SELF-EVOLUTION',
        title: 'Lingxi',
        subtitle: 'Retry gate, environment facts, skill nominations and memory: never repeat the same mistake twice.',
        refresh: 'Refresh',
        refreshing: 'Refreshing',
        updated: 'Updated {time}',
        memoryLabel: 'Memory',

        tabOverview: 'Overview',
        tabMemory: 'Memory',
        tabEvolution: 'Evolution',

        efficacy: 'Efficacy',
        fcr: 'First-call correctness',
        rr: 'Recurrence rate',
        chars: 'Context chars per turn',
        before: 'before',
        after: 'after',
        verdict: 'Verdict',
        noEval: 'No comparison yet. Run an evaluation and the before/after numbers appear here.',

        gate: 'Retry gate',
        gateDenials: 'Denials',
        gateFailures: 'Counted failures',
        gateCalls: 'Judgements',
        gateMaxRepeat: 'Repeat cap',
        gateReadBeforeWrite: 'Read before write',
        on: 'on',
        off: 'off',

        sessions: 'Sessions',
        corrections: 'Corrections',
        memoryTotal: 'Memories',
        memoryPending: 'Pending memories',
        nomPending: 'Pending nominations',
        conflicts: 'Conflicts',

        currentProject: 'Current project',
        projectGoal: 'Goal',
        projectProgress: 'Progress',
        projectBlocker: 'Blocker',
        projectMeta: '{entries} records · {sessions} sessions',
        noProject: 'No project summary yet. A few more turns and Lingxi records one.',
        insights: 'Recent insights',
        noInsights: 'No insights yet.',

        memorySearch: 'Search memory',
        searchPlaceholder: 'e.g. pwsh path error, panel style, install',
        searchEmpty: 'Type a query to see what Lingxi remembers.',
        noResults: 'No match. The library grows with corrections and retrospectives.',
        searchAction: 'Search',
        injectLabel: 'Injection preview',
        injectHint: '{n} matches enter the model context in this shape ({chars} chars).',
        abstainHint: 'Both retrieval signals are weak: nothing injected this time, so the model can admit it does not know.',
        browseTitle: 'Browse memories',
        browseHint: 'Pick a status, then open the list: every row has details and delete (undoable).',
        browseStatusAll: 'All statuses',
        pendingQueue: 'Pending memories',
        pendingHint: 'Auto-extracted and model-written memories wait here; the tile above counts the same list.',
        pendingHiddenHint: '{n} more candidates are outside this batch.',
        noPending: 'No pending memories.',
        accept: 'Accept',
        retire: 'Ignore',
        consolidate: 'Consolidate',
        consolidating: 'Consolidating',
        total: 'Records',
        active: 'Active',
        avgConfidence: 'Avg confidence',
        size: 'Store size',
        kindBreakdown: 'By kind',
        statusBreakdown: 'By status',
        localOnly: 'Local only',
        injectTitle: 'Memory pipeline',
        injectHint: 'Refreshed once per session on your message, injecting only session-relevant memory; nothing when no memory matches.',
        injectSessions: 'Sessions served',
        injectHits: 'Hits',
        injectMisses: 'Misses',
        injectCaptured: 'Auto-captured',
        injectChars: 'Chars now',
        injectRepeat: 'Repeats',
        injectRefined: 'Reinforced',
        injectTogglePause: 'Pause injection',
        injectToggleResume: 'Resume injection',
        injectBudget: 'Budget',
        injectPaused: 'Injection paused',
        injectRunning: 'Injection running',
        snapshotBanner: 'Showing the page-start snapshot (live channel unavailable); refresh the page to update.',
        refreshFailed: 'Refresh failed: {error}',
        staleSince: 'Showing cached data from {time}',
        lastLoaded: 'Read at {time}',
        efficacyTitle: 'Efficacy trend',
        liveEvolution: 'Live evolution',
        evolveTitle: 'Parameter evolution (UCB1)',
        evolveIdle: 'No evolution round yet: it starts once there is enough injection signal.',
        evolveTrials: 'Rounds',
        evolveFitness: 'Last score',
        evolveBest: 'Best arm',
        evolveBestMean: 'Best mean',
        evolveScenes: 'Per-scene budget',
        sectionsFailed: 'Some sections failed (the rest still render)',
        qualityTitle: 'Injection effectiveness (association)',
        qualityHint: 'Compares tool failure rate across sessions with vs without injected memory. Association only, not causation.',
        qualBucketNone: 'No injection',
        qualBucketSmall: '≤800 chars',
        qualBucketLarge: '>800 chars',
        qualityInjected: 'With injection · failure rate',
        qualityEmpty: 'Without · failure rate',
        qualitySessions: '{n} sessions',
        attrTitle: 'Learning effect (before/after)',
        attrHint: 'Same-scene failures before and after the lesson was captured; short windows are indicative only',
        attrBefore: 'Before',
        attrAfter: 'After',
        attrNone: 'No attributable lessons yet: capture needs some time.',
        attrPerDay: '{n}/day',
        attrDrop: 'Failure reduction',
        attrFewer: 'fewer repeats (working)',
        attrMore: 'more repeats (needs rewrite)',
        attrSame: 'flat',
        attrDays: '{n} days',
        attrTrend: 'Daily trend',
        attrDay: '{day}',
        gateTitle: 'Gate and corrections',
        gateInjected: 'Injections',
        gateWarned: 'In-turn hints',
        gateWarnEffective: 'Hints helped',
        sourceModel: 'Model written',
        detailOpen: 'Details',
        detailLoading: 'Loading…',
        detailEmpty: 'Nothing here',
        detailClose: 'Close',
        detailCandidates: 'Pending candidates',
        detailRetired: 'Retired (survival of the fittest)',
        detailLessons: 'All lessons',
        detailFacts: 'All constraints/facts',
        detailSkills: 'All skills',
        detailCaptured: 'Auto-captured lessons',
        legendInjected: 'light = injected',
        legendHits: 'dark = hits',
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
        lessonGapFilled: 'gap-filled',
        demoteReasonChip: 'demoted: {s}',
        resurrectedChip: 'revived',
        promoteTitle: 'Recurring across sessions',
        promoteHint: 'Same failure shows up in several sessions while the lesson is still private; promote it so other sessions benefit.',
        promoteNone: 'Nothing to promote right now.',
        promoteWorkspace: 'Promote to workspace',
        promoteGlobal: 'Promote to global',
        promoteCross: '{s} sessions · {n} failures',
        trendTitle: 'Recurrence trend (top scenes · 14 days)',
        trendHint: 'Bar height = failures that day; watch whether the tail declines.',
        coverageTitle: 'Memory coverage (recurring scenes → lesson exists?)',
        coverageHint: 'High-frequency scenes without a lesson are the biggest gaps.',
        coverageRatio: 'covered {c}/{t}',
        coverageSeed: 'Create lesson',
        coverageNone: 'No high-frequency gaps right now.',
        loopTitle: 'Learning loop',
        loopHint: 'Write → use → rank → prune; every step has a measured number',
        loopWrite: 'Write gate',
        loopUse: 'Usage feedback',
        loopRank: 'Ranking',
        loopPrune: 'Pruning',
        loopCandActive: 'candidates {c} · active {a}',
        loopRetired: '{n} retired',
        loopHitsMisses: 'hits {h} · misses {m}',
        loopWarn: '{n} in-turn hints',
        loopReliability: 'ranked by measured hit rate',
        loopGuard: '{n} retries blocked',
        loopHygiene: 'last check: {q} quarantined · {mg} merged',
        loopAutoActivated: '{n} auto-activated',
        loopRegress: '{n} negative lessons',
        corrTitle: 'Correction rate (learning signal)',
        search7d: 'last 7 days: {n} searches · abstained {r}',
        searchQualityTitle: 'Search quality (live)',
        searchQualityHint: 'Abstention share of explicit searches: too high means weak recall, too low risks forced matches.',
        searchQuality: '{n} searches · {m} abstained ({r})',
        corrScope: 'last 7 days: {n} corrections · {m} memories affected',
        corrPrecision: 'precision {n} per correction (prev {m})',
        corrRate: 'Overall',
        corrRecent: 'Last 7 days',
        corrPrevious: 'Previous 7 days',
        corrHint: 'Share of user messages that explicitly correct the previous step; falling means fewer repeat mistakes.',
        regressTitle: 'Lessons with negative effect',
        regressHint: 'Same-scene failures increased after capture; rewrite or retire them.',
        detailHits: 'Memories that helped',
        detailMisses: 'Memories that misled',
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
        analyticsTitle: 'Learning analytics (corrections / efficacy / evolution / quality)',
        sysTitle: 'System status (regression / gate / live)',
        detailTitle: 'Memory details (lessons / facts / skills)',
        opsTitle: 'Ops tools (cleanup / hygiene / audit / storage)',
        opsHint: 'Low-frequency tools live here; daily work needs only search, browse and pending above.',
        browseRefresh: 'Refresh',
        browseEmpty: 'No records in this status.',
        browseCount: '{n} records',
        semanticStatsTitle: 'Semantic recall activity',
        semanticCalls: '{n} calls · {ok} ok · {fail} failed · {to} timeout',
        semanticLatency: 'last {ms}ms · model {model}',
        semanticLastExpansion: 'last expansion: {text}',
        semanticIdle: 'not called yet (needs a real turn after enabling)',
        semanticError: 'last error: {error}',
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
        purgeHint: 'Hard-delete by filter (not retire); a backup is written first, preview only counts.',
        purgeStatus: 'Status',
        purgeKind: 'Kind',
        purgeDays: 'Older than (days)',
        purgeQ: 'Keyword',
        purgeAll: 'All',
        purgePreview: 'Preview',
        purgeRun: 'Run cleanup',
        purgeArmed: 'Click again to confirm',
        purgePreviewDone: 'Would delete {n} (remaining {left})',
        purgeDone: 'Deleted {n}, remaining {left} (backed up)',
        purgeRemoveOne: 'Delete',
        purgeDeleteDone: 'Deleted {n}',
        undoTitle: 'Undo available',
        undoHint: 'The deletion was backed up; restore to go back.',
        undoNone: 'No backup available.',
        undoRestore: 'Undo (restore latest backup)',
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
        hygieneHint: 'Quarantine suspicious, evict stale, merge duplicates, upgrade old wording',
        hygieneScan: 'Scanned',
        hygieneQuarantined: 'Quarantined',
        hygieneEvicted: 'Evicted',
        hygieneMerged: 'Merged',
        hygieneUpgraded: 'Upgraded',
        hygieneRun: 'Run check',
        hygieneDone: 'Done: quarantined {q}, evicted {e}, merged {m}, upgraded {u}',
        modelPendingTitle: 'Model-written candidates',
        modelPendingHint: 'Written by the model through lingxi_remember; only becomes durable after you confirm.',
        modelPendingNone: 'The model has not written any memory yet.',
        sourceHeuristic: 'Heuristic guess',
        sourceFailure: 'From failure',
        sourceScan: 'Scan suggestion',
        gateWarnIneffective: 'Hints failed',
        gateGuardDenied: 'Retry blocked',
        gateGuardEffective: 'Blocked then ok',
        gateGuard7d: 'Last 7 days: blocked {d} · helped {e} · failed {i}',
        gateGuardIneffective: 'Blocked then failed',
        gateCaptured: 'Captured',
        gateRefined: 'Reinforced',
        gateRepeat: 'Repeats',
        gateHits: 'Hits',
        gateMisses: 'Misses',
        liveLessons: 'Lessons (memory)',
        liveFacts: 'Constraints and facts (memory)',
        liveSkills: 'Skill candidates (memory)',
        noLiveLessons: 'No lessons in the memory library yet.',
        noLiveFacts: 'No constraints or facts in the memory library yet.',
        noLiveSkills: 'No skill candidates in the memory library yet.',
        injectFullText: '查看全文',
        injectFullText: 'Show full text',
        injectSamplesTitle: 'Latest injections',
        injectSamplesHint: 'The memory block that most recently entered the model, per session',
        injectSamplesEmpty: 'No injection recorded yet.',
        effRepeatRate: 'Repeat rate',
        effFailures: 'Failures',
        effDistinct: 'Distinct scenes',
        effInject7: '7d injected',
        effHits7: '7d hits',
        effMiss7: '7d misses',
        effTrend: 'This week vs last',
        effSuggestTitle: 'Frequently repeated scenes',
        effSeed: 'Turn into memory',
        effSeeded: 'Captured',
        effNone: 'Not enough failure samples yet; the repeat rate appears after some real runs.',
        dayAxis: 'last 14 days',
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

        nominationsTitle: 'Skill nominations',
        nomAll: 'All',
        nomEmpty: 'No skill nominations yet.',
        nomSessions: '{n} sessions',
        nomRecipe: '{n} steps',
        confHigh: 'High confidence',
        confMedium: 'Medium confidence',
        confLow: 'Low confidence',
        factsTitle: 'User constraints and facts',
        factsEvidence: '{n} evidence',
        factsKindConstraint: 'Constraint',
        factsKindPreference: 'Preference',
        noTraits: 'No environment facts collected yet.',
        tombs: 'Forgotten',
        tombsHint: 'Old judgements Lingxi no longer follows',
        deployFacts: 'Deployment facts',
        noFacts: 'No confirmed environment facts yet.',
        lessonsTitle: 'Lessons',
        lessonVotes: '{n} votes',
        lessonHits: '{n} hits',
        lessonMisses: '{n} misses',
        noLessons: 'No lessons collected yet.',

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
        liveToolCalls: 'Tool calls',
        liveToolErrors: 'Tool errors',
        liveSampled: 'sampled last {n} sessions',
        contextNote: 'No current session detected; only global memory is shown.',
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

    .lg-form { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
    .lg-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
    .lg-field-label { font-size: 12px; color: var(--dsw-alias-label-tertiary); }
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

    .lg-input[type="number"]::-webkit-outer-spin-button,
    .lg-input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
    .lg-input[type="number"] { -moz-appearance: textfield; appearance: textfield; }

    .lg-loop { display: flex; align-items: stretch; gap: 8px; flex-wrap: wrap; }
    .lg-loop-stage {
      flex: 1 1 150px; min-width: 140px;
      background: var(--dsw-alias-bg-layer-1);
      border: 1px solid var(--dsw-alias-border-l1);
      border-radius: 12px; padding: 10px 12px;
    }
    .lg-loop-title { font-weight: 600; font-size: 13px; margin-bottom: 4px; }
    .lg-loop-line { font-size: 12px; color: var(--dsw-alias-label-secondary); line-height: 1.5; }
    .lg-loop-arrow { align-self: center; color: var(--dsw-alias-label-tertiary); }
    .lg-loop-click { cursor: pointer; text-decoration: underline dotted; text-underline-offset: 3px; }
    .lg-loop-click:hover { color: var(--dsw-alias-brand-primary); }

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

.lg-metric-row { display: flex; flex-wrap: wrap; gap: 20px 28px; }
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

.lg-kv { display: grid; grid-template-columns: 76px minmax(0, 1fr); gap: 6px 12px; font-size: 12px; }
.lg-kv-key { color: var(--dsw-alias-label-tertiary); }
.lg-kv-val { color: var(--dsw-alias-label-primary); word-break: break-word; }

.lg-insight { display: flex; gap: 10px; padding: 9px 0; border-top: 1px solid var(--dsw-alias-border-l1); font-size: 12px; }
.lg-insight:first-child { border-top: 0; }
.lg-insight-idx { flex: none; width: 18px; height: 18px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-tertiary); font-size: 10px; font-weight: 650; }
.lg-insight-text { color: var(--dsw-alias-label-secondary); word-break: break-word; }

.lg-search { display: flex; gap: 8px; align-items: center; }
.lg-search .lg-input { width: auto; flex: 1 1 auto; min-width: 0; height: 36px; padding: 0 13px; border-radius: 11px; }
.lg-search .lg-btn { flex: none; white-space: nowrap; }
.lg-input { flex: 1 1 auto; height: 36px; padding: 0 13px; box-sizing: border-box; border-radius: 11px; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); font: inherit; font-size: 13px; outline: none; transition: border-color .16s ease, background-color .16s ease; }
.lg-input::placeholder { color: var(--dsw-alias-label-tertiary); }
.lg-input:focus { border-color: var(--dsw-alias-brand-primary); background: var(--dsw-alias-bg-layer-1); }

.lg-block { margin-top: 14px; padding: 12px 14px; border-radius: 12px; background: var(--dsw-alias-markdown-code-block, var(--dsw-alias-bg-layer-2)); border: 1px solid var(--dsw-alias-border-l1); font-family: ui-monospace, "SF Mono", Consolas, monospace; font-size: 11.5px; line-height: 1.6; color: var(--dsw-alias-label-secondary); white-space: pre-wrap; word-break: break-word; max-height: 260px; overflow: auto; }

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
      const gate = derived?.gate ?? null;
      const lessons = (derived?.lessons ?? []).slice(0, 4);
      const failures = efficacy?.failures ?? null;
      const metrics = efficacy?.metrics ?? null;
      const compare = metrics?.compare ?? null;
      const series = metrics?.series ?? [];

      return h('div', { className: 'lg-stack' },

        (() => {
          const status = health?.byStatus ?? {};
          const candidates = int(memory?.pendingTotal ?? status.candidate ?? 0);
          const active = int(status.active ?? 0);
          const retired = int(status.retired ?? 0);
          const hits = int(injection?.hits ?? 0);
          const misses = int(injection?.misses ?? 0);
          const warned = int(injection?.warned ?? 0);
          const denied = int(gate?.guardDenied ?? 0);
          const hygiene = memory?.hygiene ?? null;
          const regressions = (efficacy?.regressions ?? []).length;
          const stage = (title, lines) => h('div', { className: 'lg-loop-stage' },
            h('div', { className: 'lg-loop-title' }, title),
            lines.map((line, index) => {
              if (line === null || line === undefined) return null;
              const item = typeof line === 'string' ? { text: line } : line;
              if (item === null || item === undefined) return null;
              const clickable = typeof item.onClick === 'function';
              return h('div', {
                className: 'lg-loop-line' + (clickable ? ' lg-loop-click' : ''),
                key: index,
                role: clickable ? 'button' : undefined,
                onClick: clickable ? item.onClick : undefined,
              }, item.text);
            }));
          return h(Card, { title: t('loopTitle'), hint: t('loopHint') },
            h('div', { className: 'lg-loop' },
              stage(t('loopWrite'), [
                {
                  text: t('loopCandActive').replace('{c}', candidates).replace('{a}', active),
                  onClick: () => onDetail(t('detailCandidates'), { status: 'candidate', limit: 100 }),
                },
                {
                  text: t('loopRetired').replace('{n}', retired),
                  onClick: () => onDetail(t('detailRetired'), { status: 'retired', limit: 100 }),
                },
              ]),
              h('div', { className: 'lg-loop-arrow' }, '→'),
              stage(t('loopUse'), [
                {
                  text: t('loopHitsMisses').replace('{h}', hits).replace('{m}', misses),
                  onClick: () => onDetail(t('detailHits'), { minHits: 1, limit: 100 }),
                },
                t('loopWarn').replace('{n}', warned),
              ]),
              h('div', { className: 'lg-loop-arrow' }, '→'),
              stage(t('loopRank'), [
                t('loopReliability'),
                t('loopGuard').replace('{n}', denied),
              ]),
              h('div', { className: 'lg-loop-arrow' }, '→'),
              stage(t('loopPrune'), [
                hygiene === null
                  ? '—'
                  : {
                      text: t('loopHygiene').replace('{q}', int(hygiene.quarantined ?? 0)).replace('{mg}', int(hygiene.merged ?? 0)),
                      onClick: () => onDetail(t('detailRetired'), { status: 'retired', limit: 100 }),
                    },
                t('loopRegress').replace('{n}', int(regressions)),
                int(injection?.autoActivated ?? 0) > 0 ? t('loopAutoActivated').replace('{n}', int(injection.autoActivated)) : null,
              ])));
        })(),

        (() => {
          const coverage = efficacy?.failures?.coverage ?? null;
          if (coverage === null) return null;
          const holes = coverage.holes ?? [];
          return h(Card, { title: t('coverageTitle'), hint: t('coverageHint') },
            h('div', { className: 'lg-metric-row' },
              Metric({ label: t('coverageRatio').replace('{c}', int(coverage.covered)).replace('{t}', int(coverage.total)), value: coverage.ratio === null ? '—' : pct(coverage.ratio), onClick: () => onDetail(t('detailHits'), { minHits: 1, limit: 100 }) })),
            holes.length === 0
              ? h('div', { className: 'lg-status' }, t('coverageNone'))
              : h('div', { className: 'lg-rows', style: { marginTop: 10 } }, holes.map((hole) =>
                  h('div', { className: 'lg-row', key: hole.tool + '|' + hole.code },
                    h('div', { className: 'lg-row-main' },
                      h('div', { className: 'lg-row-title' }, hole.tool + (hole.code === '' ? '' : ' · ' + hole.code)),
                      h('div', { className: 'lg-row-meta' }, h('span', null, int(hole.sessions) + ' 会话 · ' + int(hole.count) + ' 次'))),
                    h('div', { className: 'lg-row-side' },
                      h('button', { type: 'button', className: 'lg-btn lg-btn-ghost', onClick: () => onSeed({ tool: hole.tool, code: hole.code, count: hole.count }) }, t('coverageSeed')))))));
        })(),

        (() => {
          const trend = efficacy?.failures?.trend ?? [];
          if (trend.length === 0) return null;
          return h(Card, { title: t('trendTitle'), hint: t('trendHint') },
            h('div', { className: 'lg-rows' }, trend.map((row) =>
              h('div', { className: 'lg-row', key: row.key },
                h('div', { className: 'lg-row-main' },
                  h('div', { className: 'lg-row-title' }, String(row.key).replace('|', ' · ')),
                  h(MiniBars, { points: row.points })),
                h('div', { className: 'lg-row-side' }, h(Chip, { children: int(row.total) })))),
            ));
        })(),

        (() => {
          const list = Array.isArray(alerts) ? alerts : [];
          if (list.length === 0) return null;
          return h(Card, { title: t('alertTitle') },
            h('div', { className: 'lg-rows' }, list.map((alert, index) =>
              h('div', { className: 'lg-row', key: alert.kind + index },
                h('div', { className: 'lg-row-main' },
                  h('div', { className: 'lg-row-title' },
                    alert.kind === 'demote-spike' ? t('alertDemote').replace('{n}', int(alert.count))
                      : alert.kind === 'quarantine-spike' ? t('alertQuarantine').replace('{n}', int(alert.count))
                      : t('alertCoverage').replace('{n}', int(alert.count))))))));
        })(),

        h(Card, { title: t('selfcheckTitle') },
          (() => {
            const info = selfcheck ?? null;
            if (info === null) return h('div', { className: 'lg-status' }, t('selfcheckNever'));
            const failed = (info.suites ?? []).filter((suite) => suite.ok !== true);
            return h('div', { style: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' } },
              h(Chip, { kind: info.ok === true ? 'ok' : 'warn', children: info.ok === true ? t('selfcheckOk') : t('selfcheckBad') }),
              h('span', { className: 'lg-card-hint' }, int(info.suites?.length ?? 0) + ' 组 · ' + int(info.ms ?? 0) + 'ms'),
              failed.length > 0 ? h('span', { className: 'lg-card-hint' }, failed.map((suite) => suite.name).join('、')) : null,
              (() => {
                const audit = auditState ?? null;
                if (audit === null) return null;
                return h(Chip, { kind: audit.ok === true ? 'ok' : 'warn', children: audit.ok === true ? t('auditOk') : t('auditBad') });
              })(),
              h('button', { type: 'button', className: 'lg-btn lg-btn-ghost', disabled: busy !== '', onClick: () => onSelfcheck() }, t('selfcheckTitle')));
          })()),

        // 纠错频率：独立卡片，14 天柱状图
        h(Collapsible, { title: t('analyticsTitle') },
        (() => {
          const corrections = efficacy?.failures?.corrections ?? null;
          if (corrections === null || corrections.totalMessages === 0) return null;
          const fmt = (value) => (value === null || value === undefined ? '—' : String(value) + '%');
          return h(Card, { title: t('corrTitle'), hint: t('corrHint') },
            h(CorrBars, { series: corrections.series, t }),
            h('div', { style: { marginTop: 8, display: 'flex', gap: 16, alignItems: 'baseline', flexWrap: 'wrap' } },
              h('span', { className: 'lg-card-hint' }, t('corrRecent') + ' ' + fmt(corrections.recent?.ratePer100)),
              h('span', { className: 'lg-card-hint' }, t('corrPrevious') + ' ' + fmt(corrections.previous?.ratePer100)),
              h('span', { className: 'lg-card-hint' }, t('corrRate') + ' ' + fmt(corrections.ratePer100) + ' · ' + int(corrections.totalCorrections) + '/' + int(corrections.totalMessages))),
            (() => {
              const recent = metrics?.compare?.recent ?? {};
              const previous = metrics?.compare?.previous ?? {};
              const ratio = (bucket) => {
                const n = Number(bucket?.corrections ?? 0);
                if (n <= 0) return null;
                return Math.round((Number(bucket?.correctionPenalized ?? 0) / n) * 10) / 10;
              };
              const nowRatio = ratio(recent);
              const prevRatio = ratio(previous);
              const scope = t('corrScope')
                .replace('{n}', int(recent.corrections ?? 0))
                .replace('{m}', int(recent.correctionPenalized ?? 0));
              if (nowRatio === null) return h('div', { className: 'lg-card-hint', style: { marginTop: 4 } }, scope);
              return h('div', { className: 'lg-card-hint', style: { marginTop: 4 } },
                scope + ' · ' + t('corrPrecision')
                  .replace('{n}', String(nowRatio))
                  .replace('{m}', prevRatio === null ? '—' : String(prevRatio)));
            })());
        })(),

        // 疗效趋势：复发率 + 7 日注入/命中/证伪 + 14 天柱状
        h(Card, { title: t('efficacyTitle'), hint: t('dayAxis') },
          failures !== null && failures.distinctKeys > 0
            ? h('div', { className: 'lg-metric-row' },
                Metric({ label: t('effRepeatRate'), value: pct(failures.repeatRate) }),
                Metric({ label: t('effFailures'), value: int(failures.totalFailures) }),
                Metric({ label: t('effDistinct'), value: int(failures.distinctKeys) }),
                Metric({ label: t('effInject7'), value: int(compare?.recent?.injected ?? 0) }),
                Metric({ label: t('effHits7'), value: int(compare?.recent?.hits ?? 0) }),
                Metric({ label: t('effMiss7'), value: int(compare?.recent?.misses ?? 0) }))
            : h(Empty, { icon: 'spark', title: t('effNone') }),
          series.length > 0
            ? h('div', { style: { marginTop: 14 } },
                h(Sparkline, { points: series }),
                h('div', { style: { marginTop: 6, display: 'flex', gap: 14 } },
                  h('span', { className: 'lg-card-hint' }, t('legendInjected')),
                  h('span', { className: 'lg-card-hint' }, t('legendHits'))))
            : null,
          Array.isArray(failures?.suggestions) && failures.suggestions.length > 0
            ? h('div', { style: { marginTop: 12 } },
                h('div', { className: 'lg-card-hint', style: { marginBottom: 6 } }, t('effSuggestTitle')),
                failures.suggestions.slice(0, 4).map((item) =>
                  h('div', { className: 'lg-row', key: item.key },
                    h('div', { className: 'lg-row-main' },
                      h('div', { className: 'lg-row-title' }, item.tool + (item.code === '' ? '' : ' · ' + item.code)),
                      h('div', { className: 'lg-row-meta' }, h('span', null, item.count + ' ×'))),
                    h('div', { className: 'lg-row-side' },
                      h('button', { type: 'button', className: 'lg-btn lg-btn-ghost', onClick: () => onSeed(item) }, t('effSeed'))))))
            : null),

        // 进化状态：当前参数组、历史得分、选择依据
        h(Card, { title: t('evolveTitle'), hint: evolution?.currentArmId ?? '—' },
          evolution === null || evolution === undefined
            ? h('div', { className: 'lg-status' }, t('evolveIdle'))
            : h('div', null,
                h('div', { className: 'lg-metric-row' },
                  Metric({ label: t('evolveTrials'), value: int(evolution.trials ?? 0), onClick: () => onDetail(t('detailHits'), { minHits: 2, limit: 100 }) }),
                  Metric({ label: t('evolveFitness'), value: int(evolution.lastFitness ?? 0) }),
                  Metric({ label: t('evolveBest'), value: evolution.bestArmId ?? '—' }),
                  Metric({ label: t('evolveBestMean'), value: evolution.bestMean === null || evolution.bestMean === undefined ? '—' : String(evolution.bestMean) })),
                h('div', { style: { marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' } },
                  h('span', { className: 'lg-card-hint' }, t('evolveScenes')),
                  Object.entries(scenes ?? {}).map(([scene, info]) => {
                    const stat = (efficacy?.failures?.scenes ?? []).find((entry) => entry.scene === scene);
                    const parts = [scene, int(info?.charBudget ?? 0)];
                    if (stat !== undefined) parts.push('复发 ' + pct(stat.repeatRate));
                    if (stat !== undefined && Number(stat.lessonFrom ?? 0) > 0) parts.push('治理 ' + int(stat.before ?? 0) + '→' + int(stat.after ?? 0));
                    const label = parts.join(' · ');
                    return h(Chip, { key: scene, kind: stat !== undefined && stat.repeatRate >= 0.6 ? 'warn' : 'mute', children: label });
                  })),
                h('div', { style: { marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 } },
                  (evolution.arms ?? []).map((arm) =>
                    h(Chip, {
                      key: arm.id,
                      kind: arm.id === evolution.currentArmId ? 'accent' : 'mute',
                      children: arm.label + ' · ' + (arm.n === 0 ? '未试' : arm.mean),
                    })))))

        ,
        h(Card, { title: t('qualityTitle'), hint: t('qualityHint') },
          quality === null || quality === undefined
            ? h('div', { className: 'lg-status' }, '—')
            : h('div', { className: 'lg-metric-row' },
                Metric({
                  label: t('qualityInjected'),
                  value: quality.injected?.failureRate === null || quality.injected?.failureRate === undefined ? '—' : pct(quality.injected.failureRate),
                  caption: t('qualitySessions').replace('{n}', int(quality.injected?.sessions ?? 0)),
                }),
                Metric({
                  label: t('qualityEmpty'),
                  value: quality.empty?.failureRate === null || quality.empty?.failureRate === undefined ? '—' : pct(quality.empty.failureRate),
                  caption: t('qualitySessions').replace('{n}', int(quality.empty?.sessions ?? 0)),
                })),
            Array.isArray(quality.buckets) && quality.buckets.some((bucket) => bucket.sessions > 0)
              ? h('div', { className: 'lg-rows', style: { marginTop: 10 } },
                  quality.buckets.map((bucket) => h('div', { className: 'lg-row', key: bucket.key },
                    h('div', { className: 'lg-row-main' },
                      h('div', { className: 'lg-row-title' }, t(bucket.key === 'none' ? 'qualBucketNone' : bucket.key === 'small' ? 'qualBucketSmall' : 'qualBucketLarge')),
                      h('div', { className: 'lg-row-meta' },
                        h('span', null, int(bucket.failures) + ' / ' + int(bucket.calls)))),
                    h('div', { className: 'lg-row-side' }, h(Chip, { kind: bucket.failureRate === null ? 'mute' : 'ok', children: bucket.failureRate === null ? '—' : pct(bucket.failureRate) })))))
              : null),

        h(Collapsible, { title: t('sysTitle') },
        ),
        h(Card, { title: t('gateTitle'), hint: t('liveEvolution') },
          gate === null
            ? h('div', { className: 'lg-status' }, '—')
            : h('div', { className: 'lg-metric-row' },
                Metric({ label: t('gateInjected'), value: int(gate.injected) }),
                Metric({ label: t('gateWarned'), value: int(gate.warned) }),
                Metric({ label: t('adviceAdopted'), value: int(gate.adviceAdopted ?? 0) }),
                Metric({ label: t('adviceIgnored'), value: int(gate.adviceIgnored ?? 0) }),
                (() => {
                  const recent = efficacy?.metrics?.compare?.recent ?? {};
                  const a = Number(recent.adviceAdopted ?? 0);
                  const i = Number(recent.adviceIgnored ?? 0);
                  if (a + i === 0) return null;
                  const rate = Math.round((a / (a + i)) * 1000) / 10;
                  return h('span', { className: 'lg-card-hint', style: { alignSelf: 'center' } },
                    t('advice7d').replace('{a}', int(a)).replace('{i}', int(i)).replace('{r}', String(rate) + '%'));
                })(),
                (() => {
                  const byCode = gate?.adviceByCode ?? {};
                  const low = Object.entries(byCode)
                    .filter(([, value]) => Number(value?.rate ?? 100) < 50)
                    .sort((a, b) => (b[1].ignored + b[1].adopted) - (a[1].ignored + a[1].adopted))
                    .slice(0, 3);
                  if (low.length === 0) return null;
                  return h('span', { className: 'lg-card-hint', style: { alignSelf: 'center' } },
                    t('adviceLow').replace('{list}', low.map(([code, value]) => code + ' ' + int(value.adopted) + '/' + int(value.adopted + value.ignored)).join('、')));
                })(),
                Metric({ label: t('gateCaptured'), value: int(gate.captured), onClick: () => onDetail(t('detailCaptured'), { source: 'tool-failure', limit: 100 }) }),
                Metric({ label: t('gateRepeat'), value: int(gate.repeatFailures), onClick: () => onFailures(t('detailFailures')) }),
                Metric({ label: t('gateHits'), value: int(gate.hits), onClick: () => onDetail(t('detailHits'), { minHits: 1, limit: 100 }) }),
                Metric({ label: t('gateMisses'), value: int(gate.misses), onClick: () => onDetail(t('detailMisses'), { minMisses: 1, limit: 100 }) }))),
        // 闸门与纠错：注入、同轮提示、捕获、加强、重复失败
        // 指标格 + 实时会话
        h('div', { className: 'lg-tiles' },
          h(Tile, { label: t('memoryTotal'), value: int(health?.total ?? 0), note: health ? `${int(health.byStatus?.active ?? 0)} ${t('active')}` : undefined }),
          h(Tile, { label: t('memoryPending'), value: int(memory?.pendingTotal ?? memory?.pending?.length ?? 0) }),
          h(Tile, { label: t('liveSessions'), value: int(live?.sessions ?? 0) }),
          h(Tile, { label: t('liveToolErrors'), value: int(live?.toolErrors ?? 0) }),
          h(Tile, { label: t('conflicts'), value: int(health?.contradictionPairs ?? 0) })),

        h(Card, { title: t('liveTitle'), hint: t('liveSampled').replace('{n}', int(live?.sampled ?? 0)) },
          h('div', { className: 'lg-metric-row' },
            Metric({ label: t('liveSessions'), value: int(live?.sessions ?? 0) }),
            Metric({ label: t('liveTurns'), value: int(live?.turns ?? 0) }),
            Metric({ label: t('liveToolCalls'), value: int(live?.toolCalls ?? 0) }),
            Metric({ label: t('liveToolErrors'), value: int(live?.toolErrors ?? 0) }))),

        ),
      );
    }

    /* ================================================================ 记忆 */

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

    function MemoryTab({ t, memory, busy, context, injection, semantic, onSemantic, onSemanticChoice, semanticChoice, setSemanticChoice, semanticOptions, semanticStats, onDecide, onPromote, onForget, onInjection, onHygiene, onDetail, onReset, onPurge, onExport, onImport, onImportError, search, onSelfcheck, onDeleteOne, onAudit, onRepair, storage, onMigrate }) {
      const [query, setQuery] = React.useState(() => readUsage().lastSearch);
      const [result, setResult] = React.useState(null);
      const [loading, setLoading] = React.useState(false);
      const [error, setError] = React.useState(null);
      const [showAll, setShowAll] = React.useState(false);
      const [purgeStatus, setPurgeStatus] = React.useState('candidate');
      const [browseStatus, setBrowseStatus] = React.useState('active');
      const [browseList, setBrowseList] = React.useState(null);

      const loadBrowse = React.useCallback(async (status) => {
        const query = (status ?? '') === '' ? '?limit=8' : '?status=' + encodeURIComponent(status) + '&limit=8';
        try {
          const body = await requestJson('lingxi/memory/list' + query);
          setBrowseList(body.items ?? []);
        } catch {
          setBrowseList([]);
        }
      }, []);

      React.useEffect(() => {
        loadBrowse(browseStatus);
      }, [browseStatus, loadBrowse]);
      const [storageDir, setStorageDir] = React.useState('');
      const [purgeKind, setPurgeKind] = React.useState('');
      const [purgeDays, setPurgeDays] = React.useState('0');
      const [purgeQ, setPurgeQ] = React.useState('');
      const [purgeArmed, setPurgeArmed] = React.useState(false);
      const purgeFilter = () => ({
        status: purgeStatus === '' ? '' : purgeStatus,
        kind: purgeKind,
        q: purgeQ,
        olderThanDays: Number(purgeDays) || 0,
      });
      const pending = memory?.pending ?? [];
      const modelPending = pending.filter(
        (record) => ((record.provenance ?? [])[0]?.source ?? '') === 'model-tool',
      );
      // 模型写入的候选有独立卡片，这里不重复展示。
      const queuePending = pending.filter((record) => ((record.provenance ?? [])[0]?.source ?? '') !== 'model-tool');
      const health = memory?.health ?? null;
      const shownResults = result === null ? [] : noiseVisible(result.items ?? [], showAll);

      const submit = async (value) => {
        setLoading(true);
        setError(null);
        try {
          const params = new URLSearchParams({ q: value, limit: '20' });
          if (context?.sessionId) params.set('sessionId', context.sessionId);
          if (context?.workspaceId) params.set('workspaceId', context.workspaceId);
          const body = await getJson(`${MEMORY}/search?${params.toString()}`);
          setResult(body);
          writeUsage({ lastSearch: value });
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          setLoading(false);
        }
      };

      const kinds = health?.byKind ?? {};
      const statuses = health?.byStatus ?? {};

      return h('div', { className: 'lg-stack' },
        h('div', { className: 'lg-tiles' },
          h(Tile, { label: t('total'), value: int(health?.total ?? 0) }),
          h(Tile, { label: t('active'), value: int(statuses.active ?? 0) }),
          h(Tile, { label: t('memoryPending'), value: int(statuses.candidate ?? 0) }),
          h(Tile, { label: t('avgConfidence'), value: pct(health?.averageEffectiveConfidence ?? 0) }),
          h(Tile, { label: t('size'), value: bytes(health?.bytes ?? 0) })),

        context?.sessionId ? null : h('div', { className: 'lg-status' }, t('contextNote')),

        h(Card, { title: t('memorySearch'), hint: t('localOnly') },
          h('div', { className: 'lg-search' },
            h('input', {
              className: 'lg-input',
              type: 'search',
              value: query,
              placeholder: t('searchPlaceholder'),
              onChange: (event) => setQuery(event.target.value),
              onKeyDown: (event) => {
                if (event.key === 'Enter') submit(query);
              },
            }),
            h('button', { type: 'button', className: 'lg-btn lg-btn-primary', disabled: loading, onClick: () => submit(query) }, t('searchAction'))),
          result === null
            ? h('div', { className: 'lg-status' }, t('searchEmpty'))
            : result.abstain === true
              ? h('div', { className: 'lg-status' }, t('abstainHint'))
              : h('div', { className: 'lg-status' },
                  h('span', { className: 'lg-row-meta' },
                    h(Chip, { children: `${int(result.items?.length ?? 0)}` }),
                    h(Chip, { children: `${int(result.chars ?? 0)} chars` }))),
          error !== null ? h('div', { className: 'lg-status lg-status-error' }, error) : null),

        result !== null && shownResults.length > 0
          ? h(Card, { title: t('injectLabel'), hint: t('injectHint').replace('{n}', int(shownResults.length)).replace('{chars}', int(result.chars ?? 0)) },
              h(NoiseHint, { t, items: result.items ?? [], showAll, onToggle: () => setShowAll(!showAll) }),
              h('div', null, shownResults.map((record) => h(MemoryRow, { t, key: record.id, record, actions: h(MemoryActions, { t, record, onPromote, onForget, onDelete: onDeleteOne }) }))),
              h('div', { className: 'lg-block' }, result.block !== '' ? result.block : '—'))
          : result !== null && result.abstain !== true
            ? h(Card, null, h(Empty, { icon: 'memory', title: t('noResults') }))
            : null,

        h(Card, { title: t('modelPendingTitle') + (Number(memory?.modelPendingTotal ?? 0) > 0 ? '（' + int(memory.modelPendingTotal) + '）' : ''), hint: t('modelPendingHint') },
          modelPending.length === 0
            ? h('div', { className: 'lg-status' }, t('modelPendingNone'))
            : h('div', null, modelPending.map((record) =>
                h('div', { className: 'lg-row', key: 'model-' + record.id },
                  h('div', { className: 'lg-row-main' },
                    h('div', { className: 'lg-row-title' }, record.text),
                    h('div', { className: 'lg-row-meta' },
                      h(Chip, { kind: 'accent', children: t(KIND_LABEL[record.kind] ?? 'kindFact') }),
                      h(Chip, { children: t('sourceModel') }),
                      h(Chip, { kind: 'mute', children: record.sharing ?? 'private' }))),
                  h('div', { className: 'lg-row-side' },
                    h('button', { type: 'button', className: 'lg-btn lg-btn-primary', disabled: busy !== '', onClick: () => onDecide(record.id, 'accept') }, t('accept')),
                    h('button', { type: 'button', className: 'lg-btn lg-btn-ghost', disabled: busy !== '', onClick: () => onDecide(record.id, 'retire') }, t('retire')))))),

        h(Collapsible, { title: t('opsTitle'), hint: t('opsHint') },
        h(Card, { title: t('purgeTitle'), hint: t('purgeHint') },
          h('div', { className: 'lg-form' },
            h('div', { className: 'lg-field' },
              h('span', { className: 'lg-field-label' }, t('purgeStatus')),
              h(Select, {
                value: purgeStatus,
                options: [
                  { value: '', label: t('purgeAll') },
                  { value: 'candidate', label: t('statusCandidate') },
                  { value: 'active', label: t('statusActive') },
                  { value: 'retired', label: t('statusRetired') },
                ],
                onChange: (next) => { setPurgeStatus(next); setPurgeArmed(false); },
                ariaLabel: t('purgeStatus'),
              })),
            h('div', { className: 'lg-field' },
              h('span', { className: 'lg-field-label' }, t('purgeKind')),
              h(Select, {
                value: purgeKind,
                options: [
                  { value: '', label: t('purgeAll') },
                  { value: 'constraint', label: t(KIND_LABEL.constraint) },
                  { value: 'preference', label: t(KIND_LABEL.preference) },
                  { value: 'fact', label: t(KIND_LABEL.fact) },
                  { value: 'lesson', label: t(KIND_LABEL.lesson) },
                  { value: 'skill', label: t(KIND_LABEL.skill) },
                ],
                onChange: (next) => { setPurgeKind(next); setPurgeArmed(false); },
                ariaLabel: t('purgeKind'),
              })),
            h('div', { className: 'lg-field' },
              h('span', { className: 'lg-field-label' }, t('purgeDays')),
              h('input', { className: 'lg-input', type: 'number', min: 0, inputMode: 'numeric', value: purgeDays, onChange: (event) => { setPurgeDays(event.target.value); setPurgeArmed(false); } })),
            h('div', { className: 'lg-field' },
              h('span', { className: 'lg-field-label' }, t('purgeQ')),
              h('input', { className: 'lg-input', type: 'text', placeholder: '…', value: purgeQ, onChange: (event) => { setPurgeQ(event.target.value); setPurgeArmed(false); } }))),
          h('div', { style: { marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' } },
            h('button', { type: 'button', className: 'lg-btn lg-btn-ghost', disabled: busy !== '', onClick: () => onPurge(purgeFilter(), true) }, t('purgePreview')),
            h('button', {
              type: 'button',
              className: 'lg-btn',
              disabled: busy !== '',
              onClick: () => {
                if (!purgeArmed) { setPurgeArmed(true); return; }
                setPurgeArmed(false);
                onPurge(purgeFilter(), false);
              },
            }, purgeArmed ? t('purgeArmed') : t('purgeRun')),
            h('button', { type: 'button', className: 'lg-btn lg-btn-ghost', disabled: busy !== '', onClick: () => onExport() }, t('exportTitle')),
            h('button', { type: 'button', className: 'lg-btn lg-btn-ghost', disabled: busy !== '', onClick: () => onSelfcheck() }, t('selfcheckTitle')),
            h('button', { type: 'button', className: 'lg-btn lg-btn-ghost', disabled: busy !== '', onClick: () => onAudit() }, t('auditTitle')),
            h('button', { type: 'button', className: 'lg-btn lg-btn-ghost', disabled: busy !== '', onClick: () => onRepair() }, t('repairTitle')),
            h('label', { className: 'lg-btn lg-btn-ghost', style: { cursor: 'pointer' } },
              t('importTitle'),
              h('input', {
                type: 'file',
                accept: 'application/json',
                style: { display: 'none' },
                onChange: (event) => {
                  const file = event.target.files?.[0];
                  if (file === undefined) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    try {
                      onImport(JSON.parse(String(reader.result ?? '{}')));
                    } catch (error) {
                      onImportError(error instanceof Error ? error.message : String(error));
                    }
                  };
                  reader.readAsText(file);
                  event.target.value = '';
                },
              })))),

        (() => {
          const hygiene = memory?.hygiene ?? null;
          return h(Card, { title: t('hygieneTitle'), hint: t('hygieneHint') },
            hygiene === null
              ? h('div', { className: 'lg-status' }, '—')
              : h('div', { className: 'lg-metric-row' },
                  Metric({ label: t('hygieneScan'), value: int(hygiene.scanned ?? 0) }),
                  Metric({ label: t('hygieneQuarantined'), value: int(hygiene.quarantined ?? 0) }),
                  Metric({ label: t('hygieneEvicted'), value: int(hygiene.evicted ?? 0) }),
                  Metric({ label: t('hygieneMerged'), value: int(hygiene.merged ?? 0) }),
                  Metric({ label: t('hygieneUpgraded'), value: int(hygiene.upgraded ?? 0) })),
            h('div', { style: { marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' } },
              h('button', { type: 'button', className: 'lg-btn', disabled: busy !== '', onClick: onHygiene },
                busy === 'hygiene' ? '…' : t('hygieneRun')),
              h('button', { type: 'button', className: 'lg-btn lg-btn-ghost', onClick: () => onDetail(t('detailRetired'), { status: 'retired', limit: 100 }) }, t('detailOpen')),
              h('button', { type: 'button', className: 'lg-btn lg-btn-ghost', onClick: onReset }, t('resetTitle'))));
        })(),
        h(Card, { title: t('storageTitle'), hint: t('storageHint') },
          h('div', { className: 'lg-card-hint' }, t('storageCurrent').replace('{dir}', storage?.dir ?? '')),
          h('div', { className: 'lg-search' },
            h('input', { className: 'lg-input', type: 'text', placeholder: 'D:\\lingxi-memory', value: storageDir, onChange: (event) => setStorageDir(event.target.value) }),
            h('button', { type: 'button', className: 'lg-btn lg-btn-primary', disabled: busy !== '' || storageDir.trim() === '', onClick: () => onMigrate() }, t('storageMigrate')))),
        ),

        h(BrowseCard, { t, busy, status: browseStatus, setStatus: setBrowseStatus, items: browseList, onDelete: onDeleteOne, onRefresh: () => loadBrowse(browseStatus) }),

        h(Card, { title: t('pendingQueue'), hint: (memory?.pendingHidden ?? 0) > 0 ? t('pendingHint') + ' ' + t('pendingHiddenHint').replace('{n}', int(memory.pendingHidden)) : t('pendingHint') },
          queuePending.length === 0
            ? h(Empty, { icon: 'check', title: t('noPending') })
            : h('div', null, queuePending.map((record) =>
                h('div', { className: 'lg-row', key: record.id },
                  h('div', { className: 'lg-row-main' },
                    h('div', { className: 'lg-row-title' }, record.text),
                    h('div', { className: 'lg-row-meta' },
                      h(Chip, { kind: 'accent', children: t(KIND_LABEL[record.kind] ?? 'kindFact') }),
                      h(Chip, { children: t(SCOPE_LABEL[record.scope?.kind] ?? 'scopeMachine') }),
                      (() => {
                        const source = (record.provenance ?? [])[0]?.source ?? '';
                        const label = source === 'model-tool'
                          ? t('sourceModel')
                          : source === 'heuristic-instruction'
                            ? t('sourceHeuristic')
                            : source === 'tool-failure'
                              ? t('sourceFailure')
                              : source === 'efficacy-scan'
                                ? t('sourceScan')
                                : '';
                        return label === '' ? null : h(Chip, { children: label });
                      })(),
                      ...memoryMeta(t, record).map((text, index) => h('span', { key: index }, text)))),
                  h('div', { className: 'lg-row-side' },
                    h('button', { type: 'button', className: 'lg-btn lg-btn-primary', disabled: busy !== '', onClick: () => onDecide(record.id, 'accept') }, t('accept')),
                    h('button', { type: 'button', className: 'lg-btn lg-btn-ghost', disabled: busy !== '', onClick: () => onDecide(record.id, 'retire') }, t('retire')),
                    h('button', { type: 'button', className: 'lg-btn lg-btn-ghost', disabled: busy !== '', onClick: () => onDeleteOne(record.id) }, t('deleteOne'))))))),

        (() => {
          const info = search ?? null;
          if (info === null || Number(info.total ?? 0) === 0) return null;
          const rate = info.total === 0 ? null : Math.round((info.abstained / info.total) * 1000) / 10;
          return h(Card, { title: t('searchQualityTitle'), hint: t('searchQualityHint') },
            h('div', { className: 'lg-card-hint' },
              t('searchQuality')
                .replace('{n}', int(info.total))
                .replace('{m}', int(info.abstained))
                .replace('{r}', rate === null ? '—' : String(rate) + '%')),
            (() => {
              const recent = efficacy?.metrics?.compare?.recent ?? {};
              const total = Number(recent.searches ?? 0);
              if (total === 0) return null;
              const share = Math.round((Number(recent.searchAbstained ?? 0) / total) * 1000) / 10;
              return h('div', { className: 'lg-card-hint', style: { marginTop: 4 } },
                t('search7d').replace('{n}', int(total)).replace('{r}', String(share) + '%'));
            })());
        })(),

        h(Card, { title: t('injectSamplesTitle'), hint: t('injectSamplesHint') },
          h('div', { style: { marginBottom: 8 } },
            h('button', { type: 'button', className: 'lg-btn lg-btn-ghost', disabled: busy !== '', onClick: () => onShowSamples(samples ?? []) }, t('injectFullText'))),
          (injection?.samples?.length ?? 0) === 0
            ? h('div', { className: 'lg-status' }, t('injectSamplesEmpty'))
            : h('div', null,
                injection.samples.map((sample) =>
                  h('div', { className: 'lg-row', key: String(sample.sessionId) + sample.at },
                    h('div', { className: 'lg-row-main' },
                      h('div', { className: 'lg-row-title' }, '…' + String(sample.sessionId).slice(-8) + ' · ' + int(sample.records) + ' 条 · ' + int(sample.chars) + ' 字'),
                      h('div', { className: 'lg-row-meta' }, h('span', null, relTime(sample.at, t))))))),
          injection?.samples?.[0] !== undefined
            ? h('div', { className: 'lg-block' }, injection.samples[0].preview)
            : null),

        h('div', { className: 'lg-grid-2' },
          h(Card, { title: t('kindBreakdown') },
            Object.entries(kinds).length === 0
              ? h('div', { className: 'lg-status' }, '—')
              : Object.entries(kinds).sort((a, b) => b[1] - a[1]).map(([kind, count]) =>
                  h('div', { className: 'lg-row', key: kind },
                    h('div', { className: 'lg-row-main' }, h('div', { className: 'lg-row-title' }, t(KIND_LABEL[kind] ?? 'kindFact'))),
                    h('div', { className: 'lg-row-side' }, h(Chip, { children: int(count) }))))),
          h(Card, { title: t('statusBreakdown') },
            Object.entries(statuses).length === 0
              ? h('div', { className: 'lg-status' }, '—')
              : Object.entries(statuses).sort((a, b) => b[1] - a[1]).map(([status, count]) =>
                  h('div', { className: 'lg-row', key: status },
                    h('div', { className: 'lg-row-main' }, h('div', { className: 'lg-row-title' }, t(STATUS_LABEL[status] ?? 'statusActive'))),
                    h('div', { className: 'lg-row-side' }, h(Chip, { children: int(count) })))))),

        h(Card, { title: t('localOnly'), hint: injection?.enabled === false ? t('injectPaused') : t('injectRunning') },
          h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' } },
            h('button', {
              type: 'button',
              className: 'lg-btn',
              disabled: busy !== '',
              onClick: () => onInjection({ enabled: !(injection?.enabled !== false) }),
            }, injection?.enabled === false ? t('injectToggleResume') : t('injectTogglePause')),
            [400, 700, 1200].map((budget) => h('button', {
              key: budget,
              type: 'button',
              className: 'lg-btn lg-btn-ghost',
              disabled: busy !== '',
              onClick: () => onInjection({ charBudget: budget }),
            }, t('injectBudget') + ' ' + budget)))),

        h(Card, { title: t('injectTitle'), hint: t('localOnly') },
          h('div', { className: 'lg-metric-row' },
            Metric({ label: t('injectSessions'), value: int(injection?.sessionsWithMemory ?? 0) }),
            Metric({ label: t('injectHits'), value: int(injection?.hits ?? 0), onClick: () => onDetail(t('detailHits'), { minHits: 1, limit: 100 }) }),
            Metric({ label: t('injectMisses'), value: int(injection?.misses ?? 0), onClick: () => onDetail(t('detailMisses'), { minMisses: 1, limit: 100 }) }),
            Metric({ label: t('injectCaptured'), value: int(injection?.captured ?? 0), onClick: () => onDetail(t('detailCaptured'), { source: 'tool-failure', limit: 100 }) }),
            Metric({ label: t('injectRepeat'), value: int(injection?.repeatFailures ?? 0), onClick: () => onFailures(t('detailFailures')) }),
            Metric({ label: t('injectRefined'), value: int(injection?.refined ?? 0) }),
            Metric({ label: t('injectChars'), value: int(injection?.lastChars ?? 0) })),
          (() => {
          const options = semanticOptions ?? null;
          if (options === null) return null;
          const pairs = [];
          pairs.push({ value: '', label: t('semanticFollow') });
          for (const provider of options.providers ?? []) {
            const models = Array.isArray(provider.models) ? provider.models : [];
            if (models.length === 0) {
              pairs.push({ value: provider.id + '|', label: provider.label });
              continue;
            }
            for (const model of models) {
              const friendly = (provider.labels ?? {})[model];
              const text = typeof friendly === 'string' && friendly !== '' ? friendly + ' · ' + model : model;
              pairs.push({ value: provider.id + '|' + model, label: text });
            }
          }
          const saved = semanticChoice ?? '';
          const known = pairs.some((pair) => pair.value === saved);
          const value = known ? saved : '';
          return h('div', { className: 'lg-field' },
            h('span', { className: 'lg-field-label' }, t('semanticChoice')),
            h(Select, {
              value,
              options: pairs,
              onChange: (next) => {
                const sep = next.indexOf('|');
                const provider = next.slice(0, sep);
                const model = next.slice(sep + 1);
                onSemanticChoice(provider === '' || model === '' ? null : { provider, model });
              },
              ariaLabel: t('semanticChoice'),
            }));
        })(),
        h('label', { style: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, cursor: 'pointer' } },
            h('input', { type: 'checkbox', checked: semantic === true, disabled: busy !== '', onChange: (event) => onSemantic(event.target.checked) }),
        semantic === true && semanticStats !== undefined && semanticStats !== null
          ? h('div', { className: 'lg-card-hint', style: { marginTop: 8 } },
            h('div', { className: 'lg-row-meta' }, t('semanticStatsTitle')),
            semanticStats.calls === 0
              ? h('div', { className: 'lg-row-meta' }, t('semanticIdle'))
              : h('div', { className: 'lg-row-meta' },
                t('semanticCalls')
                  .replace('{n}', int(semanticStats.calls))
                  .replace('{ok}', int(semanticStats.ok))
                  .replace('{fail}', int(semanticStats.failed))
                  .replace('{to}', int(semanticStats.timeout))),
            semanticStats.calls > 0
              ? h('div', { className: 'lg-row-meta' },
                t('semanticLatency')
                  .replace('{ms}', int(semanticStats.lastLatencyMs))
                  .replace('{model}', String(semanticStats.model ?? '—')))
              : null,
            String(semanticStats.lastExpansion ?? '') !== ''
              ? h('div', { className: 'lg-row-meta' }, t('semanticLastExpansion').replace('{text}', String(semanticStats.lastExpansion)))
              : null,
            String(semanticStats.lastError ?? '') !== ''
              ? h('div', { className: 'lg-row-meta', style: { color: 'var(--dsw-alias-label-tertiary)' } }, t('semanticError').replace('{error}', String(semanticStats.lastError)))
              : null)
          : null,
            h('span', null, h('span', { className: 'lg-row-title' }, t('semanticToggle')),
              h('div', { className: 'lg-row-meta' }, t('semanticHint')))),
          h('div', { className: 'lg-status' }, t('injectHint')),
          h('div', { style: { marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 } },
            h(Chip, { kind: 'mute', children: `7d ${int(health?.usedLast7Days ?? 0)}` }),
            h(Chip, { kind: 'mute', children: `failures ${int(injection?.trackedFailures ?? 0)}` })))));
    }

    /* ================================================================ 进化 */

    function EvolutionTab({ t, derived, efficacy, onDecide, onPromote, busy, onDetail, onFailures }) {
      const lessonEff = new Map((efficacy?.lessonEfficacy ?? []).map((entry) => [entry.id, entry]));
      const lessons = derived?.lessons ?? [];
      const facts = derived?.facts ?? [];
      const skills = derived?.skills ?? [];

      return h('div', { className: 'lg-stack' },
        (() => {
          const attribution = efficacy?.attribution ?? null;
          if (attribution === null) return null;
          const pairs = attribution.pairs ?? [];
          if (pairs.length === 0) return null;
          const totals = attribution.totals ?? { lessons: 0, before: 0, after: 0, delta: 0 };
          const trend = Array.isArray(efficacy?.attributionTrend) ? efficacy.attributionTrend.slice(-7) : [];

          const before = Number(totals.before ?? 0);
          const after = Number(totals.after ?? 0);
          const reduction = before === 0 ? null : Math.round(((before - after) / before) * 1000) / 10;
          const head = h('div', { className: 'lg-metric-row' },
            Metric({ label: t('attrBefore'), value: int(before) }),
            Metric({ label: t('attrAfter'), value: int(after) }),
            Metric({
              label: t('attrDrop'),
              value: reduction === null ? '—' : String(reduction) + '%',
              caption:
                reduction === null
                  ? undefined
                  : h(Chip, {
                      kind: after < before ? 'ok' : after > before ? 'warn' : 'mute',
                      children: after < before ? t('attrFewer') : after > before ? t('attrMore') : t('attrSame'),
                    }),
            }),
          );

          const rows = h('div', { className: 'lg-rows' },
            pairs.map((pair) =>
              h('div', { className: 'lg-row', key: pair.tool + '|' + pair.code },
                h('div', { className: 'lg-row-main' },
                  h('div', { className: 'lg-row-title' }, pair.tool + (pair.code === '' ? '' : ' · ' + pair.code)),
                  h('div', { className: 'lg-row-meta' },
                    h('span', null, t('attrBefore') + ' ' + int(pair.before) + ' (' + t('attrPerDay').replace('{n}', pair.beforePerDay) + ')'),
                    h('span', null, t('attrAfter') + ' ' + int(pair.after) + ' (' + t('attrPerDay').replace('{n}', pair.afterPerDay) + ')'),
                    h('span', null, t('attrDays').replace('{n}', String(pair.windowDays))))),
                h('div', { className: 'lg-row-side' },
                  h(Chip, {
                    kind: pair.after < pair.before ? 'ok' : pair.after > pair.before ? 'warn' : 'mute',
                    children: (pair.after - pair.before > 0 ? '+' : '') + (pair.after - pair.before),
                  })))),
          );

          const trendItems = trend.map((entry) =>
            h('div', { className: 'lg-row', key: entry.day },
              h('div', { className: 'lg-row-main' },
                h('div', { className: 'lg-row-title' }, entry.day),
                h('div', { className: 'lg-row-meta' },
                  h('span', null, t('attrBefore') + ' ' + int(entry.totals?.before ?? 0) + ' → ' + t('attrAfter') + ' ' + int(entry.totals?.after ?? 0))))));
          const trendRows = trendItems.length === 0
            ? null
            : h('div', { style: { marginTop: 12 } },
                h('div', { className: 'lg-card-hint', style: { marginBottom: 6 } }, t('attrTrend')),
                h('div', { className: 'lg-rows' }, trendItems));
          return h(Card, { title: t('attrTitle'), hint: t('attrHint') }, head, rows, trendRows);
        })(),

        h('div', { style: { display: 'flex', justifyContent: 'flex-end', marginBottom: 6 } },
          h('button', { type: 'button', className: 'lg-btn lg-btn-ghost', onClick: () => onDetail(t('detailLessons'), { kind: 'lesson', limit: 100 }) }, t('detailOpen'))),
        (() => {
          const promotable = efficacy?.promotable ?? [];
          const cross = efficacy?.failures?.crossSession ?? [];
          if (promotable.length === 0 && cross.length === 0) return null;
          return h(Card, { title: t('promoteTitle'), hint: t('promoteHint') },
            cross.length > 0
              ? h('div', { className: 'lg-rows', style: { marginBottom: 10 } },
                  cross.slice(0, 5).map((entry) => h('div', { className: 'lg-row', key: 'cross-' + entry.tool + entry.code },
                    h('div', { className: 'lg-row-main' },
                      h('div', { className: 'lg-row-title' }, entry.tool + (entry.code === '' ? '' : ' · ' + entry.code)),
                      h('div', { className: 'lg-row-meta' }, h('span', null, t('promoteCross').replace('{s}', int(entry.sessions)).replace('{n}', int(entry.count))))),
                    h('div', { className: 'lg-row-side' }, h(Chip, { kind: entry.sessions >= 3 ? 'warn' : 'mute', children: int(entry.sessions) + '×' })))))
              : null,
            h('div', null, promotable.map((entry) => {
              const lesson = lessons.find((item) => item.id === entry.id);
              return h('div', { className: 'lg-row', key: 'promote-' + entry.id },
                h('div', { className: 'lg-row-main' },
                  h('div', { className: 'lg-row-title' }, lesson?.action ?? (entry.tool + ' · ' + entry.code)),
                  h('div', { className: 'lg-row-meta' },
                    h(Chip, { kind: 'warn', children: t('promoteCross').replace('{s}', int(entry.sessions)).replace('{n}', int(entry.failures)) }),
                    h(Chip, { kind: 'mute', children: 'private' }))),
                h('div', { className: 'lg-row-side' },
                  h('button', { type: 'button', className: 'lg-btn lg-btn-ghost', disabled: busy !== '', onClick: () => onPromote(entry.id, 'workspace') }, t('promoteWorkspace')),
                  h('button', { type: 'button', className: 'lg-btn lg-btn-ghost', disabled: busy !== '', onClick: () => onPromote(entry.id, 'global') }, t('promoteGlobal'))));
            })));
        })(),

        (() => {
          const regressions = efficacy?.regressions ?? [];
          if (regressions.length === 0) return null;
          return h(Card, { title: t('regressTitle'), hint: t('regressHint') },
            h('div', null, regressions.map((entry) => {
              const lesson = lessons.find((item) => item.id === entry.id);
              return h('div', { className: 'lg-row', key: entry.id },
                h('div', { className: 'lg-row-main' },
                  h('div', { className: 'lg-row-title' }, lesson?.action ?? (entry.tool + ' · ' + entry.code)),
                  h('div', { className: 'lg-row-meta' },
                    h(Chip, { kind: 'warn', children: int(entry.before) + ' -> ' + int(entry.after) }),
                    h('span', null, t('lessonHits').replace('{n}', int(entry.hits))))),
                h('div', { className: 'lg-row-side' },
                  h('button', { type: 'button', className: 'lg-btn lg-btn-ghost', disabled: busy !== '', onClick: () => onDecide(entry.id, 'retire') }, t('retire'))));
            })));
        })(),

        h(Collapsible, { title: t('detailTitle') },
        h(Card, { title: t('liveLessons'), hint: int(lessons.length) },
          lessons.length === 0
            ? h(Empty, { icon: 'lesson', title: t('noLiveLessons') })
            : h('div', null,
                lessons.map((item) =>
                  h('div', { className: 'lg-row', key: item.id },
                    h('div', { className: 'lg-row-main' },
                      h('div', { className: 'lg-row-title' }, item.action),
                      h('div', { className: 'lg-row-meta' },
                        item.category !== '' ? h(Chip, { children: item.category }) : null,
                        h(Chip, { kind: 'mute', children: item.sharing }),
                        h('span', null, t('lessonVotes').replace('{n}', int(item.votes))),
                        h('span', null, t('lessonHits').replace('{n}', int(item.hits))),
                        h('span', null, t('lessonMisses').replace('{n}', int(item.misses))),
                        (() => {
                          const eff = lessonEff.get(item.id);
                          if (eff === undefined) return null;
                          const shortWindow = Number(eff.windowDays ?? 0) < 1;
                          if (shortWindow) return h(Chip, { kind: 'mute', children: t('lessonObserving') });
                          return h(Chip, { kind: eff.delta < 0 ? 'ok' : eff.delta > 0 ? 'warn' : 'mute', children: int(eff.before) + ' -> ' + int(eff.after) });
                        })(),)))))),

        h('div', { style: { display: 'flex', justifyContent: 'flex-end', marginBottom: 6 } },
          h('button', { type: 'button', className: 'lg-btn lg-btn-ghost', onClick: () => onDetail(t('detailFacts'), { kind: 'constraint', limit: 100 }) }, t('detailOpen'))),
        h(Card, { title: t('liveFacts'), hint: int(facts.length) },
          facts.length === 0
            ? h(Empty, { icon: 'fact', title: t('noLiveFacts') })
            : h('div', null,
                facts.map((item) =>
                  h('div', { className: 'lg-row', key: item.id },
                    h('div', { className: 'lg-row-main' },
                      h('div', { className: 'lg-row-title' }, item.text),
                      h('div', { className: 'lg-row-meta' },
                        h(Chip, { kind: item.kind === 'constraint' ? 'accent' : undefined, children: t(KIND_LABEL[item.kind] ?? 'kindFact') }),
                        h(Chip, { kind: 'mute', children: item.sharing }),
                        h('span', null, t('factsEvidence').replace('{n}', int(item.evidence))))))))),

        h('div', { style: { display: 'flex', justifyContent: 'flex-end', marginBottom: 6 } },
          h('button', { type: 'button', className: 'lg-btn lg-btn-ghost', onClick: () => onDetail(t('detailSkills'), { kind: 'skill', limit: 100 }) }, t('detailOpen'))),

        (() => {
          const skillItems = skills.map((item) =>
            h('div', { className: 'lg-row', key: item.id },
              h('div', { className: 'lg-row-main' },
                h('div', { className: 'lg-row-title' }, item.goal),
                h('div', { className: 'lg-row-meta' },
                  h(Chip, { kind: item.state === 'candidate' ? 'warn' : 'ok', children: t(STATUS_LABEL[item.state] ?? 'statusCandidate') }),
                  h('span', null, t('lessonVotes').replace('{n}', int(item.evidence))))),
              h('div', { className: 'lg-row-side' },
                onDecide === undefined ? null : h('button', {
                  type: 'button',
                  className: 'lg-btn lg-btn-ghost',
                  disabled: busy !== '',
                  onClick: () => onDecide(item.id, 'accept'),
                }, t('accept')),
                onDecide === undefined ? null : h('button', {
                  type: 'button',
                  className: 'lg-btn lg-btn-ghost',
                  disabled: busy !== '',
                  onClick: () => onDecide(item.id, 'retire'),
                }, t('retire')))));
          return h(Card, { title: t('liveSkills'), hint: int(skills.length) },
            skillItems.length === 0 ? h(Empty, { icon: 'spark', title: t('noLiveSkills') }) : h('div', null, skillItems));
        })(),
        ),
      );
    }

    /* ================================================================ 面板 */

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
      const [semanticOn, setSemanticOn] = React.useState(data?.injection?.semantic === true);
      const [semanticChoice, setSemanticChoice] = React.useState('');
      const [semanticOptions, setSemanticOptions] = React.useState(null);

      React.useEffect(() => {
        requestJson('lingxi/semantic/options').then((body) => {
          if (body.ok !== true) return;
          setSemanticOptions(body);
          const saved = body.saved ?? null;
          const next = saved === null ? '' : String(saved.provider ?? '') + '|' + String(saved.model ?? '');
          // 只在首次回填，避免轮询覆盖用户正在浏览的选择
          setSemanticChoice((current) => (current === '' ? next : current));
        }).catch(() => {});
        // 依赖轮询时间戳：用户改了模型配置后，30 秒内列表自动跟随（无需刷新页面）
      }, [lastLoadedAt]);

      const semanticChoiceConfig = (picked) => run('semanticModel', async () => {
        await postJson('lingxi/injection/config', { semanticModel: picked });
        setSemanticChoice(picked === null ? '' : String(picked.provider) + '|' + String(picked.model));
        return t('confirmed');
      });
      const [notice, setNotice] = React.useState(null);
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
        await postJson('lingxi/injection/config', { semantic: next === true });
        setSemanticOn(next === true);
        await reload(true);
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
        if (tab === 'memory') body = h(MemoryTab, { t, memory, busy, context, injection: data.injection, onDecide: decide, onPromote: promote, onForget: forget, onInjection: injectionConfig, onHygiene: hygieneNow, onDetail: openDetail, onReset: openReset, onPurge: purge, onExport: exportAll, onImport: importAll, onImportError: importError, search: data.search, onSelfcheck: selfcheck, onDeleteOne: deleteOne, onAudit: auditStore, onRepair: repairStore, storage: data.storage, onMigrate: migrateStorage, semantic: semanticOn, onSemantic: semanticConfig, onSemanticChoice: semanticChoiceConfig, semanticChoice, setSemanticChoice, semanticOptions, semanticStats: data.semanticStats });
        else if (tab === 'evolution') body = h(EvolutionTab, { t, derived: data.derived, efficacy: data.efficacy, onDecide: decide, onPromote: promote, busy, onDetail: openDetail, onFailures: openFailures });
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

      return h('div', { className: 'lg-root' },
        h('div', { className: 'lg-shell' },
          h('header', { className: 'lg-header' },
            h('div', null,
              h('div', { className: 'lg-eyebrow' }, t('eyebrow')),
              h('h1', { className: 'lg-title' }, t('title')),
              h('p', { className: 'lg-subtitle' }, t('subtitle'))),
            h('div', { className: 'lg-actions' },
              h('span', { className: 'lg-pill' },
                h('span', { className: `lg-dot ${gate?.enabled === true ? 'lg-dot-ok' : 'lg-dot-warn'}` }),
                gate?.enabled === true ? t('injectRunning') : t('injectPaused')),
              h('span', { className: 'lg-pill' },
                h('span', { className: 'lg-dot lg-dot-ok' }),
                t('localOnly')),
              h('button', { type: 'button', className: 'lg-btn', disabled: busy !== '', onClick: consolidate },
                busy === 'consolidate' ? t('consolidating') : t('consolidate')),
              h('button', {
                type: 'button',
                className: 'lg-iconbtn',
                title: refreshing ? t('refreshing') : t('refresh'),
                'aria-label': t('refresh'),
                disabled: refreshing,
                onClick: () => reload(true),
              }, h('span', { className: refreshing ? 'lg-spin' : undefined }, h(Icon, { name: 'refresh' }))))),

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

