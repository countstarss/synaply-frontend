import {
  Bell,
  Building2,
  CreditCard,
  LayoutDashboard,
  Palette,
  Plug,
  Shield,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface SettingItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  action?: () => void;
}

export interface SettingSection {
  id: string;
  title: string;
  items: SettingItem[];
}

export const settingMockData: SettingSection[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    items: [
      {
        id: "dashboard-preferences",
        label: "Dashboard Preferences",
        icon: LayoutDashboard,
        href: "/settings/dashboard",
      },
      {
        id: "notifications",
        label: "Notifications",
        icon: Bell,
        href: "/settings/notifications",
      },
      {
        id: "appearance",
        label: "Appearance",
        icon: Palette,
        href: "/settings/appearance",
      },
    ],
  },
  {
    id: "organization",
    title: "Organization",
    items: [
      { id: "profile", label: "Profile", icon: User, href: "/settings/profile" },
      {
        id: "workspace",
        label: "Workspace",
        icon: Building2,
        href: "/settings/workspace",
      },
      {
        id: "members",
        label: "Members",
        icon: Users,
        href: "/settings/members",
      },
      {
        id: "security",
        label: "Security",
        icon: Shield,
        href: "/settings/security",
      },
      {
        id: "integrations",
        label: "Integrations",
        icon: Plug,
        href: "/settings/integrations",
      },
      {
        id: "billing",
        label: "Billing",
        icon: CreditCard,
        href: "/settings/billing",
      },
    ],
  },
];
