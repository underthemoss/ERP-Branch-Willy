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
import { GlobalColumnData, GlobalColumnIds } from "@/config/ColumnConfig";

const { ESDB_HOST, ESDB_PORT, ESDB_USER, ESDB_PASSWORD } = process.env;

const isLocalDev = process.env.NODE_ENV !== "production";

export const config = {
  host: ESDB_HOST!,
  port: Number(ESDB_PORT!),
  user: ESDB_USER!,
  password: ESDB_PASSWORD!,
  database: "equipmentshare",
} as ClientConfig;

export const syncUsers = async (tenantId: string) => {
  const pool = new Pool({
    ...config,
  });

  const client = await pool.connect();

  const cursor = client.query(
    new Cursor<{
      user_id: number;
      username: string;
      first_name: string | null;
      last_name: string | null;
      company_id: number | null;
      branch_id: number | null;
      // The branch field is either an object or null.
      branch: {
        id: number;
        company_id: number;
        name: string;
      } | null;
      // Groups is an array of group objects.
      groups: {
        id: number;
        company_id: number;
        name: string;
      }[];
    }>(
      SQL`SELECT
      u.user_id,
      u.username,
      u.first_name,
      u.last_name,
      u.company_id,
      u.branch_id,
      /* Build the branch JSON object if a branch exists */
      CASE
        WHEN b.market_id IS NOT NULL THEN json_build_object(
          'id', b.market_id,
          'company_id', b.company_id,
          'name', b.name
        )
        ELSE NULL
      END AS branch,
      /* Aggregate each group as a JSON object into an array */
      
        json_agg(
          json_build_object(
            'id', g.organization_id,
            'company_id', g.company_id,
            'name', g.name
          ))
       AS groups
    FROM users u
    LEFT JOIN markets b ON u.branch_id = b.market_id
    LEFT JOIN organization_user_xref uxg ON u.user_id = uxg.user_id
    LEFT JOIN organizations g ON uxg.organization_id = g.organization_id
    WHERE u.company_id = $1
    GROUP BY
      u.user_id,
      u.username,
      u.first_name,
      u.last_name,
      u.company_id,
      u.branch_id,
      b.market_id,
      b.company_id,
      b.name 
        `.text,
      [tenantId]
    )
  );
  //   await client.connect();

  while (true) {
    const rows = await cursor.read(5_000);

    if (rows.length === 0) {
      break;
    }

    const updates = rows.flatMap(
      ({
        user_id,
        company_id,
        branch,
        first_name,
        last_name,
        groups,
        username,
      }) => {
        if (!company_id) return [];
        const tenant_id = company_id.toString();
        const { userSheetId, userId } = tenantIds(tenant_id);

        const _id = tenantIds(company_id).userId(user_id);

        return [
          {
            upsert: true,
            q: { _id: _id },
            u: {
              $set: {
                _id: _id,
                tenant_id: company_id.toString(),
                type_id: "record" satisfies GlobalContentTypeId,
                parent_id: userSheetId,
                hidden: false,
                sort_order: 0,
                data: {
                  name: `${first_name} ${last_name}`,
                  email: username,
                } satisfies GlobalColumnData,
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
};
