"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { MailDisplay } from "./MailDisplay";
import { useMailStore } from "./use-mail-store";
import { EmailMessage } from "./types";

interface MailListProps {
  defaultLayout?: number[];
  layoutDirection?: "horizontal" | "vertical";
}

// Badge 变体映射
const getBadgeVariantFromLabel = (
  label: string,
): "default" | "outline" | "secondary" | "destructive" => {
  if (label === "important" || label === "重要") {
    return "default";
  }
  if (label === "work" || label === "工作") {
    return "secondary";
  }
  return "outline";
};

export function MailList({
  defaultLayout = [40, 60],
  layoutDirection = "horizontal",
}: MailListProps) {
  const {
    currentFolder,
    selectedId,
    setSelectedId,
    getCurrentFolderEmails,
    getSelectedEmail,
  } = useMailStore();

  const [searchQuery, setSearchQuery] = React.useState("");

  // 获取当前文件夹的邮件
  const emails = getCurrentFolderEmails();
  const selectedEmail = getSelectedEmail();

  // 过滤邮件
  const filteredEmails = React.useMemo(() => {
    if (!searchQuery) return emails;
    const query = searchQuery.toLowerCase();
    return emails.filter(
      (email) =>
        email.subject.toLowerCase().includes(query) ||
        email.sender.name.toLowerCase().includes(query) ||
        email.sender.email.toLowerCase().includes(query) ||
        email.snippet.toLowerCase().includes(query),
    );
  }, [emails, searchQuery]);

  // 分类邮件
  const { allMails, unreadMails, importantMails } = React.useMemo(() => {
    const allMails = filteredEmails;
    const unreadMails = filteredEmails.filter((mail) => mail.unread);
    const importantMails = filteredEmails.filter((mail) =>
      mail.labels?.some((l) => l === "important" || l === "重要"),
    );
    return { allMails, unreadMails, importantMails };
  }, [filteredEmails]);

  // 文件夹标题映射
  const folderTitles: Record<string, string> = {
    inbox: "收件箱",
    sent: "已发送",
    draft: "草稿箱",
    trash: "垃圾箱",
    archive: "归档",
    junk: "垃圾邮件",
  };

  const folderTitle = folderTitles[currentFolder] || currentFolder;

  // 处理邮件点击
  const handleMailClick = (mailId: string) => {
    if (selectedId === mailId) return;
    setSelectedId(mailId);
  };

  // 渲染邮件列表
  const renderMailList = (mailsToRender: EmailMessage[]) => (
    <div className="flex flex-col gap-2 p-4 pt-0">
      {mailsToRender.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          此文件夹中没有邮件
        </div>
      ) : (
        mailsToRender.map((item) => (
          <button
            key={item.id}
            className={cn(
              "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent",
              selectedId === item.id && "bg-muted",
            )}
            onClick={() => handleMailClick(item.id)}
          >
            <div className="flex w-full flex-col gap-1">
              <div className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className="font-semibold">
                    {item.sender?.name ||
                      item.sender?.email ||
                      "Unknown Sender"}
                  </div>
                  {item.unread && (
                    <span className="flex h-2 w-2 rounded-full bg-blue-600" />
                  )}
                </div>
                <div
                  className={cn(
                    "ml-auto text-xs",
                    selectedId === item.id
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {formatDistanceToNow(new Date(item.date), {
                    addSuffix: true,
                  })}
                </div>
              </div>
              <div className="text-xs font-medium">
                {item.subject || "(No Subject)"}
              </div>
            </div>
            <div className="line-clamp-2 text-xs text-muted-foreground">
              {item.snippet || "(No Snippet)"}
            </div>
            {item.labels && item.labels.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap mt-1">
                {item.labels.map((label) => (
                  <Badge
                    key={label}
                    variant={getBadgeVariantFromLabel(label)}
                    className="text-xs px-1.5 py-0.5"
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            )}
          </button>
        ))
      )}
    </div>
  );

  // 统计信息
  const folderStats = {
    total: allMails.length,
    unread: unreadMails.length,
    hasUnread: unreadMails.length > 0,
  };

  // 邮件列表面板
  const MailListPanel = (
    <Tabs defaultValue="all">
      <div className="flex items-center px-4 pt-2">
        <div>
          <div className="flex flex-row items-center gap-2">
            <h1 className="text-xl font-bold">{folderTitle}</h1>
            <span className="text-xs text-muted-foreground">
              共 {folderStats.total} 封邮件
            </span>
          </div>
          {folderStats.total > 0 ? (
            <p className="text-xs text-muted-foreground">
              {folderStats.hasUnread && ` (${folderStats.unread} 封未读)`}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {folderTitle}中没有邮件
            </p>
          )}
        </div>
        <TabsList className="ml-auto">
          <TabsTrigger value="all">所有邮件</TabsTrigger>
          <TabsTrigger value="unread">未读邮件</TabsTrigger>
          <TabsTrigger value="important">重要邮件</TabsTrigger>
        </TabsList>
      </div>
      <Separator />

      {/* 搜索框 */}
      <div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索"
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
      </div>

      <TabsContent value="all" className="m-0">
        <ScrollArea className="h-[calc(100vh-220px)]">
          {renderMailList(allMails)}
        </ScrollArea>
      </TabsContent>
      <TabsContent value="unread" className="m-0">
        <ScrollArea className="h-[calc(100vh-220px)]">
          {unreadMails.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              没有未读邮件
            </div>
          ) : (
            renderMailList(unreadMails)
          )}
        </ScrollArea>
      </TabsContent>
      <TabsContent value="important" className="m-0">
        <ScrollArea className="h-[calc(100vh-220px)]">
          {importantMails.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              没有重要邮件
            </div>
          ) : (
            renderMailList(importantMails)
          )}
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );

  return (
    <ResizablePanelGroup direction={layoutDirection} className="h-full">
      <ResizablePanel
        defaultSize={defaultLayout[0]}
        minSize={30}
        className="min-w-[400px]"
      >
        {MailListPanel}
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
        <MailDisplay mail={selectedEmail} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
