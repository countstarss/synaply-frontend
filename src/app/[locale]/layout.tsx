import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { routing } from '@/i18n/routing';
import { AuthProvider } from '@/context/AuthContext';
import '@/app/globals.css';
import { ConvexClientProvider } from '@/providers/convex-provider';

export default async function LocaleLayout({
  children,
  params
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
    <html lang={locale}>
      <body>
      <ConvexClientProvider>
        <NextIntlClientProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </NextIntlClientProvider>
      </ConvexClientProvider>
      </body>
    </html>
  );
} 