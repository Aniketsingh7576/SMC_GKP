import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Keep development artifacts separate from production builds. Running
  // `next build` while the dev server is open can otherwise corrupt its cache.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  outputFileTracingRoot: process.cwd(),
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
  poweredByHeader: false,
  headers: async () => [{
    source: "/:path*",
    headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }
    ]
  }]
};

export default nextConfig;
