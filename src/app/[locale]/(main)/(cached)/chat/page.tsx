import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface ChatPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { locale } = await params;
  redirect(`/${locale}/projects`);
}
