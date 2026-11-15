import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Static-first: every public marketing route is prerendered. */
  cacheComponents: true,
  partialPrefetching: true,

  /* Do not advertise the framework. */
  poweredByHeader: false,

  images: {
    /* AVIF first (smallest), WebP fallback. Both are served by the optimiser. */
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 390, 640, 768, 828, 1024, 1200, 1440, 1920],
    imageSizes: [64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
