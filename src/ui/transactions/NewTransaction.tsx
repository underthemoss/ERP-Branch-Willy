import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Box, Button, IconButton, Paper, Popover, Stack, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { NewSellTransaction } from "./NewSellTransaction";

type TransactionType = "buy" | "sell";

interface TransactionOptionProps {
  type: TransactionType;
  title: string;
  description: string;
  onSelect: (type: TransactionType) => void;
}

export const TransactionOption: React.FC<TransactionOptionProps> = ({
  type,
  title,
  description,
  onSelect,
}) => (
  <Paper
    variant="outlined"
    onClick={() => onSelect(type)}
    sx={{
      p: 2,
      borderRadius: 2,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      cursor: "pointer",
      "&:hover": {
        boxShadow: 1,
      },
    }}
  >
    <Box>
      <Typography fontWeight={600}>{title}</Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Box>
    <IconButton size="small" edge="end">
      <ChevronRightIcon fontSize="small" color="secondary" />
    </IconButton>
  </Paper>
);

export const NewTransactionPopover: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [transactionType, setTransactionType] = useState<TransactionType | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (type: TransactionType) => {
    setTransactionType(type);
  };

  const open = Boolean(anchorEl);
  const id = open ? "new-transaction-popover" : undefined;

  return (
    <>
      <Button
        variant="contained"
        onClick={handleClick}
        sx={{ textTransform: "none", fontWeight: 600 }}
      >
        + New Transaction
      </Button>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        slotProps={{
          paper: { sx: { p: 2, width: 488, borderRadius: 2 } },
          transition: {
            onExited: () => setTransactionType(null),
          },
        }}
      >
        {transactionType === null && (
          <>
            <Typography variant="subtitle1" fontWeight={600}>
              Select transaction type
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Start by picking whether you&apos;re the buyer or seller.
            </Typography>

            <Stack spacing={1.5}>
              <TransactionOption
                type="buy"
                title="+ Buy"
                description="Select a product, seller, and key details to start your purchase."
                onSelect={handleSelect}
              />
              <TransactionOption
                type="sell"
                title="- Sell"
                description="Select a product, customer, and key details to start your sale."
                onSelect={handleSelect}
              />
            </Stack>
          </>
        )}
        {transactionType === "sell" && <NewSellTransaction open={open} onClose={handleClose} />}
        {transactionType === "buy" && <Typography>Buy transaction form goes here</Typography>}
      </Popover>
    </>
  );
};
