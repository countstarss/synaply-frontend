import {
  DashboardMetric,
  DashboardQuickAction,
  DashboardTimelineItem,
  TrendTone,
} from "@/components/dashboard-kit";

export const ADMIN_MODULES = [
  {
    id: "dashboard",
    label: "总览",
    href: "/dashboard",
    description: "MVP 主链路、待办队列与风险提醒。",
  },
  {
    id: "teachers",
    label: "老师审核",
    href: "/teachers",
    description: "TeacherProfile、科目、排期与资质审核。",
  },
  {
    id: "profiles",
    label: "用户档案",
    href: "/profiles",
    description: "用户、家长、学生、关系与地址簿。",
  },
  {
    id: "bookings",
    label: "预约履约",
    href: "/bookings",
    description: "Booking 全流程、到课打卡与课后反馈。",
  },
  {
    id: "operations",
    label: "评价运营",
    href: "/operations",
    description: "评价、售后、科目管理与运营规则占位。",
  },
  {
    id: "audit-logs",
    label: "审计日志",
    href: "/audit-logs",
    description: "AdminAuditLog 与关键动作留痕。",
  },
] as const;

export type DashboardLandingModule = (typeof ADMIN_MODULES)[number]["id"];
export type AdminModuleId = Exclude<DashboardLandingModule, "dashboard">;

export interface AdminStatusItem {
  label: string;
  value: string;
  note: string;
  tone?: TrendTone;
}

export interface AdminFieldItem {
  label: string;
  field: string;
  note: string;
  required?: boolean;
}

export interface AdminFieldGroup {
  title: string;
  description: string;
  badge: string;
  items: AdminFieldItem[];
}

export interface AdminTableColumn {
  key: string;
  label: string;
  kind?: "text" | "mono" | "muted" | "status";
}

export interface AdminTableRow {
  id: string;
  [key: string]: string;
}

export interface AdminPageData {
  title: string;
  description: string;
  badge: string;
  primaryAction: string;
  secondaryAction: string;
  metrics: DashboardMetric[];
  statusTitle: string;
  statusDescription: string;
  statuses: AdminStatusItem[];
  fieldGroupsTitle: string;
  fieldGroupsDescription: string;
  fieldGroups: AdminFieldGroup[];
  recordsTitle: string;
  recordsDescription: string;
  columns: AdminTableColumn[];
  rows: AdminTableRow[];
  timelineTitle: string;
  timeline: DashboardTimelineItem[];
  checklistTitle: string;
  checklist: string[];
  quickActions: DashboardQuickAction[];
}

const sparkline = (...values: number[]) => values;

export const ADMIN_DASHBOARD_DATA: AdminPageData = {
  title: "TuneTime Admin 总览",
  description:
    "围绕 MVP 闭环组织后台：老师入驻审核、家庭档案、预约履约、课后评价、人工售后与后台审计。当前全部使用 mockData，但字段命名已经向 Prisma schema 对齐。",
  badge: "MVP Admin Blueprint",
  primaryAction: "查看待处理队列",
  secondaryAction: "核对字段覆盖",
  metrics: [
    {
      id: "pending-teacher-review",
      label: "待审核老师",
      value: "18",
      trend: "+4 本周新增",
      tone: "warning",
      sparkline: sparkline(18, 26, 31, 28, 35, 41, 54),
      segment: "revenue",
    },
    {
      id: "household-completeness",
      label: "家庭档案完整率",
      value: "84%",
      trend: "+6.2%",
      tone: "positive",
      sparkline: sparkline(22, 33, 35, 48, 58, 67, 84),
      segment: "overview",
    },
    {
      id: "today-bookings",
      label: "今日待上门",
      value: "12",
      trend: "3 单需人工确认",
      tone: "warning",
      sparkline: sparkline(12, 18, 25, 39, 44, 53, 62),
      segment: "operations",
    },
    {
      id: "ops-watchlist",
      label: "差评 / 取消预警",
      value: "5",
      trend: "2 单需回访",
      tone: "warning",
      sparkline: sparkline(70, 58, 44, 39, 25, 18, 13),
      segment: "operations",
    },
  ],
  statusTitle: "MVP 后台覆盖面",
  statusDescription:
    "按 PRD 与 Prisma 现有实体拆出后台业务域，保证正式接后端时不用再回头补关键字段。",
  statuses: [
    {
      label: "老师入驻审核",
      value: "5 个模型",
      note: "TeacherProfile / TeacherSubject / TeacherServiceArea / Availability / Credential",
      tone: "positive",
    },
    {
      label: "家庭档案",
      value: "6 个模型",
      note: "User / UserRole / GuardianProfile / StudentProfile / StudentGuardian / Address",
      tone: "positive",
    },
    {
      label: "预约履约",
      value: "2 个主模型",
      note: "Booking 负责约课单据，Lesson 负责到课和课后反馈。",
      tone: "positive",
    },
    {
      label: "评价与售后",
      value: "1 个主模型 + 1 个衍生队列",
      note: "TeacherReview 已落库，投诉/换老师先以前台 mock 运营队列承接。",
      tone: "warning",
    },
    {
      label: "操作留痕",
      value: "100%",
      note: "关键审核、封禁、取消与补偿动作均应落到 AdminAuditLog。",
      tone: "positive",
    },
  ],
  fieldGroupsTitle: "已对齐的数据域",
  fieldGroupsDescription:
    "这里不是展示所有后端字段，而是确认 Admin 每个模块已经覆盖到正式开发必须用得上的字段集合。",
  fieldGroups: [
    {
      title: "老师资料与审核",
      description: "对齐老师入驻审核闭环，避免后续再补协议、面试、科目与资质字段。",
      badge: "Schema-backed",
      items: [
        {
          label: "老师主档",
          field: "TeacherProfile.displayName / verificationStatus / baseHourlyRate",
          note: "展示名、审核状态与基础课时费是审核列表与详情页的核心字段。",
          required: true,
        },
        {
          label: "协议与面试",
          field: "TeacherProfile.agreementAcceptedAt / agreementVersion / interviewedAt / interviewNotes",
          note: "PRD 明确老师审核需要协议确认和面试记录。",
          required: true,
        },
        {
          label: "科目与报价",
          field: "TeacherSubject.subjectId / hourlyRate / trialRate / experienceYears",
          note: "一个老师多个科目，且每个科目可有独立课时费与试听价。",
          required: true,
        },
        {
          label: "资质审核",
          field: "TeacherCredential.credentialType / reviewStatus / reviewNotes",
          note: "身份证、教学证明、无犯罪记录都需要逐项审核。",
          required: true,
        },
      ],
    },
    {
      title: "家庭、学生与地址",
      description: "对齐家长代孩子下单场景，支持无独立账号学生档案。",
      badge: "Schema-backed",
      items: [
        {
          label: "用户基座",
          field: "User.name / phone / status / timezone / locale",
          note: "用户状态、手机、时区与语言都可能影响履约展示与客服沟通。",
          required: true,
        },
        {
          label: "孩子资料",
          field: "StudentProfile.displayName / gradeLevel / dateOfBirth / learningGoals / specialNeeds",
          note: "年龄、阶段、目标与特殊需求是预约前的重要画像信息。",
          required: true,
        },
        {
          label: "监护关系",
          field: "StudentGuardian.relation / isPrimary / canBook / canViewRecords",
          note: "支持多监护人和代下单权限控制。",
          required: true,
        },
        {
          label: "上门地址",
          field: "Address.contactName / contactPhone / province / city / district / street / isDefault",
          note: "地址不是只有文本，还要有联系人与默认地址语义。",
          required: true,
        },
      ],
    },
    {
      title: "预约与课程履约",
      description: "对齐 Booking 与 Lesson 的状态流，覆盖接单、到课、课后反馈。",
      badge: "Schema-backed",
      items: [
        {
          label: "预约状态流",
          field: "Booking.status / teacherAcceptedAt / guardianConfirmedAt / cancellationReason",
          note: "支持待老师接单、家长确认、取消原因与状态回溯。",
          required: true,
        },
        {
          label: "价格拆分",
          field: "Booking.hourlyRate / subtotalAmount / discountAmount / platformFeeAmount / travelFeeAmount / totalAmount",
          note: "MVP 不做钱包，但订单金额明细要先具备。",
          required: true,
        },
        {
          label: "到课打卡",
          field: "Lesson.checkInAt / checkInAddress / checkOutAt / checkOutAddress",
          note: "至少要有时间与地址文本，正式开发时再决定是否强制经纬度。",
          required: true,
        },
        {
          label: "课后反馈",
          field: "Lesson.teacherSummary / homework / outcomeVideoUrl / feedbackSubmittedAt",
          note: "老师课后总结、作业建议与成果视频都已经有字段承载。",
          required: true,
        },
      ],
    },
    {
      title: "评价、运营与审计",
      description: "评价已落库，违规/售后先走 mock 运营队列，所有处理动作最终归档到日志。",
      badge: "Hybrid",
      items: [
        {
          label: "课后评价",
          field: "TeacherReview.rating / lessonQualityRating / teacherPerformanceRating / improvementNotes",
          note: "评价不仅是总分，还要能支撑差评回访和售后判断。",
          required: true,
        },
        {
          label: "科目管理",
          field: "Subject.code / name / description / isActive",
          note: "后台需要维护老师入驻和家长筛选用的科目清单。",
          required: true,
        },
        {
          label: "操作留痕",
          field: "AdminAuditLog.actorUserId / action / targetType / targetId / payload / createdAt",
          note: "审核、封禁、取消、补偿这些动作都需要可回放。",
          required: true,
        },
        {
          label: "运营工单占位",
          field: "mockQueue.issueType / owner / SLA / result",
          note: "投诉、换老师、补偿目前先以前端 mock 队列表达，后续可单独落表。",
        },
      ],
    },
  ],
  recordsTitle: "待处理工作台",
  recordsDescription:
    "把审核、履约、低分预警和日志抽成一张运营优先级队列表，方便先把后台结构定下来。",
  columns: [
    { key: "ticket", label: "工单", kind: "mono" },
    { key: "module", label: "模块" },
    { key: "subject", label: "对象" },
    { key: "status", label: "状态", kind: "status" },
    { key: "nextStep", label: "下一步" },
    { key: "updatedAt", label: "最近更新", kind: "muted" },
  ],
  rows: [
    {
      id: "queue-1",
      ticket: "OPS-301",
      module: "老师审核",
      subject: "李青老师 · 钢琴 / 乐理",
      status: "待审核",
      nextStep: "核对 NO_CRIMINAL_RECORD 与面试记录",
      updatedAt: "10 分钟前",
    },
    {
      id: "queue-2",
      ticket: "BK-1182",
      module: "预约履约",
      subject: "BK20260315-018 · 王悦学生",
      status: "今日待上门",
      nextStep: "确认老师已查看地址与课前计划",
      updatedAt: "25 分钟前",
    },
    {
      id: "queue-3",
      ticket: "OPS-297",
      module: "评价运营",
      subject: "赵老师 · 2 星评价",
      status: "需回访",
      nextStep: "人工联系家长，决定是否换老师",
      updatedAt: "1 小时前",
    },
    {
      id: "queue-4",
      ticket: "AUD-071",
      module: "审计日志",
      subject: "管理员封禁用户 u_4831",
      status: "高风险",
      nextStep: "复核 actor、target 与 payload",
      updatedAt: "今天 09:12",
    },
  ],
  timelineTitle: "今天的后台动作",
  timeline: [
    {
      id: "dashboard-timeline-1",
      title: "老师审核详情补齐协议字段",
      detail: "TeacherProfile.agreementAcceptedAt、agreementVersion 已纳入 UI 说明卡片。",
      time: "11:18",
    },
    {
      id: "dashboard-timeline-2",
      title: "预约列表加入 Lesson 履约状态",
      detail: "在 Booking 工作台旁补了 check-in / feedbackSubmittedAt 的履约视角。",
      time: "10:42",
    },
    {
      id: "dashboard-timeline-3",
      title: "运营队列标记为 mock only",
      detail: "投诉、补偿、换老师暂不对齐后端表，避免误以为已落库。",
      time: "09:35",
    },
  ],
  checklistTitle: "正式接后端前建议",
  checklist: [
    "先按页面字段清单核对 Nest DTO 与 Prisma select/include",
    "钱包、支付意图、提现账户继续隐藏，不在 MVP 主导航暴露",
    "投诉/换老师/补偿先走人工工单，后续再决定是否单独建模",
    "所有审核、封禁、取消、补偿动作统一追加到 AdminAuditLog",
  ],
  quickActions: [
    {
      id: "dashboard-action-1",
      label: "打开老师审核页",
      description: "继续细化 TeacherProfile、Credential 与 Availability 展示。",
      shortcut: "T",
    },
    {
      id: "dashboard-action-2",
      label: "检查预约履约页",
      description: "核对 Booking / Lesson 的状态和价格字段是否完整。",
      shortcut: "B",
    },
  ],
};

export const ADMIN_MODULE_DATA: Record<AdminModuleId, AdminPageData> = {
  teachers: {
    title: "老师审核",
    description:
      "围绕 TeacherProfile 主档、科目报价、服务范围、可约时间和资质材料组织后台审核页。这里的 UI 先用 mockData，但字段已经按 Prisma 关系拆开。",
    badge: "Teacher Intake",
    primaryAction: "发起批量审核",
    secondaryAction: "查看字段说明",
    metrics: [
      {
        label: "待初审",
        value: "11",
        trend: "+3 今日新增",
        tone: "warning",
        sparkline: sparkline(19, 28, 32, 37, 41, 46, 58),
      },
      {
        label: "待补件",
        value: "6",
        trend: "2 份证件过期",
        tone: "warning",
        sparkline: sparkline(68, 56, 48, 42, 31, 25, 17),
      },
      {
        label: "已通过",
        value: "37",
        trend: "+12.5%",
        tone: "positive",
        sparkline: sparkline(18, 22, 28, 34, 40, 46, 52),
      },
      {
        label: "排期已配置",
        value: "29",
        trend: "覆盖 78%",
        tone: "positive",
        sparkline: sparkline(21, 29, 37, 44, 53, 61, 78),
      },
    ],
    statusTitle: "审核漏斗",
    statusDescription:
      "把老师审核拆成资料、面试、证件、排期四块，便于正式接接口后按卡片分组返回。",
    statuses: [
      {
        label: "资料完整",
        value: "42 / 54",
        note: "TeacherProfile、TeacherSubject、TeacherServiceArea 已齐。",
        tone: "positive",
      },
      {
        label: "面试待安排",
        value: "7",
        note: "需要填 interviewedAt 与 interviewNotes。",
        tone: "warning",
      },
      {
        label: "证件待复核",
        value: "9",
        note: "TeacherCredential.reviewStatus 仍是 PENDING。",
        tone: "warning",
      },
      {
        label: "协议未确认",
        value: "4",
        note: "agreementAcceptedAt / agreementVersion 缺失。",
        tone: "warning",
      },
    ],
    fieldGroupsTitle: "页面字段覆盖",
    fieldGroupsDescription:
      "老师审核页重点不是只看名字和电话，而是完整承接入驻审核每一步需要的字段。",
    fieldGroups: [
      {
        title: "TeacherProfile",
        description: "老师主档与审核状态。",
        badge: "Schema-backed",
        items: [
          {
            label: "展示与状态",
            field: "displayName / bio / verificationStatus / employmentType",
            note: "审核列表与详情卡片的主信息。",
            required: true,
          },
          {
            label: "报价与服务半径",
            field: "baseHourlyRate / serviceRadiusKm / maxTravelMinutes / acceptTrial",
            note: "影响家长筛选和订单价格预估。",
            required: true,
          },
          {
            label: "协议与面试",
            field: "agreementAcceptedAt / agreementVersion / interviewedAt / interviewNotes",
            note: "PRD 明确要求老师审核要能看到这些信息。",
            required: true,
          },
        ],
      },
      {
        title: "TeacherSubject",
        description: "多科目、多价格配置。",
        badge: "Schema-backed",
        items: [
          {
            label: "科目报价",
            field: "subjectId / hourlyRate / trialRate",
            note: "同一老师不同科目价格可以不同。",
            required: true,
          },
          {
            label: "经验与启用",
            field: "experienceYears / isActive",
            note: "后台能直接决定该科目是否对外展示。",
            required: true,
          },
        ],
      },
      {
        title: "TeacherServiceArea + Availability",
        description: "服务范围与接单时间。",
        badge: "Schema-backed",
        items: [
          {
            label: "服务区域",
            field: "province / city / district / radiusKm",
            note: "家长筛选“区域”时依赖这组字段。",
            required: true,
          },
          {
            label: "固定时段",
            field: "weekday / startMinute / endMinute / slotDurationMinutes / bufferMinutes",
            note: "决定老师什么时候可以被预约。",
            required: true,
          },
          {
            label: "临时不可约",
            field: "TeacherAvailabilityBlock.startAt / endAt / reason",
            note: "支持请假、临时占用等排期修正。",
          },
        ],
      },
      {
        title: "TeacherCredential",
        description: "证件与平台审核意见。",
        badge: "Schema-backed",
        items: [
          {
            label: "证件元数据",
            field: "credentialType / name / issuedBy / issuedAt / expiresAt / fileUrl",
            note: "既要能预览图片，也要能看证件是否过期。",
            required: true,
          },
          {
            label: "审核留痕",
            field: "reviewStatus / reviewNotes / reviewedByUserId / reviewedAt",
            note: "每项证件都需要单独的审核结果和备注。",
            required: true,
          },
        ],
      },
    ],
    recordsTitle: "老师审核队列",
    recordsDescription:
      "用列表验证正式开发时接口至少要把老师主档、科目汇总、城市、资质状态和最近操作同时给到前端。",
    columns: [
      { key: "teacherId", label: "教师ID", kind: "mono" },
      { key: "teacher", label: "老师" },
      { key: "subjects", label: "科目配置" },
      { key: "serviceArea", label: "服务范围" },
      { key: "credentialStatus", label: "资质" , kind: "status" },
      { key: "reviewStatus", label: "审核状态", kind: "status" },
      { key: "updatedAt", label: "最近动作", kind: "muted" },
    ],
    rows: [
      {
        id: "teacher-row-1",
        teacherId: "TP-1021",
        teacher: "李青 · 全职",
        subjects: "钢琴 ¥260 / 乐理 ¥220 / 试听 ¥180",
        serviceArea: "上海 徐汇 / 长宁，半径 12km",
        credentialStatus: "待复核",
        reviewStatus: "待审核",
        updatedAt: "今天 10:58",
      },
      {
        id: "teacher-row-2",
        teacherId: "TP-1018",
        teacher: "周禾 · 兼职",
        subjects: "小提琴 ¥320 / 试听 ¥260",
        serviceArea: "上海 浦东，半径 10km",
        credentialStatus: "已通过",
        reviewStatus: "待面试",
        updatedAt: "今天 09:42",
      },
      {
        id: "teacher-row-3",
        teacherId: "TP-1006",
        teacher: "陈悦 · 全职",
        subjects: "声乐 ¥280 / 视唱练耳 ¥240",
        serviceArea: "上海 闵行 / 松江，半径 18km",
        credentialStatus: "需补件",
        reviewStatus: "待审核",
        updatedAt: "昨天 18:20",
      },
      {
        id: "teacher-row-4",
        teacherId: "TP-0994",
        teacher: "林栀 · 兼职",
        subjects: "古筝 ¥300 / 乐理 ¥200",
        serviceArea: "上海 普陀，半径 8km",
        credentialStatus: "已通过",
        reviewStatus: "已通过",
        updatedAt: "昨天 16:08",
      },
    ],
    timelineTitle: "审核动态",
    timeline: [
      {
        id: "teacher-timeline-1",
        title: "新增无犯罪记录材料核验",
        detail: "CredentialType.NO_CRIMINAL_RECORD 已加入审核说明。",
        time: "11:06",
      },
      {
        id: "teacher-timeline-2",
        title: "面试区块接入 mock 备注",
        detail: "面试时间、面评结论和下一步建议已放入详情卡布局。",
        time: "10:14",
      },
      {
        id: "teacher-timeline-3",
        title: "排期规则从“可约”拆为固定规则 + 临时 block",
        detail: "TeacherAvailabilityRule 与 TeacherAvailabilityBlock 已分开展示。",
        time: "09:11",
      },
    ],
    checklistTitle: "老师审核页注意点",
    checklist: [
      "不要把证件审核只做成整体通过，TeacherCredential 需要逐项状态",
      "老师科目价格不能挂在 TeacherProfile 上，要走 TeacherSubject",
      "服务范围和排期都要能独立维护，后端查询时建议分别 include",
      "协议确认和面试记录必须在审核 UI 中有独立位置",
    ],
    quickActions: [
      {
        id: "teacher-action-1",
        label: "补老师详情抽屉",
        description: "把 TeacherProfile、Credential、Availability 做成可展开详情。",
        shortcut: "D",
      },
      {
        id: "teacher-action-2",
        label: "定义审核状态文案",
        description: "统一 PENDING / APPROVED / REJECTED / SUSPENDED 的前端文案。",
        shortcut: "R",
      },
    ],
  },
  profiles: {
    title: "用户档案",
    description:
      "把 User、GuardianProfile、StudentProfile、StudentGuardian、Address 按“一个家庭”来组织，方便后台查看谁在下单、谁是孩子、默认地址在哪。",
    badge: "Household Graph",
    primaryAction: "新建家庭档案",
    secondaryAction: "检查字段映射",
    metrics: [
      {
        label: "活跃家长档案",
        value: "126",
        trend: "+14 本周",
        tone: "positive",
        sparkline: sparkline(16, 20, 27, 38, 49, 61, 73),
      },
      {
        label: "学生档案",
        value: "182",
        trend: "38% 无独立账号",
        tone: "neutral",
        sparkline: sparkline(22, 31, 37, 45, 56, 68, 76),
      },
      {
        label: "默认地址覆盖",
        value: "91%",
        trend: "+3.4%",
        tone: "positive",
        sparkline: sparkline(33, 44, 52, 61, 73, 81, 91),
      },
      {
        label: "多监护人家庭",
        value: "24",
        trend: "需显示权限",
        tone: "warning",
        sparkline: sparkline(11, 15, 20, 24, 29, 35, 41),
      },
    ],
    statusTitle: "家庭档案层级",
    statusDescription:
      "用户不等于家长；学生也不一定有独立账号。Admin UI 需要能把这些关系一眼看清。",
    statuses: [
      {
        label: "User 基础账号",
        value: "User + UserRole",
        note: "登录状态、角色、语言时区都挂在账号层。",
        tone: "positive",
      },
      {
        label: "GuardianProfile",
        value: "126",
        note: "管理紧急联系人和默认服务地址。",
        tone: "positive",
      },
      {
        label: "StudentProfile",
        value: "182",
        note: "支持无账号孩子档案，userId 可为空。",
        tone: "positive",
      },
      {
        label: "StudentGuardian",
        value: "214",
        note: "要能看主监护人、能否下单、是否能看课程记录。",
        tone: "warning",
      },
    ],
    fieldGroupsTitle: "档案字段覆盖",
    fieldGroupsDescription:
      "后台用户管理不止是账号列表，要能看到家庭与孩子的业务身份信息。",
    fieldGroups: [
      {
        title: "User + UserRole",
        description: "账号层与角色层。",
        badge: "Schema-backed",
        items: [
          {
            label: "账号基础",
            field: "name / email / phone / status / timezone / locale",
            note: "客服、通知、时区展示都依赖这组字段。",
            required: true,
          },
          {
            label: "角色关系",
            field: "UserRole.role / isPrimary",
            note: "一个用户可以同时是 GUARDIAN 和 STUDENT。",
            required: true,
          },
        ],
      },
      {
        title: "GuardianProfile",
        description: "家长资料。",
        badge: "Schema-backed",
        items: [
          {
            label: "联系人",
            field: "displayName / phone / emergencyContactName / emergencyContactPhone",
            note: "售后与紧急情况都要用到。",
            required: true,
          },
          {
            label: "默认地址",
            field: "defaultServiceAddressId",
            note: "和 Address 表关联，后台需要能直接跳过去看详情。",
          },
        ],
      },
      {
        title: "StudentProfile + StudentGuardian",
        description: "孩子资料与监护关系。",
        badge: "Schema-backed",
        items: [
          {
            label: "孩子画像",
            field: "displayName / gradeLevel / dateOfBirth / schoolName / learningGoals / specialNeeds",
            note: "直接影响老师匹配与课前准备。",
            required: true,
          },
          {
            label: "监护权限",
            field: "relation / isPrimary / canBook / canViewRecords",
            note: "同一学生多个监护人时必须展示清楚。",
            required: true,
          },
        ],
      },
      {
        title: "Address",
        description: "地址簿与服务地址。",
        badge: "Schema-backed",
        items: [
          {
            label: "联系人 + 地理信息",
            field: "label / contactName / contactPhone / province / city / district / street / building",
            note: "上门授课地址需要比普通电商地址更完整。",
            required: true,
          },
          {
            label: "默认语义",
            field: "isDefault / latitude / longitude",
            note: "MVP 可先弱化经纬度，但字段位要留出来。",
          },
        ],
      },
    ],
    recordsTitle: "家庭档案视图",
    recordsDescription:
      "以家庭为单位把家长、孩子、默认地址和账号状态拼起来，便于验证正式接口返回结构。",
    columns: [
      { key: "householdId", label: "家庭ID", kind: "mono" },
      { key: "guardian", label: "家长" },
      { key: "students", label: "学生" },
      { key: "address", label: "默认地址" },
      { key: "accountStatus", label: "账号状态", kind: "status" },
      { key: "completeness", label: "资料完整度", kind: "status" },
      { key: "updatedAt", label: "最近更新", kind: "muted" },
    ],
    rows: [
      {
        id: "profile-row-1",
        householdId: "HH-3021",
        guardian: "王敏 / 139****2024 / 主监护人",
        students: "王悦(小学) / 王知(幼儿园)",
        address: "徐汇区 漕溪北路 88 号，已设默认",
        accountStatus: "活跃",
        completeness: "已完整",
        updatedAt: "今天 10:05",
      },
      {
        id: "profile-row-2",
        householdId: "HH-3017",
        guardian: "赵峰 / 138****1120 / 父亲",
        students: "赵安(初中)",
        address: "浦东新区 丁香路 66 弄",
        accountStatus: "活跃",
        completeness: "待补充",
        updatedAt: "今天 09:31",
      },
      {
        id: "profile-row-3",
        householdId: "HH-3008",
        guardian: "刘婷 / 136****7731 / 母亲",
        students: "刘禾(成人)",
        address: "长宁区 仙霞路 1200 号",
        accountStatus: "暂停",
        completeness: "需复核",
        updatedAt: "昨天 19:04",
      },
      {
        id: "profile-row-4",
        householdId: "HH-2995",
        guardian: "陈启 / 137****5532 / 外公",
        students: "陈恬(小学)",
        address: "闵行区 七宝镇",
        accountStatus: "活跃",
        completeness: "已完整",
        updatedAt: "昨天 16:40",
      },
    ],
    timelineTitle: "档案维护动态",
    timeline: [
      {
        id: "profile-timeline-1",
        title: "学生生日字段加入视图",
        detail: "StudentProfile.dateOfBirth 已用于年龄与年级并排展示。",
        time: "10:48",
      },
      {
        id: "profile-timeline-2",
        title: "多监护人权限加入摘要",
        detail: "把 canBook / canViewRecords 显示在家庭详情摘要里。",
        time: "09:55",
      },
      {
        id: "profile-timeline-3",
        title: "地址列表补联系人字段",
        detail: "Address.contactName 与 contactPhone 不再只在详情页展示。",
        time: "08:42",
      },
    ],
    checklistTitle: "用户档案页注意点",
    checklist: [
      "学生不一定有账号，前端不要把 StudentProfile.userId 写死成必填",
      "家长与学生是多对多，不要直接在 StudentProfile 上写 guardianName",
      "Address 要展示联系人，不只是省市区街道",
      "账号层和业务身份层需要分开展示，避免后续权限和业务字段混在一起",
    ],
    quickActions: [
      {
        id: "profile-action-1",
        label: "做家庭详情页",
        description: "把 Guardian、Students、Address 与 Booking 入口收进一个详情布局。",
        shortcut: "H",
      },
      {
        id: "profile-action-2",
        label: "补多角色标签",
        description: "支持一个 User 同时拥有多个 UserRole 的展示。",
        shortcut: "U",
      },
    ],
  },
  bookings: {
    title: "预约履约",
    description:
      "把 Booking 作为业务中枢，同时在后台一屏内看到 Lesson 的到课和课后反馈情况。钱包和提现相关能力仍然隐藏，只保留订单金额与支付状态快照。",
    badge: "Booking Core",
    primaryAction: "查看订单详情",
    secondaryAction: "检查状态流",
    metrics: [
      {
        label: "待老师接单",
        value: "9",
        trend: "最早 14:00 超时",
        tone: "warning",
        sparkline: sparkline(18, 24, 36, 43, 38, 28, 17),
      },
      {
        label: "待确认 / 进行中",
        value: "21",
        trend: "8 单今天上门",
        tone: "neutral",
        sparkline: sparkline(12, 20, 31, 44, 52, 61, 74),
      },
      {
        label: "已完成",
        value: "142",
        trend: "+18.3%",
        tone: "positive",
        sparkline: sparkline(14, 22, 31, 45, 55, 66, 78),
      },
      {
        label: "取消 / 退款",
        value: "7",
        trend: "2 单天气原因",
        tone: "warning",
        sparkline: sparkline(76, 63, 47, 38, 24, 19, 12),
      },
    ],
    statusTitle: "预约状态链路",
    statusDescription:
      "Booking.status 承担主状态流，Lesson.attendanceStatus 承担履约状态流，二者要一起出现。",
    statuses: [
      {
        label: "PENDING_ACCEPTANCE",
        value: "9",
        note: "老师还未接单，后台要提示 SLA。",
        tone: "warning",
      },
      {
        label: "CONFIRMED",
        value: "13",
        note: "已接单，等待上课开始。",
        tone: "positive",
      },
      {
        label: "IN_PROGRESS",
        value: "8",
        note: "需要同时看 Lesson.checkInAt 与 attendanceStatus。",
        tone: "warning",
      },
      {
        label: "COMPLETED",
        value: "142",
        note: "可继续下钻 Lesson 和 TeacherReview。",
        tone: "positive",
      },
    ],
    fieldGroupsTitle: "Booking / Lesson 字段覆盖",
    fieldGroupsDescription:
      "订单页要承担关系、时间、价格、支付状态和到课打卡，不只是一个普通列表。",
    fieldGroups: [
      {
        title: "Booking 核心关系",
        description: "谁约了谁、给谁上、在哪里上。",
        badge: "Schema-backed",
        items: [
          {
            label: "关系字段",
            field: "bookingNo / teacherProfileId / studentProfileId / guardianProfileId / subjectId / serviceAddressId",
            note: "订单详情页所有跳转入口都来自这些外键。",
            required: true,
          },
          {
            label: "时间字段",
            field: "startAt / endAt / timezone / durationMinutes",
            note: "课程安排和跨时区展示都要依赖这些字段。",
            required: true,
          },
        ],
      },
      {
        title: "Booking 状态与备注",
        description: "支持试听、接单、确认、取消和计划摘要。",
        badge: "Schema-backed",
        items: [
          {
            label: "状态链路",
            field: "status / teacherAcceptedAt / guardianConfirmedAt / cancelledAt / cancellationReason / cancelledByUserId",
            note: "售后判断需要追溯谁在什么时候做了什么动作。",
            required: true,
          },
          {
            label: "课前说明",
            field: "isTrial / planSummary / notes",
            note: "试听和老师课前准备都通过这组字段承接。",
          },
        ],
      },
      {
        title: "Booking 金额快照",
        description: "MVP 保留订单支付状态，但不开放钱包结算页。",
        badge: "Schema-backed",
        items: [
          {
            label: "金额拆分",
            field: "hourlyRate / subtotalAmount / discountAmount / platformFeeAmount / travelFeeAmount / totalAmount / currency",
            note: "订单页和售后页都要看这部分。",
            required: true,
          },
          {
            label: "支付状态",
            field: "paymentStatus / paymentDueAt",
            note: "先展示支付结果，不把 PaymentIntent、Wallet 暴露到导航里。",
          },
        ],
      },
      {
        title: "Lesson 履约记录",
        description: "打卡、课后反馈与成果视频。",
        badge: "Schema-backed",
        items: [
          {
            label: "到课打卡",
            field: "attendanceStatus / checkInAt / checkInAddress / startedAt / endedAt / checkOutAt / checkOutAddress",
            note: "MVP 先看时间和地址文本，后续再决定是否强制经纬度。",
            required: true,
          },
          {
            label: "课后反馈",
            field: "teacherSummary / homework / outcomeVideoUrl / feedbackSubmittedAt / guardianFeedback",
            note: "老师反馈和家长确认都要保留入口。",
          },
        ],
      },
    ],
    recordsTitle: "预约工作台",
    recordsDescription:
      "把 Booking 和 Lesson 核心状态合并在一张表里，验证后台需要的联合返回结构。",
    columns: [
      { key: "bookingNo", label: "预约号", kind: "mono" },
      { key: "teacher", label: "老师 / 科目" },
      { key: "student", label: "学生 / 家长" },
      { key: "schedule", label: "时间 / 地址" },
      { key: "bookingStatus", label: "预约状态", kind: "status" },
      { key: "lessonStatus", label: "履约状态", kind: "status" },
      { key: "paymentStatus", label: "支付状态", kind: "status" },
      { key: "updatedAt", label: "最近更新", kind: "muted" },
    ],
    rows: [
      {
        id: "booking-row-1",
        bookingNo: "BK20260315-018",
        teacher: "李青 · 钢琴",
        student: "王悦 / 家长 王敏",
        schedule: "03-16 14:00 / 徐汇区 漕溪北路",
        bookingStatus: "待老师接单",
        lessonStatus: "未开始",
        paymentStatus: "未支付",
        updatedAt: "今天 11:02",
      },
      {
        id: "booking-row-2",
        bookingNo: "BK20260315-011",
        teacher: "周禾 · 小提琴",
        student: "赵安 / 家长 赵峰",
        schedule: "03-15 18:30 / 浦东新区 丁香路",
        bookingStatus: "已确认",
        lessonStatus: "待上门",
        paymentStatus: "已支付",
        updatedAt: "今天 10:17",
      },
      {
        id: "booking-row-3",
        bookingNo: "BK20260314-099",
        teacher: "林栀 · 古筝",
        student: "陈恬 / 家长 陈启",
        schedule: "03-15 09:00 / 闵行区 七宝镇",
        bookingStatus: "进行中",
        lessonStatus: "已签到",
        paymentStatus: "已支付",
        updatedAt: "今天 09:35",
      },
      {
        id: "booking-row-4",
        bookingNo: "BK20260313-082",
        teacher: "陈悦 · 声乐",
        student: "刘禾 / 家长 刘婷",
        schedule: "03-14 19:00 / 长宁区 仙霞路",
        bookingStatus: "已取消",
        lessonStatus: "已取消",
        paymentStatus: "已退款",
        updatedAt: "昨天 20:42",
      },
    ],
    timelineTitle: "预约链路动态",
    timeline: [
      {
        id: "booking-timeline-1",
        title: "订单金额明细拆成 5 段",
        detail: "subtotal / discount / platformFee / travelFee / total 已独立展示。",
        time: "10:54",
      },
      {
        id: "booking-timeline-2",
        title: "履约记录增加 checkOut 展示位",
        detail: "Lesson.checkOutAt / checkOutAddress 已出现在右侧详情卡。",
        time: "09:58",
      },
      {
        id: "booking-timeline-3",
        title: "试听单标签接入",
        detail: "Booking.isTrial 现在会在列表和详情页同时出现。",
        time: "08:46",
      },
    ],
    checklistTitle: "预约履约页注意点",
    checklist: [
      "Booking 是业务中枢，详情页需要能联到 teacher / guardian / student / address",
      "MVP 不做钱包页，但 Booking.paymentStatus 仍然要展示",
      "到课打卡和课后反馈属于 Lesson，不要继续堆到 Booking 上",
      "取消原因和取消人要显式展示，后续售后才能追踪",
    ],
    quickActions: [
      {
        id: "booking-action-1",
        label: "补 Booking 详情抽屉",
        description: "把金额明细、课前计划、取消信息和 Lesson 摘要收进详情层。",
        shortcut: "O",
      },
      {
        id: "booking-action-2",
        label: "核对状态映射",
        description: "统一 BookingStatus、PaymentStatus、LessonAttendanceStatus 的文案。",
        shortcut: "S",
      },
    ],
  },
  operations: {
    title: "评价运营",
    description:
      "先把 TeacherReview、Subject 和人工售后/违规处理的运营工作台做出来。评价和科目直接对齐 schema，投诉/换老师/补偿先作为 mock queue 占位。",
    badge: "Ops Desk",
    primaryAction: "查看低分评价",
    secondaryAction: "核对运营字段",
    metrics: [
      {
        label: "待处理评价",
        value: "14",
        trend: "5 条低于 3 星",
        tone: "warning",
        sparkline: sparkline(72, 63, 57, 45, 39, 27, 18),
      },
      {
        label: "启用科目",
        value: "18",
        trend: "+2 新增试听标签",
        tone: "positive",
        sparkline: sparkline(17, 24, 31, 38, 44, 52, 61),
      },
      {
        label: "人工售后队列",
        value: "6",
        trend: "2 单换老师申请",
        tone: "warning",
        sparkline: sparkline(61, 54, 43, 39, 31, 24, 16),
      },
      {
        label: "已关闭工单",
        value: "29",
        trend: "平均 1.6 天",
        tone: "positive",
        sparkline: sparkline(14, 18, 24, 31, 42, 53, 67),
      },
    ],
    statusTitle: "运营工作面",
    statusDescription:
      "评价、科目和人工售后先放在一个工作面，后续再决定是否拆成独立后端实体。",
    statuses: [
      {
        label: "TeacherReview",
        value: "真实落库",
        note: "评分、课堂质量、老师表现、改进建议都已有字段。",
        tone: "positive",
      },
      {
        label: "Subject",
        value: "真实落库",
        note: "用于老师入驻、筛选与预约流程。",
        tone: "positive",
      },
      {
        label: "投诉 / 换老师 / 补偿",
        value: "mock queue",
        note: "当前先人工处理，不假装已存在 Prisma 表。",
        tone: "warning",
      },
      {
        label: "运营规则",
        value: "mock policy",
        note: "如提前 24 小时预约、必须上传哪些资质，先以前端说明承载。",
        tone: "warning",
      },
    ],
    fieldGroupsTitle: "评价与运营字段覆盖",
    fieldGroupsDescription:
      "把已落库和未落库的内容显式分开，避免正式开发时误判哪些能力已经有后端承载。",
    fieldGroups: [
      {
        title: "TeacherReview",
        description: "课后评价与改进建议。",
        badge: "Schema-backed",
        items: [
          {
            label: "评分维度",
            field: "rating / lessonQualityRating / teacherPerformanceRating",
            note: "MVP 售后判断至少需要这三项评分。",
            required: true,
          },
          {
            label: "评价内容",
            field: "comment / improvementNotes / tags",
            note: "差评跟进和推荐系统都会用到。",
          },
        ],
      },
      {
        title: "Subject",
        description: "科目配置。",
        badge: "Schema-backed",
        items: [
          {
            label: "基础字段",
            field: "code / name / description / isActive",
            note: "后台科目管理页的最小字段集合。",
            required: true,
          },
        ],
      },
      {
        title: "人工售后队列",
        description: "当前仅做运营占位，不宣称已落库。",
        badge: "Mock-only",
        items: [
          {
            label: "工单上下文",
            field: "mockIssue.sourceBookingNo / sourceReviewId / issueType / owner",
            note: "把投诉、换老师、补偿统一先放到运营队列里。",
          },
          {
            label: "处理结果",
            field: "mockIssue.priority / SLA / resolution / followUpAt",
            note: "等需求稳定后，再评估是否单独建表。",
          },
        ],
      },
      {
        title: "运营规则说明",
        description: "当前只做政策说明卡，不接后端。",
        badge: "Mock-only",
        items: [
          {
            label: "预约规则",
            field: "policy.bookingLeadHours / allowTrial / cancellationPolicy",
            note: "PRD 中这些规则已经明确，但还不急着落库。",
          },
          {
            label: "资质要求",
            field: "policy.requiredCredentialTypes",
            note: "至少包含教学证明、身份证、无犯罪记录。",
          },
        ],
      },
    ],
    recordsTitle: "运营处理队列",
    recordsDescription:
      "用于承接低分评价、取消订单、换老师和人工补偿等操作，显式标明哪些是 mock-only。",
    columns: [
      { key: "issueId", label: "工单", kind: "mono" },
      { key: "source", label: "来源" },
      { key: "subject", label: "对象" },
      { key: "issueType", label: "问题类型" },
      { key: "status", label: "当前状态", kind: "status" },
      { key: "owner", label: "负责人" },
      { key: "updatedAt", label: "最近更新", kind: "muted" },
    ],
    rows: [
      {
        id: "ops-row-1",
        issueId: "OPS-301",
        source: "TeacherReview / RV-208",
        subject: "赵老师 · 王悦同学",
        issueType: "低分回访",
        status: "需回访",
        owner: "运营-苏宁",
        updatedAt: "今天 10:41",
      },
      {
        id: "ops-row-2",
        issueId: "OPS-298",
        source: "Booking / BK20260314-082",
        subject: "陈悦老师",
        issueType: "天气取消补偿",
        status: "处理中",
        owner: "客服-沈越",
        updatedAt: "今天 09:56",
      },
      {
        id: "ops-row-3",
        issueId: "OPS-294",
        source: "TeacherReview / RV-203",
        subject: "周禾老师",
        issueType: "换老师申请",
        status: "待评估",
        owner: "运营-苏宁",
        updatedAt: "昨天 18:26",
      },
      {
        id: "ops-row-4",
        issueId: "SUB-018",
        source: "Subject",
        subject: "视唱练耳",
        issueType: "科目启停审核",
        status: "待发布",
        owner: "内容-程岚",
        updatedAt: "昨天 16:05",
      },
    ],
    timelineTitle: "运营动态",
    timeline: [
      {
        id: "ops-timeline-1",
        title: "评价页拆成总分 + 维度分",
        detail: "TeacherReview.rating / lessonQualityRating / teacherPerformanceRating 已分别展示。",
        time: "10:33",
      },
      {
        id: "ops-timeline-2",
        title: "科目管理加入 code",
        detail: "Subject.code 已放进列表，方便后续对接枚举和导入。",
        time: "09:21",
      },
      {
        id: "ops-timeline-3",
        title: "售后工单显式标记为 mock-only",
        detail: "避免把人工工单误认为已经有 Prisma 模型。",
        time: "08:58",
      },
    ],
    checklistTitle: "评价运营页注意点",
    checklist: [
      "评价维度要直接对齐 TeacherReview，不要只保留 comment",
      "科目管理是后台必要模块，至少要能启停和维护说明",
      "投诉 / 换老师 / 补偿当前还没落表，前端必须标识为 mock-only",
      "运营处理完成后记得把结论同步写入审计日志",
    ],
    quickActions: [
      {
        id: "ops-action-1",
        label: "做评价详情卡",
        description: "展示评分维度、改进建议、关联 Booking 和 Lesson 摘要。",
        shortcut: "V",
      },
      {
        id: "ops-action-2",
        label: "补运营规则卡",
        description: "把提前预约时长、试听规则、取消策略整理为显式说明。",
        shortcut: "P",
      },
    ],
  },
  "audit-logs": {
    title: "审计日志",
    description:
      "所有老师审核、账号处理、订单取消、人工补偿等后台动作都应该能回放到 AdminAuditLog。这个页面先把日志结构和风险提示做出来。",
    badge: "Audit Trail",
    primaryAction: "查看高风险日志",
    secondaryAction: "核对留痕字段",
    metrics: [
      {
        label: "今日日志",
        value: "146",
        trend: "+18 操作",
        tone: "neutral",
        sparkline: sparkline(20, 24, 29, 34, 42, 51, 64),
      },
      {
        label: "高风险动作",
        value: "7",
        trend: "3 个待复核",
        tone: "warning",
        sparkline: sparkline(72, 63, 51, 39, 34, 26, 19),
      },
      {
        label: "审核相关日志",
        value: "38",
        trend: "占比 26%",
        tone: "positive",
        sparkline: sparkline(18, 22, 28, 33, 37, 42, 47),
      },
      {
        label: "订单处理日志",
        value: "29",
        trend: "取消 / 补偿为主",
        tone: "neutral",
        sparkline: sparkline(12, 17, 24, 29, 36, 44, 52),
      },
    ],
    statusTitle: "留痕范围",
    statusDescription:
      "不只是记录“谁点了按钮”，还要能知道作用于哪个对象、携带了什么上下文、何时发生。",
    statuses: [
      {
        label: "操作人",
        value: "actorUserId",
        note: "后台任何高价值动作都要有明确 actor。",
        tone: "positive",
      },
      {
        label: "动作语义",
        value: "action",
        note: "如 teacher.approve、booking.cancel、user.suspend。",
        tone: "positive",
      },
      {
        label: "作用对象",
        value: "targetType + targetId",
        note: "至少能回放到老师、用户、订单、评价等对象。",
        tone: "positive",
      },
      {
        label: "请求上下文",
        value: "payload + ip + userAgent",
        note: "风险复盘时要能看到操作快照和来源。",
        tone: "warning",
      },
    ],
    fieldGroupsTitle: "AdminAuditLog 字段覆盖",
    fieldGroupsDescription:
      "这部分完全按 schema 展示，同时补一层推荐动作命名，方便后续前后端统一日志 action。",
    fieldGroups: [
      {
        title: "AdminAuditLog",
        description: "基础日志字段。",
        badge: "Schema-backed",
        items: [
          {
            label: "主体与动作",
            field: "actorUserId / action / targetType / targetId",
            note: "构成日志主干，列表页和详情页都要展示。",
            required: true,
          },
          {
            label: "上下文",
            field: "payload / ipAddress / userAgent / createdAt",
            note: "风险排查和客服追溯时需要完整上下文。",
            required: true,
          },
        ],
      },
      {
        title: "推荐 action 命名",
        description: "前端先统一语义，后端正式接入时直接对齐。",
        badge: "Convention",
        items: [
          {
            label: "老师审核",
            field: "teacher.approve / teacher.reject / teacher.request_changes",
            note: "和 TeacherProfile.verificationStatus 变更保持一致。",
          },
          {
            label: "用户处理",
            field: "user.warn / user.suspend / user.restore",
            note: "用于异常处理和拉黑恢复。",
          },
          {
            label: "订单处理",
            field: "booking.cancel / booking.compensate / booking.reassign_teacher",
            note: "哪怕还是人工流程，也建议统一动作名。",
          },
        ],
      },
    ],
    recordsTitle: "日志列表",
    recordsDescription:
      "目标是验证日志列表至少要带 actor、action、target、风险级别和时间，不然后台复盘会很弱。",
    columns: [
      { key: "logId", label: "日志ID", kind: "mono" },
      { key: "actor", label: "操作人" },
      { key: "action", label: "动作" },
      { key: "target", label: "对象" },
      { key: "risk", label: "风险", kind: "status" },
      { key: "createdAt", label: "时间", kind: "muted" },
    ],
    rows: [
      {
        id: "audit-row-1",
        logId: "AUD-071",
        actor: "admin.liu",
        action: "user.suspend",
        target: "User / u_4831",
        risk: "高风险",
        createdAt: "今天 09:12",
      },
      {
        id: "audit-row-2",
        logId: "AUD-068",
        actor: "ops.suning",
        action: "teacher.approve",
        target: "TeacherProfile / tp_1021",
        risk: "已留痕",
        createdAt: "今天 08:47",
      },
      {
        id: "audit-row-3",
        logId: "AUD-064",
        actor: "ops.shenyue",
        action: "booking.cancel",
        target: "Booking / bk_20260314_082",
        risk: "需复核",
        createdAt: "昨天 20:49",
      },
      {
        id: "audit-row-4",
        logId: "AUD-061",
        actor: "admin.liu",
        action: "teacher.request_changes",
        target: "TeacherCredential / tc_551",
        risk: "已留痕",
        createdAt: "昨天 18:03",
      },
    ],
    timelineTitle: "日志页动态",
    timeline: [
      {
        id: "audit-timeline-1",
        title: "高风险标签加入 suspend / compensate 规则",
        detail: "封禁和补偿类动作会自动显示为高风险。",
        time: "10:07",
      },
      {
        id: "audit-timeline-2",
        title: "targetType/targetId 并排展示",
        detail: "避免只看到动作名却不知道命中了哪个对象。",
        time: "09:18",
      },
      {
        id: "audit-timeline-3",
        title: "payload 预览做成摘要",
        detail: "列表页不展开全部 JSON，只展示关键信息摘要。",
        time: "08:11",
      },
    ],
    checklistTitle: "审计日志页注意点",
    checklist: [
      "高风险动作建议显式标红，至少包含 suspend / compensate / reassign_teacher",
      "日志详情最好能跳回目标对象详情页",
      "payload 在列表中摘要展示，在详情中再完整展开",
      "正式接后端时统一 action 命名，避免同一动作多个字符串版本",
    ],
    quickActions: [
      {
        id: "audit-action-1",
        label: "补日志详情抽屉",
        description: "展示 payload 摘要、来源 IP、UA 和关联对象跳转。",
        shortcut: "L",
      },
      {
        id: "audit-action-2",
        label: "定义高风险规则",
        description: "把哪些 action 属于高风险统一收口成前端常量。",
        shortcut: "H",
      },
    ],
  },
};
