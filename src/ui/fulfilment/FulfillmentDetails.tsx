import { graphql } from "@/graphql";
import { useUpdateFulfilmentAssigneeMutation } from "@/graphql/hooks";
import UserPicker from "@/ui/UserPicker";
import { Typography } from "@mui/material";
import Link from "next/link";
import { useParams } from "next/navigation";
import React from "react";
import { RentalFulfilmentPrice, SaleFulfilmentPrice, useGetFulfilmentByIdQuery } from "./api";

export type FulfillmentDetailsProps = {
  fulfillmentId: string;
};

/* Removed mockFulfillment, now using real data from GraphQL */

graphql(`
  mutation updateFulfilmentAssignee($assignedToId: ID!, $fulfilmentId: ID!) {
    updateFulfilmentAssignee(assignedToId: $assignedToId, fulfilmentId: $fulfilmentId) {
      id
      assignedTo {
        id
        firstName
        lastName
        email
      }
    }
  }
`);

export function FulfillmentDetails({ fulfillmentId }: FulfillmentDetailsProps) {
  const { workspace_id } = useParams<{ workspace_id: string }>();
  const { data, loading, error, refetch } = useGetFulfilmentByIdQuery({
    variables: { id: fulfillmentId },
  });
  const fulfilment = data?.getFulfilmentById;

  const [updateAssignee, { loading: updatingAssignee }] = useUpdateFulfilmentAssigneeMutation();

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

        <div style={{ marginBottom: 32 }}>
          <div style={{ fontWeight: 600, marginBottom: 6, color: "#222" }}>Order Info</div>
          <div style={{ color: "#333", fontSize: 15 }}>
            <div>Sales Order Type: {fulfilment.salesOrderType || "-"}</div>
            <div>
              Workflow ID:{" "}
              {fulfilment.workflowId ? (
                <Link
                  href={`/app/${workspace_id}/workflows/${fulfilment.workflowId}`}
                  style={{ color: "#1976d2", textDecoration: "underline" }}
                >
                  {fulfilment.workflowId}
                </Link>
              ) : (
                "-"
              )}
            </div>
            <div>Workflow Column ID: {fulfilment.workflowColumnId || "-"}</div>
          </div>
        </div>
        {/* Type-specific fields */}
        {isRental(fulfilment) && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontWeight: 600, marginBottom: 6, color: "#222" }}>Rental Details</div>
            <div style={{ color: "#333", fontSize: 15 }}>
              Start: {fulfilment.rentalStartDate || "-"}
              <br />
              End: {fulfilment.rentalEndDate || "-"}
            </div>
          </div>
        )}
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
        <div style={{ marginBottom: 24 }}>
          <UserPicker
            userId={fulfilment.assignedTo?.id}
            onChange={async (newUserId) => {
              if (!newUserId || newUserId === fulfilment.assignedTo?.id) return;
              await updateAssignee({
                variables: {
                  assignedToId: newUserId,
                  fulfilmentId: fulfilment.id,
                },
              });
              await refetch();
            }}
            disabled={updatingAssignee}
            label="Assigned to"
            placeholder="Search users..."
          />
        </div>
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
