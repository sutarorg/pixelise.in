import type { Metadata } from "next";

import { siteConfig } from "@/config/site";

type PageMetadataInput = {
  /** Page title without the brand suffix — the root template adds "| Pixelise". */
  title: string;
  description: string;
  /** Route path, e.g. "/pricing". Used for the canonical URL. */
  path: string;
  keywords?: readonly string[];
  noIndex?: boolean;
  /** Skip the root title template (used for the homepage). */
  absoluteTitle?: boolean;
};

/**
 * Builds a complete metadata block for an indexable marketing page:
 * unique title, unique description, canonical URL and matching social tags.
 */
export function pageMetadata({
  title,
  description,
  path,
  keywords,
  noIndex = false,
  absoluteTitle = false,
}: PageMetadataInput): Metadata {
  const url = path === "/" ? siteConfig.url : `${siteConfig.url}${path}`;
  const socialImage = {
    url: `${siteConfig.url}${siteConfig.socialImage}`,
    width: 1200,
    height: 630,
    alt: "Pixelise — AI product photography studio",
  };

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    ...(keywords ? { keywords: [...keywords] } : {}),
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage.url],
    },
    ...(noIndex
      ? { robots: { index: false, follow: false } }
      : {
          robots: {
            index: true,
            follow: true,
            googleBot: {
              index: true,
              follow: true,
              "max-image-preview": "large" as const,
              "max-snippet": -1,
              "max-video-preview": -1,
            },
          },
        }),
  };
}
