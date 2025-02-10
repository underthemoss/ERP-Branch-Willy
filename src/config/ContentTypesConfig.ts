import { EntityTypeIcon } from "../../prisma/generated/mongo";
import { GlobalColumnData, GlobalColumnIds } from "./ColumnConfig";

export type ContentTypeCategories = "General" | "hidden";

export const GlobalContentTypeEnum = {
  workspace: "workspace",
  folder: "folder",
  sheet: "sheet",
  record: "record",
  // order: "order",
  // line_item: "line_item",
};

export type GlobalContentTypeId = keyof typeof GlobalContentTypeEnum;

type ContentTypeDefinition = {
  category: ContentTypeCategories;
  id: GlobalContentTypeId;
  name: string;
  columns: GlobalColumnIds[];
  valid_child_types: GlobalContentTypeId[]; //here
  required: GlobalColumnIds[];
  icon: EntityTypeIcon;
};

export const GLOBAL_CONTENT_TYPES = [
  {
    id: "record",
    icon: "list_item",
    name: "Record",
    category: "General",
    columns: [
      "name",
      "notes",
      "created_at",
      "created_by",
      "updated_at",
      "updated_by",
    ],
    required: ["name"],
    valid_child_types: [],
  },
  {
    id: "workspace",
    icon: "workspace",
    name: "Workspace",
    category: "General",
    columns: [
      "name",
      "notes",
      "created_at",
      "created_by",
      "updated_at",
      "updated_by",
    ],
    required: ["name"],
    valid_child_types: ["folder", "sheet"],
  },
  {
    id: "folder",
    icon: "folder",
    name: "Folder",
    category: "General",
    columns: ["name", "created_at", "created_by", "updated_at", "updated_by"],
    valid_child_types: ["folder", "sheet"],
    required: ["name"],
  },
  {
    id: "sheet",
    icon: "list",
    name: "Sheet",
    category: "General",
    columns: ["name", "created_at", "created_by", "updated_at", "updated_by"],
    valid_child_types: ["record"],
    required: ["name"],
  },
  // {
  //   id: "order",
  //   icon: "order",
  //   name: "Order",
  //   category: "General",
  //   columns: ["name", "created_at", "created_by", "updated_at", "updated_by"],
  //   valid_child_types: ["line_item"],
  //   required: ["name"],
  // },
  // {
  //   id: "line_item",
  //   icon: "line_item",
  //   name: "Line Item",
  //   category: "General",
  //   columns: [
  //     "line_item__quantity",
  //     "created_at",
  //     "created_by",
  //     "updated_at",
  //     "updated_by",
  //   ],
  //   valid_child_types: [],
  //   required: ["name"],
  // },
] as const satisfies ContentTypeDefinition[];

export type GlobalContentType = (typeof GLOBAL_CONTENT_TYPES)[number];

export type ContentTypeData<T extends GlobalContentType["id"]> = Pick<
  GlobalColumnData,
  Extract<GlobalContentType, { id: T }>["columns"][number]
>;
