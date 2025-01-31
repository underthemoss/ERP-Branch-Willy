export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./system/upsertSystemTypes");
    await import("./system/upsertIndexes");
    // await import("./system/assetDataSync");
    // await import("./system/testWorkspace");
  }

  console.log("🚀 Start up successful");
}
