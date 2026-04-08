import {
  BookAIcon,
  FolderOpen,
  ListCheck,
  MessageSquareCode,
  Workflow,
  Bug,
  type LucideIcon,
} from "lucide-react";

/*
NOTE: 用于提供给滚动条
MARK: - Clients
*/
export const clients = [...new Array(10)].map((_, index) => ({
  href: `/${index + 1}.png`,
}));

// MARK: - TEAM导航
export interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
  isReady?: boolean;
}

export const getReadyNavItems = (items: NavItem[]) =>
  items.filter((item) => item.isReady !== false);

export const mainNavItems: NavItem[] = [
  { icon: ListCheck, label: "My Task", href: "/tasks", isReady: false },
  { icon: MessageSquareCode, label: "Chat", href: "/chat" },
  { icon: BookAIcon, label: "Docs", href: "/docs" },
  { icon: Bug, label: "Issues", href: "/issues" },
  { icon: FolderOpen, label: "Projects", href: "/projects" },
  { icon: Workflow, label: "Workflows", href: "/workflows" },
  // 顶部不再显示setting选项, 因为它会扰乱UI切换逻辑, 代为一个单独按钮打开
  // { icon: Settings, label: "Settings", href: "/settings" },
];

// MARK: - PERSONAL导航
export const personalNavItems: NavItem[] = [
  { icon: ListCheck, label: "Tasks", href: "/tasks", isReady: false },
  { icon: BookAIcon, label: "Docs", href: "/docs" },
  { icon: Bug, label: "Issues", href: "/issues" },
  { icon: FolderOpen, label: "Projects", href: "/projects" },
  // { icon: Settings, label: "Settings", href: "/settings" },
];

// NOTE: Personal 子项
export const personalItems: NavItem[] = [
  { icon: BookAIcon, label: "Docs", href: "/personal/doc" },
];

// MARK: mobileMenu
export const mobileMenu: {
  title: string;
  href: string;
  description: string;
  published: boolean;
}[] = [
  {
    title: "Template",
    href: "/dashboard/template",
    description: "Template",
    published: true,
  },
  {
    title: "Notification",
    href: "/dashboard/notification",
    description: "Notification",
    published: true,
  },
  {
    title: "Security",
    href: "/dashboard/security",
    description: "Security",
    published: false,
  },
  {
    title: "Team",
    href: "/dashboard/team",
    description: "Team",
    published: false,
  },
  {
    title: "Event",
    href: "/dashboard/event",
    description: "Event",
    published: true,
  },
  {
    title: "CRM",
    href: "/dashboard/crm",
    description: "CRM",
    published: false,
  },
  {
    title: "Billing",
    href: "/dashboard/billing",
    description: "Billing",
    published: false,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    description: "Settings",
    published: true,
  },
  {
    title: "登录",
    href: "/auth",
    description: "用户登录",
    published: true,
  },
];
