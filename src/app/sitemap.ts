import type { MetadataRoute } from "next";

import { MARKETING_PAGE_PATHS } from "@/lib/marketing-seo";
import { routing } from "@/i18n/routing";
import {
  absoluteUrl,
  getLocaleAlternates,
  getLocalizedPath,
} from "@/lib/seo";

const SITEMAP_DATE = new Date("2026-04-13T00:00:00.000Z");

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const path of Object.values(MARKETING_PAGE_PATHS)) {
    for (const locale of routing.locales) {
      entries.push({
        url: absoluteUrl(getLocalizedPath(path, locale)),
        lastModified: SITEMAP_DATE,
        changeFrequency: path === MARKETING_PAGE_PATHS.landing ? "weekly" : "monthly",
        priority: path === MARKETING_PAGE_PATHS.landing ? 1 : 0.8,
        alternates: {
          languages: getLocaleAlternates(path),
        },
      });
    }
  }

  return entries;
}
