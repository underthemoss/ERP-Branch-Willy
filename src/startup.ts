import { randomUUID } from "crypto";
import { prisma } from "./lib/prisma";
import { SystemEntityTypes } from "./lib/SystemTypes";
import { EntityAttributeValueType } from "../prisma/generated/mongo";

const upsertSystemEntityType = async (props: {
  id: SystemEntityTypes;
  name: string;
  description: string;
  parentId?: SystemEntityTypes;
  abstract: boolean;
  attributes?: {
    id: string;
    name: string;
    type: EntityAttributeValueType;
    isRequired: boolean;
  }[];
  validChildEntityTypeIds?: SystemEntityTypes[];
}) => {
  const {
    id,
    name,
    description,
    attributes = [],
    parentId,
    abstract,
    validChildEntityTypeIds = [],
  } = props;
  await prisma.entityType.upsert({
    where: {
      id,
    },
    create: {
      id,
      name,
      tenantId: "SYSTEM",
      description,
      validChildEntityTypeIds,
      parentId,
      abstract,
    },
    update: {
      name,
      tenantId: "SYSTEM",
      description,
      parentId,
      validChildEntityTypeIds,
      abstract,
    },
  });
  for (const attr of attributes) {
    await prisma.entityAttribute.upsert({
      where: {
        id: attr.id,
      },
      create: {
        id: attr.id,
        name: attr.name,
        tenantId: "SYSTEM",
        type: attr.type,
        entityTypeId: id,
        isRequired: attr.isRequired,
      },
      update: {
        name: attr.name,
        tenantId: "SYSTEM",
        type: attr.type,
        entityTypeId: id,
        isRequired: attr.isRequired,
      },
    });
  }
};

export const startup = async () => {
  await upsertSystemEntityType({
    id: "base_item",
    name: "Base Item",
    description: "Base item",
    abstract: true,
    attributes: [
      { id: "item_name", type: "string", name: "Name", isRequired: true },
    ],
  });
  await upsertSystemEntityType({
    id: "workspace",
    name: "Workspace",
    description: `A workspace is a dedicated area to organize and isolate your content and operations.`,
    attributes: [
      {
        id: "workspace_description",
        name: "Description",
        type: "string",
        isRequired: false,
      },
    ],
    parentId: "base_item",
    abstract: false,
    validChildEntityTypeIds: ["folder", "list", "order", "ticket"],
  });
  await upsertSystemEntityType({
    id: "list",
    name: "List",
    description: `A list is a flexible container for storing and managing arbitrary values within a project.`,
    attributes: [],
    parentId: "base_item",
    abstract: false,
    validChildEntityTypeIds: ["list_item"],
  });
  await upsertSystemEntityType({
    id: "list_item",
    name: "List Item",
    description: `A list item stores a value within a list.`,
    attributes: [],
    parentId: "base_item",
    abstract: false,
  });
  await upsertSystemEntityType({
    id: "folder",
    name: "Folder",
    description: `A folder is used to organize and structure content within a project, supporting nested hierarchies.`,
    parentId: "base_item",
    abstract: false,
    validChildEntityTypeIds: ["folder", "order", "list", "ticket"],
  });
  await upsertSystemEntityType({
    id: "order",
    name: "Order",
    description: `An order is a request or transaction within a project that tracks items, services, and their fulfillment.`,
    parentId: "base_item",
    abstract: false,
    validChildEntityTypeIds: ["folder", "order", "line_item", "ticket"],
  });
  await upsertSystemEntityType({
    id: "ticket",
    name: "Ticket",
    description: `A ticket is a task or issue within a project that tracks progress and resolution.`,
    parentId: "base_item",
    attributes: [
      { id: "ticket_status", name: "Status", type: "string", isRequired: true },
      {
        id: "ticket_description",
        name: "Description",
        type: "string",
        isRequired: false,
      },
    ],
    abstract: false,
    validChildEntityTypeIds: [],
  });
  await upsertSystemEntityType({
    id: "line_item",
    name: "Line Item",
    description:
      "A line item represents an individual product or service listed within an order.",
    parentId: "base_item",
    attributes: [
      {
        id: "line_item_product_name",
        name: "Product",
        type: "string",
        isRequired: true,
      },
      {
        id: "line_item_unit_quantity",
        name: "Quantity",
        type: "number",
        isRequired: true,
      },
      {
        id: "line_item_unit_cost",
        name: "Cost Per Unit",
        type: "number",
        isRequired: false,
      },
    ],
    abstract: false,
  });
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
