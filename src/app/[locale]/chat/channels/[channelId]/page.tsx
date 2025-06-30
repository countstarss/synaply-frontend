"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Spinner } from "@/components/Spinner";
import { useParams } from "next/navigation";
import { ChatRoom } from "../../_components/chat/chat-room";

export default function ChannelPage() {
  const params = useParams();
  const channelId = params?.channelId as string;

  
  //MARK: 获取频道信息
  const channel = useQuery(api.channels.get, { 
    channelId: channelId
  });


  if (!channel) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-74px)]">
      <ChatRoom channelId={channelId} type="group" channel={channel} />
    </div>
  );
} 