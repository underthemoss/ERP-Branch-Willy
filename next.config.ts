import type { NextConfig } from "next";

import { startup } from "./src/startup";

const nextConfig: NextConfig = {
  basePath: "/resource-planning",
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
  reactStrictMode: false,
};

startup()
  .then(() => {
    console.log("🚀 Start up successful");
  })
  .catch((err) => console.log("💥", err));

export default nextConfig;
