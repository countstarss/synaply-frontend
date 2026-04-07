import { EmailContact, EmailMessage } from "../types/mail.entity";

export type DraftRecord = {
  id: string;
  from: EmailContact;
  to: EmailContact[];
  cc?: EmailContact[];
  bcc?: EmailContact[];
  subject: string;
  body: string;
  bodyText?: string;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "synaply.mail.drafts";
const STORAGE_VERSION = 1;

const isBrowser = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const stripHtml = (html: string) =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const loadDrafts = (): DraftRecord[] => {
  if (!isBrowser()) return [];
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored) as {
      version: number;
      drafts: DraftRecord[];
    };
    if (!parsed || !Array.isArray(parsed.drafts)) {
      return [];
    }
    return parsed.drafts;
  } catch {
    return [];
  }
};

const saveDrafts = (drafts: DraftRecord[]) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ version: STORAGE_VERSION, drafts }),
  );
};

export const upsertDraft = (draft: DraftRecord) => {
  const drafts = loadDrafts();
  const index = drafts.findIndex((item) => item.id === draft.id);
  if (index >= 0) {
    drafts[index] = draft;
  } else {
    drafts.unshift(draft);
  }
  saveDrafts(drafts);
  return drafts;
};

export const removeDraft = (draftId: string) => {
  const drafts = loadDrafts().filter((draft) => draft.id !== draftId);
  saveDrafts(drafts);
  return drafts;
};

export const draftToEmailMessage = (draft: DraftRecord): EmailMessage => {
  const bodyText = draft.bodyText || stripHtml(draft.body || "");
  return {
    id: draft.id,
    subject: draft.subject || "(No Subject)",
    snippet: bodyText || "(No Content)",
    body: draft.body,
    date: draft.updatedAt,
    isRead: true,
    isStarred: false,
    sender: draft.from,
    recipients: draft.to,
    cc: draft.cc,
    bcc: draft.bcc,
    folder: "draft",
  };
};

export const getDraftFromEmail = (email: EmailMessage): DraftRecord => {
  const now = new Date().toISOString();
  return {
    id: email.id,
    from: email.sender,
    to: email.recipients,
    cc: email.cc,
    bcc: email.bcc,
    subject: email.subject,
    body: email.body || "",
    bodyText: stripHtml(email.body || ""),
    createdAt: now,
    updatedAt: now,
  };
};
