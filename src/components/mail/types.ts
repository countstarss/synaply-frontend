// 邮件发送者/接收者
export interface EmailContact {
  name: string;
  email: string;
}

// 邮件附件
export interface EmailAttachment {
  id: string;
  filename: string;
  size: number;
  contentType: string;
}

// 邮件消息
export interface EmailMessage {
  id: string;
  subject: string;
  snippet: string;
  body?: string;
  date: string;
  unread: boolean;
  sender: EmailContact;
  recipients: EmailContact[];
  labels?: string[];
  folder?: string;
  hasAttachments?: boolean;
  attachments?: EmailAttachment[];
}

// 邮件文件夹类型
export type MailFolder = "inbox" | "sent" | "draft" | "trash" | "archive" | "junk";

// 导航链接项
export interface NavLinkItem {
  title: string;
  label?: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: "default" | "ghost";
  href?: string;
  isActive?: boolean;
  onClick?: () => void;
}

// 邮件账户
export interface EmailAccount {
  label: string;
  email: string;
  icon?: React.ReactNode;
}

// 邮件状态
export interface MailState {
  currentFolder: MailFolder;
  selectedId: string | null;
}
