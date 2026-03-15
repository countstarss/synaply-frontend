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

export interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
}

export const mainNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Users, label: "Customers", href: "/customers" },
  { icon: Package, label: "Orders", href: "/orders" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: FileStack, label: "Content", href: "/content" },
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
  {
    title: "Dashboard",
    href: "/dashboard",
    description: "Template overview and metrics.",
    published: true,
  },
  {
    title: "Customers",
    href: "/customers",
    description: "Manage account-style records.",
    published: true,
  },
  {
    title: "Orders",
    href: "/orders",
    description: "Track operational flows.",
    published: true,
  },
  {
    title: "Analytics",
    href: "/analytics",
    description: "Reporting and KPI workspace.",
    published: true,
  },
  {
    title: "Content",
    href: "/content",
    description: "CMS and documentation patterns.",
    published: true,
  },
  {
    title: "Template Landing",
    href: "/landing",
    description: "Marketplace-ready presentation page.",
    published: true,
  },
  {
    title: "Template Auth",
    href: "/auth",
    description: "Optional starter auth UI.",
    published: true,
  },
  {
    title: "Settings",
    href: "/settings",
    description: "Basic configuration placeholders.",
    published: true,
  },
  {
    title: "Components",
    href: "/content",
    description: "Reusable UI composition patterns.",
    published: true,
  },
  {
    title: "Starter Module",
    href: "/dashboard",
    description: "Extend with your own feature modules.",
    published: true,
  },
];

export const templateBadge = {
  icon: BookTemplate,
  label: "Marketplace UI Template",
};
