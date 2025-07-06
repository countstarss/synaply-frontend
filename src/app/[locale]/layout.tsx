import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import "@/app/globals.css";
import AppProvider from "@/providers/app-provider";
import { Toaster } from "@/components/ui/sonner"; // 导入 Toaster

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // 等待 params 解析
  const { locale } = await params;

  // 验证 locale 是否有效
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('synaply-theme') || 'light';
                document.documentElement.classList.toggle('dark', theme === 'dark');
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>
        <AppProvider>{children}</AppProvider>
        <Toaster position="top-right" richColors /> {/* 添加 Toaster 组件 */}
      </body>
    </html>
  );
}
