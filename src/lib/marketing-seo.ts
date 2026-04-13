import type { SiteLocale } from "@/lib/seo";

export type MarketingPageKey = "landing" | "pricing" | "about";

export const MARKETING_PAGE_PATHS: Record<MarketingPageKey, string> = {
  landing: "/landing",
  pricing: "/pricing",
  about: "/about",
};

type MarketingSeoContent = {
  title: string;
  description: string;
  keywords: string[];
  breadcrumbLabel: string;
};

const marketingSeoContent: Record<
  MarketingPageKey,
  Record<"en" | "zh", MarketingSeoContent>
> = {
  landing: {
    en: {
      title: "Remote Collaboration Operating System for Focused Teams",
      description:
        "Synaply is a remote collaboration operating system for small teams that need projects, issues, workflows, docs, async handoffs, and delivery context in one shared workspace.",
      keywords: [
        "remote collaboration software",
        "collaboration operating system",
        "workflow handoff software",
        "async team coordination",
        "projects issues docs workflows",
      ],
      breadcrumbLabel: "Home",
    },
    zh: {
      title: "Synaply：为远程小团队打造的协作操作系统",
      description:
        "Synaply 把 Projects、Issues、Workflows 与 Docs 收束进一个统一协作中枢，让远程团队用更清晰的交接、推进与异步协作抵达交付。",
      keywords: [
        "远程团队协作软件",
        "协作操作系统",
        "异步协作工具",
        "项目 issue workflow 文档",
        "小团队协作平台",
      ],
      breadcrumbLabel: "首页",
    },
  },
  pricing: {
    en: {
      title: "Pricing for Remote Team Collaboration Software",
      description:
        "Explore Synaply pricing for remote product, design, engineering, and operations teams that need a calmer workflow, visible handoffs, and one shared execution system.",
      keywords: [
        "collaboration software pricing",
        "remote team software pricing",
        "workflow software pricing",
        "small team collaboration tool",
        "async collaboration platform pricing",
      ],
      breadcrumbLabel: "Pricing",
    },
    zh: {
      title: "Synaply 定价：适合远程小团队的协作系统方案",
      description:
        "查看 Synaply 面向产品、设计、研发与运营团队的定价方案，用统一工作空间、清晰交接与稳定推进节奏降低协作摩擦。",
      keywords: [
        "协作软件定价",
        "远程团队协作系统价格",
        "工作流软件方案",
        "小团队协作工具",
        "异步协作平台定价",
      ],
      breadcrumbLabel: "定价",
    },
  },
  about: {
    en: {
      title: "About Synaply and Our Remote Collaboration Philosophy",
      description:
        "Learn why Synaply focuses on remote team clarity, structured execution, visible handoffs, and documentation that stays attached to projects, issues, and workflows.",
      keywords: [
        "about synaply",
        "remote collaboration philosophy",
        "workflow visibility",
        "structured execution software",
        "team handoff platform",
      ],
      breadcrumbLabel: "About",
    },
    zh: {
      title: "关于 Synaply：远程团队协作与清晰推进的产品理念",
      description:
        "了解 Synaply 为什么坚持让项目、Issue、Workflow 与 Docs 处在同一套逻辑里，用清晰交接、结构化执行与上下文沉淀服务远程团队。",
      keywords: [
        "关于 Synaply",
        "远程团队协作理念",
        "结构化执行",
        "交接协作平台",
        "项目流程文档一体化",
      ],
      breadcrumbLabel: "关于",
    },
  },
};

export function getMarketingSeoContent(
  page: MarketingPageKey,
  locale: SiteLocale,
) {
  return locale === "zh"
    ? marketingSeoContent[page].zh
    : marketingSeoContent[page].en;
}
