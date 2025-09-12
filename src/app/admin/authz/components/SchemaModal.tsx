"use client";

import { useGetRawZedSchemaQuery } from "@/graphql/hooks";
import { RefreshOutlined } from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Modal,
  ModalClose,
  ModalDialog,
  Stack,
  Typography,
} from "@mui/joy";

interface SchemaModalProps {
  open: boolean;
  onClose: () => void;
}

export function SchemaModal({ open, onClose }: SchemaModalProps) {
  // Fetch raw Zed schema (only when modal is open)
  const {
    data: schemaData,
    loading: schemaLoading,
    refetch: refetchSchema,
  } = useGetRawZedSchemaQuery({
    fetchPolicy: "cache-and-network",
    skip: !open,
  });

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog sx={{ width: "80vw", maxWidth: 1000, height: "80vh" }}>
        <ModalClose />
        <Typography level="h4" sx={{ mb: 2 }}>
          Raw Zed Schema
        </Typography>
        <Stack spacing={2} sx={{ height: "100%" }}>
          <Typography level="body-sm" sx={{ color: "text.secondary" }}>
            This is the raw SpiceDB Zed schema that defines all resource types and their
            relationships.
          </Typography>
          {schemaLoading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: 200,
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <Box
              sx={{
                flex: 1,
                p: 2,
                bgcolor: "background.level1",
                borderRadius: "sm",
                fontFamily: "monospace",
                fontSize: 13,
                overflow: "auto",
                whiteSpace: "pre-wrap",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              {schemaData?.admin?.rawZedSchema || "No schema data available"}
            </Box>
          )}
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              startDecorator={<RefreshOutlined />}
              onClick={() => refetchSchema()}
              disabled={schemaLoading}
            >
              Refresh Schema
            </Button>
            <Button variant="outlined" onClick={onClose}>
              Close
            </Button>
          </Box>
        </Stack>
      </ModalDialog>
    </Modal>
  );
}
