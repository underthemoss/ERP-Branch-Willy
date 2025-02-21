"use server";
import { prisma } from "@/lib/prisma";
import {
  ContentType,
  ContentTypeAttribute,
  ContentTypesConfig,
  ContentTypeConfigField,
  ContentTypeConfigType,
} from "../../prisma/generated/mongo";
import { getUser } from "@/lib/auth";
import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { SystemContentTypeIds } from "./SystemContentTypes";
import { revalidatePath } from "next/cache";

export type ContentTypeDefinition = ContentType & {
  inheritedAttributes: (ContentTypeAttribute & {
    contentType: ContentType;
  })[];
  allAttributes: (ContentTypeAttribute & {
    contentType: ContentType;
  })[];
  inheritsFrom?: ContentType | null;
  inheritageLineage: string[];
  validChildContentTypes: ContentType[];
  descendants: ContentType[];
};

const getDescendants = (
  contentType: ContentType,
  contentTypes: ContentType[]
): ContentType[] => {
  if (!contentType) return [];
  const children = contentTypes.filter((ct) => ct.parent_id === contentType.id);
  return [
    ...children,
    ...children.flatMap((ct) => getDescendants(ct, contentTypes)),
  ];
};

const traverseContentTypeHierarchy = (
  contentTypes: ContentType[],
  contentType: ContentType | undefined,
  inheritedAttributes: (ContentTypeAttribute & {
    contentType: ContentType;
  })[] = [],
  inheritageLineage: string[] = []
): ContentTypeDefinition[] => {
  if (!contentType) return [];
  return [
    {
      ...contentType,
      inheritageLineage,
      inheritedAttributes,
      allAttributes: [
        ...inheritedAttributes,
        ...contentType.attributes.map((attr) => ({
          ...attr,
          contentType: contentType,
        })),
      ],
      inheritsFrom: contentTypes.find((ct) => ct.id === contentType.parent_id),
      validChildContentTypes: contentType.allowed_child_content_types
        .map((id) => contentTypes.find((ct) => ct.id === id)!)
        .filter(Boolean),
      descendants: getDescendants(contentType, contentTypes),
    },
    ...contentTypes
      .filter((ct) => ct.parent_id === contentType.id)
      .flatMap((ct) =>
        traverseContentTypeHierarchy(
          contentTypes,
          ct,
          [
            ...inheritedAttributes,
            ...contentType.attributes.map((attr) => ({
              ...attr,
              contentType: contentType,
            })),
          ],
          [...inheritageLineage, ct.id]
        )
      ),
  ];
};

const systemContentTypes: (tenant: string) => ContentType[] = (tenant) => [
  {
    id: SystemContentTypeIds.Item,
    tenant_id: tenant,
    label: "Item",
    color: "#000000",
    icon: "LabelImportant",
    allowed_child_content_types: [],
    parent_id: null,
    attributes: [
      {
        label: "Name",
        type: "single_line_of_text",
        key: "01JMFEAMJYA1D9EG99QQNB9JJJ",
      },
    ],
    abstract: true,
  },
  {
    id: SystemContentTypeIds.Workspace,
    tenant_id: tenant,
    label: "Workspace",
    color: "#03a9f4",
    icon: "GridView",
    allowed_child_content_types: [
      SystemContentTypeIds.Workspace,
      SystemContentTypeIds.Folder,
      SystemContentTypeIds.Document,
    ],
    parent_id: SystemContentTypeIds.Item,
    attributes: [],
    abstract: false,
  },
  {
    id: SystemContentTypeIds.Folder,
    tenant_id: tenant,
    label: "Folder",
    color: "#ff9800",
    icon: "Folder",
    allowed_child_content_types: [
      SystemContentTypeIds.Folder,
      SystemContentTypeIds.Document,
    ],
    parent_id: SystemContentTypeIds.Item,
    attributes: [],
    abstract: false,
  },
  {
    id: SystemContentTypeIds.Document,
    tenant_id: tenant,
    label: "Document",
    color: "#03a9f4",
    icon: "InsertDriveFile",
    allowed_child_content_types: [],
    parent_id: SystemContentTypeIds.Item,
    attributes: [],
    abstract: false,
  },
];

// todo: deprecate in favour of getContentTypeConfig
// export const getContentTypes = async () => {
//   const { user } = await getUser();

//   const systemMixins = systemContentTypes(user.company_id);
//   const tenantDefinedTypes = await prisma.contentType.findMany({
//     where: { tenant_id: user.company_id },
//   });

//   const allContentTypes = [...systemMixins, ...tenantDefinedTypes];

//   const contentTypeIdsUnion = [...new Set(allContentTypes.map((ct) => ct.id))];

//   const contentTypes = contentTypeIdsUnion.map((id) => {
//     const systemType = systemMixins.find((ct) => ct.id === id);
//     const tenantDefinedType = tenantDefinedTypes.find((ct) => ct.id === id);
//     const attributeKeysUnion = [
//       ...new Set([
//         ...(systemType?.attributes || []).map((a) => a.key),
//         ...(tenantDefinedType?.attributes || []).map((a) => a.key),
//       ]),
//     ];
//     const allowedChildContentTypes = [
//       ...new Set([
//         ...(systemType?.allowed_child_content_types || []),
//         ...(tenantDefinedType?.allowed_child_content_types || []),
//       ]),
//     ];
//     return {
//       ...systemType,
//       ...tenantDefinedType,
//       attributes: attributeKeysUnion.map(
//         (key) =>
//           systemType?.attributes.find((attr) => attr.key === key) ||
//           tenantDefinedType?.attributes.find((attr) => attr.key === key)
//       ),
//       allowed_child_content_types: allowedChildContentTypes,
//     } as ContentType;
//   });

//   const flattenedContentTypes = contentTypes
//     .filter((ct) => ct.parent_id === null)
//     .flatMap((ct) => traverseContentTypeHierarchy(contentTypes, ct));

//   return flattenedContentTypes;
// };

// export const upsertContentType = async (
//   data: Omit<ContentType, "tenant_id">
// ) => {
//   const { user } = await getUser();
//   const { id, ...rest } = data;

//   const contentType = await prisma.contentType.upsert({
//     where: { tenant_id: user.company_id, id },
//     create: {
//       ...rest,
//       tenant_id: user.company_id,
//       id: id || randomUUID(),
//     },
//     update: {
//       ...rest,
//       tenant_id: user.company_id,
//     },
//   });

//   return contentType;
// };

////////////////////////////////////////////////////////////////////////////////////////////////

const systemContentTypesConfig: ContentTypesConfig = {
  id: "",
  tenant_id: "",
  types: [
    {
      id: SystemContentTypeIds.Item,
      label: "Item",
      color: "#000000",
      icon: "LabelImportant",
      allowed_child_content_types: [],
      parent_id: "",
      fields: [
        {
          id: "01JMFEAMJYA1D9EG99QQNB9JJJ",
          label: "Name",
          type: "text",
        },
      ],
      abstract: true,
    },
    {
      id: SystemContentTypeIds.Workspace,
      label: "Workspace",
      color: "#03a9f4",
      icon: "GridView",
      allowed_child_content_types: [
        SystemContentTypeIds.Workspace,
        SystemContentTypeIds.Folder,
        SystemContentTypeIds.Document,
      ],
      parent_id: SystemContentTypeIds.Item,
      fields: [],
      abstract: false,
    },
    {
      id: SystemContentTypeIds.Folder,

      label: "Folder",
      color: "#ff9800",
      icon: "Folder",
      allowed_child_content_types: [
        SystemContentTypeIds.Folder,
        SystemContentTypeIds.Document,
      ],
      parent_id: SystemContentTypeIds.Item,
      fields: [],
      abstract: false,
    },
    {
      id: SystemContentTypeIds.Document,
      label: "Document",
      color: "#03a9f4",
      icon: "InsertDriveFile",
      allowed_child_content_types: [],
      parent_id: SystemContentTypeIds.Item,
      fields: [],
      abstract: true,
    },
    {
      id: "tempid",
      label: "Special Document",
      color: "#03a9f4",
      icon: "InsertDriveFile",
      allowed_child_content_types: [],
      parent_id: SystemContentTypeIds.Document,
      fields: [],
      abstract: false,
    },
  ],
};

export const getContentTypeConfig = async () => {
  const { user } = await getUser();
  const config = await prisma.contentTypesConfig.findFirst({
    where: { tenant_id: user.company_id },
  });
  return { ...systemContentTypesConfig, ...config };
};

export const saveContentTypeConfig = async (data: ContentTypeConfigType[]) => {
  const { user } = await getUser();
  const config = await prisma.contentTypesConfig.upsert({
    where: { id: user.company_id, tenant_id: user.company_id },
    create: {
      id: user.company_id,
      tenant_id: user.company_id,
      types: data,
    },
    update: {
      tenant_id: user.company_id,
      types: data,
    },
  });
  revalidatePath("/");
  return config;
};
