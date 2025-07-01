import {
  BookAIcon,
  Home,
  Inbox,
  ListCheck,
  MessageSquareCode,
} from "lucide-react";

/*
NOTE: 用于提供给滚动条
MARK: - Clients
*/
export const clients = [...new Array(10)].map((_, index) => ({
  href: `/${index + 1}.png`,
}));

/*
MARK: - menuOptions
*/

export const menuOptions: {
  name: string;
  Component: React.ElementType;
  href: string;
  published: boolean;
}[] = [
  {
    name: "Home",
    Component: Home,
    href: "/home",
    published: true,
  },
  {
    name: "Inbox",
    Component: Inbox,
    href: "/inbox",
    published: true,
  },
  {
    name: "My Tasks",
    Component: ListCheck,
    href: "/tasks",
    published: true,
  },
  {
    name: "Chat",
    Component: MessageSquareCode,
    href: "/chat",
    published: false,
  },
  {
    name: "Docs",
    Component: BookAIcon,
    href: "/docs",
    published: false,
  },
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
