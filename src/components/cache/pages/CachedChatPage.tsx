"use client";

import React from "react";
import { GlobalChat } from "@/components/chat/GlobalChat";
import { useSearchParams } from "next/navigation";

export const CachedChatPage = React.memo(() => {
  // 获取URL查询参数
  const searchParams = useSearchParams();
  const channelId = searchParams.get("channelId");

  // 记录当前频道ID
  console.log("CachedChatPage - 当前频道ID:", channelId);

  return (
    <div className="h-full w-full">
      <GlobalChat initialChannelId={channelId} />
    </div>
  );
});

CachedChatPage.displayName = "CachedChatPage";
