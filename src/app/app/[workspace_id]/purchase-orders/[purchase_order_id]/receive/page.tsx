"use client";

import { graphql } from "@/graphql";
import {
  usePurchaseOrderDetailsForReceivingQuery,
  useReceiveInventoryEnhancedQuery,
} from "@/graphql/hooks";
import AttachedFilesSection from "@/ui/AttachedFilesSection";
import UnfoldLessIcon from "@mui/icons-material/UnfoldLess";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import { Alert, Box, Button, Container, Divider, Paper, Typography } from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import FulfillmentProgressCard from "./FulfillmentProgressCard";
import InventoryReceiptTimeline from "./InventoryReceiptTimeline";
import InventoryReceiveTable from "./InventoryReceiveTable";

// Enhanced query to get inventory with line item details
graphql(`
  query ReceiveInventoryEnhanced($purchaseOrderId: String!) {
    listInventory(query: { filter: { purchaseOrderId: $purchaseOrderId }, page: { size: 1000 } }) {
      items {
        id
        status
        pimCategoryId
        pimCategoryName
        assetId
        pimProductId
        purchaseOrderId
        purchaseOrderLineItemId
        conditionOnReceipt
        conditionNotes
        receiptNotes
        receivedAt
        createdBy
        createdByUser {
          id
          firstName
          lastName
          email
        }
        purchaseOrderLineItem {
          ... on RentalPurchaseOrderLineItem {
            id
            lineitem_type
            po_quantity
            po_pim_id
            so_pim_category {
              id
              name
            }
            so_pim_product {
              id
              name
              model
            }
            delivery_date
            off_rent_date
          }
          ... on SalePurchaseOrderLineItem {
            id
            lineitem_type
            po_quantity
            po_pim_id
            so_pim_category {
              id
              name
            }
            so_pim_product {
              id
              name
              model
            }
            delivery_date
          }
        }
        asset {
          id
          name
          custom_name
          pim_product_name
        }
      }
    }
  }
`);

graphql(`
  query PurchaseOrderDetailsForReceiving($id: String) {
    getPurchaseOrderById(id: $id) {
      id
      purchase_order_number
      seller {
        ... on BusinessContact {
          id
          name
        }
        ... on PersonContact {
          id
          name
        }
      }
      created_at
      status
      fulfillmentProgress {
        fulfillmentPercentage
        isFullyFulfilled
        isPartiallyFulfilled
        onOrderItems
        receivedItems
        status
        totalItems
      }
    }
  }
`);

export default function ReceiveInventoryPage() {
  const { purchase_order_id, workspace_id } = useParams<{
    purchase_order_id: string;
    workspace_id: string;
  }>();
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);
  const [expandAll, setExpandAll] = useState(false);

  const {
    data: inventoryData,
    loading: inventoryLoading,
    error: inventoryError,
    refetch: refetchInventory,
  } = useReceiveInventoryEnhancedQuery({
    variables: { purchaseOrderId: purchase_order_id },
    fetchPolicy: "cache-and-network",
  });

  const {
    data: poData,
    loading: poLoading,
    refetch: refetchPO,
  } = usePurchaseOrderDetailsForReceivingQuery({
    variables: { id: purchase_order_id },
    fetchPolicy: "cache-and-network",
  });

  const handleReceiveSuccess = () => {
    // Refresh both queries
    refetchInventory();
    refetchPO();
    setRefreshKey((prev) => prev + 1);
  };

  const items = inventoryData?.listInventory?.items ?? [];
  const purchaseOrder = poData?.getPurchaseOrderById;

  // Separate items by status for timeline
  const receivedItems = items.filter((item) => item.status === "RECEIVED");
  const onOrderItems = items.filter((item) => item.status === "ON_ORDER");

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Receive Inventory
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Purchase Order #{purchaseOrder?.purchase_order_number || "..."}
          {purchaseOrder?.seller && <> • Supplier: {(purchaseOrder.seller as any).name}</>}
        </Typography>
      </Box>

      {/* Enhanced Fulfillment Progress Card - Self-contained component */}
      <FulfillmentProgressCard purchaseOrderId={purchase_order_id} />

      {/* Error State */}
      {inventoryError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Error loading inventory items: {inventoryError.message}
        </Alert>
      )}

      {/* Inventory Table */}
      <InventoryReceiveTable
        items={items}
        loading={inventoryLoading}
        purchaseOrderId={purchase_order_id}
        workspaceId={workspace_id}
        onReceiveSuccess={handleReceiveSuccess}
      />

      {/* Receipt Timeline */}
      {receivedItems.length > 0 && (
        <Paper elevation={2} sx={{ mb: 3 }}>
          <Box sx={{ p: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                mb: 1,
              }}
            >
              <Box>
                <Typography variant="h6" gutterBottom>
                  Receipt History
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Timeline of items that have been received for this purchase order.
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={expandAll ? <UnfoldLessIcon /> : <UnfoldMoreIcon />}
                onClick={() => setExpandAll(!expandAll)}
                sx={{ minWidth: 120 }}
              >
                {expandAll ? "Collapse All" : "Expand All"}
              </Button>
            </Box>
            <InventoryReceiptTimeline
              receivedItems={receivedItems}
              expandAll={expandAll}
              key={`${refreshKey}-${expandAll}`}
            />
          </Box>
        </Paper>
      )}

      {/* No received items message */}
      {receivedItems.length === 0 && onOrderItems.length > 0 && (
        <Paper elevation={2} sx={{ p: 3, textAlign: "center", mb: 3 }}>
          <Typography variant="body1" color="text.secondary">
            No items have been received yet. Use the table above to receive inventory.
          </Typography>
        </Paper>
      )}

      {/* Supporting Documents Section */}
      <Paper elevation={2} sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Supporting Documents
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Attach delivery receipts, packing slips, or other supporting documents for this purchase
          order.
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <AttachedFilesSection entityId={purchase_order_id} key={`files-${refreshKey}`} />
      </Paper>
    </Container>
  );
}
