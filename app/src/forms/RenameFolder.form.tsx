import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getApiFoldersFolderIdChildrenQueryKey,
  getApiFoldersFolderIdLineageQueryKey,
  getApiFoldersFolderIdOptions,
  postApiFoldersFolderIdRenameMutation,
} from "../api/generated/@tanstack/react-query.gen";
import { Form } from "./Form";
import { z } from "zod";
export const RenameFolderForm: React.FC<{
  folderId: string;
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ folderId, onCancel, onSuccess }) => {
  const { data, isLoading } = useQuery({
    ...getApiFoldersFolderIdOptions({
      path: { folder_id: folderId },
      query: { name: "" },
    }),
  });
  const queryClient = useQueryClient();
  const { mutateAsync: folderCommand } = useMutation({
    ...postApiFoldersFolderIdRenameMutation(),
    onSuccess(data, variables, context) {
      console.log("hit", data);
      queryClient.invalidateQueries({
        queryKey: getApiFoldersFolderIdLineageQueryKey({
          path: { folder_id: data.data.id },
        }),
      });
      queryClient.invalidateQueries({
        queryKey: getApiFoldersFolderIdChildrenQueryKey({
          path: { folder_id: data.data.parent_id || "root" },
        }),
      });
    },
  });

  return (
    <Form
      formTitle="Rename Folder"
      key={JSON.stringify(data)}
      onSubmit={async (d) => {
        console.log(d);
        await folderCommand({
          path: {
            folder_id: folderId,
          },
          body: {
            name: d.folder_name,
          },
        });
        onSuccess();
      }}
      defaultValues={{
        folder_name: data?.data.name,
      }}
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
