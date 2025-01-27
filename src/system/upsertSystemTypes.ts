import { prisma } from "../lib/prisma";
import { SystemEntityTypes } from "../lib/SystemTypes";
import { ColumnType, EntityTypeIcon } from "../../prisma/generated/mongo";

const upsertSystemEntityType = async (props: {
  id: SystemEntityTypes;
  name: string;
  icon: EntityTypeIcon;
  valid_child_type_ids: SystemEntityTypes[];
}) => {
  const { id, name, icon, valid_child_type_ids } = props;

  await prisma.entityType.upsert({
    where: {
      id,
    },
    create: {
      id,
      name,
      icon,
      tenant_id: "SYSTEM",
      valid_child_type_ids,
    },
    update: {
      name,
      icon,
      tenant_id: "SYSTEM",
      valid_child_type_ids,
    },
  });
  return id;
};

export const upsertColumn = async (props: {
  id: string;
  label: string;
  type: ColumnType;
  order_priority: number;
  readonly?: boolean;
}) => {
  const { id, label, type, order_priority, readonly = false } = props;
  await prisma.column.upsert({
    where: { id },
    create: {
      tenant_id: "SYSTEM",
      id,
      label,
      type,
      order_priority,
      readonly,
      data: {},
    },
    update: {
      tenant_id: "SYSTEM",
      label,
      type,
      order_priority,
      readonly,
      data: {},
    },
  });
  return id;
};

const connectEntityTypeToColumn = async (
  entityTypeId: string,
  columnId: string
) => {
  const id = `${entityTypeId}-${columnId}`;
  await prisma.entityTypeColumn.upsert({
    where: { id },
    create: {
      tenant_id: "SYSTEM",
      entity_type_id: entityTypeId,
      column_id: columnId,
      id,
    },
    update: {
      tenant_id: "SYSTEM",
      entity_type_id: entityTypeId,
      column_id: columnId,
    },
  });
};

const upsertSystemTypes = async () => {
  const createdBy = await upsertColumn({
    id: "created_by",
    label: "Created By",
    type: "user",
    readonly: true,
    order_priority: 0,
  });
  const createdAt = await upsertColumn({
    id: "created_at",
    label: "Created At",
    type: "date",
    readonly: true,
    order_priority: 0,
  });
  const updatedBy = await upsertColumn({
    id: "updated_by",
    label: "Updated By",
    type: "user",
    readonly: true,
    order_priority: 0,
  });
  const updatedAt = await upsertColumn({
    id: "updated_at",
    label: "Updated At",
    type: "date",
    readonly: true,
    order_priority: 0,
  });

  const nameColumn = await upsertColumn({
    id: "name",
    label: "Title",
    type: "single_line_of_text",
    order_priority: 100,
  });

  const descriptionColumn = await upsertColumn({
    id: "description",
    label: "Description",
    type: "single_line_of_text",
    order_priority: 90,
  });

  const firstNameColumn = await upsertColumn({
    id: "person_first_name",
    label: "First Name",
    type: "single_line_of_text",
    order_priority: 80,
  });
  const lastNameColumn = await upsertColumn({
    id: "person_last_name",
    label: "Last Name",
    type: "single_line_of_text",
    order_priority: 70,
  });

  const dueDateColumn = await upsertColumn({
    id: "due_date",
    label: "Due Date",
    type: "date",
    order_priority: 70,
  });

  const personColumn = await upsertColumn({
    id: "user",
    label: "User",
    type: "user",
    order_priority: 60,
  });
  const imgUrlColumn = await upsertColumn({
    id: "user",
    label: "Image URL",
    type: "img_url",
    order_priority: 60,
  });

  // const listTypeId = await upsertSystemEntityType({
  //   id: "system_list",
  //   name: "List",
  //   icon: "list",
  //   valid_child_type_ids: [],
  // });

  // await connectEntityTypeToColumn(listTypeId, nameColumn);

  const workspaceId = await upsertSystemEntityType({
    id: "system_workspace",
    name: "Workspace",
    icon: "workspace",
    valid_child_type_ids: [
      "system_folder",
      "system_item",
      "system_parent_column",
    ],
  });

  await connectEntityTypeToColumn(workspaceId, nameColumn);

  const folderId = await upsertSystemEntityType({
    id: "system_folder",
    name: "Folder",
    icon: "folder",
    valid_child_type_ids: [
      "system_folder",
      "system_item",
      "system_parent_column",
    ],
  });

  await connectEntityTypeToColumn(folderId, nameColumn);

  const itemId = await upsertSystemEntityType({
    id: "system_item",
    name: "Item",
    icon: "document",
    valid_child_type_ids: [
      "system_folder",
      "system_item",
      "system_parent_column",
    ],
  });

  await connectEntityTypeToColumn(itemId, nameColumn);

  const columnRefId = await upsertColumn({
    id: "column_id",
    label: "Column ID",
    type: "single_line_of_text",
    order_priority: 60,
  });
  const columnWidth = await upsertColumn({
    id: "column_width",
    label: "Column Width",
    type: "integer",
    order_priority: 60,
  });
  const parentColumnItem = await upsertSystemEntityType({
    id: "system_parent_column",
    name: "Parent column",
    icon: "system",
    valid_child_type_ids: [],
  });
  await connectEntityTypeToColumn(parentColumnItem, nameColumn);
  await connectEntityTypeToColumn(parentColumnItem, columnRefId);
  await connectEntityTypeToColumn(parentColumnItem, columnWidth);
};

upsertSystemTypes();
