import mongoose, { Model, model, Schema } from "mongoose";

import { ulid } from "ulid";
import { getUser } from "@/lib/auth";
import { ContentTypeDataModel } from "@/types/generated/content-types";
import { UniversalQuery } from "@/lib/UniversalQuery";

const contentSchema = new Schema<ContentTypeDataModel>({
  _id: { type: String, required: true },
  type: { type: String, required: true },
  updated_at: { type: Date, required: true },
  created_at: { type: Date, required: true },
  updated_by: { type: String, required: true },
  created_by: { type: String, required: true },
  parent_id: { type: String, required: false },
  tenant_id: { type: String, required: true },
  data: {
    type: Object,
    required: true,
  },
});

contentSchema.index({ type: 1, tenant_id: 1 });

const createModel = () => {
  return model<ContentTypeDataModel>("Entity", contentSchema, "entities");
};

export const Entity =
  (mongoose.models?.Entity as ReturnType<typeof createModel>) || createModel();

export const mongodbConnect = async () => {
  await mongoose.connect(process.env.DATABASE_URL || "");
};

export const createEntity = async (args: {
  type: string;
  data: Partial<ContentTypeDataModel["data"]>;
}) => {
  const { user } = await getUser();
  const serverEntity = {
    _id: ulid(),
    tenant_id: user.company_id || "",
    type: args.type as any,
    created_by: user.user_id,
    created_at: new Date(),
    updated_by: user.user_id,
    updated_at: new Date(),
    data: {
      ...(args.data as any),
    },
  } satisfies ContentTypeDataModel;
  return await new Entity(serverEntity).save();
};

export const findEntities = async (query: UniversalQuery) => {
  const { user } = await getUser();

  const results = await Entity.find<{ _doc: ContentTypeDataModel }>(
    { ...query.filter, tenant_id: user.company_id },
    { ...(query.include as {}), type: 1, _id: 1, data: { make: 1 } },
    {
      skip: 0,
      limit: 20,
      ...query.options,
    }
  ).exec();

  return {
    results: results
      .map((r) => r._doc)
      .map((r) => ({
        ...r,

        title: r._id,
        id: r._id,
      })),
  };
};
