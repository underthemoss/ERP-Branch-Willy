"use client";

import { graphql } from "@/graphql";
import { useCreatePdfFromPageAndAttachToQuoteMutation } from "@/graphql/hooks";
import { useNotification } from "@/providers/NotificationProvider";
import { useSelectedWorkspace } from "@/providers/WorkspaceProvider";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { useParams } from "next/navigation";
import * as React from "react";

const CREATE_PDF_FROM_PAGE = graphql(`
  mutation CreatePdfFromPageForPrint(
    $entity_id: String!
    $path: String!
    $file_name: String!
    $workspaceId: String!
  ) {
    createPdfFromPageAndAttachToEntityId(
      entity_id: $entity_id
      path: $path
      file_name: $file_name
      workspaceId: $workspaceId
    ) {
      success
      error_message
    }
  }
`);

interface PrintQuoteDialogProps {
  open: boolean;
  onClose: () => void;
  quoteId: string;
  onSuccess?: () => void;
}

export function PrintQuoteDialog({ open, onClose, quoteId, onSuccess }: PrintQuoteDialogProps) {
  const params = useParams();
  const workspaceId = params?.workspace_id as string;
  const currentWorkspace = useSelectedWorkspace();
  const { notifySuccess, notifyError } = useNotification();
  const [createPdf, { loading }] = useCreatePdfFromPageAndAttachToQuoteMutation();

  // Generate default filename: Quote_<quoteId>_<date>
  const defaultFilename = React.useMemo(() => {
    const date = new Date().toISOString().split("T")[0];
    return `Quote_${quoteId}_${date}`;
  }, [quoteId]);

  const [filename, setFilename] = React.useState<string>(defaultFilename);

  React.useEffect(() => {
    if (open) {
      setFilename(defaultFilename);
    }
  }, [open, defaultFilename]);

  const handleClose = () => {
    setFilename(defaultFilename);
    onClose();
  };

  const handlePrint = async () => {
    if (!currentWorkspace) {
      notifyError("No workspace selected");
      return;
    }

    try {
      const result = await createPdf({
        variables: {
          entity_id: quoteId,
          path: `/app/${workspaceId}/quotes/${quoteId}`,
          file_name: filename.endsWith(".pdf") ? filename : `${filename}.pdf`,
          workspaceId: currentWorkspace.id,
        },
        refetchQueries: ["GetQuoteById"],
      });

      if (result.data?.createPdfFromPageAndAttachToEntityId?.success) {
        notifySuccess("PDF generated successfully");
        onSuccess?.();
        handleClose();
      } else {
        const errorMsg =
          result.data?.createPdfFromPageAndAttachToEntityId?.error_message || "Unknown error";
        notifyError(`Failed to generate PDF: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      notifyError("Failed to generate PDF. Please try again.");
    }
  };

  const isFilenameValid = React.useMemo(() => {
    return filename.trim().length > 0;
  }, [filename]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Generate PDF</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Typography variant="body1" gutterBottom>
            Generate a PDF version of this quote
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
            The PDF will be attached to this quote and available for download.
          </Typography>
          <TextField
            fullWidth
            label="PDF Filename"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="Quote_123_2025-01-15"
            helperText="The .pdf extension will be added automatically if not included"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handlePrint}
          disabled={!isFilenameValid || loading}
          color="primary"
        >
          {loading ? "Generating..." : "Generate PDF"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
