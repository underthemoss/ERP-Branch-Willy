"use client";

import * as React from "react";
import FilesTable from "./FilesTable";
import FileUpload from "./FileUpload";

type AttachedFilesSectionProps = {
  entityId: string;
};

export default function AttachedFilesSection({ entityId }: AttachedFilesSectionProps) {
  const [filesTableKey, setFilesTableKey] = React.useState(0);

  return (
    <>
      <FilesTable entityId={entityId} key={filesTableKey + "-" + entityId} />
      <FileUpload
        onUploadSuccess={() => {
          setFilesTableKey((k) => k + 1);
        }}
        entityId={entityId}
      />
    </>
  );
}
