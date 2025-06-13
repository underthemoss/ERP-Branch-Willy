import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import React from "react";

interface CreateSaleLineItemDialogProps {
  open: boolean;
  onClose: () => void;
}

const CreateSaleLineItemDialog: React.FC<CreateSaleLineItemDialogProps> = ({ open, onClose }) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle>Add Sale Line Item</DialogTitle>
    <DialogContent>
      <Typography variant="body1" sx={{ mb: 2 }}>
        Sale line item wizard coming soon.
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

export default CreateSaleLineItemDialog;
