import { MongoMemoryReplSet } from "mongodb-memory-server-core";
import mongoose from "mongoose";

import { ulid } from "ulid";
import { EventStoreBase, EventType } from "./EventStoreBase";

jest.setTimeout(5_000);

// Using account balance event store as an example implementation to test
// that the behaviour of the event store is correct.
type BankAccountEvent =
  | EventType<"deposited", number>
  | EventType<"withdrawal", number>;

type BankAccountState = { balance: number; number_of_transactions: number };

class BankAccountEventStore extends EventStoreBase<
  BankAccountEvent,
  BankAccountState
> {
  constructor() {
    super({
      defaultState: { balance: 0, number_of_transactions: 0 },
      eventStoreId: "bank-account",
      context: {
        correlation_id: "",
        principal_id: "",
        tenant_id: "1854",
      },
    });
  }
  validate(
    state: BankAccountState,
    event: BankAccountEvent,
    prevState: BankAccountState
  ): void {
    if (event.type === "deposited" && event.payload <= 0) {
      throw new Error("Deposit amount must be greater than 0");
    }
    if (event.type === "withdrawal" && state.balance < 0) {
      throw new Error("Insufficient funds for withdrawal");
    }
  }
  reduce(state: BankAccountState, event: BankAccountEvent): BankAccountState {
    switch (event.type) {
      case "deposited":
        return {
          balance: state.balance + event.payload,
          number_of_transactions: state.number_of_transactions + 1,
        };
      case "withdrawal":
        return {
          balance: state.balance - event.payload,
          number_of_transactions: state.number_of_transactions + 1,
        };
    }
  }
}

describe("EventStore", () => {
  let replset: MongoMemoryReplSet;
  beforeAll(async () => {
    replset = await MongoMemoryReplSet.create({
      replSet: { count: 1 },
    });
    await mongoose.connect(replset.getUri(), {
      dbName: "es-erp",
    });
    await mongoose.connection.asPromise();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await replset.stop();
    await replset.cleanup();
  });

  test.concurrent("it applies events correctly", async () => {
    const aggregateId = ulid();
    const math = new BankAccountEventStore();
    await math.apply({ aggregateId, eventType: "deposited", payload: 10 });
    await math.apply({ aggregateId, eventType: "deposited", payload: 10 });
    const result = await math.apply({
      aggregateId,
      eventType: "deposited",
      payload: 10,
    });
    expect(result.balance).toBe(30);
    expect(result.number_of_transactions).toBe(3);
  });
  test.concurrent("it handles validation", async () => {
    const aggregateId = ulid();
    const math = new BankAccountEventStore();
    await math.apply({ aggregateId, eventType: "deposited", payload: 10 });
    await expect(
      math.apply({
        aggregateId,
        eventType: "deposited",
        payload: 0,
      })
    ).rejects.toThrow("Deposit amount must be greater than 0");

    await expect(
      math.apply({
        aggregateId,
        eventType: "withdrawal",
        payload: 11,
      })
    ).rejects.toThrow("Insufficient funds for withdrawal");
  });
  test.concurrent(
    "it manages optomistic concurrency race conditions - all events get a version number and explicit ordering",
    async () => {
      const aggregateId = ulid();
      const math = new BankAccountEventStore();
      await Promise.all(
        Array.from({ length: 80 }).map(async () => {
          await math.apply({ aggregateId, eventType: "deposited", payload: 1 });
        })
      );
      const events = await math.getEvents(aggregateId);
      expect(events.length).toBe(80);
      events.map((e, i) => {
        expect(e.version).toBe(i + 1);
      });
    }
  );
  test.concurrent("it accepts transactions", async () => {
    const id1 = ulid();
    const session = await mongoose.startSession();
    session.startTransaction();
    const math = new BankAccountEventStore();
    await math.apply({
      aggregateId: id1,
      eventType: "deposited",
      payload: 10,
      session,
    });
    await math.apply({
      aggregateId: id1,
      eventType: "deposited", // will
      payload: 5,
      session,
    });
    await math.apply({
      aggregateId: id1,
      eventType: "deposited",
      payload: 2,
      session,
    });
    // check there are no commited events
    expect(await math.getEvents(id1)).toHaveLength(0);
    // check uncommitted changes
    expect(await math.getEvents(id1, session)).toHaveLength(3);
    await session.commitTransaction();
    // check there are now commited events
    expect(await math.getEvents(id1)).toHaveLength(3);
  });
  test.concurrent(
    "it rejects based on pending data in a tansaction session",
    async () => {
      const id1 = ulid();
      const math = new BankAccountEventStore();
      // start with a balance of 10
      await math.apply({
        aggregateId: id1,
        eventType: "deposited",
        payload: 10,
      });

      const session = await mongoose.startSession();
      session.startTransaction();
      // transactionally attempt to go over drawn
      await math.apply({
        aggregateId: id1,
        eventType: "withdrawal",
        payload: 6,
        session,
      });
      expect(
        math.apply({
          aggregateId: id1,
          eventType: "withdrawal",
          payload: 6,
          session,
        })
      ).rejects.toThrow("Insufficient funds for withdrawal");
    }
  );
  test.concurrent(
    "handles concurrent operations and enforces account balance constraints",
    async () => {
      const id1 = ulid();
      const math = new BankAccountEventStore();
      // start with a balance of 10
      await math.apply({
        aggregateId: id1,
        eventType: "deposited",
        payload: 10,
      });

      const results = await Promise.allSettled(
        Array.from({ length: 11 }).map(() => {
          return math.apply({
            aggregateId: id1,
            eventType: "withdrawal",
            payload: 1,
          });
        })
      );
      expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(10);
      expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
    }
  );
});
