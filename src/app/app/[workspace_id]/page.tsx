"use client";

import { useSidebar } from "@/contexts/SidebarContext";
import { graphql } from "@/graphql";
import { useListPersonContactsQuery } from "@/graphql/hooks";
import { NewContactDialog } from "@/ui/contacts/NewContactDialog";
import { useAuth0 } from "@auth0/auth0-react";
import AddBoxIcon from "@mui/icons-material/AddBox";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ViewSidebarOutlinedIcon from "@mui/icons-material/ViewSidebarOutlined";
import { IconButton, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import { useDialogs } from "@toolpad/core/useDialogs";
import { useParams } from "next/navigation";
import * as React from "react";

const HomepageBox: React.FC<{
  children: React.ReactNode;
  title: string;
  toggleSideBar: () => void;
  plusAction?: () => void;
}> = ({ children, toggleSideBar, title, plusAction }) => {
  return (
    <Box
      sx={{
        p: "20px",
        borderRadius: "10px",
        border: "1px solid #E5E5EC",
        minHeight: "290px",
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: {
          xs: "100%", // full width on extra small screens
          sm: "100%", // full width on small screens
          md: "30%", // 3 columns on medium and above
        },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        {title}
        <Box>
          <IconButton onClick={toggleSideBar} sx={{ p: 0 }}>
            <ViewSidebarOutlinedIcon sx={{ fontSize: "32px" }} />
          </IconButton>
          <IconButton color="secondary" sx={{ p: 0 }} onClick={plusAction}>
            <AddBoxIcon sx={{ fontSize: "32px" }} />
          </IconButton>
        </Box>
      </Box>
      <Box sx={{ mt: "28px" }}>{children}</Box>
    </Box>
  );
};

graphql(`
  query ListPersonContacts($workspaceId: String!, $page: ListContactsPage!) {
    listContacts(filter: { workspaceId: $workspaceId, contactType: PERSON }, page: $page) {
      items {
        ... on PersonContact {
          id
          name
          email
          profilePicture
        }
      }
    }
  }
`);

export default function DashboardMainSection() {
  const { user } = useAuth0();
  const { toggleSidebar } = useSidebar();
  const { workspace_id } = useParams<{ workspace_id: string }>();
  const dialogs = useDialogs();
  const { data } = useListPersonContactsQuery({
    variables: {
      workspaceId: workspace_id,
      page: {
        size: 10,
        number: 1,
      },
    },
  });

  return (
    <>
      <Box>
        <Typography variant="h1">Welcome Back, {user?.name} 👋 </Typography>
        <Typography>Let&apos;s torque today!</Typography>
      </Box>
      <Box sx={{ display: "flex", mt: "24px", gap: "16px", flexWrap: "wrap" }}>
        <HomepageBox title="Projects" toggleSideBar={toggleSidebar}>
          ..
        </HomepageBox>
        <HomepageBox
          title="Contacts Directory"
          toggleSideBar={toggleSidebar}
          plusAction={() => dialogs.open(NewContactDialog)}
        >
          {data?.listContacts?.items.slice(0, 3).map((contact) =>
            contact.__typename === "PersonContact" ? (
              <Box
                key={contact.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  mb: "16px",
                  p: "10px",
                  borderRadius: "10px",
                  border: "1px solid #E5E5EC",
                }}
              >
                {contact.profilePicture ? (
                  <img
                    src={contact.profilePicture}
                    alt={contact.name}
                    style={{ width: "32px", height: "32px", borderRadius: "50%" }}
                  />
                ) : (
                  <Box
                    sx={{
                      minWidth: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: "black",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: "bold",
                      fontSize: "14px",
                    }}
                  >
                    {contact.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </Box>
                )}
                <Box>
                  <Typography variant="body1">{contact.name}</Typography>
                  <Typography variant="body2" color="grey.400">
                    {contact.email}
                  </Typography>
                </Box>
                <IconButton sx={{ ml: "auto" }} color="secondary">
                  <MoreVertIcon />
                </IconButton>
              </Box>
            ) : null,
          )}
        </HomepageBox>
        <HomepageBox title="Resource Directory" toggleSideBar={toggleSidebar}>
          ...
        </HomepageBox>
      </Box>
    </>
  );
}
