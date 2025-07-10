"use client";

import { graphql } from "@/graphql";
import { useAddInvoiceChargesMutation } from "@/graphql/hooks";
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
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { DataGridPremium, GridColDef, GridToolbar } from "@mui/x-data-grid-premium";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import React from "react";

export interface AddInvoiceLineItemDialogProps {
  open: boolean;
  onClose: () => void;
  invoiceId: string;
}

export const AddInvoiceChargesMutation = graphql(`
  mutation AddInvoiceCharges($input: AddInvoiceChargesInput!) {
    addInvoiceCharges(input: $input) {
      id
      lineItems {
        chargeId
        description
        totalInCents
      }
    }
  }
`);

export default function AddInvoiceLineItemDialog({
  open,
  onClose,
  invoiceId,
}: AddInvoiceLineItemDialogProps) {
  const [tab, setTab] = React.useState(0);
  const [addInvoiceCharges, { loading: addChargesLoading, error: addChargesError }] =
    useAddInvoiceChargesMutation();
  const [mutationError, setMutationError] = React.useState<string | null>(null);

  // Mock data for unallocated charges
  interface ChargeDoc {
    _id: string;
    companyId: number;
    amountInCents: number;
    description: string;
    contactId: string;
    customerName: string;
    projectId?: string;
    salesOrderId?: string;
    salesOrderPONumber?: string;
    fulfilmentId?: string;
    invoiceId?: string;
  }

  const mockCharges: ChargeDoc[] = [
    // Acme Construction
    {
      _id: "1",
      companyId: 101,
      amountInCents: 120000,
      description: "Excavator Rental - 3 days",
      contactId: "C001",
      customerName: "Acme Construction",
      projectId: "P001",
      salesOrderId: "SO001",
      salesOrderPONumber: "PO123",
      fulfilmentId: "F001",
      invoiceId: undefined,
    },
    {
      _id: "2",
      companyId: 101,
      amountInCents: 50000,
      description: "Loader Rental - 2 days",
      contactId: "C002",
      customerName: "Acme Construction",
      projectId: "P001",
      salesOrderId: "SO002",
      salesOrderPONumber: "PO123",
      fulfilmentId: "F002",
      invoiceId: undefined,
    },
    {
      _id: "3",
      companyId: 101,
      amountInCents: 15000,
      description: "Cleaning Fee - Skid Steer",
      contactId: "C003",
      customerName: "Acme Construction",
      projectId: "P002",
      salesOrderId: "SO001",
      salesOrderPONumber: "PO124",
      fulfilmentId: "F003",
      invoiceId: undefined,
    },
    {
      _id: "4",
      companyId: 101,
      amountInCents: 8000,
      description: "Unscheduled Maintenance - Backhoe",
      contactId: "C004",
      customerName: "Acme Construction",
      projectId: "P002",
      salesOrderId: "SO002",
      salesOrderPONumber: "PO124",
      fulfilmentId: "F004",
      invoiceId: undefined,
    },
    {
      _id: "5",
      companyId: 101,
      amountInCents: 20000,
      description: "Fuel Surcharge - Bulldozer",
      contactId: "C005",
      customerName: "Acme Construction",
      projectId: "P003",
      salesOrderId: "SO003",
      salesOrderPONumber: "PO125",
      fulfilmentId: "F005",
      invoiceId: undefined,
    },
    {
      _id: "6",
      companyId: 101,
      amountInCents: 35000,
      description: "Damage Fee - Mini Excavator",
      contactId: "C006",
      customerName: "Acme Construction",
      projectId: "P003",
      salesOrderId: "SO003",
      salesOrderPONumber: "PO126",
      fulfilmentId: "F006",
      invoiceId: undefined,
    },
    {
      _id: "7",
      companyId: 101,
      amountInCents: 180000,
      description: "Crane Rental - 1 week",
      contactId: "C007",
      customerName: "Acme Construction",
      projectId: "P004",
      salesOrderId: "SO004",
      salesOrderPONumber: "PO126",
      fulfilmentId: "F007",
      invoiceId: undefined,
    },
    {
      _id: "8",
      companyId: 101,
      amountInCents: 12000,
      description: "Late Return Fee - Scissor Lift",
      contactId: "C008",
      customerName: "Acme Construction",
      projectId: "P004",
      salesOrderId: "SO004",
      salesOrderPONumber: "PO127",
      fulfilmentId: "F008",
      invoiceId: undefined,
    },
    // BuildRight Ltd.
    {
      _id: "9",
      companyId: 102,
      amountInCents: 90000,
      description: "Telehandler Rental - 4 days",
      contactId: "C009",
      customerName: "BuildRight Ltd.",
      projectId: "P001",
      salesOrderId: "SO001",
      salesOrderPONumber: "PO123",
      fulfilmentId: "F009",
      invoiceId: undefined,
    },
    {
      _id: "10",
      companyId: 102,
      amountInCents: 25000,
      description: "Delivery Fee - Wheel Loader",
      contactId: "C010",
      customerName: "BuildRight Ltd.",
      projectId: "P002",
      salesOrderId: "SO002",
      salesOrderPONumber: "PO123",
      fulfilmentId: "F010",
      invoiceId: undefined,
    },
    {
      _id: "11",
      companyId: 102,
      amountInCents: 60000,
      description: "Compactor Rental - 5 days",
      contactId: "C011",
      customerName: "BuildRight Ltd.",
      projectId: "P003",
      salesOrderId: "SO003",
      salesOrderPONumber: "PO124",
      fulfilmentId: "F011",
      invoiceId: undefined,
    },
    {
      _id: "12",
      companyId: 102,
      amountInCents: 17000,
      description: "Cleaning Fee - Dump Truck",
      contactId: "C012",
      customerName: "BuildRight Ltd.",
      projectId: "P003",
      salesOrderId: "SO003",
      salesOrderPONumber: "PO125",
      fulfilmentId: "F012",
      invoiceId: undefined,
    },
    {
      _id: "13",
      companyId: 102,
      amountInCents: 22000,
      description: "Fuel Surcharge - Grader",
      contactId: "C013",
      customerName: "BuildRight Ltd.",
      projectId: "P004",
      salesOrderId: "SO004",
      salesOrderPONumber: "PO125",
      fulfilmentId: "F013",
      invoiceId: undefined,
    },
    {
      _id: "14",
      companyId: 102,
      amountInCents: 45000,
      description: "Damage Fee - Articulated Truck",
      contactId: "C014",
      customerName: "BuildRight Ltd.",
      projectId: "P004",
      salesOrderId: "SO004",
      salesOrderPONumber: "PO126",
      fulfilmentId: "F014",
      invoiceId: undefined,
    },
    {
      _id: "15",
      companyId: 102,
      amountInCents: 30000,
      description: "Loader Rental - 3 days",
      contactId: "C015",
      customerName: "BuildRight Ltd.",
      projectId: "P001",
      salesOrderId: "SO001",
      salesOrderPONumber: "PO127",
      fulfilmentId: "F015",
      invoiceId: undefined,
    },
    {
      _id: "16",
      companyId: 102,
      amountInCents: 110000,
      description: "Excavator Rental - 5 days",
      contactId: "C016",
      customerName: "BuildRight Ltd.",
      projectId: "P002",
      salesOrderId: "SO002",
      salesOrderPONumber: "PO127",
      fulfilmentId: "F016",
      invoiceId: undefined,
    },
  ];

  const chargeColumns: GridColDef[] = [
    { field: "_id", headerName: "ID", width: 90 },
    { field: "customerName", headerName: "Customer Name", width: 180 },
    { field: "description", headerName: "Charge Description", width: 220, flex: 1 },
    {
      field: "amountInCents",
      headerName: "Amount",
      width: 120,
      valueFormatter: (value: number) => {
        return typeof value === "number" ? `$${(value / 100).toFixed(2)}` : "";
      },
    },
    { field: "projectId", headerName: "Project ID", width: 120 },
    { field: "salesOrderId", headerName: "Sales Order ID", width: 130 },
    { field: "salesOrderPONumber", headerName: "PO Number", width: 110 },
    { field: "fulfilmentId", headerName: "Fulfilment ID", width: 130 },
  ];

  // Row grouping state for DataGridPremium
  const [rowGroupingModel, setRowGroupingModel] = React.useState<string[]>([]);

  // Row selection state for DataGridPremium
  const [rowSelectionModel, setRowSelectionModel] = React.useState<string[]>([]);

  // Miscellaneous Charge form state
  const [miscDesc, setMiscDesc] = React.useState("");
  const [miscAmount, setMiscAmount] = React.useState("");
  const [miscDate, setMiscDate] = React.useState<Date | null>(new Date());

  const miscValid =
    miscDesc.trim().length > 0 &&
    miscAmount.trim().length > 0 &&
    !isNaN(Number(miscAmount)) &&
    Number(miscAmount) > 0 &&
    !!miscDate;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={tab === 0 ? "xl" : "sm"}
      fullWidth
      scroll="paper"
    >
      <DialogTitle>Add Invoice Line Item</DialogTitle>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} aria-label="Add Invoice Line Item Tabs">
          <Tab label="Unallocated Charges" />
          <Tab label="Miscellaneous Charge" />
        </Tabs>
      </Box>
      <DialogContent
        sx={{
          minHeight: "80vh",
          maxHeight: "80vh",
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minWidth: 0,
        }}
      >
        {tab === 0 && (
          <Box
            sx={{
              width: "100%",
              mt: 1,
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 1,
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Box flex={1}></Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {rowGroupingModel.map((group, idx) => (
                  <Chip
                    key={group}
                    label={
                      group === "customerName"
                        ? "Customer Name"
                        : group === "projectId"
                          ? "Project ID"
                          : group === "salesOrderId"
                            ? "Sales Order ID"
                            : group === "salesOrderPONumber"
                              ? "PO Number"
                              : group
                    }
                    onDelete={() =>
                      setRowGroupingModel(rowGroupingModel.filter((g) => g !== group))
                    }
                    sx={{ fontSize: 14 }}
                  />
                ))}
              </Box>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel id="group-by-label">Group by</InputLabel>
                <Select
                  labelId="group-by-label"
                  id="group-by"
                  value=""
                  label="Group by"
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value && !rowGroupingModel.includes(value)) {
                      setRowGroupingModel([...rowGroupingModel, value]);
                    }
                  }}
                >
                  <MenuItem value="" disabled>
                    Select...
                  </MenuItem>
                  {!rowGroupingModel.includes("customerName") && (
                    <MenuItem value="customerName">Customer Name</MenuItem>
                  )}
                  {!rowGroupingModel.includes("projectId") && (
                    <MenuItem value="projectId">Project ID</MenuItem>
                  )}
                  {!rowGroupingModel.includes("salesOrderId") && (
                    <MenuItem value="salesOrderId">Sales Order ID</MenuItem>
                  )}
                  {!rowGroupingModel.includes("salesOrderPONumber") && (
                    <MenuItem value="salesOrderPONumber">PO Number</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: 1, minHeight: 0, width: "100%" }}>
              <DataGridPremium
                rows={mockCharges}
                columns={chargeColumns}
                getRowId={(row) => row._id}
                disableRowSelectionOnClick
                disableColumnFilter={false}
                disableColumnMenu={false}
                rowGroupingModel={rowGroupingModel}
                onRowGroupingModelChange={setRowGroupingModel}
                rowSelectionModel={{ type: "include", ids: new Set(rowSelectionModel) }}
                onRowSelectionModelChange={(newSelection) =>
                  setRowSelectionModel([...newSelection.ids].map((i) => i.toString()))
                }
                slots={
                  {
                    // toolbar: GridToolbar,
                  }
                }
                showToolbar={true}
                slotProps={{
                  toolbar: {
                    showQuickFilter: true,
                    quickFilterProps: { debounceMs: 300 },
                  },
                }}
                initialState={{
                  filter: {
                    filterModel: {
                      items: [],
                      quickFilterValues: [""],
                    },
                  },
                  pagination: { paginationModel: { pageSize: 5 } },
                }}
                pageSizeOptions={[5, 10, 20]}
                checkboxSelection
                autoHeight={false}
                sx={{ height: "100%" }}
              />
            </Box>
          </Box>
        )}
        {tab === 1 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Charge Description"
              value={miscDesc}
              onChange={(e) => setMiscDesc(e.target.value)}
              required
              fullWidth
              autoFocus
            />
            <TextField
              label="Amount"
              value={miscAmount}
              onChange={(e) => setMiscAmount(e.target.value)}
              required
              fullWidth
              type="number"
              inputProps={{ min: 0, step: "0.01" }}
            />
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Date"
                value={miscDate}
                onChange={(value) => {
                  if (value === null || value instanceof Date) setMiscDate(value);
                }}
                slotProps={{ textField: { fullWidth: true, required: true } }}
                maxDate={new Date()}
              />
            </LocalizationProvider>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={async () => {
            if (tab === 1) {
              alert(
                JSON.stringify(
                  {
                    description: miscDesc,
                    amount: miscAmount,
                    date: miscDate,
                  },
                  null,
                  2,
                ),
              );
              onClose();
            } else {
              setMutationError(null);
              const selectedChargeIds = mockCharges
                .filter((row) => rowSelectionModel.includes(row._id))
                .map((row) => row._id);
              if (selectedChargeIds.length === 0) {
                setMutationError("Please select at least one charge to add.");
                return;
              }
              try {
                await addInvoiceCharges({
                  variables: {
                    input: {
                      invoiceId,
                      chargeIds: selectedChargeIds,
                    },
                  },
                });
                onClose();
              } catch (err: any) {
                setMutationError(err?.message || "Failed to add charges to invoice.");
              }
            }
          }}
          color="primary"
          variant="contained"
          disabled={(tab === 1 && !miscValid) || addChargesLoading}
        >
          {addChargesLoading ? "Adding..." : "Add"}
        </Button>
        {mutationError && (
          <Box sx={{ color: "error.main", mt: 1, mb: 1 }}>
            <Typography variant="body2">{mutationError}</Typography>
          </Box>
        )}
      </DialogActions>
    </Dialog>
  );
}
