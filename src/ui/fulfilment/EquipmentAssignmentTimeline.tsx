"use client";

import { FulfilmentType, useListRentalFulfilmentsQuery } from "@/graphql/hooks";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ContactPageIcon from "@mui/icons-material/ContactPage";
import ContactPageOutlinedIcon from "@mui/icons-material/ContactPageOutlined";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { Box, Button, Chip, IconButton, Paper, Typography } from "@mui/material";
import { addDays, differenceInCalendarDays, differenceInDays, format, startOfDay } from "date-fns";
import React, { useState } from "react";
import { Assignment, Equipment, mockAssignments, mockEquipmentData } from "./mockTimelineData";

type ViewMode = "2weeks" | "30days" | "60days";

const VIEW_DAYS: Record<ViewMode, number> = {
  "2weeks": 14,
  "30days": 30,
  "60days": 60,
};

export default function EquipmentAssignmentTimeline() {
  const [viewMode, setViewMode] = useState<ViewMode>("2weeks");
  const [startDate] = useState(new Date(2025, 7, 14)); // Aug 14, 2025

  const daysToShow = VIEW_DAYS[viewMode];
  const endDate = addDays(startDate, daysToShow - 1);

  // Generate date array for timeline header
  const dates = Array.from({ length: daysToShow }, (_, i) => addDays(startDate, i));

  const { data, loading, error } = useListRentalFulfilmentsQuery({
    variables: {
      filter: {
        salesOrderType: FulfilmentType.Rental,
      },
      page: {
        size: 100,
      },
    },
  });

  const fulfilments =
    data?.listRentalFulfilments?.items
      .map((fulfilment) => {
        const endDate =
          fulfilment.rentalEndDate ||
          fulfilment.expectedRentalEndDate ||
          addDays(fulfilment.rentalStartDate, 7);

        return {
          id: fulfilment.id,
          customer: fulfilment?.contact?.name || "Unknown Customer",
          equipment: fulfilment.pimCategoryName + " - " + fulfilment.priceName,
          startDate: format(startOfDay(new Date(fulfilment.rentalStartDate)), "yyyy-MM-dd"),
          endDate: format(startOfDay(endDate), "yyyy-MM-dd"),
          duration: `${differenceInCalendarDays(endDate, new Date(fulfilment.rentalStartDate))} days`,
          hasConflict: false, // Placeholder, implement conflict logic if needed
          assignedEquipment: fulfilment.inventoryId
            ? `Assigned: ${fulfilment.inventoryId}`
            : undefined,
        };
      })
      .filter(Boolean) || ([] as Assignment[]);

  console.log("Fulfilments:", fulfilments);

  return (
    <Box sx={{ p: 3, backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
            onClick={() => setViewMode("2weeks")}
            sx={{ minWidth: "80px" }}
          >
            2 weeks
          </Button>
          <Button
            variant={viewMode === "30days" ? "outlined" : "outlined"}
            size="small"
            onClick={() => setViewMode("30days")}
            sx={{ minWidth: "80px" }}
          >
            30 days
          </Button>
          <Button
            variant={viewMode === "60days" ? "outlined" : "outlined"}
            size="small"
            onClick={() => setViewMode("60days")}
            sx={{ minWidth: "80px" }}
          >
            60 days
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 2 }}>
        {/* Left Panel - Equipment List */}
        <Box sx={{ width: "300px", flexShrink: 0 }}>
          {/* Available Equipment Section */}
          <AvailableEquipmentSection />

          {/* Assigned Equipment Section */}
          <AssignedEquipmentSection />
        </Box>

        {/* Right Panel - Timeline */}
        <Box sx={{ flex: 1, overflowX: "auto" }}>
          <TimelineView dates={dates} startDate={startDate} assignments={fulfilments} />
        </Box>
      </Box>
    </Box>
  );
}

function AvailableEquipmentSection() {
  const availableEquipment = mockEquipmentData.filter((eq) => eq.status === "available");

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
        Available Equipment
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
        Drag to assign to rentals
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {availableEquipment.map((equipment) => (
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
            p: 2,
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
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
        {/* <Box
          component="img"
          src={`https://via.placeholder.com/40x40?text=${assignment.equipment.charAt(0)}`}
          sx={{ width: 40, height: 40, borderRadius: 1, flexShrink: 0 }}
        /> */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {/* <LocationOnIcon sx={{ fontSize: 14, color: "text.secondary" }} /> */}
            <ContactPageOutlinedIcon fontSize="small" />
            <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
              {assignment.customer}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" noWrap>
            {assignment.equipment}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
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
        px: 2,
      }}
    >
      {/* Grid lines */}
      {dates.map((_, index) => (
        <Box
          key={index}
          sx={{
            position: "absolute",
            left: index * cellWidth + 16, // Add padding offset
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
            left: Math.max(0, barLeft) + 16, // Add padding offset
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
