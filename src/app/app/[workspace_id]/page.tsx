"use client";

import { graphql } from "@/graphql";
import { useListPersonContactsQuery } from "@/ui/contacts/api";
import { ContactListItem } from "@/ui/contacts/ContactListItem";
import { NewContactDialog } from "@/ui/contacts/NewContactDialog";
import { useSidebar } from "@/ui/sidebar/useSidebar";
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

export default function DashboardMainSection() {
  const { user } = useAuth0();
  const { openSidebar } = useSidebar();
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
        <HomepageBox
          title="Projects"
          toggleSideBar={() => openSidebar({ sidebarType: "projects" })}
        >
          ..
        </HomepageBox>
        <HomepageBox
          title="Contacts Directory"
          toggleSideBar={() => openSidebar({ sidebarType: "contacts" })}
          plusAction={() => dialogs.open(NewContactDialog)}
        >
          {data?.listContacts?.items
            .slice(0, 3)
            // @ts-expect-error union type interferance
            .map((contact, i) => <ContactListItem key={i} contact={contact} />)}
        </HomepageBox>
        <HomepageBox
          title="Resource Directory"
          toggleSideBar={() => openSidebar({ sidebarType: "resources" })}
        >
          ...
        </HomepageBox>
      </Box>
    </>
  );
}
