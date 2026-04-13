import type { Metadata } from "next";

import LandingPageClient from "@/components/marketing/pages/landing-page-client";
import { JsonLd } from "@/components/seo/json-ld";
import {
  MARKETING_PAGE_PATHS,
  getMarketingSeoContent,
} from "@/lib/marketing-seo";
import {
  buildOrganizationStructuredData,
  buildPageMetadata,
  buildSoftwareApplicationStructuredData,
  buildWebsiteStructuredData,
  normalizeSiteLocale,
} from "@/lib/seo";

interface LandingPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: LandingPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeSiteLocale(rawLocale);
  const seo = getMarketingSeoContent("landing", locale);

  return buildPageMetadata({
    locale,
    path: MARKETING_PAGE_PATHS.landing,
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
  });
}

export default async function LandingPage({ params }: LandingPageProps) {
  const { locale: rawLocale } = await params;
  const locale = normalizeSiteLocale(rawLocale);
  const seo = getMarketingSeoContent("landing", locale);

  return (
    <>
      <JsonLd
        data={[
          buildOrganizationStructuredData(),
          buildWebsiteStructuredData({
            locale,
            description: seo.description,
          }),
          buildSoftwareApplicationStructuredData({
            locale,
            path: MARKETING_PAGE_PATHS.landing,
            description: seo.description,
          }),
        ]}
      />
      <LandingPageClient locale={locale} />
    </>
  );
}
