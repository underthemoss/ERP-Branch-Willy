import { FragmentType, graphql, makeFragmentData, useFragment } from "@/graphql";
import { useUpdateFulfilmentAssigneeMutation } from "@/graphql/hooks";
import { RentalFulfilment } from "@/ui/fulfilment/api";
import UserPicker from "@/ui/UserPicker";
import { Typography } from "@mui/material";
import Link from "next/link";
import { useParams } from "next/navigation";
import React from "react";
import {
  RentalFulfilmentFields,
  RentalFulfilmentPrice,
  SaleFulfilmentPrice,
  useGetFulfilmentByIdQuery,
} from "./api";
import RentalFulfillmentDetails from "./RentalFulfillmentDetails";
import SaleFulfillmentDetails from "./SaleFulfillmentDetails";
import ServiceFulfillmentDetails from "./ServiceFulfillmentDetails";

export type FulfillmentDetailsProps = {
  fulfillmentId: string;
};

/* Removed mockFulfillment, now using real data from GraphQL */

graphql(`
  mutation updateFulfilmentAssignee($assignedToId: ID, $fulfilmentId: ID!) {
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

  // Type guards for union types
  const isRental = (f: any): f is { rentalStartDate?: string; rentalEndDate?: string } =>
    f.__typename === "RentalFulfilment";
  const isSale = (f: any): f is { salePrice?: number; quantity?: number } =>
    f.__typename === "SaleFulfilment";
  const isService = (f: any): f is { serviceDate?: string } => f.__typename === "ServiceFulfilment";

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
        {isRental(fulfilment) && (
          <RentalFulfillmentDetails
            fulfilment={makeFragmentData(fulfilment as RentalFulfilment, RentalFulfilmentFields)}
          />
        )}
        {isSale(fulfilment) && <SaleFulfillmentDetails fulfilment={fulfilment} price={price} />}
        {isService(fulfilment) && (
          <ServiceFulfillmentDetails fulfilment={fulfilment} price={price} />
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
              // Allow unassign (null), or change to a new user
              if (newUserId === fulfilment.assignedTo?.id) return;
              await updateAssignee({
                variables: {
                  assignedToId: newUserId ?? null,
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
