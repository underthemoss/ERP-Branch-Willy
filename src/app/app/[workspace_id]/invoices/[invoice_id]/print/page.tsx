"use client";

import { graphql } from "@/graphql";
import { useInvoiceByIdQuery } from "@/graphql/hooks";
import InvoiceRender from "@/ui/invoices/InvoiceRender";
import { useParams } from "next/navigation";
import * as React from "react";

// GQL Query (same as detail page)
const InvoiceByIdQuery = graphql(`
  query InvoiceById($id: String!) {
    invoiceById(id: $id) {
      id
      amount
      status
      createdAt
      updatedAt
      buyer {
        __typename
        ... on PersonContact {
          id
          name
          email
          profilePicture
          business {
            id
            name
          }
        }
        ... on BusinessContact {
          id
          name
          website
          profilePicture
        }
      }
      seller {
        __typename
        ... on PersonContact {
          id
          name
          email
          profilePicture
          business {
            id
            name
          }
        }
        ... on BusinessContact {
          id
          name
          website
          profilePicture
        }
      }
    }
  }
`);

export default function InvoicePrintPage() {
  const { invoice_id } = useParams<{ invoice_id: string }>();

  const { data, loading, error } = useInvoiceByIdQuery({
    variables: { id: invoice_id },
    fetchPolicy: "no-cache",
  });

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: 32, color: "#888" }}>Loading invoice...</div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", marginTop: 32, color: "#c00" }}>
        Error loading invoice: {error.message}
      </div>
    );
  }

  const invoice = data?.invoiceById;

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
        }
        .print-content {
          padding: 40px;
          width: 100%;
        }
        `}
      </style>
      <div className="print-main">
        <div className="print-content">
          <InvoiceRender invoiceId={invoice_id} scale={1} />
        </div>
      </div>
    </div>
  );
}
