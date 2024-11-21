import { CommandProcessor, BusinessEvent } from "./types";
import { folderCommandProcessor } from "../aggregates/folder";
import { EventStore } from "./EventStore";
import promiseRetry from "promise-retry";

export const commandHandler = <
  Command,
  Event extends BusinessEvent<string, string, any>,
  State,
>(
  processor: CommandProcessor<Command, Event, State>,
  context: {
    correlation_id: string;
    principal_id: string;
    tenant_id: string;
  }
) => ({
  execute: async (aggregateId: string, command: Command) => {
    return promiseRetry(
      async (retry, attempt) => {
        const events = await EventStore.getAggregateEvents<Event>(aggregateId);

        const state = events.reduce(
          processor.processEvent,
          processor.getInitialState()
        );
        const nextEvent = processor.processCommand(command, state, {
          sequence_number: events.length + 1,
          timestamp: new Date(),
          aggregate_type: processor.getAggregateType(),
          ...context,
        });

        await EventStore.appendEvent(nextEvent).catch(retry);

        return processor.processEvent(state, nextEvent);
      },
      {
        factor: 1.2,
        randomize: true,
        minTimeout: 100,
        maxRetryTime: 15_000,
        retries: 5,
      }
    );
  },
});
