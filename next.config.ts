import type { NextConfig } from "next";

/** Served under https://your-domain/admin when reverse-proxied; keeps redirects on /admin/... */
const nextConfig: NextConfig = {
  basePath: "/admin",
  /** Hitting :3001/ directly (no nginx path) would 404 — send users to the app root. */
  async redirects() {
    return [
      {
        source: "/",
        destination: "/admin",
        permanent: false,
        basePath: false,
      },
    ];
  },
};

export default nextConfig;
