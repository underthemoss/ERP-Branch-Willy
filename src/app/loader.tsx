// Empty loading file to prevent NextJS from showing default loading state
// All loading states are handled by AppContextResolver
export default function Loading() {
  // Return empty fragment instead of null to prevent NextJS default "Loading..." text
  return <></>;
}
