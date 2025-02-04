import {
  ContentTypeData,
  GlobalContentTypeId,
} from "@/config/ContentTypesConfig";
import { prisma } from "@/lib/prisma";
import { Pool, ClientConfig } from "pg";
import Cursor from "pg-cursor";
import SQL from "sql-template-strings";
import { Entity } from "../../prisma/generated/mongo";
import { tenantIds } from "./hashingUtils";
import { GlobalColumnIds } from "@/config/ColumnConfig";

const { ESDB_HOST, ESDB_PORT, ESDB_USER, ESDB_PASSWORD } = process.env;

const isLocalDev = process.env.NODE_ENV !== "production";

export const config = {
  host: ESDB_HOST!,
  port: Number(ESDB_PORT!),
  user: ESDB_USER!,
  password: ESDB_PASSWORD!,
  database: "equipmentshare",
} as ClientConfig;

export const run = async () => {
  const pool = new Pool({
    ...config,
  });

  const client = await pool.connect();

  const cursor = client.query(
    new Cursor<{ company_id: number; name: string }>(
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

    GROUP BY 
      a.asset_id, 
      ec.name, 
      c.name, 
      p.filename, 
      mk.name, 
      em.name
        `.append(isLocalDev ? " LIMIT 50_000" : "").text,
      []
    )
  );
  //   await client.connect();
  console.time("sync assets");
  while (true) {
    const rows = await cursor.read(5_000);
    console.log(rows);
    if (rows.length === 0) {
      break;
    }

    const updates = rows.flatMap(({ company_id, name }) => {
      const tenant_id = company_id.toString();
      const {
        t3WorkspaceId,
        t3WorkspaceNameColumnId,
        assetsSheetId,
        userSheetId,
        branchesSheetId,
        userSheetNameColumnId,
        assetsSheetNameColumnId,
        branchesSheeNameColumntId,
      } = tenantIds(tenant_id);

      return [];
    });

    // await prisma.$runCommandRaw({
    //   update: "Entity",
    //   updates,
    // });
  }
  console.timeEnd("sync assets");
};
