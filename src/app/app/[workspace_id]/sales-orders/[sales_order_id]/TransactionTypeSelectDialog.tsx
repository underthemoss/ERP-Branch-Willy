import { graphql } from "@/graphql";
import { useCreateInitialRentalSalesOrderLineItemMutation } from "@/graphql/hooks";
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

// GQL mutation declaration (for codegen)
graphql(`
  mutation createInitialRentalSalesOrderLineItem($input: CreateRentalSalesOrderLineItemInput!) {
    createRentalSalesOrderLineItem(input: $input) {
      ... on RentalSalesOrderLineItem {
        id
      }
    }
  }
`);

interface TransactionTypeSelectDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (type: TransactionType, lineItemId?: string) => void;
  salesOrderId: string;
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
  salesOrderId,
}) => {
  const [createLineItem, { loading }] = useCreateInitialRentalSalesOrderLineItemMutation();

  const handleTypeSelect = async (type: TransactionType) => {
    if (type === "rental") {
      try {
        const result = await createLineItem({
          variables: {
            input: {
              sales_order_id: salesOrderId,
              so_quantity: 1,
            },
          },
        });

        const lineItem = result.data?.createRentalSalesOrderLineItem;
        if (lineItem?.__typename === "RentalSalesOrderLineItem") {
          onSelect(type, lineItem.id);
        }
      } catch (err) {
        console.error("Failed to create rental line item:", err);
        onClose();
      }
    } else {
      onSelect(type);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 0 }}>Add new item</DialogTitle>
      <DialogContent sx={{ pt: 1, pb: 0 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Start by selecting the line-item&apos;s transaction type; you&apos;ll specify products and
          fulfillment after.
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
                      handleTypeSelect(opt.key);
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
};

export default TransactionTypeSelectDialog;
