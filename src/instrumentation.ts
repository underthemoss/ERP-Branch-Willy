export async function register() {
  // not running on the "edge" - never happens, this just surpresses a build time error
  if (process.env.NEXT_RUNTIME === "nodejs") {
    process.env.ESDB_CONNECTION_STRING = `postgresql://${process.env.ESDB_USER}:${process.env.ESDB_PASSWORD}@${process.env.ESDB_HOST}:${process.env.ESDB_PORT}/equipmentshare`;
  }

  console.log("🚀 Start up successful");
}
