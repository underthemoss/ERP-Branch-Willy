"use client";

import { graphql } from "@/graphql";
import {
  useFulfillmentProgressInventoryQuery,
  useFulfillmentProgressPurchaseOrderQuery,
} from "@/graphql/hooks";
import FulfillmentStatsBar from "@/ui/FulfillmentStatsBar";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import WarningIcon from "@mui/icons-material/Warning";
import { Box, Chip, Divider, LinearProgress, Paper, Skeleton, Typography } from "@mui/material";
import { useMemo } from "react";

// Reuse the existing query from the page
graphql(`
  query FulfillmentProgressPurchaseOrder($id: String) {
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
      fulfillmentProgress {
        fulfillmentPercentage
        isFullyFulfilled
        isPartiallyFulfilled
        onOrderItems
        receivedItems
        status
        totalItems
      }
      line_items {
        ... on RentalPurchaseOrderLineItem {
          id
          delivery_date
          delivery_location
        }
        ... on SalePurchaseOrderLineItem {
          id
          delivery_date
          delivery_location
        }
      }
    }
  }
`);

// Query to get inventory items for rental/sale breakdown and damaged count
graphql(`
  query FulfillmentProgressInventory($purchaseOrderId: String!) {
    listInventory(query: { filter: { purchaseOrderId: $purchaseOrderId }, page: { size: 1000 } }) {
      items {
        id
        conditionOnReceipt
        purchaseOrderLineItem {
          ... on RentalPurchaseOrderLineItem {
            lineitem_type
          }
          ... on SalePurchaseOrderLineItem {
            lineitem_type
          }
        }
      }
    }
  }
`);

interface FulfillmentProgressCardProps {
  purchaseOrderId: string;
}

export default function FulfillmentProgressCard({ purchaseOrderId }: FulfillmentProgressCardProps) {
  // Fetch purchase order data
  const { data: poData, loading: poLoading } = useFulfillmentProgressPurchaseOrderQuery({
    variables: { id: purchaseOrderId },
    fetchPolicy: "cache-and-network",
  });

  // Fetch inventory data for rental/sale breakdown
  const { data: inventoryData, loading: inventoryLoading } = useFulfillmentProgressInventoryQuery({
    variables: { purchaseOrderId },
    fetchPolicy: "cache-and-network",
  });

  const purchaseOrder = poData?.getPurchaseOrderById;
  const fulfillmentProgress = purchaseOrder?.fulfillmentProgress;
  const loading = poLoading || inventoryLoading;

  // Calculate rental vs sale items and damaged count
  const { rentalItems, saleItems, damagedCount } = useMemo(() => {
    const items = inventoryData?.listInventory?.items ?? [];
    const rental = items.filter(
      (item) => item.purchaseOrderLineItem?.lineitem_type === "RENTAL",
    ).length;
    const sale = items.filter(
      (item) => item.purchaseOrderLineItem?.lineitem_type === "SALE",
    ).length;
    const damaged = items.filter((item) => item.conditionOnReceipt === "DAMAGED").length;
    return { rentalItems: rental, saleItems: sale, damagedCount: damaged };
  }, [inventoryData]);

  // Calculate latest delivery date and location
  const { latestDeliveryDate, deliveryLocation } = useMemo(() => {
    const lineItems = purchaseOrder?.line_items ?? [];
    let latestDate: string | null = null;
    let location: string | null = null;

    lineItems.forEach((item) => {
      if (item && item.delivery_date) {
        if (!latestDate || new Date(item.delivery_date) > new Date(latestDate)) {
          latestDate = item.delivery_date;
          location = item.delivery_location || null;
        }
      }
    });

    return {
      latestDeliveryDate: latestDate,
      deliveryLocation: location,
    };
  }, [purchaseOrder]);

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not specified";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // Determine status text
  const getStatusText = () => {
    if (fulfillmentProgress?.isFullyFulfilled) {
      return "Fully Fulfilled";
    } else if (fulfillmentProgress?.isPartiallyFulfilled) {
      return "Partially Fulfilled";
    } else {
      return "Not Fulfilled";
    }
  };

  if (loading) {
    return (
      <Paper elevation={1} sx={{ mb: 3, p: 3 }}>
        <Skeleton variant="text" width={250} height={28} />
        <Skeleton variant="rectangular" width="100%" height={10} sx={{ mt: 2, mb: 2 }} />
        <Box sx={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          <Skeleton variant="text" width={100} height={24} />
          <Skeleton variant="text" width={100} height={24} />
          <Skeleton variant="text" width={100} height={24} />
          <Skeleton variant="text" width={100} height={24} />
          <Skeleton variant="text" width={150} height={24} />
        </Box>
      </Paper>
    );
  }

  return (
    <Paper elevation={1} sx={{ mb: 3 }}>
      {/* Top Summary Bar */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "grey.50",
        }}
      >
        <FulfillmentStatsBar
          totalItems={fulfillmentProgress?.totalItems || 0}
          receivedItems={fulfillmentProgress?.receivedItems || 0}
        />
      </Box>

      <Box sx={{ p: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1.5 }}>
          <Inventory2Icon color="primary" sx={{ fontSize: 20 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
            Inventory Fulfillment Status
          </Typography>
        </Box>

        {/* Percentage and Status Row */}
        <Box
          sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mb: 1.5 }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 500 }}>
              {(fulfillmentProgress?.fulfillmentPercentage || 0).toFixed(1)}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Overall Progress
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Chip
              label={getStatusText()}
              color={
                fulfillmentProgress?.isFullyFulfilled
                  ? "success"
                  : fulfillmentProgress?.isPartiallyFulfilled
                    ? "warning"
                    : "default"
              }
              size="small"
            />
          </Box>
        </Box>

        {/* Progress Bar */}
        <LinearProgress
          variant="determinate"
          value={fulfillmentProgress?.fulfillmentPercentage || 0}
          sx={{
            height: 6,
            borderRadius: 1,
            bgcolor: "grey.200",
            mb: 2,
            "& .MuiLinearProgress-bar": {
              borderRadius: 1,
            },
          }}
        />

        {/* Metrics Row with Icons */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1.5,
          }}
        >
          <Box sx={{ textAlign: "center", flex: 1, minWidth: 80 }}>
            <Inventory2Icon color="primary" sx={{ fontSize: 28, mb: 0.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 500 }}>
              {fulfillmentProgress?.totalItems || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total
            </Typography>
          </Box>

          <Box sx={{ textAlign: "center", flex: 1, minWidth: 80 }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 28, mb: 0.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 500 }}>
              {fulfillmentProgress?.receivedItems || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Received
            </Typography>
          </Box>

          <Box sx={{ textAlign: "center", flex: 1, minWidth: 80 }}>
            <AccessTimeIcon color="warning" sx={{ fontSize: 28, mb: 0.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 500 }}>
              {(fulfillmentProgress?.totalItems || 0) - (fulfillmentProgress?.receivedItems || 0)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Pending
            </Typography>
          </Box>

          <Box sx={{ textAlign: "center", flex: 1, minWidth: 80 }}>
            <WarningIcon color="error" sx={{ fontSize: 28, mb: 0.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 500 }}>
              {damagedCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Issues
            </Typography>
          </Box>
        </Box>

        {/* Delivery Timeline Section */}
        <Divider sx={{ my: 2 }} />

        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1.5 }}>
            <CalendarTodayIcon sx={{ fontSize: 18 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
              Delivery Timeline
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              bgcolor: "grey.50",
              p: 1.5,
              borderRadius: 1,
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary">
                Expected Completion
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {formatDate(latestDeliveryDate)}
              </Typography>
            </Box>

            {deliveryLocation && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <LocationOnIcon color="primary" sx={{ fontSize: 18 }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Delivery Location
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {deliveryLocation}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
