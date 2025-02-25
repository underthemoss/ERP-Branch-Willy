import { ContentTypesConfig } from "../../prisma/generated/mongo";

export const systemContentTypesConfig = {
  id: "1854",
  tenant_id: "1854",
  types: [
    {
      id: "5a3325f7-9052-4ccb-8d26-4556901012a8",
      label: "Item",
      fields: [
        {
          id: "01JMFEAMJYA1D9EG99QQNB9JJJ",
          label: "Name",
          type: "text",
        },
      ],
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
      is_root_type: true,
    },
    {
      id: "01JMY9B9AGE8HZT1TRF9D64GMZ",
      label: "Order",
      fields: [],
      color: "#03a9f4",
      icon: "ReceiptLong",
      allowed_child_content_types: ["01JMY9BR7XKQQ8ZDT0DK5BGXWP"],
      abstract: false,
      parent_id: "5a3325f7-9052-4ccb-8d26-4556901012a8",
      is_root_type: false,
    },
    {
      fields: [],
      id: "01JMY9BR7XKQQ8ZDT0DK5BGXWP",
      label: "Line Item",
      parent_id: "5a3325f7-9052-4ccb-8d26-4556901012a8",
      color: "#607d8b",
      icon: "Description",
      abstract: false,
      allowed_child_content_types: [],
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
          id: "01JMYKZSV3E68KP5MMHEPP0BM1",
          label: "Product",
          type: "text",
        },
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
