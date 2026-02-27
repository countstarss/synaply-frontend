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
  Star,
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
import { cn } from "@/lib/utils";
import { EmailMessage } from "../types/mail.entity";
import { useMailStore } from "../store/use-mail-store";
import { getEmailProviderIcon } from "../config/email-icon-registry";

interface MailDisplayProps {
  mail: EmailMessage | null;
}

// 获取名字首字母
const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const dedupeRecipients = (recipients: EmailMessage["recipients"]) => {
  const unique = new Map<string, EmailMessage["recipients"][number]>();
  recipients.forEach((recipient) => {
    unique.set(recipient.email, recipient);
  });
  return Array.from(unique.values());
};

const buildQuotedBody = (mail: EmailMessage) => {
  const original = mail.body || `<p>${mail.snippet}</p>`;
  return `
    <p></p>
    <blockquote>${original}</blockquote>
  `;
};

const withSubjectPrefix = (prefix: string, subject: string) => {
  const normalized = subject?.toLowerCase().startsWith(prefix.toLowerCase());
  if (normalized) return subject;
  return `${prefix} ${subject}`.trim();
};

export function MailDisplay({ mail }: MailDisplayProps) {
  const { moveToFolder, markAsUnread, toggleStar, openComposer } =
    useMailStore();
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  // 检测邮件内容是否包含 HTML 标签
  const isHtmlContent = React.useMemo(() => {
    if (!mail?.body) return false;
    return /<[a-z][\s\S]*>/i.test(mail.body);
  }, [mail?.body]);

  // 更新 iframe 内容 - 使用沙箱隔离，自动调整高度
  React.useEffect(() => {
    if (iframeRef.current && mail?.body && isHtmlContent) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument;
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                * {
                  box-sizing: border-box;
                }
                html, body {
                  margin: 0;
                  padding: 0;
                  background: #0b1220 !important;
                }
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                  font-size: 14px;
                  line-height: 1.6;
                  color: #ffffff !important;
                  word-wrap: break-word;
                  overflow: hidden;
                }
                body * {
                  color: inherit !important;
                  background-color: transparent !important;
                }
                a {
                  color: #ffffff !important;
                  text-decoration: underline;
                }
                img {
                  max-width: 100%;
                  height: auto;
                }
                table {
                  border-collapse: collapse;
                  max-width: 100%;
                  width: 100%;
                  background-color: #0f172a !important;
                }
                th, td {
                  border: 1px solid rgba(255, 255, 255, 0.2) !important;
                  padding: 10px;
                  background-color: #0f172a !important;
                }
                th {
                  background-color: #111827 !important;
                  text-align: left;
                }
                blockquote {
                  margin: 0;
                  padding-left: 15px;
                  border-left: 3px solid #ffffff;
                }
                pre {
                  background: #0f172a !important;
                  padding: 12px;
                  border-radius: 6px;
                  overflow-x: auto;
                }
                code {
                  background: #0f172a !important;
                  padding: 2px 6px;
                  border-radius: 4px;
                  font-size: 13px;
                }
                /* 覆盖邮件中可能的白色背景 */
                div, p, span {
                  background-color: transparent !important;
                }
              </style>
            </head>
            <body>${mail.body}</body>
          </html>
        `);
        doc.close();

        // 自动调整 iframe 高度
        const adjustHeight = () => {
          if (iframe.contentDocument?.body) {
            const height = iframe.contentDocument.body.scrollHeight;
            iframe.style.height = `${height + 20}px`;
          }
        };

        // 等待内容加载完成后调整高度
        setTimeout(adjustHeight, 100);
        // 监听图片加载
        const images = iframe.contentDocument?.querySelectorAll("img");
        images?.forEach((img) => {
          img.addEventListener("load", adjustHeight);
        });
      }
    }
  }, [mail?.body, isHtmlContent]);

  // 归档邮件
  const handleArchive = () => {
    if (!mail) return;
    moveToFolder(mail.id, "archive");
  };

  // 移到垃圾邮件
  const handleMoveToJunk = () => {
    if (!mail) return;
    moveToFolder(mail.id, "junk");
  };

  // 移到垃圾箱
  const handleMoveToTrash = () => {
    if (!mail) return;
    moveToFolder(mail.id, "trash");
  };

  // 标记为未读
  const handleMarkAsUnread = () => {
    if (!mail) return;
    markAsUnread(mail.id);
  };

  // 添加/移除星标
  const handleToggleStar = () => {
    if (!mail) return;
    toggleStar(mail.id);
  };

  // 处理回复邮件
  const handleReply = () => {
    if (!mail) return;
    openComposer("reply", {
      to: [mail.sender],
      subject: withSubjectPrefix("Re:", mail.subject),
      body: buildQuotedBody(mail),
    });
  };

  // 处理全部回复
  const handleReplyAll = () => {
    if (!mail) return;
    const toRecipients = dedupeRecipients([
      mail.sender,
      ...mail.recipients,
    ]);
    const ccRecipients = dedupeRecipients(mail.cc ?? []).filter(
      (recipient) =>
        !toRecipients.some((item) => item.email === recipient.email),
    );
    openComposer("replyAll", {
      to: toRecipients,
      cc: ccRecipients,
      subject: withSubjectPrefix("Re:", mail.subject),
      body: buildQuotedBody(mail),
    });
  };

  // 处理转发
  const handleForward = () => {
    if (!mail) return;
    openComposer("forward", {
      subject: withSubjectPrefix("Fwd:", mail.subject),
      body: buildQuotedBody(mail),
    });
  };

  const handleEditDraft = () => {
    if (!mail) return;
    openComposer("draft", {
      draftId: mail.id,
      from: mail.sender,
      to: mail.recipients,
      cc: mail.cc,
      bcc: mail.bcc,
      subject: mail.subject,
      body: mail.body,
    });
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

  // 获取发件人头像
  const providerIcon = getEmailProviderIcon(mail.sender.email);

  return (
    <div className="flex h-full flex-col">
      {/* 工具栏 */}
      <div className="flex items-center p-2 shrink-0">
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
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleToggleStar}>
                <Star
                  className={cn(
                    "h-4 w-4",
                    mail.isStarred
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground",
                  )}
                />
                <span className="sr-only">Star</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {mail.isStarred ? "Unstar" : "Star"}
            </TooltipContent>
          </Tooltip>
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
                    >
                      Later today
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start font-normal"
                    >
                      Tomorrow
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start font-normal"
                    >
                      This weekend
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start font-normal"
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
              {mail.isStarred ? "Remove star" : "Star thread"}
            </DropdownMenuItem>
            <DropdownMenuItem>Add label</DropdownMenuItem>
            <DropdownMenuItem>Mute thread</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Separator />

      {/* 邮件内容区域 - 可滚动 */}
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          {/* 主题 */}
          <div className="flex items-start justify-between gap-4 pb-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-xl font-bold">
                {mail.subject || "(No Subject)"}
              </h1>
              {mail.folder === "draft" && (
                <Button variant="outline" size="sm" onClick={handleEditDraft}>
                  编辑草稿
                </Button>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
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
            <Avatar className="w-8 h-8 rounded-lg">
              {providerIcon ? (
                <AvatarImage src={providerIcon} alt={mail.sender.name} />
              ) : (
                <AvatarImage
                  src={mail.sender.avatar ?? ""}
                  alt={mail.sender.name}
                />
              )}
              <AvatarFallback className="text-xs">
                {getInitials(mail.sender.name)}
              </AvatarFallback>
            </Avatar>
            <div className="grid gap-1">
              <div className="font-semibold">{mail.sender.name}</div>
              <div className="line-clamp-1 text-xs text-muted-foreground">
                {mail.sender.email}
              </div>
            </div>
          </div>

          {/* 收件人、抄送和时间 */}
          <div className="mt-4 space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>
                To: {mail.recipients.map((r) => r.name || r.email).join(", ")}
              </span>
              <span className="text-xs">
                {format(new Date(mail.date), "PPpp")}
              </span>
            </div>
            {mail.cc && mail.cc.length > 0 && (
              <div>Cc: {mail.cc.map((c) => c.name || c.email).join(", ")}</div>
            )}
            {mail.bcc && mail.bcc.length > 0 && (
              <div>Bcc: {mail.bcc.map((b) => b.name || b.email).join(", ")}</div>
            )}
          </div>

          <Separator className="my-4" />

          {/* 邮件正文 */}
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {isHtmlContent ? (
              <iframe
                ref={iframeRef}
                title="Email content"
                className="w-full border-0 bg-slate-950"
                style={{ minHeight: "100px", backgroundColor: "#0b1220" }}
                sandbox="allow-same-origin"
              />
            ) : (
              <div className="whitespace-pre-wrap text-sm text-black">
                {mail.body || mail.snippet}
              </div>
            )}
          </div>

          {/* 附件 */}
          {mail.hasAttachments &&
            mail.attachments &&
            mail.attachments.length > 0 && (
              <div className="mt-6">
                <Separator className="mb-4" />
                <h3 className="mb-2 text-sm font-medium">
                  Attachments ({mail.attachments.length})
                </h3>
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
                      <Button size="sm" variant="outline">
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      </div>

      {/* 底部回复按钮 - 固定在底部 */}
      <div className="flex items-center border-t p-4 shrink-0">
        <div className="flex items-center gap-2">
          {mail.folder === "draft" ? (
            <Button variant="outline" size="sm" onClick={handleEditDraft}>
              编辑草稿
            </Button>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
