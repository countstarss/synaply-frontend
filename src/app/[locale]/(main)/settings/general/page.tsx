import { Bell } from "lucide-react";
import SettingsScrollPage from "@/components/settings/SettingsScrollPage";
import SettingsPlaceholderSection from "@/components/settings/sections/SettingsPlaceholderSection";
import ProfileSettingsSection from "@/components/settings/sections/ProfileSettingsSection";
import AppearanceSettingsSection from "@/components/settings/sections/AppearanceSettingsSection";

export default function GeneralSettingsPage() {
  return (
    <SettingsScrollPage
      title="General"
      // sectionGroupLabel="Settings"
      description="账号层面的偏好都集中在这里处理。左侧 Sidebar 里的 General 子项现在直接对应本页的滚动进度，不再拆成多个独立页面。"
      sections={[
        {
          id: "profile",
          label: "Profile",
          description: "账号资料、头像与基础身份信息",
          content: <ProfileSettingsSection />,
        },
        {
          id: "notifications",
          label: "Notifications",
          description: "提醒、digest 与异步协作信号",
          content: (
            <SettingsPlaceholderSection
              title="Notifications"
              description="这一块后续适合承载 inbox 提醒强度、digest 频率和跨工具通知偏好。先把它并进 General，和个人偏好放在同一条浏览路径里。"
              icon={Bell}
              highlights={[
                "Daily / weekly async digest frequency",
                "Mention, assignment and handoff reminders",
                "GitHub / Slack bridge notification preferences",
                "Quiet hours and personal attention thresholds",
              ]}
            />
          ),
        },
        {
          id: "appearance",
          label: "Appearance",
          description: "主题、密度与界面阅读体验",
          content: <AppearanceSettingsSection />,
        },
      ]}
    />
  );
}
