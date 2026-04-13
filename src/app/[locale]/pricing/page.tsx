import type { Metadata } from "next";

import PricingPageClient from "@/components/marketing/pages/pricing-page-client";
import { JsonLd } from "@/components/seo/json-ld";
import {
  MARKETING_PAGE_PATHS,
  getMarketingSeoContent,
} from "@/lib/marketing-seo";
import {
  buildBreadcrumbStructuredData,
  buildOrganizationStructuredData,
  buildPageMetadata,
  buildSoftwareApplicationStructuredData,
  buildWebsiteStructuredData,
  normalizeSiteLocale,
} from "@/lib/seo";

interface PricingPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PricingPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeSiteLocale(rawLocale);
  const seo = getMarketingSeoContent("pricing", locale);

  return buildPageMetadata({
    locale,
    path: MARKETING_PAGE_PATHS.pricing,
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
  });
}

export default async function PricingPage({ params }: PricingPageProps) {
  const { locale: rawLocale } = await params;
  const locale = normalizeSiteLocale(rawLocale);
  const seo = getMarketingSeoContent("pricing", locale);
  const homeLabel = locale === "zh" ? "首页" : "Home";
  const offers =
    locale === "zh"
      ? [
          {
            name: "Launch",
            description: "适合 3-8 人团队，以更低摩擦的方式建立统一协作节奏。",
            price: "9",
            priceCurrency: "USD",
          },
          {
            name: "Team",
            description: "适合 5-15 人跨角色团队，用更完整的流程与交接支持稳定推进。",
            price: "19",
            priceCurrency: "USD",
          },
        ]
      : [
          {
            name: "Launch",
            description:
              "For 3-8 person teams establishing a calmer remote collaboration rhythm.",
            price: "9",
            priceCurrency: "USD",
          },
          {
            name: "Team",
            description:
              "For 5-15 person cross-functional teams that need steadier handoffs and execution.",
            price: "19",
            priceCurrency: "USD",
          },
        ];

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
            path: MARKETING_PAGE_PATHS.pricing,
            description: seo.description,
            offers,
          }),
          buildBreadcrumbStructuredData({
            locale,
            items: [
              { name: homeLabel, path: MARKETING_PAGE_PATHS.landing },
              { name: seo.breadcrumbLabel, path: MARKETING_PAGE_PATHS.pricing },
            ],
          }),
        ]}
      />
      <PricingPageClient locale={locale} />
    </>
  );
}
