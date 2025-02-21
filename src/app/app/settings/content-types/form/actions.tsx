"use server";
import { randomUUID } from "crypto";
import {
  ContentType,
  ContentTypeAttribute,
} from "../../../../../../prisma/generated/mongo";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import _ from "lodash";

// export const saveContentType = async (data: {
//   label: string;
//   attributes: ContentTypeAttribute[];
//   parent_id: string | null;
// }) => {
//   const { user } = await getUser();
//   await prisma.contentType.create({
//     data: {
//       id: randomUUID(),
//       label: data.label,
//       tenant_id: user.company_id,
//       attributes: data.attributes,
//       parent_id: data.parent_id,
//     },
//   });
//   redirect("/app/settings/content-types");
// };

// type UpsertContentTypeState = {
//   contentTypes: ContentType[];
//   label: string;
//   attributes: ContentTypeAttribute[];
//   error?: {
//     message: string;
//   };
// };

// export const upsertContentType = async (
//   data: Pick<ContentType, "id" | "label" | "attributes" | "parent_id">
// ): Promise<UpsertContentTypeState> => {
//   const { user } = await getUser();
//   await prisma.contentType.create({
//     data: {
//       ...data,
//       id: data.id || randomUUID(),
//       tenant_id: user.company_id,
//       attributes: data.attributes.map((attr) => ({
//         ...attr,
//         key: attr.key || randomUUID(),
//       })),
//     },
//   });
//   redirect("/app/settings/content-types");
// };
