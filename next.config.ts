import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/resource-planning",

  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },

  reactStrictMode: false,
};

export default nextConfig;
