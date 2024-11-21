import { defaultEndpointsFactory } from "express-zod-api";
import { authMiddleware } from "../../middleware/AuthMiddleware";
import { ulid } from "ulid";
import {
  folderCommandSchema,
  folderStateSchema,
} from "./../../aggregates/generated/folder.zod";
import { commandHandler } from "../../common/commandHandler";
import { folderCommandProcessor } from "../../aggregates/folder";
const folderCommandsEndpoint = defaultEndpointsFactory
  .addMiddleware(authMiddleware)
  .build({
    method: "post",
    description: "Folder Commands",
    input: folderCommandSchema,
    output: folderStateSchema,
    handler: async ({ input, options }) => {
      const folderCommandHandler = commandHandler(folderCommandProcessor, {
        correlation_id: ulid(),
        principal_id: options.user.user_id,
        tenant_id: options.user.company_id,
      });
      return await folderCommandHandler.execute(input.folderId, input);
    },
  });

export const foldersRoutes = {
  folders: {
    command: folderCommandsEndpoint,
  },
};
