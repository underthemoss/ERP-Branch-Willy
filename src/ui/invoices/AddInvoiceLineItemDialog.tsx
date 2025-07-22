"use client";

import { graphql } from "@/graphql";
import {
  ChargeType,
  useAddInvoiceChargesMutation,
  useInvoiceCreateChargeMiscMutation,
  useListChargesQuery,
} from "@/graphql/hooks";
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
import { format } from "date-fns";
import Link from "next/link";
import { useParams } from "next/navigation";
import React from "react";

export interface AddInvoiceLineItemDialogProps {
  open: boolean;
  onClose: () => void;
  invoiceId: string;
  buyerId: string;
  buyerName: string;
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

export const InvoiceCreateChargeMiscMutation = graphql(`
  mutation invoiceCreateChargeMisc($input: CreateChargeInput!) {
    createCharge(input: $input) {
      id
      amountInCents
      description
      chargeType
      contactId
      createdAt
      projectId
      salesOrderId
      purchaseOrderNumber
      salesOrderLineItemId
      fulfilmentId
      invoiceId
    }
  }
`);

const LIST_CHARGES_QUERY = graphql(`
  query ListCharges($filter: ListChargesFilter!, $page: PageInfoInput) {
    listCharges(filter: $filter, page: $page) {
      items {
        id
        companyId
        amountInCents
        description
        chargeType
        contactId
        contact {
          ... on BusinessContact {
            id
            name
          }
          ... on PersonContact {
            id
            name
          }
        }
        createdAt
        billingPeriodStart
        billingPeriodEnd
        projectId
        project {
          id
          name
        }
        salesOrderId
        purchaseOrderNumber
        salesOrderLineItemId
        salesOrderLineItem {
          ... on RentalSalesOrderLineItem {
            id
            so_quantity
            lineitem_type
          }
          ... on SaleSalesOrderLineItem {
            id
            so_quantity
            lineitem_type
          }
        }
        fulfilmentId
        invoiceId
      }
    }
  }
`);
export default function AddInvoiceLineItemDialog({
  open,
  onClose,
  invoiceId,
  buyerId,
  buyerName,
}: AddInvoiceLineItemDialogProps) {
  const params = useParams();
  const workspaceId = params.workspace_id as string;
  const [tab, setTab] = React.useState(0);
  const [addInvoiceCharges, { loading: addChargesLoading, error: addChargesError }] =
    useAddInvoiceChargesMutation();
  const [createChargeMisc, { loading: createChargeLoading, error: createChargeError }] =
    useInvoiceCreateChargeMiscMutation();
  const [mutationError, setMutationError] = React.useState<string | null>(null);

  // Prepare filter for unallocated charges (not yet invoiced)
  const chargesFilter = {
    invoiceId: null,
  };

  const {
    data: chargesData,
    loading: chargesLoading,
    error: chargesError,
    refetch,
  } = useListChargesQuery({
    variables: {
      filter: chargesFilter,
      page: { size: 1000 },
    },
    fetchPolicy: "cache-and-network",
  });

  // Map GQL data to table rows
  type ChargeRow = {
    _id: string;
    companyId: number;
    amountInCents: number;
    description: string;
    chargeType?: string;
    contactId?: string;
    createdAt?: string;
    billingPeriodStart?: string;
    billingPeriodEnd?: string;
    projectId?: string;
    projectName?: string;
    salesOrderId?: string;
    salesOrderPONumber?: string;
    salesOrderLineItemId?: string;
    salesOrderLineItemQuantity?: number;
    fulfilmentId?: string;
    invoiceId?: string;
    customerName?: string;
  };

  const chargeRows: ChargeRow[] =
    chargesData?.listCharges?.items
      ?.filter((i) => !i.invoiceId)
      .map((charge: any) => ({
        ...charge,
        _id: charge.id,
        customerName: charge.contact?.name || "",
        projectName: charge.project?.name || "",
        salesOrderPONumber: charge.purchaseOrderNumber,
        amountInCents: charge.amountInCents,
        billingPeriodStart: charge.billingPeriodStart,
        billingPeriodEnd: charge.billingPeriodEnd,
        salesOrderLineItemQuantity:
          charge.chargeType === ChargeType.Sale && charge.salesOrderLineItem?.so_quantity
            ? charge.salesOrderLineItem.so_quantity
            : undefined,
      })) ?? [];

  const chargeColumns: GridColDef[] = [
    { field: "_id", headerName: "ID", width: 90 },
    {
      field: "customerName",
      headerName: "Customer",
      width: 180,
      renderCell: (params) => {
        if (!params.row.contactId || !params.value) return params.value;
        return (
          <Link
            href={`/app/${workspaceId}/contacts/${params.row.contactId}`}
            style={{ color: "#1976d2", textDecoration: "none" }}
          >
            {params.value}
          </Link>
        );
      },
    },
    {
      field: "contactId",
      headerName: "Contact ID",
      width: 180,
      renderCell: (params) => {
        if (!params.row.contactId || !params.value) return params.value;
        return (
          <Link
            href={`/app/${workspaceId}/contacts/${params.row.contactId}`}
            style={{ color: "#1976d2", textDecoration: "none" }}
          >
            {params.value}
          </Link>
        );
      },
    },
    {
      field: "projectName",
      headerName: "Project",
      width: 150,
      renderCell: (params) => {
        if (!params.row.projectId || !params.value) return params.value;
        return (
          <Link
            href={`/app/${workspaceId}/projects/${params.row.projectId}`}
            style={{ color: "#1976d2", textDecoration: "none" }}
          >
            {params.value}
          </Link>
        );
      },
    },
    { field: "description", headerName: "Charge Description", width: 220, flex: 1 },
    {
      field: "chargeType",
      headerName: "Type",
      width: 100,
      valueFormatter: (value: string) => {
        // Format the charge type for display (e.g., "SALE" -> "Sale")
        return value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : "";
      },
    },
    {
      field: "amountInCents",
      headerName: "Amount",
      width: 120,
      valueFormatter: (value: number) => {
        return typeof value === "number" ? `$${(value / 100).toFixed(2)}` : "";
      },
      type: "number",
    },
    {
      field: "salesOrderId",
      headerName: "Sales Order ID",
      width: 130,
      renderCell: (params) => {
        if (!params.value) return params.value;
        return (
          <Link
            href={`/app/${workspaceId}/sales-orders/${params.value}`}
            style={{ color: "#1976d2", textDecoration: "none" }}
          >
            {params.value}
          </Link>
        );
      },
    },
    { field: "salesOrderPONumber", headerName: "PO Number", width: 110 },
    {
      field: "salesOrderLineItemQuantity",
      headerName: "Quantity",
      width: 90,
      valueGetter: (value: number | undefined, row: ChargeRow) => {
        return row.chargeType === ChargeType.Sale && value ? value : "";
      },
      type: "number",
    },
    {
      field: "billingPeriodStart",
      headerName: "Billing Start",
      width: 110,
      valueFormatter: (value: string) => {
        return value ? format(new Date(value), "MMM dd, yyyy") : "";
      },
      type: "date",
    },
    {
      field: "billingPeriodEnd",
      headerName: "Billing End",
      width: 110,
      valueFormatter: (value: string) => {
        return value ? format(new Date(value), "MMM dd, yyyy") : "";
      },
      type: "date",
    },
    {
      field: "fulfilmentId",
      headerName: "Fulfilment ID",
      width: 130,
      renderCell: (params) => {
        if (!params.value) return params.value;
        return (
          <Link
            href={`/app/${workspaceId}/fulfillment/${params.value}`}
            style={{ color: "#1976d2", textDecoration: "none" }}
          >
            {params.value}
          </Link>
        );
      },
    },
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
                        : group === "projectName"
                          ? "Project"
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
                  {!rowGroupingModel.includes("projectName") && (
                    <MenuItem value="projectName">Project</MenuItem>
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
                rows={chargeRows}
                columns={chargeColumns}
                getRowId={(row: ChargeRow) => row._id}
                loading={chargesLoading}
                // error={!!chargesError}
                disableRowSelectionOnClick
                disableColumnFilter={false}
                disableColumnMenu={false}
                rowGroupingModel={rowGroupingModel}
                onRowGroupingModelChange={setRowGroupingModel}
                rowSelectionModel={{ type: "include", ids: new Set(rowSelectionModel) }}
                defaultGroupingExpansionDepth={-1}
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
                      items: [
                        {
                          field: "customerName",
                          operator: "equals",
                          value: buyerName,
                        },
                      ],
                      quickFilterValues: [""],
                    },
                  },
                  pagination: { paginationModel: { pageSize: 5 } },
                  columns: {
                    columnVisibilityModel: {
                      _id: false,
                      salesOrderPONumber: false,
                      salesOrderLineItemQuantity: false,
                      fulfilmentId: false,
                      contactId: false,
                    },
                  },
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
              inputProps={{ step: "0.01" }}
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
              setMutationError(null);
              try {
                const { data } = await createChargeMisc({
                  variables: {
                    input: {
                      description: miscDesc,
                      amountInCents: Math.round(Number(miscAmount) * 100),
                      chargeType: ChargeType.Sale,
                      contactId: buyerId,
                    },
                  },
                });
                if (data?.createCharge?.id) {
                  await addInvoiceCharges({
                    variables: { input: { invoiceId, chargeIds: [data?.createCharge?.id] } },
                  });
                }
                onClose();
              } catch (err: any) {
                setMutationError(err?.message || "Failed to create miscellaneous charge.");
              }
            } else {
              setMutationError(null);
              const selectedChargeIds = chargeRows
                .filter((row: ChargeRow) => rowSelectionModel.includes(row._id))
                .map((row: ChargeRow) => row._id);
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
                refetch();
                onClose();
              } catch (err: any) {
                setMutationError(err?.message || "Failed to add charges to invoice.");
              }
            }
          }}
          color="primary"
          variant="contained"
          disabled={(tab === 1 && !miscValid) || addChargesLoading || createChargeLoading}
        >
          {addChargesLoading || createChargeLoading ? "Adding..." : "Add"}
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
