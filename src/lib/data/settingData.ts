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
import type { Team } from "@/lib/fetchers/team";

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

export const baseSettingSections: SettingSection[] = [
  {
    id: "general",
    title: "General",
    items: [
      {
        id: "profile",
        label: "Profile",
        icon: User,
        href: "/settings/general#profile",
      },
      {
        id: "notifications",
        label: "Notifications",
        icon: Bell,
        href: "/settings/general#notifications",
      },
      {
        id: "appearance",
        label: "Appearance",
        icon: Palette,
        href: "/settings/general#appearance",
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
        href: "/settings/admin#workspace",
      },
      {
        id: "teams",
        label: "Teams",
        icon: Users,
        href: "/settings/admin#teams",
      },
      {
        id: "members",
        label: "Members",
        icon: UserCheck,
        href: "/settings/admin#members",
      },
      {
        id: "security",
        label: "Security",
        icon: Shield,
        href: "/settings/admin#security",
      },
      {
        id: "application",
        label: "Application",
        icon: Smartphone,
        href: "/settings/admin#application",
      },
      {
        id: "billing",
        label: "Billing",
        icon: CreditCard,
        href: "/settings/admin#billing",
      },
    ],
  },
];

export const buildSettingsSections = (
  teams: Team[] = [],
  onCreateTeam?: () => void,
): SettingSection[] => [
  ...baseSettingSections,
  {
    id: "team",
    title: "Team",
    items: [
      ...teams.map((team) => ({
        id: team.id,
        label: team.name,
        icon: Building2,
        href: `/settings/team/${team.id}`,
      })),
      {
        id: "create-team",
        label: "Create new team",
        icon: Plus,
        action: onCreateTeam,
      },
    ],
  },
];
