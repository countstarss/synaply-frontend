"use client";

import * as React from "react";
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Paperclip,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { EmailContact, EmailMessage } from "../types/mail.entity";
import { ComposeInitialData } from "../types/compose";
import { DraftRecord } from "../data/draft-storage";
import { useMailStore } from "../store/use-mail-store";

const DEFAULT_FROM: EmailContact = {
  name: "Me",
  email: "me@synaply.com",
};

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `draft-${Date.now()}`;

const stripHtml = (html: string) =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const buildSnippet = (bodyText: string) =>
  bodyText ? bodyText.slice(0, 120) : "(No Content)";

const parseRecipientInput = (value: string): EmailContact[] => {
  const tokens = value
    .split(/[,;\n]+/)
    .map((token) => token.trim())
    .filter(Boolean);

  return tokens.map((token) => {
    const match = token.match(/^(.*)<(.+)>$/);
    if (match) {
      const name = match[1].trim();
      const email = match[2].trim();
      return { name: name || email, email };
    }
    return { name: token.split("@")[0] || token, email: token };
  });
};

const mergeRecipients = (current: EmailContact[], next: EmailContact[]) => {
  const byEmail = new Map<string, EmailContact>();
  current.forEach((item) => byEmail.set(item.email, item));
  next.forEach((item) => {
    if (!byEmail.has(item.email)) {
      byEmail.set(item.email, item);
    }
  });
  return Array.from(byEmail.values());
};

type RecipientFieldProps = {
  label: string;
  value: EmailContact[];
  onChange: (value: EmailContact[]) => void;
  placeholder?: string;
  actions?: React.ReactNode;
};

const RecipientField = ({
  label,
  value,
  onChange,
  placeholder,
  actions,
}: RecipientFieldProps) => {
  const [inputValue, setInputValue] = React.useState("");

  const addRecipients = (raw: string) => {
    const parsed = parseRecipientInput(raw);
    if (parsed.length === 0) return;
    onChange(mergeRecipients(value, parsed));
    setInputValue("");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addRecipients(inputValue);
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addRecipients(inputValue);
    }
  };

  const removeRecipient = (email: string) => {
    onChange(value.filter((item) => item.email !== email));
  };

  return (
    <div className="flex items-start gap-3">
      <div className="w-12 text-xs text-muted-foreground pt-2">{label}</div>
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-transparent px-2 py-1">
          {value.map((recipient) => (
            <Badge key={recipient.email} variant="secondary" className="gap-1">
              {recipient.email}
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => removeRecipient(recipient.email)}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <input
            className="min-w-[140px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder={placeholder}
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
          />
          {actions}
        </div>
      </div>
    </div>
  );
};

const buildDraftRecord = (
  draftId: string,
  data: ComposeInitialData,
  bodyHtml: string,
  bodyText: string,
): DraftRecord => {
  const now = new Date().toISOString();
  return {
    id: draftId,
    from: data.from ?? DEFAULT_FROM,
    to: data.to ?? [],
    cc: data.cc,
    bcc: data.bcc,
    subject: data.subject ?? "",
    body: bodyHtml,
    bodyText,
    createdAt: now,
    updatedAt: now,
  };
};

const createSentEmail = (payload: {
  from: EmailContact;
  to: EmailContact[];
  cc?: EmailContact[];
  bcc?: EmailContact[];
  subject: string;
  body: string;
  bodyText: string;
}): EmailMessage => {
  const now = new Date().toISOString();
  return {
    id: createId(),
    subject: payload.subject || "(No Subject)",
    snippet: buildSnippet(payload.bodyText),
    body: payload.body,
    date: now,
    isRead: true,
    isStarred: false,
    sender: payload.from,
    recipients: payload.to,
    cc: payload.cc,
    bcc: payload.bcc,
    folder: "sent",
  };
};

export function MailComposer() {
  const {
    composer,
    closeComposer,
    saveDraft,
    removeDraft,
    addEmail,
  } = useMailStore();
  const editorRef = React.useRef<HTMLDivElement>(null);
  const [draftId, setDraftId] = React.useState<string>("");
  const [to, setTo] = React.useState<EmailContact[]>([]);
  const [cc, setCc] = React.useState<EmailContact[]>([]);
  const [bcc, setBcc] = React.useState<EmailContact[]>([]);
  const [subject, setSubject] = React.useState("");
  const [bodyHtml, setBodyHtml] = React.useState("");
  const [bodyText, setBodyText] = React.useState("");
  const [showCc, setShowCc] = React.useState(false);
  const [showBcc, setShowBcc] = React.useState(false);
  const [lastSavedAt, setLastSavedAt] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!composer.isOpen) return;
    const initial = composer.initial;
    const newDraftId = initial.draftId ?? createId();
    setDraftId(newDraftId);
    setTo(initial.to ?? []);
    setCc(initial.cc ?? []);
    setBcc(initial.bcc ?? []);
    setSubject(initial.subject ?? "");
    setBodyHtml(initial.body ?? "");
    setBodyText(stripHtml(initial.body ?? ""));
    setShowCc(Boolean(initial.cc?.length));
    setShowBcc(Boolean(initial.bcc?.length));
    setLastSavedAt(null);
    if (editorRef.current) {
      editorRef.current.innerHTML = initial.body ?? "";
    }
  }, [composer]);

  React.useEffect(() => {
    if (!composer.isOpen) return;
    const hasContent =
      to.length > 0 ||
      cc.length > 0 ||
      bcc.length > 0 ||
      subject.trim() ||
      bodyText.trim();
    if (!hasContent) return;

    const timer = window.setTimeout(() => {
      const draft = buildDraftRecord(
        draftId,
        {
          ...composer.initial,
          to,
          cc,
          bcc,
          subject,
          body: bodyHtml,
        },
        bodyHtml,
        bodyText,
      );
      saveDraft(draft);
      setLastSavedAt(new Date().toLocaleTimeString());
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [composer.isOpen, to, cc, bcc, subject, bodyHtml, bodyText, draftId, composer.initial, saveDraft]);

  const handleEditorInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    const text = editorRef.current.innerText;
    setBodyHtml(html);
    setBodyText(text);
  };

  const applyCommand = (command: string, value?: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, value);
    handleEditorInput();
  };

  const handleInsertLink = () => {
    const url = window.prompt("请输入链接地址");
    if (!url) return;
    applyCommand("createLink", url);
  };

  const handleSaveDraft = () => {
    const draft = buildDraftRecord(
      draftId,
      {
        ...composer.initial,
        to,
        cc,
        bcc,
        subject,
        body: bodyHtml,
      },
      bodyHtml,
      bodyText,
    );
    saveDraft(draft);
    closeComposer();
  };

  const handleSend = () => {
    const message = createSentEmail({
      from: composer.initial.from ?? DEFAULT_FROM,
      to,
      cc,
      bcc,
      subject,
      body: bodyHtml,
      bodyText,
    });
    addEmail(message);
    if (draftId) {
      removeDraft(draftId);
    }
    closeComposer();
  };

  const handleDeleteDraft = () => {
    if (draftId) {
      removeDraft(draftId);
    }
    closeComposer();
  };

  return (
    <Dialog open={composer.isOpen} onOpenChange={(open) => !open && closeComposer()}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {composer.mode === "reply"
              ? "Reply"
              : composer.mode === "replyAll"
              ? "Reply all"
              : composer.mode === "forward"
              ? "Forward"
              : composer.mode === "draft"
              ? "Edit draft"
              : "New message"}
          </DialogTitle>
          <DialogDescription>
            支持收件人标签、基础富文本与草稿自动保存。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <RecipientField
            label="To"
            value={to}
            onChange={setTo}
            placeholder="输入收件人邮箱"
            actions={
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <button
                  type="button"
                  className={cn("hover:text-foreground", showCc && "text-foreground")}
                  onClick={() => setShowCc((value) => !value)}
                >
                  Cc
                </button>
                <span>/</span>
                <button
                  type="button"
                  className={cn("hover:text-foreground", showBcc && "text-foreground")}
                  onClick={() => setShowBcc((value) => !value)}
                >
                  Bcc
                </button>
              </div>
            }
          />
          {showCc && (
            <RecipientField
              label="Cc"
              value={cc}
              onChange={setCc}
              placeholder="输入抄送邮箱"
            />
          )}
          {showBcc && (
            <RecipientField
              label="Bcc"
              value={bcc}
              onChange={setBcc}
              placeholder="输入密送邮箱"
            />
          )}
          <div className="flex items-center gap-3">
            <div className="w-12 text-xs text-muted-foreground">Subject</div>
            <Input
              value={subject}
              placeholder="邮件主题"
              onChange={(event) => setSubject(event.target.value)}
            />
          </div>
        </div>

        <Separator />

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => applyCommand("bold")}>
            <Bold className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => applyCommand("italic")}>
            <Italic className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => applyCommand("insertUnorderedList")}>
            <List className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => applyCommand("insertOrderedList")}>
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleInsertLink}>
            <Link2 className="h-4 w-4" />
          </Button>
        </div>

        <div
          ref={editorRef}
          className="min-h-[220px] rounded-md border bg-transparent px-3 py-2 text-sm outline-none"
          contentEditable
          onInput={handleEditorInput}
          suppressContentEditableWarning
        />

        <div className="flex items-center justify-between rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            附件上传占位（后续接入）
          </div>
          <Button variant="outline" size="sm">
            添加附件
          </Button>
        </div>

        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between sm:items-center">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {lastSavedAt ? `已自动保存：${lastSavedAt}` : "将自动保存到草稿箱"}
          </div>
          <div className="flex items-center gap-2">
            {composer.mode === "draft" && (
              <Button variant="ghost" onClick={handleDeleteDraft}>
                <Trash2 className="mr-2 h-4 w-4" />
                删除草稿
              </Button>
            )}
            <Button variant="ghost" onClick={closeComposer}>
              取消
            </Button>
            <Button variant="outline" onClick={handleSaveDraft}>
              保存草稿
            </Button>
            <Button onClick={handleSend}>发送</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
