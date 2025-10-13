"use client";

import { ResourceTypes } from "@/graphql/graphql";
import * as React from "react";
import FilesTable from "./FilesTable";
import FileUpload from "./FileUpload";

type AttachedFilesSectionProps = {
  entityId: string;
  entityType: ResourceTypes;
};

export default function AttachedFilesSection({ entityId, entityType }: AttachedFilesSectionProps) {
  const [filesTableKey, setFilesTableKey] = React.useState(0);

  return (
    <>
      <FilesTable entityId={entityId} key={filesTableKey + "-" + entityId} />
      <FileUpload
        entityType={entityType}
        onUploadSuccess={() => {
          setFilesTableKey((k) => k + 1);
        }}
        entityId={entityId}
      />
    </>
  );
}
