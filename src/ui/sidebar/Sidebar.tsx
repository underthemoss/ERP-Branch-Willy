import Box from "@mui/material/Box";
import { SidebarListContacts } from "../contacts/SidebarListContacts";
import { SidebarSingleContact } from "../contacts/SidebarSingleContact";
import { useSidebar } from "./useSidebar";

export function Sidebar() {
  const { closeSidebar, getSidebarState } = useSidebar();
  const sidebarState = getSidebarState();
  const isSidebarOpen = sidebarState !== null;

  console.log("sidebar stuff:", sidebarState);

  let content = null;
  switch (sidebarState?.sidebarType) {
    case "contact":
      content = <SidebarSingleContact onClose={closeSidebar} />;
      break;
    case "contacts":
      content = <SidebarListContacts onClose={closeSidebar} />;
      break;
    case "project":
      content = <div>Project</div>;
      break;
    case "projects":
      content = <div>Projects</div>;
      break;
    case "resource":
      content = <div>Resource</div>;
      break;
    case "resources":
      content = <div>Resources</div>;
      break;
    default:
      content = <div>Sidebar</div>;
  }

  return (
    <Box
      sx={{
        bgcolor: "white",
        width: isSidebarOpen ? "500px" : "0px",
        flexShrink: 0,
        margin: "10px",
        marginLeft: 0,
        borderRadius: "12px",
        overflow: "hidden",
        transition: "width 0.3s ease",
      }}
    >
      <Box
        sx={{
          opacity: isSidebarOpen ? 1 : 0,
          transition: "opacity 0.3s ease",
          p: isSidebarOpen ? 2 : 0,
        }}
      >
        {content}
      </Box>
    </Box>
  );
}
