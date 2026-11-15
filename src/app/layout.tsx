import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import "@/styles/globals.css";
import { siteConfig } from "@/config/site";

const manrope = localFont({
  src: [
    {
      path: "../fonts/manrope-latin-var.woff2",
      weight: "200 800",
      style: "normal",
    },
  ],
  variable: "--font-manrope",
  display: "swap",
  preload: true,
  fallback: ["ui-sans-serif", "system-ui", "Segoe UI", "Roboto", "Arial", "sans-serif"],
  adjustFontFallback: "Arial",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Pixelise — AI Product Photography Studio",
    template: "%s | Pixelise",
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  formatDetection: { telephone: false, address: false, email: false },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    url: siteConfig.url,
    title: "Pixelise — AI Product Photography Studio",
    description: siteConfig.description,
    images: [
      {
        url: `${siteConfig.url}${siteConfig.socialImage}`,
        width: 1200,
        height: 630,
        alt: "Pixelise — AI product photography studio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pixelise — AI Product Photography Studio",
    description: siteConfig.description,
    images: [`${siteConfig.url}${siteConfig.socialImage}`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang={siteConfig.language} className={`${manrope.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-canvas text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
