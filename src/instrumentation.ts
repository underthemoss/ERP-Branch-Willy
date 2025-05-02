export async function register() {
  // not running on the "edge" - never happens, this just surpresses a build time error
  if (process.env.NEXT_RUNTIME === "nodejs") {
  }

  console.log("🚀 Start up successful");
}
