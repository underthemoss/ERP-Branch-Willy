import { SystemIconTypes } from "@/ui/Icons";

type ContentTypeFieldType = {
  type: "text";
  required: boolean;
  label: string;
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
  color: "red",
  icon: "AccountTree",
  abstract: true,
  fields: {
    created_by: {
      label: "Created by",
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
      fields: {
        name: {
          label: "Name",
          type: "text",
          required: true,
        },
      },
      sub_types: [],
    },
    {
      type: "project",
      abstract: false,
      allowed_children: [],
      color: "green",
      icon: "Article",
      label: "Project",
      fields: {
        name: {
          label: "Name",
          type: "text",
          required: true,
        },
      },
      sub_types: [
        {
          type: "order",
          abstract: false,
          allowed_children: [],
          color: "green",
          icon: "Article",
          label: "Order",
          fields: {
            name: {
              label: "Name",
              type: "text",
              required: true,
            },
          },
          sub_types: [],
        },
      ],
    },
  ],
};
