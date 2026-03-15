import {
  BarChart3,
  BookTemplate,
  CircleHelp,
  FileStack,
  LayoutDashboard,
  Package,
  Settings2,
  Users,
  type LucideIcon,
} from "lucide-react";
import { ADMIN_MODULES } from "./admin-data";

export interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
}

export const mainNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "总览", href: "/dashboard" },
  { icon: Users, label: "老师审核", href: "/teachers" },
  { icon: FileStack, label: "用户档案", href: "/profiles" },
  { icon: Package, label: "预约履约", href: "/bookings" },
  { icon: BarChart3, label: "评价运营", href: "/operations" },
  { icon: BookTemplate, label: "审计日志", href: "/audit-logs" },
];

export const utilityNavItems: NavItem[] = [
  { icon: Settings2, label: "Settings", href: "/settings" },
  { icon: CircleHelp, label: "Help Center", href: "/settings/support" },
];

export const mobileMenu: {
  title: string;
  href: string;
  description: string;
  published: boolean;
}[] = [
  ...ADMIN_MODULES.map((module) => ({
    title: module.label,
    href: module.href,
    description: module.description,
    published: true,
  })),
  {
    title: "设置",
    href: "/settings",
    description: "后台默认项与总览配置。",
    published: true,
  },
];

export const templateBadge = {
  icon: BookTemplate,
  label: "TuneTime Admin",
};
