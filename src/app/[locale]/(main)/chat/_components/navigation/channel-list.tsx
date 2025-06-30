"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ServerChannel } from "../server/server-channel";
import { Hash, Mic, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function ChannelList() {
  const [isPrivateExpanded, setIsPrivateExpanded] = useState(true);
  const officialChannels = useQuery(api.channels.list, { type: "official" });
  const privateChannels = useQuery(api.channels.list, { type: "private" });

  const getIcon = (type: string) => {
    switch (type) {
      case "text": return Hash;
      case "voice": return Mic;
      case "video": return Video;
      default: return Hash;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2">
          官方频道
        </h3>
        {officialChannels?.map((channel) => (
          <ServerChannel
            key={channel._id}
            channel={channel}
            icon={getIcon(channel.type)}
            isOfficial={true}
            isPrivate={false}
            isGroup={false}
            isPublic={true}
          />
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            私人频道
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPrivateExpanded(!isPrivateExpanded)}
          >
            {isPrivateExpanded ? "收起" : "展开"}
          </Button>
        </div>
        <div className={cn(
          "space-y-[2px] transition-all",
          !isPrivateExpanded && "hidden"
        )}>
          {privateChannels?.map((channel) => (
            <ServerChannel
              key={channel._id}
              channel={channel}
              icon={getIcon(channel.type)}
              isOfficial={false}
              isPrivate={true}
              isGroup={false}
              isPublic={true}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 