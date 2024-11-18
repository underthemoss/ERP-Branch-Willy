import mongoose, { ClientSession, Schema } from "mongoose";
import { ulid } from "ulid";

import promiseRetry from "promise-retry";

export type EventType<TYPE = unknown, PAYLOAD = unknown> = {
  aggregateId: string;
  version: number;
  type: TYPE;
  timestamp: Date;
  payload: PAYLOAD;
  tenant_id: string;
  principal_id: string;
  correlation_id: string;
};

const schema = new Schema<EventType & { _id: string }>({
  _id: {
    type: String,
    required: true,
  },
  aggregateId: {
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
  type: {
    type: String,
    required: true,
  },
  version: {
    type: Number,
    required: true,
  },
  principal_id: {
    type: String,
    // required: true,
  },
  tenant_id: {
    type: String,
    // required: true,
  },
  correlation_id: {
    type: String,
    // required: true,
  },
});
schema.index({ aggregateId: 1, version: 1 }, { unique: true });

export abstract class EventStoreBase<TEvent extends EventType, TState> {
  constructor(
    private config: {
      eventStoreId: string;
      defaultState: TState;
      context: {
        correlation_id: string;
        principal_id: string;
        tenant_id: string;
      };
    }
  ) {}

  private async init() {
    await this.events.ensureIndexes();
  }

  private events = mongoose.model(this.config.eventStoreId, schema);

  async getEvents(aggregateId: string, session?: ClientSession) {
    await this.init();
    return await this.events
      .find({ aggregateId }, undefined, { session })
      .lean();
  }

  async apply<
    EventTypeIdentifier extends TEvent["type"],
    EV extends Extract<TEvent, { type: EventTypeIdentifier }>
  >(args: {
    aggregateId: string;
    eventType: EventTypeIdentifier;
    payload: EV["payload"];
    session?: ClientSession;
  }): Promise<TState> {
    await this.init();

    return await promiseRetry(
      async (retry, attempt) => {
        const { aggregateId, payload: event, eventType, session } = args;

        const events = await this.getEvents(aggregateId, session);

        const nextVersionNumber = (events[events.length - 1]?.version || 0) + 1;
        const candidateEvent = {
          payload: event,
          version: nextVersionNumber,
          timestamp: new Date(),
          aggregateId,
          type: eventType,
          principal_id: this.config.context.principal_id,
          tenant_id: this.config.context.tenant_id,
          correlation_id: this.config.context.correlation_id,
        } satisfies EventType as TEvent;

        const currentState = events.reduce(
          (state, event) => this.reduce(state, event as unknown as TEvent),
          this.config.defaultState
        );
        const nextState = this.reduce(currentState, candidateEvent);
        this.validate(nextState, candidateEvent, currentState);

        await new this.events({ _id: ulid(), ...candidateEvent })
          .save({ session })
          .catch((err) => {
            retry(err);
          });

        return nextState;
      },
      {
        factor: 1.2,
        randomize: true,
        minTimeout: 100,
        maxRetryTime: 15_000,
        retries: 5,
      }
    );
  }

  abstract validate(state: TState, event: TEvent, prevState: TState): void;
  abstract reduce(state: TState, event: TEvent): TState;
}
