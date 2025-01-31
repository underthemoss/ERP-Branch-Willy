import { prisma } from "@/lib/prisma";

const upsertIndexes = async () => {
  const columnIndex = (key: string) => {
    return [
      {
        key: {
          tenant_id: 1,
          parent_id: 1,
          hidden: 1,
          [key]: 1,
        },
        name: `${key}_asc_index`,
        collation: { locale: "en", strength: 2 },
      },
      {
        key: {
          tenant_id: 1,
          parent_id: 1,
          hidden: 1,
          [key]: -1,
        },
        name: `${key}_desc_index`,
        collation: { locale: "en", strength: 2 },
      },
    ];
  };

  await prisma.$runCommandRaw({
    createIndexes: "Entity",
    indexes: [
      {
        key: { "data.$**": 1 },
        name: "data_wildcard_index",
        collation: { locale: "en", strength: 2 },
      },
      {
        key: { parent_id: 1 },
        name: "parent_id_index",
        // collation: { locale: "en", strength: 2 },
      },
      {
        key: { tenant_id: 1 },
        name: "tenant_id_index",
        // collation: { locale: "en", strength: 2 },
      },
      {
        key: { hidden: 1 },
        name: "hidden_index",
        // collation: { locale: "en", strength: 2 },
      },
      // {
      //   key: { type_id: 1 },
      //   name: "type_id_index",
      //   collation: { locale: "en", strength: 2 },
      // },

      // targeted properties for sorting
      // ...columnIndex("parent_id"),
      // ...columnIndex("tenant_id"),
      ...columnIndex("data.name"),
      ...columnIndex("data.created_at"),
      ...columnIndex("data.equipment_category"),
      // ...dataColumnIndex("equipment_class"),
      // ...dataColumnIndex("equipment_make"),
      // ...dataColumnIndex("equipment_model"),
      // ...dataColumnIndex("equipment_custom_model"),
    ],
  });
};

upsertIndexes();
