// import { EventStoreModel } from "../common/EventStore";
import { Kafka } from "kafkajs";
export const folderProjection = async (broker: string) => {
  // const kafka = new Kafka({
  //   clientId: "es-erp",
  //   brokers: [broker],
  // });

  // const producer = kafka.producer();
  // await producer.connect();
  // const eventStream = EventStoreModel.watch([], {
  //   fullDocument: "updateLookup",
  //   batchSize: 1000,
  // });

  // eventStream.on("change", async (change) => {
  //   const event = change.fullDocument;
  //   console.log(event);
  //   await producer.send({
  //     topic: "es-erp-event-store",
  //     messages: [{ key: event.aggregate_id, value: JSON.stringify(event) }],
  //   });
  // });

  // const consumer = kafka.consumer({ groupId: "es-erp" });
  // await consumer.connect();
  // await consumer.subscribe({
  //   topic: "es-erp-event-store",
  //   fromBeginning: true,
  // });
  // await consumer.run({
  //   eachMessage: async (msg) => {
  //     if (msg.message?.value) {
  //       const event = JSON.parse(msg.message.value.toString());
  //       console.log(event);
  //     }
  //   },
  // });
  // return async () => {
  //   console.log("SIGTERM publisher");
  //   await consumer.stop();
  //   await eventStream.close();
  // };
};
