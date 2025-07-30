"use client";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { IconButton, Tooltip } from "@mui/material";
import * as React from "react";

export interface DuplicateRentalLineItemButtonProps {
  lineItemId: string;
  lineItemType: "RentalPurchaseOrderLineItem" | "SalePurchaseOrderLineItem";
  onDuplicate?: () => void;
  disabled?: boolean;
}

export const DuplicateRentalLineItemButton: React.FC<DuplicateRentalLineItemButtonProps> = ({
  lineItemId,
  lineItemType,
  onDuplicate,
  disabled = false,
}) => {
  const handleDuplicate = () => {
    if (onDuplicate) {
      onDuplicate();
    }
  };

  // Only show for rental line items
  const isRental = lineItemType === "RentalPurchaseOrderLineItem";

  if (!isRental) {
    return null;
  }

  return (
    <Tooltip title="Duplicate rental">
      <IconButton
        aria-label="Duplicate rental line item"
        color="primary"
        onClick={handleDuplicate}
        size="small"
        disabled={disabled}
      >
        <ContentCopyIcon />
      </IconButton>
    </Tooltip>
  );
};

export default DuplicateRentalLineItemButton;
