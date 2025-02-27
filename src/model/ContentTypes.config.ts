import { ContentTypeConfig } from "./ContentTypes.types";

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
      type: "collection",
      abstract: true,
      allowed_children: [],
      color: "gray",
      icon: "ViewList",
      label: "Collection",
      fields: {
        name: {
          label: "Name",
          type: "text",
          required: true,
        },
      },
      sub_types: [
        {
          type: "collection_asset",
          abstract: false,
          allowed_children: ["asset"],
          color: "green",
          icon: "ViewList",
          label: "Assets",
          fields: {},
          sub_types: [],
        },
      ],
    },
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
      type: "folder",
      abstract: true,
      allowed_children: [],
      color: "orange",
      icon: "FolderOpen",
      label: "Folder",
      fields: {},
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
      sub_types: [],
    },
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
    {
      type: "asset",
      abstract: false,
      allowed_children: [],
      color: "red",
      icon: "CloudDone",
      label: "Asset",
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
};
