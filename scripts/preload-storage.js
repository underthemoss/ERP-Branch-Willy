// Preload script to polyfill localStorage for SSR
// This runs BEFORE any modules are loaded

// Node.js v25+ has a localStorage object {} but WITHOUT methods like getItem!
// We need to check if localStorage.getItem is a function, not just if localStorage exists
if (typeof globalThis.localStorage?.getItem !== "function") {
  const mockStorage = {};
  globalThis.localStorage = {
    getItem: (key) => mockStorage[key] ?? null,
    setItem: (key, value) => {
      mockStorage[key] = String(value);
    },
    removeItem: (key) => {
      delete mockStorage[key];
    },
    clear: () => {
      Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    },
    key: (index) => Object.keys(mockStorage)[index] ?? null,
    get length() {
      return Object.keys(mockStorage).length;
    },
  };
  console.log("📦 localStorage polyfill installed for SSR (Node.js v25+ fix)");
}
