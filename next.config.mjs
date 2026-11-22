/** @type {import('next').NextConfig} */

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];
// Staff and firm-owner pages are never embedded anywhere: refuse framing.
const noFraming = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // next/image is not used, so no remote image hosts are allowed through the
  // /_next/image optimiser (it was "**", an open image proxy).
  experimental: { optimizePackageImports: ["framer-motion"] },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/admin", headers: noFraming },
      { source: "/admin/:path*", headers: noFraming },
      { source: "/dashboard", headers: noFraming },
      { source: "/dashboard/:path*", headers: noFraming },
    ];
  },
};
export default nextConfig;
