import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Box, IconButton, Typography } from "@mui/material";
import { FC } from "react";
import { useSidebar } from "../sidebar/useSidebar";
import { BusinessContact, PersonContact } from "./api";

export const ContactListItem: FC<{ contact: BusinessContact | PersonContact }> = ({ contact }) => {
  const { openSidebar } = useSidebar();
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
            .slice(-2)
            .map((n) => n[0])
            .join("")
            .toUpperCase()}
        </Box>
      )}
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
