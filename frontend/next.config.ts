import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(process.cwd(), ".."),
  },
  images: {
    unoptimized: true, // Bypass SSRF protection for localhost images
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:4000/api/:path*",
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/dashboard/marketplace",
        destination: "/dashboard",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
