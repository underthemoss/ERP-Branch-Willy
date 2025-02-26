import { SystemIconTypes } from "@/ui/Icons";
import { ContentType } from "./ContentTypeDataModel";

type FieldType = { required: boolean; label: string } & (
  | {
      type: "text";
    }
  | {
      type: "choice";
      options: { name: string; value: string }[];
    }
  | {
      type: "date";
    }
);

type ContentTypeViewModel = {
  [key in ContentType["type"]]: {
    type: key;
    label: string;
    icon: SystemIconTypes;
    color: string;
    allowed_children: ContentType["type"][];
    parent_type: Extract<ContentType, { type: key }>["parent_type"];

    fields: {
      [field in keyof Extract<ContentType, { type: key }>["data"]]: FieldType;
    };
  } & (
    | {
        abstract: true;
      }
    | {
        abstract: false;
      }
  );
};

export const ContentTypesConfig: ContentTypeViewModel = {
  item: {
    label: "Item",
    icon: "SaveAlt",
    color: "red",
    abstract: true,
    parent_type: "",
    type: "item",
    allowed_children: [],
    fields: {
      created_by: {
        label: "Created by",
        required: true,
        type: "text",
      },
    },
  },
  workspace: {
    type: "workspace",
    abstract: false,
    allowed_children: ["project"],
    color: "green",
    icon: "Article",
    label: "Workspace",
    parent_type: "item",
    fields: {
      title: {
        label: "Workspace name",
        required: true,
        type: "text",
      },
      created_by: {
        label: "Created by",
        required: true,
        type: "text",
      },
    },
  },
  project: {
    type: "project",
    parent_type: "item",
    abstract: false,
    allowed_children: ["order"],
    color: "blue",
    icon: "AccountTree",
    label: "Project",
    fields: {
      title: {
        label: "Project name",
        required: true,
        type: "text",
      },
      created_by: {
        label: "Created by",
        required: true,
        type: "text",
      },
    },
  },
  vendor: {
    type: "vendor",
    abstract: false,
    allowed_children: [],
    color: "purple",
    icon: "Backup",
    label: "Vendor",
    parent_type: "item",
    fields: {
      name: {
        label: "Vendor name",
        required: true,
        type: "text",
      },
      created_by: {
        label: "Created by",
        required: true,
        type: "text",
      },
    },
  },
  ticket: {
    type: "ticket",
    parent_type: "item",
    abstract: false,
    allowed_children: [],
    color: "pink",
    icon: "BarChart",
    label: "Ticket",
    fields: {
      name: {
        label: "Ticket name",
        required: true,
        type: "text",
      },
      status: {
        label: "Status",
        required: true,
        type: "choice",
        options: [
          { name: "Open", value: "open" },
          { name: "In Progress", value: "in_progress" },
          { name: "Closed", value: "closed" },
        ],
      },
      created_by: {
        label: "Created by",
        required: true,
        type: "text",
      },
    },
  },
  order: {
    type: "order",
    abstract: false,
    allowed_children: [],
    color: "brown",
    icon: "CheckBox",
    label: "Order",
    parent_type: "item",
    fields: {
      order_id: {
        type: "text",
        label: "Order ID",
        required: true,
      },
      customer_id: {
        label: "Vendor ID",
        type: "text",
        required: false,
      },
      due_date: {
        type: "date",
        label: "Due date",
        required: false,
      },
      created_by: {
        label: "Created by",
        required: true,
        type: "text",
      },
    },
  },
};

const walkTree = (
  key: keyof ContentTypeViewModel,
  depth: number
): (ContentTypeViewModel[keyof ContentTypeViewModel] & { depth: number })[] => {
  const contentType = ContentTypesConfig[key];
  const children = Object.values(ContentTypesConfig)
    .filter((ct) => ct.parent_type === key)
    .map((ct) => ct.type);
  return [
    { ...contentType, depth },
    ...children.flatMap((ct) => walkTree(ct, depth + 1)),
  ];
};

export const ContentTypesConfigDenormalised = walkTree("item", 0);
