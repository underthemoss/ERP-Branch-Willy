"use client";

import { graphql } from "@/graphql";
import { useGetSalesOrderByIdPrintQuery } from "@/graphql/hooks";
import { useParams } from "next/navigation";
import * as React from "react";

// GQL Query (same as detail page)
const SALES_ORDER_DETAIL_QUERY = graphql(`
  query GetSalesOrderByIdPrint($id: String) {
    getSalesOrderById(id: $id) {
      id
      order_id
      purchase_order_number
      company_id
      created_at
      created_by
      updated_at
      updated_by
      buyer_id
      project_id
      buyer {
        ... on BusinessContact {
          id
          name
          address
          phone
          website
          taxId
          notes
          createdAt
          updatedAt
        }
        ... on PersonContact {
          id
          name
          email
          phone
          role
          notes
          createdAt
          updatedAt
        }
      }
      project {
        id
        name
        project_code
        description
        company {
          id
          name
        }
        created_at
        created_by
        updated_at
        updated_by
        deleted
        scope_of_work
        status
        project_contacts {
          contact_id
          relation_to_project
          contact {
            ... on BusinessContact {
              id
              name
              address
              phone
              website
              taxId
              notes
              createdAt
              updatedAt
            }
            ... on PersonContact {
              id
              name
              email
              phone
              role
              notes
              createdAt
              updatedAt
            }
          }
        }
      }
      line_items {
        __typename
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
            total_including_delivery_in_cents
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
          created_by_user {
            firstName
            lastName
          }
          updated_by_user {
            firstName
            lastName
          }
          price_id
          unit_cost_in_cents
          created_at
          updated_at
          lineitem_status
        }
      }
      created_by_user {
        id
        firstName
        lastName
        email
      }
      updated_by_user {
        id
        firstName
        lastName
        email
      }
    }
  }
`);

function formatDate(dateString?: string | null) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(amount: number) {
  return amount.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

export default function SalesOrderPrintPage() {
  const { sales_order_id } = useParams<{ sales_order_id: string }>();

  const { data, loading, error } = useGetSalesOrderByIdPrintQuery({
    variables: { id: sales_order_id },
    fetchPolicy: "no-cache",
  });

  if (loading) return <>loading</>;

  type SalesOrderType = NonNullable<typeof data>["getSalesOrderById"];
  type LineItemType = SalesOrderType extends { line_items?: (infer T)[] } ? T : any;

  const salesOrder: SalesOrderType | undefined = data?.getSalesOrderById;

  // Use real line items
  const lineItems: LineItemType[] =
    (salesOrder as SalesOrderType & { line_items?: LineItemType[] })?.line_items || [];

  // Calculate totals from real data
  function getLineItemTotal(item: any): number {
    if (!item) return 0;
    if (
      item.__typename === "RentalSalesOrderLineItem" &&
      item.calulate_price &&
      typeof item.calulate_price.total_including_delivery_in_cents === "number"
    ) {
      return item.calulate_price.total_including_delivery_in_cents / 100;
    }
    if (
      item.__typename === "SaleSalesOrderLineItem" &&
      typeof item.unit_cost_in_cents === "number" &&
      typeof item.so_quantity === "number"
    ) {
      return (item.unit_cost_in_cents * item.so_quantity) / 100;
    }
    return 0;
  }

  function getUnitPrice(item: any): number {
    if (!item) return 0;
    if (
      item.__typename === "RentalSalesOrderLineItem" &&
      typeof item.price_per_day_in_cents === "number"
    ) {
      // For print, show price per day if available
      return item.price_per_day_in_cents / 100;
    }
    if (
      item.__typename === "SaleSalesOrderLineItem" &&
      typeof item.unit_cost_in_cents === "number"
    ) {
      return item.unit_cost_in_cents / 100;
    }
    return 0;
  }

  function getDescription(item: any): string {
    if (!item) return "";
    return item.so_pim_product?.name || item.so_pim_category?.name || "—";
  }

  const subtotal = lineItems.reduce(
    (sum: number, item: LineItemType) => sum + getLineItemTotal(item),
    0,
  );
  const tax = subtotal * 0.08; // Example 8% tax
  const total = subtotal + tax;

  // Seller info (project.company)
  const seller =
    salesOrder?.project?.company && typeof salesOrder.project.company === "object"
      ? salesOrder.project.company
      : null;

  // Buyer info
  const buyer = salesOrder?.buyer;

  return (
    <div>
      <style>
        {`
        html, body {
          margin: 0;
          padding: 0;
          background: #fff;
          color: #222;
          font-family: 'Segoe UI', Arial, sans-serif;
        }
        .print-main {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 9999;
          background: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          overflow-y: auto;
        }
        .print-content {
          max-width: 794px;
          width: 100%;
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact;
          }
          .print-main {
            position: static !important;
            width: 100vw !important;
            min-height: 100vh !important;
            height: auto !important;
            z-index: 9999 !important;
            background: #fff !important;
            display: block !important;
            overflow: visible !important;
          }
          .print-content {
            max-width: 794px !important;
            width: 100% !important;
            margin: 0 auto !important;
          }
          .print-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            width: 100vw;
            font-size: 0.95rem;
            color: #666;
            text-align: center;
            padding: 8px 0;
            background: #fff;
            border-top: 1px solid #bbb;
          }
        }
        .so-section {
          margin-bottom: 24px;
        }
        .so-section-title {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 6px;
          border-bottom: 1px solid #eee;
          padding-bottom: 2px;
        }
        .so-info-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
        }
        .so-info-table td {
          padding: 2px 8px 2px 0;
          vertical-align: top;
        }
        .so-line-items {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
        }
        .so-line-items th, .so-line-items td {
          border: 1px solid #bbb;
          padding: 8px;
          text-align: left;
        }
        .so-line-items th {
          background: #f5f5f5;
        }
        .so-totals {
          float: right;
          margin-top: 8px;
          margin-bottom: 32px;
        }
        .so-totals-table {
          border-collapse: collapse;
        }
        .so-totals-table td {
          padding: 4px 12px 4px 0;
        }
        .print-footer {
          display: block;
          width: 100vw;
          font-size: 0.95rem;
          color: #666;
          text-align: center;
          padding: 8px 0;
          background: #fff;
          border-top: 1px solid #bbb;
          position: fixed;
          bottom: 0;
          left: 0;
        }
        `}
      </style>
      <div className="print-main">
        <div className="print-content">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 32,
            }}
          >
            <div>
              <b>Date:</b>{" "}
              {new Date().toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
            <div>
              <b>Order #:</b> {salesOrder?.order_id || "—"}
            </div>
            <div>
              <b>Purchase Order:</b> {salesOrder?.purchase_order_number || "—"}
            </div>
          </div>
          <div className="so-section" style={{ display: "flex", gap: 32 }}>
            <div style={{ flex: 1 }}>
              <div className="so-section-title">Seller</div>
              <table className="so-info-table">
                <tbody>
                  <tr>
                    <td>
                      <b>Name:</b>
                    </td>
                    <td>{seller?.name || "—"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{ flex: 1 }}>
              <div className="so-section-title">Buyer</div>
              <table className="so-info-table">
                <tbody>
                  <tr>
                    <td>
                      <b>Name:</b>
                    </td>
                    <td>{buyer?.name || "—"}</td>
                  </tr>
                  {buyer?.__typename === "PersonContact" && buyer.email && (
                    <tr>
                      <td>
                        <b>Email:</b>
                      </td>
                      <td>{buyer.email}</td>
                    </tr>
                  )}
                  {buyer?.phone && (
                    <tr>
                      <td>
                        <b>Phone:</b>
                      </td>
                      <td>{buyer.phone}</td>
                    </tr>
                  )}
                  {buyer?.__typename === "BusinessContact" && buyer.address && (
                    <tr>
                      <td>
                        <b>Address:</b>
                      </td>
                      <td>{buyer.address}</td>
                    </tr>
                  )}
                  {buyer?.__typename === "BusinessContact" && buyer.website && (
                    <tr>
                      <td>
                        <b>Website:</b>
                      </td>
                      <td>{buyer.website}</td>
                    </tr>
                  )}
                  {buyer?.__typename === "BusinessContact" && buyer.taxId && (
                    <tr>
                      <td>
                        <b>Tax ID:</b>
                      </td>
                      <td>{buyer.taxId}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="so-section">
            <div className="so-section-title">Project</div>
            <table className="so-info-table">
              <tbody>
                <tr>
                  <td>
                    <b>Name:</b>
                  </td>
                  <td>{salesOrder?.project?.name || "—"}</td>
                </tr>
                <tr>
                  <td>
                    <b>Code:</b>
                  </td>
                  <td>{salesOrder?.project?.project_code || "—"}</td>
                </tr>
                <tr>
                  <td>
                    <b>Description:</b>
                  </td>
                  <td>{salesOrder?.project?.description || "—"}</td>
                </tr>
                <tr>
                  <td>
                    <b>Status:</b>
                  </td>
                  <td>{salesOrder?.project?.status || "—"}</td>
                </tr>
                <tr>
                  <td>
                    <b>Scope of Work:</b>
                  </td>
                  <td>
                    {Array.isArray(salesOrder?.project?.scope_of_work)
                      ? salesOrder.project.scope_of_work.join(", ")
                      : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="so-section">
            <div className="so-section-title">Order Items</div>
            <table className="so-line-items">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", color: "#888" }}>
                      No order items
                    </td>
                  </tr>
                ) : (
                  lineItems.map((item: any, idx: number) => (
                    <tr key={item.id || idx}>
                      <td>{getDescription(item)}</td>
                      <td>{item.so_quantity ?? "—"}</td>
                      <td>{formatCurrency(getUnitPrice(item))}</td>
                      <td>{formatCurrency(getLineItemTotal(item))}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="so-totals">
            <table className="so-totals-table">
              <tbody>
                <tr>
                  <td>
                    <b>Subtotal:</b>
                  </td>
                  <td>{formatCurrency(subtotal)}</td>
                </tr>
                <tr>
                  <td>
                    <b>Tax (8%):</b>
                  </td>
                  <td>{formatCurrency(tax)}</td>
                </tr>
                <tr>
                  <td>
                    <b>Total:</b>
                  </td>
                  <td>{formatCurrency(total)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style={{ clear: "both" }} />
          <div style={{ height: "60px" }} /> {/* Spacer for footer */}
        </div>
      </div>
      {loading && (
        <div style={{ textAlign: "center", marginTop: 32, color: "#888" }}>
          Loading sales order...
        </div>
      )}
      {error && (
        <div style={{ textAlign: "center", marginTop: 32, color: "#c00" }}>
          Error loading sales order: {error.message}
        </div>
      )}
    </div>
  );
}
