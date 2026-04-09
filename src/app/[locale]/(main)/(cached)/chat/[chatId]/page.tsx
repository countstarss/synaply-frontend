import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface ChatChannelPageProps {
  params: Promise<{
    locale: string;
    chatId: string;
  }>;
}

export default async function ChatChannelPage({
  params,
}: ChatChannelPageProps) {
  const { locale } = await params;
  redirect(`/${locale}/projects`);
}
