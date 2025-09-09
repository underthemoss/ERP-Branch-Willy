import { ReactNode } from "react";
import { GoogleMapsProvider } from "./GoogleMapsProvider";

interface GoogleMapsServerProviderProps {
  children: ReactNode;
}

export function GoogleMapsServerProvider({ children }: GoogleMapsServerProviderProps) {
  // This runs on the server and has access to server-side environment variables
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  return <GoogleMapsProvider apiKey={apiKey}>{children}</GoogleMapsProvider>;
}
