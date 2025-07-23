"use client";

import EditIcon from "@mui/icons-material/Edit";
import { IconButton, Tooltip } from "@mui/material";
import * as React from "react";

export interface EditLineItemButtonProps {
  lineItemId: string;
  lineItemType: "RentalSalesOrderLineItem" | "SaleSalesOrderLineItem";
  onEdit?: () => void;
  disabled?: boolean;
}

export const EditLineItemButton: React.FC<EditLineItemButtonProps> = ({
  lineItemId,
  lineItemType,
  onEdit,
  disabled = false,
}) => {
  const handleEdit = () => {
    // For now, we'll just call the onEdit callback
    // The parent component will handle the actual edit logic
    if (onEdit) {
      onEdit();
    }
  };

  return (
    <Tooltip title={disabled ? "Cannot edit submitted order" : "Edit line item"}>
      <span>
        <IconButton
          aria-label="Edit line item"
          color="primary"
          onClick={handleEdit}
          size="small"
          disabled={disabled}
        >
          <EditIcon />
        </IconButton>
      </span>
    </Tooltip>
  );
};

export default EditLineItemButton;
