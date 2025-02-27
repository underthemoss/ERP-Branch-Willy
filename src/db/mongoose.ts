import mongoose, { Model, model, Schema } from "mongoose";

import {
  ContentTypeDataModel,
  ContentTypeViewModel,
  ContentTypeViewModelKeyed,
} from "./ContentTypes.generated";

interface ContentTypeDataModelExtended extends Model<ContentTypeDataModel> {
  getContentTypes(): number;
}

const contentSchema = new Schema<ContentTypeDataModel>(
  {
    _id: { type: String, required: true },
    type: { type: String, required: true },
    parent_id: { type: String, required: true },
    data: { type: Object, required: true },
    tenant_id: { type: String, required: true },
  },
  {
    statics: {
      getContentTypes() {
        return ContentTypeViewModel;
      },
    },
  }
);

const Content = model<ContentTypeDataModel, ContentTypeDataModelExtended>(
  "Content",
  contentSchema
);

export const mongodb = async () => {
  await mongoose.connect(process.env.DATABASE_URL || "");
  const content2 = await Content.findById("");
  console.log(Content.getContentTypes());
  if (content2?.type === "workspace") {
    const contenttype = ContentTypeViewModelKeyed[content2.type];
  }
  const content = new Content({
    _id: "test",
    type: "workspace",
    data: {
      created_by: "",
      name: "",
    },
    parent_id: "123",
    tenant_id: "1854",
  } satisfies ContentTypeDataModel);

  //   ContentTypesConfig["magic_folder"].validate(data);
  await content.save();
};
