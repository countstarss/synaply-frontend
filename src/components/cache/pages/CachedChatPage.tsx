"use client";

import React from "react";
import { GlobalChat } from "@/components/chat/GlobalChat";

export const CachedChatPage = React.memo(() => {
  return (
    <div className="h-full w-full">
      <GlobalChat />
    </div>
  );
});

CachedChatPage.displayName = "CachedChatPage";
