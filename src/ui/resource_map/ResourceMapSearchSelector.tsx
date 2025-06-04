import { graphql } from "@/graphql";
import { useListResourceMapEntriesQuery } from "@/graphql/hooks";
import _ from "lodash";
import * as React from "react";
import { RMTreeView } from "./RMTreeView";

export const ListResourceMapEntriesQuery = graphql(`
  query ListResourceMapEntries {
    listResourceMapEntries {
      id
      hierarchy_id
      parent_id
      path
      value
      children {
        id
      }
    }
  }
`);
type ResourceMapSearchSelectorProps = {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  readonly: boolean;
};

export default function ResourceMapSearchSelector({
  selectedIds,
  onSelectionChange,
  readonly,
}: ResourceMapSearchSelectorProps) {
  const { data, loading } = useListResourceMapEntriesQuery({
    fetchPolicy: "cache-and-network",
  });
  if (loading && !data) {
    return "loading";
  }
  const items =
    data?.listResourceMapEntries?.map((item) => ({
      label: item?.value || "",
      id: item?.id || "",
      parentId: item?.parent_id || "",
      path: item?.path || [],
    })) || [];

  return (
    <RMTreeView
      readonly={readonly}
      items={items}
      onSelectionChange={onSelectionChange}
      selectedIds={selectedIds}
    />
  );
}
