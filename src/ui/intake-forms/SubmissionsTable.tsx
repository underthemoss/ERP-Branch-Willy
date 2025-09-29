"use client";

import { Visibility as VisibilityIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import {
  DataGridPremium,
  GridActionsCellItem,
  GridColDef,
  GridRenderCellParams,
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarFilterButton,
  GridToolbarQuickFilter,
} from "@mui/x-data-grid-premium";
import React, { useMemo, useState } from "react";

interface LineItem {
  description: string;
  startDate: string;
  type: string;
  durationInDays: number;
  quantity: number;
}

interface Submission {
  id: string;
  formId: string;
  name: string;
  email: string;
  phone?: string | null;
  companyName?: string | null;
  purchaseOrderNumber?: string | null;
  lineItems?: LineItem[] | null;
  createdAt: string;
}

interface SubmissionsTableProps {
  submissions: Submission[];
  loading?: boolean;
  showFormId?: boolean;
  onExportCSV?: () => void;
  emptyStateTitle?: string;
  emptyStateMessage?: string;
  onRefetch?: () => void;
}

// Custom toolbar component for DataGrid
function CustomToolbar() {
  return (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport />
      <Box sx={{ flex: 1 }} />
      <GridToolbarQuickFilter />
    </GridToolbarContainer>
  );
}

export default function SubmissionsTable({
  submissions,
  loading = false,
  showFormId = false,
  onExportCSV,
  emptyStateTitle = "No submissions yet",
  emptyStateMessage = "Share the form link to start collecting submissions",
}: SubmissionsTableProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const handleViewDetails = (submission: Submission) => {
    setSelectedSubmission(submission);
    setDetailsDialogOpen(true);
  };

  // Define columns for DataGrid
  const columns: GridColDef[] = useMemo(() => {
    const baseColumns: GridColDef[] = [
      {
        field: "id",
        headerName: "Submission ID",
        width: 150,
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant="body2" fontFamily="monospace">
            {params.value}
          </Typography>
        ),
      },
    ];

    if (showFormId) {
      baseColumns.push({
        field: "formId",
        headerName: "Form ID",
        width: 150,
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant="body2" fontFamily="monospace">
            {params.value}
          </Typography>
        ),
      });
    }

    baseColumns.push(
      {
        field: "name",
        headerName: "Name",
        width: 150,
        flex: 1,
      },
      {
        field: "email",
        headerName: "Email",
        width: 200,
        flex: 1,
      },
      {
        field: "companyName",
        headerName: "Company",
        width: 150,
        flex: 1,
        valueFormatter: (value) => value || "-",
      },
      {
        field: "purchaseOrderNumber",
        headerName: "PO Number",
        width: 120,
        valueFormatter: (value) => value || "-",
      },
      {
        field: "lineItemCount",
        headerName: "Items",
        width: 80,
        type: "number",
        valueGetter: (value, row) => row.lineItems?.length || 0,
      },
      {
        field: "createdAt",
        headerName: "Submitted",
        width: 180,
        type: "dateTime",
        valueGetter: (value) => new Date(value),
        valueFormatter: (value) => {
          if (value) {
            return new Date(value).toLocaleString();
          }
          return "-";
        },
      },
      {
        field: "actions",
        type: "actions",
        headerName: "Actions",
        width: 100,
        getActions: (params) => [
          <GridActionsCellItem
            key="view"
            icon={<VisibilityIcon />}
            label="View details"
            onClick={() => handleViewDetails(params.row as Submission)}
          />,
        ],
      },
    );

    return baseColumns;
  }, [showFormId]);

  // Custom empty state overlay
  const NoRowsOverlay = () => (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
      }}
    >
      <Typography variant="h6" gutterBottom>
        {emptyStateTitle}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {emptyStateMessage}
      </Typography>
    </Box>
  );

  return (
    <>
      {/* DataGrid Premium Table */}
      <Paper sx={{ height: 600, width: "100%" }}>
        <DataGridPremium
          rows={submissions}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 25 },
            },
            columns: {
              columnVisibilityModel: {
                id: false, // Hide Submission ID by default
                formId: false, // Hide Form ID by default
              },
            },
          }}
          slots={{
            toolbar: CustomToolbar,
            noRowsOverlay: NoRowsOverlay,
          }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 500 },
            },
          }}
          density="comfortable"
          sx={{
            "& .MuiDataGrid-cell": {
              fontSize: "0.875rem",
            },
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "action.hover",
              fontSize: "0.875rem",
              fontWeight: 600,
            },
          }}
        />
      </Paper>

      {/* Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Submission Details</DialogTitle>
        <DialogContent>
          {selectedSubmission && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Submission ID
                  </Typography>
                  <Typography variant="body1" fontFamily="monospace">
                    {selectedSubmission.id}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Submitted At
                  </Typography>
                  <Typography variant="body1">
                    {new Date(selectedSubmission.createdAt).toLocaleString()}
                  </Typography>
                </Grid>
                {showFormId && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Form ID
                    </Typography>
                    <Typography variant="body1" fontFamily="monospace">
                      {selectedSubmission.formId}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              <Typography variant="h6" sx={{ mt: 2 }}>
                Contact Information
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Name
                  </Typography>
                  <Typography variant="body1">{selectedSubmission.name}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1">{selectedSubmission.email}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Phone
                  </Typography>
                  <Typography variant="body1">{selectedSubmission.phone || "-"}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Company
                  </Typography>
                  <Typography variant="body1">{selectedSubmission.companyName || "-"}</Typography>
                </Grid>
                {selectedSubmission.purchaseOrderNumber && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Purchase Order Number
                    </Typography>
                    <Typography variant="body1">
                      {selectedSubmission.purchaseOrderNumber}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              {selectedSubmission.lineItems && selectedSubmission.lineItems.length > 0 && (
                <>
                  <Typography variant="h6" sx={{ mt: 2 }}>
                    Line Items
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Description</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Start Date</TableCell>
                          <TableCell align="center">Qty</TableCell>
                          <TableCell align="center">Duration</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedSubmission.lineItems.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell>
                              <Chip
                                label={item.type}
                                size="small"
                                color={item.type === "RENTAL" ? "primary" : "secondary"}
                              />
                            </TableCell>
                            <TableCell>{new Date(item.startDate).toLocaleDateString()}</TableCell>
                            <TableCell align="center">{item.quantity}</TableCell>
                            <TableCell align="center">
                              {item.type === "RENTAL" ? `${item.durationInDays} days` : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
