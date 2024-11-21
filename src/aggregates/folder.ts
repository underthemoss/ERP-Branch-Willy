import { ulid } from "ulid";
import { CommandProcessor } from "../common/types";
import { BusinessEvent } from "../common/types";

export type FolderState = {
  name: string;
  folder_id: string;
};

export type FolderEvent =
  | BusinessEvent<"folder", "folder_created", { name: string }>
  | BusinessEvent<"folder", "folder_renamed", { name: string }>;

export type FolderCommand =
  | {
      type: "create_folder";
      name: string;
    }
  | {
      type: "rename_folder";
      folderId: string;
      name: string;
    };

export const folderCommandProcessor: CommandProcessor<
  FolderCommand,
  FolderEvent,
  FolderState
> = {
  processCommand(command, state, context): FolderEvent {
    if (!command.name.trim()) throw Error("Folder must have a name");
    switch (command.type) {
      case "create_folder":
        if (state.folder_id) throw Error("Folder already created");
        return {
          ...context,
          event_type: "folder_created",
          aggregate_id: ulid(),
          payload: { name: command.name.trim() },
        };
      case "rename_folder":
        return {
          ...context,
          event_type: "folder_renamed",
          aggregate_id: command.folderId,
          payload: {
            name: command.name.trim(),
          },
        };
    }
  },
  processEvent(state, event): FolderState {
    switch (event.event_type) {
      case "folder_created": {
        return {
          ...state,
          folder_id: event.aggregate_id,
          name: event.payload.name,
        };
      }
      case "folder_renamed": {
        return {
          ...state,
          name: event.payload.name,
        };
      }
    }
  },
  getInitialState() {
    return {
      name: "",
      folder_id: "",
    };
  },
  getAggregateType() {
    return "folder";
  },
};
