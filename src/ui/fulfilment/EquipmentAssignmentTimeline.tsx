"use client";

import { FulfilmentType, useListRentalFulfilmentsQuery } from "@/graphql/hooks";
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
import { addDays, differenceInCalendarDays, differenceInDays, format, startOfDay } from "date-fns";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useListContactsQuery } from "../contacts/api";
import { InventoryFieldsFragment, useListInventoryQuery } from "../inventory/api";
import { Assignment, Equipment, mockEquipmentData } from "./mockTimelineData";

type ViewMode = "2weeks" | "30days" | "60days" | "custom";

const VIEW_DAYS: Record<Exclude<ViewMode, "custom">, number> = {
  "2weeks": 14,
  "30days": 30,
  "60days": 60,
};

export default function EquipmentAssignmentTimeline() {
  const params = useParams();
  const workspaceId = params?.workspace_id as string;

  const [viewMode, setViewMode] = useState<ViewMode>("2weeks");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(addDays(new Date(), 13));
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customDateDialogOpen, setCustomDateDialogOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date | null>(new Date());
  const [tempEndDate, setTempEndDate] = useState<Date | null>(addDays(new Date(), 13));

  // Calculate days to show based on view mode
  const daysToShow =
    viewMode === "custom" ? differenceInDays(endDate, startDate) + 1 : VIEW_DAYS[viewMode];

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

  const { data: inventoryData } = useListInventoryQuery({
    variables: {
      query: {
        filter: {},
        page: {
          size: 100,
        },
      },
    },
  });

  const inventory: Equipment[] = (inventoryData?.listInventory?.items || []).map(
    (inventoryItem: InventoryFieldsFragment) => {
      return {
        id: inventoryItem.id,
        name: inventoryItem.asset?.name || inventoryItem.pimCategoryName,
        model: inventoryItem.asset?.pim_product_model || "",
        status: inventoryItem.status,
        location: inventoryItem?.asset?.inventory_branch?.name || "Unknown Location",
        assignedTo: inventoryItem.assignedTo?.name || "",
      };
    },
  );

  console.log("Inventory Data:", inventory);

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

  const fulfilments: Assignment[] =
    data?.listRentalFulfilments?.items
      ?.map((fulfilment) => {
        if (!fulfilment.rentalStartDate) return null;

        const fulfilmentEndDate =
          fulfilment.rentalEndDate ||
          fulfilment.expectedRentalEndDate ||
          addDays(new Date(fulfilment.rentalStartDate), 7);

        const assignment: Assignment = {
          id: fulfilment.id,
          customer: fulfilment?.contact?.name || "Unknown Customer",
          equipment: (fulfilment.pimCategoryName || "") + " - " + (fulfilment.priceName || ""),
          startDate: format(startOfDay(new Date(fulfilment.rentalStartDate)), "yyyy-MM-dd"),
          endDate: format(startOfDay(fulfilmentEndDate), "yyyy-MM-dd"),
          duration: `${differenceInCalendarDays(fulfilmentEndDate, new Date(fulfilment.rentalStartDate))} days`,
          hasConflict: false,
          ...(fulfilment.inventoryId && {
            assignedEquipment: `Assigned: ${fulfilment.inventoryId}`,
          }),
        };
        return assignment;
      })
      .filter((item): item is Assignment => item !== null) || [];

  console.log("Fulfilments:", fulfilments);

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
                Equipment Assignment Timeline
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Drag equipment from the pool to assign to rental transactions
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
          {/* Left Panel - Equipment List */}
          <Box sx={{ width: "300px", flexShrink: 0 }}>
            {/* Available Equipment Section */}
            <AvailableEquipmentSection inventory={inventory} />

            {/* Assigned Equipment Section */}
            <AssignedEquipmentSection />
          </Box>

          {/* Right Panel - Timeline */}
          <Box sx={{ flex: 1, overflowX: "auto" }}>
            <TimelineView dates={dates} startDate={startDate} assignments={fulfilments} />
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
                Duration: {differenceInDays(tempEndDate, tempStartDate) + 1} days
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

function AvailableEquipmentSection(props: { inventory: Equipment[] }) {
  const { inventory = [] } = props;

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
        Available Equipment
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
        Drag to assign to rentals
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {inventory.map((equipment) => (
          <EquipmentCard key={equipment.id} equipment={equipment} />
        ))}
      </Box>
    </Paper>
  );
}

function AssignedEquipmentSection() {
  const assignedEquipment = mockEquipmentData.filter((eq) => eq.status === "assigned");

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        Assigned Equipment
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {assignedEquipment.map((equipment) => (
          <EquipmentCard key={equipment.id} equipment={equipment} />
        ))}
      </Box>
    </Paper>
  );
}

function EquipmentCard({ equipment }: { equipment: Equipment }) {
  return (
    <Paper
      sx={{
        p: 1.5,
        border: "1px solid #e0e0e0",
        borderRadius: 1,
        cursor: equipment.status === "available" ? "grab" : "default",
        "&:hover": {
          backgroundColor: equipment.status === "available" ? "#f5f5f5" : "transparent",
        },
      }}
      draggable={equipment.status === "available"}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {equipment.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {equipment.model}
          </Typography>
        </Box>
        <Chip
          label={equipment.status}
          size="small"
          color={equipment.status === "available" ? "success" : "primary"}
          sx={{ height: 20, fontSize: "0.7rem" }}
        />
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", mt: 1, gap: 0.5 }}>
        <LocationOnIcon sx={{ fontSize: 14, color: "text.secondary" }} />
        <Typography variant="caption" color="text.secondary">
          {equipment.location}
        </Typography>
      </Box>

      {equipment.assignedTo && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
          {equipment.assignedTo}
        </Typography>
      )}
    </Paper>
  );
}

function TimelineView({
  dates,
  startDate,
  assignments,
}: {
  dates: Date[];
  startDate: Date;
  assignments: Assignment[];
}) {
  const cellWidth = 60;
  const rowHeight = 80;

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
            height: 60,
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
          {assignments.map((assignment) => (
            <CustomerInfoRow key={assignment.id} assignment={assignment} rowHeight={rowHeight} />
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
            height: 60,
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
        <Box>
          {assignments.map((assignment) => (
            <TimelineRow
              key={assignment.id}
              assignment={assignment}
              startDate={startDate}
              dates={dates}
              cellWidth={cellWidth}
              rowHeight={rowHeight}
            />
          ))}
        </Box>
      </Box>
    </Paper>
  );
}

function CustomerInfoRow({ assignment, rowHeight }: { assignment: Assignment; rowHeight: number }) {
  const assignmentStart = new Date(assignment.startDate);

  return (
    <Box
      sx={{
        height: rowHeight,
        borderBottom: "1px solid #f0f0f0",
        p: 2,
        display: "flex",
        alignItems: "center",
      }}
    >
      <Box sx={{ width: "100%" }}>
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
            title={assignment.customer}
          >
            {assignment.customer}
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
          title={assignment.equipment}
        >
          {assignment.equipment}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
          <Typography variant="caption" color="text.secondary">
            {format(assignmentStart, "dd/MM/yyyy")}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            • {assignment.duration}
          </Typography>
        </Box>
        {assignment.assignedEquipment && (
          <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
            <strong>Assigned:</strong> {assignment.assignedEquipment}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

function TimelineRow({
  assignment,
  startDate,
  dates,
  cellWidth,
  rowHeight,
}: {
  assignment: Assignment;
  startDate: Date;
  dates: Date[];
  cellWidth: number;
  rowHeight: number;
}) {
  const assignmentStart = new Date(assignment.startDate);
  const assignmentEnd = new Date(assignment.endDate);

  // Calculate position and width of the assignment bar
  const dayOffset = differenceInDays(assignmentStart, startDate);
  const duration = differenceInDays(assignmentEnd, assignmentStart) + 1;
  const barLeft = dayOffset * cellWidth;
  const barWidth = duration * cellWidth - 8; // Subtract padding

  // Determine if assignment is within visible range
  const isVisible = dayOffset < dates.length && dayOffset + duration > 0;

  return (
    <Box
      sx={{
        position: "relative",
        minWidth: dates.length * cellWidth,
        height: rowHeight,
        borderBottom: "1px solid #f0f0f0",
        display: "flex",
        alignItems: "center",
      }}
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
            backgroundColor: "#f0f0f0",
          }}
        />
      ))}

      {/* Assignment Bar */}
      {isVisible && (
        <Box
          sx={{
            position: "absolute",
            left: Math.max(0, barLeft),
            top: "50%",
            transform: "translateY(-50%)",
            width: Math.min(barWidth, dates.length * cellWidth - barLeft),
            height: 40,
            backgroundColor: assignment.hasConflict ? "#ffebee" : "#e8f5e9",
            border: `2px solid ${assignment.hasConflict ? "#ef5350" : "#66bb6a"}`,
            borderRadius: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            mx: "4px",
          }}
        >
          {assignment.hasConflict ? (
            <WarningAmberIcon sx={{ color: "#ef5350", fontSize: 20 }} />
          ) : (
            <CheckCircleIcon sx={{ color: "#66bb6a", fontSize: 20 }} />
          )}
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {assignment.duration}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
