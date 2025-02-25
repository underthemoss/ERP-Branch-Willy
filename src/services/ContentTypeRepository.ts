"use server";
import { prisma } from "@/lib/prisma";
import {
  ContentTypeConfigType,
} from "../../prisma/generated/mongo";
import { getUser } from "@/lib/auth";

import { systemContentTypesConfig } from "./SystemContentTypes";
import { revalidatePath } from "next/cache";
import _ from "lodash";

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
