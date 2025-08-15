"use client";

import { FragmentType, graphql } from "@/graphql";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ContactPageOutlinedIcon from "@mui/icons-material/ContactPageOutlined";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { addDays, differenceInCalendarDays, format } from "date-fns";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useListContactsQuery } from "../contacts/api";
import {
  InventoryFieldsFragment as InventoryItem,
  useListInventoryItemsQuery,
} from "../inventory/api";
import {
  FulfilmentType,
  InventoryAssignment_RentalFulFulfilment,
  useAssignInventoryToRentalFulfilmentMutation,
  useListRentalFulfilmentsQuery,
  useUnassignInventoryFromRentalFulfilmentMutation,
} from "./api";

const RentalFulfilmentFieldsFragment = graphql(`
  fragment InventoryAssignment_RentalFulFulfilmentFields on RentalFulfilment {
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

type t = typeof RentalFulfilmentFieldsFragment;

type ViewMode = "2weeks" | "30days" | "60days" | "custom";

const VIEW_DAYS: Record<Exclude<ViewMode, "custom">, number> = {
  "2weeks": 14,
  "30days": 30,
  "60days": 60,
};

export default function EquipmentAssignmentTimeline() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = params?.workspace_id as string;

  const [viewMode, setViewMode] = useState<ViewMode>("2weeks");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(addDays(new Date(), 13));
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customDateDialogOpen, setCustomDateDialogOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date | null>(new Date());
  const [tempEndDate, setTempEndDate] = useState<Date | null>(addDays(new Date(), 13));
  const [draggedEquipment, setDraggedEquipment] = useState<InventoryItem | null>(null);

  // Get selected fulfilment ID from URL
  const selectedFulfilmentId = searchParams.get("fulfilmentId") || "";

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

  // Fetch customers for filter dropdown
  const { data: customersData } = useListContactsQuery({
    variables: {
      page: {
        size: 100,
      },
      workspaceId: workspaceId || "",
    },
    skip: !workspaceId,
    fetchPolicy: "cache-and-network",
  });

  const customers = customersData?.listContacts?.items || [];

  // Fetch rental fulfilments with optional customer filter and date range
  const { data, loading, error } = useListRentalFulfilmentsQuery({
    variables: {
      filter: {
        salesOrderType: FulfilmentType.Rental,
        timelineStartDate: startDate,
        timelineEndDate: endDate,
        ...(selectedCustomerId && { contactId: selectedCustomerId }),
      },
      page: {
        size: 100,
      },
    },
    fetchPolicy: "cache-and-network",
  });

  const [assignInventory] = useAssignInventoryToRentalFulfilmentMutation();
  const [unassignInventory] = useUnassignInventoryFromRentalFulfilmentMutation();

  const handleCustomerChange = (event: SelectChangeEvent) => {
    setSelectedCustomerId(event.target.value);
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

  const fulfilments: InventoryAssignment_RentalFulFulfilment[] =
    data?.listRentalFulfilments?.items || [];

  // Find the selected fulfilment to get its pimCategoryId
  const selectedFulfilment = fulfilments.find((f) => f.id === selectedFulfilmentId);
  const selectedPimCategoryId = selectedFulfilment?.pimCategoryId;

  // Modify inventory query to filter by pimCategoryId when a fulfilment is selected
  const { data: inventoryData } = useListInventoryItemsQuery({
    variables: {
      query: {
        filter: selectedPimCategoryId ? { pimCategoryId: selectedPimCategoryId } : {},
        page: {
          size: 100,
        },
      },
    },
    fetchPolicy: "cache-and-network",
  });

  const inventory: InventoryItem[] = inventoryData?.listInventory?.items || [];

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

  // Callback for when equipment is dropped on a fulfilment
  const handleEquipmentAssignment = async (
    inventoryItem: InventoryItem,
    fulfilment: InventoryAssignment_RentalFulFulfilment,
  ) => {
    await assignInventory({
      variables: {
        fulfilmentId: fulfilment.id,
        inventoryId: inventoryItem.id,
        allowOverlappingReservations: true, // Adjust based on your requirements
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
                Drag inventory from the pool to assign to rental fulfilments
              </Typography>
            </Box>

            {/* View Toggle */}
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                View:
              </Typography>
              <Button
                variant={viewMode === "2weeks" ? "contained" : "outlined"}
                size="small"
                onClick={() => handleViewModeChange("2weeks")}
                sx={{ minWidth: "80px" }}
              >
                2 weeks
              </Button>
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
            <FormControl size="small" sx={{ minWidth: 250 }}>
              <InputLabel id="customer-filter-label">Customer</InputLabel>
              <Select
                labelId="customer-filter-label"
                id="customer-filter"
                value={selectedCustomerId}
                label="Customer"
                onChange={handleCustomerChange}
              >
                <MenuItem value="">
                  <em>All Customers</em>
                </MenuItem>
                {customers.map((customer: any) => (
                  <MenuItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Date Range Display */}
            <Typography variant="body2" color="text.secondary">
              Showing: {format(startDate, "MMM dd, yyyy")} - {format(endDate, "MMM dd, yyyy")}
              {viewMode === "custom" && ` (${daysToShow} days)`}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 2 }}>
          {/* Left Panel - InventoryItem List */}
          <Box sx={{ width: "300px", flexShrink: 0 }}>
            {/* Available InventoryItem Section */}
            <AvailableEquipmentSection
              inventory={inventory}
              onDragStart={setDraggedEquipment}
              selectedFulfilmentId={selectedFulfilmentId}
              selectedFulfilment={selectedFulfilment}
              onAssign={async (inventoryItem) => {
                if (selectedFulfilment) {
                  await handleEquipmentAssignment(inventoryItem, selectedFulfilment);
                }
              }}
              onUnassign={async () => {
                if (selectedFulfilmentId) {
                  await handleEquipmentUnassignment(selectedFulfilmentId);
                }
              }}
            />

            {/* Assigned InventoryItem Section */}
            {/* <AssignedEquipmentSection onDragStart={setDraggedEquipment} /> */}
          </Box>

          {/* Right Panel - Timeline */}
          <Box sx={{ flex: 1, overflowX: "auto" }}>
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

function AvailableEquipmentSection(props: {
  inventory: InventoryItem[];
  onDragStart: (inventoryItem: InventoryItem | null) => void;
  selectedFulfilmentId?: string;
  selectedFulfilment?: InventoryAssignment_RentalFulFulfilment;
  onAssign?: (inventoryItem: InventoryItem) => void;
  onUnassign?: () => void;
}) {
  const {
    inventory = [],
    onDragStart,
    selectedFulfilmentId,
    selectedFulfilment,
    onAssign,
    onUnassign,
  } = props;

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
        Inventory
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
        {selectedFulfilmentId
          ? "Click to assign/unassign or drag to assign"
          : "Drag to assign to rentals"}
      </Typography>

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
    </Paper>
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
  selectedFulfilmentId?: string;
  selectedFulfilment?: InventoryAssignment_RentalFulFulfilment;
  onAssign?: (inventoryItem: InventoryItem) => void;
  onUnassign?: () => void;
}) {
  const handleDragStart = (e: React.DragEvent) => {
    onDragStart(inventoryItem);
    // Store inventoryItem data in dataTransfer for fallback
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

  // Check if this inventory item is assigned to the selected fulfilment
  const isAssignedToSelectedFulfilment =
    selectedFulfilmentId && selectedFulfilment?.inventoryId === inventoryItem.id;

  // Show button only when a fulfilment is selected
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
          <Typography variant="caption" color="text.secondary">
            {inventoryItem.asset?.pim_product_model || "Unknown Model"}
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
      <Box sx={{ flex: 1, overflowX: "auto" }}>
        {/* Timeline Header */}
        <Box
          sx={{
            display: "flex",
            borderBottom: "2px solid #e0e0e0",
            py: 2,
            minWidth: dates.length * cellWidth,
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
  const assignmentStart = new Date(fulfilment.rentalStartDate);
  const assignmentEnd = new Date(
    fulfilment.rentalEndDate || fulfilment.expectedRentalEndDate || addDays(assignmentStart, 14),
  );

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
    >
      <Box sx={{ width: "100%", position: "relative" }}>
        {/* Checked icon in top right if inventory is assigned */}
        {fulfilment.inventoryId && (
          <CheckCircleIcon
            sx={{
              position: "absolute",
              top: -8,
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
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={fulfilment.contact?.name}
          >
            {fulfilment.contact?.name}
          </Typography>
        </Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: "block",
            wordBreak: "break-word",
            lineHeight: 1.3,
            mb: 0.5,
          }}
          title={fulfilment.pimCategoryName || ""}
        >
          {fulfilment.pimCategoryName}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
          <Typography variant="caption" color="text.secondary">
            {format(assignmentStart, "dd/MM/yyyy")}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            - {format(assignmentEnd, "dd/MM/yyyy")}
          </Typography>
        </Box>
      </Box>
    </Box>
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
  const fulfilmentStart = new Date(fulfilment.rentalStartDate);
  const fulfilmentEnd = new Date(
    fulfilment.rentalEndDate || fulfilment.expectedRentalEndDate || addDays(fulfilmentStart, 14),
  );

  // Calculate position and width of the fulfilment bar
  const dayOffset = differenceInCalendarDays(fulfilmentStart, startDate);
  const duration = differenceInCalendarDays(fulfilmentEnd, fulfilmentStart);
  const barLeft = dayOffset * cellWidth;
  const barWidth = duration * cellWidth - 8; // Subtract padding

  // Determine if fulfilment is within visible range
  const isVisible = dayOffset < dates.length && dayOffset + duration > 0;

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
    <Box
      sx={{
        position: "relative",
        minWidth: dates.length * cellWidth,
        height: rowHeight,
        borderBottom: "1px dashed #d7d7d7",
        display: "flex",
        alignItems: "center",
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Grid lines */}
      {dates.map((_, index) => (
        <Box
          key={index}
          sx={{
            position: "absolute",
            left: index * cellWidth,
            top: 0,
            bottom: 0,
            width: 1,
            //backgroundColor: "#f0f0f0",
          }}
        />
      ))}

      {/* Fulfilment Bar */}
      {isVisible && (
        <Box
          sx={{
            position: "absolute",
            left: Math.max(0, barLeft),
            top: "50%",
            transform: "translateY(-50%)",
            width: Math.min(barWidth, dates.length * cellWidth - barLeft),
            height: 40,
            backgroundColor: fulfilment.inventory ? "#e8f5e9" : "#ffebee",
            border: `2px solid ${fulfilment.inventory ? "#66bb6a" : "#ef5350"}`,
            borderRadius: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            mx: "4px",
            outline: isDragOver ? "2px solid #42a5f5" : "none",
            outlineOffset: 2,
            transition: "outline 0.2s",
          }}
        >
          {fulfilment.inventoryId ? (
            <CheckCircleIcon sx={{ color: "#66bb6a", fontSize: 20 }} />
          ) : (
            <WarningAmberIcon sx={{ color: "#ef5350", fontSize: 20 }} />
          )}
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {duration}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
