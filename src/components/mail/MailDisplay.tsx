"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  Archive,
  ArchiveX,
  Clock,
  Forward,
  MoreVertical,
  Reply,
  ReplyAll,
  Trash2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EmailMessage } from "./types";
import { useMailStore } from "./use-mail-store";

interface MailDisplayProps {
  mail: EmailMessage | null;
}

export function MailDisplay({ mail }: MailDisplayProps) {
  const { moveToFolder, markAsUnread, toggleStar } = useMailStore();

  // 归档邮件
  const handleArchive = () => {
    if (!mail) return;
    // TODO: 调用 API 归档邮件
    moveToFolder(mail.id, "archive");
  };

  // 移到垃圾邮件
  const handleMoveToJunk = () => {
    if (!mail) return;
    // TODO: 调用 API 移动到垃圾邮件
    moveToFolder(mail.id, "junk");
  };

  // 移到垃圾箱
  const handleMoveToTrash = () => {
    if (!mail) return;
    // TODO: 调用 API 移动到垃圾箱
    moveToFolder(mail.id, "trash");
  };

  // 标记为未读
  const handleMarkAsUnread = () => {
    if (!mail) return;
    // TODO: 调用 API 标记为未读
    markAsUnread(mail.id);
  };

  // 添加/移除星标
  const handleToggleStar = () => {
    if (!mail) return;
    // TODO: 调用 API 切换星标
    toggleStar(mail.id);
  };

  // 处理回复邮件
  const handleReply = () => {
    if (!mail) return;
    // TODO: 打开回复邮件弹窗
    console.log("Reply to:", mail.sender.email);
  };

  // 处理全部回复
  const handleReplyAll = () => {
    if (!mail) return;
    // TODO: 打开全部回复邮件弹窗
    console.log("Reply all");
  };

  // 处理转发
  const handleForward = () => {
    if (!mail) return;
    // TODO: 打开转发邮件弹窗
    console.log("Forward");
  };

  // 如果没有选中的邮件，显示空状态
  if (!mail) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <h3 className="mt-4 text-lg font-semibold">No email selected</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            Select an email from the list to view its details
          </p>
        </div>
      </div>
    );
  }

  const hasImportantLabel = mail.labels?.includes("important") || false;

  return (
    <div className="flex h-full flex-col">
      {/* 工具栏 */}
      <div className="flex items-center p-2">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleArchive}>
                <Archive className="h-4 w-4" />
                <span className="sr-only">Archive</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Archive</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleMoveToJunk}>
                <ArchiveX className="h-4 w-4" />
                <span className="sr-only">Move to junk</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Move to junk</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleMoveToTrash}>
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Move to trash</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Move to trash</TooltipContent>
          </Tooltip>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Tooltip>
            <Popover>
              <PopoverTrigger asChild>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Clock className="h-4 w-4" />
                    <span className="sr-only">Snooze</span>
                  </Button>
                </TooltipTrigger>
              </PopoverTrigger>
              <PopoverContent className="flex w-[535px] p-0">
                <div className="flex flex-col gap-2 border-r px-2 py-4">
                  <div className="px-4 text-sm font-medium">Snooze until</div>
                  <div className="grid min-w-[250px] gap-1">
                    <Button
                      variant="ghost"
                      className="justify-start font-normal"
                      onClick={() => {
                        // TODO: 实现稍后提醒功能
                      }}
                    >
                      Later today
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start font-normal"
                      onClick={() => {
                        // TODO: 实现稍后提醒功能
                      }}
                    >
                      Tomorrow
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start font-normal"
                      onClick={() => {
                        // TODO: 实现稍后提醒功能
                      }}
                    >
                      This weekend
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start font-normal"
                      onClick={() => {
                        // TODO: 实现稍后提醒功能
                      }}
                    >
                      Next week
                    </Button>
                  </div>
                </div>
                <div className="p-2">
                  <Calendar />
                </div>
              </PopoverContent>
            </Popover>
            <TooltipContent>Snooze</TooltipContent>
          </Tooltip>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleReply}>
                <Reply className="h-4 w-4" />
                <span className="sr-only">Reply</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reply</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleReplyAll}>
                <ReplyAll className="h-4 w-4" />
                <span className="sr-only">Reply all</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reply all</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleForward}>
                <Forward className="h-4 w-4" />
                <span className="sr-only">Forward</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Forward</TooltipContent>
          </Tooltip>
        </div>
        <Separator orientation="vertical" className="mx-2 h-6" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">More</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleMarkAsUnread}>
              Mark as unread
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleToggleStar}>
              {hasImportantLabel ? "Remove star" : "Star thread"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                // TODO: 添加标签功能
              }}
            >
              Add label
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                // TODO: 静音会话功能
              }}
            >
              Mute thread
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Separator />

      {/* 邮件内容 */}
      <div className="flex-1 overflow-auto p-4">
        <div className="flex items-start justify-between pb-4">
          <h1 className="text-xl font-bold">{mail.subject}</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleArchive}>
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleMoveToJunk}>
                Move to junk
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleMoveToTrash}>
                Move to trash
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleMarkAsUnread}>
                Mark as unread
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleStar}>
                Add/remove star
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 发件人信息 */}
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage alt={mail.sender.name} />
            <AvatarFallback className="text-xs">
              {mail.sender.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="grid gap-1">
            <div className="font-semibold">{mail.sender.name}</div>
            <div className="line-clamp-1 text-xs">{mail.sender.email}</div>
          </div>
        </div>

        {/* 收件人和时间 */}
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-muted-foreground">
            To: {mail.recipients.map((r) => r.name || r.email).join(", ")}
          </div>
          <div className="text-sm text-muted-foreground">
            {format(new Date(mail.date), "PPpp")}
          </div>
        </div>

        <Separator className="my-4" />

        {/* 邮件正文 */}
        <div className="whitespace-pre-wrap text-sm">
          {mail.body ? (
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: mail.body }}
            />
          ) : (
            <p>{mail.snippet}</p>
          )}
        </div>

        {/* 附件 */}
        {mail.hasAttachments && mail.attachments && mail.attachments.length > 0 && (
          <>
            <Separator className="my-4" />
            <div>
              <h3 className="mb-2 text-sm font-medium">Attachments</h3>
              <div className="grid gap-2">
                {mail.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-2 rounded-md border p-2"
                  >
                    <div className="flex-1 truncate">
                      <div className="truncate text-sm font-medium">
                        {attachment.filename}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {Math.round(attachment.size / 1024)} KB
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // TODO: 下载附件
                      }}
                    >
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* 底部回复按钮 */}
      <div className="flex items-center justify-between border-t p-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReply}>
            <Reply className="mr-2 h-4 w-4" />
            Reply
          </Button>
          <Button variant="outline" size="sm" onClick={handleReplyAll}>
            <ReplyAll className="mr-2 h-4 w-4" />
            Reply all
          </Button>
          <Button variant="outline" size="sm" onClick={handleForward}>
            <Forward className="mr-2 h-4 w-4" />
            Forward
          </Button>
        </div>
      </div>
    </div>
  );
}
