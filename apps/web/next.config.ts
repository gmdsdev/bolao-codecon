import type { NextConfig } from "next";

const apiServerUrl = (
  process.env.API_SERVER_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "")
).replace(/\/$/, "");

if (!apiServerUrl && process.env.NODE_ENV === "production") {
  throw new Error("API_SERVER_URL is required to proxy auth and API requests");
}

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  async rewrites() {
    if (!apiServerUrl) {
      return [];
    }

    return [
      {
        source: "/api/auth/:path*",
        destination: `${apiServerUrl}/api/auth/:path*`,
      },
      {
        source: "/trpc/:path*",
        destination: `${apiServerUrl}/trpc/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
