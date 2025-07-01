import {
  User,
  Bell,
  Palette,
  Building2,
  Users,
  UserCheck,
  Shield,
  Smartphone,
  CreditCard,
  Plus,
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
    id: "general",
    title: "General",
    items: [
      {
        id: "profile",
        label: "Profile",
        icon: User,
        href: "/settings/profile",
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
    id: "administration",
    title: "Administration",
    items: [
      {
        id: "workspace",
        label: "Workspace",
        icon: Building2,
        href: "/settings/workspace",
      },
      {
        id: "teams",
        label: "Teams",
        icon: Users,
        href: "/settings/teams",
      },
      {
        id: "members",
        label: "Members",
        icon: UserCheck,
        href: "/settings/members",
      },
      {
        id: "security",
        label: "Security",
        icon: Shield,
        href: "/settings/security",
      },
      {
        id: "application",
        label: "Application",
        icon: Smartphone,
        href: "/settings/application",
      },
      {
        id: "billing",
        label: "Billing",
        icon: CreditCard,
        href: "/settings/billing",
      },
    ],
  },
  {
    id: "team",
    title: "Team",
    items: [
      {
        id: "insightlab",
        label: "InsightLab",
        icon: Building2,
        href: "/settings/team/insightlab",
      },
      {
        id: "wizlab",
        label: "wiz lab",
        icon: Building2,
        href: "/settings/team/wizlab",
      },
      {
        id: "create-team",
        label: "Create new team",
        icon: Plus,
        action: () => console.log("创建新团队"),
      },
    ],
  },
];
