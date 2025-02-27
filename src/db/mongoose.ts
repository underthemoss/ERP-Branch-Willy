import mongoose, { Model, model, Schema } from "mongoose";

import { ContentTypeDataModel } from "../model/ContentTypes.generated";
import { ulid } from "ulid";

const contentSchema = new Schema<ContentTypeDataModel>({
  _id: { type: String, required: true },
  type: { type: String, required: true },
  parent_id: { type: String, required: false },
  data: { type: Object, required: true },
  tenant_id: { type: String, required: true },
});

const createModel = () => {
  return model<ContentTypeDataModel>("Entity", contentSchema);
};

export const Entity =
  (mongoose.models?.Entity as ReturnType<typeof createModel>) || createModel();

export const mongodbConnect = async () => {
  await mongoose.connect(process.env.DATABASE_URL || "");
  const item = await new Entity({
    _id: ulid(),
    parent_id: "",
    // type: "collection_asset",
    type: "collection_asset",
    data: {
      created_by: "ady",
      name: "Assets",
    },
    tenant_id: "1854",
  }).save();
};
