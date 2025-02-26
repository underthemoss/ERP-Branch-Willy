import { SystemIconTypes } from "@/ui/Icons";

type ContentTypeFieldType = {
  type: "text";
  required: boolean;
};

export type ContentTypeConfig = {
  label: string;
  type: string;
  icon: SystemIconTypes;
  color: string;
  allowed_children: string[];
  abstract: boolean;
  fields: {
    [key: string]: ContentTypeFieldType;
  };
  sub_types: ContentTypeConfig[];
};
export const contentTypeConfig: ContentTypeConfig = {
  label: "Item",
  type: "item",
  allowed_children: [],
  color: "white",
  icon: "AccountTree",
  abstract: true,
  fields: {
    created_by: {
      type: "text",
      required: true,
    },
  },
  sub_types: [
    {
      type: "workspace",
      abstract: false,
      allowed_children: ["project"],
      color: "green",
      icon: "Article",
      label: "Workspace",
      fields: {},
      sub_types: [],
    },
  ],
};
