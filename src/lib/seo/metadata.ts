import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { absoluteUrl } from "@/config/seo";

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
  /** Open Graph object type. Articles use "article". */
  type?: "website" | "article";
  /** Per-page social image path (e.g. a blog cover). Defaults to the site card. */
  image?: { path: string; width: number; height: number; alt: string };
  /** ISO timestamps; only meaningful for articles. */
  publishedTime?: string;
  modifiedTime?: string;
};

const defaultSocialImage = {
  url: `${siteConfig.url}${siteConfig.socialImage}`,
  width: 1200,
  height: 630,
  alt: "Pixelise — AI product photography studio",
} as const;

/**
 * Builds a complete metadata block for an indexable page:
 * unique title, unique description, canonical URL and matching social tags.
 *
 * Every indexable page in the app goes through this helper so canonical, OG and
 * Twitter values cannot drift apart. See docs/seo/technical-seo-checklist.md.
 */
export function pageMetadata({
  title,
  description,
  path,
  keywords,
  noIndex = false,
  absoluteTitle = false,
  type = "website",
  image,
  publishedTime,
  modifiedTime,
}: PageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const socialImage = image
    ? {
        url: absoluteUrl(image.path),
        width: image.width,
        height: image.height,
        alt: image.alt,
      }
    : defaultSocialImage;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    ...(keywords ? { keywords: [...keywords] } : {}),
    alternates: { canonical: path },
    openGraph: {
      type,
      title,
      description,
      url,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      images: [socialImage],
      ...(type === "article"
        ? {
            ...(publishedTime ? { publishedTime } : {}),
            ...(modifiedTime ? { modifiedTime } : {}),
            authors: [siteConfig.name],
          }
        : {}),
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
