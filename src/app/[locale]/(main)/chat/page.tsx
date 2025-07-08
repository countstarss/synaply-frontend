"use client";

// Chat页面现在由GlobalChat组件全局管理
// 这个页面作为路由占位符，实际内容在GlobalChat中渲染
import { CachedChatPage } from "@/components/cache/pages/CachedChatPage";

export const dynamic = "force-dynamic";

export default function ChatPage() {
  // 返回CachedChatPage组件，它会使用GlobalChat
  return <CachedChatPage />;
}
