import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "",
  assetPrefix: process.env.LEVEL === "dev" ? "" : "/es-erp/",
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },

  reactStrictMode: false,
};

export default nextConfig;
