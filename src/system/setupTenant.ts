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
import _ from "lodash";

const { ESDB_HOST, ESDB_PORT, ESDB_USER, ESDB_PASSWORD } = process.env;

const isLocalDev = process.env.NODE_ENV !== "production";

export const config = {
  host: ESDB_HOST!,
  port: Number(ESDB_PORT!),
  user: ESDB_USER!,
  password: ESDB_PASSWORD!,
  database: "equipmentshare",
} as ClientConfig;

const upsertWorkspace = (args: {
  id: string;
  name: string;
  tenant_id: string;
}) => {
  return {
    upsert: true,
    q: { _id: args.id },
    u: {
      $set: {
        _id: args.id,
        tenant_id: args.tenant_id,
        type_id: "workspace" satisfies GlobalContentTypeId,
        parent_id: null,
        hidden: false,
        sort_order: 0,
        data: {
          name: args.name,
        } satisfies ContentTypeData<"workspace">,
      } satisfies Omit<Entity, "id"> & { _id: string },
    },
  };
};
const upsertItemColumn = (args: {
  id: string;
  tenant_id: string;
  parent_id: string;
  name: string;
  column: GlobalColumnIds;
  width?: number;
}) => {
  return {
    upsert: true,
    q: { _id: args.id },
    u: {
      $set: {
        _id: args.id,
        tenant_id: args.tenant_id,
        type_id: "parent_column_config" satisfies GlobalContentTypeId,
        parent_id: args.parent_id,
        hidden: true,
        sort_order: 0,
        data: {
          name: args.name,
          parent_column_config__column_id: args.column,
          parent_column_config__column_width: args.width || 300,
        } satisfies ContentTypeData<"parent_column_config">,
      } satisfies Omit<Entity, "id"> & { _id: string },
    },
  };
};

const upsertSheet = (args: {
  id: string;
  tenant_id: string;
  parent_id: string;
  name: string;
}) => {
  return {
    upsert: true,
    q: { _id: args.id },
    u: {
      $set: {
        _id: args.id,
        tenant_id: args.tenant_id,
        type_id: "sheet" satisfies GlobalContentTypeId,
        parent_id: args.parent_id,
        hidden: false,
        sort_order: 0,
        data: {
          name: args.name,
        } satisfies ContentTypeData<"sheet">,
      } satisfies Omit<Entity, "id"> & { _id: string },
    },
  };
};

export const setupTenant = async (tenantId: string) => {
  const pool = new Pool({
    ...config,
  });

  const client = await pool.connect();

  const cursor = client.query(
    new Cursor<{ company_id: number; name: string }>(
      SQL`SELECT company_id, name FROM companies where company_id = $1`.text,
      [tenantId]
    )
  );

  while (true) {
    const rows = await cursor.read(3_000);
    console.log(rows.length);
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
        userSheetNameColumn,
        assetsSheetColumn,
        branchesSheeNameColumntId,
      } = tenantIds(tenant_id);

      return [
        /**
         * T3 Workspace
         */
        upsertWorkspace({ id: t3WorkspaceId, name: "T3", tenant_id }),
        upsertItemColumn({
          column: "name",
          id: t3WorkspaceNameColumnId,
          name: "Name",
          parent_id: t3WorkspaceId,
          tenant_id,
        }),

        /**
         * Users Collection
         */
        upsertSheet({
          id: userSheetId,
          tenant_id,
          name: "Users",
          parent_id: t3WorkspaceId,
        }),
        upsertItemColumn({
          column: "name",
          id: userSheetNameColumn("name"),
          name: "Name",
          parent_id: userSheetId,
          tenant_id,
        }),
        upsertItemColumn({
          column: "email",
          id: userSheetNameColumn("email"),
          name: "Email",
          parent_id: userSheetId,
          tenant_id,
        }),

        /**
         * Assets Collection
         */
        upsertSheet({
          id: assetsSheetId,
          tenant_id,
          name: "Assets",
          parent_id: t3WorkspaceId,
        }),
        upsertItemColumn({
          column: "equipment_photo",
          id: assetsSheetColumn("equipment_photo"),
          name: "Photo",
          parent_id: assetsSheetId,
          tenant_id,
          width: 120,
        }),
        upsertItemColumn({
          column: "name",
          id: assetsSheetColumn("name"),
          name: "Name",
          parent_id: assetsSheetId,
          tenant_id,
          width: 180,
        }),
        upsertItemColumn({
          column: "location",
          id: assetsSheetColumn("location"),
          name: "Location",
          parent_id: assetsSheetId,
          tenant_id,
          width: 120,
        }),
        upsertItemColumn({
          column: "equipment_make",
          id: assetsSheetColumn("equipment_make"),
          name: "Make",
          parent_id: assetsSheetId,
          tenant_id,
          width: 180,
        }),
        upsertItemColumn({
          column: "equipment_model",
          id: assetsSheetColumn("equipment_model"),
          name: "Model",
          parent_id: assetsSheetId,
          tenant_id,
          width: 200,
        }),
        upsertItemColumn({
          column: "equipment_category",
          id: assetsSheetColumn("equipment_category"),
          name: "Category",
          parent_id: assetsSheetId,
          tenant_id,
        }),
        upsertItemColumn({
          column: "equipment_class",
          id: assetsSheetColumn("equipment_class"),
          name: "Class",
          parent_id: assetsSheetId,
          tenant_id,
        }),
        upsertItemColumn({
          column: "equipment_custom_model",
          id: assetsSheetColumn("equipment_custom_model"),
          name: "Custom Model",
          parent_id: assetsSheetId,
          tenant_id,
          width: 190,
        }),

        /**
         * Branch Collection
         */
        upsertSheet({
          id: branchesSheetId,
          tenant_id,
          name: "Branches",
          parent_id: t3WorkspaceId,
        }),
        upsertItemColumn({
          column: "name",
          id: branchesSheeNameColumntId,
          name: "Name",
          parent_id: branchesSheetId,
          tenant_id,
        }),
      ];
    });

    for (const update of _.chunk(updates, 1000)) {
      await prisma.$runCommandRaw({
        update: "Entity",
        updates: update,
      });
    }
  }
};
