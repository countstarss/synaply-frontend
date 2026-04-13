export interface SiteMetric {
  value: string;
  label: string;
}

export interface CapabilityItem {
  name: string;
  title: string;
  description: string;
}

export interface WorkflowStep {
  step: string;
  title: string;
  description: string;
}

export interface DeepDiveTab {
  value: string;
  label: string;
  title: string;
  description: string;
  bullets: string[];
  statValue: string;
  statLabel: string;
}

export interface SiteCopy {
  tagline: string;
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    returningCta: string;
  };
  proofStrip: string[];
  metrics: SiteMetric[];
  capabilities: {
    eyebrow: string;
    title: string;
    description: string;
    items: CapabilityItem[];
  };
  workflow: {
    eyebrow: string;
    title: string;
    description: string;
    steps: WorkflowStep[];
  };
  deepDive: {
    eyebrow: string;
    title: string;
    description: string;
    tabs: DeepDiveTab[];
  };
  audience: {
    eyebrow: string;
    title: string;
    description: string;
    items: string[];
    quote: string;
    quoteBy: string;
  };
  finalCta: {
    title: string;
    description: string;
    primary: string;
    secondary: string;
  };
  auth: {
    eyebrow: string;
    title: string;
    description: string;
    highlights: string[];
    modes: {
      login: {
        title: string;
        description: string;
      };
      register: {
        title: string;
        description: string;
      };
      reset: {
        title: string;
        description: string;
      };
    };
  };
}

const englishCopy: SiteCopy = {
  tagline: "The operating system for focused remote teams.",
  hero: {
    eyebrow: "Remote-first collaboration operating system",
    title: "Bring projects, workflows, issues, and docs into one deliberate rhythm.",
    subtitle:
      "Synaply gives small distributed teams a shared context for planning, execution, handoff, and documentation so work keeps moving without constant follow-up.",
    primaryCta: "Start with clarity",
    secondaryCta: "See the workflow in motion",
    returningCta: "Enter your workspace",
  },
  proofStrip: [
    "Projects define direction",
    "Issues turn work into motion",
    "Workflows make handoffs visible",
    "Docs stay attached to context",
  ],
  metrics: [
    { value: "3-15", label: "people per remote team" },
    { value: "4", label: "core collaboration surfaces" },
    { value: "Live", label: "sync across roles and updates" },
  ],
  capabilities: {
    eyebrow: "One workspace, fewer seams",
    title: "Structure the work so the team can focus on delivery.",
    description:
      "Each module exists to reduce back-and-forth. Product, design, engineering, and operations stay aligned because the workflow itself carries the context forward.",
    items: [
      {
        name: "Projects",
        title: "Set project boundaries before the work fragments.",
        description:
          "Capture goals, priorities, and delivery context so the team understands what matters now and what comes next.",
      },
      {
        name: "Issues",
        title: "Turn every task into a clear unit of progress.",
        description:
          "Track actions, blockers, and follow-through with enough rigor to stay reliable without turning work into ceremony.",
      },
      {
        name: "Workflows",
        title: "Make every handoff legible.",
        description:
          "Define stages, owners, and transitions so work keeps moving even when multiple roles are involved.",
      },
      {
        name: "Docs",
        title: "Keep the why next to the work itself.",
        description:
          "Store requirements, decisions, and operational notes in the same space as execution, not in a separate archive.",
      },
    ],
  },
  workflow: {
    eyebrow: "Workflow over chasing",
    title: "Collaboration should run on clarity, not reminders.",
    description:
      "When process is visible, progress stops depending on memory. The team spends less time asking where things stand and more time moving work forward.",
    steps: [
      {
        step: "01",
        title: "Define the outcome",
        description:
          "Projects establish the goal, scope, and sequencing so everyone starts from the same brief.",
      },
      {
        step: "02",
        title: "Route work through issues",
        description:
          "Issues hold the current state, owners, notes, and next actions in a format that is easy to advance.",
      },
      {
        step: "03",
        title: "Move through the workflow",
        description:
          "Transitions are explicit, handoffs are visible, and multi-role work stops disappearing between tools.",
      },
      {
        step: "04",
        title: "Document as part of delivery",
        description:
          "Docs absorb context continuously, so the team can revisit decisions without reopening old threads.",
      },
    ],
  },
  deepDive: {
    eyebrow: "Proof, not promises",
    title: "A calmer way to run distributed execution.",
    description:
      "Every view is designed to keep momentum visible. Swap between planning, issue flow, workflow logic, and documentation without leaving the shared operating context.",
    tabs: [
      {
        value: "projects",
        label: "Projects",
        title: "Projects keep the team oriented before delivery starts.",
        description:
          "Goals, milestones, and role-specific expectations stay visible instead of getting buried in kickoff notes.",
        bullets: [
          "Define scope and current priority at the same time",
          "Keep product direction attached to execution",
          "Reduce re-explanation across functions",
        ],
        statValue: "1 source",
        statLabel: "of project context",
      },
      {
        value: "issues",
        label: "Issues",
        title: "Issues turn scattered actions into an ordered queue of progress.",
        description:
          "Each issue is lightweight enough to move quickly, but structured enough to preserve ownership, state, and decision-making.",
        bullets: [
          "Track blockers, notes, and owners together",
          "See what is active, waiting, or complete at a glance",
          "Keep execution detail close to the work itself",
        ],
        statValue: "0 guesswork",
        statLabel: "around current status",
      },
      {
        value: "workflows",
        label: "Workflows",
        title: "Workflows create a path for collaboration instead of relying on follow-up.",
        description:
          "Custom stages let each team define how work moves from planning to review to completion without reinventing the process every week.",
        bullets: [
          "Model handoffs across product, design, and engineering",
          "Make responsible owners visible at each stage",
          "Reduce work that stalls between roles",
        ],
        statValue: "Custom",
        statLabel: "team-specific flow control",
      },
      {
        value: "docs",
        label: "Docs",
        title: "Docs stay inside the workflow, not outside it.",
        description:
          "Requirements, rationale, and operating notes evolve with the project so the team can recover context instantly.",
        bullets: [
          "Connect decisions to the work they affect",
          "Keep history easy to revisit",
          "Turn documentation into an active collaboration layer",
        ],
        statValue: "Always linked",
        statLabel: "to live project context",
      },
    ],
  },
  audience: {
    eyebrow: "Built for the team in the middle",
    title: "For mixed-discipline teams that need structure without process drag.",
    description:
      "Synaply fits teams where product, design, engineering, and operations move together and need a shared pace, not a pile of disconnected tools.",
    items: [
      "Designed for remote teams with 3 to 15 people",
      "Works best for product, design, engineering, and operations in one loop",
      "Ideal when you need lightweight adoption with dependable flow",
    ],
    quote:
      "Less asking for updates. More work arriving where it needs to be, already in context.",
    quoteBy: "Structured execution for teams that ship together",
  },
  finalCta: {
    title: "Start with clarity. Move with momentum.",
    description:
      "Build a workspace where planning, execution, and alignment operate in the same system.",
    primary: "Build your collaboration hub",
    secondary: "Sign in to Synaply",
  },
  auth: {
    eyebrow: "Structured access",
    title: "Enter the workspace where remote execution stays aligned.",
    description:
      "Projects, issues, workflows, and docs stay in one operating context so every role can move in the same direction.",
    highlights: [
      "Multi-role collaboration without tool switching",
      "Workflow visibility across every handoff",
      "Live sync that reduces repeat check-ins",
    ],
    modes: {
      login: {
        title: "Welcome back",
        description:
          "Return to the same workspace where priorities, states, and documentation already line up.",
      },
      register: {
        title: "Create your team workspace",
        description:
          "Start with a calmer operating system for product, design, engineering, and operations.",
      },
      reset: {
        title: "Recover access without losing context",
        description:
          "We will send a secure link so you can return to the same structured flow.",
      },
    },
  },
};

const chineseCopy: SiteCopy = {
  tagline: "为专注远程团队打造的协作操作系统。",
  hero: {
    eyebrow: "为远程小团队打造的协作操作系统",
    title: "让每一次协作，都沿着清晰流程抵达交付。",
    subtitle:
      "Synaply 为产品、设计、研发与运营提供同一套协作中枢，把 Projects、Issues、Workflows 与 Docs 收束进一个有秩序、可推进的工作空间。",
    primaryCta: "开始构建你的团队协作中枢",
    secondaryCta: "查看协作流转",
    returningCta: "进入你的工作区",
  },
  proofStrip: [
    "Projects 负责统一目标",
    "Issues 负责持续推进",
    "Workflows 负责清晰交接",
    "Docs 负责沉淀上下文",
  ],
  metrics: [
    { value: "3-15", label: "人远程小团队的理想规模" },
    { value: "4", label: "个核心协作模块统一在线" },
    { value: "实时", label: "同步多角色协作节奏" },
  ],
  capabilities: {
    eyebrow: "一个空间，少一些断层",
    title: "不是管理更多任务，而是让团队更顺畅地完成工作。",
    description:
      "每个模块都服务于更少摩擦的推进方式。产品、设计、研发与运营在同一个项目语境里协作，而不是在碎片化信息里反复对齐。",
    items: [
      {
        name: "Projects",
        title: "先定义项目边界，再开始执行。",
        description:
          "把目标、优先级与交付背景放进同一层语境，让团队知道为什么做、先做什么、接下来做什么。",
      },
      {
        name: "Issues",
        title: "把每一项工作都变成可推进的单元。",
        description:
          "用轻量但严谨的方式管理待办、问题与行动项，让状态、责任人与下一步始终清晰。",
      },
      {
        name: "Workflows",
        title: "让每一次交接都有路径。",
        description:
          "为团队定义自有流程，让不同角色之间的切换更自然，让协作真正流动起来。",
      },
      {
        name: "Docs",
        title: "让文档成为协作的一部分。",
        description:
          "需求、背景、方案与过程沉淀在同一空间里，知识跟着项目走，而不是散落在聊天记录里。",
      },
    ],
  },
  workflow: {
    eyebrow: "清晰，而不是催促",
    title: "协作不该建立在催促之上，而应建立在清晰之上。",
    description:
      "当流程被定义，推进就不再依赖记忆。团队少一些来回确认，多一些自然流转，把精力放在交付本身。",
    steps: [
      {
        step: "01",
        title: "先统一目标与范围",
        description:
          "Projects 把目标、节奏与优先级放在最前面，让不同角色从同一份上下文出发。",
      },
      {
        step: "02",
        title: "把工作拆进 Issues",
        description:
          "每个任务都拥有清晰状态、责任人与备注，执行不再依赖口头同步。",
      },
      {
        step: "03",
        title: "沿着 Workflow 推进",
        description:
          "交接节点、负责人和阶段状态都被明确记录，多角色协作也能保持连续性。",
      },
      {
        step: "04",
        title: "让 Docs 持续承接背景",
        description:
          "文档随着项目同步沉淀，团队无需重新翻找旧消息也能迅速恢复上下文。",
      },
    ],
  },
  deepDive: {
    eyebrow: "用产品状态说服，而不是用形容词",
    title: "为小型远程团队提供统一、清晰、可推进的协作中枢。",
    description:
      "在同一个空间里切换规划、任务流转、流程定义与文档沉淀，让团队始终共享同一份进度感。",
    tabs: [
      {
        value: "projects",
        label: "Projects",
        title: "Projects 先把方向讲清楚，再把执行接上去。",
        description:
          "项目目标、里程碑与角色预期保持可见，团队不必在 kickoff 之后重新寻找“我们为什么在做这个”。",
        bullets: [
          "在同一视图里定义范围与优先级",
          "把产品目标直接连接到执行层",
          "减少跨角色的重复解释成本",
        ],
        statValue: "1 个空间",
        statLabel: "承接项目上下文",
      },
      {
        value: "issues",
        label: "Issues",
        title: "Issues 把零散动作收束成连续推进。",
        description:
          "它足够轻量，可以快速创建与流转；也足够严谨，可以保留状态、责任人与决策过程。",
        bullets: [
          "把阻塞、备注与负责人放在一起",
          "一眼看清当前进行中与待交接事项",
          "执行细节始终贴着工作本身",
        ],
        statValue: "更少追问",
        statLabel: "围绕当前状态",
      },
      {
        value: "workflows",
        label: "Workflows",
        title: "Workflows 让协作路径比催促更可靠。",
        description:
          "团队可以定义自己的阶段、交接方式与责任边界，让流程真正服务于不同角色之间的协作。",
        bullets: [
          "建模产品、设计、研发之间的交接链路",
          "明确每个阶段的负责人",
          "减少工作在角色切换时的停滞",
        ],
        statValue: "自定义",
        statLabel: "团队流程控制",
      },
      {
        value: "docs",
        label: "Docs",
        title: "Docs 始终留在流程里，而不是流程外。",
        description:
          "需求、决策和操作说明随着项目一起演进，团队可以随时回到正确背景，不必重新翻记录。",
        bullets: [
          "让决策紧贴受影响的工作",
          "把历史背景保留成可回看的上下文",
          "让文档成为活跃的协作层",
        ],
        statValue: "持续关联",
        statLabel: "项目实时上下文",
      },
    ],
  },
  audience: {
    eyebrow: "适合谁",
    title: "为需要秩序感、又不想被流程拖慢的小团队而设计。",
    description:
      "Synaply 特别适合产品、设计、研发、运营等多角色混合协作的远程团队，他们需要的是统一节奏，而不是更多分散工具。",
    items: [
      "适合 3 到 15 人的远程协作团队",
      "适合产品、设计、研发、运营等多角色共同推进",
      "适合需要轻量上手、清晰流转、持续同步的团队",
    ],
    quote: "少一些来回确认，多一些自然流转。",
    quoteBy: "让团队把精力放在交付本身，而不是信息搬运。",
  },
  finalCta: {
    title: "从清晰开始，让推进自然发生。",
    description:
      "把项目、流程、任务与文档收束进同一个工作系统，让团队进入同一套推进节奏。",
    primary: "用更清晰的方式推进每一个项目",
    secondary: "登录 Synaply",
  },
  auth: {
    eyebrow: "进入统一协作中枢",
    title: "进入那个让远程执行保持同频的工作空间。",
    description:
      "Projects、Issues、Workflows 与 Docs 处在同一个语境里，让每个角色都能沿着同一套节奏推进。",
    highlights: [
      "多角色协作，不再来回切工具",
      "每一次交接，都能看到所处阶段",
      "实时同步减少重复确认与信息滞后",
    ],
    modes: {
      login: {
        title: "欢迎回来",
        description:
          "回到那个已经把优先级、状态与文档上下文连在一起的工作空间。",
      },
      register: {
        title: "创建你的团队工作空间",
        description:
          "从第一天开始，就用更清晰的方式组织产品、设计、研发与运营协作。",
      },
      reset: {
        title: "恢复访问，但不丢上下文",
        description:
          "我们会发送一个安全链接，让你回到同一套结构化协作流程里。",
      },
    },
  },
};

export function getSiteCopy(locale: string): SiteCopy {
  return locale === "zh" ? chineseCopy : englishCopy;
}
