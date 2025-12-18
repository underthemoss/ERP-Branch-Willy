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

  // Exclude browser-tabs-lock and auth0 packages from SSR bundling
  // These packages access localStorage at module load time which breaks SSR
  serverExternalPackages: ["browser-tabs-lock"],
};

export default nextConfig;
