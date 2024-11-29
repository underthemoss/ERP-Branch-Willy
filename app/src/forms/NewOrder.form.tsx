import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getApiFoldersFolderIdChildrenQueryKey,
  getApiFoldersFolderIdLineageQueryKey,
  getApiFoldersFolderIdOptions,
  postApiFoldersFolderIdRenameMutation,
} from "../api/generated/@tanstack/react-query.gen";
import { Form } from "./Form";
import { z } from "zod";
import { Box, Button } from "@mui/joy";
import { useDrawer } from "../components/DrawerContext";
export const NewOrderForm: React.FC<{
  folderId: string;
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ folderId, onCancel, onSuccess }) => {
  const { addDrawer, removeDrawer } = useDrawer();
  // const { data, isLoading } = useQuery({
  //   ...getApiFoldersFolderIdOptions({
  //     path: { folder_id: folderId },
  //     query: { name: "" },
  //   }),
  // });
  // const queryClient = useQueryClient();
  // const { mutateAsync: folderCommand } = useMutation({
  //   ...postApiFoldersFolderIdRenameMutation(),
  //   onSuccess(data, variables, context) {
  //     console.log("hit", data);
  //     queryClient.invalidateQueries({
  //       queryKey: getApiFoldersFolderIdLineageQueryKey({
  //         path: { folder_id: data.data.id },
  //       }),
  //     });
  //     queryClient.invalidateQueries({
  //       queryKey: getApiFoldersFolderIdChildrenQueryKey({
  //         path: { folder_id: data.data.parent_id || "root" },
  //       }),
  //     });
  //   },
  // });

  return (
    <Form
      formTitle="New Order"
      // key={JSON.stringify(data)}
      onSubmit={async (d) => {
        console.log(d);
        onSuccess();
      }}
      defaultValues={{
        order_name: "",
      }}
      onCancel={() => {
        onCancel();
      }}
      schema={z.object({
        order_name: z.string().min(1, { message: "Required" }),
        requested_by: z.string().min(1),
        due_date: z.date({ coerce: true }),
      })}
      uiConfig={{
        order_name: {
          columns: 6,
          label: "Order name",
          trailingColumns: 6,
        },
        requested_by: {
          columns: 12,
          label: "Requested by",
          type: "hidden",
          append: {
            component: ({ setValue, error, value }) => {
              return (
                <Box flex={1} gap={1} display={"flex"} flexDirection={"column"}>
                  <div>Requested by</div>
                  <Button
                    variant="outlined"
                    onClick={() =>
                      addDrawer(
                        "select-user",
                        <div>
                          <Button
                            onClick={() => {
                              setValue("user 1");
                              removeDrawer("select-user");
                            }}
                          >
                            User 1
                          </Button>
                        </div>
                      )
                    }
                  >
                    {value || "Select User"}
                  </Button>

                  {error}
                </Box>
              );
            },
            columns: 6,
          },
        },
        due_date: {
          leadingColumns: 6,
          label: "Due date",
          columns: 6,
          type: "date",
        },
      }}
    />
  );
};
