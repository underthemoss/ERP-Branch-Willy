"use client";

import { graphql } from "@/graphql";
import type { ResourceTypes, SupportedContentType } from "@/graphql/graphql";
import { useAddFileToEntityMutation, useGetSignedUploadUrlLazyQuery } from "@/graphql/hooks";
import { useSelectedWorkspaceId } from "@/providers/WorkspaceProvider";
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
  entityType: ResourceTypes;
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
    $parent_entity_type: ResourceTypes
    $workspace_id: String!
  ) {
    addFileToEntity(
      file_key: $file_key
      file_name: $file_name
      metadata: $metadata
      parent_entity_id: $parent_entity_id
      parent_entity_type: $parent_entity_type
      workspace_id: $workspace_id
    ) {
      id
      file_key
      file_name
      workspace_id
    }
  }
`);

// Cloud Upload Icon SVG Component
const CloudUploadIcon = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
    />
  </svg>
);

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
  entityType,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [getUploadUrl] = useGetSignedUploadUrlLazyQuery();
  const [addFileToEntity] = useAddFileToEntityMutation();
  const workspaceId = useSelectedWorkspaceId();

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
      if (entityId && workspaceId) {
        const addRes = await addFileToEntity({
          variables: {
            file_key: key,
            file_name: file.name,
            metadata: null,
            parent_entity_id: entityId,
            parent_entity_type: entityType,
            workspace_id: workspaceId,
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
    setIsDragging(false);
    if (disabled || uploading) return;
    handleFiles(e.dataTransfer.files);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !uploading) {
      setIsDragging(true);
    }
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-semibold text-gray-900 mb-2">{label}</label>}

      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => {
          if (!disabled && !uploading) inputRef.current?.click();
        }}
        className={`
          relative rounded-lg border-2 border-dashed p-8 text-center transition-all duration-200
          ${
            disabled
              ? "bg-gray-50 border-gray-200 cursor-not-allowed opacity-60"
              : uploading
                ? "bg-blue-50 border-blue-300 cursor-wait"
                : isDragging
                  ? "bg-blue-100 border-blue-500 shadow-lg scale-[1.02]"
                  : "bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer"
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptedTypes.join(",")}
          multiple={multiple}
          className="hidden"
          onChange={onInputChange}
          disabled={disabled || uploading}
        />

        <div className="flex flex-col items-center gap-3">
          <CloudUploadIcon
            className={`w-12 h-12 transition-colors ${
              disabled ? "text-gray-400" : isDragging ? "text-blue-600" : "text-blue-500"
            }`}
          />

          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-900">
              {uploading
                ? "Uploading..."
                : isDragging
                  ? "Drop file here"
                  : "Drop file or click to browse"}
            </p>
            <p className="text-xs text-gray-500">
              {helperText || "Supports JPEG, PNG, PDF, and CSV files"}
            </p>
          </div>
        </div>
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && !error && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{selectedFiles[0].name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {(selectedFiles[0].size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="mt-3 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-700 font-medium">Uploading...</span>
            <span className="text-blue-600 font-semibold">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">Upload Failed</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
