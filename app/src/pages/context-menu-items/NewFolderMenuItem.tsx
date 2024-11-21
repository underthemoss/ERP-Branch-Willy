import { ListItemDecorator, MenuItem } from "@mui/joy";

import Folder from "@mui/icons-material/CreateNewFolder";
import React, { useState } from "react";

import { Form } from "../../forms/Form";
import { z } from "zod";
import { CustomDrawer } from "../../components/CustomDrawer";
import { useMutation } from "@tanstack/react-query";
import { postApiFoldersCommandMutation } from "../../api/generated/@tanstack/react-query.gen";

export const NewFolderMenuItem: React.FC<{ onComplete: () => void }> = ({
  onComplete,
}) => {
  const [open, setOpen] = useState(false);
  const { mutateAsync: folderCommand } = useMutation({
    ...postApiFoldersCommandMutation(),
  });
  return (
    <>
      <MenuItem autoFocus={false} onClick={() => setOpen(!open)}>
        <ListItemDecorator>
          <Folder />
        </ListItemDecorator>
        New Folder
      </MenuItem>
      <CustomDrawer open={open} setOpen={setOpen}>
        <Form
          formTitle="New Folder"
          onSubmit={async (d) => {
            await folderCommand({
              body: {
                type: "create_folder",
                name: d.folder_name,
              },
            });
            onComplete();
          }}
          onCancel={() => {
            onComplete();
          }}
          schema={z.object({
            folder_name: z.string().min(1, { message: "Required" }),
          })}
          config={{
            folder_name: {
              columns: 6,
              label: "Folder name",
            },
          }}
        />
      </CustomDrawer>
    </>
  );
};
