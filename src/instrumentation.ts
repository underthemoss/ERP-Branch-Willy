// Polyfill localStorage for SSR - browser-tabs-lock (used by @auth0/auth0-react)
// accesses localStorage at module load time which breaks SSR
// Node.js v25+ has a localStorage object {} but WITHOUT methods like getItem!
if (typeof globalThis.localStorage?.getItem !== "function") {
  const mockStorage: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => mockStorage[key] ?? null,
    setItem: (key: string, value: string) => {
      mockStorage[key] = value;
    },
    removeItem: (key: string) => {
      delete mockStorage[key];
    },
    clear: () => {
      Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    },
    key: (index: number) => Object.keys(mockStorage)[index] ?? null,
    get length() {
      return Object.keys(mockStorage).length;
    },
  };
}

export async function register() {
  // not running on the "edge" - never happens, this just surpresses a build time error
  if (process.env.NEXT_RUNTIME === "nodejs") {
  }

  console.log("🚀 Start up successful");
}
