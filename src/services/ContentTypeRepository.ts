"use server";
import { prisma } from "@/lib/prisma";
import {
  ContentTypesConfig,
  ContentTypeConfigType,
} from "../../prisma/generated/mongo";
import { getUser } from "@/lib/auth";

import { SystemContentTypeIds } from "./SystemContentTypes";
import { revalidatePath } from "next/cache";

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
