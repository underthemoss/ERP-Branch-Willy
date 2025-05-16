import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import { Box, IconButton, InputBase, Paper, Typography } from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import { useListContactsQuery } from "./api";
import { ContactListItem } from "./ContactListItem";

export function SidebarListContacts() {
  const { workspace_id } = useParams<{ workspace_id: string }>();
  const router = useRouter();
  const { data, loading, error } = useListContactsQuery({
    variables: {
      workspaceId: workspace_id,
      page: { size: 20 },
    },
  });

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography>Contacts</Typography>
        <IconButton onClick={() => router.back()} sx={{ p: 0 }}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Box>
        <Paper
          component="form"
          elevation={0}
          sx={{
            px: 1.5,
            py: "8px",
            display: "flex",
            alignItems: "center",
            border: "1px solid #E5E5EC",
            borderRadius: "8px",
          }}
        >
          <SearchIcon sx={{ mr: 1, fontSize: 20, color: "text.disabled" }} />
          <InputBase
            placeholder="Search"
            inputProps={{ "aria-label": "search" }}
            sx={{
              flex: 1,
              fontSize: 14,
              height: "20px",
              "::placeholder": { color: "text.secondary", opacity: 1 },
            }}
          />
          <Typography variant="caption" sx={{ ml: 1, color: "text.disabled", userSelect: "none" }}>
            {"⌘ K"}
          </Typography>
        </Paper>
      </Box>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      <Box sx={{ my: "16px" }}>
        {data?.listContacts?.items?.map((contact) => (
          <ContactListItem key={contact.id} contact={contact} />
        ))}
      </Box>
    </Box>
  );
}
