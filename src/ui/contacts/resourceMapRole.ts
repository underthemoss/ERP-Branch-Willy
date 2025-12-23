import { ResourceMapTagType } from "@/graphql/graphql";

type ResourceMapEntryLike = {
  tagType?: ResourceMapTagType | string | null;
  value?: string | null;
} | null;

export function getRoleFromResourceMapEntries(
  entries?: ResourceMapEntryLike[] | null,
): string | null {
  if (!entries?.length) return null;

  const roleEntry = entries.find((entry) => {
    const tagType = entry?.tagType ?? null;
    return tagType === ResourceMapTagType.Role || tagType === "ROLE";
  });

  return roleEntry?.value ?? null;
}
