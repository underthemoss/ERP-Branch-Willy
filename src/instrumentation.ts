export async function register() {
  // ie - not running on the "edge"
  if (process.env.NEXT_RUNTIME === "nodejs") {
    process.env.ESDB_CONNECTION_STRING = `postgresql://${process.env.ESDB_USER}:${process.env.ESDB_PASSWORD}@${process.env.ESDB_HOST}:${process.env.ESDB_PORT}/equipmentshare`;

    await import("./system/mongo-dev-server");
    await new Promise((res) => setTimeout(res, 5000));
    await import("./system/upsertSystemTypes");
    await import("./system/upsertIndexes");
    await import("./system/assetDataSync");
    // await import("./system/testWorkspace");
  }

  console.log("🚀 Start up successful");
}
