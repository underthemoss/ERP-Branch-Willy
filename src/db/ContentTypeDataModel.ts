interface IContentType<
  Type extends string,
  InheritsFrom extends { data: { [k: string]: any }; type: string },
  Fields
> {
  _id: string;
  type: Type;
  tenant_id: string;
  parent_id: string;
  data: InheritsFrom["data"] & Fields;

  // logical properties
  parent_type: InheritsFrom["type"];
  inheritied_fields: InheritsFrom["data"];
}

type BaseContentType = IContentType<
  "item",
  { data: {}; type: "" },
  { created_by: string }
>;
type Workspace = IContentType<"workspace", BaseContentType, { title: string }>;
type Project = IContentType<"project", BaseContentType, { title: string }>;
type Vendor = IContentType<"vendor", BaseContentType, { name: string }>;
type Ticket = IContentType<
  "ticket",
  BaseContentType,
  { name: string; status: string }
>;
type Order = IContentType<
  "order",
  BaseContentType,
  { order_id: string; customer_id: string; due_date: Date }
>;

export type ContentType =
  | BaseContentType
  | Workspace
  | Project
  | Vendor
  | Ticket
  | Order;

type DistributiveOmit<T, K extends keyof any> = T extends any
  ? Omit<T, K>
  : never;

export type ContentTypeDataModel = DistributiveOmit<
  ContentType,
  "parent_type" | "inheritied_fields"
>;
