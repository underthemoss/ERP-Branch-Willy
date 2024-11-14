import { MongoMemoryReplSet } from "mongodb-memory-server";

import mongoose from "mongoose";

async function startInMemoryMongoDB() {
  console.log("💾 Starting in-memory MongoDB");
  const replset = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
  }); // make the count configurabel in env
  const uri = replset.getUri();

  await mongoose.connect(uri, {});
  console.log("Connected to in-memory MongoDB");
}

export const startup = async () => {
  console.time("startup");
  await startInMemoryMongoDB();
  await Promise.all([]);

  console.log("🚀 Start up complete");
  console.timeEnd("startup");
};
