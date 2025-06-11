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

// Example line items (replace with real data when available)
const exampleLineItems = [
  {
    description: "Concrete - 4000 PSI (cubic yard)",
    quantity: 30,
    unitPrice: 135.0,
    total: 4050.0,
  },
  { description: "Rebar #4 (ton)", quantity: 2, unitPrice: 900.0, total: 1800.0 },
  { description: "Formwork (sq ft)", quantity: 1200, unitPrice: 2.5, total: 3000.0 },
  { description: "Excavation (cubic yard)", quantity: 200, unitPrice: 18.0, total: 3600.0 },
  { description: "Backfill (cubic yard)", quantity: 150, unitPrice: 15.0, total: 2250.0 },
  { description: "Structural Steel (ton)", quantity: 5, unitPrice: 2200.0, total: 11000.0 },
  { description: "Masonry Block (each)", quantity: 800, unitPrice: 2.1, total: 1680.0 },
  { description: "Brick Veneer (sq ft)", quantity: 600, unitPrice: 8.0, total: 4800.0 },
  { description: "Roof Trusses (each)", quantity: 20, unitPrice: 350.0, total: 7000.0 },
  { description: "Roofing Shingles (sq ft)", quantity: 2500, unitPrice: 1.2, total: 3000.0 },
  { description: "Labor - Framing Crew (hr)", quantity: 160, unitPrice: 45.0, total: 7200.0 },
  { description: "Drywall 5/8in (sheet)", quantity: 300, unitPrice: 12.0, total: 3600.0 },
  { description: "Drywall Installation (hr)", quantity: 80, unitPrice: 40.0, total: 3200.0 },
  { description: "Paint - Interior (gallon)", quantity: 40, unitPrice: 35.0, total: 1400.0 },
  { description: "Painting Labor (hr)", quantity: 60, unitPrice: 38.0, total: 2280.0 },
  { description: "Insulation - Batt (sq ft)", quantity: 1800, unitPrice: 0.85, total: 1530.0 },
  { description: "Windows - Double Pane (each)", quantity: 18, unitPrice: 320.0, total: 5760.0 },
  { description: "Exterior Doors (each)", quantity: 6, unitPrice: 450.0, total: 2700.0 },
  { description: "Interior Doors (each)", quantity: 20, unitPrice: 180.0, total: 3600.0 },
  { description: "Flooring - Tile (sq ft)", quantity: 900, unitPrice: 4.5, total: 4050.0 },
  { description: "Flooring - Carpet (sq ft)", quantity: 1200, unitPrice: 3.2, total: 3840.0 },
  { description: "Flooring - Hardwood (sq ft)", quantity: 700, unitPrice: 7.0, total: 4900.0 },
  { description: "Plumbing - PEX Pipe (ft)", quantity: 600, unitPrice: 1.1, total: 660.0 },
  { description: "Plumbing Fixtures (set)", quantity: 8, unitPrice: 550.0, total: 4400.0 },
  { description: "Water Heater (each)", quantity: 2, unitPrice: 950.0, total: 1900.0 },
  { description: "HVAC Ductwork (ft)", quantity: 400, unitPrice: 5.0, total: 2000.0 },
  { description: "HVAC Unit (each)", quantity: 2, unitPrice: 4200.0, total: 8400.0 },
  { description: "Electrical Conduit (ft)", quantity: 700, unitPrice: 1.3, total: 910.0 },
  { description: "Electrical Wiring (ft)", quantity: 1200, unitPrice: 0.9, total: 1080.0 },
  { description: "Electrical Outlets (each)", quantity: 60, unitPrice: 18.0, total: 1080.0 },
  { description: "Light Fixtures (each)", quantity: 30, unitPrice: 75.0, total: 2250.0 },
  { description: "Switchgear Panel (each)", quantity: 2, unitPrice: 1200.0, total: 2400.0 },
  { description: "Fire Sprinkler Heads (each)", quantity: 40, unitPrice: 32.0, total: 1280.0 },
  { description: "Fire Alarm System (lump sum)", quantity: 1, unitPrice: 3500.0, total: 3500.0 },
  { description: "Site Grading (sq ft)", quantity: 5000, unitPrice: 0.6, total: 3000.0 },
  { description: "Concrete Sidewalk (sq ft)", quantity: 800, unitPrice: 4.0, total: 3200.0 },
  { description: "Asphalt Paving (sq ft)", quantity: 2000, unitPrice: 2.2, total: 4400.0 },
  { description: "Curb & Gutter (ft)", quantity: 300, unitPrice: 12.0, total: 3600.0 },
  { description: "Landscaping - Sod (sq ft)", quantity: 2500, unitPrice: 1.1, total: 2750.0 },
  { description: "Landscaping - Trees (each)", quantity: 12, unitPrice: 180.0, total: 2160.0 },
  { description: "Fencing - Chain Link (ft)", quantity: 400, unitPrice: 9.0, total: 3600.0 },
  { description: "Fencing - Wood (ft)", quantity: 300, unitPrice: 14.0, total: 4200.0 },
  { description: "Temporary Power (lump sum)", quantity: 1, unitPrice: 1200.0, total: 1200.0 },
  { description: "Portable Toilet (mo)", quantity: 4, unitPrice: 110.0, total: 440.0 },
  { description: "Dumpster Rental (mo)", quantity: 3, unitPrice: 350.0, total: 1050.0 },
  { description: "Site Security (mo)", quantity: 2, unitPrice: 800.0, total: 1600.0 },
  { description: "General Conditions (lump sum)", quantity: 1, unitPrice: 5000.0, total: 5000.0 },
  { description: "Project Management (hr)", quantity: 120, unitPrice: 65.0, total: 7800.0 },
  { description: "Permits & Fees (lump sum)", quantity: 1, unitPrice: 2500.0, total: 2500.0 },
  { description: "Final Cleaning (lump sum)", quantity: 1, unitPrice: 900.0, total: 900.0 },
];

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
    fetchPolicy: "cache-and-network",
  });

  const salesOrder = data?.getSalesOrderById;

  // Calculate totals
  const subtotal = exampleLineItems.reduce((sum, item) => sum + item.total, 0);
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
                {exampleLineItems.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.description}</td>
                    <td>{item.quantity}</td>
                    <td>{formatCurrency(item.unitPrice)}</td>
                    <td>{formatCurrency(item.total)}</td>
                  </tr>
                ))}
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
        <div className="print-footer">
          This document is generated electronically and is valid without a signature. &nbsp;|&nbsp;
          For questions, contact {seller?.name || "the seller"}. &nbsp;|&nbsp; ©{" "}
          {new Date().getFullYear()} {seller?.name || ""}
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
