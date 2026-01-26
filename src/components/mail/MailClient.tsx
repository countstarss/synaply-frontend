"use client";

import * as React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { PanelLeft, PanelLeftClose } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MailNav } from "./MailNav";
import { MailList } from "./MailList";
import { EmailAccount } from "./types";
import { mockAccounts } from "./mock-data";

interface MailClientProps {
  accounts?: EmailAccount[];
  defaultCollapsed?: boolean;
}

export function MailClient({
  accounts = mockAccounts,
  defaultCollapsed = false,
}: MailClientProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  // 切换侧边栏
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // 处理写邮件
  const handleCompose = () => {
    // TODO: 打开写邮件弹窗或跳转到写邮件页面
    console.log("Compose new email");
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-full w-full">
        {/* 导航侧边栏 - 固定宽度 */}
        <MailNav
          accounts={accounts}
          isCollapsed={isCollapsed}
          onCompose={handleCompose}
        />

        {/* 主内容区域 */}
        <div className="flex flex-col flex-1 h-full overflow-hidden">
          {/* 顶部工具栏 */}
          <div className="flex items-center p-2 border-b">
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={toggleSidebar}
                  >
                    <PanelLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Show sidebar</TooltipContent>
              </Tooltip>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={toggleSidebar}
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* 邮件列表和详情 */}
          <div className="flex-1 overflow-hidden">
            <MailList defaultLayout={[40, 60]} />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
