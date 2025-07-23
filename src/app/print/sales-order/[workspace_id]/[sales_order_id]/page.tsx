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
      pricing {
        sub_total_in_cents
        total_in_cents
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
          price {
            ... on RentalPrice {
              pricePerDayInCents
              pricePerWeekInCents
              pricePerMonthInCents
            }
          }
          delivery_location
          delivery_date
          delivery_method
          delivery_charge_in_cents
          off_rent_date
          created_at
          updated_at
          lineitem_status
          totalDaysOnRent
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
          price {
            ... on SalePrice {
              unitCostInCents
            }
          }
          delivery_charge_in_cents
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

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

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
      item.price?.__typename === "SalePrice" &&
      typeof item.price.unitCostInCents === "number" &&
      typeof item.so_quantity === "number"
    ) {
      const itemTotal = (item.price.unitCostInCents * item.so_quantity) / 100;
      const deliveryCharge = (item.delivery_charge_in_cents ?? 0) / 100;
      return itemTotal + deliveryCharge;
    }
    return 0;
  }

  function getUnitPrice(item: any): number {
    if (!item) return 0;
    if (
      item.__typename === "RentalSalesOrderLineItem" &&
      item.price?.__typename === "RentalPrice" &&
      typeof item.price.pricePerDayInCents === "number"
    ) {
      // For print, show price per day if available
      return item.price.pricePerDayInCents / 100;
    }
    if (
      item.__typename === "SaleSalesOrderLineItem" &&
      item.price?.__typename === "SalePrice" &&
      typeof item.price.unitCostInCents === "number"
    ) {
      return item.price.unitCostInCents / 100;
    }
    return 0;
  }

  function getDescription(item: any): string {
    if (!item) return "";
    return item.so_pim_product?.name || item.so_pim_category?.name || "—";
  }

  function getRateDetails(item: any): string {
    if (!item || item.__typename !== "RentalSalesOrderLineItem") return "";

    const price = item.price;
    if (!price || price.__typename !== "RentalPrice") return "";

    const rates = [];
    if (price.pricePerDayInCents) {
      rates.push(`${formatCurrency(price.pricePerDayInCents / 100)}/day`);
    }
    if (price.pricePerWeekInCents) {
      rates.push(`${formatCurrency(price.pricePerWeekInCents / 100)}/week`);
    }
    if (price.pricePerMonthInCents) {
      rates.push(`${formatCurrency(price.pricePerMonthInCents / 100)}/month`);
    }

    return rates.length > 0 ? rates.join(", ") : "";
  }

  const pricing = salesOrder?.pricing;
  const subtotal = (pricing?.sub_total_in_cents ?? 0) / 100;
  const total = (pricing?.total_in_cents ?? 0) / 100;

  // Seller info (project.company)
  const seller =
    salesOrder?.project?.company && typeof salesOrder.project.company === "object"
      ? salesOrder.project.company
      : null;

  // Buyer info
  const buyer = salesOrder?.buyer;

  if (error) {
    return (
      <div style={{ padding: 20, color: "#c00" }}>Error loading sales order: {error.message}</div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @page {
          size: letter;
          margin: 0.5in;
        }

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 14px;
          line-height: 1.5;
          color: #000;
          background: #fff;
          height: auto;
          overflow: visible;
        }

        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            height: auto;
            overflow: visible;
          }
        }

        .print-container {
          width: 100%;
          max-width: 8.5in;
          margin: 0 auto;
          padding: 20px;
          background: white;
          min-height: auto;
          overflow: visible;
        }

        @media print {
          .print-container {
            max-width: 100%;
            padding: 0;
            height: auto;
            overflow: visible;
          }
        }

        .page-break {
          page-break-before: always;
          break-before: page;
        }

        .avoid-break {
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .allow-break {
          page-break-inside: auto;
          break-inside: auto;
        }

        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 120px;
          font-weight: bold;
          color: rgba(0, 0, 0, 0.1);
          z-index: -1;
          user-select: none;
          pointer-events: none;
        }

        @media print {
          .watermark {
            display: none; /* Hide watermark for cleaner printing */
          }
        }

        h1 {
          font-size: 24px;
          margin: 0 0 20px 0;
        }

        h2 {
          font-size: 18px;
          margin: 20px 0 10px 0;
          padding-bottom: 5px;
          border-bottom: 1px solid #ddd;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          page-break-inside: auto;
        }

        th,
        td {
          text-align: left;
          padding: 8px;
          border: 1px solid #ddd;
        }

        th {
          background-color: #f5f5f5;
          font-weight: bold;
        }

        tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }

        thead {
          display: table-header-group;
        }

        tbody {
          display: table-row-group;
        }

        tfoot {
          display: table-footer-group;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 30px;
        }

        .info-section {
          margin-bottom: 20px;
        }

        .info-row {
          display: flex;
          margin-bottom: 5px;
        }

        .info-label {
          font-weight: bold;
          margin-right: 10px;
          min-width: 100px;
        }

        .header-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #333;
        }

        .totals {
          margin-top: 30px;
          display: flex;
          justify-content: flex-end;
        }

        .totals-table {
          width: 300px;
        }

        .totals-table td {
          border: none;
          padding: 5px 10px;
        }

        .totals-table td:first-child {
          text-align: right;
          font-weight: bold;
        }

        .totals-table tr:last-child {
          border-top: 2px solid #333;
          font-size: 16px;
          font-weight: bold;
        }

        @media print {
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="print-container">
        <div className="watermark">SAMPLE</div>
        <h1>Sales Order</h1>

        <div className="header-info">
          <div>
            <strong>Date:</strong> {formatDate(new Date().toISOString())}
          </div>
          <div>
            <strong>Order #:</strong> {salesOrder?.order_id || "—"}
          </div>
          <div>
            <strong>PO #:</strong> {salesOrder?.purchase_order_number || "—"}
          </div>
        </div>

        <div className="info-grid avoid-break">
          <div className="info-section">
            <h2>Seller</h2>
            <div className="info-row">
              <span className="info-label">Name:</span>
              <span>{seller?.name || "—"}</span>
            </div>
          </div>

          <div className="info-section">
            <h2>Buyer</h2>
            <div className="info-row">
              <span className="info-label">Name:</span>
              <span>{buyer?.name || "—"}</span>
            </div>
            {buyer?.__typename === "PersonContact" && buyer.email && (
              <div className="info-row">
                <span className="info-label">Email:</span>
                <span>{buyer.email}</span>
              </div>
            )}
            {buyer?.phone && (
              <div className="info-row">
                <span className="info-label">Phone:</span>
                <span>{buyer.phone}</span>
              </div>
            )}
            {buyer?.__typename === "BusinessContact" && buyer.address && (
              <div className="info-row">
                <span className="info-label">Address:</span>
                <span>{buyer.address}</span>
              </div>
            )}
            {buyer?.__typename === "BusinessContact" && buyer.website && (
              <div className="info-row">
                <span className="info-label">Website:</span>
                <span>{buyer.website}</span>
              </div>
            )}
            {buyer?.__typename === "BusinessContact" && buyer.taxId && (
              <div className="info-row">
                <span className="info-label">Tax ID:</span>
                <span>{buyer.taxId}</span>
              </div>
            )}
          </div>
        </div>

        <div className="info-section avoid-break">
          <h2>Project</h2>
          <div className="info-row">
            <span className="info-label">Name:</span>
            <span>{salesOrder?.project?.name || "—"}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Code:</span>
            <span>{salesOrder?.project?.project_code || "—"}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Description:</span>
            <span>{salesOrder?.project?.description || "—"}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Status:</span>
            <span>{salesOrder?.project?.status || "—"}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Scope:</span>
            <span>
              {Array.isArray(salesOrder?.project?.scope_of_work)
                ? salesOrder.project.scope_of_work.join(", ")
                : "—"}
            </span>
          </div>
        </div>

        {/* Sales Items Section */}
        {lineItems.filter((item: any) => item.__typename === "SaleSalesOrderLineItem").length >
          0 && (
          <div className="info-section allow-break">
            <h2>Sales Items</h2>
            <table className="allow-break">
              <thead>
                <tr>
                  <th>Description</th>
                  <th style={{ width: "80px" }}>Qty</th>
                  <th style={{ width: "120px" }}>Unit Price</th>
                  <th style={{ width: "120px" }}>Delivery Charge</th>
                  <th style={{ width: "120px" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {lineItems
                  .filter((item: any) => item.__typename === "SaleSalesOrderLineItem")
                  .map((item: any, idx: number) => (
                    <tr key={item.id || idx}>
                      <td>{getDescription(item)}</td>
                      <td>{item.so_quantity ?? "—"}</td>
                      <td>{formatCurrency(getUnitPrice(item))}</td>
                      <td>{formatCurrency((item.delivery_charge_in_cents ?? 0) / 100)}</td>
                      <td>{formatCurrency(getLineItemTotal(item))}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Rental Items Section */}
        {lineItems.filter((item: any) => item.__typename === "RentalSalesOrderLineItem").length >
          0 && (
          <div className="info-section allow-break">
            <h2>Rental Items</h2>
            <table className="allow-break">
              <thead>
                <tr>
                  <th>Description</th>
                  <th style={{ width: "100px" }}>Start Date</th>
                  <th style={{ width: "100px" }}>End Date</th>
                  <th style={{ width: "80px" }}>Total Days</th>
                  <th style={{ width: "120px" }}>Delivery Charge</th>
                  <th style={{ width: "120px" }}>Total Price</th>
                </tr>
              </thead>
              <tbody>
                {lineItems
                  .filter((item: any) => item.__typename === "RentalSalesOrderLineItem")
                  .map((item: any, idx: number) => (
                    <tr key={item.id || idx}>
                      <td>
                        <div>{getDescription(item)}</div>
                        <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                          {getRateDetails(item)}
                        </div>
                      </td>
                      <td>{formatDate(item.delivery_date)}</td>
                      <td>{formatDate(item.off_rent_date)}</td>
                      <td>{item.totalDaysOnRent ?? "—"}</td>
                      <td>{formatCurrency((item.delivery_charge_in_cents ?? 0) / 100)}</td>
                      <td>{formatCurrency(getLineItemTotal(item))}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Show message if no items */}
        {lineItems.length === 0 && (
          <div className="info-section allow-break">
            <h2>Order Items</h2>
            <table className="allow-break">
              <tbody>
                <tr>
                  <td style={{ textAlign: "center", color: "#888", padding: "20px" }}>
                    No order items
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <div className="totals avoid-break">
          <table className="totals-table">
            <tbody>
              <tr>
                <td>Subtotal:</td>
                <td>{formatCurrency(subtotal)}</td>
              </tr>
              <tr>
                <td>Total:</td>
                <td>{formatCurrency(total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
