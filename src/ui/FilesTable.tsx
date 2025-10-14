"use client";

import { graphql } from "@/graphql";
import {
  FileUrlType,
  useGetSignedReadUrlMutation,
  useListFilesByEntityIdTableComponentQuery,
  useRemoveFileFromEntityMutation,
  useRenameFileMutation,
} from "@/graphql/hooks";
import { useNotification } from "@/providers/NotificationProvider";
import { useSelectedWorkspaceId } from "@/providers/WorkspaceProvider";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import CodeIcon from "@mui/icons-material/Code";
import DeleteIcon from "@mui/icons-material/Delete";
import DescriptionIcon from "@mui/icons-material/Description";
import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";
import ImageIcon from "@mui/icons-material/Image";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import MovieIcon from "@mui/icons-material/Movie";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TextSnippetIcon from "@mui/icons-material/TextSnippet";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Link,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import * as React from "react";

graphql(`
  query ListFilesByEntityIdTableComponent($parent_entity_id: String!, $workspace_id: String!) {
    listFilesByEntityId(parent_entity_id: $parent_entity_id, workspace_id: $workspace_id) {
      id
      file_name
      file_size
      mime_type
      created_at
      created_by
      created_by_user {
        id
        firstName
        lastName
      }
      updated_at
      updated_by
      deleted
      file_key
      metadata
      parent_entity_id
      workspace_id
    }
  }
`);

graphql(`
  mutation RemoveFileFromEntity($file_id: String!) {
    removeFileFromEntity(file_id: $file_id) {
      id
    }
  }
`);

graphql(`
  mutation RenameFile($file_id: String!, $new_file_name: String!) {
    renameFile(file_id: $file_id, new_file_name: $new_file_name) {
      id
      file_name
    }
  }
`);

graphql(`
  mutation GetSignedReadUrl($fileId: ID!, $type: FileUrlType!) {
    getSignedReadUrl(fileId: $fileId, type: $type)
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
  const workspaceId = useSelectedWorkspaceId();
  const { notifyError, notifySuccess } = useNotification();
  const { data, loading, error, refetch } = useListFilesByEntityIdTableComponentQuery({
    variables: {
      parent_entity_id: entityId,
      workspace_id: workspaceId || "",
    },
    fetchPolicy: "cache-and-network",
    skip: !workspaceId,
  });

  const [removeFile] = useRemoveFileFromEntityMutation();
  const [renameFile] = useRenameFileMutation();
  const [getSignedReadUrl] = useGetSignedReadUrlMutation();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [fileToDelete, setFileToDelete] = React.useState<{ id: string; name: string } | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = React.useState(false);
  const [fileToRename, setFileToRename] = React.useState<{ id: string; name: string } | null>(null);
  const [newFileName, setNewFileName] = React.useState("");

  // Allow parent to trigger refetch after upload
  React.useEffect(() => {
    if (onUploadSuccess) {
      onUploadSuccess();
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onUploadSuccess]);

  const handleDeleteClick = (fileId: string, fileName: string) => {
    setFileToDelete({ id: fileId, name: fileName });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;

    try {
      await removeFile({
        variables: { file_id: fileToDelete.id },
      });
      // Refresh the file list after successful deletion
      await refetch();
      setDeleteDialogOpen(false);
      setFileToDelete(null);
    } catch (error) {
      console.error("Error deleting file:", error);
      // You might want to show an error message to the user here
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setFileToDelete(null);
  };

  const handleRenameClick = (fileId: string, fileName: string) => {
    setFileToRename({ id: fileId, name: fileName });
    setNewFileName(fileName);
    setRenameDialogOpen(true);
  };

  const handleRenameConfirm = async () => {
    if (!fileToRename || !newFileName.trim()) return;

    try {
      await renameFile({
        variables: {
          file_id: fileToRename.id,
          new_file_name: newFileName.trim(),
        },
      });
      // Refresh the file list after successful rename
      await refetch();
      setRenameDialogOpen(false);
      setFileToRename(null);
      setNewFileName("");
    } catch (error) {
      console.error("Error renaming file:", error);
      // You might want to show an error message to the user here
    }
  };

  const handleRenameCancel = () => {
    setRenameDialogOpen(false);
    setFileToRename(null);
    setNewFileName("");
  };

  const handleOpenInNewTab = async (fileId: string, fileName: string) => {
    try {
      const result = await getSignedReadUrl({
        variables: {
          fileId: fileId,
          type: FileUrlType.Inline,
        },
      });

      if (result.data?.getSignedReadUrl) {
        window.open(result.data.getSignedReadUrl, "_blank");
      } else {
        notifyError("Failed to get file URL");
      }
    } catch (error) {
      console.error("Error opening file:", error);
      notifyError("Failed to open file");
    }
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const result = await getSignedReadUrl({
        variables: {
          fileId: fileId,
          type: FileUrlType.Attachment,
        },
      });

      if (result.data?.getSignedReadUrl) {
        // Create a temporary anchor element to trigger download
        const link = document.createElement("a");
        link.href = result.data.getSignedReadUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        notifySuccess(`Downloading ${fileName}`);
      } else {
        notifyError("Failed to get download URL");
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      notifyError("Failed to download file");
    }
  };

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
      field: "file_actions",
      headerName: "",
      width: 80,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => {
        return (
          <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", height: "100%" }}>
            <IconButton
              size="small"
              onClick={() => handleOpenInNewTab(params.row.id, params.row.file_name)}
              color="primary"
              title="Open in new tab"
            >
              <OpenInNewIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleDownload(params.row.id, params.row.file_name)}
              color="primary"
              title="Download file"
            >
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Box>
        );
      },
    },
    {
      field: "file_name",
      headerName: "Name",
      flex: 2,
      minWidth: 300,
      renderCell: (params) => {
        const file = params.row;
        return (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            {getFileIcon(file.mime_type)}
            <Typography variant="body2">{file.file_name}</Typography>
          </Box>
        );
      },
    },
    {
      field: "file_size",
      headerName: "Size",
      flex: 1,
      type: "string",
      align: "right",
      headerAlign: "right",
      valueGetter: (value) => (value ? formatFileSize(value) : "-"),
    },
    {
      field: "created_at",
      headerName: "Created",
      flex: 1,
      minWidth: 130,
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
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => {
        return (
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={() => handleRenameClick(params.row.id, params.row.file_name)}
              color="primary"
              title="Rename file"
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleDeleteClick(params.row.id, params.row.file_name)}
              color="error"
              title="Delete file"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        );
      },
    },
  ];

  return (
    <>
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

      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Delete File</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete &ldquo;{fileToDelete?.name}&rdquo;? This action cannot
            be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={renameDialogOpen}
        onClose={handleRenameCancel}
        aria-labelledby="rename-dialog-title"
        aria-describedby="rename-dialog-description"
      >
        <DialogTitle id="rename-dialog-title">Rename File</DialogTitle>
        <DialogContent>
          <DialogContentText id="rename-dialog-description">
            Enter a new name for &ldquo;{fileToRename?.name}&rdquo;:
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="new-file-name"
            label="New file name"
            type="text"
            fullWidth
            variant="outlined"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleRenameConfirm();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRenameCancel} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleRenameConfirm}
            color="primary"
            variant="contained"
            disabled={!newFileName.trim() || newFileName.trim() === fileToRename?.name}
          >
            Rename
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
