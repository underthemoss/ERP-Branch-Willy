import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import KeyOutlinedIcon from "@mui/icons-material/KeyOutlined";
import SellOutlinedIcon from "@mui/icons-material/SellOutlined";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import React from "react";

export type TransactionType = "rental" | "sale" | "transfer";

interface TransactionTypeSelectDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (type: TransactionType) => void;
}

const transactionOptions: {
  key: TransactionType;
  label: string;
  description: string;
  icon: React.ReactNode;
  disabled: boolean;
}[] = [
  {
    key: "rental",
    label: "Rental",
    description: "Rent the asset at a daily, weekly, or monthly rate.",
    icon: <AutorenewIcon fontSize="large" sx={{ color: "#5B6B8C" }} />,
    disabled: false,
  },
  {
    key: "sale",
    label: "Sale",
    description: "Sell outright — ownership passes to the buyer.",
    icon: <SellOutlinedIcon fontSize="large" sx={{ color: "#5B6B8C" }} />,
    disabled: false,
  },
  {
    key: "transfer",
    label: "Transfer",
    description: "Reassign the asset internally for tracking purposes",
    icon: <KeyOutlinedIcon fontSize="large" sx={{ color: "#5B6B8C" }} />,
    disabled: true,
  },
];

const TransactionTypeSelectDialog: React.FC<TransactionTypeSelectDialogProps> = ({
  open,
  onClose,
  onSelect,
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle sx={{ pb: 0 }}>Add new item</DialogTitle>
    <DialogContent sx={{ pt: 1, pb: 0 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Start by selecting the line-item’s transaction type; you’ll specify products and fulfillment
        after.
      </Typography>
      <Stack spacing={2}>
        {transactionOptions.map((opt) => (
          <Paper
            key={opt.key}
            variant="outlined"
            sx={{
              display: "flex",
              alignItems: "center",
              p: 2,
              opacity: opt.disabled ? 0.5 : 1,
              cursor: opt.disabled ? "not-allowed" : "pointer",
              borderColor: opt.disabled ? "grey.300" : "primary.light",
              "&:hover": !opt.disabled ? { boxShadow: 2, borderColor: "primary.main" } : {},
            }}
            onClick={
              opt.disabled
                ? undefined
                : () => {
                    onSelect(opt.key);
                  }
            }
            tabIndex={opt.disabled ? -1 : 0}
            aria-disabled={opt.disabled}
          >
            <Box sx={{ mr: 2 }}>{opt.icon}</Box>
            <Box sx={{ flexGrow: 1 }}>
              <Typography fontWeight={600}>{opt.label}</Typography>
              <Typography variant="body2" color="text.secondary">
                {opt.description}
              </Typography>
            </Box>
            <IconButton
              edge="end"
              size="small"
              disabled={opt.disabled}
              sx={{
                color: "grey.500",
                pointerEvents: "none",
              }}
            >
              <ArrowForwardIosIcon />
            </IconButton>
          </Paper>
        ))}
      </Stack>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mt: 2, display: "block", textAlign: "left" }}
      >
        Feature not yet available—internal transfers are on the roadmap.
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
    </DialogActions>
  </Dialog>
);

export default TransactionTypeSelectDialog;
