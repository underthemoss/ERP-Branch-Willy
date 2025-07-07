import {
  useSetExpectedRentalEndDateMutation,
  useSetRentalEndDateMutation,
  useSetRentalStartDateMutation,
} from "@/ui/fulfilment/api";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import EditIcon from "@mui/icons-material/Edit";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import IconButton from "@mui/material/IconButton";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useState } from "react";
import { RentalFulfilmentPrice, SaleFulfilmentPrice, useGetFulfilmentByIdQuery } from "./api";

export type FulfillmentDetailsProps = {
  fulfillmentId: string;
};

/* Removed mockFulfillment, now using real data from GraphQL */

export function FulfillmentDetails({ fulfillmentId }: FulfillmentDetailsProps) {
  const [endRentalDialogOpen, setEndRentalDialogOpen] = useState(false);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const { workspace_id } = useParams<{ workspace_id: string }>();
  const { data, loading, error, refetch } = useGetFulfilmentByIdQuery({
    variables: { id: fulfillmentId },
  });
  const fulfilment = data?.getFulfilmentById;

  // Mutation hooks for rental dates
  const [setRentalStartDate] = useSetRentalStartDateMutation();
  const [setRentalEndDate] = useSetRentalEndDateMutation();
  const [setExpectedRentalEndDate] = useSetExpectedRentalEndDateMutation();

  // State for editing which date
  const [editingDateField, setEditingDateField] = React.useState<"start" | "expectedEnd" | null>(
    null,
  );

  if (loading) {
    return <div>Loading fulfilment details...</div>;
  }
  if (error || !fulfilment) {
    return <div>Error loading fulfilment details.</div>;
  }

  // Render below using fulfilment fields
  // Type guards for union types
  const isRental = (f: any): f is { rentalStartDate?: string; rentalEndDate?: string } =>
    f.__typename === "RentalFulfilment";
  const isSale = (f: any): f is { salePrice?: number; quantity?: number } =>
    f.__typename === "SaleFulfilment";
  const isService = (f: any): f is { serviceDate?: string } => f.__typename === "ServiceFulfilment";

  // Helper for assignedTo
  const assignedTo =
    fulfilment.assignedTo &&
    [fulfilment.assignedTo.firstName, fulfilment.assignedTo.lastName].filter(Boolean).join(" ");

  let price: RentalFulfilmentPrice | SaleFulfilmentPrice | undefined;

  switch (fulfilment.salesOrderLineItem?.__typename) {
    case "RentalSalesOrderLineItem":
      price = fulfilment.salesOrderLineItem.price as RentalFulfilmentPrice;
      break;
    case "SaleSalesOrderLineItem":
      price = fulfilment.salesOrderLineItem.price as SaleFulfilmentPrice;
      break;
    default:
      price = undefined;
  }

  return (
    <div
      // give this a max with of lg in mui
      style={{
        display: "flex",
        height: "100%",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      {/* Main Content */}
      <div
        style={{
          flex: 3,
          padding: 2,
          borderRight: "1px solid #ececec",
          background: "#fff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 32 }}>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              marginRight: 16,
              color: "#1a1a1a",
            }}
          >
            {price?.name || fulfilment.id}
            <span
              style={{
                fontSize: 16,
                fontWeight: 400,
                color: "#888",
                marginLeft: 12,
              }}
            >
              {fulfilment.salesOrderType}
            </span>
            <div>
              <Typography variant="caption">
                {price?.pimCategory?.path}
                {price?.pimCategory?.name}
              </Typography>
            </div>
          </div>
        </div>
        <div style={{ marginBottom: 20, color: "#555", fontSize: 15 }}>
          <strong>Assigned To:</strong> {assignedTo || "-"} &nbsp;|&nbsp;
          <strong>Email:</strong> {fulfilment.assignedTo?.email || "-"}
        </div>
        <div style={{ marginBottom: 32 }}></div>
        {/* Type-specific fields */}
        {isRental(fulfilment) &&
          (() => {
            type RentalFulfilment = {
              rentalStartDate?: string;
              expectedRentalEndDate?: string;
              id: string;
              [key: string]: any;
            };
            const rentalFulfilment = fulfilment as RentalFulfilment;
            const rentalStartDateValue = rentalFulfilment.rentalStartDate
              ? new Date(rentalFulfilment.rentalStartDate)
              : null;
            const expectedRentalEndDateValue = rentalFulfilment.expectedRentalEndDate
              ? new Date(rentalFulfilment.expectedRentalEndDate)
              : null;

            // Helper to format date
            const formatDate = (date: Date | null) =>
              date
                ? date.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "-";

            // Days between
            let daysBetween: number | null = null;
            if (rentalStartDateValue && expectedRentalEndDateValue) {
              const msPerDay = 1000 * 60 * 60 * 24;
              daysBetween = Math.round(
                (expectedRentalEndDateValue.getTime() - rentalStartDateValue.getTime()) / msPerDay,
              );
            }

            return (
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontWeight: 600, marginBottom: 6, color: "#222" }}>
                  Rental Details
                </div>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <div
                    style={{
                      color: "#333",
                      fontSize: 15,
                      display: "flex",
                      alignItems: "center",
                      gap: 24,
                    }}
                  >
                    {/* Start Date */}
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      {editingDateField === "start" || !rentalStartDateValue ? (
                        <DatePicker
                          label="Start Date"
                          value={rentalStartDateValue}
                          onChange={async (date) => {
                            if (!date) return;
                            try {
                              await setRentalStartDate({
                                variables: {
                                  fulfilmentId: rentalFulfilment.id,
                                  rentalStartDate: date.toISOString(),
                                },
                              });
                              setEditingDateField(null);
                              refetch();
                            } catch (e) {
                              // handle error (could show a toast/snackbar)
                            }
                          }}
                          onClose={() => setEditingDateField(null)}
                          slotProps={{
                            textField: { size: "small", fullWidth: true },
                          }}
                        />
                      ) : (
                        <>
                          <span>{formatDate(rentalStartDateValue)}</span>
                          <IconButton
                            size="small"
                            onClick={() => setEditingDateField("start")}
                            aria-label="Edit start date"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </div>
                    {/* Arrow and days between */}
                    {rentalStartDateValue && expectedRentalEndDateValue && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <ArrowForwardIcon fontSize="small" />
                        <span style={{ fontSize: 13, color: "#1976d2", margin: "0 4px" }}>
                          {daysBetween} day{daysBetween === 1 ? "" : "s"}
                        </span>
                        <ArrowForwardIcon fontSize="small" style={{ transform: "scaleX(-1)" }} />
                      </div>
                    )}
                    {/* Expected End Date */}
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      {editingDateField === "expectedEnd" || !expectedRentalEndDateValue ? (
                        <DatePicker
                          label="Expected End Date"
                          value={expectedRentalEndDateValue}
                          onChange={async (date) => {
                            if (!date) return;
                            try {
                              await setExpectedRentalEndDate({
                                variables: {
                                  fulfilmentId: rentalFulfilment.id,
                                  expectedRentalEndDate: date.toISOString(),
                                },
                              });
                              setEditingDateField(null);
                              refetch();
                            } catch (e) {
                              // handle error
                            }
                          }}
                          onClose={() => setEditingDateField(null)}
                          slotProps={{
                            textField: { size: "small", fullWidth: true },
                          }}
                        />
                      ) : (
                        <>
                          <span>{formatDate(expectedRentalEndDateValue)}</span>
                          <IconButton
                            size="small"
                            onClick={() => setEditingDateField("expectedEnd")}
                            aria-label="Edit expected end date"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </div>
                  </div>
                </LocalizationProvider>
              </div>
            );
          })()}
        {isSale(fulfilment) && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontWeight: 600, marginBottom: 6, color: "#222" }}>Sale Details</div>
            <div style={{ color: "#333", fontSize: 15 }}>
              Price: {fulfilment.salePrice ?? "-"}
              <br />
              Quantity: {fulfilment.quantity ?? "-"}
            </div>
          </div>
        )}
        {isService(fulfilment) && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontWeight: 600, marginBottom: 6, color: "#222" }}>Service Details</div>
            <div style={{ color: "#333", fontSize: 15 }}>
              Service Date: {fulfilment.serviceDate || "-"}
            </div>
          </div>
        )}

        {/* Sales Order Line Items */}
        {Array.isArray(fulfilment.salesOrderLineItem) &&
          fulfilment.salesOrderLineItem.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontWeight: 600, marginBottom: 6, color: "#222" }}>
                Sales Order Line Items
              </div>
              <div>
                {fulfilment.salesOrderLineItem.map((item: any, idx: number) => (
                  <div
                    key={item.id || idx}
                    style={{
                      border: "1px solid #ececec",
                      borderRadius: 8,
                      padding: "16px 20px",
                      marginBottom: 16,
                      background: "#f8fafd",
                    }}
                  >
                    <div style={{ marginBottom: 6 }}>
                      <strong>ID:</strong>{" "}
                      {item.id ? (
                        <Link
                          href={`/app/${workspace_id}/sales-order-line-items/${item.id}`}
                          style={{ color: "#1976d2", textDecoration: "underline" }}
                        >
                          {item.id}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </div>
                    <div style={{ marginBottom: 6 }}>
                      <strong>Type:</strong> {item.lineitem_type || "-"}
                    </div>
                    <div style={{ marginBottom: 6 }}>
                      <strong>Created By:</strong>{" "}
                      {item.created_by_user?.id ? (
                        <Link
                          href={`/app/${workspace_id}/users/${item.created_by_user.id}`}
                          style={{ color: "#1976d2", textDecoration: "underline" }}
                        >
                          {[item.created_by_user.firstName, item.created_by_user.lastName]
                            .filter(Boolean)
                            .join(" ")}
                        </Link>
                      ) : (
                        [item.created_by_user?.firstName, item.created_by_user?.lastName]
                          .filter(Boolean)
                          .join(" ") || "-"
                      )}
                    </div>
                    <div style={{ marginBottom: 6 }}>
                      <strong>Updated By:</strong>{" "}
                      {item.updated_by_user?.id ? (
                        <Link
                          href={`/app/${workspace_id}/users/${item.updated_by_user.id}`}
                          style={{ color: "#1976d2", textDecoration: "underline" }}
                        >
                          {[item.updated_by_user.firstName, item.updated_by_user.lastName]
                            .filter(Boolean)
                            .join(" ")}
                        </Link>
                      ) : (
                        [item.updated_by_user?.firstName, item.updated_by_user?.lastName]
                          .filter(Boolean)
                          .join(" ") || "-"
                      )}
                    </div>
                    {/* Price object */}
                    {item.price && (
                      <div style={{ marginTop: 10, paddingLeft: 10 }}>
                        <div style={{ fontWeight: 500, color: "#1976d2", marginBottom: 4 }}>
                          Price Details ({item.price.__typename})
                        </div>
                        <div style={{ marginBottom: 4 }}>
                          <strong>ID:</strong> {item.price.id}
                        </div>
                        <div style={{ marginBottom: 4 }}>
                          <strong>Name:</strong> {item.price.name}
                        </div>
                        <div style={{ marginBottom: 4 }}>
                          <strong>Product:</strong>{" "}
                          {item.price.pimProduct?.id ? (
                            <Link
                              href={`/app/${workspace_id}/products/${item.price.pimProduct.id}`}
                              style={{ color: "#1976d2", textDecoration: "underline" }}
                            >
                              {item.price.pimProduct.name}
                            </Link>
                          ) : (
                            item.price.pimProduct?.name || "-"
                          )}
                        </div>
                        <div style={{ marginBottom: 4 }}>
                          <strong>Category:</strong>{" "}
                          {item.price.pimCategory?.id ? (
                            <Link
                              href={`/app/${workspace_id}/categories/${item.price.pimCategory.id}`}
                              style={{ color: "#1976d2", textDecoration: "underline" }}
                            >
                              {item.price.pimCategory.name}
                            </Link>
                          ) : (
                            item.price.pimCategory?.name || "-"
                          )}
                          {item.price.pimCategory?.path ? ` (${item.price.pimCategory.path})` : ""}
                        </div>
                        <div style={{ marginBottom: 4 }}>
                          <strong>Price Type:</strong> {item.price.priceType || "-"}
                        </div>
                        <div style={{ marginBottom: 4 }}>
                          <strong>Price Book:</strong>{" "}
                          {item.price.priceBook?.id ? (
                            <Link
                              href={`/app/${workspace_id}/price-books/${item.price.priceBook.id}`}
                              style={{ color: "#1976d2", textDecoration: "underline" }}
                            >
                              {item.price.priceBook.name}
                            </Link>
                          ) : (
                            item.price.priceBook?.name || "-"
                          )}
                        </div>
                        {/* RentalPrice fields */}
                        {item.price.__typename === "RentalPrice" && (
                          <>
                            <div style={{ marginBottom: 4 }}>
                              <strong>Price/Day:</strong>{" "}
                              {item.price.pricePerDayInCents != null
                                ? `${item.price.pricePerDayInCents / 100} USD`
                                : "-"}
                            </div>
                            <div style={{ marginBottom: 4 }}>
                              <strong>Price/Week:</strong>{" "}
                              {item.price.pricePerWeekInCents != null
                                ? `${item.price.pricePerWeekInCents / 100} USD`
                                : "-"}
                            </div>
                            <div style={{ marginBottom: 4 }}>
                              <strong>Price/Month:</strong>{" "}
                              {item.price.pricePerMonthInCents != null
                                ? `${item.price.pricePerMonthInCents / 100} USD`
                                : "-"}
                            </div>
                          </>
                        )}
                        {/* SalePrice fields */}
                        {item.price.__typename === "SalePrice" && (
                          <>
                            <div style={{ marginBottom: 4 }}>
                              <strong>Unit Cost:</strong>{" "}
                              {item.price.unitCostInCents != null
                                ? `${item.price.unitCostInCents / 100} USD`
                                : "-"}
                            </div>
                            <div style={{ marginBottom: 4 }}>
                              <strong>Discounts:</strong>{" "}
                              {item.price.discounts != null ? String(item.price.discounts) : "-"}
                            </div>
                          </>
                        )}
                        <div style={{ marginBottom: 4 }}>
                          <strong>Created At:</strong> {item.price.createdAt}
                        </div>
                        <div style={{ marginBottom: 4 }}>
                          <strong>Updated At:</strong> {item.price.updatedAt}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Add comment box mock */}
        <div
          style={{
            marginTop: 40,
            background: "#f5f6f8",
            borderRadius: 8,
            padding: "18px 20px",
            border: "1px solid #ececec",
            maxWidth: 600,
          }}
        >
          <input
            type="text"
            placeholder="Leave a comment..."
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              fontSize: 15,
              outline: "none",
              color: "#222",
            }}
            disabled
          />
        </div>
        {/* End rental button */}
        <Box sx={{ marginTop: 4, display: "flex" }}>
          <Button
            variant="contained"
            color="primary"
            disabled={!isRental(fulfilment) || !fulfilment.rentalStartDate}
            style={{ fontWeight: 600, fontSize: 16 }}
            onClick={() => {
              setEndRentalDialogOpen(true);
              setSelectedEndDate(null);
            }}
          >
            End rental
          </Button>
          <Dialog open={endRentalDialogOpen} onClose={() => setEndRentalDialogOpen(false)}>
            <DialogTitle>Set Rental End Date</DialogTitle>
            <DialogContent>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Rental End Date"
                  value={selectedEndDate}
                  onChange={(value) => {
                    if (!value) {
                      setSelectedEndDate(null);
                    } else if (value instanceof Date) {
                      setSelectedEndDate(value);
                    } else if (typeof value === "object" && typeof value.toDate === "function") {
                      setSelectedEndDate(value.toDate());
                    } else {
                      setSelectedEndDate(null);
                    }
                  }}
                  slotProps={{
                    textField: { fullWidth: true, size: "small", sx: { mt: 2 } },
                  }}
                />
              </LocalizationProvider>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEndRentalDialogOpen(false)} color="secondary">
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!selectedEndDate) return;
                  try {
                    await setRentalEndDate({
                      variables: {
                        fulfilmentId: fulfilment.id,
                        rentalEndDate: selectedEndDate.toISOString(),
                      },
                    });
                    setEndRentalDialogOpen(false);
                    refetch();
                  } catch (e) {
                    // handle error (could show a toast/snackbar)
                  }
                }}
                color="primary"
                variant="contained"
                disabled={!selectedEndDate}
              >
                Confirm end date
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </div>
      {/* Sidebar */}
      <div
        style={{
          flex: 1,
          padding: "40px 32px",
          minWidth: 260,
          height: "100%",
        }}
      >
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontWeight: 600, color: "#222", marginBottom: 10 }}>Rental Details</div>
          <div style={{ color: "#888", fontSize: 14, marginBottom: 12 }}>
            <strong>ID:</strong>
            <div>{fulfilment.id}</div>
          </div>
          <div style={{ color: "#888", fontSize: 14, marginBottom: 12 }}>
            <strong>Contact:</strong>
            <div>
              {fulfilment.contact?.id ? (
                <Link
                  href={`/app/${workspace_id}/contacts/${fulfilment.contact.id}`}
                  style={{ color: "#1976d2", textDecoration: "underline" }}
                >
                  {fulfilment.contact.name}
                </Link>
              ) : (
                fulfilment.contact?.name || "-"
              )}
            </div>
          </div>
          <div style={{ color: "#888", fontSize: 14, marginBottom: 12 }}>
            <strong>Project:</strong>
            <div>
              {fulfilment.project?.id ? (
                <Link
                  href={`/app/${workspace_id}/projects/${fulfilment.project.id}`}
                  style={{ color: "#1976d2", textDecoration: "underline" }}
                >
                  {fulfilment.project.name}
                </Link>
              ) : (
                fulfilment.project?.name || "-"
              )}
            </div>
          </div>
          <div style={{ color: "#888", fontSize: 14, marginBottom: 12 }}>
            <strong>Sales Order:</strong>
            <div>
              {fulfilment.salesOrderId ? (
                <Link
                  href={`/app/${workspace_id}/sales-orders/${fulfilment.salesOrderId}`}
                  style={{ color: "#1976d2", textDecoration: "underline" }}
                >
                  {fulfilment.salesOrderId}
                </Link>
              ) : (
                "-"
              )}
            </div>
          </div>
          <div style={{ color: "#888", fontSize: 14, marginBottom: 12 }}>
            <strong>Created At:</strong>
            <div>
              {fulfilment.createdAt
                ? new Date(fulfilment.createdAt).toLocaleString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "-"}
            </div>
          </div>
          <div style={{ color: "#888", fontSize: 14, marginBottom: 12 }}>
            <strong>Created By:</strong>
            <div>
              {fulfilment.salesOrderLineItem?.created_by_user
                ? fulfilment.salesOrderLineItem.created_by_user.firstName +
                  " " +
                  fulfilment.salesOrderLineItem.created_by_user.lastName
                : "-"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
