import CloseIcon from "@mui/icons-material/Close";
import { Box, IconButton, Typography } from "@mui/material";
import { useSidebar } from "../sidebar/useSidebar";

export function SidebarSingleContact({ onClose }: { onClose: () => void }) {
  const { getSidebarState } = useSidebar();
  const sidebarState = getSidebarState("contact");

  if (!sidebarState) {
    return null;
  }

  const { id } = sidebarState;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography>Contact info</Typography>
        <IconButton onClick={onClose} sx={{ p: 0 }}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Box sx={{ my: "16px" }}>
        <p>Contact ID: {id}</p>
      </Box>
    </Box>
  );
}
