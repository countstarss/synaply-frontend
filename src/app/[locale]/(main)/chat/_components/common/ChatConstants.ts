import { Channel } from "@/types/convex/channel";
import { Id } from "@/convex/_generated/dataModel";

// 固定频道数据
export const FIXED_CHANNELS: Channel[] = [
  // 可以添加更多频道
];

// 模拟的最近聊天用户
export const MOCK_RECENT_USERS = Array.from({ length: 5 }, (_, i) => ({
  id: `user-${i}`,
  username: `用户 ${i + 1}`,
  avatarUrl: `https://avatar.vercel.sh/${i}`,
  isOnline: Math.random() > 0.5, // 随机在线状态
}));

// 公共频道配置
export const PUBLIC_CHANNEL: Channel = {
  _id: "/" as Id<"channels">,
  name: "Public",
  type: "text",
  isOfficial: true,
  createdAt: Date.now(),
};
