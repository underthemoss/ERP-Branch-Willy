"use client";

import {
  MoreVert as MoreVertIcon,
  RequestQuote as RequestQuoteIcon,
  Transform as TransformIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
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
  Menu,
  MenuItem,
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
  GridColDef,
  GridRenderCellParams,
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarFilterButton,
  GridToolbarQuickFilter,
} from "@mui/x-data-grid-premium";
import { differenceInDays } from "date-fns";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import ConvertSubmissionDialog from "./ConvertSubmissionDialog";
import { GenerateQuoteDialog } from "./GenerateQuoteDialog";

interface LineItem {
  id: string;
  description: string;
  startDate: string;
  type: string;
  quantity: number;
  rentalStartDate?: string | null;
  rentalEndDate?: string | null;
  subtotalInCents?: number | null;
}

interface Submission {
  id: string;
  formId: string;
  name: string | null;
  email: string | null;
  phone?: string | null;
  companyName?: string | null;
  purchaseOrderNumber?: string | null;
  lineItems?: LineItem[] | null;
  createdAt: string;
  status: string;
  submittedAt?: string | null;
  totalInCents: number;
  salesOrderId?: string | null;
  quoteId?: string | null;
  form?: {
    projectId?: string | null;
  } | null;
}

interface SubmissionsTableProps {
  submissions: Submission[];
  loading?: boolean;
  showFormId?: boolean;
  onExportCSV?: () => void;
  emptyStateTitle?: string;
  emptyStateMessage?: string;
  onRefetch?: () => void;
  workspaceId?: string;
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
  onRefetch,
  workspaceId,
}: SubmissionsTableProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [convertSubmissionId, setConvertSubmissionId] = useState<string | null>(null);
  const [generateQuoteDialogOpen, setGenerateQuoteDialogOpen] = useState(false);
  const [generateQuoteSubmission, setGenerateQuoteSubmission] = useState<Submission | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuSubmission, setMenuSubmission] = useState<Submission | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, submission: Submission) => {
    setMenuAnchor(event.currentTarget);
    setMenuSubmission(submission);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuSubmission(null);
  };

  const handleViewDetails = (submission: Submission) => {
    setSelectedSubmission(submission);
    setDetailsDialogOpen(true);
  };

  const handleConvertToOrder = (submission: Submission) => {
    setConvertSubmissionId(submission.id);
    setConvertDialogOpen(true);
  };

  const handleGenerateQuote = (submission: Submission) => {
    setGenerateQuoteSubmission(submission);
    setGenerateQuoteDialogOpen(true);
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
        field: "status",
        headerName: "Status",
        width: 120,
        renderCell: (params: GridRenderCellParams) => {
          const status = params.value as string;
          return (
            <Chip
              label={status === "SUBMITTED" ? "Submitted" : "Draft"}
              color={status === "SUBMITTED" ? "success" : "default"}
              size="small"
            />
          );
        },
      },
      {
        field: "quoteId",
        headerName: "Quote",
        width: 140,
        renderCell: (params: GridRenderCellParams) => {
          const row = params.row as Submission;
          if (row.quoteId && workspaceId) {
            return (
              <Link
                href={`/app/${workspaceId}/sales-quotes/${row.quoteId}`}
                className="text-blue-600 hover:underline font-mono text-sm"
                onClick={(e) => e.stopPropagation()}
              >
                {row.quoteId.slice(0, 8)}...
              </Link>
            );
          }
          return <Typography color="text.secondary">—</Typography>;
        },
      },
      {
        field: "name",
        headerName: "Name",
        width: 150,
        flex: 1,
        valueFormatter: (value) => value || "-",
      },
      {
        field: "email",
        headerName: "Email",
        width: 200,
        flex: 1,
        valueFormatter: (value) => value || "-",
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
        field: "totalInCents",
        headerName: "Total",
        width: 120,
        type: "number",
        renderCell: (params: GridRenderCellParams) => {
          return params.value ? `$${((params.value as number) / 100).toFixed(2)}` : "";
        },
      },
      {
        field: "submittedAt",
        headerName: "Submitted",
        width: 180,
        type: "dateTime",
        valueGetter: (value, row) => {
          // Use submittedAt if available, otherwise createdAt
          const dateStr = row.submittedAt || row.createdAt;
          return dateStr ? new Date(dateStr) : null;
        },
        valueFormatter: (value) => {
          if (value) {
            return new Date(value).toLocaleString();
          }
          return "-";
        },
      },
      {
        field: "actions",
        headerName: "",
        width: 60,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params: GridRenderCellParams) => (
          <IconButton size="small" onClick={(e) => handleMenuOpen(e, params.row as Submission)}>
            <MoreVertIcon />
          </IconButton>
        ),
      },
    );

    return baseColumns;
  }, [showFormId, workspaceId]);

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

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <MenuItem
          onClick={() => {
            if (menuSubmission) {
              handleViewDetails(menuSubmission);
            }
            handleMenuClose();
          }}
        >
          <VisibilityIcon sx={{ mr: 1.5, fontSize: 20 }} />
          View Details
        </MenuItem>
        {workspaceId && menuSubmission && !menuSubmission.salesOrderId && (
          <MenuItem
            onClick={() => {
              if (menuSubmission) {
                handleConvertToOrder(menuSubmission);
              }
              handleMenuClose();
            }}
          >
            <TransformIcon sx={{ mr: 1.5, fontSize: 20 }} />
            Convert to Order
          </MenuItem>
        )}
        {workspaceId && menuSubmission && !menuSubmission.quoteId && (
          <MenuItem
            onClick={() => {
              if (menuSubmission) {
                handleGenerateQuote(menuSubmission);
              }
              handleMenuClose();
            }}
          >
            <RequestQuoteIcon sx={{ mr: 1.5, fontSize: 20 }} />
            Generate Quote
          </MenuItem>
        )}
      </Menu>

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
                    Status
                  </Typography>
                  <Chip
                    label={selectedSubmission.status === "SUBMITTED" ? "Submitted" : "Draft"}
                    color={selectedSubmission.status === "SUBMITTED" ? "success" : "default"}
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Submitted At
                  </Typography>
                  <Typography variant="body1">
                    {selectedSubmission.submittedAt
                      ? new Date(selectedSubmission.submittedAt).toLocaleString()
                      : new Date(selectedSubmission.createdAt).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedSubmission.totalInCents
                      ? `$${(selectedSubmission.totalInCents / 100).toFixed(2)}`
                      : "-"}
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
                  <Typography variant="body1">{selectedSubmission.name || "-"}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1">{selectedSubmission.email || "-"}</Typography>
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
                              {item.type === "RENTAL" && item.rentalStartDate && item.rentalEndDate
                                ? `${differenceInDays(new Date(item.rentalEndDate), new Date(item.rentalStartDate))} days`
                                : "-"}
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
          {workspaceId && selectedSubmission && !selectedSubmission.quoteId && (
            <Button
              onClick={() => {
                setDetailsDialogOpen(false);
                handleGenerateQuote(selectedSubmission);
              }}
              startIcon={<RequestQuoteIcon />}
              variant="contained"
              color="primary"
            >
              Generate Quote
            </Button>
          )}
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Convert to Order Dialog */}
      {workspaceId && convertSubmissionId && (
        <ConvertSubmissionDialog
          open={convertDialogOpen}
          onClose={() => {
            setConvertDialogOpen(false);
            setConvertSubmissionId(null);
          }}
          submissionId={convertSubmissionId}
          workspaceId={workspaceId}
        />
      )}

      {/* Generate Quote Dialog */}
      {workspaceId && generateQuoteSubmission && (
        <GenerateQuoteDialog
          open={generateQuoteDialogOpen}
          onClose={() => {
            setGenerateQuoteDialogOpen(false);
            setGenerateQuoteSubmission(null);
          }}
          submissionId={generateQuoteSubmission.id}
          workspaceId={workspaceId}
          submissionEmail={generateQuoteSubmission.email}
          submissionName={generateQuoteSubmission.name}
          formProjectId={generateQuoteSubmission.form?.projectId}
          onSuccess={() => {
            onRefetch?.();
          }}
        />
      )}
    </>
  );
}
