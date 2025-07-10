"use client";

import { graphql } from "@/graphql";
import { useInvoiceByIdInvoiceRendererQuery } from "@/graphql/hooks";

type InvoiceRenderProps = {
  invoiceId: string;
  scale?: number;
};

const invoiceQuery = graphql(`
  query InvoiceByIdInvoiceRenderer($id: String!) {
    invoiceById(id: $id) {
      id
      subTotalInCents
      taxesInCents
      finalSumInCents
      status
      createdAt
      updatedAt
      invoicePaidDate
      lineItems {
        chargeId
        description
        totalInCents
      }
      buyer {
        ... on BusinessContact {
          id
          name
          address
          phone
        }
        ... on PersonContact {
          id
          name
          phone
        }
      }
      seller {
        ... on BusinessContact {
          id
          name
          address
          phone
        }
        ... on PersonContact {
          id
          name
          phone
        }
      }
    }
  }
`);

function formatDate(date: string | null | undefined) {
  if (!date) return "";
  return new Date(date).toLocaleDateString();
}

export default function InvoiceRender({ invoiceId, scale = 1 }: InvoiceRenderProps) {
  const { data, loading, error } = useInvoiceByIdInvoiceRendererQuery({
    variables: { id: invoiceId },
    fetchPolicy: "cache-and-network",
  });

  if (loading) return <div>Loading invoice…</div>;
  if (error) return <div>Error loading invoice.</div>;
  const invoice = data?.invoiceById;
  if (!invoice) return <div>Invoice not found.</div>;

  return (
    <div
      style={{
        marginLeft: -30,
        marginRight: -30,
        padding: 0,
        fontFamily: "serif",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      }}
    >
      {invoice.status === "PAID" && (
        <div
          style={{
            background: "#e6ffed",
            color: "#1a7f37",
            border: "1px solid #b7ebc6",
            borderRadius: 6,
            padding: "18px 24px",
            marginBottom: 32,
            fontSize: "1.15rem",
            fontWeight: 500,
            textAlign: "center",
          }}
        >
          <div>
            <strong>Payment Received</strong>
          </div>
          <div>
            Thank you! Payment for this invoice was received on{" "}
            <strong>{formatDate(invoice.invoicePaidDate)}</strong>.
          </div>
          <div>
            This document serves as a <strong>receipt of payment</strong> for your records.
          </div>
        </div>
      )}
      <h1 style={{ textAlign: "center", marginBottom: 8 }}>Invoice</h1>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <strong>Invoice ID:</strong> {invoice.id}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16 }}>Seller</h2>
          <div>{invoice.seller?.name}</div>
          {invoice.seller?.__typename === "BusinessContact" && <div>{invoice.seller.address}</div>}
          {invoice.seller?.phone && <div>{invoice.seller.phone}</div>}
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 16 }}>Buyer</h2>
          <div>{invoice.buyer?.name}</div>
          {invoice.buyer?.__typename === "BusinessContact" && invoice.buyer.address && (
            <div>{invoice.buyer.address}</div>
          )}
          {invoice.buyer?.phone && <div>{invoice.buyer.phone}</div>}
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <strong>Status:</strong> {invoice.status}
      </div>
      <div style={{ marginBottom: 16 }}>
        <strong>Created:</strong> {formatDate(invoice.createdAt)}
      </div>
      <div style={{ marginBottom: 16 }}>
        <strong>Last Updated:</strong> {formatDate(invoice.updatedAt)}
      </div>
      {invoice.lineItems && invoice.lineItems.length > 0 && (
        <div style={{ marginTop: 32, marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Line Items</h2>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginBottom: 16,
              fontSize: 16,
            }}
          >
            <thead>
              <tr>
                <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: 8 }}>
                  Description
                </th>
                <th style={{ borderBottom: "1px solid #ccc", textAlign: "right", padding: 8 }}>
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((item) => (
                <tr key={item.chargeId}>
                  <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{item.description}</td>
                  <td style={{ borderBottom: "1px solid #eee", textAlign: "right", padding: 8 }}>
                    £{(item.totalInCents / 100).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ textAlign: "right", marginTop: 24 }}>
            <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 4 }}>
              Subtotal: £{(invoice.subTotalInCents / 100).toFixed(2)}
            </div>
            <div style={{ fontSize: 16, marginBottom: 4 }}>
              Taxes:{" "}
              <span style={{ color: "#888" }}>£{(invoice.taxesInCents / 100).toFixed(2)}</span>
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: "bold",
                marginTop: 8,
                borderTop: "2px solid #222",
                paddingTop: 8,
              }}
            >
              Total: £{(invoice.finalSumInCents / 100).toFixed(2)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
