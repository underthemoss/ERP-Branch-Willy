"use client";

import { graphql } from "@/graphql";
import { useGetInventoryByIdQuery, useSourcingPanelListInventoryQuery } from "@/graphql/hooks";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ContactPageOutlinedIcon from "@mui/icons-material/ContactPageOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FilterListIcon from "@mui/icons-material/FilterList";
import InventoryIcon from "@mui/icons-material/Inventory";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ReceiptIcon from "@mui/icons-material/Receipt";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Badge,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Skeleton,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import { addDays, differenceInCalendarDays, format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { InventoryFieldsFragment as InventoryItem } from "../inventory/api";
import { AddToExistingPurchaseOrderDialog } from "./AddToExistingPurchaseOrderDialog";
import {
  InventoryAssignment_RentalFulFulfilment,
  useAssignInventoryToRentalFulfilmentMutation,
  useSetFulfilmentPurchaseOrderLineItemIdMutationMutation,
  useUnassignInventoryFromRentalFulfilmentMutation,
} from "./api";
import { CreatePurchaseOrderDialog } from "./CreatePurchaseOrderDialog";

// GraphQL query for SourcingPanel component
const SourcingPanelListInventory = graphql(`
  query SourcingPanelListInventory($query: ListInventoryQuery!) {
    listInventory(query: $query) {
      items {
        id
        status
        fulfilmentId
        purchaseOrderId
        purchaseOrderLineItemId
        assetId
        asset {
          id
          name
          pim_product_model
        }
        resourceMapId
        pimCategoryId
        pimCategoryName
        pimCategoryPath
        isThirdPartyRental
      }
    }
  }
`);

// GraphQL query to get a single inventory item by ID
const GetInventoryById = graphql(`
  query GetInventoryById($id: String!) {
    inventoryById(id: $id) {
      id
      status
      fulfilmentId
      purchaseOrderId
      purchaseOrderLineItemId
      assetId
      asset {
        id
        name
        pim_product_model
      }
      resourceMapId
      pimCategoryId
      pimCategoryName
      pimCategoryPath
      isThirdPartyRental
    }
  }
`);

const SourcingPanelFulfilmentFragment = graphql(`
  fragment SourcingPanel_RentalFulfilmentFields on RentalFulfilment {
    id
    contactId
    contact {
      __typename
      ... on BusinessContact {
        id
        name
      }
      ... on PersonContact {
        id
        name
      }
    }
    project {
      id
      name
      project_code
    }
    purchaseOrderNumber
    purchaseOrderLineItemId
    purchaseOrderLineItem {
      __typename
      ... on RentalPurchaseOrderLineItem {
        id
        purchase_order_id
        purchaseOrder {
          id
          purchase_order_number
        }
      }
      ... on SalePurchaseOrderLineItem {
        id
        purchase_order_id
        purchaseOrder {
          id
          purchase_order_number
        }
      }
    }
    salesOrderId
    salesOrder {
      id
      sales_order_number
      purchase_order_number
      status
      buyer {
        __typename
        ... on BusinessContact {
          id
          name
        }
        ... on PersonContact {
          id
          name
        }
      }
    }
    salesOrderPONumber
    inventory {
      id
    }
    rentalStartDate
    expectedRentalEndDate
    rentalEndDate
    pimCategoryId
    pimCategoryName
    pimCategoryPath
    priceName
    inventoryId
  }
`);

interface SourcingPanelProps {
  selectedFulfilment: InventoryAssignment_RentalFulFulfilment | undefined;
  onDragStart: (inventoryItem: InventoryItem | null) => void;
  workspaceId: string;
}

export function SourcingPanel({
  selectedFulfilment,
  onDragStart,
  workspaceId,
}: SourcingPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inventoryFilterActive, setInventoryFilterActive] = useState(true);
  const [salesOrderExpanded, setSalesOrderExpanded] = useState(false);
  const [procurementExpanded, setProcurementExpanded] = useState(false);
  const [inventoryExpanded, setInventoryExpanded] = useState(true);

  // Fetch assigned inventory item by ID if it exists
  const { data: assignedInventoryData, loading: assignedInventoryLoading } =
    useGetInventoryByIdQuery({
      variables: {
        id: selectedFulfilment?.inventoryId || "",
      },
      skip: !selectedFulfilment?.inventoryId,
      fetchPolicy: "cache-and-network",
    });

  // Fetch inventory items based on filter state (only when no inventory is assigned)
  const { data: inventoryData, loading: inventoryLoading } = useSourcingPanelListInventoryQuery({
    variables: {
      query: {
        filter: {
          workspaceId: workspaceId,
          ...(selectedFulfilment?.pimCategoryId && inventoryFilterActive
            ? { pimCategoryId: selectedFulfilment.pimCategoryId }
            : {}),
        },
        page: {
          size: 100,
        },
      },
    },
    skip: !!selectedFulfilment?.inventoryId,
    fetchPolicy: "cache-and-network",
  });

  const [assignInventory] = useAssignInventoryToRentalFulfilmentMutation();
  const [unassignInventory] = useUnassignInventoryFromRentalFulfilmentMutation();
  const [setFulfilmentPOLineItem] = useSetFulfilmentPurchaseOrderLineItemIdMutationMutation();

  // Sort inventory to put assigned item first
  let inventory: InventoryItem[] = inventoryData?.listInventory?.items || [];

  if (selectedFulfilment?.inventoryId) {
    inventory = [...inventory].sort((a, b) => {
      if (a.id === selectedFulfilment.inventoryId) return -1;
      if (b.id === selectedFulfilment.inventoryId) return 1;
      return 0;
    });
  }

  const handleClearFilter = () => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete("fulfilmentId");
    router.push(`?${newParams.toString()}`);
  };

  const handleAssign = async (inventoryItem: InventoryItem) => {
    if (!selectedFulfilment) return;

    await assignInventory({
      variables: {
        fulfilmentId: selectedFulfilment.id,
        inventoryId: inventoryItem.id,
        allowOverlappingReservations: true,
      },
      refetchQueries: ["ListRentalFulfilments", "SourcingPanelListInventory"],
    });
  };

  const handleUnassign = async () => {
    if (!selectedFulfilment) return;

    // Unassign inventory
    await unassignInventory({
      variables: {
        fulfilmentId: selectedFulfilment.id,
      },
      refetchQueries: ["ListRentalFulfilments", "SourcingPanelListInventory"],
    });

    // Also disconnect PO if one exists
    if (selectedFulfilment.purchaseOrderLineItemId) {
      await setFulfilmentPOLineItem({
        variables: {
          fulfilmentId: selectedFulfilment.id,
          purchaseOrderLineItemId: null,
        },
        refetchQueries: ["ListRentalFulfilments"],
      });
    }
  };

  // Show simple inventory view when no fulfilment is selected
  if (!selectedFulfilment) {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Inventory
          </Typography>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
          Drag to reserve for rentals
        </Typography>

        <InventoryList
          inventory={inventory}
          isLoading={inventoryLoading}
          onDragStart={onDragStart}
          selectedFulfilmentId={null}
          selectedFulfilment={undefined}
          onAssign={handleAssign}
          onUnassign={handleUnassign}
          workspaceId={workspaceId}
        />
      </Paper>
    );
  }

  // Check if there's a purchase order
  const hasPurchaseOrder = !!selectedFulfilment.purchaseOrderLineItemId;

  // Show Sourcing panel with collapsible sections
  return (
    <Paper sx={{ mb: 2 }}>
      <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Sourcing
        </Typography>
        <Button
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={handleClearFilter}
          sx={{ textTransform: "none" }}
        >
          Collapse
        </Button>
      </Box>

      {/* Combined Fulfilment Details and Rental Duration Card */}
      <Box sx={{ px: 2, pb: 2 }}>
        <FulfilmentDetailsCard fulfilment={selectedFulfilment} />
      </Box>

      {/* Sales Order Section */}
      {selectedFulfilment.salesOrderId && (
        <Accordion
          expanded={salesOrderExpanded}
          onChange={() => setSalesOrderExpanded(!salesOrderExpanded)}
          disableGutters
          elevation={0}
          sx={{
            "&:before": { display: "none" },
            borderTop: "1px solid rgba(0, 0, 0, 0.12)",
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ReceiptIcon sx={{ fontSize: 20, color: "text.secondary" }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Sales Order
              </Typography>
              <Badge badgeContent={1} color="primary" sx={{ ml: 1 }} />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <SalesOrderCard fulfilment={selectedFulfilment} workspaceId={workspaceId} />
          </AccordionDetails>
        </Accordion>
      )}

      {/* Purchase Order Section */}
      <Accordion
        expanded={procurementExpanded}
        onChange={() => setProcurementExpanded(!procurementExpanded)}
        disableGutters
        elevation={0}
        sx={{
          "&:before": { display: "none" },
          borderTop: "1px solid rgba(0, 0, 0, 0.12)",
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ShoppingCartIcon sx={{ fontSize: 20, color: "text.secondary" }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Purchase Order
            </Typography>
            {hasPurchaseOrder && <Badge badgeContent={1} color="primary" sx={{ ml: 1 }} />}
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {hasPurchaseOrder && (
            <Box sx={{ mb: 2 }}>
              <PurchaseOrderCard fulfilment={selectedFulfilment} workspaceId={workspaceId} />
            </Box>
          )}
          <ProcurementSection fulfilment={selectedFulfilment} hasPurchaseOrder={hasPurchaseOrder} />
        </AccordionDetails>
      </Accordion>

      {/* Inventory Section */}
      <Accordion
        expanded={inventoryExpanded}
        onChange={() => setInventoryExpanded(!inventoryExpanded)}
        disableGutters
        elevation={0}
        sx={{
          "&:before": { display: "none" },
          borderTop: "1px solid rgba(0, 0, 0, 0.12)",
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <InventoryIcon sx={{ fontSize: 20, color: "text.secondary" }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Inventory
            </Typography>
            <Badge badgeContent={inventory.length} color="primary" sx={{ ml: 1 }} />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {selectedFulfilment.inventoryId ? (
            // Show only the assigned inventory item (fetched separately by ID)
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Assigned Inventory
              </Typography>
              <InventoryList
                inventory={
                  assignedInventoryData?.inventoryById ? [assignedInventoryData.inventoryById] : []
                }
                isLoading={assignedInventoryLoading}
                onDragStart={onDragStart}
                selectedFulfilmentId={selectedFulfilment.id}
                selectedFulfilment={selectedFulfilment}
                onAssign={handleAssign}
                onUnassign={handleUnassign}
                workspaceId={workspaceId}
              />
            </>
          ) : hasPurchaseOrder ? (
            // Show waiting message if PO exists but no inventory assigned yet
            <Box
              sx={{
                textAlign: "center",
                py: 4,
                px: 2,
                backgroundColor: "#fff8e1",
                borderRadius: 1,
                border: "1px solid #fbc02d",
              }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Inventory will be associated once the{" "}
                <Box
                  component="span"
                  onClick={() => {
                    const purchaseOrderId =
                      selectedFulfilment.purchaseOrderLineItem?.__typename ===
                      "RentalPurchaseOrderLineItem"
                        ? selectedFulfilment.purchaseOrderLineItem.purchase_order_id
                        : selectedFulfilment.purchaseOrderLineItem?.__typename ===
                            "SalePurchaseOrderLineItem"
                          ? selectedFulfilment.purchaseOrderLineItem.purchase_order_id
                          : null;
                    if (purchaseOrderId) {
                      window.open(
                        `/app/${workspaceId}/purchase-orders/${purchaseOrderId}`,
                        "_blank",
                      );
                    }
                  }}
                  sx={{
                    color: "primary.main",
                    textDecoration: "underline",
                    cursor: "pointer",
                    "&:hover": {
                      textDecoration: "none",
                    },
                  }}
                >
                  purchase order
                </Box>{" "}
                is submitted
              </Typography>
            </Box>
          ) : (
            // Show full inventory list for assignment
            <>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                  mb: 2,
                  p: 1,
                  backgroundColor: "rgba(25, 118, 210, 0.08)",
                  borderRadius: 1,
                  border: "1px solid rgba(25, 118, 210, 0.2)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <FilterListIcon sx={{ fontSize: 18, color: "primary.main" }} />
                  <Typography variant="caption" color="primary.main">
                    Filtered by: {selectedFulfilment.pimCategoryName || "Selected category"}
                  </Typography>
                </Box>
                <Switch
                  checked={inventoryFilterActive}
                  onChange={() => setInventoryFilterActive(!inventoryFilterActive)}
                  size="small"
                  color="primary"
                />
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                Click to reserve/release or drag to reserve
              </Typography>

              <InventoryList
                inventory={inventory}
                isLoading={inventoryLoading}
                onDragStart={onDragStart}
                selectedFulfilmentId={selectedFulfilment.id}
                selectedFulfilment={selectedFulfilment}
                onAssign={handleAssign}
                onUnassign={handleUnassign}
                workspaceId={workspaceId}
              />
            </>
          )}
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
}

function FulfilmentDetailsCard({
  fulfilment,
}: {
  fulfilment: InventoryAssignment_RentalFulFulfilment;
}) {
  const assignmentStart = new Date(fulfilment.rentalStartDate);
  const assignmentEnd = new Date(
    fulfilment.rentalEndDate || fulfilment.expectedRentalEndDate || addDays(assignmentStart, 14),
  );
  const duration = differenceInCalendarDays(assignmentEnd, assignmentStart);

  return (
    <Box
      sx={{
        p: 2,
        backgroundColor: "#f9f9f9",
        borderRadius: 1,
        border: "1px solid #e0e0e0",
      }}
    >
      {/* Product and Customer Info */}
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
        {fulfilment.pimCategoryName}
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <ContactPageOutlinedIcon sx={{ fontSize: 14, color: "text.secondary" }} />
          <Typography variant="caption" color="text.secondary">
            {fulfilment.contact?.name}
          </Typography>
        </Box>
        {fulfilment.project && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Project: {fulfilment.project.name}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Rental Duration Section */}
      <Box
        sx={{
          p: 1.5,
          backgroundColor: "#e3f2fd",
          borderRadius: 1,
          border: "1px solid #90caf9",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <CalendarMonthIcon sx={{ fontSize: 18, color: "#1976d2" }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: "#1976d2" }}>
              Rental Duration
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ fontWeight: 600, color: "#1976d2" }}>
            {duration} {duration === 1 ? "day" : "days"}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 0.25 }}
            >
              Start
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {format(assignmentStart, "MMM dd, yyyy")}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", px: 1 }}>
            <Box
              sx={{
                width: 40,
                height: 2,
                backgroundColor: "#1976d2",
                position: "relative",
                "&::after": {
                  content: '""',
                  position: "absolute",
                  right: -4,
                  top: -3,
                  width: 0,
                  height: 0,
                  borderLeft: "8px solid #1976d2",
                  borderTop: "4px solid transparent",
                  borderBottom: "4px solid transparent",
                },
              }}
            />
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 0.25 }}
            >
              End
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {format(assignmentEnd, "MMM dd, yyyy")}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function SalesOrderCard({
  fulfilment,
  workspaceId,
}: {
  fulfilment: InventoryAssignment_RentalFulFulfilment;
  workspaceId: string;
}) {
  const salesOrder = fulfilment.salesOrder;

  if (!salesOrder) {
    return null;
  }

  const handleOpenSO = () => {
    window.open(`/app/${workspaceId}/sales-orders/${salesOrder.id}`, "_blank");
  };

  // Determine status color
  const getStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case "DRAFT":
        return "#9e9e9e";
      case "SUBMITTED":
        return "#1976d2";
      case "APPROVED":
        return "#2e7d32";
      case "CANCELLED":
        return "#d32f2f";
      default:
        return "#f57c00";
    }
  };

  const statusColor = getStatusColor(salesOrder.status);

  return (
    <Box
      sx={{
        p: 1.5,
        backgroundColor: "#f5f5f5",
        borderRadius: 1,
        border: "1px solid #bdbdbd",
        cursor: "pointer",
        transition: "all 0.2s",
        "&:hover": {
          backgroundColor: "#e0e0e0",
          transform: "translateY(-1px)",
          boxShadow: 1,
        },
      }}
      onClick={handleOpenSO}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <CheckCircleIcon sx={{ fontSize: 18, color: "#757575" }} />
          <Typography variant="body2" sx={{ fontWeight: 600, color: "#757575" }}>
            Sales Order
          </Typography>
          {salesOrder.status && (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                px: 0.75,
                py: 0.25,
                borderRadius: 0.25,
                backgroundColor: `${statusColor}15`,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 500,
                  color: statusColor,
                  textTransform: "uppercase",
                  fontSize: "0.65rem",
                  letterSpacing: "0.5px",
                }}
              >
                {salesOrder.status}
              </Typography>
            </Box>
          )}
        </Box>
        <OpenInNewIcon sx={{ fontSize: 16, color: "#757575" }} />
      </Box>

      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
        SO #{salesOrder.sales_order_number || salesOrder.id}
      </Typography>

      {salesOrder.purchase_order_number && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
          Customer PO: {salesOrder.purchase_order_number}
        </Typography>
      )}

      {salesOrder.buyer && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
          Buyer: {salesOrder.buyer.name}
        </Typography>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
        Click to view sales order details
      </Typography>
    </Box>
  );
}

function PurchaseOrderCard({
  fulfilment,
  workspaceId,
}: {
  fulfilment: InventoryAssignment_RentalFulFulfilment;
  workspaceId: string;
}) {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [setFulfilmentPOLineItem] = useSetFulfilmentPurchaseOrderLineItemIdMutationMutation();

  const purchaseOrderId =
    fulfilment.purchaseOrderLineItem?.__typename === "RentalPurchaseOrderLineItem"
      ? fulfilment.purchaseOrderLineItem.purchase_order_id
      : fulfilment.purchaseOrderLineItem?.__typename === "SalePurchaseOrderLineItem"
        ? fulfilment.purchaseOrderLineItem.purchase_order_id
        : null;

  const purchaseOrderNumber =
    fulfilment.purchaseOrderLineItem?.__typename === "RentalPurchaseOrderLineItem"
      ? fulfilment.purchaseOrderLineItem.purchaseOrder?.purchase_order_number
      : fulfilment.purchaseOrderLineItem?.__typename === "SalePurchaseOrderLineItem"
        ? fulfilment.purchaseOrderLineItem.purchaseOrder?.purchase_order_number
        : null;

  const purchaseOrderStatus =
    fulfilment.purchaseOrderLineItem?.__typename === "RentalPurchaseOrderLineItem"
      ? fulfilment.purchaseOrderLineItem.purchaseOrder?.status
      : fulfilment.purchaseOrderLineItem?.__typename === "SalePurchaseOrderLineItem"
        ? fulfilment.purchaseOrderLineItem.purchaseOrder?.status
        : null;

  if (!purchaseOrderId) {
    return null;
  }

  const handleOpenPO = () => {
    window.open(`/app/${workspaceId}/purchase-orders/${purchaseOrderId}`, "_blank");
  };

  const handleDisconnectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDialogOpen(true);
  };

  const handleConfirmDisconnect = async () => {
    await setFulfilmentPOLineItem({
      variables: {
        fulfilmentId: fulfilment.id,
        purchaseOrderLineItemId: null,
      },
      refetchQueries: ["ListRentalFulfilments"],
    });
    setConfirmDialogOpen(false);
  };

  const handleCancelDisconnect = () => {
    setConfirmDialogOpen(false);
  };

  // Determine status color
  const getStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case "DRAFT":
        return "#9e9e9e";
      case "SUBMITTED":
        return "#1976d2";
      case "APPROVED":
        return "#2e7d32";
      case "RECEIVED":
        return "#66bb6a";
      case "CANCELLED":
        return "#d32f2f";
      default:
        return "#f57c00";
    }
  };

  const statusColor = getStatusColor(purchaseOrderStatus);
  const hasInventory = !!fulfilment.inventoryId;

  return (
    <>
      <Box
        sx={{
          p: 1.5,
          backgroundColor: "#f5f5f5",
          borderRadius: 1,
          border: "1px solid #bdbdbd",
          cursor: "pointer",
          transition: "all 0.2s",
          "&:hover": {
            backgroundColor: "#e0e0e0",
            transform: "translateY(-1px)",
            boxShadow: 1,
          },
        }}
        onClick={handleOpenPO}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <CheckCircleIcon sx={{ fontSize: 18, color: "#757575" }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: "#757575" }}>
              Purchase Order
            </Typography>
            {purchaseOrderStatus && (
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  px: 0.75,
                  py: 0.25,
                  borderRadius: 0.25,
                  backgroundColor: `${statusColor}15`,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 500,
                    color: statusColor,
                    textTransform: "uppercase",
                    fontSize: "0.65rem",
                    letterSpacing: "0.5px",
                  }}
                >
                  {purchaseOrderStatus}
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Tooltip
              title={
                hasInventory
                  ? "Cannot disconnect: Inventory is assigned"
                  : "Disconnect purchase order from fulfillment"
              }
            >
              <span>
                <IconButton
                  size="small"
                  onClick={handleDisconnectClick}
                  disabled={hasInventory}
                  sx={{
                    p: 0.5,
                    color: hasInventory ? "#bdbdbd" : "#ef5350",
                  }}
                >
                  <LinkOffIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </span>
            </Tooltip>
            <OpenInNewIcon sx={{ fontSize: 16, color: "#757575" }} />
          </Box>
        </Box>

        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
          PO #{purchaseOrderNumber || purchaseOrderId}
        </Typography>

        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
          Click to view purchase order details
        </Typography>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCancelDisconnect}
        onClick={(e) => e.stopPropagation()}
      >
        <DialogTitle>Disconnect Purchase Order?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to disconnect PO #{purchaseOrderNumber || purchaseOrderId} from
            this fulfillment? This action will remove the purchase order association.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDisconnect}>Cancel</Button>
          <Button onClick={handleConfirmDisconnect} color="error" variant="contained">
            Disconnect
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function RentalDurationCalendar({ startDate, endDate }: { startDate: Date; endDate: Date }) {
  const duration = differenceInCalendarDays(endDate, startDate);

  return (
    <Box
      sx={{
        p: 1.5,
        backgroundColor: "#e3f2fd",
        borderRadius: 1,
        border: "1px solid #90caf9",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <CalendarMonthIcon sx={{ fontSize: 18, color: "#1976d2" }} />
          <Typography variant="body2" sx={{ fontWeight: 600, color: "#1976d2" }}>
            Rental Duration
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ fontWeight: 600, color: "#1976d2" }}>
          {duration} {duration === 1 ? "day" : "days"}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.25 }}>
            Start
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {format(startDate, "MMM dd, yyyy")}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", px: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 2,
              backgroundColor: "#1976d2",
              position: "relative",
              "&::after": {
                content: '""',
                position: "absolute",
                right: -4,
                top: -3,
                width: 0,
                height: 0,
                borderLeft: "8px solid #1976d2",
                borderTop: "4px solid transparent",
                borderBottom: "4px solid transparent",
              },
            }}
          />
        </Box>

        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.25 }}>
            End
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {format(endDate, "MMM dd, yyyy")}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

function ProcurementSection({
  fulfilment,
  hasPurchaseOrder,
}: {
  fulfilment: InventoryAssignment_RentalFulFulfilment;
  hasPurchaseOrder: boolean;
}) {
  const [createPODialogOpen, setCreatePODialogOpen] = useState(false);
  const [addToExistingPODialogOpen, setAddToExistingPODialogOpen] = useState(false);

  const assignmentStart = new Date(fulfilment.rentalStartDate);
  const assignmentEnd = new Date(
    fulfilment.rentalEndDate || fulfilment.expectedRentalEndDate || addDays(assignmentStart, 14),
  );

  return (
    <Box>
      {hasPurchaseOrder ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          This fulfilment already has a purchase order associated with it
        </Typography>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create or adjust purchase orders for this fulfilment
          </Typography>

          {/* Fulfilment Details */}
          <Box sx={{ mb: 2, p: 1.5, backgroundColor: "#f5f5f5", borderRadius: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>
              {fulfilment.pimCategoryName}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
              {format(assignmentStart, "dd/MM/yyyy")} - {format(assignmentEnd, "dd/MM/yyyy")}
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => setCreatePODialogOpen(true)}
              sx={{
                textTransform: "uppercase",
                fontSize: "0.75rem",
                fontWeight: 600,
                py: 1,
                letterSpacing: "0.5px",
              }}
            >
              Create New Purchase Order
            </Button>
            <Button
              variant="outlined"
              color="primary"
              fullWidth
              onClick={() => setAddToExistingPODialogOpen(true)}
              sx={{
                textTransform: "uppercase",
                fontSize: "0.75rem",
                fontWeight: 600,
                py: 1,
                letterSpacing: "0.5px",
              }}
            >
              Add to Existing Purchase Order
            </Button>
          </Box>
        </>
      )}

      <CreatePurchaseOrderDialog
        open={createPODialogOpen}
        onClose={() => setCreatePODialogOpen(false)}
        fulfilment={fulfilment}
      />

      <AddToExistingPurchaseOrderDialog
        open={addToExistingPODialogOpen}
        onClose={() => setAddToExistingPODialogOpen(false)}
        fulfilment={fulfilment}
      />
    </Box>
  );
}

function InventoryList({
  inventory,
  isLoading,
  onDragStart,
  selectedFulfilmentId,
  selectedFulfilment,
  onAssign,
  onUnassign,
  workspaceId,
}: {
  inventory: InventoryItem[];
  isLoading?: boolean;
  onDragStart: (inventoryItem: InventoryItem | null) => void;
  selectedFulfilmentId: string | null;
  selectedFulfilment?: InventoryAssignment_RentalFulFulfilment;
  onAssign?: (inventoryItem: InventoryItem) => void;
  onUnassign?: () => void;
  workspaceId: string;
}) {
  if (isLoading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {[1, 2, 3, 4].map((index) => (
          <Paper
            key={index}
            sx={{
              p: 1.5,
              border: "1px solid #e0e0e0",
              borderRadius: 1,
            }}
          >
            <Box>
              <Skeleton variant="text" width="60%" height={20} sx={{ mb: 0.5 }} />
              <Skeleton variant="text" width="80%" height={16} sx={{ mb: 0.5 }} />
              <Skeleton variant="text" width="70%" height={16} />
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", mt: 1, gap: 0.5 }}>
              <Skeleton variant="circular" width={14} height={14} />
              <Skeleton variant="text" width="40%" height={14} />
            </Box>
            {selectedFulfilmentId && (
              <Box sx={{ mt: 1.5 }}>
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={32}
                  sx={{ borderRadius: 0.5 }}
                />
              </Box>
            )}
          </Paper>
        ))}
      </Box>
    );
  }

  if (inventory.length === 0 && selectedFulfilmentId) {
    return (
      <Box
        sx={{
          textAlign: "center",
          py: 4,
          px: 2,
          backgroundColor: "#f5f5f5",
          borderRadius: 1,
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          No inventory items found for this category
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {selectedFulfilment?.pimCategoryName || ""}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {inventory.map((inventoryItem) => (
        <EquipmentCard
          key={inventoryItem.id}
          inventoryItem={inventoryItem}
          onDragStart={onDragStart}
          selectedFulfilmentId={selectedFulfilmentId}
          selectedFulfilment={selectedFulfilment}
          onAssign={onAssign}
          onUnassign={onUnassign}
          workspaceId={workspaceId}
        />
      ))}
    </Box>
  );
}

function EquipmentCard({
  inventoryItem,
  onDragStart,
  selectedFulfilmentId,
  selectedFulfilment,
  onAssign,
  onUnassign,
  workspaceId,
}: {
  inventoryItem: InventoryItem;
  onDragStart: (inventoryItem: InventoryItem | null) => void;
  selectedFulfilmentId: string | null;
  selectedFulfilment?: InventoryAssignment_RentalFulFulfilment;
  onAssign?: (inventoryItem: InventoryItem) => void;
  onUnassign?: () => void;
  workspaceId: string;
}) {
  const router = useRouter();
  const [releaseConfirmDialogOpen, setReleaseConfirmDialogOpen] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    onDragStart(inventoryItem);
    e.dataTransfer.setData("inventoryItem", JSON.stringify(inventoryItem));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    onDragStart(null);
  };

  const handleAssignClick = () => {
    if (onAssign) {
      onAssign(inventoryItem);
    }
  };

  const handleReleaseClick = () => {
    setReleaseConfirmDialogOpen(true);
  };

  const handleConfirmRelease = () => {
    if (onUnassign) {
      onUnassign();
    }
    setReleaseConfirmDialogOpen(false);
  };

  const handleCancelRelease = () => {
    setReleaseConfirmDialogOpen(false);
  };

  const handleReceiveClick = () => {
    if (inventoryItem.purchaseOrderId && workspaceId) {
      const baseUrl = `/app/${workspaceId}/purchase-orders/${inventoryItem.purchaseOrderId}/receive`;

      // If we have a line item ID, add it to query params to auto-open the receive dialog
      if (inventoryItem.purchaseOrderLineItemId) {
        // Include returnPath so user can be returned to this page after receiving
        const currentPath = window.location.pathname + window.location.search;
        const params = new URLSearchParams({
          lineItemId: inventoryItem.purchaseOrderLineItemId,
          returnPath: currentPath,
        });
        router.push(`${baseUrl}?${params.toString()}`);
      } else {
        router.push(baseUrl);
      }
    }
  };

  const isAssignedToSelectedFulfilment =
    selectedFulfilmentId && selectedFulfilment?.inventoryId === inventoryItem.id;

  const showButton = selectedFulfilmentId;
  const isOnOrder = inventoryItem.status?.toUpperCase() === "ON_ORDER";

  return (
    <Paper
      sx={{
        p: 1.5,
        border: "1px solid #e0e0e0",
        borderRadius: 1,
        cursor: inventoryItem.fulfilmentId ? "default" : "grab",
        "&:hover": {
          backgroundColor: inventoryItem.fulfilmentId ? "#f5f5f5" : "transparent",
        },
        "&:active": {
          cursor: inventoryItem.fulfilmentId ? "default" : "grabbing",
        },
      }}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {inventoryItem.pimCategoryName}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
            {inventoryItem.asset?.name || inventoryItem.asset?.pim_product_model || "Unknown Model"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {inventoryItem.pimCategoryPath}
          </Typography>
        </Box>
      </Box>

      {inventoryItem.resourceMapId && (
        <Box sx={{ display: "flex", alignItems: "center", mt: 1, gap: 0.5 }}>
          <LocationOnIcon sx={{ fontSize: 14, color: "text.secondary" }} />
          <Typography variant="caption" color="text.secondary">
            {inventoryItem.resourceMapId}
          </Typography>
        </Box>
      )}

      {inventoryItem.fulfilmentId && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
          {inventoryItem.fulfilmentId}
        </Typography>
      )}

      {isOnOrder && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mt: 1,
          }}
        >
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              px: 0.75,
              py: 0.25,
              borderRadius: 0.25,
              backgroundColor: "#f57c0015",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: 500,
                color: "#f57c00",
                textTransform: "uppercase",
                fontSize: "0.65rem",
                letterSpacing: "0.5px",
              }}
            >
              On Order
            </Typography>
          </Box>
          {inventoryItem.purchaseOrderId && workspaceId && (
            <Button
              variant="text"
              color="primary"
              size="small"
              onClick={handleReceiveClick}
              sx={{
                minWidth: "auto",
                padding: "2px 8px",
                fontSize: "0.75rem",
                textTransform: "none",
              }}
            >
              Receive Item
            </Button>
          )}
        </Box>
      )}

      {showButton && (
        <Box sx={{ mt: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
          {isAssignedToSelectedFulfilment ? (
            <>
              <Button
                variant="outlined"
                color="error"
                size="small"
                fullWidth
                onClick={handleReleaseClick}
              >
                Release
              </Button>

              {/* Release Confirmation Dialog */}
              <Dialog open={releaseConfirmDialogOpen} onClose={handleCancelRelease}>
                <DialogTitle>Release Inventory?</DialogTitle>
                <DialogContent>
                  <Typography>
                    Are you sure you want to release this inventory from the fulfillment?
                    {selectedFulfilment?.purchaseOrderLineItemId && (
                      <> This will also disconnect the associated purchase order.</>
                    )}
                  </Typography>
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleCancelRelease}>Cancel</Button>
                  <Button onClick={handleConfirmRelease} color="error" variant="contained">
                    Release
                  </Button>
                </DialogActions>
              </Dialog>
            </>
          ) : (
            <Button
              variant="contained"
              color="primary"
              size="small"
              fullWidth
              onClick={handleAssignClick}
              disabled={
                inventoryItem.fulfilmentId !== null && inventoryItem.fulfilmentId !== undefined
              }
            >
              Reserve
            </Button>
          )}
        </Box>
      )}
    </Paper>
  );
}
