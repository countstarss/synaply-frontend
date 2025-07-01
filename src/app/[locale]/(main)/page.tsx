import { redirect } from "next/navigation";

// 默认重定向到任务页面
export default function MainPage() {
  redirect("/tasks");
}
