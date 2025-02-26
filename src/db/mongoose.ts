import mongoose, { model, Schema } from "mongoose";

import { ContentTypeDataModel } from "./ContentTypeDataModel";
import { ContentTypesConfig } from "./ContentTypeViewModel";

const contentSchema = new Schema<ContentTypeDataModel>({
  _id: { type: String, required: true },
  type: { type: String, required: true },
  parent_id: { type: String, required: true },
  data: { type: Object, required: true },
  tenant_id: { type: String, required: true },
});

const Content = model<ContentTypeDataModel>("Content", contentSchema);

export const mongodb = async () => {
  await mongoose.connect(process.env.DATABASE_URL || "");

  const content = new Content({
    _id: "test",
    type: "workspace",
    data: {
      created_by: "",
      title: "",
    },
    parent_id: "123",
    tenant_id: "1854",
  } satisfies ContentTypeDataModel);

  //   ContentTypesConfig["magic_folder"].validate(data);
  await content.save();
};
