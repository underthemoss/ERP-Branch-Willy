export async function register() {
  // not running on the "edge" - never happens, this just surpresses a build time error
  if (process.env.NEXT_RUNTIME === "nodejs") {
    process.env.ESDB_CONNECTION_STRING = `postgresql://${process.env.ESDB_USER}:${process.env.ESDB_PASSWORD}@${process.env.ESDB_HOST}:${process.env.ESDB_PORT}/equipmentshare`;

    await import("./model/ContentTypes.codegen");

    await (await import("./system/mongo-dev-server")).run();
    await (await import("./system/changeStreams")).changeStreams();
    await (await import("./db/mongoose")).mongodbConnect();

    // await (await import("./system/updateSystem")).run();
    // await (await import("./system/updateSystem")).run();
    await (await import("./system/pulse")).run();

    // running twice to ensure idempotency

    // try {
    //   // await (await import("./system/setupTenants")).run();
    // } catch (err) {
    //   console.log(err);
    // }
    // try {
    //   await (await import("./system/syncUsers")).run();
    // } catch (err) {
    //   console.log(err);
    // }
    // try {
    //   await (await import("./system/syncAssets")).run();
    // } catch (err) {
    //   console.log(err);
    // }
    try {
      await (await import("./system/upsertIndexes")).run();
    } catch (err) {
      console.log(err);
    }

    // await import("./system/testWorkspace");
  }

  console.log("🚀 Start up successful");
}
