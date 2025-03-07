import mongoose, { Model, model, Schema } from "mongoose";

import { ulid } from "ulid";
import { getUser } from "@/lib/auth";
import { ContentTypeDataModel } from "@/types/generated/content-types";
import { UniversalQuery } from "@/types/UniversalQuery";

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

// contentSchema.pre("validate", async function (next) {
//   const value = this.toObject() as ContentTypeDataModel;

//   const result = ContentTypesDataModelValidation[value.type_id].safeParse(
//     value.data
//   );
//   if (!result.success) {
//     return next(new Error(JSON.stringify(result.error.errors, undefined, 2)));
//   }
//   next();
// });

// contentSchema.pre("save", function (next) {
//   const value = this.toObject() as ContentTypesDataModel;

//   next();
// });

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

export const findEntities = async (query: UniversalQuery = {}) => {
  const { user } = await getUser();

  const dataFilters = Object.fromEntries(
    Object.entries(query).filter(([key]) => key.startsWith("data."))
  );

  const includeProjection = query.include
    ? Object.fromEntries(
        typeof query.include === "string"
          ? [[query.include, true]]
          : query.include.map((f) => [f, true])
      )
    : { data: true };

  const orderByStandardised =
    typeof query.order_by === "string" ? [query.order_by] : query.order_by;

  const orderBy = orderByStandardised
    ? Object.fromEntries(orderByStandardised.map((o) => o.split(":")))
    : { created_at: "asc" };

  const results = await Entity.find<{ _doc: ContentTypeDataModel }>(
    {
      ...(query.id && { _id: query.id }),
      ...(query.parent_id && { parent_id: query.parent_id }),
      ...(query.type && { type: query.type }),
      ...dataFilters,
      tenant_id: user.company_id,
    },
    {
      ...includeProjection,
      _id: true,
      type: true,
      updated_at: true,
      created_at: true,
      updated_by: true,
      created_by: true,
      parent_id: true,
    }
  )
    .sort(orderBy)
    .skip(query.offset || 0)
    .limit(query.limit || 20)
    .exec();

  return results
    .map((r) => r._doc)
    .map((r) => ({
      ...r,

      title: r._id,
      id: r._id,
    }));
};
