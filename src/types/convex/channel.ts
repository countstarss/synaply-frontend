import { Id } from "@/convex/_generated/dataModel";

export type ChannelType = "text" | "voice" | "video";
export type MessageType = "public" | "private" | "group";

export interface Channel {
  _id: Id<"channels">;
  name: string;
  type: ChannelType;
  isOfficial: boolean;
  creatorId?: string;
  members?: string[];
  createdAt: number;
}

export interface Message {
  _id: Id<"messages">;
  content: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  channelId: string;
  type: MessageType;
  createdAt: number;
} 