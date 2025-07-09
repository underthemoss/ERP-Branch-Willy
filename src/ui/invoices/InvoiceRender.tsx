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
      amount
      status
      createdAt
      updatedAt
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
      <div style={{ textAlign: "right", fontSize: 24, fontWeight: "bold", marginTop: 32 }}>
        Total: £{invoice.amount.toFixed(2)}
      </div>
    </div>
  );
}
