import type { NextConfig } from "next";

console.log(
  "NEXT_PUBLIC_AUTH0_DOMAIN at build:",
  process.env.NEXT_PUBLIC_AUTH0_DOMAIN,
);

const nextConfig: NextConfig = {
  basePath: "",
  assetPrefix: "",
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },

  reactStrictMode: false,
};

export default nextConfig;
