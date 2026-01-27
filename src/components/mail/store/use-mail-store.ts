"use client";

import { create } from "zustand";
import { MailFolder, EmailMessage } from "../types/mail.entity";
import { mockEmails } from "../data/mock-data";

interface MailStore {
  // 状态
  currentFolder: MailFolder;
  selectedId: string | null;
  emails: EmailMessage[];

  // Actions
  setCurrentFolder: (folder: MailFolder) => void;
  setSelectedId: (id: string | null) => void;
  setEmails: (emails: EmailMessage[]) => void;

  // 邮件操作
  markAsRead: (id: string) => void;
  markAsUnread: (id: string) => void;
  moveToFolder: (id: string, folder: MailFolder) => void;
  toggleStar: (id: string) => void;
  deleteEmail: (id: string) => void;

  // 获取当前选中的邮件
  getSelectedEmail: () => EmailMessage | null;

  // 获取当前文件夹的邮件
  getCurrentFolderEmails: () => EmailMessage[];
}

export const useMailStore = create<MailStore>((set, get) => ({
  // 初始状态
  currentFolder: "inbox",
  selectedId: null,
  emails: mockEmails,

  // 设置当前文件夹
  setCurrentFolder: (folder) => {
    set({ currentFolder: folder, selectedId: null });
  },

  // 设置选中的邮件ID
  setSelectedId: (id) => {
    set({ selectedId: id });
    // TODO: 调用 API 标记邮件为已读
    if (id) {
      get().markAsRead(id);
    }
  },

  // 设置邮件列表
  setEmails: (emails) => {
    set({ emails });
  },

  // 标记为已读
  markAsRead: (id) => {
    // TODO: 调用 API 标记邮件为已读
    set((state) => ({
      emails: state.emails.map((email) =>
        email.id === id ? { ...email, isRead: true } : email,
      ),
    }));
  },

  // 标记为未读
  markAsUnread: (id) => {
    // TODO: 调用 API 标记邮件为未读
    set((state) => ({
      emails: state.emails.map((email) =>
        email.id === id ? { ...email, isRead: false } : email,
      ),
    }));
  },

  // 移动到文件夹
  moveToFolder: (id, folder) => {
    // TODO: 调用 API 移动邮件到指定文件夹
    set((state) => ({
      emails: state.emails.map((email) =>
        email.id === id ? { ...email, folder } : email,
      ),
      selectedId: state.selectedId === id ? null : state.selectedId,
    }));
  },

  // 切换星标
  toggleStar: (id) => {
    // TODO: 调用 API 切换邮件星标状态
    set((state) => ({
      emails: state.emails.map((email) =>
        email.id === id ? { ...email, isStarred: !email.isStarred } : email,
      ),
    }));
  },

  // 删除邮件（移动到垃圾箱）
  deleteEmail: (id) => {
    // TODO: 调用 API 删除邮件
    get().moveToFolder(id, "trash");
  },

  // 获取当前选中的邮件
  getSelectedEmail: () => {
    const { emails, selectedId } = get();
    return emails.find((email) => email.id === selectedId) || null;
  },

  // 获取当前文件夹的邮件
  getCurrentFolderEmails: () => {
    const { emails, currentFolder } = get();
    return emails.filter((email) => email.folder === currentFolder);
  },
}));
