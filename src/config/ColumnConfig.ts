import { ColumnType, Entity } from "../../prisma/generated/mongo";

type GlobalColummnCategories = "General" | "Asset Details" | "Audit" | "hidden";

export type ColumnTypeMap = {
  single_line_of_text: string | null;
  date: Date | null;
  user: string | null;
  img_url: string | null;
  location: [number, number] | null;
  integer: number;
  email: string | null;
};

type ColumnConfig = {
  category: GlobalColummnCategories;
  id: string;
  label: string;
  type: ColumnType;
  order_priority: number;
  readonly: boolean;
};

export const GLOBAL_COLUMNS = [
  // GENERAL
  {
    id: "name",
    category: "General",
    label: "Title",
    type: "single_line_of_text",
    order_priority: 100,
    readonly: false,
  },
  {
    id: "notes",
    label: "Notes",
    type: "single_line_of_text",
    order_priority: 0,
    readonly: false,
    category: "General",
  },
  {
    id: "email",
    label: "Email",
    type: "email",
    order_priority: 0,
    readonly: false,
    category: "General",
  },
  {
    id: "due_date",
    label: "Due Date",
    type: "date",
    order_priority: 70,
    readonly: false,
    category: "General",
  },
  {
    id: "user",
    label: "User",
    type: "user",
    order_priority: 60,
    readonly: false,
    category: "General",
  },
  {
    id: "imag_url",
    label: "Image URL",
    type: "img_url",
    order_priority: 60,
    readonly: false,
    category: "General",
  },
  {
    id: "location",
    label: "Location",
    order_priority: 0,
    type: "location",
    readonly: true,
    category: "General",
  },

  // AUDIT
  {
    id: "created_by",
    label: "Created By",
    type: "user",
    readonly: true,
    order_priority: 0,
    category: "Audit",
  },
  {
    id: "created_at",
    label: "Created At",
    type: "date",
    readonly: true,
    order_priority: 0,
    category: "Audit",
  },
  {
    id: "updated_by",
    label: "Updated By",
    type: "user",
    readonly: true,
    order_priority: 0,
    category: "Audit",
  },
  {
    id: "updated_at",
    label: "Updated At",
    type: "date",
    readonly: true,
    order_priority: 0,
    category: "Audit",
  },

  // ASSETS
  {
    id: "equipment_category",
    category: "Asset Details",
    label: "Equipment Category",
    order_priority: 0,
    type: "single_line_of_text",
    readonly: true,
  },
  {
    id: "equipment_class",
    category: "Asset Details",
    label: "Equipment Class",
    order_priority: 1,
    type: "single_line_of_text",
    readonly: true,
  },
  {
    id: "equipment_custom_model",
    category: "Asset Details",
    label: "Equipment Custom Model",
    order_priority: 0,
    type: "single_line_of_text",
    readonly: true,
  },
  {
    id: "equipment_make",
    category: "Asset Details",
    label: "Equipment Make",
    order_priority: 0,
    type: "single_line_of_text",
    readonly: true,
  },
  {
    id: "equipment_model",
    category: "Asset Details",
    label: "Equipment Model",
    order_priority: 0,
    type: "single_line_of_text",
    readonly: true,
  },
  {
    id: "equipment_photo",
    category: "Asset Details",
    label: "Equipment Photo",
    order_priority: 0,
    type: "img_url",
    readonly: true,
  },
  {
    id: "parent_column_config__column_id",
    category: "hidden",
    label: "parent_column_config__column_id",
    order_priority: 0,
    type: "single_line_of_text",
    readonly: false,
  },
  {
    id: "parent_column_config__column_width",
    category: "hidden",
    label: "parent_column_config__column_width",
    order_priority: 0,
    type: "integer",
    readonly: false,
  },
  {
    id: "line_item__quantity",
    category: "General",
    label: "Quantity",
    order_priority: 0,
    type: "integer",
    readonly: false,
  },
  {
    id: "line_item__product",
    category: "General",
    label: "Product",
    order_priority: 0,
    type: "single_line_of_text",
    readonly: false,
  },
] as const satisfies ColumnConfig[];

export type GlobalColumnIds = (typeof GLOBAL_COLUMNS)[number]["id"];

export type ColumnIdToTypeMap = {
  [C in (typeof GLOBAL_COLUMNS)[number] as C["id"]]: ColumnTypeMap[C["type"]];
};

export type GlobalColumnData = Partial<{
  [ColumnId in GlobalColumnIds]: ColumnIdToTypeMap[ColumnId];
}>;
