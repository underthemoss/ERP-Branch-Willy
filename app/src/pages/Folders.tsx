import React, { useState } from "react";
import {
  Box,
  Dropdown,
  Menu,
  MenuButton,
  Table,
  Tooltip,
  Typography,
} from "@mui/joy";
import { useQuery } from "@tanstack/react-query";
import {
  getApiFoldersFolderIdLineageOptions,
  getApiFoldersFolderIdChildrenOptions,
} from "../api/generated/@tanstack/react-query.gen";
import { Link, useNavigate, useParams } from "react-router-dom";

import IconButton from "@mui/joy/IconButton";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import FolderIcon from "@mui/icons-material/Folder";
import { NewFolderMenuItem } from "./context-menu-items/NewFolderMenuItem";
import { RenameFolderMenuItem } from "./context-menu-items/RenameFolderMenuItem";

const Header = () => {
  const { folder_id } = useParams();
  const { data: folderLineage } = useQuery({
    enabled: !!folder_id,
    networkMode: "offlineFirst",
    ...getApiFoldersFolderIdLineageOptions({
      path: { folder_id: folder_id || "" },
    }),
  });
  const navigate = useNavigate();
  const folders = [
    { id: "", name: "Root" },
    ...(folderLineage?.data.folders || []),
  ];

  return (
    <Box display={"flex"}>
      {folders.map((folder, i, ancestors) => {
        const isCurrentFolder = folder_id === folder.id;
        return (
          <Box key={folder.id} display={"flex"} alignItems={"end"}>
            <Box mx={0}>
              <Dropdown>
                <MenuButton
                  variant="plain"
                  onClick={() => {
                    if (!isCurrentFolder) {
                      navigate(`/${folder.id}`);
                    }
                  }}
                >
                  <Tooltip title={folder.name} enterDelay={500}>
                    <Typography
                      level="title-lg"
                      fontWeight={400}
                      fontSize={24}
                      noWrap
                      maxWidth={200}
                    >
                      {folder.name}
                    </Typography>
                  </Tooltip>
                  {isCurrentFolder && i !== 0 && (
                    <Box ml={1} mb={-1}>
                      <ArrowDropDownIcon />
                    </Box>
                  )}
                </MenuButton>
                {isCurrentFolder && (
                  <Menu>
                    <NewFolderMenuItem />
                    <RenameFolderMenuItem folderId={folder.id} />
                  </Menu>
                )}
              </Dropdown>
            </Box>
            {!isCurrentFolder && (
              <Typography level="title-lg" fontSize={16}>
                <Box mt={-4}>
                  <ChevronRightIcon />
                </Box>
              </Typography>
            )}
          </Box>
        );
      })}
    </Box>
  );
};

const RowMenu: React.FC<{ id: string }> = ({ id }) => {
  const [isOpen, setContextLock] = React.useState(false);
  return (
    <Dropdown onOpenChange={() => {}}>
      <MenuButton
        slots={{ root: IconButton }}
        slotProps={{ root: { variant: "plain", color: "neutral", size: "sm" } }}
        // onClick={() => setIsOpen(!isOpen)}
      >
        <MoreHorizRoundedIcon />
      </MenuButton>
      <Menu
        size="sm"
        sx={{ minWidth: 140 }}
        onClick={() => {
          console.log("c");
          setContextLock(true);
        }}
        // open
      >
        <RenameFolderMenuItem
          folderId={id}
          onComplete={() => {
            // setIsOpen(false);
          }}
        />
        {/* <MenuItemShare /> */}

        {/* <Divider /> */}
        {/* <MenuItem color="danger">Delete</MenuItem> */}
      </Menu>
    </Dropdown>
  );
};

export const Folders = () => {
  const { folder_id = "root" } = useParams();
  const { data } = useQuery({
    ...getApiFoldersFolderIdChildrenOptions({
      path: { folder_id: folder_id },
    }),
  });

  return (
    <Box m={2}>
      <h1>ES ERP</h1>
      <Header key={folder_id} />

      <Table>
        <thead>
          <th>Name</th>
          <th>Status</th>
          <th>Owner</th>
          <th>Created</th>
          <th>Last Updated</th>
        </thead>
        <tbody>
          {data?.data?.folders.map((d) => {
            return (
              <tr>
                <td>
                  <Typography level="body-sm" fontWeight={500}>
                    <Box display={"flex"} gap={1}>
                      <FolderIcon />
                      <Link to={`/${d.id}`}>{d.name}</Link>
                    </Box>
                  </Typography>
                </td>
                <td>test</td>
                <td>test</td>
                <td>test</td>
                <td>
                  <RowMenu id={d.id} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </Box>
  );
};
