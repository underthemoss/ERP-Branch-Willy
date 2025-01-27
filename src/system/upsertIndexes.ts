import { prisma } from "@/lib/prisma";

const upsertIndexes = async () => {
  //   await prisma.$runCommandRaw({
  //     enableSharding: "es-erp",
  //   });
  //   await prisma.$runCommandRaw({
  //     shardCollection: "es-erp.Entity",
  //     key: { tenant_id: 1 }, // Replace keyField with the field you want as the shard key
  //   });
  // prisma.

  await prisma.$runCommandRaw({
    createIndexes: "Entity",
    indexes: [
      {
        key: { "data.$**": 1 },
        name: "data_wildcard_index",
      },
      {
        key: { parent_id: 1 },
        name: "parent_id_index",
      },
      {
        key: { tenant_id: 1 },
        name: "tenant_id_index",
      },
      {
        key: { hidden: 1 },
        name: "hidden_index",
      },
      {
        key: { type_id: 1 },
        name: "type_id_index",
      },
    ],
  });
};

upsertIndexes();
