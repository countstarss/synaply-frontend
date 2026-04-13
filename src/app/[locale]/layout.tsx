import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { IBM_Plex_Mono, Manrope } from "next/font/google";

import { routing } from "@/i18n/routing";
import "@/app/globals.css";
import AppProvider from "@/providers/app-provider";
import { Toaster } from "@/components/ui/sonner"; // 导入 Toaster
import {
  getBaseSiteMetadata,
  normalizeSiteLocale,
} from "@/lib/seo";

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  weight: ["400", "500", "600"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return getBaseSiteMetadata(normalizeSiteLocale(locale));
}

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
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${sans.variable} ${mono.variable}`}
    >
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
      <body className="bg-background font-sans text-foreground antialiased">
        <AppProvider>{children}</AppProvider>
        <Toaster position="top-right" richColors /> {/* 添加 Toaster 组件 */}
      </body>
    </html>
  );
}
