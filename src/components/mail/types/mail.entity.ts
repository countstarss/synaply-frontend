// MARK: 邮件发送者/接收者
export interface EmailContact {
  name: string;
  email: string;
  avatar?: string;
}

// MARK: 邮件附件
export interface EmailAttachment {
  id: string;
  filename: string;
  size: number;
  contentType: string;
}

// MARK: 邮件消息
export interface EmailMessage {
  id: string;
  subject: string;
  snippet: string;
  body?: string;
  date: string;
  isRead: boolean;
  isStarred: boolean;
  sender: EmailContact;
  recipients: EmailContact[];
  cc?: EmailContact[];
  labels?: string[];
  folder: "inbox" | "sent" | "draft" | "trash" | "archive" | "junk";
  hasAttachments?: boolean;
  attachments?: EmailAttachment[];
}

// MARK: 邮件文件夹类型
export type MailFolder =
  | "inbox"
  | "sent"
  | "draft"
  | "trash"
  | "archive"
  | "junk";

// MARK: 导航链接项
export interface NavLinkItem {
  title: string;
  label?: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: "default" | "ghost";
  href?: string;
  isActive?: boolean;
  onClick?: () => void;
}

// MARK: 邮件账户
export interface EmailAccount {
  label: string;
  email: string;
  icon?: React.ReactNode;
}

// MARK: 邮件状态
export interface MailState {
  currentFolder: MailFolder;
  selectedId: string | null;
}
