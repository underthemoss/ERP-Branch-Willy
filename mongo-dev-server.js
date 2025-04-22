const { MongoMemoryReplSet } = require("mongodb-memory-server");

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
