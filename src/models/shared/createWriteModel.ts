import mongoose, { Schema, Document, Model } from "mongoose";
import { ulid } from "ulid";
import { agenda } from "../../jobs/agenda";

type CommandBase = { type: string };
type StateBase = { _id: string };

type CommandContext = {
  user_id: string;
  company_id: string;
};

export const createWriteModel = <
  State extends StateBase,
  Commands extends CommandBase,
>(props: {
  collectionName: string;
  commands: {
    [Command in Commands["type"]]: (props: {
      command: Extract<Commands, { type: Command }>;
      model: Model<State>;
      ctx: CommandContext;
      create: (doc: State) => Promise<State>;
      update: (id: string, doc: Partial<State>) => Promise<State>;
      read: (id: string) => Promise<State>;
    }) => Promise<State>;
  };
}) => {
  const model = mongoose.model<State>(
    props.collectionName,
    new Schema<State>(
      {
        _id: {
          type: "string",
        },
      },
      { strict: false, collection: props.collectionName }
    )
  );

  return {
    model: model,
    collectionName: props.collectionName,
    context: (ctx: CommandContext) => {
      return {
        apply: async (command: Extract<Commands, { type: string }>) => {
          const session = await model.startSession();
          session.startTransaction();
          try {
            const func = props.commands[command.type as Commands["type"]];
            const doc = await func({
              command,
              model,
              ctx,
              create: async (doc) => {
                const folder = new model(doc);
                return (await folder.save({ session })) as State;
              },
              read: async (id) => {
                const data = await model.findById(id, { session });
                if (!data) throw "Not found";
                return data;
              },
              update: async (id, doc) => {
                await model.updateOne({ _id: id }, doc, { session });
                const data = await model.findById(id, { session });
                if (!data) throw "Not found";
                return data;
              },
            });
            return doc;
          } catch (err) {
            session.abortTransaction();
            throw err;
          } finally {
            await session.commitTransaction();
          }
        },
      };
    },
  };
};
