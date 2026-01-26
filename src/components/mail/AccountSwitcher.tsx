"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Settings, Plus, Check } from "lucide-react";
import { EmailAccount } from "./types";

interface AccountSwitcherProps {
  isCollapsed: boolean;
  accounts: EmailAccount[];
}

export function AccountSwitcher({
  isCollapsed,
  accounts,
}: AccountSwitcherProps) {
  const [selectedAccount, setSelectedAccount] = React.useState<string>(
    accounts[0]?.email || ""
  );

  // 获取当前账户信息
  const currentAccount = accounts.find(
    (account) => account.email === selectedAccount
  );

  // 获取用户名首字母作为头像备用显示
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleAccountChange = (value: string) => {
    setSelectedAccount(value);
    // TODO: 调用 API 切换账户
  };

  if (accounts.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-11 py-1 flex w-full justify-start gap-2 [&>span]:line-clamp-1 [&>span]:flex [&>span]:items-center [&>span]:gap-1 [&>span]:truncate",
            isCollapsed && "h-9 w-9 justify-center p-0"
          )}
        >
          <Avatar className="h-7 w-7">
            <AvatarImage src="" alt={currentAccount?.label || ""} />
            <AvatarFallback>
              {currentAccount ? getInitials(currentAccount.label) : "ML"}
            </AvatarFallback>
          </Avatar>

          {!isCollapsed && (
            <div className="flex flex-col items-start leading-none">
              <span className="font-semibold text-sm">
                {currentAccount?.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {currentAccount?.email}
              </span>
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">已连接账户</p>
            <p className="text-xs leading-none text-muted-foreground">
              切换或管理您的邮件账户
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* 账户切换组 */}
        <DropdownMenuRadioGroup
          value={selectedAccount}
          onValueChange={handleAccountChange}
        >
          {accounts.map((account) => (
            <DropdownMenuRadioItem
              key={account.email}
              value={account.email}
              className="py-2"
            >
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback>{getInitials(account.label)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col leading-none">
                  <span className="text-sm">{account.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {account.email}
                  </span>
                </div>
                {account.email === selectedAccount && (
                  <Check className="ml-auto h-4 w-4 text-primary" />
                )}
              </div>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        {/* 账户管理选项 */}
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => {
              // TODO: 跳转到添加账户页面
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            <span>添加另一个账户</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              // TODO: 跳转到邮箱设置页面
            }}
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>邮箱设置</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              // TODO: 跳转到个人资料页面
            }}
          >
            <User className="mr-2 h-4 w-4" />
            <span>个人资料</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => {
            // TODO: 注销当前账户
          }}
          className="text-red-500 hover:text-red-500 focus:text-red-500"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>注销当前账户</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
