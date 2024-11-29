import { MongoMemoryReplSet } from "mongodb-memory-server";

import mongoose from "mongoose";
import { MONGO_CONNECTION_STRING } from "./config/env";
import { folderProjection } from "./projections/folder";

import { exec } from "child_process";
import { KafkaContainer } from "@testcontainers/kafka";
import { Kafka } from "kafkajs";
import { agenda, startAgenda } from "./jobs/agenda";
import { itemMaterializer } from "./models/items.model";
// import { FolderEventStore } from "./event-store/FolderEventStore";

const isLocalDev = true; //!MONGO_CONNECTION_STRING;

async function connectMongo() {
  if (!isLocalDev) {
    await mongoose.connect(MONGO_CONNECTION_STRING!, {
      dbName: "es-erp",
    });
    console.log("Connected to atlas MongoDB");
    return {
      connectionString: MONGO_CONNECTION_STRING,
      cleanup: async () => {
        await mongoose.disconnect();
      },
    };
  } else {
    console.log("💾 Starting in-memory MongoDB");
    const replset = await MongoMemoryReplSet.create({
      instanceOpts: [
        {
          port: 63878,
        },
      ],
      replSet: { count: 1 },
    });
    const uri = replset.getUri();

    await mongoose.connect(uri, {
      dbName: "es-erp",
    });

    console.log(`Dev connection ${uri}`);
    await new Promise<void>((res) => {
      exec("npx prisma db push", {}, (err, msg) => {
        console.log(msg);
        res();
      });
    });

    return {
      connectionString: uri,
      cleanup: async () => {
        await mongoose.disconnect();
        await replset.stop();
        await replset.cleanup();
        console.log("mongo shutdown");
      },
    };
  }
}

const connectKafka = async () => {
  console.log("📪 Starting dev kafka");
  const kafkaContainer = await new KafkaContainer(
    "confluentinc/cp-kafka:7.5.0"
  ).start();

  const brokerAddress = `${kafkaContainer.getHost()}:${kafkaContainer.getMappedPort(
    9093
  )}`;

  console.log("📪 dev kafka:" + brokerAddress);

  console.log(`📪 dev kafka started ${brokerAddress}`);

  return {
    brokerAddress,
    cleanup: async () => {
      console.log("SIGTERM kafka");
      await kafkaContainer.stop();
    },
  };
};

export const startup = async () => {
  // return;
  console.time("startup");
  const { cleanup: cleanupMongo, connectionString } = await connectMongo();
  // const { brokerAddress, cleanup: cleanupKafka } = await connectKafka();

  // const cleanupStream = await folderProjection(brokerAddress);

  console.log("🚀 Start up complete");
  console.timeEnd("startup");
  await agenda.start();
  await startAgenda();
  // await itemMaterializer();
  async function graceful() {
    console.log("SIGTERM ");
    // await cleanupStream();
    await agenda.drain();
    await cleanupMongo();
    process.exit(0);
  }

  process.on("SIGTERM", graceful);
  process.on("SIGINT", graceful);
};
