import { ListItemDecorator, MenuItem } from "@mui/joy";

import Folder from "@mui/icons-material/CreateNewFolder";
import React from "react";

import { useParams } from "react-router-dom";
import { useDrawer } from "../../components/DrawerContext";
import { RenameFolderForm } from "../../forms/RenameFolder.form";
import { NewFolderForm } from "../../forms/NewFolder.form";

export const NewFolderMenuItem: React.FC<{ onComplete?: () => void }> = ({
  onComplete,
}) => {
  const { addDrawer, removeDrawer } = useDrawer();
  const { folder_id = "" } = useParams();
  return (
    <>
      <MenuItem
        autoFocus={false}
        onClick={() =>
          addDrawer(
            "new-folder",
            <NewFolderForm
              onCancel={() => removeDrawer("new-folder")}
              onSuccess={() => removeDrawer("new-folder")}
              parentFolderId={folder_id}
            />
          )
        }
      >
        <ListItemDecorator>
          <Folder />
        </ListItemDecorator>
        New Folder
      </MenuItem>
    </>
  );
};
