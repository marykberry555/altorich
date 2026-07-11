import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet, noimageindex, max-image-preview:none, max-snippet:0" }
];

const pwaHeaders = [
  { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
  { key: "Service-Worker-Allowed", value: "/" }
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Shared hosting (CloudLinux/cPanel) hits EAGAIN if Next spawns many workers.
  experimental: {
    workerThreads: false,
    cpus: 1
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      { source: "/sw.js", headers: pwaHeaders },
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "CDN-Cache-Control", value: "public, max-age=31536000, immutable" }
        ]
      },
      {
        source: "/((?!_next/static).*)",
        headers: [
          { key: "Cache-Control", value: "private, no-cache, no-store, max-age=0, must-revalidate" },
          { key: "CDN-Cache-Control", value: "no-store" }
        ]
      },
      { source: "/site.webmanifest", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }] },
      { source: "/download", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }] },
      { source: "/.well-known/assetlinks.json", headers: [{ key: "Content-Type", value: "application/json" }] }
    ];
  },
  async redirects() {
    return [
      { source: "/recharge", destination: "/deposits", permanent: true },
      { source: "/invest", destination: "/investments", permanent: true },
      { source: "/withdraw", destination: "/withdrawals", permanent: true },
      { source: "/products", destination: "/packages/starter", permanent: true },
      { source: "/products/:slug", destination: "/packages/:slug", permanent: true },
      { source: "/solutions/plans/alto-starter", destination: "/packages/starter", permanent: true },
      { source: "/solutions/plans/alto-growth", destination: "/packages/growth", permanent: true },
      { source: "/solutions/plans/alto-premium", destination: "/packages/premium", permanent: true },
      { source: "/solutions/plans/alto-elite", destination: "/packages/elite", permanent: true },
      { source: "/solutions/plans/tier-1", destination: "/packages/starter", permanent: true },
      { source: "/solutions/plans/tier-2", destination: "/packages/growth", permanent: true },
      { source: "/solutions/plans/tier-3", destination: "/packages/premium", permanent: true },
      { source: "/solutions/plans/tier-4", destination: "/packages/elite", permanent: true },
      { source: "/solutions/plans", destination: "/packages", permanent: true },
      { source: "/solutions/plans/:slug", destination: "/packages/:slug", permanent: true },
      { source: "/solutions/savings", destination: "/packages/starter", permanent: true },
      { source: "/solutions/sme", destination: "/packages/growth", permanent: true },
      { source: "/solutions/agriculture", destination: "/packages/growth", permanent: true },
      { source: "/solutions/property", destination: "/packages/premium", permanent: true },
      { source: "/solutions/business-funding", destination: "/packages/elite", permanent: true },
      { source: "/solutions/:path*", destination: "/packages", permanent: true },
      { source: "/about/story", destination: "/about", permanent: true },
      { source: "/about/leadership", destination: "/about", permanent: true },
      { source: "/about/mission", destination: "/about", permanent: true },
      { source: "/careers", destination: "/contact", permanent: true },
      { source: "/news", destination: "/about", permanent: true },
      { source: "/blog", destination: "/learn", permanent: true },
      { source: "/learn/investment-guide", destination: "/learn", permanent: true },
      { source: "/learn/help", destination: "/learn/faq", permanent: true },
      { source: "/partner", destination: "/contact", permanent: true },
      { source: "/referral", destination: "/auth/register", permanent: true },
      { source: "/referrals", destination: "/team", permanent: true },
      { source: "/funding", destination: "/deposits", permanent: true }
    ];
  }
};

export default nextConfig;
