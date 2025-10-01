"use client";

import { graphql } from "@/graphql";
import { useSourcingPanelListInventoryQuery } from "@/graphql/hooks";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ClearIcon from "@mui/icons-material/Clear";
import ContactPageOutlinedIcon from "@mui/icons-material/ContactPageOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FilterListIcon from "@mui/icons-material/FilterList";
import InventoryIcon from "@mui/icons-material/Inventory";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Badge,
  Box,
  Button,
  Paper,
  Skeleton,
  Switch,
  Typography,
} from "@mui/material";
import { addDays, format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { InventoryFieldsFragment as InventoryItem } from "../inventory/api";
import { AddToExistingPurchaseOrderDialog } from "./AddToExistingPurchaseOrderDialog";
import {
  InventoryAssignment_RentalFulFulfilment,
  useAssignInventoryToRentalFulfilmentMutation,
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
      }
      ... on SalePurchaseOrderLineItem {
        id
        purchase_order_id
      }
    }
    salesOrderId
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
}

export function SourcingPanel({ selectedFulfilment, onDragStart }: SourcingPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inventoryFilterActive, setInventoryFilterActive] = useState(true);
  const [procurementExpanded, setProcurementExpanded] = useState(false);
  const [inventoryExpanded, setInventoryExpanded] = useState(true);

  // Fetch inventory items based on filter state
  const { data: inventoryData, loading: inventoryLoading } = useSourcingPanelListInventoryQuery({
    variables: {
      query: {
        filter:
          selectedFulfilment?.pimCategoryId && inventoryFilterActive
            ? { pimCategoryId: selectedFulfilment.pimCategoryId }
            : {},
        page: {
          size: 100,
        },
      },
    },
    fetchPolicy: "cache-and-network",
  });

  const [assignInventory] = useAssignInventoryToRentalFulfilmentMutation();
  const [unassignInventory] = useUnassignInventoryFromRentalFulfilmentMutation();

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

    await unassignInventory({
      variables: {
        fulfilmentId: selectedFulfilment.id,
      },
      refetchQueries: ["ListRentalFulfilments", "SourcingPanelListInventory"],
    });
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
          Drag to assign to rentals
        </Typography>

        <InventoryList
          inventory={inventory}
          isLoading={inventoryLoading}
          onDragStart={onDragStart}
          selectedFulfilmentId={null}
          selectedFulfilment={undefined}
          onAssign={handleAssign}
          onUnassign={handleUnassign}
        />
      </Paper>
    );
  }

  // Show Sourcing panel with collapsible sections
  return (
    <Paper sx={{ mb: 2 }}>
      <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Sourcing
        </Typography>
        <Button
          size="small"
          startIcon={<ClearIcon />}
          onClick={handleClearFilter}
          sx={{ textTransform: "none" }}
        >
          Clear
        </Button>
      </Box>

      {/* Product Demand Details */}
      <Box sx={{ px: 2, pb: 2 }}>
        <Box
          sx={{
            p: 1.5,
            backgroundColor: "#f9f9f9",
            borderRadius: 1,
            border: "1px solid #e0e0e0",
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            {selectedFulfilment.pimCategoryName}
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <ContactPageOutlinedIcon sx={{ fontSize: 14, color: "text.secondary" }} />
              <Typography variant="caption" color="text.secondary">
                {selectedFulfilment.contact?.name}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <CalendarMonthIcon sx={{ fontSize: 14, color: "text.secondary" }} />
              <Typography variant="caption" color="text.secondary">
                {format(new Date(selectedFulfilment.rentalStartDate), "dd/MM/yyyy")} -{" "}
                {format(
                  new Date(
                    selectedFulfilment.rentalEndDate ||
                      selectedFulfilment.expectedRentalEndDate ||
                      addDays(new Date(selectedFulfilment.rentalStartDate), 14),
                  ),
                  "dd/MM/yyyy",
                )}
              </Typography>
            </Box>
            {selectedFulfilment.project && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Project: {selectedFulfilment.project.name}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* Procurement Section */}
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
              Procurement
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <ProcurementSection fulfilment={selectedFulfilment} />
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
            Click to assign/unassign or drag to assign
          </Typography>

          <InventoryList
            inventory={inventory}
            isLoading={inventoryLoading}
            onDragStart={onDragStart}
            selectedFulfilmentId={selectedFulfilment.id}
            selectedFulfilment={selectedFulfilment}
            onAssign={handleAssign}
            onUnassign={handleUnassign}
          />
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
}

function ProcurementSection({
  fulfilment,
}: {
  fulfilment: InventoryAssignment_RentalFulFulfilment;
}) {
  const [createPODialogOpen, setCreatePODialogOpen] = useState(false);
  const [addToExistingPODialogOpen, setAddToExistingPODialogOpen] = useState(false);

  const assignmentStart = new Date(fulfilment.rentalStartDate);
  const assignmentEnd = new Date(
    fulfilment.rentalEndDate || fulfilment.expectedRentalEndDate || addDays(assignmentStart, 14),
  );

  return (
    <Box>
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
}: {
  inventory: InventoryItem[];
  isLoading?: boolean;
  onDragStart: (inventoryItem: InventoryItem | null) => void;
  selectedFulfilmentId: string | null;
  selectedFulfilment?: InventoryAssignment_RentalFulFulfilment;
  onAssign?: (inventoryItem: InventoryItem) => void;
  onUnassign?: () => void;
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
}: {
  inventoryItem: InventoryItem;
  onDragStart: (inventoryItem: InventoryItem | null) => void;
  selectedFulfilmentId: string | null;
  selectedFulfilment?: InventoryAssignment_RentalFulFulfilment;
  onAssign?: (inventoryItem: InventoryItem) => void;
  onUnassign?: () => void;
}) {
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

  const handleUnassignClick = () => {
    if (onUnassign) {
      onUnassign();
    }
  };

  const isAssignedToSelectedFulfilment =
    selectedFulfilmentId && selectedFulfilment?.inventoryId === inventoryItem.id;

  const showButton = selectedFulfilmentId;

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

      {showButton && (
        <Box sx={{ mt: 1.5 }}>
          {isAssignedToSelectedFulfilment ? (
            <Button
              variant="outlined"
              color="error"
              size="small"
              fullWidth
              onClick={handleUnassignClick}
            >
              Unassign
            </Button>
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
              Assign
            </Button>
          )}
        </Box>
      )}
    </Paper>
  );
}
