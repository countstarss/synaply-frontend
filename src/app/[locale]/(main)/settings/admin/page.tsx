import {
  Building2,
  CreditCard,
  Shield,
  Smartphone,
} from "lucide-react";
import SettingsScrollPage from "@/components/settings/SettingsScrollPage";
import MembersSettingsSection from "@/components/settings/sections/MembersSettingsSection";
import SettingsPlaceholderSection from "@/components/settings/sections/SettingsPlaceholderSection";
import TeamsSettingsSection from "@/components/settings/sections/TeamsSettingsSection";

export default function AdminSettingsPage() {
  return (
    <SettingsScrollPage
      title="Administration"
      // sectionGroupLabel="Settings"
      sections={[
        {
          id: "workspace",
          label: "Workspace",
          description: "工作区级规则、资料与权限边界",
          content: (
            <SettingsPlaceholderSection
              title="Workspace"
              description="这里适合放工作区名称、默认协作规则、跨项目约束和成员可见性。先把结构定下来，后面接真实字段时不需要再拆页。"
              icon={Building2}
              highlights={[
                "Workspace identity and naming",
                "Default collaboration rules",
                "Cross-project visibility settings",
                "Role and invite policy defaults",
              ]}
            />
          ),
        },
        {
          id: "teams",
          label: "Teams",
          description: "团队列表、创建入口和 team settings 跳转",
          content: <TeamsSettingsSection />,
        },
        {
          id: "members",
          label: "Members",
          description: "成员角色、权限与移除操作",
          content: <MembersSettingsSection />,
        },
        {
          id: "security",
          label: "Security",
          description: "账号安全、登录策略和审计入口",
          content: (
            <SettingsPlaceholderSection
              title="Security"
              description="安全能力更适合和成员、工作区规则放在一起。后续接入登录设备、会话管理和审计日志时会更连贯。"
              icon={Shield}
              highlights={[
                "Session and device management",
                "Sensitive action confirmations",
                "Audit log and access review",
                "Role-sensitive permission controls",
              ]}
            />
          ),
        },
        {
          id: "application",
          label: "Application",
          description: "客户端、集成和平台行为偏好",
          content: (
            <SettingsPlaceholderSection
              title="Application"
              description="这里预留给应用级行为，例如桌面端、移动端和第三方连接设置。放在 Administration 里会更像团队运行配置。"
              icon={Smartphone}
              highlights={[
                "Desktop and mobile app preferences",
                "Connected service management",
                "Integration health and sync status",
                "Workspace-wide product defaults",
              ]}
            />
          ),
        },
        {
          id: "billing",
          label: "Billing",
          description: "套餐、发票与席位成本",
          content: (
            <SettingsPlaceholderSection
              title="Billing"
              description="账单、套餐和席位信息跟工作区管理天然是一组，先并进这个主入口，后续不需要再维护独立的账单页面结构。"
              icon={CreditCard}
              highlights={[
                "Plan overview and renewal timing",
                "Seat allocation and usage counts",
                "Invoice recipients and history",
                "Upgrade path for growing teams",
              ]}
            />
          ),
        },
      ]}
    />
  );
}
