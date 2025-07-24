"use client";

import { graphql } from "@/graphql";
import { useInvoiceByIdInvoiceRendererQuery } from "@/graphql/hooks";
import { addDays } from "date-fns";

type InvoiceRenderProps = {
  invoiceId: string;
  scale?: number;
};

type GroupedCharges = {
  [projectId: string]: {
    project: {
      id: string;
      name: string;
      project_code: string | null;
    };
    chargeTypes: {
      [chargeType: string]: Array<{
        chargeId: string;
        description: string;
        totalInCents: number;
        charge: any;
      }>;
    };
  };
};

const invoiceQuery = graphql(`
  query InvoiceByIdInvoiceRenderer($id: String!) {
    invoiceById(id: $id) {
      id
      subTotalInCents
      taxesInCents
      totalTaxesInCents
      finalSumInCents
      status
      createdAt
      updatedAt
      invoicePaidDate
      taxPercent
      taxLineItems {
        id
        description
        type
        value
        order
        calculatedAmountInCents
      }
      lineItems {
        chargeId
        description
        totalInCents
        charge {
          id
          amountInCents
          description
          chargeType
          projectId
          project {
            id
            name
            project_code
          }
          salesOrderId
          purchaseOrderNumber
          billingPeriodStart
          billingPeriodEnd
        }
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
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateRange(start: string | null | undefined, end: string | null | undefined) {
  if (!start || !end) return "";

  const startDate = new Date(start);
  const endDate = new Date(end);

  const formattedStart = startDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // If start and end dates are the same, just show one date
  if (startDate.getTime() === endDate.getTime()) {
    return formattedStart;
  }

  const formattedEnd = endDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `${formattedStart} - ${formattedEnd}`;
}

function groupChargesByProjectAndType(lineItems: any[]): GroupedCharges {
  const grouped: GroupedCharges = {};

  lineItems.forEach((item) => {
    const projectId = item.charge?.projectId || "no-project";
    const chargeType = item.charge?.chargeType || "Other";

    if (!grouped[projectId]) {
      grouped[projectId] = {
        project: item.charge?.project || { id: projectId, name: "No Project", project_code: null },
        chargeTypes: {},
      };
    }

    if (!grouped[projectId].chargeTypes[chargeType]) {
      grouped[projectId].chargeTypes[chargeType] = [];
    }

    grouped[projectId].chargeTypes[chargeType].push(item);
  });

  return grouped;
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

  const groupedCharges = invoice.lineItems ? groupChargesByProjectAndType(invoice.lineItems) : {};

  return (
    <>
      <style jsx global>{`
        @media print {
          body {
            margin: 0 !important;
            padding: 0 !important;
          }

          .invoice-container {
            margin: 0 !important;
            padding: 10px !important;
            transform: none !important;
            width: 100% !important;
            max-width: 100% !important;
          }

          .invoice-title {
            font-size: 1.4rem !important;
          }

          .invoice-status {
            font-size: 0.75rem !important;
          }

          .section-header {
            font-size: 0.7rem !important;
          }

          .company-name {
            font-size: 0.8rem !important;
          }

          .contact-details {
            font-size: 0.65rem !important;
          }

          .invoice-number {
            font-size: 0.8rem !important;
          }

          .invoice-dates {
            font-size: 0.65rem !important;
          }

          .table-header {
            font-size: 0.65rem !important;
            padding: 4px 6px !important;
          }

          .table-cell {
            font-size: 0.7rem !important;
            padding: 6px 4px !important;
          }

          .project-header {
            font-size: 0.75rem !important;
            padding: 4px 6px !important;
          }

          .description-cell {
            max-width: none !important;
            word-break: break-word !important;
          }

          .date-cell {
            white-space: normal !important;
            max-width: 120px !important;
          }

          .summary-section {
            margin-top: 15px !important;
            padding: 15px !important;
          }

          .summary-text {
            font-size: 0.75rem !important;
          }

          .total-due {
            font-size: 0.9rem !important;
          }
        }
      `}</style>
      <div
        className="invoice-container"
        style={{
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          backgroundColor: "#ffffff",
          color: "#333333",
          lineHeight: 1.6,
          width: "100%",
        }}
      >
        <div style={{ marginBottom: 40 }}>
          <h1
            className="invoice-title"
            style={{
              textAlign: "center",
              marginBottom: 12,
              fontSize: "2.8rem",
              fontWeight: 300,
              letterSpacing: "1px",
              color: "#1a1a1a",
            }}
          >
            INVOICE
          </h1>
          <div
            className="invoice-status"
            style={{
              textAlign: "center",
              fontSize: "1.2rem",
              fontWeight: 600,
              color:
                invoice.status === "PAID"
                  ? "#2e7d32"
                  : invoice.status === "DRAFT"
                    ? "#ed6c02"
                    : "#333",
            }}
          >
            {invoice.status}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "30px",
            marginBottom: 50,
            paddingBottom: 40,
          }}
        >
          <div style={{ flex: 1 }}>
            <h2
              className="section-header"
              style={{
                margin: "0 0 16px 0",
                fontSize: "1.2rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                color: "#666",
              }}
            >
              From
            </h2>
            <div
              className="company-name"
              style={{ fontSize: "1.3rem", fontWeight: 600, marginBottom: 8 }}
            >
              {invoice.seller?.name}
            </div>
            {invoice.seller?.__typename === "BusinessContact" && invoice.seller.address && (
              <div
                className="contact-details"
                style={{ fontSize: "1.05rem", color: "#666", marginBottom: 4 }}
              >
                {invoice.seller.address}
              </div>
            )}
            {invoice.seller?.phone && (
              <div className="contact-details" style={{ fontSize: "1.05rem", color: "#666" }}>
                {invoice.seller.phone}
              </div>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <h2
              className="section-header"
              style={{
                margin: "0 0 16px 0",
                fontSize: "1.2rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                color: "#666",
              }}
            >
              Bill To
            </h2>
            <div
              className="company-name"
              style={{ fontSize: "1.3rem", fontWeight: 600, marginBottom: 8 }}
            >
              {invoice.buyer?.name}
            </div>
            {invoice.buyer?.__typename === "BusinessContact" && invoice.buyer.address && (
              <div
                className="contact-details"
                style={{ fontSize: "1.05rem", color: "#666", marginBottom: 4 }}
              >
                {invoice.buyer.address}
              </div>
            )}
            {invoice.buyer?.phone && (
              <div className="contact-details" style={{ fontSize: "1.05rem", color: "#666" }}>
                {invoice.buyer.phone}
              </div>
            )}
          </div>

          <div style={{ flex: 1, textAlign: "right" }}>
            <h2
              className="section-header"
              style={{
                margin: "0 0 16px 0",
                fontSize: "1.2rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                color: "#666",
              }}
            >
              Invoice
            </h2>
            <div
              className="invoice-number"
              style={{ fontSize: "1.3rem", fontWeight: 600, marginBottom: 8 }}
            >
              {invoice.id}
            </div>
            <div
              className="invoice-dates"
              style={{ fontSize: "1.05rem", color: "#666", marginBottom: 4 }}
            >
              Date Issued: {formatDate(invoice.createdAt)}
            </div>
            <div
              className="invoice-dates"
              style={{ fontSize: "1.05rem", color: "#666", marginBottom: 4 }}
            >
              Due Date:{" "}
              {formatDate(
                invoice.createdAt
                  ? addDays(new Date(invoice.createdAt), 30).toISOString()
                  : undefined,
              )}
            </div>
          </div>
        </div>
        {invoice.lineItems && invoice.lineItems.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <div
              style={{
                border: "1px solid #e0e0e0",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "1.05rem",
                  tableLayout: "auto",
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: "#fafafa" }}>
                    <th
                      className="table-header"
                      style={{
                        padding: "16px 24px",
                        textAlign: "left",
                        fontWeight: 600,
                        fontSize: "0.95rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.8px",
                        color: "#666",
                        borderBottom: "2px solid #e0e0e0",
                        width: "auto",
                      }}
                    >
                      Description
                    </th>
                    <th
                      className="table-header"
                      style={{
                        padding: "16px 24px",
                        textAlign: "left",
                        fontWeight: 600,
                        fontSize: "0.95rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.8px",
                        color: "#666",
                        borderBottom: "2px solid #e0e0e0",
                        whiteSpace: "nowrap",
                        width: "auto",
                      }}
                    >
                      Date
                    </th>
                    <th
                      className="table-header"
                      style={{
                        padding: "16px 24px",
                        textAlign: "right",
                        fontWeight: 600,
                        fontSize: "0.95rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.8px",
                        color: "#666",
                        borderBottom: "2px solid #e0e0e0",
                        whiteSpace: "nowrap",
                        width: "90px",
                      }}
                    >
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(groupedCharges).map(([projectId, projectData], projectIndex) => (
                    <>
                      <tr key={`project-${projectId}`}>
                        <td
                          colSpan={3}
                          className="project-header"
                          style={{
                            backgroundColor: "#f5f5f5",
                            padding: "16px 24px",
                            borderBottom: "1px solid #e0e0e0",
                            fontWeight: 600,
                            fontSize: "1.15rem",
                            color: "#333",
                          }}
                        >
                          Project: {projectData.project.name}
                          {projectData.project.project_code && (
                            <span
                              style={{
                                fontSize: "0.9rem",
                                color: "#666",
                                fontWeight: 400,
                                marginLeft: 10,
                              }}
                            >
                              (Code: {projectData.project.project_code})
                            </span>
                          )}
                        </td>
                      </tr>
                      {Object.entries(projectData.chargeTypes).map(([chargeType, charges]) =>
                        charges.map((item, index) => (
                          <tr key={item.chargeId}>
                            <td
                              className="table-cell description-cell"
                              style={{
                                padding: "20px 24px",
                                borderBottom: "1px solid #f0f0f0",
                                verticalAlign: "top",
                                width: "auto",
                              }}
                            >
                              <div style={{ fontWeight: 500 }}>{item.description}</div>
                            </td>
                            <td
                              className="table-cell date-cell"
                              style={{
                                padding: "20px 24px",
                                borderBottom: "1px solid #f0f0f0",
                                color: "#666",
                                fontSize: "1rem",
                                verticalAlign: "top",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {formatDateRange(
                                item.charge?.billingPeriodStart,
                                item.charge?.billingPeriodEnd,
                              )}
                            </td>
                            <td
                              className="table-cell"
                              style={{
                                padding: "20px 24px",
                                textAlign: "right",
                                borderBottom: "1px solid #f0f0f0",
                                fontWeight: 500,
                                verticalAlign: "top",
                                whiteSpace: "nowrap",
                              }}
                            >
                              ${(item.totalInCents / 100).toFixed(2)}
                            </td>
                          </tr>
                        )),
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
            <div
              className="summary-section"
              style={{
                marginTop: 50,
                padding: "40px",
                backgroundColor: "#f8f9fa",
                borderRadius: 8,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <div style={{ minWidth: 300 }}>
                <div
                  className="summary-text"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 16,
                    fontSize: "1.1rem",
                  }}
                >
                  <span>Subtotal:</span>
                  <span style={{ fontWeight: 600 }}>
                    ${(invoice.subTotalInCents / 100).toFixed(2)}
                  </span>
                </div>

                {/* Tax breakdown */}
                {invoice.taxLineItems && invoice.taxLineItems.length > 0 ? (
                  <div
                    style={{
                      paddingTop: 12,
                      borderTop: "1px solid #e0e0e0",
                      marginBottom: 12,
                    }}
                  >
                    {invoice.taxLineItems.map((taxItem) => (
                      <div
                        key={taxItem.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 10,
                          fontSize: "1.05rem",
                          color: "#666",
                        }}
                      >
                        <span>
                          {taxItem.description} (
                          {taxItem.type === "PERCENTAGE"
                            ? `${(taxItem.value * 100).toFixed(2)}%`
                            : `$${(taxItem.value / 100).toFixed(2)}`}
                          ):
                        </span>
                        <span>${((taxItem.calculatedAmountInCents || 0) / 100).toFixed(2)}</span>
                      </div>
                    ))}
                    {invoice.taxLineItems.length > 1 && (
                      <div
                        className="summary-text"
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "1rem",
                          fontWeight: 600,
                          marginTop: 8,
                          paddingTop: 8,
                          borderTop: "1px solid #e0e0e0",
                        }}
                      >
                        <span>Total Taxes:</span>
                        <span>${((invoice.totalTaxesInCents || 0) / 100).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className="summary-text"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 12,
                      paddingTop: 12,
                      borderTop: "1px solid #e0e0e0",
                      fontSize: "0.95rem",
                      color: "#666",
                    }}
                  >
                    <span>
                      Taxes (
                      {invoice.taxPercent !== undefined && invoice.taxPercent !== null
                        ? `${(invoice.taxPercent * 100).toFixed(0)}%`
                        : "N/A"}
                      ):
                    </span>
                    <span>${((invoice.taxesInCents || 0) / 100).toFixed(2)}</span>
                  </div>
                )}

                <div
                  className="total-due"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "1.6rem",
                    fontWeight: "bold",
                    marginTop: 20,
                    paddingTop: 20,
                    borderTop: "3px double #333",
                  }}
                >
                  <span>Total Due:</span>
                  <span>${(invoice.finalSumInCents / 100).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
