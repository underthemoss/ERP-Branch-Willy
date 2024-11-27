import mongoose, { Schema } from "mongoose";
import { FolderState, folderWriteModel } from "./folder.model";
import { resumeTokensModel } from "./resume-tokens.model";
import { agenda } from "../jobs/agenda";

const itemsModel = mongoose.model(
  "items",
  new Schema(
    {
      _id: {
        type: "string",
      },
    },
    { strict: false, collection: "items_read" }
  )
);

const watchWithResumeToken = (token: any) => {};

export const itemMaterializer = async () => {
//   agenda.define("materialize", async (d: Job<{ name: string }>) => {
//     console.log("mmmmmm", d.attrs.data);
//     if (Math.random() > 0.2) {
//       console.log("nope");
//       throw "nope";
//     }
//   });
};
