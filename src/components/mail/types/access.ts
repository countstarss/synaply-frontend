export type MailRole = "OWNER" | "ADMIN" | "MEMBER" | "PERSONAL";

export type MailAccessView = "mail" | "admin";

export interface EmailApplication {
  id: string;
  userId: string;
  userName: string;
  requestedPrefix: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface TeamEmailAccount {
  id: string;
  userId: string;
  email: string;
  status: "active" | "disabled";
  createdAt: string;
}
