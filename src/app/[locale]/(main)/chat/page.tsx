// Chat页面现在由GlobalChat组件全局管理
// 这个页面作为路由占位符，实际内容在GlobalChat中渲染

export const dynamic = "force-dynamic";

export default function ChatPage() {
  // 返回null，因为实际的Chat界面由GlobalChat组件在主layout中管理
  // GlobalChat会根据路径自动显示Chat内容
  return null;
}
