// "use client";

import { graphql } from "@/graphql";
import { SalesOrderLineItemsQuery, SalesOrderStatus } from "@/graphql/graphql";
import { useSalesOrderLineItemsQuery } from "@/graphql/hooks";
import { parseDate } from "@/lib/parseDate";
import EmptyStateListViewIcon from "@/ui/icons/EmptyStateListViewIcon";
import ErrorStateListViewIcon from "@/ui/icons/ErrorStateListViewIcon";
import DateRangeIcon from "@mui/icons-material/DateRange";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { Box, Button, Tooltip, Typography } from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import { DataGridPremium, GridColDef, Toolbar } from "@mui/x-data-grid-premium";
import { addDays, format } from "date-fns";
import * as React from "react";
import DeleteLineItemButton from "./DeleteLineItemButton";
import EditLineItemButton from "./EditLineItemButton";

// --- GQL Query (for codegen) ---
graphql(`
  query SalesOrderLineItems($salesOrderId: String!) {
    getSalesOrderById(id: $salesOrderId) {
      pricing {
        sub_total_in_cents
        tax_total_in_cents
        total_in_cents
      }
      line_items {
        ... on RentalSalesOrderLineItem {
          id
          so_pim_id
          so_quantity
          so_pim_product {
            name
            model
            sku
            manufacturer_part_number
            year
          }
          so_pim_category {
            id
            name
            description
          }

          created_by_user {
            firstName
            lastName
          }
          updated_by_user {
            firstName
            lastName
          }
          price {
            ... on RentalPrice {
              priceBook {
                name
                id
              }
            }
          }
          calulate_price {
            strategy
            rentalPeriod {
              days28
              days7
              days1
            }
            details {
              optimalSplit {
                days28
                days7
                days1
              }
              plainText
              rates {
                pricePer28DaysInCents
                pricePer7DaysInCents
                pricePer1DayInCents
              }
            }
            total_including_delivery_in_cents
            forecast {
              days {
                day
                cost_in_cents
                accumulative_cost_in_cents
              }
            }
          }

          price_id
          price_per_day_in_cents
          price_per_week_in_cents
          price_per_month_in_cents
          delivery_location
          delivery_date
          delivery_method
          delivery_charge_in_cents
          off_rent_date
          created_at
          updated_at
          lineitem_status
        }
        ... on SaleSalesOrderLineItem {
          id
          so_pim_id
          so_quantity
          so_pim_product {
            name
            model
            sku
            manufacturer_part_number
            year
          }
          so_pim_category {
            id
            name
            description
          }

          price {
            ... on SalePrice {
              unitCostInCents
              priceBook {
                name
                id
              }
            }
          }
          unit_cost_in_cents
          delivery_location
          delivery_date
          delivery_method
          delivery_charge_in_cents
          deliveryNotes
          created_at
          updated_at
          lineitem_status
        }
      }
    }
  }
`);

export interface SalesOrderLineItemsDataGridProps {
  salesOrderId: string;
  salesOrderStatus: SalesOrderStatus;
  onAddNewItem?: () => void;
  onEditItem?: (
    lineItemId: string,
    lineItemType: "RentalSalesOrderLineItem" | "SaleSalesOrderLineItem",
  ) => void;
}
type RowType = NonNullable<
  NonNullable<NonNullable<SalesOrderLineItemsQuery["getSalesOrderById"]>["line_items"]>[number]
>;

export const SalesOrderLineItemsDataGrid: React.FC<SalesOrderLineItemsDataGridProps> = ({
  salesOrderId,
  onAddNewItem,
  salesOrderStatus,
  onEditItem,
}) => {
  const { data, loading, error, refetch } = useSalesOrderLineItemsQuery({
    variables: { salesOrderId },
    fetchPolicy: "cache-and-network",
  });

  const handleAddNewItem = async () => {
    if (onAddNewItem) {
      await onAddNewItem();
      await refetch();
    }
  };

  const lineItems = data?.getSalesOrderById?.line_items || [];

  const columns: GridColDef[] = [
    // Line item type icon column (first)
    {
      field: "line_item_type",
      headerName: "",
      width: 50,
      sortable: false,
      filterable: false,
      align: "center",
      renderCell: (params) => {
        if (params.row.__typename === "RentalSalesOrderLineItem") {
          return (
            <Tooltip title="Rental" arrow>
              <span>
                <DateRangeIcon color="primary" fontSize="small" />
              </span>
            </Tooltip>
          );
        }
        if (params.row.__typename === "SaleSalesOrderLineItem") {
          return (
            <Tooltip title="Sale" arrow>
              <span>
                <ShoppingCartIcon color="secondary" fontSize="small" />
              </span>
            </Tooltip>
          );
        }
        return null;
      },
    },
    // Core identifiers and product/category info
    {
      field: "id",
      headerName: "ID",
      minWidth: 120,
      flex: 1,
    },
    {
      field: "so_pim_id",
      headerName: "PIM ID",
      minWidth: 120,
      flex: 1,
      valueGetter: (_, row: RowType) => row.so_pim_id ?? "-",
    },
    {
      field: "so_pim_product.name",
      headerName: "Product Name",
      minWidth: 180,
      flex: 1,
      valueGetter: (_, row: RowType) =>
        row.so_pim_product?.name ?? row.so_pim_category?.name ?? "-",
    },
    {
      field: "so_pim_product.model",
      headerName: "Model",
      minWidth: 120,
      flex: 1,
      valueGetter: (_, row: RowType) => row.so_pim_product?.model ?? "-",
    },
    {
      field: "so_pim_product.sku",
      headerName: "SKU",
      minWidth: 120,
      flex: 1,
      valueGetter: (_, row: RowType) => row.so_pim_product?.sku ?? "-",
    },
    {
      field: "so_pim_product.manufacturer_part_number",
      headerName: "Mfr Part #",
      minWidth: 140,
      flex: 1,
      valueGetter: (_, row: RowType) => row.so_pim_product?.manufacturer_part_number ?? "-",
    },

    {
      field: "so_pim_product.year",
      headerName: "Year",
      minWidth: 80,
      flex: 0.5,
      valueGetter: (_, row: RowType) => row.so_pim_product?.year ?? "-",
    },
    {
      field: "so_pim_category.name",
      headerName: "Category Name",
      minWidth: 140,
      flex: 1,
      valueGetter: (_, row: RowType) => row.so_pim_category?.name ?? "-",
    },
    {
      field: "so_pim_category.description",
      headerName: "Category Description",
      minWidth: 180,
      flex: 1,
      valueGetter: (_, row: RowType) => row.so_pim_category?.description ?? "-",
    },
    {
      field: "so_pim_category.id",
      headerName: "Category ID",
      minWidth: 120,
      flex: 1,
      valueGetter: (_, row: RowType) => row.so_pim_category?.id ?? "-",
    },

    // Pricing
    {
      field: "price.priceBook.name",
      headerName: "Price Book Name",
      minWidth: 160,
      flex: 1,
      valueGetter: (_, row: RowType) =>
        row.__typename === "RentalSalesOrderLineItem" && row.price?.__typename === "RentalPrice"
          ? row.price?.priceBook?.name
          : "-",
    },
    // Quantities and status
    {
      field: "so_quantity",
      headerName: "Quantity",
      type: "number",
      minWidth: 100,
      flex: 0.5,
    },
    {
      field: "lineitem_status",
      headerName: "Line Item Status",
      minWidth: 140,
      flex: 1,
      valueGetter: (_, row) => row.lineitem_status ?? "-",
    },

    // Fulfillment
    {
      field: "delivery_method",
      headerName: "Delivery Method",
      minWidth: 120,
      flex: 1,
      valueGetter: (_, row) => row.delivery_method ?? "-",
    },
    {
      field: "delivery_location",
      headerName: "Delivery Location",
      minWidth: 160,
      flex: 1,
      valueGetter: (_, row) => row.delivery_location ?? "-",
    },
    {
      field: "delivery_charge_in_cents",
      headerName: "Delivery Charge",
      minWidth: 120,
      flex: 1,
      valueGetter: (_, row) =>
        typeof row.delivery_charge_in_cents === "number"
          ? `$${(row.delivery_charge_in_cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : "-",
    },
    {
      field: "delivery_date",
      headerName: "Delivery Date",
      minWidth: 140,
      flex: 1,
      valueGetter: (_, row) =>
        row.delivery_date ? (parseDate(row.delivery_date)?.toLocaleDateString() ?? "-") : "-",
    },
    {
      field: "off_rent_date",
      headerName: "Off-Rent Date",
      minWidth: 140,
      flex: 1,
      valueGetter: (_, row) =>
        row.off_rent_date ? (parseDate(row.off_rent_date)?.toLocaleDateString() ?? "-") : "-",
    },

    // User and audit
    {
      field: "created_by_user",
      headerName: "Created By User",
      minWidth: 160,
      flex: 1,
      valueGetter: (_, row) =>
        row.created_by_user
          ? `${row.created_by_user.firstName ?? ""} ${row.created_by_user.lastName ?? ""}`.trim() ||
            "-"
          : "-",
    },
    {
      field: "updated_by_user",
      headerName: "Updated By User",
      minWidth: 160,
      flex: 1,
      valueGetter: (_, row) =>
        row.updated_by_user
          ? `${row.updated_by_user.firstName ?? ""} ${row.updated_by_user.lastName ?? ""}`.trim() ||
            "-"
          : "-",
    },
    {
      field: "created_at",
      headerName: "Created At",
      minWidth: 140,
      flex: 1,
      valueGetter: (_, row) =>
        row.created_at ? (parseDate(row.created_at)?.toLocaleString() ?? "-") : "-",
    },
    {
      field: "line_item_total_incl_delivery",
      headerName: "Line Item Price (Incl. Delivery)",
      minWidth: 180,
      flex: 1,
      valueGetter: (_, row: RowType) => {
        // Rental: use calulate_price.total_including_delivery_in_cents if present
        if (
          row.__typename === "RentalSalesOrderLineItem" &&
          row.calulate_price &&
          typeof row.calulate_price.total_including_delivery_in_cents === "number"
        ) {
          return `$${(row.calulate_price.total_including_delivery_in_cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        // Sale: use unit_cost_in_cents if present
        if (row.__typename === "SaleSalesOrderLineItem") {
          const quantity = row.so_quantity || 1;
          const priceBookUnitPrice =
            row.price?.__typename === "SalePrice" && row.price.unitCostInCents;
          const customUnitProce = row.unit_cost_in_cents;
          const unitPrice = priceBookUnitPrice || customUnitProce;
          if (!unitPrice) return "-";
          const subtotal = unitPrice * quantity;
          const deliveryCharge = row.delivery_charge_in_cents || 0;
          const totalIncludingDelivery = subtotal + deliveryCharge;
          return `$${(totalIncludingDelivery / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        return "-";
      },
    },
    {
      field: "updated_at",
      headerName: "Updated At",
      minWidth: 140,
      flex: 1,
      valueGetter: (_, row) =>
        row.updated_at ? (parseDate(row.updated_at)?.toLocaleString() ?? "-") : "-",
    },
    {
      field: "actions",
      headerName: "Actions",
      minWidth: 120,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      align: "center",
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <EditLineItemButton
            lineItemId={params.row.id}
            lineItemType={params.row.__typename}
            onEdit={() => onEditItem?.(params.row.id, params.row.__typename)}
          />
          <DeleteLineItemButton lineItemId={params.row.id} onDeleted={refetch} />
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Order Items
      </Typography>
      <Box sx={{ width: "100%", mb: 2 }}>
        {error ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 6,
              minHeight: 320,
              textAlign: "center",
              background: "background.paper",
              borderRadius: 2,
            }}
          >
            <ErrorStateListViewIcon sx={{ width: 104, height: 101, mb: 3 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              Error loading order items
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
              Something went wrong. Please try again.
            </Typography>

            <Button
              variant="outlined"
              size="small"
              onClick={() => refetch()}
              sx={{ minWidth: 160 }}
            >
              Retry
            </Button>
          </Box>
        ) : lineItems.length === 0 && !loading ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 6,
              minHeight: 320,
              textAlign: "center",
              background: "background.paper",
              borderRadius: 2,
            }}
          >
            <EmptyStateListViewIcon style={{ width: 104, height: 101, marginBottom: 24 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              Items in the order will show here
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
              Manage each line item&apos;s transaction type, details, and fulfillment requirements
              here.
            </Typography>
            <Button
              variant="contained"
              size="medium"
              onClick={handleAddNewItem}
              sx={{ minWidth: 160 }}
              disabled={salesOrderStatus === SalesOrderStatus.Submitted}
            >
              Add New Item
            </Button>
          </Box>
        ) : (
          <>
            <DataGridPremium
              rows={lineItems}
              columns={columns}
              loading={loading}
              pinnedColumns={{ right: ["actions"] }}
              disableRowSelectionOnClick
              autoHeight
              getRowId={(row) => row.id}
              sx={{ backgroundColor: "background.paper" }}
              initialState={{
                columns: {
                  columnVisibilityModel: {
                    // Show only these columns by default
                    "so_pim_product.name": true,
                    so_quantity: true,
                    line_item_total_incl_delivery: true,
                    lineitem_status: true,
                    delivery_method: true,
                    // All others hidden by default
                    id: false,
                    so_pim_id: false,
                    "so_pim_product.model": false,
                    "so_pim_product.sku": false,
                    "so_pim_product.manufacturer_part_number": false,
                    "so_pim_product.year": false,
                    "so_pim_category.name": false,
                    "so_pim_category.description": false,
                    "so_pim_category.id": false,
                    "price.priceBook.name": false,
                    "price.priceBook.id": false,
                    price_per_day_in_cents: false,
                    price_per_week_in_cents: false,
                    price_per_month_in_cents: false,
                    unit_cost_in_cents: false,
                    price_id: false,
                    delivery_location: false,
                    delivery_charge_in_cents: false,
                    delivery_date: true,
                    off_rent_date: true,
                    created_by_user: false,
                    updated_by_user: false,
                    created_at: false,
                    updated_at: false,
                  },
                },
              }}
              slots={{
                toolbar: Toolbar,
                footer: () => {
                  // Calculate subtotal including delivery charges
                  let totalIncludingDelivery = 0;

                  lineItems.forEach((item) => {
                    if (!item) return;

                    if (item.__typename === "RentalSalesOrderLineItem") {
                      if (item.calulate_price?.total_including_delivery_in_cents) {
                        totalIncludingDelivery +=
                          item.calulate_price.total_including_delivery_in_cents;
                      }
                    } else if (item.__typename === "SaleSalesOrderLineItem") {
                      const quantity = item.so_quantity || 1;
                      const priceBookUnitPrice =
                        item.price?.__typename === "SalePrice" ? item.price.unitCostInCents : null;
                      const customUnitPrice = item.unit_cost_in_cents;
                      const unitPrice = priceBookUnitPrice || customUnitPrice || 0;
                      const subtotal = unitPrice * quantity;
                      const deliveryCharge = item.delivery_charge_in_cents || 0;
                      totalIncludingDelivery += subtotal + deliveryCharge;
                    }
                  });

                  const pricing = data?.getSalesOrderById?.pricing;
                  const backendSubTotalCents = pricing?.sub_total_in_cents ?? 0;
                  const backendSubTotalFormatted = `$${(backendSubTotalCents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                  const totalIncludingDeliveryFormatted = `$${(totalIncludingDelivery / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

                  return (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        px: 2,
                        py: 1,
                        background: "background.paper",
                        borderTop: 1,
                        borderColor: "divider",
                      }}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                        Subtotal: {backendSubTotalFormatted}
                      </Typography>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: "bold", color: "primary.main" }}
                      >
                        Total (incl. delivery): {totalIncludingDeliveryFormatted}
                      </Typography>
                    </Box>
                  );
                },
              }}
              getDetailPanelContent={({
                row,
              }: {
                row: NonNullable<
                  NonNullable<NonNullable<typeof data>["getSalesOrderById"]>["line_items"]
                >[number];
              }) =>
                row?.__typename === "RentalSalesOrderLineItem" ? (
                  <Box sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Rental Line Item Details
                    </Typography>
                    <Typography variant="body2">
                      <strong>Product:</strong> {row.so_pim_product?.name} (
                      {row.so_pim_product?.model})
                    </Typography>

                    <Box sx={{ mt: 2 }}>
                      {row.calulate_price?.details && (
                        <>
                          <Typography variant="body2">
                            <strong>Rates:</strong>{" "}
                            {row.calulate_price?.details.rates
                              ? `28d: $${(row.calulate_price?.details.rates.pricePer28DaysInCents / 100).toFixed(2)}, 7d: $${(row.calulate_price?.details.rates.pricePer7DaysInCents / 100).toFixed(2)}, 1d: $${(row.calulate_price?.details.rates.pricePer1DayInCents / 100).toFixed(2)}`
                              : "-"}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Optimal Split:</strong>{" "}
                            {row.calulate_price?.details.optimalSplit
                              ? `28d: ${row.calulate_price?.details.optimalSplit.days28}, 7d: ${row.calulate_price?.details.optimalSplit.days7}, 1d: ${row.calulate_price?.details.optimalSplit.days1}`
                              : "-"}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Cost Summary:</strong>{" "}
                            {row.calulate_price?.details.plainText ?? "-"}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Sub total:</strong>{" "}
                            {row.delivery_charge_in_cents &&
                            row.calulate_price.total_including_delivery_in_cents
                              ? `$${((row.calulate_price.total_including_delivery_in_cents - row.delivery_charge_in_cents) / 100).toFixed(2)}`
                              : "-"}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Delivery:</strong>{" "}
                            {row.delivery_charge_in_cents
                              ? `$${(row.delivery_charge_in_cents / 100).toFixed(2)}`
                              : "-"}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Total (Incl. Delivery):</strong>{" "}
                            {row.calulate_price?.total_including_delivery_in_cents
                              ? `$${(row.calulate_price.total_including_delivery_in_cents / 100).toFixed(2)}`
                              : "-"}
                          </Typography>
                        </>
                      )}
                    </Box>

                    <Typography variant="body2">
                      <strong>Delivery Method:</strong> {row.delivery_method ?? "-"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Delivery Location:</strong> {row.delivery_location ?? "-"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Delivery Date:</strong>{" "}
                      {row.delivery_date
                        ? (parseDate(row.delivery_date)?.toLocaleDateString() ?? "-")
                        : "-"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Off-Rent Date:</strong>{" "}
                      {row.off_rent_date
                        ? (parseDate(row.off_rent_date)?.toLocaleDateString() ?? "-")
                        : "-"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Created By:</strong>{" "}
                      {row.created_by_user
                        ? `${row.created_by_user.firstName} ${row.created_by_user.lastName}`
                        : "-"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Updated By:</strong>{" "}
                      {row.updated_by_user
                        ? `${row.updated_by_user.firstName} ${row.updated_by_user.lastName}`
                        : "-"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Created At:</strong>{" "}
                      {row.created_at ? (parseDate(row.created_at)?.toLocaleString() ?? "-") : "-"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Updated At:</strong>{" "}
                      {row.updated_at ? (parseDate(row.updated_at)?.toLocaleString() ?? "-") : "-"}
                    </Typography>

                    {(row.calulate_price?.forecast?.days?.length ?? 0) > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Cost Forecast
                        </Typography>
                        <LineChart
                          height={220}
                          series={[
                            {
                              data: row.calulate_price?.forecast?.days.map(
                                (d: any) => d.accumulative_cost_in_cents / 100,
                              ),
                              label: "Accumulative Cost ($)",
                              color: "#1976d2",
                              showMark: false,
                            },
                          ]}
                          xAxis={[
                            {
                              data: row.calulate_price?.forecast?.days.map((d: any) => d.day),
                              label: "Day",
                              valueFormatter: (v: number) =>
                                row.delivery_date
                                  ? format(addDays(row.delivery_date, v), "d MMM")
                                  : String(v),
                            },
                          ]}
                          yAxis={[
                            {
                              label: "Cost ($)",
                              valueFormatter: (v: number) =>
                                `$${v.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}`,
                            },
                          ]}
                        />
                      </Box>
                    )}
                  </Box>
                ) : null
              }
            />
            <Button
              variant="outlined"
              size="small"
              onClick={handleAddNewItem}
              sx={{ mt: 1, alignSelf: "flex-start" }}
              disabled={salesOrderStatus === SalesOrderStatus.Submitted}
            >
              Add Item
            </Button>
          </>
        )}
      </Box>
      {/* Dialog for adding items is now handled by parent */}
    </Box>
  );
};

export default SalesOrderLineItemsDataGrid;
