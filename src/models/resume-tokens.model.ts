import mongoose, { Schema } from "mongoose";
import { FolderState, folderWriteModel } from "./folder.model";

export const resumeTokensModel = mongoose.model(
  "resume-tokens",
  new Schema(
    {
      _id: {
        type: "string",
      },
    },
    { strict: false, collection: "resume-tokens" }
  )
);
