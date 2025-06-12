import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import React from "react";

interface CreateTransferLineItemDialogProps {
  open: boolean;
  onClose: () => void;
}

const CreateTransferLineItemDialog: React.FC<CreateTransferLineItemDialogProps> = ({
  open,
  onClose,
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle>Add Transfer Line Item</DialogTitle>
    <DialogContent>
      <Typography variant="body1" sx={{ mb: 2 }}>
        Transfer line item wizard coming soon.
      </Typography>
    </DialogContent>
    <DialogActions
      sx={{
        bgcolor: "grey.100",
        borderTop: 1,
        borderColor: "divider",
        px: 3,
        py: 1.5,
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <Button onClick={onClose} color="inherit">
        Close
      </Button>
      <span />
    </DialogActions>
  </Dialog>
);

export default CreateTransferLineItemDialog;
