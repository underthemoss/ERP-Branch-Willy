"use client";

import { graphql } from "@/graphql";
import { useLineItemInventoryQuery } from "@/graphql/hooks";
import { useEffect, useState } from "react";
import RentalReceiveDialog from "./RentalReceiveDialog";
import SalesReceiveDialog from "./SalesReceiveDialog";

// Query to fetch inventory for a specific line item
graphql(`
  query LineItemInventory($purchaseOrderId: String!) {
    listInventory(query: { filter: { purchaseOrderId: $purchaseOrderId, status: ON_ORDER } }) {
      items {
        id
        status
        pimCategoryId
        pimCategoryName
        assetId
        pimProductId
        purchaseOrderLineItemId
        asset {
          id
          name
          custom_name
          pim_product_name
        }
        purchaseOrderLineItem {
          ... on RentalPurchaseOrderLineItem {
            id
            po_quantity
            lineitem_type
            so_pim_category {
              name
            }
            so_pim_product {
              name
              model
            }
          }
          ... on SalePurchaseOrderLineItem {
            id
            po_quantity
            lineitem_type
            so_pim_category {
              name
            }
            so_pim_product {
              name
              model
            }
          }
        }
      }
    }
  }
`);

interface BaseReceiveInventoryDialogProps {
  open: boolean;
  onClose: () => void;
  lineItemId: string;
  purchaseOrderId: string;
  onSuccess: () => void;
}

export default function BaseReceiveInventoryDialog({
  open,
  onClose,
  lineItemId,
  purchaseOrderId,
  onSuccess,
}: BaseReceiveInventoryDialogProps) {
  const [itemType, setItemType] = useState<"RENTAL" | "SALE" | null>(null);

  // Fetch inventory items for this purchase order to determine the item type
  const { data, loading, error } = useLineItemInventoryQuery({
    variables: {
      purchaseOrderId,
    },
    fetchPolicy: "network-only",
    skip: !open,
  });

  // Determine the item type based on the line item
  useEffect(() => {
    if (data?.listInventory?.items && open) {
      const allItems = data.listInventory.items;
      const items = allItems.filter((item: any) => item.purchaseOrderLineItemId === lineItemId);

      if (items.length > 0) {
        const firstItem = items[0];
        const lineItem = firstItem.purchaseOrderLineItem;

        if (lineItem && "lineitem_type" in lineItem) {
          setItemType(lineItem.lineitem_type as "RENTAL" | "SALE");
        }
      }
    }
  }, [data, lineItemId, open]);

  // Reset item type when dialog closes
  useEffect(() => {
    if (!open) {
      setItemType(null);
    }
  }, [open]);

  // Show loading state while determining item type
  if (open && (loading || itemType === null)) {
    return (
      <div style={{ display: "none" }}>{/* Hidden placeholder while determining item type */}</div>
    );
  }

  // Render the appropriate dialog based on item type
  if (itemType === "RENTAL") {
    return (
      <RentalReceiveDialog
        open={open}
        onClose={onClose}
        lineItemId={lineItemId}
        purchaseOrderId={purchaseOrderId}
        onSuccess={onSuccess}
      />
    );
  }

  if (itemType === "SALE") {
    return (
      <SalesReceiveDialog
        open={open}
        onClose={onClose}
        lineItemId={lineItemId}
        purchaseOrderId={purchaseOrderId}
        onSuccess={onSuccess}
      />
    );
  }

  // Fallback - should not reach here in normal operation
  return null;
}
