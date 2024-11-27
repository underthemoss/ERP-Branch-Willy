import mongoose, { Schema, Document, Model } from "mongoose";

type CommandBase = { type: string };
type StateBase = { _id: string };

export const createWriteModel = <
  State extends StateBase,
  Commands extends CommandBase,
>(props: {
  entityName: string;
  commands: {
    [Command in Commands["type"]]: (
      command: Extract<Commands, { type: Command }>,
      model: Model<State>
    ) => Promise<State>;
  };
}) => {
  const model = mongoose.model<State>(
    props.entityName,
    new Schema<State>(
      {
        _id: {
          type: "string",
        },
      },
      { strict: false }
    )
  );
  return {
    apply: (command: Extract<Commands, { type: string }>) => {
      const func = props.commands[command.type as Commands["type"]];
      return func(command, model);
    },
  };
};
