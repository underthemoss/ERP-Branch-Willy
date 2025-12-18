"use client";

import dynamic from "next/dynamic";

// Dynamically import the page content to avoid SSR issues with Auth0
const RootPageContent = dynamic(() => import("./RootPageContent"), {
  ssr: false,
  loading: () => null,
});

export default function Page() {
  return <RootPageContent />;
}
