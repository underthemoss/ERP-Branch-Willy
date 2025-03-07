import { ContentTypeDataModel } from "@/types/generated/content-types";

const encodePartsURLSafe = (...parts: string[]) => {
  return Buffer.from(parts.join("|"))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

export const deterministicId = (
  tenant: string,
  type: ContentTypeDataModel["type"],
  id: string
) => {
  return encodePartsURLSafe(tenant, type, id);
};
export const decodeDeterministicId = (
  encodedId: string
): { tenant: string; type: ContentTypeDataModel["type"]; id: string } => {
  const [tenant, type, id] = Buffer.from(encodedId, "base64")
    .toString("utf-8")
    .split("|");
  return {
    tenant,
    type: type as ContentTypeDataModel["type"],
    id,
  };
};
