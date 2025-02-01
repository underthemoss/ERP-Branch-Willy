import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/es-erp",
  assetPrefix: "/es-erp/",
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },

  reactStrictMode: false,
};

export default nextConfig;
