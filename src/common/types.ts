export type BusinessEvent<
  AggregateType extends string,
  EventType extends string,
  Payload,
> = {
  event_type: EventType;
  aggregate_id: string;
  payload: Payload;
  aggregate_type: AggregateType;
  sequence_number: number;
  timestamp: Date;
  tenant_id: string;
  principal_id: string;
  correlation_id: string;
};

export type CommandProcessor<
  Command,
  Ev extends BusinessEvent<string, string, any>,
  State,
> = {
  /**
   * Processes a command by validating it against business rules and generating a corresponding business event.
   * @param command
   * @param state
   * @param context
   * @returns A business event derived from the command and state, encapsulating the result of the validation and processing logic.
   */
  processCommand: (
    command: Command,
    state: State,
    context: Pick<
      Ev,
      | "aggregate_type"
      | "sequence_number"
      | "timestamp"
      | "tenant_id"
      | "principal_id"
      | "correlation_id"
    >
  ) => Ev;
  /**
   *  Applies a given event to the current state and returns the updated state.
   * @param currentState
   * @param event
   * @returns The updated state after applying the event.
   */
  processEvent: (currentState: State, event: Ev) => State;
  /**
   * Retrieves the initial state of the aggregate. This is typically used when no events have been applied yet.
   * @returns The initial state of the aggregate.
   */
  getInitialState: () => State;
  /**
   * Retrieves the type of aggregate this processor is responsible for.
   *
   * @returns A string representing the aggregate type.
   */
  getAggregateType: () => string;
};

export type CommandRunner<
  Command,
  Ev extends BusinessEvent<string, string, any>,
  State,
> = (
  command: Command,
  processor: CommandProcessor<Command, Ev, State>
) => Promise<State>;
