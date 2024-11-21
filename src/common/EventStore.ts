import mongoose, { ClientSession, Schema } from "mongoose";
import { BusinessEvent } from "./types";
import { ulid } from "ulid";

const schema = new Schema<BusinessEvent<any, any, any> & { _id: string }>({
  _id: {
    type: String,
    required: true,
  },
  event_type: {
    type: String,
    required: true,
  },
  aggregate_id: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
  },
  payload: {
    type: Schema.Types.Mixed,
    required: false,
  },
  aggregate_type: {
    type: String,
    required: true,
  },
  sequence_number: {
    type: Number,
    required: true,
  },
  principal_id: {
    type: String,
    required: true,
  },
  tenant_id: {
    type: String,
    required: true,
  },
  correlation_id: {
    type: String,
    required: true,
  },
});
schema.index({ aggregate_id: 1, sequence_number: 1 }, { unique: true });
export const EventStoreModel = mongoose.model("event-store", schema);

export class EventStore {
  static async getAggregateEvents<T>(aggregateId: string) {
    if (!aggregateId) return [];
    return EventStoreModel.find({
      aggregate_id: aggregateId,
    }).lean() as unknown as T[];
  }

  static async appendEvent<T extends BusinessEvent<string, string, unknown>>(
    event: T
  ) {
    return EventStoreModel.create({
      _id: ulid(),
      ...event,
    });
  }

  static async init() {
    try {
      await EventStoreModel.init();
      await EventStoreModel.createIndexes();
      await EventStoreModel.ensureIndexes();
      await EventStoreModel.syncIndexes();
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}
