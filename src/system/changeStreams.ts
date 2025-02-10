import { Collection, Document, MongoClient } from "mongodb";
import { pulse } from "./pulse";
import { Entity } from "../../prisma/generated/mongo";
import { dispatchRecalculateJob } from "./jobs/jobs";

const client = new MongoClient(process.env.DATABASE_URL!);
export const mongodbClient = client.db("es-erp");
const changeStream = async (stream: Collection<Document>) => {
  for await (const change of stream.watch([], {})) {
    const item_id = (change as any).documentKey._id;
    // await dispatchRecalculateJob(item_id).catch(console.log);
  }
};

export const changeStreams = async () => {
  try {
    const entityStream = mongodbClient.collection("Entity");
    changeStream(entityStream).catch((err) => {
      console.log(err);
      client.close();
    });
  } catch (err) {
    console.log(err);
  }
};
