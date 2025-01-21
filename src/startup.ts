import { randomUUID } from "crypto";
import { prisma } from "./lib/prisma";
import { SystemEntityTypes } from "./lib/SystemTypes";
import {
  EntityAttributeValueType,
  EntityTypeIcon,
} from "../prisma/generated/mongo";

const upsertSystemEntityType = async (props: {
  id: SystemEntityTypes;
  name: string;
  description: string;
  parentId?: SystemEntityTypes;
  abstract: boolean;
  icon: EntityTypeIcon;
  hidden?: boolean;
  columnIds?: string[];
  validChildEntityTypeIds?: SystemEntityTypes[];
}) => {
  const {
    id,
    name,
    description,
    columnIds = [],
    parentId,
    abstract,
    hidden = false,
    icon,
    validChildEntityTypeIds = [],
  } = props;

  await prisma.entityType.upsert({
    where: {
      id,
    },
    create: {
      id,
      name,
      icon,
      tenantId: "SYSTEM",
      description,
      validChildEntityTypeIds,
      parentId,
      abstract,
      columnIds,
      hidden,
    },
    update: {
      name,
      tenantId: "SYSTEM",
      description,
      parentId,
      validChildEntityTypeIds,
      abstract,
      columnIds,
      hidden,
    },
  });
  return id;
};

const createColumn = async (props: {
  id: string;
  isRequired: boolean;
  label: string;
  type: EntityAttributeValueType;
}) => {
  const { id, isRequired, label, type } = props;
  await prisma.entityTypeColumn.upsert({
    where: { id },
    create: {
      tenantId: "SYSTEM",
      id,
      isRequired,
      label,
      type,
    },
    update: {
      isRequired,
      label,
      type,
    },
  });
  return id;
};

export const startup = async () => {
  const nameColumn = await createColumn({
    id: "name",
    label: "Title",
    isRequired: true,
    type: "single_line_of_text",
  });

  const descriptionColumn = await createColumn({
    id: "description",
    label: "Description",
    isRequired: false,
    type: "multiple_lines_of_text",
  });

  const referenceIdColumn = await createColumn({
    id: "reference_id",
    label: "Reference ID",
    isRequired: true,
    type: "single_line_of_text",
  });

  await upsertSystemEntityType({
    id: "system",
    name: "System",
    description: "System",
    abstract: true,
    icon: "system",
    hidden: true,
  });

  await upsertSystemEntityType({
    id: "system_list",
    name: "List",
    icon: "list",
    description: `A list is a flexible container for storing and managing arbitrary values within a project.`,
    parentId: "system",
    abstract: false,
    columnIds: [nameColumn, descriptionColumn],
    validChildEntityTypeIds: ["system_item"],
  });

  await upsertSystemEntityType({
    id: "system_workspace",
    name: "Workspace",
    icon: "workspace",
    description: `A workspace is a dedicated area to organize and isolate your content and operations.`,
    columnIds: [nameColumn, descriptionColumn],
    parentId: "system",
    abstract: false,
    validChildEntityTypeIds: [
      "system_folder",
      "system_list",
      // "system_reference",
    ],
  });

  await upsertSystemEntityType({
    id: "system_folder",
    name: "Folder",
    icon: "folder",
    description: `A folder is used to organize and structure content within a project, supporting nested hierarchies.`,
    parentId: "system",
    abstract: false,
    validChildEntityTypeIds: ["system_list", "system_folder"],
    columnIds: [nameColumn],
  });

  await upsertSystemEntityType({
    id: "system_item",
    name: "Document",
    icon: "document",
    description: `A document is a generic item that cannot contain further items.`,
    parentId: "system",
    abstract: false,
    validChildEntityTypeIds: [],
    columnIds: [],
  });

  await upsertSystemEntityType({
    id: "system_item",
    name: "Document",
    icon: "document",
    description: `A document is a generic item that cannot contain further items.`,
    parentId: "system",
    abstract: false,
    validChildEntityTypeIds: [],
    columnIds: [],
  });

  await upsertSystemEntityType({
    id: "system_reference",
    name: "Reference",
    icon: "document",
    description: `A reference is a pointer to another entity in the system.`,
    parentId: "system",
    abstract: false,
    validChildEntityTypeIds: [],
    columnIds: [referenceIdColumn],
  });

  // await upsertSystemEntityType({
  //   id: "system_item_document_listitem",
  //   name: "List Item",
  //   icon: "list_item",
  //   description: `A list item stores a value within a list.`,
  //   attributes: [],
  //   parentId: "system_item_document",
  //   abstract: false,
  // });
  // await upsertSystemEntityType({
  //   id: "system_item_folder_order",
  //   name: "Order",
  //   icon: "order",
  //   description: `An order is a request or transaction within a project that tracks items, services, and their fulfillment.`,
  //   parentId: "system_item_folder",
  //   abstract: false,
  //   validChildEntityTypeIds: [
  //     "system_item_folder_order",
  //     "system_item_document_lineitem",
  //     "system_item_document_ticket",
  //   ],
  // });
  // await upsertSystemEntityType({
  //   id: "system_item_document_ticket",
  //   name: "Ticket",
  //   icon: "ticket",
  //   description: `A ticket is a task or issue within a project that tracks progress and resolution.`,
  //   parentId: "system_item_document",
  //   attributes: [
  //     {
  //       key: "ticket_status",
  //       label: "Status",
  //       type: "string",
  //       isRequired: true,
  //     },
  //     {
  //       key: "ticket_description",
  //       label: "Description",
  //       type: "string",
  //       isRequired: false,
  //     },
  //   ],
  //   abstract: false,
  //   validChildEntityTypeIds: [],
  // });
  // await upsertSystemEntityType({
  //   id: "system_item_document_lineitem",
  //   name: "Line Item",
  //   icon: "line_item",
  //   description:
  //     "A line item represents an individual product or service listed within an order.",
  //   parentId: "system_item_document",
  //   attributes: [
  //     {
  //       key: "line_item_product_name",
  //       label: "Product",
  //       type: "string",
  //       isRequired: true,
  //     },
  //     {
  //       key: "line_item_unit_quantity",
  //       label: "Quantity",
  //       type: "number",
  //       isRequired: true,
  //     },
  //     {
  //       key: "line_item_unit_cost",
  //       label: "Cost Per Unit",
  //       type: "number",
  //       isRequired: false,
  //     },
  //   ],
  //   abstract: false,
  // });

  await prisma.$runCommandRaw({
    createIndexes: "Entity",
    indexes: [
      {
        key: { "attributes.$**": 1 },
        name: "attributes_wildcard_index",
      },
    ],
  });
};
