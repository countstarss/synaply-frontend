"use client";

import React, { useCallback } from "react";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import SidebarBrand from "../sidebar/SidebarBrand";
import SidebarNavItem from "../sidebar/SidebarNavItem";
import SidebarSection from "../sidebar/SidebarSection";
import SettingSection from "../sidebar/SettingSection";
import SidebarFooter from "../sidebar/SidebarFooter";
import { useSidebarStore } from "@/stores/sidebar";
import { useSidebarMode } from "@/hooks/useSidebarMode";
import { useRouter } from "@/i18n/navigation";
import {
  mainNavItems,
  personalItems,
  personalNavItems,
  workspaceItems,
} from "@/lib/data/constant";
import { settingMockData } from "@/lib/data/settingData";
import ContextMenuWrapper from "@/components/ContextMenuWrapper";
import { useTeam } from "@/hooks/useTeam";
import { useWorkspace } from "@/hooks/useWorkspace";
import { CreateTeamDialog } from "@/components/dialogs/CreateTeamDialog";
import { Plus } from "lucide-react";

interface SidebarProps {
  className?: string;
}

const Sidebar = React.memo(({ className }: SidebarProps) => {
  const { isOpen: sidebarOpen } = useSidebarStore();
  const { mode, switchToMain } = useSidebarMode();
  const router = useRouter();
  const { hasOnlyOneTeam, currentTeam } = useTeam();
  const { currentWorkspace } = useWorkspace();

  const handleBackToMain = useCallback(() => {
    router.back();
    switchToMain();
  }, [router, switchToMain]);

  return (
    <ContextMenuWrapper>
      <div
        className={cn(
          "w-64 h-[calc(100vh-16px)] bg-app-bg lg:flex hidden flex-col my-2 ml-2 mr-0 border border-app-border rounded-lg overflow-hidden",
          "transition-transform duration-300 ease-in-out",
          !sidebarOpen && "pointer-events-none",
          className
        )}
      >
        {/* 品牌标识 - 始终显示 */}
        <SidebarBrand />

        {/* 滑动内容容器 */}
        <div className="flex-1 relative overflow-hidden">
          {/* 主要导航内容 */}
          <div
            className={cn(
              "absolute inset-0 transition-transform duration-300 ease-in-out",
              mode === "settings" ? "-translate-x-full" : "translate-x-0"
            )}
          >
            {/* MARK: Personal导航
             */}
            <div className="h-full overflow-y-auto">
              {currentWorkspace?.type === "PERSONAL" ? (
                /* PERSONAL空间的简化导航 */
                <div className="space-y-1 py-2">
                  {personalNavItems.map((item) => (
                    <SidebarNavItem
                      key={item.href}
                      icon={item.icon}
                      label={item.label}
                      href={item.href}
                    />
                  ))}
                  <SidebarSection title="Team">
                    <CreateTeamDialog>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-2 text-sm w-full justify-start px-3 py-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span>创建团队</span>
                      </Button>
                    </CreateTeamDialog>
                  </SidebarSection>
                </div>
              ) : (
                /* MARK: TEAM 导航
                 */
                <>
                  <div className="space-y-1 py-2">
                    {mainNavItems.map((item) => (
                      <SidebarNavItem
                        key={item.href}
                        icon={item.icon}
                        label={item.label}
                        href={item.href}
                      />
                    ))}
                  </div>

                  {/* Team 部分 */}
                  {hasOnlyOneTeam && currentTeam ? (
                    <SidebarSection title={currentTeam.name}>
                      {workspaceItems.map((item) => (
                        <SidebarNavItem
                          key={item.href}
                          icon={item.icon}
                          label={item.label}
                          href={item.href}
                        />
                      ))}
                    </SidebarSection>
                  ) : (
                    <SidebarSection title="Team">
                      <CreateTeamDialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex items-center gap-2 text-sm w-full justify-start px-3 py-2"
                        >
                          <Plus className="h-4 w-4" />
                          <span>创建团队</span>
                        </Button>
                      </CreateTeamDialog>
                    </SidebarSection>
                  )}

                  {/* Personal 部分 */}
                  <SidebarSection title="Personal">
                    {personalItems.map((item) => (
                      <SidebarNavItem
                        key={item.href}
                        icon={item.icon}
                        label={item.label}
                        href={item.href}
                      />
                    ))}
                  </SidebarSection>
                </>
              )}
            </div>
          </div>

          {/* MARK: 设置菜单内容
           */}
          <div
            className={cn(
              "absolute inset-0 transition-transform duration-300 ease-in-out",
              mode === "settings" ? "translate-x-0" : "translate-x-full"
            )}
          >
            <div className="h-full overflow-y-auto">
              {/* 返回按钮 */}
              <div className="px-2 py-2 border-b border-app-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToMain}
                  className="flex items-center gap-2 text-sm"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>返回</span>
                </Button>
              </div>

              {/* 设置分组 */}
              <div className="py-2 px-2">
                {settingMockData.map((section) => (
                  <SettingSection key={section.id} section={section} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 底部品牌信息 - 始终显示 */}
        <SidebarFooter />
      </div>
    </ContextMenuWrapper>
  );
});

Sidebar.displayName = "Sidebar";

export default Sidebar;
