import { esdb } from "@/lib/esdb";
import { prisma } from "@/lib/prisma";
import { SystemEntityTypes } from "@/lib/SystemTypes";

import { sourceSystemIdHash, tenantScopedSystemEntityId } from "./hashingUtils";
import { upsertColumn } from "./upsertSystemTypes";
import _ from "lodash";
import wkx from "wkx";
import { Entity } from "../../prisma/generated/mongo";
import { SyncJob } from "./sync/SyncJob";

// const upsertSystemEntity = async (props: {
//   id: string;
//   type: SystemEntityTypes;
//   name: string;
//   tenant: string;
// }) => {
//   const { id, type, name, tenant } = props;
//   const update = {
//     data: {
//       name: name,
//     },
//     tenant_id: tenant,
//     type_id: type,
//   };
//   await prisma.entity.upsert({
//     where: { id: id },
//     create: {
//       id: id,
//       ...update,
//     },
//     update,
//   });
// };

const assetDataSync = async () => {
  // const assetWorkspaceId = tenantScopedSystemEntityId(
  //   "1854",
  //   "assets-workspace"
  // );

  // ///

  // const equipmentCategoryColumn = await upsertColumn({
  //   id: "equipment_category",
  //   label: "Equipment Category",
  //   order_priority: 0,
  //   type: "single_line_of_text",
  //   readonly: true,
  // });
  // const equipmentClassColumn = await upsertColumn({
  //   id: "equipment_class",
  //   label: "Equipment Class",
  //   order_priority: 0,
  //   type: "single_line_of_text",
  //   readonly: true,
  // });
  // const customModelColumn = await upsertColumn({
  //   id: "equipment_custom_model",
  //   label: "Equipment Custom Model",
  //   order_priority: 0,
  //   type: "single_line_of_text",
  //   readonly: true,
  // });
  // const modelColumn = await upsertColumn({
  //   id: "equipment_model",
  //   label: "Equipment Model",
  //   order_priority: 0,
  //   type: "single_line_of_text",
  //   readonly: true,
  // });
  // const makeColumn = await upsertColumn({
  //   id: "equipment_make",
  //   label: "Equipment Make",
  //   order_priority: 0,
  //   type: "single_line_of_text",
  //   readonly: true,
  // });
  // const photoColumn = await upsertColumn({
  //   id: "equipment_photo",
  //   label: "Equipment Photo",
  //   order_priority: 0,
  //   type: "img_url",
  //   readonly: true,
  // });
  // const locationColumn = await upsertColumn({
  //   id: "location",
  //   label: "Location",
  //   order_priority: 0,
  //   type: "location",
  //   readonly: true,
  // });

  // await upsertSystemEntity({
  //   id: assetWorkspaceId,
  //   tenant: "1854",
  //   type: "system_workspace",
  //   name: "T3 Assets",
  // });

  // const assetId = (id: number) => {
  //   return sourceSystemIdHash("esdb.public.assets", id.toString());
  // };

  // const assetJob = new SyncJob({
  //   sourceBatchSize: 20_000,
  //   sinkBatchSize: 5_000,
  //   source: async (queryArgs) => {
  //     return esdb.asset.findMany({
  //       where: { company_id: 1854 },
  //       select: {
  //         id: true,
  //         custom_name: true,
  //         equipment_class: {
  //           select: {
  //             name: true,
  //           },
  //         },
  //         company_id: true,
  //         category: {
  //           select: {
  //             name: true,
  //           },
  //         },
  //         photo: {
  //           select: {
  //             filename: true,
  //           },
  //         },
  //         custom_model: true,
  //         make: {
  //           select: {
  //             name: true,
  //           },
  //         },
  //         model: {
  //           select: {
  //             name: true,
  //           },
  //         },
  //         status: {
  //           where: { name: "location" },
  //         },
  //       },
  //       ...queryArgs,
  //     });
  //   },
  //   sink: async (batch) => {
  //     console.log(batch.length);
  //     // const db = (await esdb..connect()).db();
  //     const updates = batch.map((asset) => ({
  //       upsert: true,
  //       q: { _id: assetId(asset.id) },
  //       u: {
  //         $set: {
  //           _id: assetId(asset.id),
  //           tenant_id: asset.company_id.toString(),
  //           type_id: "system_item" satisfies SystemEntityTypes,
  //           parent_id: assetWorkspaceId,
  //           hidden: false,
  //           sort_order: asset.id,
  //           data: {
  //             name: asset.custom_name,
  //             [equipmentClassColumn]: asset.equipment_class?.name,
  //             [equipmentCategoryColumn]: asset.category?.name,
  //             [makeColumn]: asset.make?.name,
  //             [modelColumn]: asset.model?.name,
  //             [customModelColumn]: asset.custom_model,
  //             [photoColumn]: asset.photo
  //               ? `https://appcdn.equipmentshare.com/uploads/small/${asset.photo?.filename}`
  //               : null,
  //             [locationColumn]: asset.status
  //               .filter((s) => s.name === "location")
  //               .map(({ value }) => {
  //                 if (!value) return null;
  //                 try {
  //                   const wkbBuffer = Buffer.from(value, "hex");
  //                   const geometry = wkx.Geometry.parse(wkbBuffer);
  //                   return geometry.toGeoJSON();
  //                 } catch (err: any) {
  //                   console.log(err.message);
  //                   return null;
  //                 }
  //               })
  //               .find((_) => true),
  //           },
  //         } satisfies Omit<Entity, "id"> & { _id: string },
  //       },
  //     }));

  //     await prisma.$runCommandRaw({
  //       update: "Entity",
  //       updates,
  //     });
  //     console.log("batch");
  //   },
  // });

  // await assetJob.run();
};
assetDataSync();
