import { ulid } from "ulid";
import { createWriteModel } from "./shared/createWriteModel";

export type FolderCommands =
  | { type: "create_folder"; name: string }
  | { type: "rename_folder"; name: string; _id: string };

export type FolderState = { _id: string; name: string };

export const folderWriteModel = createWriteModel<FolderState, FolderCommands>({
  entityName: "Folder",
  commands: {
    create_folder: async (command, model) => {
      const folder = new model({
        _id: ulid(),
        name: command.name,
      } satisfies FolderState);
      return await folder.save();
    },
    rename_folder: async (command, model) => {
      await model.updateOne({ _id: command._id }, { name: command.name });
      return (await model.findById(command._id))!;
    },
  },
});
