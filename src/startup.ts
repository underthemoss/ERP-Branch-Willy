import { MongoMemoryReplSet } from "mongodb-memory-server";

import mongoose from "mongoose";
import { MONGO_CONNECTION_STRING } from "./env/env";
// import { FolderEventStore } from "./event-store/FolderEventStore";

async function startInMemoryMongoDB() {
  if (MONGO_CONNECTION_STRING) {
    await mongoose.connect(MONGO_CONNECTION_STRING, {
      dbName: "es-erp",
    });
    console.log("Connected to atlas MongoDB");
  } else {
    console.log("💾 Starting in-memory MongoDB");
    const replset = await MongoMemoryReplSet.create({
      instanceOpts: [],
      replSet: { count: 1 },
    }); // make the count configurabel in env
    const uri = replset.getUri();

    await mongoose.connect(uri, {
      dbName: "es-erp",
    });
    console.log("Connected to in-memory MongoDB");
  }
}

export const startup = async () => {
  console.time("startup");
  await startInMemoryMongoDB();

  console.log("🚀 Start up complete");
  console.timeEnd("startup");
};
