"use client";

import React, { useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import ContextMenuWrapper from "@/components/ContextMenuWrapper";
import { useSidebarStore } from "@/stores/sidebar";
import { useSidebarMode } from "@/hooks/useSidebarMode";
import SidebarBrand from "../sidebar/SidebarBrand";
import SidebarNavItem from "../sidebar/SidebarNavItem";
import SidebarSection from "../sidebar/SidebarSection";
import SidebarFooter from "../sidebar/SidebarFooter";
import SettingSection from "../sidebar/SettingSection";
import { mainNavItems, utilityNavItems } from "@/lib/data/constant";
import { settingMockData } from "@/lib/data/settingData";

interface SidebarProps {
  className?: string;
}

const Sidebar = React.memo(({ className }: SidebarProps) => {
  const { isOpen: sidebarOpen } = useSidebarStore();
  const { mode, switchToMain } = useSidebarMode();
  const router = useRouter();

  const handleBackToMain = useCallback(() => {
    router.push("/dashboard");
    switchToMain();
  }, [router, switchToMain]);

  return (
    <ContextMenuWrapper>
      <aside
        className={cn(
          "my-2 ml-2 mr-0 hidden h-[calc(100vh-16px)] w-64 flex-col overflow-hidden rounded-lg border border-app-border bg-app-bg lg:flex",
          "transition-transform duration-300 ease-in-out",
          !sidebarOpen && "pointer-events-none",
          className,
        )}
      >
        <SidebarBrand />

        <div className="relative flex-1 overflow-hidden">
          <div
            className={cn(
              "absolute inset-0 transition-transform duration-300 ease-in-out",
              mode === "settings" ? "-translate-x-full" : "translate-x-0",
            )}
          >
            <div className="h-full overflow-y-auto py-2">
              <div className="space-y-1">
                {mainNavItems.map((item) => (
                  <SidebarNavItem
                    key={item.href}
                    icon={item.icon}
                    label={item.label}
                    href={item.href}
                  />
                ))}
              </div>

              <SidebarSection title="Utility">
                {utilityNavItems.map((item) => (
                  <SidebarNavItem
                    key={item.href}
                    icon={item.icon}
                    label={item.label}
                    href={item.href}
                  />
                ))}
              </SidebarSection>
            </div>
          </div>

          <div
            className={cn(
              "absolute inset-0 transition-transform duration-300 ease-in-out",
              mode === "settings" ? "translate-x-0" : "translate-x-full",
            )}
          >
            <div className="h-full overflow-y-auto">
              <div className="border-b border-app-border px-2 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToMain}
                  className="flex items-center gap-2 text-sm"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </Button>
              </div>

              <div className="px-2 py-2">
                {settingMockData.map((section) => (
                  <SettingSection key={section.id} section={section} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <SidebarFooter />
      </aside>
    </ContextMenuWrapper>
  );
});

Sidebar.displayName = "Sidebar";

export default Sidebar;
