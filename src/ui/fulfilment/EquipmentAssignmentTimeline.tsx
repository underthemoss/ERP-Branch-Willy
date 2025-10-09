"use client";

import { graphql } from "@/graphql";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ClearIcon from "@mui/icons-material/Clear";
import ContactPageOutlinedIcon from "@mui/icons-material/ContactPageOutlined";
import FilterListIcon from "@mui/icons-material/FilterList";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Popover,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { addDays, differenceInCalendarDays, format } from "date-fns";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import ContactSelector from "../ContactSelector";
import { InventoryFieldsFragment as InventoryItem } from "../inventory/api";
import {
  FulfilmentType,
  InventoryAssignment_RentalFulFulfilment,
  useAssignInventoryToRentalFulfilmentMutation,
  useListRentalFulfilmentsQuery,
  useUnassignInventoryFromRentalFulfilmentMutation,
} from "./api";
import { SourcingPanel } from "./SourcingPanel";

type ViewMode = "30days" | "60days" | "90days" | "custom";

const VIEW_DAYS: Record<Exclude<ViewMode, "custom">, number> = {
  "30days": 30,
  "60days": 60,
  "90days": 90,
};

// Helper function to format duration in shorthand
function formatDurationShorthand(startDate: Date, endDate: Date): string {
  const totalDays = differenceInCalendarDays(endDate, startDate);

  if (totalDays === 0) {
    return "0d";
  }

  if (totalDays === 1) {
    return "1d";
  }

  // Calculate months, weeks, and days
  const months = Math.floor(totalDays / 30);
  const remainingAfterMonths = totalDays % 30;
  const weeks = Math.floor(remainingAfterMonths / 7);
  const days = remainingAfterMonths % 7;

  const parts: string[] = [];

  if (months > 0) {
    parts.push(`${months}m`);
  }

  if (weeks > 0) {
    parts.push(`${weeks}w`);
  }

  if (days > 0) {
    parts.push(`${days}d`);
  }

  // If it's exactly divisible by weeks or months, show just that unit
  if (totalDays % 7 === 0 && totalDays < 30) {
    return `${totalDays / 7}w`;
  }

  if (totalDays % 30 === 0) {
    return `${totalDays / 30}m`;
  }

  return parts.join(" ");
}

export default function EquipmentAssignmentTimeline() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = params?.workspace_id as string;

  const [viewMode, setViewMode] = useState<ViewMode>("30days");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(addDays(new Date(), 29));
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customDateDialogOpen, setCustomDateDialogOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date | null>(new Date());
  const [tempEndDate, setTempEndDate] = useState<Date | null>(addDays(new Date(), 13));
  const [draggedEquipment, setDraggedEquipment] = useState<InventoryItem | null>(null);

  // Get selected fulfilment ID and sales order ID from URL
  const selectedFulfilmentId = searchParams.get("fulfilmentId") || "";
  const selectedSalesOrderId = searchParams.get("salesOrderId") || "";

  // Calculate days to show based on view mode
  const daysToShow =
    viewMode === "custom" ? differenceInCalendarDays(endDate, startDate) + 1 : VIEW_DAYS[viewMode];

  // Generate date array for timeline header
  const dates = Array.from({ length: daysToShow }, (_, i) => addDays(startDate, i));

  // Update dates when view mode changes
  useEffect(() => {
    if (viewMode !== "custom") {
      const today = new Date();
      setStartDate(today);
      setEndDate(addDays(today, VIEW_DAYS[viewMode] - 1));
    }
  }, [viewMode]);

  // Fetch rental fulfilments with optional customer filter, sales order filter, and date range
  const { data, loading, error } = useListRentalFulfilmentsQuery({
    variables: {
      filter: {
        workspaceId: workspaceId,
        salesOrderType: FulfilmentType.Rental,
        timelineStartDate: startDate,
        timelineEndDate: endDate,
        ...(selectedCustomerId && { contactId: selectedCustomerId }),
        ...(selectedSalesOrderId && { salesOrderId: selectedSalesOrderId }),
      },
      page: {
        size: 100,
      },
    },
    fetchPolicy: "cache-and-network",
  });

  const [assignInventory] = useAssignInventoryToRentalFulfilmentMutation();
  const [unassignInventory] = useUnassignInventoryFromRentalFulfilmentMutation();

  const handleCustomerChange = (contactId: string) => {
    setSelectedCustomerId(contactId);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    if (mode === "custom") {
      setCustomDateDialogOpen(true);
      setTempStartDate(startDate);
      setTempEndDate(endDate);
    } else {
      setViewMode(mode);
    }
  };

  const handleCustomDateConfirm = () => {
    if (tempStartDate && tempEndDate) {
      setStartDate(tempStartDate);
      setEndDate(tempEndDate);
      setViewMode("custom");
      setCustomDateDialogOpen(false);
    }
  };

  const handleCustomDateCancel = () => {
    setCustomDateDialogOpen(false);
    setTempStartDate(startDate);
    setTempEndDate(endDate);
  };

  const fulfilments = data?.listRentalFulfilments?.items || [];

  // Find the selected fulfilment
  const selectedFulfilment = fulfilments.find((f) => f.id === selectedFulfilmentId);

  // Handle fulfilment selection
  const handleFulfilmentSelect = (fulfilmentId: string) => {
    const newParams = new URLSearchParams(searchParams.toString());
    if (fulfilmentId === selectedFulfilmentId) {
      // Deselect if clicking the same fulfilment
      newParams.delete("fulfilmentId");
    } else {
      // Select new fulfilment
      newParams.set("fulfilmentId", fulfilmentId);
    }
    router.push(`?${newParams.toString()}`);
  };

  // Handle clearing sales order filter
  const handleClearSalesOrderFilter = () => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete("salesOrderId");
    router.push(`?${newParams.toString()}`);
  };

  // Callback for when equipment is dropped on a fulfilment
  const handleEquipmentAssignment = async (
    inventoryItem: InventoryItem,
    fulfilment: InventoryAssignment_RentalFulFulfilment,
  ) => {
    await assignInventory({
      variables: {
        fulfilmentId: fulfilment.id,
        inventoryId: inventoryItem.id,
        allowOverlappingReservations: true,
      },
      refetchQueries: ["ListRentalFulfilments", "ListInventoryItems"],
    });
  };

  // Callback for unassigning equipment from a fulfilment
  const handleEquipmentUnassignment = async (fulfilmentId: string) => {
    await unassignInventory({
      variables: {
        fulfilmentId: fulfilmentId,
      },
      refetchQueries: ["ListRentalFulfilments", "ListInventoryItems"],
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3, backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                Inventory Assignment Timeline
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Drag inventory from the pool to assign to rental fulfillments
              </Typography>
            </Box>

            {/* View Toggle */}
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                View:
              </Typography>
              <Button
                variant={viewMode === "30days" ? "contained" : "outlined"}
                size="small"
                onClick={() => handleViewModeChange("30days")}
                sx={{ minWidth: "80px" }}
              >
                30 days
              </Button>
              <Button
                variant={viewMode === "60days" ? "contained" : "outlined"}
                size="small"
                onClick={() => handleViewModeChange("60days")}
                sx={{ minWidth: "80px" }}
              >
                60 days
              </Button>
              <Button
                variant={viewMode === "90days" ? "contained" : "outlined"}
                size="small"
                onClick={() => handleViewModeChange("90days")}
                sx={{ minWidth: "80px" }}
              >
                90 days
              </Button>
              <Button
                variant={viewMode === "custom" ? "contained" : "outlined"}
                size="small"
                onClick={() => handleViewModeChange("custom")}
                startIcon={<CalendarMonthIcon />}
                sx={{ minWidth: "100px" }}
              >
                Custom
              </Button>
            </Box>
          </Box>

          {/* Filters Row */}
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
            <Box sx={{ minWidth: 250 }}>
              <ContactSelector
                contactId={selectedCustomerId}
                onChange={handleCustomerChange}
                type="any"
                workspaceId={workspaceId}
              />
            </Box>

            {/* Sales Order Filter Display */}
            {selectedSalesOrderId && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 2,
                  py: 0.5,
                  backgroundColor: "rgba(25, 118, 210, 0.08)",
                  borderRadius: 1,
                  border: "1px solid rgba(25, 118, 210, 0.2)",
                }}
              >
                <FilterListIcon sx={{ fontSize: 18, color: "primary.main" }} />
                <Typography variant="body2" color="primary.main">
                  Sales Order: {selectedSalesOrderId}
                </Typography>
                <Button
                  size="small"
                  onClick={handleClearSalesOrderFilter}
                  sx={{
                    minWidth: "auto",
                    p: 0.5,
                    color: "primary.main",
                    "&:hover": {
                      backgroundColor: "rgba(25, 118, 210, 0.08)",
                    },
                  }}
                >
                  <ClearIcon sx={{ fontSize: 18 }} />
                </Button>
              </Box>
            )}

            {/* Date Range Display */}
            <Typography variant="body2" color="text.secondary">
              Showing: {format(startDate, "MMM dd, yyyy")} - {format(endDate, "MMM dd, yyyy")}
              {viewMode === "custom" && ` (${daysToShow} days)`}
            </Typography>
          </Box>
        </Box>

        {/* Main Content Area with Animated Sourcing Panel */}
        <Box sx={{ display: "flex", gap: 2, maxHeight: "70vh", overflow: "hidden" }}>
          {/* Animated Sourcing Panel on Left */}
          <Box
            sx={{
              width: selectedFulfilmentId ? 450 : 0,
              flexShrink: 0,
              overflowY: selectedFulfilmentId ? "auto" : "hidden",
              overflowX: "hidden",
              transition: "width 0.3s ease-in-out",
              opacity: selectedFulfilmentId ? 1 : 0,
            }}
          >
            {selectedFulfilmentId && (
              <Box sx={{ width: 450 }}>
                <SourcingPanel
                  key={selectedFulfilment?.id}
                  selectedFulfilment={selectedFulfilment}
                  onDragStart={setDraggedEquipment}
                  workspaceId={workspaceId}
                />
              </Box>
            )}
          </Box>

          {/* Timeline View */}
          <Box sx={{ overflowX: "auto", minWidth: 0, flex: 1 }}>
            <TimelineView
              dates={dates}
              startDate={startDate}
              fulfilments={fulfilments}
              draggedEquipment={draggedEquipment}
              onEquipmentDrop={handleEquipmentAssignment}
              selectedFulfilmentId={selectedFulfilmentId}
              onFulfilmentSelect={handleFulfilmentSelect}
            />
          </Box>
        </Box>

        {/* Custom Date Range Dialog */}
        <Dialog
          open={customDateDialogOpen}
          onClose={handleCustomDateCancel}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Select Custom Date Range</DialogTitle>
          <DialogContent>
            <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
              <DatePicker
                label="Start Date"
                value={tempStartDate}
                onChange={(newValue) => setTempStartDate(newValue as Date | null)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />
              <DatePicker
                label="End Date"
                value={tempEndDate}
                onChange={(newValue) => setTempEndDate(newValue as Date | null)}
                minDate={tempStartDate || undefined}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />
            </Box>
            {tempStartDate && tempEndDate && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Duration: {differenceInCalendarDays(tempEndDate, tempStartDate)} days
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCustomDateCancel}>Cancel</Button>
            <Button
              onClick={handleCustomDateConfirm}
              variant="contained"
              disabled={!tempStartDate || !tempEndDate || tempEndDate < tempStartDate}
            >
              Apply
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}

function TimelineView({
  dates,
  startDate,
  fulfilments,
  draggedEquipment,
  onEquipmentDrop,
  selectedFulfilmentId,
  onFulfilmentSelect,
}: {
  dates: Date[];
  startDate: Date;
  fulfilments: InventoryAssignment_RentalFulFulfilment[];
  draggedEquipment: InventoryItem | null;
  onEquipmentDrop: (
    inventoryItem: InventoryItem,
    fulfilment: InventoryAssignment_RentalFulFulfilment,
  ) => void;
  selectedFulfilmentId: string;
  onFulfilmentSelect: (fulfilmentId: string) => void;
}) {
  const cellWidth = 60;
  const rowHeight = 80;
  const headerHeight = 88;

  return (
    <Paper sx={{ display: "flex", overflow: "hidden" }}>
      {/* Fixed Left Panel - Customer Info */}
      <Box
        sx={{
          width: 250,
          flexShrink: 0,
          borderRight: "2px solid #e0e0e0",
          backgroundColor: "white",
        }}
      >
        {/* Customer Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: "2px solid #e0e0e0",
            height: headerHeight,
            display: "flex",
            alignItems: "center",
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Customer & Product
          </Typography>
        </Box>

        {/* Customer Rows */}
        <Box>
          {fulfilments.map((fulfilment) => (
            <CustomerInfoRow
              key={fulfilment.id}
              fulfilment={fulfilment}
              rowHeight={rowHeight}
              draggedEquipment={draggedEquipment}
              onEquipmentDrop={onEquipmentDrop}
              isSelected={fulfilment.id === selectedFulfilmentId}
              onSelect={() => onFulfilmentSelect(fulfilment.id)}
            />
          ))}
        </Box>
      </Box>

      {/* Scrollable Right Panel - Timeline */}
      <Box sx={{ overflowX: "auto", minWidth: 0 }}>
        <Box sx={{ flex: 1, overflowX: "auto" }}>
          {/* Timeline Header */}
          <Box
            sx={{
              display: "flex",
              borderBottom: "2px solid #e0e0e0",
              py: 2,
              width: dates.length * cellWidth,
              height: headerHeight,
            }}
          >
            {dates.map((date, index) => (
              <Box
                key={index}
                sx={{
                  width: cellWidth,
                  textAlign: "center",
                  borderLeft: index === 0 ? "none" : "1px solid #f0f0f0",
                }}
              >
                <Typography variant="caption" sx={{ display: "block", fontWeight: 600 }}>
                  {format(date, "dd")}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", fontSize: "0.65rem" }}
                >
                  {format(date, "EEE")}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", fontSize: "0.65rem" }}
                >
                  {format(date, "MMM")}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Timeline Rows */}
          <Box sx={{ minHeight: rowHeight * 10 }}>
            {fulfilments.map((fulfilment) => (
              <TimelineRow
                key={fulfilment.id}
                fulfilment={fulfilment}
                startDate={startDate}
                dates={dates}
                cellWidth={cellWidth}
                rowHeight={rowHeight}
                draggedEquipment={draggedEquipment}
                onEquipmentDrop={onEquipmentDrop}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}

function CustomerInfoRow({
  fulfilment,
  rowHeight,
  draggedEquipment,
  onEquipmentDrop,
  isSelected,
  onSelect,
}: {
  fulfilment: InventoryAssignment_RentalFulFulfilment;
  rowHeight: number;
  draggedEquipment: InventoryItem | null;
  onEquipmentDrop: (
    inventoryItem: InventoryItem,
    fulfilment: InventoryAssignment_RentalFulFulfilment,
  ) => void;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const params = useParams();
  const workspaceId = params?.workspace_id as string;

  const assignmentStart = new Date(fulfilment.rentalStartDate);
  const assignmentEnd = new Date(
    fulfilment.rentalEndDate || fulfilment.expectedRentalEndDate || addDays(assignmentStart, 14),
  );
  const duration = differenceInCalendarDays(assignmentEnd, assignmentStart);

  const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (draggedEquipment) {
      onEquipmentDrop(draggedEquipment, fulfilment);
    } else {
      // Fallback: try to get inventory data from dataTransfer
      const inventoryData = e.dataTransfer.getData("inventory");
      if (inventoryData) {
        try {
          const inventoryItem = JSON.parse(inventoryData);
          onEquipmentDrop(inventoryItem, fulfilment);
        } catch (error) {
          console.error("Failed to parse inventory data:", error);
        }
      }
    }
  };

  return (
    <>
      <Box
        sx={{
          height: rowHeight,
          borderBottom: "1px solid #f0f0f0",
          p: 2,
          display: "flex",
          alignItems: "center",
          backgroundColor: isDragOver
            ? "rgba(66, 165, 245, 0.1)"
            : isSelected
              ? "rgba(25, 118, 210, 0.08)"
              : "transparent",
          transition: "background-color 0.2s",
          position: "relative",
          cursor: "pointer",
          borderLeft: isSelected ? "3px solid #1976d2" : "3px solid transparent",
          "&:hover": {
            backgroundColor: isDragOver
              ? "rgba(66, 165, 245, 0.1)"
              : isSelected
                ? "rgba(25, 118, 210, 0.12)"
                : "rgba(0, 0, 0, 0.04)",
          },
          "&::after": isDragOver
            ? {
                content: '""',
                position: "absolute",
                inset: 0,
                border: "2px dashed #42a5f5",
                borderRadius: 1,
                pointerEvents: "none",
              }
            : {},
        }}
        onClick={onSelect}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onMouseEnter={handlePopoverOpen}
        onMouseLeave={handlePopoverClose}
      >
        <Box sx={{ width: "100%", position: "relative" }}>
          {/* Checked icon in top right if inventory is assigned */}
          {fulfilment.inventoryId && (
            <CheckCircleIcon
              sx={{
                position: "absolute",
                top: 0,
                right: -8,
                fontSize: 20,
                color: "#66bb6a",
                backgroundColor: "white",
                borderRadius: "50%",
              }}
            />
          )}

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
            <ContactPageOutlinedIcon sx={{ fontSize: 16, flexShrink: 0 }} />
            {fulfilment.contact?.id ? (
              <Link
                href={`/app/${workspaceId}/contacts/${fulfilment.contact.id}`}
                onClick={(e) => e.stopPropagation()}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flex: 1,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    "&:hover": {
                      color: "primary.main",
                      textDecoration: "underline",
                    },
                  }}
                >
                  {fulfilment.contact?.name}
                </Typography>
              </Link>
            ) : (
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {fulfilment.contact?.name}
              </Typography>
            )}
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "block",
              wordBreak: "break-word",
              lineHeight: 1.3,
              mb: 0.5,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {fulfilment.pimCategoryName}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                {format(assignmentStart, "dd/MM/yyyy")}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {" - "}
                {format(assignmentEnd, "dd/MM/yyyy")}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
              <AccessTimeIcon sx={{ fontSize: "0.75rem", color: "text.secondary" }} />
              <Typography variant="caption" color="text.secondary">
                {duration}d
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Rich Popover with Fulfillment Details */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handlePopoverClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        disableRestoreFocus
        sx={{
          pointerEvents: "none",
        }}
        slotProps={{
          paper: {
            sx: {
              pointerEvents: "auto",
              p: 2,
              maxWidth: 400,
              boxShadow: 6,
            },
            onMouseEnter: handlePopoverOpen,
            onMouseLeave: handlePopoverClose,
          },
        }}
      >
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Fulfillment Details
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Stack spacing={1.5}>
          {/* Customer Info */}
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              CUSTOMER
            </Typography>
            <Typography variant="body2">{fulfilment.contact?.name || "N/A"}</Typography>
          </Box>

          {/* Product/Category */}
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              REQUEST TYPE
            </Typography>
            <Typography variant="body2">{fulfilment.pimCategoryName || "N/A"}</Typography>
          </Box>

          {/* Rental Period */}
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              RENTAL PERIOD
            </Typography>
            <Typography variant="body2">
              {format(assignmentStart, "MMM dd, yyyy")} - {format(assignmentEnd, "MMM dd, yyyy")}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Duration: {duration} days
            </Typography>
          </Box>

          {/* Status */}
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              STATUS
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
              {fulfilment.inventoryId ? (
                <>
                  <CheckCircleIcon sx={{ fontSize: 16, color: "#66bb6a" }} />
                  <Typography variant="body2" color="#66bb6a" fontWeight={500}>
                    Inventory Assigned
                  </Typography>
                </>
              ) : fulfilment.purchaseOrderLineItemId ? (
                <>
                  <WarningAmberIcon sx={{ fontSize: 16, color: "#fbc02d" }} />
                  <Typography variant="body2" color="#fbc02d" fontWeight={500}>
                    PO Created
                  </Typography>
                </>
              ) : (
                <>
                  <WarningAmberIcon sx={{ fontSize: 16, color: "#ef5350" }} />
                  <Typography variant="body2" color="#ef5350" fontWeight={500}>
                    Not Sourced
                  </Typography>
                </>
              )}
            </Box>
          </Box>

          {/* Additional Details */}
          {fulfilment.inventoryId && (
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                INVENTORY ID
              </Typography>
              <Typography variant="body2" fontFamily="monospace">
                {fulfilment.inventoryId}
              </Typography>
            </Box>
          )}

          {fulfilment.purchaseOrderLineItem && (
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                PURCHASE ORDER
              </Typography>
              <Typography variant="body2">
                {fulfilment.purchaseOrderLineItem.__typename === "RentalPurchaseOrderLineItem" ||
                fulfilment.purchaseOrderLineItem.__typename === "SalePurchaseOrderLineItem"
                  ? fulfilment.purchaseOrderLineItem.purchaseOrder?.purchase_order_number ||
                    fulfilment.purchaseOrderNumber
                  : fulfilment.purchaseOrderNumber}
              </Typography>
              {(fulfilment.purchaseOrderLineItem.__typename === "RentalPurchaseOrderLineItem" ||
                fulfilment.purchaseOrderLineItem.__typename === "SalePurchaseOrderLineItem") &&
                fulfilment.purchaseOrderLineItem.purchaseOrder?.seller && (
                  <Typography variant="caption" color="text.secondary">
                    Vendor: {fulfilment.purchaseOrderLineItem.purchaseOrder.seller.name}
                  </Typography>
                )}
            </Box>
          )}

          {fulfilment.salesOrder && (
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                SALES ORDER
              </Typography>
              <Typography variant="body2">
                {fulfilment.salesOrder.sales_order_number || fulfilment.salesOrderId}
              </Typography>
            </Box>
          )}
        </Stack>
      </Popover>
    </>
  );
}

function TimelineRow({
  fulfilment,
  startDate,
  dates,
  cellWidth,
  rowHeight,
  draggedEquipment,
  onEquipmentDrop,
}: {
  fulfilment: InventoryAssignment_RentalFulFulfilment;
  startDate: Date;
  dates: Date[];
  cellWidth: number;
  rowHeight: number;
  draggedEquipment: InventoryItem | null;
  onEquipmentDrop: (
    inventoryItem: InventoryItem,
    fulfilment: InventoryAssignment_RentalFulFulfilment,
  ) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const params = useParams();
  const workspaceId = params?.workspace_id as string;

  const fulfilmentStart = new Date(fulfilment.rentalStartDate);
  const fulfilmentEnd = new Date(
    fulfilment.rentalEndDate || fulfilment.expectedRentalEndDate || addDays(fulfilmentStart, 14),
  );

  // Calculate position and width of the fulfilment bar
  const dayOffset = differenceInCalendarDays(fulfilmentStart, startDate);
  const duration = differenceInCalendarDays(fulfilmentEnd, fulfilmentStart);

  // Calculate the actual visible portion of the bar
  const visibleStartOffset = Math.max(0, dayOffset);
  const visibleEndOffset = Math.min(dates.length, dayOffset + duration);
  const visibleDuration = visibleEndOffset - visibleStartOffset;

  const barLeft = visibleStartOffset * cellWidth;
  const barWidth = visibleDuration * cellWidth - 8; // Subtract padding

  // Determine if borders should be shown
  const showLeftBorder = fulfilmentStart >= dates[0];
  const showRightBorder = dates.length > 0 && fulfilmentEnd <= dates[dates.length - 1];

  // Determine if fulfilment is within visible range
  const isVisible = visibleEndOffset > 0 && visibleStartOffset < dates.length;

  // Determine color based on priority: inventory (green) > PO line item (amber) > neither (red)
  const hasInventory = !!fulfilment.inventoryId;
  const hasPOLineItem = !!fulfilment.purchaseOrderLineItemId;

  // Extract purchase order ID
  const purchaseOrderId =
    fulfilment.purchaseOrderLineItem?.__typename === "RentalPurchaseOrderLineItem"
      ? fulfilment.purchaseOrderLineItem.purchase_order_id
      : fulfilment.purchaseOrderLineItem?.__typename === "SalePurchaseOrderLineItem"
        ? fulfilment.purchaseOrderLineItem.purchase_order_id
        : null;

  const barColor = hasInventory ? "#66bb6a" : hasPOLineItem ? "#fbc02d" : "#ef5350";
  const backgroundColor = hasInventory ? "#e8f5e9" : hasPOLineItem ? "#fff8e1" : "#ffebee";

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (draggedEquipment) {
      onEquipmentDrop(draggedEquipment, fulfilment);
    } else {
      // Fallback: try to get inventory data from dataTransfer
      const inventoryData = e.dataTransfer.getData("inventory");
      if (inventoryData) {
        try {
          const inventoryItem = JSON.parse(inventoryData);
          onEquipmentDrop(inventoryItem, fulfilment);
        } catch (error) {
          console.error("Failed to parse inventory data:", error);
        }
      }
    }
  };

  if (!isVisible) {
    return (
      <Box
        sx={{
          height: rowHeight,
          borderBottom: "1px solid #f0f0f0",
          position: "relative",
          width: dates.length * cellWidth,
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      />
    );
  }

  return (
    <Box
      sx={{
        height: rowHeight,
        borderBottom: "1px solid #f0f0f0",
        position: "relative",
        width: dates.length * cellWidth,
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Box
        sx={{
          position: "absolute",
          left: barLeft + 4,
          top: "50%",
          transform: "translateY(-50%)",
          width: Math.max(barWidth, 30),
          height: 48,
          backgroundColor: backgroundColor,
          border: `2px solid ${barColor}`,
          borderRadius: "4px",
          borderLeft: showLeftBorder ? `2px solid ${barColor}` : "none",
          borderRight: showRightBorder ? `2px solid ${barColor}` : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1,
          cursor: purchaseOrderId ? "pointer" : "default",
          transition: "all 0.2s",
          "&:hover": purchaseOrderId
            ? {
                transform: "translateY(-50%) scale(1.02)",
                boxShadow: 2,
              }
            : {},
        }}
        onClick={(e) => {
          if (purchaseOrderId) {
            e.stopPropagation();
            window.open(`/app/${workspaceId}/purchase-orders/${purchaseOrderId}`, "_blank");
          }
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            minWidth: 0,
            flex: 1,
          }}
        >
          {hasInventory ? (
            <CheckCircleIcon sx={{ fontSize: 16, color: barColor, flexShrink: 0 }} />
          ) : hasPOLineItem ? (
            <WarningAmberIcon sx={{ fontSize: 16, color: barColor, flexShrink: 0 }} />
          ) : (
            <WarningAmberIcon sx={{ fontSize: 16, color: barColor, flexShrink: 0 }} />
          )}

          <Typography
            variant="caption"
            sx={{
              fontWeight: 500,
              color: barColor,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {hasInventory
              ? `Inv: ${fulfilment.inventoryId}`
              : hasPOLineItem
                ? `PO: ${fulfilment.purchaseOrderNumber || "..."}`
                : "Not Sourced"}
          </Typography>
        </Box>

        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: barColor,
            flexShrink: 0,
            ml: 1,
          }}
        >
          {formatDurationShorthand(fulfilmentStart, fulfilmentEnd)}
        </Typography>
      </Box>
    </Box>
  );
}
