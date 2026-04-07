// Chat Layout现在由GlobalChat全局管理
// 这个layout只是为了保持路由结构，实际渲染在GlobalChat中

interface LayoutProps {
  children: React.ReactNode;
}

export default function ChatLayout({ children }: LayoutProps) {
  // 返回children，但实际上Chat的UI由GlobalChat管理
  // 这里主要是为了保持Next.js的路由结构
  return <>{children}</>;
}
