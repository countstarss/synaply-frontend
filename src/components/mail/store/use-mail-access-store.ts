"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MailAccessView, MailRole, EmailApplication, TeamEmailAccount } from "../types/access";

type MailAccessUser = {
  id: string;
  name: string;
};

interface MailAccessStore {
  role: MailRole;
  activeView: MailAccessView;
  currentUser: MailAccessUser;
  applications: EmailApplication[];
  accounts: TeamEmailAccount[];

  setActiveView: (view: MailAccessView) => void;
  setRole: (role: MailRole) => void;
  submitApplication: (prefix: string, reason: string) => void;
  approveApplication: (applicationId: string) => void;
  rejectApplication: (applicationId: string) => void;
  toggleAccountStatus: (accountId: string) => void;
  getCurrentUserApplication: () => EmailApplication | null;
  getCurrentUserAccount: () => TeamEmailAccount | null;
}

const DEFAULT_USER: MailAccessUser = {
  id: "user-1",
  name: "Luke Chen",
};

const DEFAULT_ROLE: MailRole = "OWNER";

const DEFAULT_APPLICATIONS: EmailApplication[] = [
  {
    id: "app-1",
    userId: "user-2",
    userName: "Sarah Chen",
    requestedPrefix: "sarah.chen",
    reason: "需要团队邮箱用于设计系统更新沟通。",
    status: "pending",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    id: "app-2",
    userId: "user-3",
    userName: "Michael Brown",
    requestedPrefix: "michael.brown",
    reason: "负责项目周报和客户沟通。",
    status: "approved",
    reviewedBy: "Admin",
    reviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
  },
];

const DEFAULT_ACCOUNTS: TeamEmailAccount[] = [
  {
    id: "acct-1",
    userId: "user-1",
    email: "luke@synaply.com",
    status: "active",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
  {
    id: "acct-2",
    userId: "user-3",
    email: "michael.brown@synaply.com",
    status: "active",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: "acct-3",
    userId: "user-4",
    email: "emily.davis@synaply.com",
    status: "disabled",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
  },
];

const createId = (prefix: string) =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${Date.now()}`;

const buildEmailAddress = (prefix: string) =>
  `${prefix.replace(/@.*$/, "")}@synaply.com`;

export const useMailAccessStore = create<MailAccessStore>()(
  persist(
    (set, get) => ({
      role: DEFAULT_ROLE,
      activeView: "mail",
      currentUser: DEFAULT_USER,
      applications: DEFAULT_APPLICATIONS,
      accounts: DEFAULT_ACCOUNTS,

      setActiveView: (view) => set({ activeView: view }),

      setRole: (role) => set({ role }),

      submitApplication: (prefix, reason) => {
        const { applications, currentUser } = get();
        const now = new Date().toISOString();
        const existing = applications.find(
          (item) => item.userId === currentUser.id,
        );
        const nextApplication: EmailApplication = {
          id: existing?.id ?? createId("app"),
          userId: currentUser.id,
          userName: currentUser.name,
          requestedPrefix: prefix,
          reason,
          status: "pending",
          createdAt: existing?.createdAt ?? now,
        };
        const nextApplications = existing
          ? applications.map((item) =>
              item.id === existing.id ? nextApplication : item,
            )
          : [nextApplication, ...applications];
        set({ applications: nextApplications });
      },

      approveApplication: (applicationId) => {
        const { applications, accounts } = get();
        const now = new Date().toISOString();
        const application = applications.find(
          (item) => item.id === applicationId,
        );
        if (!application) return;
        const nextApplications = applications.map<EmailApplication>((item) =>
          item.id === applicationId
            ? {
                ...item,
                status: "approved",
                reviewedBy: "Admin",
                reviewedAt: now,
              }
            : item,
        );
        const email = buildEmailAddress(application.requestedPrefix);
        const exists = accounts.some((account) => account.userId === application.userId);
        const nextAccounts: TeamEmailAccount[] = exists
          ? accounts
          : [
              {
                id: createId("acct"),
                userId: application.userId,
                email,
                status: "active",
                createdAt: now,
              },
              ...accounts,
            ];
        set({ applications: nextApplications, accounts: nextAccounts });
      },

      rejectApplication: (applicationId) => {
        const { applications } = get();
        const now = new Date().toISOString();
        const nextApplications = applications.map<EmailApplication>((item) =>
          item.id === applicationId
            ? {
                ...item,
                status: "rejected",
                reviewedBy: "Admin",
                reviewedAt: now,
              }
            : item,
        );
        set({ applications: nextApplications });
      },

      toggleAccountStatus: (accountId) => {
        const { accounts } = get();
        const nextAccounts = accounts.map<TeamEmailAccount>((account) =>
          account.id === accountId
            ? {
                ...account,
                status: account.status === "active" ? "disabled" : "active",
              }
            : account,
        );
        set({ accounts: nextAccounts });
      },

      getCurrentUserApplication: () => {
        const { applications, currentUser } = get();
        return applications.find((item) => item.userId === currentUser.id) || null;
      },

      getCurrentUserAccount: () => {
        const { accounts, currentUser } = get();
        return accounts.find((item) => item.userId === currentUser.id) || null;
      },
    }),
    {
      name: "synaply-mail-access",
      partialize: (state) => ({
        role: state.role,
        activeView: state.activeView,
        currentUser: state.currentUser,
        applications: state.applications,
        accounts: state.accounts,
      }),
    },
  ),
);
