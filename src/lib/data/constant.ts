import {
  BookAIcon,
  Eye,
  FileText,
  FolderOpen,
  Inbox,
  Layers,
  ListCheck,
  MessageSquareCode,
  User,
  Settings,
  Workflow,
  Bug,
} from "lucide-react";

/*
NOTE: 用于提供给滚动条
MARK: - Clients
*/
export const clients = [...new Array(10)].map((_, index) => ({
  href: `/${index + 1}.png`,
}));

// MARK: - TEAM导航
export const mainNavItems = [
  { icon: Inbox, label: "Inbox", href: "/inbox" },
  { icon: ListCheck, label: "My Task", href: "/tasks" },
  { icon: MessageSquareCode, label: "Chat", href: "/chat" },
  { icon: BookAIcon, label: "Docs", href: "/docs" },
  { icon: Bug, label: "Issues", href: "/team/issues" },
  { icon: Settings, label: "Settings", href: "/settings" },
];
export const secondaryNavItems = [
  { icon: Layers, label: "Team", href: "/team" },
  { icon: User, label: "Personal", href: "/personal" },
];

// MARK: - PERSONAL导航
export const personalNavItems = [
  { icon: Inbox, label: "Inbox", href: "/inbox" },
  { icon: ListCheck, label: "Tasks", href: "/tasks" },
  { icon: FolderOpen, label: "Projects", href: "/projects" },
  { icon: BookAIcon, label: "Docs", href: "/docs" },
  { icon: Bug, label: "Issues", href: "/issues" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

// WorkSpace 子项
export const workspaceItems = [
  { icon: FolderOpen, label: "Projects", href: "/team/projects" },
  { icon: Eye, label: "Views", href: "/team/views" },
  { icon: FileText, label: "Docs", href: "/team/doc" },
  { icon: Workflow, label: "Workflows", href: "/team/workflows" },
  { icon: Bug, label: "Issues", href: "/team/issues" },
];

// Personal 子项
export const personalItems = [
  { icon: FolderOpen, label: "Projects", href: "/personal/projects" },
  { icon: Eye, label: "Views", href: "/personal/views" },
  { icon: FileText, label: "Docs", href: "/personal/doc" },
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
