import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface ChatPublicPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function ChatPublicPage({ params }: ChatPublicPageProps) {
  const { locale } = await params;
  redirect(`/${locale}/projects`);
}
