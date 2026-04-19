import type { NextConfig } from "next";

/** Served under https://your-domain/admin when reverse-proxied; keeps redirects on /admin/... */
const nextConfig: NextConfig = {
  basePath: "/admin",
};

export default nextConfig;
