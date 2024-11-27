import { defaultEndpointsFactory } from "express-zod-api";
import { authMiddleware } from "../../middleware/AuthMiddleware";
import {
  folderCommandsSchema,
  folderStateSchema,
} from "../../models/generated/folder.model.zod";

import { folderWriteModel } from "../../models/folder.model";

const folderCommandsEndpoint = defaultEndpointsFactory
  .addMiddleware(authMiddleware)
  .build({
    method: "post",
    description: "Folder Commands",
    input: folderCommandsSchema,
    output: folderStateSchema,
    handler: async ({ input, options }) => {
      return await folderWriteModel.apply(input);
    },
  });

export const foldersRoutes = {
  folders: {
    command: folderCommandsEndpoint,
  },
};
