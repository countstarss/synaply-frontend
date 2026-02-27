"use client";

import React from "react";
import { MailClient } from "@/components/mail";

export const CachedInboxPage = React.memo(() => {
  return (
    <div className="h-full w-full overflow-hidden">
      <MailClient />
    </div>
  );
});

CachedInboxPage.displayName = "CachedInboxPage";
