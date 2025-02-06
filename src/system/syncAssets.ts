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
import { pool } from "@/lib/pool";

export const syncAssets = async (tenantId: string) => {
  const workspaceId = tenantId + "-" + "assets";
  const columns: ColumnConfig[] = [
    {
      key: "id",
      hidden: false,
      label: "ID",
      readonly: true,
      type: "single_line_of_text",
      width: 150,
      lookup: null,
    },
    {
      key: "equipment_photo",
      hidden: false,
      label: "Photo",
      readonly: true,
      type: "img_url",
      width: 70,
      lookup: null,
    },
    {
      key: "name",
      hidden: false,
      label: "Custom name",
      readonly: true,
      type: "single_line_of_text",
      width: 200,
      lookup: null,
    },
    {
      key: "location",
      hidden: false,
      label: "Location",
      readonly: true,
      type: "location",
      width: 150,
      lookup: null,
    },
    {
      key: "equipment_category",
      hidden: false,
      label: "Category",
      readonly: true,
      type: "single_line_of_text",
      width: 120,
      lookup: null,
    },
    {
      key: "equipment_class",
      hidden: false,
      label: "Class",
      readonly: true,
      type: "single_line_of_text",
      width: 200,
      lookup: null,
    },
    {
      key: "equipment_make",
      hidden: false,
      label: "Make",
      readonly: true,
      type: "single_line_of_text",
      width: 200,
      lookup: null,
    },
    {
      key: "equipment_model",
      hidden: false,
      label: "Model",
      readonly: true,
      type: "single_line_of_text",
      width: 200,
      lookup: null,
    },
    {
      key: "equipment_custom_model",
      hidden: false,
      label: "Custom Model",
      readonly: true,
      type: "single_line_of_text",
      width: 200,
      lookup: null,
    },
  ];

  await prisma.entity.upsert({
    where: { id: workspaceId },
    create: {
      id: workspaceId,
      tenant_id: tenantId,
      data: {
        name: "Assets",
      },
      type_id: "workspace",
      column_config: columns,
    },

    update: {},
  });
  const client = await pool.connect();
  try {
    const cursor = client.query(
      new Cursor<{
        id: number;
        custom_name: string;
        company_id: number;
        model: string;
        equipment_class_name: string | null;
        category_name: string | null;
        photo_filename: string | null;
        make_name: string | null;
        model_name: string | null;
        status: {
          asset_status_key_value_id: number;
          asset_id: number;
          name: string;
          // the "value" is built as an array of two numbers [x, y]
          value: [number, number];
        }[];
      }>(
        SQL`
      SELECT 
        a.asset_id AS id,
        a.custom_name,
        a.company_id,
        a.model,
        ec.name AS equipment_class_name,
        c.name AS category_name,
        p.filename AS photo_filename,
        mk.name AS make_name,
        em.name AS model_name,
        json_agg(
          json_build_object(
            'asset_status_key_value_id', askv.asset_status_key_value_id,
            'asset_id', askv.asset_id,
            'name', askv.name,
            'value', ARRAY [ST_X(ST_AsText(askv.value)),ST_Y(ST_AsText(askv.value))]
          )
        ) FILTER (WHERE askv.asset_status_key_value_id IS NOT NULL) AS status
      FROM assets a
      LEFT JOIN equipment_classes ec 
        ON a.equipment_class_id = ec.equipment_class_id
      LEFT JOIN categories c 
        ON a.category_id = c.category_id
      LEFT JOIN photos p 
        ON a.photo_id = p.photo_id
      LEFT JOIN equipment_makes mk 
        ON a.equipment_make_id = mk.equipment_make_id
      LEFT JOIN equipment_models em 
        ON a.equipment_model_id = em.equipment_model_id
      LEFT JOIN asset_status_key_values askv 
        ON a.asset_id = askv.asset_id AND askv.name = 'location'
      WHERE a.company_id = $1
      GROUP BY 
        a.asset_id, 
        ec.name, 
        c.name, 
        p.filename, 
        mk.name, 
        em.name
  
          `.text,
        [tenantId]
      )
    );

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
          status,
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
          const coordinates = status?.[0]?.value
            ? status[0].value.filter(Boolean).length > 0
              ? status?.[0]?.value
              : null
            : null;
          return [
            {
              upsert: true,
              q: { _id: _id },
              u: {
                $set: {
                  _id: _id,
                  tenant_id: company_id.toString(),
                  type_id: "record" satisfies GlobalContentTypeId,
                  parent_id: workspaceId,
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
                } satisfies Omit<Entity, "id"> & { _id: string },
              },
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
    client.release();
  }
};
