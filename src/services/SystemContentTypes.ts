
import { ContentTypesConfig } from "../../prisma/generated/mongo";

export const systemContentTypesConfig = {
  id: "1854",
  tenant_id: "1854",
  types: [
    {
      id: "5a3325f7-9052-4ccb-8d26-4556901012a8",
      label: "Item",
      fields: [],
      color: "#000000",
      icon: "LabelImportant",
      allowed_child_content_types: [],
      abstract: true,
      parent_id: "",
      is_root_type: false,
    },
    {
      id: "992f6aa2-b454-48c9-8d6c-55c1c492fb9d",
      label: "Workspace",
      fields: [],
      color: "#03a9f4",
      icon: "Dashboard",
      allowed_child_content_types: [],
      abstract: false,
      parent_id: "5a3325f7-9052-4ccb-8d26-4556901012a8",
      is_root_type: false,
    },
    {
      id: "01JMY9B9AGE8HZT1TRF9D64GMZ",
      label: "Order",
      fields: [
        {
          id: "01JMYVG3Q37A9TS65SK0XRHT1J",
          label: "Order ID",
          type: "text",
        },
      ],
      color: "#03a9f4",
      icon: "ReceiptLong",
      allowed_child_content_types: ["01JMY9BR7XKQQ8ZDT0DK5BGXWP"],
      abstract: false,
      parent_id: "5a3325f7-9052-4ccb-8d26-4556901012a8",
      is_root_type: false,
    },
    {
      id: "01JMY9BR7XKQQ8ZDT0DK5BGXWP",
      label: "Line Item",
      fields: [
        {
          id: "01JMYVHP0V45Y522GEKZVWA3FW",
          label: "Product",
          type: "text",
        },
      ],
      color: "#607d8b",
      icon: "Description",
      allowed_child_content_types: [],
      abstract: true,
      parent_id: "5a3325f7-9052-4ccb-8d26-4556901012a8",
      is_root_type: false,
    },
    {
      id: "01JMYKTB65RT6EA5VG5APTBMDB",
      label: "Rental Line Item",
      fields: [
        {
          id: "01JMYKSPHGJ24B5FX8ZX0N7TP9",
          label: "Start date",
          type: "date",
        },
        {
          id: "01JMYKSXGQ93YZDA3CW8VHFNP9",
          label: "End date",
          type: "date",
        },
      ],
      color: "#4caf50",
      icon: "Schedule",
      allowed_child_content_types: [],
      abstract: false,
      parent_id: "01JMY9BR7XKQQ8ZDT0DK5BGXWP",
      is_root_type: false,
    },
    {
      id: "01JMYKX5F6EAP8NQ3W14S32NTA",
      label: "Sale Line Item",
      fields: [
        {
          id: "01JMYKZZB07SYGSE9C3XVJWGH5",
          label: "Quantity",
          type: "number",
        },
      ],
      color: "#4caf50",
      icon: "TextSnippet",
      allowed_child_content_types: [],
      abstract: false,
      parent_id: "01JMY9BR7XKQQ8ZDT0DK5BGXWP",
      is_root_type: false,
    },
    {
      id: "01JMYT35G9EDJVJ39Q8V8D0XP8",
      label: "Customer",
      fields: [
        {
          id: "01JMYVN7G92T47Y279TXBFCWXX",
          label: "Customer Name",
          type: "text",
        },
        {
          id: "01JMYVNKTV12FZMZ3KDCKR7QTJ",
          label: "Hubspot ID",
          type: "text",
        },
        {
          id: "01JMYVPCSPNMRJ9N1F62R0T60X",
          label: "Salesforce ID",
          type: "text",
        },
      ],
      color: "#03a9f4",
      icon: "Folder",
      allowed_child_content_types: ["01JMY9B9AGE8HZT1TRF9D64GMZ"],
      abstract: false,
      parent_id: "5a3325f7-9052-4ccb-8d26-4556901012a8",
      is_root_type: false,
    },
    {
      id: "01JMYVTD82C2A52FFV96PZ3E4F",
      label: "Customer Library",
      fields: [
        {
          id: "01JMYVT1VZ8GC9BY872JA9NREK",
          label: "Name",
          type: "text",
        },
      ],
      color: "#03a9f4",
      icon: "FolderShared",
      allowed_child_content_types: ["01JMYT35G9EDJVJ39Q8V8D0XP8"],
      abstract: false,
      parent_id: "5a3325f7-9052-4ccb-8d26-4556901012a8",
      is_root_type: true,
    },
    {
      id: "01JMYWM2A1CFFD16RYCPD2SZ6M",
      label: "Product Catalog",
      fields: [
        {
          id: "01JMYWKXDEMY1W506G0W339FDZ",
          label: "Name",
          type: "text",
        },
      ],
      color: "#673ab7",
      icon: "FolderSpecial",
      allowed_child_content_types: ["01JMYWQ37EWWT8E3SZ50J3YJ59"],
      abstract: false,
      parent_id: "5a3325f7-9052-4ccb-8d26-4556901012a8",
      is_root_type: true,
    },
    {
      id: "01JMYWP0A2EA37DQYXJMN4SWXC",
      label: "Product",
      fields: [
        {
          id: "01JMYWNQV23J0RTQJQX9TJVZPQ",
          label: "Product Name",
          type: "text",
        },
      ],
      color: "#4caf50",
      icon: "Star",
      allowed_child_content_types: ["01JMYWQ37EWWT8E3SZ50J3YJ59"],
      abstract: true,
      parent_id: "5a3325f7-9052-4ccb-8d26-4556901012a8",
      is_root_type: false,
    },
    {
      id: "01JMYWQ37EWWT8E3SZ50J3YJ59",
      label: "Product Category",
      fields: [
        {
          id: "01JMYWQVWPR12X3NYPJR4FZQXY",
          label: "Product Category Name",
          type: "text",
        },
      ],
      color: "#4caf50",
      icon: "FolderOpen",
      allowed_child_content_types: [
        "01JMYWQ37EWWT8E3SZ50J3YJ59",
        "01JMYWP0A2EA37DQYXJMN4SWXC",
      ],
      abstract: false,
      parent_id: "5a3325f7-9052-4ccb-8d26-4556901012a8",
      is_root_type: false,
    },
    {
      id: "01JMYWS5P2BYNZ6P0G5ZKENC2R",
      label: "Physical Good",
      fields: [
        {
          id: "01JMYWSSFPMSZQ3VNRR03R21ZW",
          label: "Weight",
          type: "text",
        },
        {
          id: "01JMYWT22N0YDNPSA7D3NBB24Z",
          label: "Purchase Price",
          type: "text",
        },
      ],
      color: "#4caf50",
      icon: "InsertDriveFile",
      allowed_child_content_types: [],
      abstract: false,
      parent_id: "01JMYWP0A2EA37DQYXJMN4SWXC",
      is_root_type: false,
    },
    {
      id: "01JMYXG0347KRQM9C3PTKDKXNW",
      label: "Asset",
      fields: [
        {
          id: "01JMYXCZ2YNRFGGTTYM2D67188",
          label: "Asset ID",
          type: "text",
        },
        {
          id: "01JMYXDHVA79ME19GZPBKTJW3Q",
          label: "Custom Name",
          type: "text",
        },
        {
          id: "01JMYXDXD1MRZGNNF1DB43B82G",
          label: "Location",
          type: "text",
        },
        {
          id: "01JMYXE6ME22BPY4V9Q2VCM64N",
          label: "Category",
          type: "text",
        },
        {
          id: "01JMYXEGRVSEHDACXRXBPDR0SV",
          label: "Class",
          type: "text",
        },
        {
          id: "01JMYXENCB9MFG6CP2CJ0AHCKV",
          label: "Make",
          type: "text",
        },
        {
          id: "01JMYXEWMV8TSP7N4GGFMKTHV5",
          label: "Model",
          type: "text",
        },
        {
          id: "01JMYXF36HK11QKCQAC8SH105A",
          label: "Custom Model",
          type: "text",
        },
        {
          id: "01JMYXFNN4Y6XWQW655YEDEWP1",
          label: "Photo",
          type: "text",
        },
      ],
      color: "#673ab7",
      icon: "Label",
      allowed_child_content_types: [],
      abstract: false,
      parent_id: "5a3325f7-9052-4ccb-8d26-4556901012a8",
      is_root_type: false,
    },
  ],
} as const satisfies ContentTypesConfig;

export const contentTypeLookup = systemContentTypesConfig.types.reduce(
  (acc, curr) => {
    return { ...acc, [curr.label]: curr };
  },
  {} as {
    [k in (typeof systemContentTypesConfig)["types"][number]["label"]]: (typeof systemContentTypesConfig)["types"][number];
  }
);
