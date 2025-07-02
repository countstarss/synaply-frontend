export const dynamic = "force-dynamic";

export default function DashboardPage() {
  // 返回null，因为实际的Dashboard界面由GlobalPageCache组件管理
  // GlobalPageCache会根据路径自动显示对应的缓存页面
  return (
    <div>
      <h1>Dashboard</h1>
    </div>
  );
}
