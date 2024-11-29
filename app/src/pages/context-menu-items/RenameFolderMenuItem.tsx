import { ListItemDecorator, MenuItem } from "@mui/joy";

import React from "react";

import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";

import { RenameFolderForm } from "../../forms/RenameFolder.form";
import { useDrawer } from "../../components/DrawerContext";

export const RenameFolderMenuItem: React.FC<{
  onComplete?: () => void;
  folderId: string;
}> = ({ onComplete, folderId }) => {
  const { addDrawer, removeDrawer } = useDrawer();
  return (
    <>
      <MenuItem
        autoFocus={false}
        onClick={() => {
          addDrawer(
            "rename-folder",
            <RenameFolderForm
              folderId={folderId}
              onCancel={() => {
                removeDrawer("rename-folder");
              }}
              onSuccess={() => {
                removeDrawer("rename-folder");
              }}
            />
          );
        }}
      >
        <ListItemDecorator>
          <DriveFileRenameOutlineIcon />
        </ListItemDecorator>
        Rename Folder
      </MenuItem>
    </>
  );
};
