import { EmailContact } from "./mail.entity";

export type ComposeMode = "new" | "reply" | "replyAll" | "forward" | "draft";

export type ComposeInitialData = {
  draftId?: string;
  from?: EmailContact;
  to?: EmailContact[];
  cc?: EmailContact[];
  bcc?: EmailContact[];
  subject?: string;
  body?: string;
};

export type ComposerState = {
  isOpen: boolean;
  mode: ComposeMode;
  initial: ComposeInitialData;
};
