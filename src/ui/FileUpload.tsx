"use client";

import { graphql } from "@/graphql";
import type { SupportedContentType } from "@/graphql/graphql";
import { useAddFileToEntityMutation, useGetSignedUploadUrlLazyQuery } from "@/graphql/hooks";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { Alert, Box, Button, LinearProgress, Typography } from "@mui/material";
import React, { useRef, useState } from "react";

const getSignedUploadUrlDocument = graphql(`
  query GetSignedUploadUrl($contentType: SupportedContentType!, $originalFilename: String) {
    getSignedUploadUrl(contentType: $contentType, originalFilename: $originalFilename) {
      key
      url
    }
  }
`);

type FileUploadProps = {
  onUploadSuccess: (result: { key: string; url: string; file: File; fileId?: string }) => void;
  onError?: (error: Error) => void;
  acceptedTypes?: string[];
  label?: string;
  helperText?: string;
  multiple?: boolean;
  disabled?: boolean;
  entityId?: string;
};

type ClientSupportedContentType = "IMAGE_JPEG" | "IMAGE_PNG" | "APPLICATION_PDF" | "TEXT_CSV";

const SUPPORTED_CONTENT_TYPE_MAP: Record<string, ClientSupportedContentType> = {
  "image/jpeg": "IMAGE_JPEG",
  "image/png": "IMAGE_PNG",
  "application/pdf": "APPLICATION_PDF",
  "text/csv": "TEXT_CSV",
  "application/vnd.ms-excel": "TEXT_CSV",
};

const SUPPORTED_CONTENT_TYPE_TO_MIME: Record<ClientSupportedContentType, string> = {
  IMAGE_JPEG: "image/jpeg",
  IMAGE_PNG: "image/png",
  APPLICATION_PDF: "application/pdf",
  TEXT_CSV: "text/csv",
};

const addFileToEntityMutation = graphql(`
  mutation AddFileToEntity(
    $file_key: String!
    $file_name: String!
    $metadata: JSON
    $parent_entity_id: String!
  ) {
    addFileToEntity(
      file_key: $file_key
      file_name: $file_name
      metadata: $metadata
      parent_entity_id: $parent_entity_id
    ) {
      id
      file_key
      file_name
    }
  }
`);

export const FileUpload: React.FC<FileUploadProps> = ({
  onUploadSuccess,
  onError,
  acceptedTypes = [
    "image/jpeg",
    "image/png",
    "application/pdf",
    "text/csv",
    "application/vnd.ms-excel",
    ".csv",
  ],
  label = "",
  helperText,
  multiple = false,
  disabled = false,
  entityId,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [getUploadUrl] = useGetSignedUploadUrlLazyQuery();
  const [addFileToEntity] = useAddFileToEntityMutation();
  // Helper to map file type to SupportedContentType
  function getSupportedContentType(file: File): ClientSupportedContentType | null {
    return SUPPORTED_CONTENT_TYPE_MAP[file.type] || null;
  }

  // Handle file selection
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setProgress(0);

    const fileArr = Array.from(files);
    setSelectedFiles(fileArr);

    // Only support single file for now
    const file = fileArr[0];
    const supportedType = getSupportedContentType(file);
    if (!supportedType) {
      const errMsg = "Unsupported file type.";
      setError(errMsg);
      onError?.(new Error(errMsg));
      return;
    }

    setUploading(true);

    try {
      // Get signed upload URL
      const { data, error: gqlError } = await getUploadUrl({
        variables: {
          contentType: supportedType as SupportedContentType,
          originalFilename: file.name,
        },
      });

      if (gqlError || !data?.getSignedUploadUrl) {
        throw new Error(gqlError?.message || "Failed to get upload URL");
      }

      const { url, key } = data.getSignedUploadUrl;

      // Upload file to signed URL
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", url, true);
        xhr.setRequestHeader("Content-Type", SUPPORTED_CONTENT_TYPE_TO_MIME[supportedType]);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setProgress(Math.round((event.loaded / event.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setProgress(100);
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error("Upload failed due to network error"));
        };

        xhr.send(file);
      });

      // If entityId is set, call addFileToEntity and capture returned file id
      let createdFileId: string | undefined;
      if (entityId) {
        const addRes = await addFileToEntity({
          variables: {
            file_key: key,
            file_name: file.name,
            metadata: null,
            parent_entity_id: entityId,
          },
        });
        createdFileId = addRes.data?.addFileToEntity.id;
      }

      setUploading(false);
      onUploadSuccess({ key, url, file, fileId: createdFileId });
    } catch (err: any) {
      setUploading(false);
      setError(err.message || "Upload failed");
      onError?.(err);
    }
  };

  // Handle file input change
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Reset input so same file can be selected again
    if (inputRef.current) inputRef.current.value = "";
  };

  // Handle drag and drop
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled || uploading) return;
    handleFiles(e.dataTransfer.files);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <Box>
      {label && (
        <Typography variant="subtitle1" gutterBottom>
          {label}
        </Typography>
      )}
      <Box
        onDrop={onDrop}
        onDragOver={onDragOver}
        sx={{
          border: "2px dashed #90caf9",
          borderRadius: 2,
          p: 2,
          mb: 1,
          textAlign: "center",
          background: disabled ? "#f5f5f5" : "#e3f2fd",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
        onClick={() => {
          if (!disabled && !uploading) inputRef.current?.click();
        }}
      >
        <CloudUploadIcon sx={{ fontSize: 40, color: "#1976d2" }} />
        <Typography variant="body2" color="textSecondary">
          Drag and drop a file here, or click to select
        </Typography>
        <input
          ref={inputRef}
          type="file"
          accept={acceptedTypes.join(",")}
          multiple={multiple}
          style={{ display: "none" }}
          onChange={onInputChange}
          disabled={disabled || uploading}
        />
      </Box>
      {helperText && (
        <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
          {helperText}
        </Typography>
      )}
      {selectedFiles.length > 0 && (
        <Typography variant="body2" sx={{ mb: 1 }}>
          Selected: {selectedFiles.map((f) => f.name).join(", ")}
        </Typography>
      )}
      {uploading && (
        <Box sx={{ mb: 1 }}>
          <LinearProgress variant="determinate" value={progress} />
          <Typography variant="caption">{progress}%</Typography>
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default FileUpload;
