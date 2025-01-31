process.env.DATABASE_URL =
  "mongodb://127.0.0.1:63878/es-erp?replicaSet=testset";
import { MongoMemoryReplSet } from "mongodb-memory-server";
const main = async () => {
  const replset = await MongoMemoryReplSet.create({
    instanceOpts: [
      {
        port: 63878,
      },
    ],
    replSet: { count: 1 },
  });
  const uri = replset.getUri();
  console.log(`🚀 Mongodb running at ${uri}`);
};

main();
