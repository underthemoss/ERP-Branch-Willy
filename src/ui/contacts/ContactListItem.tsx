import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Avatar, Box, IconButton, Typography } from "@mui/material";
import { FC } from "react";
import { useSidebar } from "../sidebar/useSidebar";
import { BusinessContact, PersonContact } from "./api";

export const ContactListItem: FC<{ contact: BusinessContact | PersonContact }> = ({ contact }) => {
  const { openSidebar } = useSidebar();

  // Get logo for business contacts
  const businessLogo =
    contact.__typename === "BusinessContact"
      ? contact.brand?.logos?.find((l) => l?.type === "logo")?.formats?.[0]?.src
      : null;

  const logoTheme =
    contact.__typename === "BusinessContact"
      ? contact.brand?.logos?.find((l) => l?.type === "logo")?.theme
      : null;

  return (
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
      <Avatar
        src={businessLogo || contact.profilePicture || undefined}
        sx={{
          width: 32,
          height: 32,
          bgcolor: businessLogo
            ? logoTheme === "dark"
              ? "white"
              : logoTheme === "light"
                ? "grey.900"
                : "white"
            : "black",
          border: logoTheme === "light" ? "1px solid" : "none",
          borderColor: "grey.300",
          "& img": {
            objectFit: "contain",
          },
          fontSize: "14px",
          fontWeight: "bold",
        }}
      >
        {!businessLogo &&
          !contact.profilePicture &&
          contact.name
            .split(" ")
            .slice(-2)
            .map((n) => n[0])
            .join("")
            .toUpperCase()}
      </Avatar>
      <Box>
        <Typography variant="body1">{contact.name}</Typography>
        <Typography variant="body2" color="grey.400">
          {contact.__typename === "PersonContact" ? contact.email : null}
        </Typography>
      </Box>
      <IconButton
        sx={{ ml: "auto" }}
        color="secondary"
        onClick={() => openSidebar({ sidebarType: "contact", id: contact.id })}
      >
        <MoreVertIcon />
      </IconButton>
    </Box>
  );
};
