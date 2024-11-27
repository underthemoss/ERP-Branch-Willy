import { ulid } from "ulid";
import { createWriteModel } from "./shared/createWriteModel";

export type FolderCommands =
  | { type: "create_folder"; name: string; parent_id: string }
  | { type: "rename_folder"; _id: string; name: string };

export type FolderState = {
  _id: string;
  folder_name: string;
  created_by: string;
  updated_by: string;
  tenant_id: string;
  parent_id: string;
};

export const folderWriteModel = createWriteModel<FolderState, FolderCommands>({
  collectionName: "folders_write",
  commands: {
    create_folder: async ({ command, create, ctx }) => {
      return await create({
        _id: ulid(),
        folder_name: command.name,
        created_by: ctx.user_id,
        tenant_id: ctx.company_id,
        parent_id: command.parent_id,
        updated_by: ctx.user_id,
      });
    },
    rename_folder: async ({ command, update, ctx }) => {
      return await update(command._id, {
        folder_name: command.name,
        updated_by: ctx.user_id,
      });
    },
  },
});
