"use client";

import * as React from "react";
import { Search, Star } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { MailDisplay } from "./MailDisplay";
import { useMailStore } from "../store/use-mail-store";
import { EmailMessage } from "../types/mail.entity";
import { getEmailProviderIcon } from "../config/email-icon-registry";

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

// 获取名字首字母
const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
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
    toggleStar,
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
  const { allMails, unreadMails, starredMails } = React.useMemo(() => {
    const allMails = filteredEmails;
    const unreadMails = filteredEmails.filter((mail) => !mail.isRead);
    const starredMails = filteredEmails.filter((mail) => mail.isStarred);
    return { allMails, unreadMails, starredMails };
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

  // 处理星标点击
  const handleStarClick = (e: React.MouseEvent, mailId: string) => {
    e.stopPropagation();
    toggleStar(mailId);
  };

  // 渲染邮件列表
  const renderMailList = (mailsToRender: EmailMessage[]) => (
    <div className="flex flex-col gap-2 p-4 pt-0 px-2">
      {mailsToRender.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          此文件夹中没有邮件
        </div>
      ) : (
        mailsToRender.map((item) => {
          const providerIcon = getEmailProviderIcon(item.sender.email);
          const avatarSrc = providerIcon ?? item.sender.avatar;

          return (
            <div
              key={item.id}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent cursor-pointer",
                selectedId === item.id && "bg-muted",
              )}
              onClick={() => handleMailClick(item.id)}
            >
              {/* 头像 */}
              <Avatar className="h-8 w-8 shrink-0 rounded-lg">
                <AvatarImage src={avatarSrc} alt={item.sender.name} />
                <AvatarFallback>{getInitials(item.sender.name)}</AvatarFallback>
              </Avatar>

              {/* 邮件内容 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="font-semibold truncate">
                      {item.sender?.name ||
                        item.sender?.email ||
                        "Unknown Sender"}
                    </span>
                    {!item.isRead && (
                      <span className="flex h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs shrink-0",
                      selectedId === item.id
                        ? "text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {formatDistanceToNow(new Date(item.date), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <div className="text-xs font-medium truncate mt-1">
                  {item.subject || "(No Subject)"}
                </div>
                <div className="line-clamp-2 text-xs text-muted-foreground mt-1">
                  {item.snippet || "(No Snippet)"}
                </div>
                {item.labels && item.labels.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap mt-2">
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
              </div>

              {/* 星标按钮 */}
              <button
                className="shrink-0 p-1 hover:bg-muted rounded"
                onClick={(e) => handleStarClick(e, item.id)}
              >
                <Star
                  className={cn(
                    "h-4 w-4",
                    item.isStarred
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground",
                  )}
                />
              </button>
            </div>
          );
        })
      )}
    </div>
  );

  // 统计信息
  const folderStats = {
    total: allMails.length,
    unread: unreadMails.length,
    starred: starredMails.length,
    hasUnread: unreadMails.length > 0,
  };

  // 邮件列表面板
  const MailListPanel = (
    <Tabs defaultValue="all py-0 gap-0">
      <div className="flex items-center px-4 pt-2">
        <div>
          <div className="flex flex-row items-center gap-2">
            <h1 className="text-xl font-bold">{folderTitle}</h1>
            <span className="text-xs text-muted-foreground">
              共 {folderStats.total} 封邮件
            </span>
            {folderStats.total > 0 ? (
              <span className="text-xs text-muted-foreground">
                {folderStats.hasUnread && `${folderStats.unread} 封未读`}
                {folderStats.hasUnread && folderStats.starred > 0 && " · "}
                {folderStats.starred > 0 && `${folderStats.starred} 封星标`}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                {folderTitle}中没有邮件
              </span>
            )}
          </div>
        </div>
        <TabsList className="ml-auto">
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="unread">未读</TabsTrigger>
          <TabsTrigger value="starred">星标</TabsTrigger>
        </TabsList>
      </div>
      <Separator className="mt-0" />

      {/* 搜索框 */}
      <div className="bg-background/95 p-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索邮件..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
      </div>

      <TabsContent value="all" className="m-0">
        <ScrollArea className="h-[calc(100vh-280px)]">
          {renderMailList(allMails)}
        </ScrollArea>
      </TabsContent>
      <TabsContent value="unread" className="m-0">
        <ScrollArea className="h-[calc(100vh-280px)]">
          {unreadMails.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              没有未读邮件
            </div>
          ) : (
            renderMailList(unreadMails)
          )}
        </ScrollArea>
      </TabsContent>
      <TabsContent value="starred" className="m-0">
        <ScrollArea className="h-[calc(100vh-280px)]">
          {starredMails.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              没有星标邮件
            </div>
          ) : (
            renderMailList(starredMails)
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
        className="min-w-[362px]"
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
