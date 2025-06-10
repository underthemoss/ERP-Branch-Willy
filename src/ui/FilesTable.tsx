"use client";

import { graphql } from "@/graphql";
import { useListFilesByEntityIdTableComponentQuery } from "@/graphql/hooks";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import CodeIcon from "@mui/icons-material/Code";
import DescriptionIcon from "@mui/icons-material/Description";
import ImageIcon from "@mui/icons-material/Image";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import MovieIcon from "@mui/icons-material/Movie";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TextSnippetIcon from "@mui/icons-material/TextSnippet";
import { Box, CircularProgress, Link, Typography } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import * as React from "react";

graphql(`
  query ListFilesByEntityIdTableComponent($parent_entity_id: String!) {
    listFilesByEntityId(parent_entity_id: $parent_entity_id) {
      id
      file_name
      file_size
      mime_type
      url
      created_at
      created_by
      updated_at
      updated_by
      deleted
      file_key
      metadata
      parent_entity_id
    }
  }
`);

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  const kb = bytes / 1024;
  if (kb < 1024) return kb.toFixed(1) + " KB";
  const mb = kb / 1024;
  if (mb < 1024) return mb.toFixed(1) + " MB";
  return (mb / 1024).toFixed(1) + " GB";
}

function getFileIcon(mimeType: string | null | undefined) {
  if (!mimeType)
    return <InsertDriveFileIcon sx={{ mr: 1, verticalAlign: "middle" }} color="secondary" />;
  if (mimeType.startsWith("image/"))
    return <ImageIcon sx={{ mr: 1, verticalAlign: "middle" }} color="secondary" />;
  if (mimeType === "application/pdf")
    return <PictureAsPdfIcon sx={{ mr: 1, verticalAlign: "middle" }} color="secondary" />;
  if (mimeType.startsWith("audio/"))
    return <AudiotrackIcon sx={{ mr: 1, verticalAlign: "middle" }} color="secondary" />;
  if (mimeType.startsWith("video/"))
    return <MovieIcon sx={{ mr: 1, verticalAlign: "middle" }} color="secondary" />;
  if (mimeType === "text/plain" || mimeType === "text/markdown" || mimeType === "text/csv")
    return <TextSnippetIcon sx={{ mr: 1, verticalAlign: "middle" }} color="secondary" />;
  if (
    mimeType === "application/json" ||
    mimeType === "application/javascript" ||
    mimeType === "text/javascript" ||
    mimeType === "text/x-python" ||
    mimeType === "text/x-java-source"
  )
    return <CodeIcon sx={{ mr: 1, verticalAlign: "middle" }} color="secondary" />;
  return <DescriptionIcon sx={{ mr: 1, verticalAlign: "middle" }} color="secondary" />;
}

type FilesTableProps = {
  entityId: string;
  onUploadSuccess?: () => void;
};

export default function FilesTable({ entityId, onUploadSuccess }: FilesTableProps) {
  const { data, loading, error, refetch } = useListFilesByEntityIdTableComponentQuery({
    variables: { parent_entity_id: entityId },
    fetchPolicy: "cache-and-network",
  });

  // Allow parent to trigger refetch after upload
  React.useEffect(() => {
    if (onUploadSuccess) {
      onUploadSuccess();
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onUploadSuccess]);

  const files = data?.listFilesByEntityId ?? [];

  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight={80}>
        <CircularProgress size={20} sx={{ mr: 1 }} />
        <Typography variant="body2" color="text.secondary">
          Loading files...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Typography variant="body2" color="error">
        Error loading files: {error.message}
      </Typography>
    );
  }

  if (!files.length) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        No files attached.
      </Typography>
    );
  }

  const columns: GridColDef[] = [
    {
      field: "file_name",
      headerName: "Name",
      flex: 2,
      minWidth: 200,
      renderCell: (params) => {
        const file = params.row;
        return (
          <Link
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            color="primary"
            sx={{ display: "flex", alignItems: "center" }}
          >
            {getFileIcon(file.mime_type)}
            {file.file_name}
          </Link>
        );
      },
    },
    {
      field: "mime_type",
      headerName: "Type",
      flex: 1,
      minWidth: 120,
      valueGetter: (value) => value || "-",
    },
    {
      field: "file_size",
      headerName: "Size",
      flex: 1,
      minWidth: 100,
      type: "string",
      align: "right",
      headerAlign: "right",
      valueGetter: (value) => (value ? formatFileSize(value) : "-"),
    },
    {
      field: "created_at",
      headerName: "Created",
      flex: 1,
      minWidth: 160,
      valueGetter: (value) => {
        const date = value ? new Date(value) : null;
        return date
          ? date.toLocaleString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-";
      },
    },
  ];

  return (
    <Box sx={{ mb: 2, width: "100%", overflowX: "auto" }}>
      <DataGrid
        autoHeight
        rows={files}
        columns={columns}
        getRowId={(row) => row.id}
        hideFooter
        disableColumnMenu
        disableRowSelectionOnClick
        sx={{
          border: 0,
          "& .MuiDataGrid-cell": { borderBottom: "1px solid #f0f0f0" },
          "& .MuiDataGrid-columnHeaders": { borderBottom: "1px solid #e0e0e0" },
        }}
      />
    </Box>
  );
}
