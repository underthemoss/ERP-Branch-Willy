import React from "react";
import { Form } from "./Form";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getApiFoldersFolderIdChildrenQueryKey,
  postApiFoldersMutation,
} from "..//api/generated/@tanstack/react-query.gen";
import { useParams } from "react-router-dom";

export const NewFolderForm: React.FC<{
  onSuccess: () => void;
  onCancel: () => void;
  parentFolderId?: string;
}> = ({ onSuccess, onCancel, parentFolderId }) => {
  const queryClient = useQueryClient();
  const { mutateAsync: folderCommand } = useMutation({
    ...postApiFoldersMutation(),
    onSuccess(data, variables, context) {
      queryClient.invalidateQueries({
        queryKey: getApiFoldersFolderIdChildrenQueryKey({
          path: { folder_id: parentFolderId || "root" },
        }),
      });
    },
  });

  return (
    <Form
      formTitle="New Folder"
      onSubmit={async (d) => {
        await folderCommand({
          body: {
            name: d.folder_name,
            parent_id: parentFolderId || "",
          },
        });
        onSuccess();
      }}
      defaultValues={{}}
      onCancel={() => {
        onCancel();
      }}
      schema={z.object({
        folder_name: z.string().min(1, { message: "Required" }),
      })}
      uiConfig={{
        folder_name: {
          columns: 6,
          label: "Folder name",
        },
      }}
    />
  );
};
