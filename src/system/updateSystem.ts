import { GLOBAL_COLUMNS } from "@/config/ColumnConfig";
import { GLOBAL_CONTENT_TYPES } from "@/config/ContentTypesConfig";
import { upsertColumn, upsertContentType } from "@/services/ContentService";

export const run = async () => {
  await Promise.all(
    GLOBAL_COLUMNS.map(async (col) => {
      await upsertColumn({
        id: col.id,
        label: col.label,
        order: col.order_priority,
        readonly: col.readonly,
        tenantId: "SYSTEM",
        type: col.type,
        category: col.category,
      });
    })
  );

  await Promise.all(
    GLOBAL_CONTENT_TYPES.map(async (ct) => {
      await upsertContentType({
        columns: ct.columns,
        icon: ct.icon,
        id: ct.id,
        label: ct.name,
        tenant: "SYSTEM",
        valid_child_types: ct.valid_child_types,
        category: ct.category,
        required: ct.required,
      });
    })
  );
};
