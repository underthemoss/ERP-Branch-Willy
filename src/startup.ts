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
    key: string;
    label: string;
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
      attributes: attributes.map((attr) => ({
        key: attr.key,
        label: attr.label,
        type: attr.type,
        isRequired: attr.isRequired,
      })),
    },
    update: {
      name,
      tenantId: "SYSTEM",
      description,
      parentId,
      validChildEntityTypeIds,
      abstract,
      attributes: attributes.map((attr) => ({
        key: attr.key,
        label: attr.label,
        type: attr.type,
        isRequired: attr.isRequired,
      })),
    },
  });
  // for (const attr of attributes) {
  //   await prisma.entityAttribute.upsert({
  //     where: {
  //       id: attr.id,
  //     },
  //     create: {
  //       id: attr.id,
  //       name: attr.name,
  //       tenantId: "SYSTEM",
  //       type: attr.type,
  //       entityTypeId: id,
  //       isRequired: attr.isRequired,
  //     },
  //     update: {
  //       name: attr.name,
  //       tenantId: "SYSTEM",
  //       type: attr.type,
  //       entityTypeId: id,
  //       isRequired: attr.isRequired,
  //     },
  //   });
  // }
};

export const startup = async () => {
  await upsertSystemEntityType({
    id: "system",
    name: "System",
    description: "System",
    abstract: true,
  });

  // await upsertSystemEntityType({
  //   id: "system-content_restriction",
  //   name: "Content restriction",
  //   description: "Used to restrict what content can be added to the parent",
  //   parentId: "system",
  //   abstract: true,
  //   attributes: [
  //     {
  //       id: "content_restriction_allowed_type",
  //       type: "string",
  //       name: "Allowed type",
  //       isRequired: true,
  //     },
  //   ],
  // });

  await upsertSystemEntityType({
    id: "system_folder",
    name: "Folder",
    description: `A folder is used to organize and structure content within a project, supporting nested hierarchies.`,
    parentId: "system",
    abstract: false,
    validChildEntityTypeIds: [
      "system_folder",
      "system_folder_order",
      "system_folder_list",
      "system_document_ticket",
    ],
    attributes: [
      { key: "item_title", type: "string", label: "Title", isRequired: true },
    ],
  });

  await upsertSystemEntityType({
    id: "system_document",
    name: "Document",
    description: `A document is a generic item that cannot contain further items.`,
    parentId: "system",
    abstract: false,
    validChildEntityTypeIds: [
      "system_folder",
      "system_folder_order",
      "system_folder_list",
      "system_document_ticket",
    ],
    attributes: [
      { key: "item_title", type: "string", label: "Title", isRequired: true },
    ],
  });

  await upsertSystemEntityType({
    id: "system_workspace",
    name: "Workspace",
    description: `A workspace is a dedicated area to organize and isolate your content and operations.`,
    attributes: [
      { key: "item_title", type: "string", label: "Title", isRequired: true },
      {
        key: "workspace_description",
        label: "Description",
        type: "string",
        isRequired: false,
      },
    ],
    parentId: "system",
    abstract: false,
    validChildEntityTypeIds: [
      "system_folder",
      "system_folder_list",
      "system_folder_order",
      "system_document_ticket",
    ],
  });
  await upsertSystemEntityType({
    id: "system_folder_list",
    name: "List",
    description: `A list is a flexible container for storing and managing arbitrary values within a project.`,
    attributes: [],
    parentId: "system_folder",
    abstract: false,
    validChildEntityTypeIds: ["system_document_listitem"],
  });
  await upsertSystemEntityType({
    id: "system_document_listitem",
    name: "List Item",
    description: `A list item stores a value within a list.`,
    attributes: [],
    parentId: "system_document",
    abstract: false,
  });
  await upsertSystemEntityType({
    id: "system_folder_order",
    name: "Order",
    description: `An order is a request or transaction within a project that tracks items, services, and their fulfillment.`,
    parentId: "system_folder",
    abstract: false,
    validChildEntityTypeIds: [
      "system_folder_order",
      "system_document_lineitem",
      "system_document_ticket",
    ],
  });
  await upsertSystemEntityType({
    id: "system_document_ticket",
    name: "Ticket",
    description: `A ticket is a task or issue within a project that tracks progress and resolution.`,
    parentId: "system_document",
    attributes: [
      {
        key: "ticket_status",
        label: "Status",
        type: "string",
        isRequired: true,
      },
      {
        key: "ticket_description",
        label: "Description",
        type: "string",
        isRequired: false,
      },
    ],
    abstract: false,
    validChildEntityTypeIds: [],
  });
  await upsertSystemEntityType({
    id: "system_document_lineitem",
    name: "Line Item",
    description:
      "A line item represents an individual product or service listed within an order.",
    parentId: "system_document",
    attributes: [
      {
        key: "line_item_product_name",
        label: "Product",
        type: "string",
        isRequired: true,
      },
      {
        key: "line_item_unit_quantity",
        label: "Quantity",
        type: "number",
        isRequired: true,
      },
      {
        key: "line_item_unit_cost",
        label: "Cost Per Unit",
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
