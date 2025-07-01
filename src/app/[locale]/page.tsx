import { redirect } from "next/navigation";

// 默认重定向到main布局
export default function RootPage() {
  redirect("/main");
}
