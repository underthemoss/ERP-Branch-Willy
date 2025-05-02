"use client";

import { graphql } from "@/graphql";
import { useFetchWorkspacesQuery } from "@/graphql/hooks";
import { CustomDialog } from "@/ui/CustomDialog";
import { useAuth0 } from "@auth0/auth0-react";
import AddIcon from "@mui/icons-material/Add";
import {
  Avatar,
  Button,
  Divider,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Stack,
  Typography,
} from "@mui/material";
import { AccountPopoverFooter, AccountPreview, SignOutButton } from "@toolpad/core/Account";
import { useDialogs } from "@toolpad/core/useDialogs";
import { useRouter } from "next/navigation";
import * as React from "react";

graphql(`
  query fetchWorkspaces {
    listWorkspaces {
      items {
        id
        companyId
        name
      }
    }
  }
`);

export default function WorkspaceSwitcher() {
  const { push } = useRouter();
  const dialogs = useDialogs();
  const { data } = useFetchWorkspacesQuery();
  const workspaces =
    data?.listWorkspaces?.items.map((d) => {
      return {
        id: d.id,
        name: d.name,
        subtext: d.companyId,
        image: "/favicon.ico",
      };
    }) || [];

  return (
    <Stack direction="column">
      <AccountPreview variant="expanded" />
      <Divider />
      <Typography variant="body2" mx={2} mt={1}>
        Workspaces
      </Typography>
      <MenuList>
        {workspaces.map((workspace) => (
          <MenuItem
            key={workspace.id}
            component="button"
            sx={{
              justifyContent: "flex-start",
              width: "100%",
              columnGap: 2,
            }}
            onClick={() => {
              push(`/app/${workspace.id}`);
            }}
          >
            <ListItemIcon>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  fontSize: "0.95rem",
                  bgcolor: "AppWorkspace",
                }}
                src={workspace.image ?? ""}
                alt={workspace.name ?? ""}
              >
                {workspace?.name?.[0]}
              </Avatar>
            </ListItemIcon>
            <ListItemText
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                width: "100%",
              }}
              primary={workspace.name}
              secondary={workspace.subtext}
              slotProps={{
                primary: {
                  variant: "body2",
                },
                secondary: {
                  variant: "caption",
                },
              }}
            />
          </MenuItem>
        ))}
        <Divider />
        <Button
          variant="text"
          sx={{ textTransform: "capitalize", display: "flex", mx: "auto" }}
          size="small"
          startIcon={<AddIcon />}
          disableElevation
          onClick={() => {
            dialogs.open(CustomDialog);
          }}
        >
          Add new
        </Button>
      </MenuList>
      <Divider />
      <AccountPopoverFooter>
        <SignOutButton />
      </AccountPopoverFooter>
    </Stack>
  );
}
