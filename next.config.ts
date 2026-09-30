import type { NextConfig } from "next";

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  fallbacks: {
    document: "/_offline",
  },
  runtimeCaching: [
    // Same-origin static assets only — never cache Supabase or other API hosts
    {
      urlPattern: ({
        request,
        sameOrigin,
      }: {
        request: Request;
        sameOrigin: boolean;
      }) =>
        sameOrigin &&
        ["style", "script", "image", "font"].includes(request.destination),
      handler: "CacheFirst",
      options: {
        cacheName: "static-assets",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: ({ sameOrigin, url }: { sameOrigin: boolean; url: URL }) =>
        sameOrigin && !url.pathname.startsWith("/api/"),
      handler: "NetworkFirst",
      options: {
        cacheName: "same-origin-pages",
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60,
        },
      },
    },
  ],
  cacheOnFrontEndNav: true,
  reloadOnOnline: false,
});

const nextConfig: NextConfig = {};

export default withPWA(nextConfig);
