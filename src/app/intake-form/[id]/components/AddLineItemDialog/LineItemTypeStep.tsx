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
  Tooltip,
  Typography,
} from "@mui/material";
import React from "react";
import { LineItem } from "../../page";
import { StepFooterComponent } from "./AddLineItemDialog";

interface LineItemTypeStepProps {
  lineItem: Partial<LineItem>;
  onUpdate: (updates: Partial<LineItem>) => void;
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
      disabled: false,
      tooltipText: "",
    },
    {
      key: "PURCHASE" as const,
      label: "Purchase",
      description: "Buy outright — ownership passes to the buyer.",
      icon: <SellOutlinedIcon fontSize="large" sx={{ color: "#5B6B8C" }} />,
      disabled: true,
      tooltipText: "Coming soon",
    },
  ];

  return (
    <>
      <DialogTitle sx={{ pb: 0 }}>Add new item</DialogTitle>
      <DialogContent sx={{ pt: 1, pb: 0 }}>
        <Stack spacing={2}>
          {transactionOptions.map((opt) => {
            const paperContent = (
              <Paper
                key={opt.key}
                variant="outlined"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  p: 2,
                  cursor: opt.disabled ? "not-allowed" : "pointer",
                  borderColor: opt.disabled
                    ? "grey.300"
                    : lineItem.type === opt.key
                      ? "primary.main"
                      : "primary.light",
                  bgcolor: opt.disabled
                    ? "grey.50"
                    : lineItem.type === opt.key
                      ? "action.selected"
                      : "transparent",
                  opacity: opt.disabled ? 0.6 : 1,
                  "&:hover": opt.disabled
                    ? {}
                    : {
                        boxShadow: 2,
                        borderColor: "primary.main",
                        bgcolor: lineItem.type === opt.key ? "action.selected" : "action.hover",
                      },
                }}
                onClick={() => !opt.disabled && handleTypeSelect(opt.key)}
                tabIndex={opt.disabled ? -1 : 0}
              >
                <Box sx={{ mr: 2, opacity: opt.disabled ? 0.5 : 1 }}>{opt.icon}</Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography
                    fontWeight={600}
                    color={opt.disabled ? "text.disabled" : "text.primary"}
                  >
                    {opt.label}
                  </Typography>
                  <Typography
                    variant="body2"
                    color={opt.disabled ? "text.disabled" : "text.secondary"}
                  >
                    {opt.description}
                  </Typography>
                </Box>
                <IconButton
                  edge="end"
                  size="small"
                  sx={{
                    color: opt.disabled ? "grey.300" : "grey.500",
                    pointerEvents: "none",
                  }}
                >
                  <ArrowForwardIosIcon />
                </IconButton>
              </Paper>
            );

            return opt.disabled && opt.tooltipText ? (
              <Tooltip key={opt.key} title={opt.tooltipText} placement="top" arrow>
                <Box>{paperContent}</Box>
              </Tooltip>
            ) : (
              paperContent
            );
          })}
        </Stack>
      </DialogContent>
      <Footer nextEnabled={!!lineItem.type} onNext={onNext} onClose={onClose} isFirstStep={true} />
    </>
  );
};

export default LineItemTypeStep;
