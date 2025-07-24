"use client";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import React from "react";

interface UnsavedChangesWarningDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

export const UnsavedChangesWarningDialog: React.FC<UnsavedChangesWarningDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title = "Unsaved Changes",
  message = "You have unsaved changes that will be lost if you close this dialog. Are you sure you want to continue?",
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="unsaved-changes-dialog-title"
      aria-describedby="unsaved-changes-dialog-description"
    >
      <DialogTitle id="unsaved-changes-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="unsaved-changes-dialog-description">{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          Discard Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UnsavedChangesWarningDialog;
