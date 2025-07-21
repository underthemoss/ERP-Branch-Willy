"use client";

import EditIcon from "@mui/icons-material/Edit";
import { IconButton, Tooltip } from "@mui/material";
import * as React from "react";

export interface EditLineItemButtonProps {
  lineItemId: string;
  lineItemType: "RentalSalesOrderLineItem" | "SaleSalesOrderLineItem";
  onEdit?: () => void;
}

export const EditLineItemButton: React.FC<EditLineItemButtonProps> = ({
  lineItemId,
  lineItemType,
  onEdit,
}) => {
  const handleEdit = () => {
    // For now, we'll just call the onEdit callback
    // The parent component will handle the actual edit logic
    if (onEdit) {
      onEdit();
    }
  };

  return (
    <Tooltip title="Edit line item">
      <IconButton aria-label="Edit line item" color="primary" onClick={handleEdit} size="small">
        <EditIcon />
      </IconButton>
    </Tooltip>
  );
};

export default EditLineItemButton;
