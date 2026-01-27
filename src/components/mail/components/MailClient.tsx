"use client";

import * as React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PanelLeft, PanelRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { MailNav } from "./MailNav";
import { MailList } from "./MailList";
import { MailComposer } from "./MailComposer";
import { MailAdminPanel } from "./MailAdminPanel";
import { MailAccessRequest } from "./MailAccessRequest";
import { MailPersonalNotice } from "./MailPersonalNotice";
import { EmailAccount } from "../types/mail.entity";
import { mockAccounts } from "../data/mock-data";
import {
  ensureEmailIconRegistry,
  hydrateEmailIconCache,
  preloadEmailProviderIcons,
  subscribeEmailIconUpdates,
} from "../config/email-icon-registry";
import { useMailStore } from "../store/use-mail-store";
import { useMailAccessStore } from "../store/use-mail-access-store";
import { useWorkspace } from "@/hooks/useWorkspace";

interface MailClientProps {
  accounts?: EmailAccount[];
  defaultCollapsed?: boolean;
}

export function MailClient({
  accounts = mockAccounts,
  defaultCollapsed = false,
}: MailClientProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
  const [, setIconVersion] = React.useState(0);
  const { openComposer, hydrateDrafts } = useMailStore();
  const { currentWorkspace } = useWorkspace();
  const {
    role,
    activeView,
    setActiveView,
    getCurrentUserAccount,
  } = useMailAccessStore();

  React.useEffect(() => {
    const initIcons = async () => {
      ensureEmailIconRegistry();
      await hydrateEmailIconCache();
      preloadEmailProviderIcons();
      setIconVersion((value) => value + 1);
    };
    void initIcons();
    hydrateDrafts();
  }, [hydrateDrafts]);

  React.useEffect(() => {
    const unsubscribe = subscribeEmailIconUpdates(() => {
      setIconVersion((value) => value + 1);
    });
    return unsubscribe;
  }, []);

  // 切换侧边栏
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // 处理写邮件
  const handleCompose = () => {
    const fromAccount = accounts[0];
    openComposer("new", {
      from: fromAccount
        ? { name: fromAccount.label, email: fromAccount.email }
        : undefined,
    });
  };

  const isPersonalWorkspace = currentWorkspace?.type === "PERSONAL";
  const isAdmin = role === "OWNER" || role === "ADMIN";
  const currentAccount = getCurrentUserAccount();
  const hasMailbox = currentAccount?.status === "active";

  if (isPersonalWorkspace) {
    return <MailPersonalNotice />;
  }

  if (role === "MEMBER" && !hasMailbox) {
    return <MailAccessRequest />;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-full w-full">
        {/* 导航侧边栏 - 固定宽度 */}
        <MailNav
          accounts={accounts}
          isCollapsed={isCollapsed}
          onCompose={handleCompose}
          activeView={activeView}
          showAdminPanel={isAdmin}
          onViewChange={setActiveView}
        />

        {/* 主内容区域 */}
        <div className="flex flex-col flex-1 h-full overflow-hidden">
          {/* 顶部工具栏 */}
          <div className="flex items-center p-2 border-b">
            <button
              onClick={toggleSidebar}
              className={cn(
                "flex items-center justify-center w-9 h-9 rounded-lg shrink-0",
                "hover:bg-accent hover:text-accent-foreground transition-all duration-200",
                "text-muted-foreground hover:text-foreground group",
                "md:opacity-100 opacity-0",
                "md:block hidden pl-2",
              )}
              title={isCollapsed ? "显示侧边栏" : "隐藏侧边栏"}
              type="button"
            >
              {isCollapsed ? (
                <PanelRight
                  className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    "group-hover:scale-110 group-hover:rotate-180",
                  )}
                />
              ) : (
                <PanelLeft
                  className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    "group-hover:scale-110 group-hover:rotate-180",
                  )}
                />
              )}
            </button>
          </div>

          {/* 邮件列表和详情 */}
          <div className="flex-1 overflow-hidden">
            {isAdmin && activeView === "admin" ? (
              <MailAdminPanel />
            ) : (
              <MailList defaultLayout={[40, 60]} />
            )}
          </div>
        </div>
      </div>

      <MailComposer />
    </TooltipProvider>
  );
}
