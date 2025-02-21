import {
  ContentTypeData,
  GlobalContentTypeId,
} from "@/config/ContentTypesConfig";
import { prisma } from "@/lib/prisma";

import Cursor from "pg-cursor";
import SQL from "sql-template-strings";
import { ColumnConfig, Entity } from "../../prisma/generated/mongo";
import { tenantIds } from "./hashingUtils";
import { GlobalColumnData, GlobalColumnIds } from "@/config/ColumnConfig";
import { pgConfig, pool } from "@/lib/pool";
import { IDatabaseConnection, sql } from "@pgtyped/runtime";
import { assets } from "./assets.queries";
import { Client } from "pg";

export const syncAssets = async (tenantId: string) => {
  // const workspaceId = tenantId + "-" + "assets";

  // const columns: ColumnConfig[] = [
  //   {
  //     key: "id",
  //     hidden: false,
  //     label: "ID",
  //     readonly: true,
  //     type: "single_line_of_text",
  //     width: 150,
  //     lookup: null,
  //   },
  //   {
  //     key: "equipment_photo",
  //     hidden: false,
  //     label: "Photo",
  //     readonly: true,
  //     type: "img_url",
  //     width: 70,
  //     lookup: null,
  //   },
  //   {
  //     key: "name",
  //     hidden: false,
  //     label: "Custom name",
  //     readonly: true,
  //     type: "single_line_of_text",
  //     width: 200,
  //     lookup: null,
  //   },
  //   {
  //     key: "location",
  //     hidden: false,
  //     label: "Location",
  //     readonly: true,
  //     type: "location",
  //     width: 150,
  //     lookup: null,
  //   },
  //   {
  //     key: "equipment_category",
  //     hidden: false,
  //     label: "Category",
  //     readonly: true,
  //     type: "single_line_of_text",
  //     width: 120,
  //     lookup: null,
  //   },
  //   {
  //     key: "equipment_class",
  //     hidden: false,
  //     label: "Class",
  //     readonly: true,
  //     type: "single_line_of_text",
  //     width: 200,
  //     lookup: null,
  //   },
  //   {
  //     key: "equipment_make",
  //     hidden: false,
  //     label: "Make",
  //     readonly: true,
  //     type: "single_line_of_text",
  //     width: 200,
  //     lookup: null,
  //   },
  //   {
  //     key: "equipment_model",
  //     hidden: false,
  //     label: "Model",
  //     readonly: true,
  //     type: "single_line_of_text",
  //     width: 200,
  //     lookup: null,
  //   },
  //   {
  //     key: "equipment_custom_model",
  //     hidden: false,
  //     label: "Custom Model",
  //     readonly: true,
  //     type: "single_line_of_text",
  //     width: 200,
  //     lookup: null,
  //   },
  //   {
  //     key: "total_children",
  //     hidden: false,
  //     label: "Children",
  //     readonly: true,
  //     type: "total_children",
  //     width: 200,
  //     lookup: null,
  //   },
  // ];

  // await prisma.entity.upsert({
  //   where: { id: workspaceId },
  //   create: {
  //     id: workspaceId,
  //     tenant_id: tenantId,
  //     data: {
  //       name: "Assets",
  //     },
  //     type_id: "workspace",
  //     column_config: columns,
  //   },

  //   update: {},
  // });

  const client = new Client(pgConfig);
  const connection: IDatabaseConnection = {
    query: (query, bindings) => client.query(query, bindings) as any,
    stream: (query, bindings) => client.query(new Cursor(query, bindings)),
  };

  await client.connect();
  const cursor = assets.stream({ company_id: Number(tenantId) }, connection);

  try {
    while (true) {
      const rows = await cursor.read(5_000);

      if (rows.length === 0) {
        break;
      }

      const updates = rows.flatMap(
        ({
          id,
          custom_name,
          company_id,
          latitude,
          longitude,
          equipment_class_name,
          make_name,
          model_name,
          model,
          photo_filename,
          category_name,
        }) => {
          const tenant_id = company_id.toString();
          const { assetsSheetId } = tenantIds(tenant_id);

          const _id = tenantIds(company_id).assetId(id);
          const coordinates =
            latitude && longitude ? [latitude, longitude] : undefined;
          return [
            {
              upsert: true,
              q: { _id: _id },
              u: [
                {
                  $set: {
                    _id: _id,
                    tenant_id: company_id.toString(),
                    type_id: "asset",
                    parent_id: null,
                    hidden: false,
                    sort_order: 0,
                    column_config: [],
                    data: {
                      id: id,
                      name: custom_name,
                      location: coordinates,
                      equipment_category: category_name,
                      equipment_class: equipment_class_name,
                      equipment_make: make_name,
                      equipment_custom_model: model,
                      equipment_model: model_name,
                      equipment_photo: photo_filename
                        ? `https://appcdn.equipmentshare.com/uploads/small/${photo_filename}`
                        : null,
                    },
                  } //satisfies Omit<Entity, "id"> & { _id: string },
                },
              ],
            },
          ];
        }
      );

      await prisma.$runCommandRaw({
        update: "Entity",
        updates,
      });
    }
  } finally {
    await cursor.close();
    await client.end();
  }
};
