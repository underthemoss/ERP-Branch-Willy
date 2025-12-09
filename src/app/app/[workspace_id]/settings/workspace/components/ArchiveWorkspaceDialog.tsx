"use client";

import { Warning } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";

interface ArchiveWorkspaceDialogProps {
  open: boolean;
  onClose: () => void;
  workspaceName: string;
  isArchived: boolean;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}

export default function ArchiveWorkspaceDialog({
  open,
  onClose,
  workspaceName,
  isArchived,
  onConfirm,
  isLoading,
}: ArchiveWorkspaceDialogProps) {
  const [confirmationText, setConfirmationText] = useState("");

  const handleClose = () => {
    if (!isLoading) {
      setConfirmationText("");
      onClose();
    }
  };

  const handleConfirm = async () => {
    await onConfirm();
    setConfirmationText("");
  };

  const isConfirmationValid = confirmationText === workspaceName;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isArchived ? "Unarchive Workspace?" : "Archive Workspace?"}</DialogTitle>

      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {isArchived ? (
            <>
              Restore <strong>{workspaceName}</strong>?
            </>
          ) : (
            <>
              Archive <strong>{workspaceName}</strong>? This will hide it from members.
            </>
          )}
        </Typography>

        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
          Type <strong>{workspaceName}</strong> to confirm:
        </Typography>
        <TextField
          fullWidth
          value={confirmationText}
          onChange={(e) => setConfirmationText(e.target.value)}
          placeholder={workspaceName}
          disabled={isLoading}
          autoFocus
          error={confirmationText.length > 0 && !isConfirmationValid}
          helperText={
            confirmationText.length > 0 && !isConfirmationValid
              ? "Workspace name doesn't match"
              : ""
          }
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={!isConfirmationValid || isLoading}
          variant="contained"
          startIcon={isLoading ? <CircularProgress size={16} /> : undefined}
        >
          {isLoading
            ? isArchived
              ? "Unarchiving..."
              : "Archiving..."
            : isArchived
              ? "Unarchive"
              : "Archive"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
