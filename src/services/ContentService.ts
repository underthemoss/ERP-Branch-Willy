import { prisma } from "@/lib/prisma";
import { ColumnType, EntityTypeIcon } from "../../prisma/generated/mongo";
import { GlobalColumnData, GlobalColumnIds } from "@/config/ColumnConfig";
import { randomUUID } from "crypto";
import { getUser } from "@/lib/auth";
import {
  ContentTypeData,
  GlobalContentTypeEnum,
  GlobalContentTypeId,
} from "@/config/ContentTypesConfig";

export const upsertColumn = async (args: {
  id: string;
  tenantId: string | "SYSTEM";
  label: string;
  type: ColumnType;
  order: number;
  readonly: boolean;
  category: string;
}) => {
  await prisma.column.upsert({
    where: { id: args.id },
    create: {
      id: args.id,
      tenant_id: args.tenantId,
      data: {},
      label: args.label,
      type: args.type,
      order_priority: args.order,
      readonly: args.readonly,
      category: args.category,
    },
    update: {
      tenant_id: args.tenantId,
      data: {},
      label: args.label,
      type: args.type,
      order_priority: args.order,
      readonly: args.readonly,
      category: args.category,
    },
  });
};

export const upsertContentType = async (args: {
  id: string;
  tenant: string | "SYSTEM";
  label: string;
  valid_child_types: string[];
  icon: EntityTypeIcon;
  columns: string[];
  category: string;
  required: string[];
}) => {
  await prisma.entityType.upsert({
    where: { id: args.id },
    create: {
      id: args.id,
      icon: args.icon,
      name: args.label,
      tenant_id: args.tenant,
      valid_child_type_ids: args.valid_child_types,
      category: args.category,
    },
    update: {
      icon: args.icon,
      name: args.label,
      tenant_id: args.tenant,
      valid_child_type_ids: args.valid_child_types,
      category: args.category,
    },
  });
  for (const colId of args.columns) {
    const id = `${args.id}-${colId}`;
    await prisma.entityTypeColumn.upsert({
      where: { id },
      create: {
        id: id,
        tenant_id: args.tenant,
        column_id: colId,
        entity_type_id: args.id,
        required: args.required.some((r) => r === colId),
      },
      update: {
        tenant_id: args.tenant,
        column_id: colId,
        entity_type_id: args.id,
        required: args.required.some((r) => r === colId),
      },
    });
  }
};

export const getContentType = async (args: {
  tenantId: string;
  contentTypeId: string;
}) => {
  const tenant_id = { in: [args.tenantId, "SYSTEM"] };

  const contentType = await prisma.entityType.findFirstOrThrow({
    where: {
      tenant_id,
      id: args.contentTypeId,
    },
    include: {
      entity_type_columns: {
        where: {
          tenant_id,
        },
        include: {
          column: true,
        },
      },
    },
  });

  return contentType;
};

export const createSystemContentTypeInstance = async <
  T extends GlobalContentTypeId
>(args: {
  attributes: ContentTypeData<T>;
  contentTypeId: T;
  parentId: string | undefined;
}) => {
  await createContentTypeInstance(args);
};

export const createContentTypeInstance = async (args: {
  attributes: GlobalColumnData;
  contentTypeId: string;
  parentId: string | undefined;
}) => {
  const { user } = await getUser();
  const id = randomUUID();

  await getContentType({
    tenantId: user.company_id,
    contentTypeId: args.contentTypeId,
  });

  const data: GlobalColumnData = {
    ...args.attributes,

    created_by: user.user_id,
    updated_by: user.user_id,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const createdEntity = await prisma.entity.create({
    data: {
      id,
      parent_id: args.parentId,
      tenant_id: user.company_id,
      type_id: args.contentTypeId,
      column_config: [
        {
          type: "single_line_of_text",
          hidden: false,
          label: "Name",
          key: "name",
          readonly: false,
          width: 300,
        },
      ],
      data: data,
    },
  });

  return createdEntity;
};
