import React from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "@hello-pangea/dnd";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Paper,
  Typography,
} from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";

type KanbanItem = {
  id: string;
  title: string;
  content: string;
  tag: string;
  status: "Backlog" | "In Progress" | "Done";
};

const mockItems: KanbanItem[] = [
  {
    id: "item-1",
    title: "Design login page",
    content: "Create wireframes and UI for login.",
    tag: "UI/UX",
    status: "Backlog",
  },
  {
    id: "item-2",
    title: "Set up database",
    content: "Initialize PostgreSQL and tables.",
    tag: "Backend",
    status: "In Progress",
  },
  {
    id: "item-3",
    title: "Implement authentication",
    content: "Add JWT-based auth flow.",
    tag: "Auth",
    status: "Backlog",
  },
  {
    id: "item-4",
    title: "Write unit tests",
    content: "Add tests for user service.",
    tag: "Testing",
    status: "Done",
  },
  {
    id: "item-5",
    title: "API documentation",
    content: "Document REST endpoints.",
    tag: "Docs",
    status: "In Progress",
  },
  {
    id: "item-6",
    title: "Deploy to staging",
    content: "Set up CI/CD for staging.",
    tag: "DevOps",
    status: "Backlog",
  },
];

const columns = [
  { key: "Backlog", label: "Backlog", color: "default" },
  { key: "In Progress", label: "In Progress", color: "primary" },
  { key: "Done", label: "Done", color: "success" },
] as const;

function groupByStatus(items: KanbanItem[]): {
  [K in KanbanItem["status"]]: KanbanItem[];
} {
  const grouped: { [K in KanbanItem["status"]]: KanbanItem[] } = {
    Backlog: [],
    "In Progress": [],
    Done: [],
  };
  for (const item of items) {
    grouped[item.status].push(item);
  }
  return grouped;
}

function KanbanBoardStory({ initialItems }: { initialItems: KanbanItem[] }) {
  const [items, setItems] = React.useState<KanbanItem[]>(initialItems);

  const grouped = React.useMemo(() => groupByStatus(items), [items]);

  function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }
    // Find the item
    const item = items.find((i) => i.id === draggableId);
    if (!item) return;

    // Remove from old status
    const newItems = items.filter((i) => i.id !== draggableId);

    // Insert into new status at destination.index
    const updatedItem = {
      ...item,
      status: destination.droppableId as KanbanItem["status"],
    };
    const destList = newItems.filter(
      (i) => i.status === destination.droppableId,
    );
    destList.splice(destination.index, 0, updatedItem);

    // Rebuild the full list, preserving order in other columns
    const rebuilt: KanbanItem[] = [];
    for (const col of columns) {
      if (col.key === destination.droppableId) {
        rebuilt.push(...destList);
      } else {
        rebuilt.push(...newItems.filter((i) => i.status === col.key));
      }
    }
    setItems(rebuilt);
  }

  return (
    <Box sx={{ width: "100%", p: 2, bgcolor: "#f4f6f8" }}>
      <Typography variant="h4" mb={2} fontWeight={700}>
        Kanban Board
      </Typography>
      <DragDropContext onDragEnd={onDragEnd}>
        <Grid container spacing={3}>
          {columns.map((col) => (
            <Grid size={{ xs: 12, md: 4 }} key={col.key}>
              <Paper
                elevation={3}
                sx={{ p: 2, minHeight: 500, bgcolor: "#f8f9fa" }}
              >
                <Typography variant="h6" mb={2}>
                  {col.label}
                </Typography>
                <Droppable droppableId={col.key}>
                  {(provided, snapshot) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      sx={{
                        minHeight: 450,
                        transition: "background 0.2s",
                        background: snapshot.isDraggingOver
                          ? "#e3f2fd"
                          : undefined,
                      }}
                    >
                      {grouped[col.key as KanbanItem["status"]].map(
                        (item, idx) => (
                          <Draggable
                            draggableId={item.id}
                            index={idx}
                            key={item.id}
                          >
                            {(provided, snapshot) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                sx={{
                                  mb: 2,
                                  borderLeft: `6px solid ${
                                    col.key === "Done"
                                      ? "#2e7d32"
                                      : col.key === "In Progress"
                                        ? "#1976d2"
                                        : "#757575"
                                  }`,
                                  boxShadow: snapshot.isDragging ? 6 : 2,
                                  opacity: snapshot.isDragging ? 0.8 : 1,
                                }}
                              >
                                <CardContent>
                                  <Box
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="space-between"
                                  >
                                    <Typography
                                      variant="subtitle1"
                                      fontWeight={600}
                                    >
                                      {item.title}
                                    </Typography>
                                    <Chip
                                      label={item.tag}
                                      color="default"
                                      size="small"
                                      sx={{ fontWeight: 600 }}
                                    />
                                  </Box>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    mt={1}
                                  >
                                    {item.content}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {item.id}
                                  </Typography>
                                </CardContent>
                              </Card>
                            )}
                          </Draggable>
                        ),
                      )}
                      {provided.placeholder}
                    </Box>
                  )}
                </Droppable>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </DragDropContext>
    </Box>
  );
}

const meta: Meta<typeof KanbanBoardStory> = {
  title: "KanbanBoard",
  component: KanbanBoardStory,
};

export default meta;

type Story = StoryObj<typeof KanbanBoardStory>;

export const Default: Story = {
  args: {
    initialItems: mockItems,
  },
};
