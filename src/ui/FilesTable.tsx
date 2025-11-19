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
import {
  Download,
  ExternalLink,
  File,
  FileImage,
  FileText,
  FileVideo,
  Pencil,
  Trash2,
} from "lucide-react";
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

// Icon components using Lucide React
const FileIcon = ({ mimeType }: { mimeType?: string | null }) => {
  const className = "w-5 h-5 text-gray-400";

  if (!mimeType) {
    return <File className={className} />;
  }

  if (mimeType.startsWith("image/")) {
    return <FileImage className={className} />;
  }

  if (mimeType === "application/pdf" || mimeType.startsWith("text/")) {
    return <FileText className={className} />;
  }

  if (mimeType.startsWith("video/")) {
    return <FileVideo className={className} />;
  }

  return <File className={className} />;
};

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
      await refetch();
      setDeleteDialogOpen(false);
      setFileToDelete(null);
      notifySuccess("File deleted successfully");
    } catch (error) {
      console.error("Error deleting file:", error);
      notifyError("Failed to delete file");
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
      await refetch();
      setRenameDialogOpen(false);
      setFileToRename(null);
      setNewFileName("");
      notifySuccess("File renamed successfully");
    } catch (error) {
      console.error("Error renaming file:", error);
      notifyError("Failed to rename file");
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
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-600">Loading files...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-800">Error loading files: {error.message}</p>
      </div>
    );
  }

  if (!files.length) {
    return (
      <div className="py-4">
        <p className="text-sm text-gray-500">No files attached.</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 overflow-hidden border border-gray-200 rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider"
                >
                  Size
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                >
                  Created
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {files.map((file) => (
                <tr key={file.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <FileIcon mimeType={file.mime_type} />
                      <span className="text-sm font-medium text-gray-900 truncate max-w-md">
                        {file.file_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm text-gray-600">
                      {file.file_size ? formatFileSize(file.file_size) : "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">
                      {file.created_at
                        ? new Date(file.created_at).toLocaleString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {/* Open in New Tab */}
                      <button
                        onClick={() => handleOpenInNewTab(file.id, file.file_name)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Open in new tab"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>

                      {/* Download */}
                      <button
                        onClick={() => handleDownload(file.id, file.file_name)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      {/* Rename */}
                      <button
                        onClick={() => handleRenameClick(file.id, file.file_name)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Rename file"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteClick(file.id, file.file_name)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="dialog-backdrop" onClick={handleDeleteCancel}></div>

            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete File</h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete &ldquo;{fileToDelete?.name}&rdquo;? This action
                cannot be undone.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rename Dialog */}
      {renameDialogOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="dialog-backdrop" onClick={handleRenameCancel}></div>

            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Rename File</h3>
              <p className="text-sm text-gray-600 mb-4">
                Enter a new name for &ldquo;{fileToRename?.name}&rdquo;:
              </p>

              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleRenameConfirm();
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="New file name"
                autoFocus
              />

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={handleRenameCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRenameConfirm}
                  disabled={!newFileName.trim() || newFileName.trim() === fileToRename?.name}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Rename
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
