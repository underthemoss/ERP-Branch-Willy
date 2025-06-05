import { graphql } from "@/graphql";
import { useListResourceMapEntriesQuery } from "@/graphql/hooks";
import LinearProgress from "@mui/material/LinearProgress";
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
  onSelectionChange: (ids: string[]) => void | Promise<void>;
  readonly: boolean;
};

export default function ResourceMapSearchSelector({
  selectedIds,
  onSelectionChange,
  readonly,
}: ResourceMapSearchSelectorProps) {
  const [showLoader, setShowLoader] = React.useState(false);
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
    <>
      {showLoader && <LinearProgress />}
      <RMTreeView
        readonly={readonly}
        items={items}
        onSelectionChange={async (ids) => {
          setShowLoader(true);
          await onSelectionChange(ids);
          setShowLoader(false);
        }}
        selectedIds={selectedIds}
      />
    </>
  );
}
