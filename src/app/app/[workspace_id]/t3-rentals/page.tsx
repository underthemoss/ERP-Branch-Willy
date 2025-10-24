"use client";

import { graphql } from "@/graphql";
import { useListRentalViewsQuery } from "@/graphql/hooks";
import ClearIcon from "@mui/icons-material/Clear";
import {
  Box,
  Chip,
  Container,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGridPremium, GridColDef } from "@mui/x-data-grid-premium";
import { PageContainer } from "@toolpad/core/PageContainer";
import { format, parseISO } from "date-fns";
import { useParams } from "next/navigation";
import * as React from "react";

graphql(`
  query ListRentalViews($filter: RentalViewFilterInput, $page: ListRentalViewsPageInput) {
    listRentalViews(filter: $filter, page: $page) {
      items {
        rentalId
        details {
          rentalId
          orderId
          dateCreated
          startDate
          endDate
          startDateEstimated
          endDateEstimated
          borrowerUserId
          inventoryProductName
          quantity
          price
          pricePerDay
          pricePerWeek
          pricePerMonth
          rentalStatusId
          equipmentClassId
          assetId
        }
        order {
          orderId
          companyId
          companyName
          orderStatusId
          orderStatusName
          orderedByUserId
          orderedByEmail
          orderedByFirstName
          orderedByLastName
          dateCreated
          dateUpdated
        }
        status {
          id
          name
        }
        asset {
          assetId
          details {
            name
            customName
            model
            serialNumber
          }
          company {
            id
            name
          }
        }
      }
      page {
        number
        size
        totalItems
        totalPages
      }
    }
  }
`);

export default function T3RentalsPage() {
  const { workspace_id } = useParams<{ workspace_id: string }>();

  // Filter state
  const [rentalStatusId, setRentalStatusId] = React.useState<string>("");
  const [startDateFrom, setStartDateFrom] = React.useState<string>("");
  const [startDateTo, setStartDateTo] = React.useState<string>("");
  const [assetId, setAssetId] = React.useState<string>("");
  const [orderId, setOrderId] = React.useState<string>("");
  const [borrowerUserId, setBorrowerUserId] = React.useState<string>("");

  // Pagination state
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);

  // Build filter object
  const filter = React.useMemo(() => {
    const filterObj: {
      assetId?: string;
      borrowerUserId?: string;
      orderId?: string;
      rentalStatusId?: string;
      startDateFrom?: string;
      startDateTo?: string;
    } = {};

    if (assetId) filterObj.assetId = assetId;
    if (borrowerUserId) filterObj.borrowerUserId = borrowerUserId;
    if (orderId) filterObj.orderId = orderId;
    if (rentalStatusId) filterObj.rentalStatusId = rentalStatusId;
    if (startDateFrom) filterObj.startDateFrom = startDateFrom;
    if (startDateTo) filterObj.startDateTo = startDateTo;

    return Object.keys(filterObj).length > 0 ? filterObj : undefined;
  }, [assetId, borrowerUserId, orderId, rentalStatusId, startDateFrom, startDateTo]);

  // Fetch data
  const { data, loading, error } = useListRentalViewsQuery({
    variables: {
      filter,
      page: {
        number: page,
        size: pageSize,
      },
    },
    fetchPolicy: "cache-and-network",
  });

  // Map data to table rows
  type RentalRow = {
    id: string;
    rentalId: string;
    orderId: string;
    assetId: string;
    assetName: string;
    productName: string;
    company: string;
    borrowerName: string;
    status: string;
    statusId: string;
    startDate: string;
    endDate: string;
    quantity: string;
    pricePerDay: string;
    pricePerWeek: string;
    pricePerMonth: string;
    dateCreated: string;
  };

  const rows: RentalRow[] = React.useMemo(() => {
    if (!data?.listRentalViews?.items) return [];

    return data.listRentalViews.items.map((item): RentalRow => {
      const borrowerName =
        item.order?.orderedByFirstName && item.order?.orderedByLastName
          ? `${item.order.orderedByFirstName} ${item.order.orderedByLastName}`
          : item.order?.orderedByEmail || "-";

      return {
        id: item.rentalId,
        rentalId: item.rentalId,
        orderId: item.details?.orderId || "-",
        assetId: item.details?.assetId || "-",
        assetName: item.asset?.details?.customName || item.asset?.details?.name || "-",
        productName: item.details?.inventoryProductName || "-",
        company: item.order?.companyName || item.asset?.company?.name || "-",
        borrowerName,
        status: item.status?.name || "-",
        statusId: item.status?.id || "-",
        startDate: item.details?.startDate || "-",
        endDate: item.details?.endDate || "-",
        quantity: item.details?.quantity || "-",
        pricePerDay: item.details?.pricePerDay
          ? `$${parseFloat(item.details.pricePerDay).toFixed(2)}`
          : "-",
        pricePerWeek: item.details?.pricePerWeek
          ? `$${parseFloat(item.details.pricePerWeek).toFixed(2)}`
          : "-",
        pricePerMonth: item.details?.pricePerMonth
          ? `$${parseFloat(item.details.pricePerMonth).toFixed(2)}`
          : "-",
        dateCreated: item.details?.dateCreated || "-",
      };
    });
  }, [data]);

  const columns: GridColDef[] = [
    { field: "rentalId", headerName: "Rental ID", width: 120 },
    { field: "orderId", headerName: "Order ID", width: 120 },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      renderCell: (params) => (
        <Chip label={params.value} size="small" color="primary" variant="outlined" />
      ),
    },
    { field: "productName", headerName: "Product", flex: 2, minWidth: 200 },
    { field: "assetName", headerName: "Asset", flex: 1, minWidth: 150 },
    { field: "company", headerName: "Company", flex: 1, minWidth: 150 },
    { field: "borrowerName", headerName: "Borrower", flex: 1, minWidth: 150 },
    {
      field: "startDate",
      headerName: "Start Date",
      width: 120,
      renderCell: (params) => {
        if (!params.value || params.value === "-") return "-";
        try {
          const date = parseISO(params.value);
          return format(date, "MM/dd/yyyy");
        } catch {
          return params.value;
        }
      },
    },
    {
      field: "endDate",
      headerName: "End Date",
      width: 120,
      renderCell: (params) => {
        if (!params.value || params.value === "-") return "-";
        try {
          const date = parseISO(params.value);
          return format(date, "MM/dd/yyyy");
        } catch {
          return params.value;
        }
      },
    },
    { field: "quantity", headerName: "Qty", width: 80 },
    { field: "pricePerDay", headerName: "Day Rate", width: 100 },
    { field: "pricePerWeek", headerName: "Week Rate", width: 110 },
    { field: "pricePerMonth", headerName: "Month Rate", width: 120 },
    {
      field: "dateCreated",
      headerName: "Created",
      width: 120,
      renderCell: (params) => {
        if (!params.value || params.value === "-") return "-";
        try {
          const date = parseISO(params.value);
          return (
            <Tooltip title={format(date, "PPpp")} arrow>
              <span>{format(date, "MM/dd/yyyy")}</span>
            </Tooltip>
          );
        } catch {
          return params.value;
        }
      },
    },
  ];

  const activeFilterCount = [
    rentalStatusId,
    startDateFrom,
    startDateTo,
    assetId,
    orderId,
    borrowerUserId,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setRentalStatusId("");
    setStartDateFrom("");
    setStartDateTo("");
    setAssetId("");
    setOrderId("");
    setBorrowerUserId("");
    setPage(1);
  };

  return (
    <PageContainer>
      <Container maxWidth="xl">
        <Box display="flex" alignItems="center" justifyContent="space-between" mt={4} mb={1}>
          <Typography variant="h1">T3 Rentals</Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" mb={3}>
          View and filter rental records from the T3 system.
        </Typography>

        {/* Filters */}
        <Box mb={3}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Typography variant="subtitle2" color="text.secondary">
              Filters
            </Typography>
            {activeFilterCount > 0 && (
              <>
                <Chip label={`${activeFilterCount} active`} size="small" color="primary" />
                <IconButton size="small" onClick={clearAllFilters} title="Clear all filters">
                  <ClearIcon fontSize="small" />
                </IconButton>
              </>
            )}
          </Box>

          <Box display="flex" gap={2} flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Rental Status</InputLabel>
              <Select
                value={rentalStatusId}
                label="Rental Status"
                onChange={(e) => {
                  setRentalStatusId(e.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="">
                  <em>All Statuses</em>
                </MenuItem>
                <MenuItem value="1">Active</MenuItem>
                <MenuItem value="2">Completed</MenuItem>
                <MenuItem value="3">Cancelled</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size="small"
              label="Start Date From"
              type="date"
              value={startDateFrom}
              onChange={(e) => {
                setStartDateFrom(e.target.value);
                setPage(1);
              }}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 180 }}
            />

            <TextField
              size="small"
              label="Start Date To"
              type="date"
              value={startDateTo}
              onChange={(e) => {
                setStartDateTo(e.target.value);
                setPage(1);
              }}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 180 }}
            />

            <TextField
              size="small"
              label="Asset ID"
              value={assetId}
              onChange={(e) => {
                setAssetId(e.target.value);
                setPage(1);
              }}
              placeholder="Enter asset ID"
              sx={{ minWidth: 150 }}
            />

            <TextField
              size="small"
              label="Order ID"
              value={orderId}
              onChange={(e) => {
                setOrderId(e.target.value);
                setPage(1);
              }}
              placeholder="Enter order ID"
              sx={{ minWidth: 150 }}
            />

            <TextField
              size="small"
              label="Borrower User ID"
              value={borrowerUserId}
              onChange={(e) => {
                setBorrowerUserId(e.target.value);
                setPage(1);
              }}
              placeholder="Enter user ID"
              sx={{ minWidth: 150 }}
            />
          </Box>
        </Box>

        {/* Results summary */}
        {data?.listRentalViews?.page && (
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary">
              Showing {rows.length} of {data.listRentalViews.page.totalItems} rentals (Page{" "}
              {data.listRentalViews.page.number} of {data.listRentalViews.page.totalPages})
            </Typography>
          </Box>
        )}

        {/* Data Grid */}
        <Box sx={{ height: 600 }}>
          <DataGridPremium
            columns={columns}
            rows={rows}
            loading={loading}
            disableRowSelectionOnClick
            pagination
            paginationMode="server"
            rowCount={data?.listRentalViews?.page.totalItems || 0}
            paginationModel={{
              page: page - 1, // MUI uses 0-based indexing
              pageSize: pageSize,
            }}
            onPaginationModelChange={(model) => {
              setPage(model.page + 1); // Convert back to 1-based
              setPageSize(model.pageSize);
            }}
            pageSizeOptions={[10, 25, 50, 100]}
            getRowId={(row: RentalRow) => row.id}
            sx={{
              "& .MuiDataGrid-row:hover": {
                backgroundColor: "#f5f5f5",
              },
            }}
          />
          {error && (
            <Typography color="error" mt={2}>
              Failed to load T3 rentals: {error.message}
            </Typography>
          )}
        </Box>
      </Container>
    </PageContainer>
  );
}
