"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import { PageContainer } from "@toolpad/core/PageContainer";
import * as React from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

type WorkOrder = {
  id: string;
  description: string;
  location: string;
  assigned_to: string;
  status: "Open" | "In Progress" | "Closed";
  priority: "High" | "Medium" | "Low";
};

// Mock data for work orders (same as table view)
const initialWorkOrders: WorkOrder[] = [
  {
    id: "WO-2001",
    description: "Routine maintenance on CAT 320 Excavator",
    location: "Ashland Road Site",
    assigned_to: "Alex Johnson",
    status: "Open",
    priority: "High",
  },
  {
    id: "WO-2002",
    description: "Move Genie S-65 Boom Lift to Broadway Apartments",
    location: "Equipment Yard",
    assigned_to: "Maria Lopez",
    status: "In Progress",
    priority: "Medium",
  },
  {
    id: "WO-2003",
    description: "Refuel and inspect John Deere Loader",
    location: "Forum Shopping Center Expansion",
    assigned_to: "Chris Evans",
    status: "Open",
    priority: "Low",
  },
  {
    id: "WO-2004",
    description: "Replace hydraulic hoses on Bobcat Skid Steer",
    location: "Boone Hospital Parking Garage",
    assigned_to: "Lisa Green",
    status: "In Progress",
    priority: "Medium",
  },
  {
    id: "WO-2005",
    description: "Deliver 20 bags of Portland cement",
    location: "Stephens Lake Park Pavilion",
    assigned_to: "David Kim",
    status: "Closed",
    priority: "High",
  },
  {
    id: "WO-2006",
    description: "Rent out Kubota Mini Excavator to City Utilities",
    location: "Equipment Rental Office",
    assigned_to: "Anna White",
    status: "Open",
    priority: "Low",
  },
  {
    id: "WO-2007",
    description: "Replace worn out teeth on Komatsu Dozer blade",
    location: "Rock Bridge High School Gym",
    assigned_to: "Brian Hall",
    status: "Closed",
    priority: "Medium",
  },
  {
    id: "WO-2008",
    description: "Inspect and lubricate tower crane cables",
    location: "Downtown Office Tower",
    assigned_to: "Sarah Lee",
    status: "In Progress",
    priority: "High",
  },
  {
    id: "WO-2009",
    description: "Restock diesel fuel for all site generators",
    location: "Columbia Mall Expansion",
    assigned_to: "David Kim",
    status: "Closed",
    priority: "Low",
  },
  {
    id: "WO-2010",
    description: "Move JLG Telehandler to Flat Branch Park Bridge",
    location: "Equipment Yard",
    assigned_to: "Anna White",
    status: "Open",
    priority: "Medium",
  },
  {
    id: "WO-2011",
    description: "Replace air filters on all site compressors",
    location: "Mizzou Science Building Renovation",
    assigned_to: "Alex Johnson",
    status: "In Progress",
    priority: "High",
  },
  {
    id: "WO-2012",
    description: "Deliver 100 ft extension cords to jobsite",
    location: "Boone County Courthouse",
    assigned_to: "Maria Lopez",
    status: "Closed",
    priority: "Medium",
  },
  {
    id: "WO-2013",
    description: "Inspect and test backup generators",
    location: "Fire Station #3",
    assigned_to: "Chris Evans",
    status: "Open",
    priority: "Low",
  },
  {
    id: "WO-2014",
    description: "Move scissor lift to Columbia Public Library",
    location: "Equipment Yard",
    assigned_to: "Lisa Green",
    status: "In Progress",
    priority: "Medium",
  },
  {
    id: "WO-2015",
    description: "Replace broken LED work lights",
    location: "Forum Shopping Center Remodel",
    assigned_to: "David Kim",
    status: "Closed",
    priority: "High",
  },
  {
    id: "WO-2016",
    description: "Restock PPE (hard hats, gloves, vests)",
    location: "Warehouse A",
    assigned_to: "Anna White",
    status: "Open",
    priority: "Low",
  },
  {
    id: "WO-2017",
    description: "Service and calibrate laser level equipment",
    location: "Downtown Parking Garage",
    assigned_to: "Brian Hall",
    status: "Closed",
    priority: "Medium",
  },
  {
    id: "WO-2018",
    description: "Deliver rebar tying wire and cutters",
    location: "Boone Hospital Expansion",
    assigned_to: "Sarah Lee",
    status: "In Progress",
    priority: "High",
  },
  {
    id: "WO-2019",
    description: "Move portable toilets to new site entrance",
    location: "Ashland Road Site",
    assigned_to: "David Kim",
    status: "Closed",
    priority: "Low",
  },
  {
    id: "WO-2020",
    description: "Replace worn out tires on dump truck",
    location: "Equipment Yard",
    assigned_to: "Anna White",
    status: "Open",
    priority: "Medium",
  },
];

const statusColumns = [
  { key: "Open", label: "Open", color: "success" },
  { key: "In Progress", label: "In Progress", color: "warning" },
  { key: "Closed", label: "Closed", color: "default" },
];

function groupByStatus(
  workOrders: WorkOrder[]
): { [K in WorkOrder["status"]]: WorkOrder[] } {
  const grouped: { [K in WorkOrder["status"]]: WorkOrder[] } = {
    Open: [],
    "In Progress": [],
    Closed: [],
  };
  for (const wo of workOrders) {
    grouped[wo.status].push(wo);
  }
  return grouped;
}

export default function WorkOrdersKanbanPage() {
  const [workOrders, setWorkOrders] = React.useState(initialWorkOrders);

  const grouped = groupByStatus(workOrders);

  function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }
    // Find the work order
    const wo = workOrders.find((w) => w.id === draggableId);
    if (!wo) return;

    // Remove from old status
    const newWorkOrders = workOrders.filter((w) => w.id !== draggableId);

    // Insert into new status at destination.index
    const updatedWO = { ...wo, status: destination.droppableId as WorkOrder["status"] };
    const destList = newWorkOrders.filter((w) => w.status === destination.droppableId);
    destList.splice(destination.index, 0, updatedWO);

    // Rebuild the full list, preserving order in other columns
    const rebuilt = [];
    for (const col of statusColumns) {
      if (col.key === destination.droppableId) {
        rebuilt.push(...destList);
      } else {
        rebuilt.push(...newWorkOrders.filter((w) => w.status === col.key));
      }
    }
    setWorkOrders(rebuilt);
  }

  return (
    <PageContainer>
      <Container maxWidth="xl">
        <Box display="flex" alignItems="center" justifyContent="space-between" mt={4} mb={2}>
          <Typography variant="h1">Work Orders Kanban</Typography>
        </Box>
        <DragDropContext onDragEnd={onDragEnd}>
          <Grid container spacing={3}>
            {statusColumns.map((col) => (
              <Grid size={{ xs: 12, md: 4 }} key={col.key}>
                <Paper elevation={3} sx={{ p: 2, minHeight: 600, bgcolor: "#f8f9fa" }}>
                  <Typography variant="h6" mb={2}>
                    {col.label}
                  </Typography>
                  <Droppable droppableId={col.key}>
                    {(provided, snapshot) => (
                      <Box
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        sx={{
                          minHeight: 550,
                          transition: "background 0.2s",
                          background: snapshot.isDraggingOver ? "#e3f2fd" : undefined,
                        }}
                      >
                        {grouped[col.key as WorkOrder["status"]].map((wo: WorkOrder, idx: number) => (
                          <Draggable draggableId={wo.id} index={idx} key={wo.id}>
                            {(provided, snapshot) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                sx={{
                                  mb: 2,
                                  borderLeft: `6px solid ${
                                    wo.priority === "High"
                                      ? "#d32f2f"
                                      : wo.priority === "Medium"
                                      ? "#ed6c02"
                                      : "#1976d2"
                                  }`,
                                  boxShadow: snapshot.isDragging ? 6 : 2,
                                  opacity: snapshot.isDragging ? 0.8 : 1,
                                }}
                              >
                                <CardContent>
                                  <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Typography variant="subtitle1" fontWeight={600}>
                                      {wo.description}
                                    </Typography>
                                    <Chip
                                      label={wo.priority}
                                      color={
                                        wo.priority === "High"
                                          ? "error"
                                          : wo.priority === "Medium"
                                          ? "warning"
                                          : "primary"
                                      }
                                      size="small"
                                      sx={{ fontWeight: 600 }}
                                    />
                                  </Box>
                                  <Typography variant="body2" color="text.secondary" mt={1}>
                                    <strong>Location:</strong> {wo.location}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    <strong>Assigned To:</strong> {wo.assigned_to}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {wo.id}
                                  </Typography>
                                </CardContent>
                              </Card>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </Box>
                    )}
                  </Droppable>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </DragDropContext>
      </Container>
    </PageContainer>
  );
}
