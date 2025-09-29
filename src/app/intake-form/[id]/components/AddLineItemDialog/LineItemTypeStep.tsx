"use client";

import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import SellOutlinedIcon from "@mui/icons-material/SellOutlined";
import {
  Box,
  Button,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import React from "react";
import { NewLineItem } from "../../page";
import { StepFooterComponent } from "./AddLineItemDialog";

interface LineItemTypeStepProps {
  lineItem: Partial<NewLineItem>;
  onUpdate: (updates: Partial<NewLineItem>) => void;
  Footer: StepFooterComponent;
  onNext: () => void;
  onClose: () => void;
}

const LineItemTypeStep: React.FC<LineItemTypeStepProps> = ({
  lineItem,
  onUpdate,
  Footer,
  onNext,
  onClose,
}) => {
  const handleTypeSelect = (type: "RENTAL" | "PURCHASE") => {
    onUpdate({
      type: type,
      // Reset rental-specific fields if switching to purchase
      ...(type === "PURCHASE"
        ? {
            rentalDuration: undefined,
            rentalStartDate: undefined,
            rentalEndDate: undefined,
          }
        : {}),
    });
    // Auto-advance to next step after selection
    onNext();
  };

  const handleCustomProductToggle = () => {
    onUpdate({
      isCustomProduct: !lineItem.isCustomProduct,
      // Reset category and price if toggling custom product
      ...(lineItem.isCustomProduct
        ? {}
        : {
            pimCategoryId: undefined,
            pimCategoryName: undefined,
            priceId: undefined,
            priceName: undefined,
            priceBookName: undefined,
            unitCostInCents: undefined,
          }),
    });
  };

  const transactionOptions = [
    {
      key: "RENTAL" as const,
      label: "Rental",
      description: "Rent the equipment at a daily, weekly, or monthly rate.",
      icon: <AutorenewIcon fontSize="large" sx={{ color: "#5B6B8C" }} />,
    },
    {
      key: "PURCHASE" as const,
      label: "Purchase",
      description: "Buy outright — ownership passes to the buyer.",
      icon: <SellOutlinedIcon fontSize="large" sx={{ color: "#5B6B8C" }} />,
    },
  ];

  return (
    <>
      <DialogTitle sx={{ pb: 0 }}>Add new item</DialogTitle>
      <DialogContent sx={{ pt: 1, pb: 0 }}>
        <Stack spacing={2}>
          {transactionOptions.map((opt) => (
            <Paper
              key={opt.key}
              variant="outlined"
              sx={{
                display: "flex",
                alignItems: "center",
                p: 2,
                cursor: "pointer",
                borderColor: lineItem.type === opt.key ? "primary.main" : "primary.light",
                bgcolor: lineItem.type === opt.key ? "action.selected" : "transparent",
                "&:hover": {
                  boxShadow: 2,
                  borderColor: "primary.main",
                  bgcolor: lineItem.type === opt.key ? "action.selected" : "action.hover",
                },
              }}
              onClick={() => handleTypeSelect(opt.key)}
              tabIndex={0}
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
      </DialogContent>
      <Footer nextEnabled={!!lineItem.type} onNext={onNext} onClose={onClose} isFirstStep={true} />
    </>
  );
};

export default LineItemTypeStep;
