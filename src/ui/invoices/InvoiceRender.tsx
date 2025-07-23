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
    <div
      style={{
        marginLeft: -30,
        marginRight: -30,
        padding: "40px",
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        backgroundColor: "#ffffff",
        color: "#333333",
        lineHeight: 1.6,
      }}
    >
      <div style={{ marginBottom: 40 }}>
        <h1
          style={{
            textAlign: "center",
            marginBottom: 8,
            fontSize: "2.5rem",
            fontWeight: 300,
            letterSpacing: "0.5px",
            color: "#1a1a1a",
          }}
        >
          INVOICE
        </h1>
        <div
          style={{
            textAlign: "center",
            fontSize: "1.1rem",
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
          gap: "50px",
          marginBottom: 40,
          paddingBottom: 30,
        }}
      >
        <div style={{ flex: 1 }}>
          <h2
            style={{
              margin: "0 0 12px 0",
              fontSize: "1.1rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "#666",
            }}
          >
            From
          </h2>
          <div style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 4 }}>
            {invoice.seller?.name}
          </div>
          {invoice.seller?.__typename === "BusinessContact" && invoice.seller.address && (
            <div style={{ fontSize: "0.95rem", color: "#666", marginBottom: 2 }}>
              {invoice.seller.address}
            </div>
          )}
          {invoice.seller?.phone && (
            <div style={{ fontSize: "0.95rem", color: "#666" }}>{invoice.seller.phone}</div>
          )}
        </div>

        <div style={{ flex: 2 }}>
          <h2
            style={{
              margin: "0 0 12px 0",
              fontSize: "1.1rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "#666",
            }}
          >
            Bill To
          </h2>
          <div style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 4 }}>
            {invoice.buyer?.name}
          </div>
          {invoice.buyer?.__typename === "BusinessContact" && invoice.buyer.address && (
            <div style={{ fontSize: "0.95rem", color: "#666", marginBottom: 2 }}>
              {invoice.buyer.address}
            </div>
          )}
          {invoice.buyer?.phone && (
            <div style={{ fontSize: "0.95rem", color: "#666" }}>{invoice.buyer.phone}</div>
          )}
        </div>

        <div style={{ flex: 1, textAlign: "right" }}>
          <h2
            style={{
              margin: "0 0 12px 0",
              fontSize: "1.1rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "#666",
            }}
          >
            Invoice
          </h2>
          <div style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 4 }}>{invoice.id}</div>
          <div style={{ fontSize: "0.95rem", color: "#666", marginBottom: 2 }}>
            Date Issued: {formatDate(invoice.createdAt)}
          </div>
          <div style={{ fontSize: "0.95rem", color: "#666", marginBottom: 2 }}>
            Due Date:{" "}
            {invoice.dueDate
              ? formatDate(invoice.dueDate)
              : formatDate(
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
                fontSize: "0.95rem",
                tableLayout: "auto",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#fafafa" }}>
                  <th
                    style={{
                      padding: "12px 20px",
                      textAlign: "left",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: "#666",
                      borderBottom: "2px solid #e0e0e0",
                      width: "200px",
                    }}
                  >
                    Description
                  </th>
                  <th
                    style={{
                      padding: "12px 20px",
                      textAlign: "left",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: "#666",
                      borderBottom: "2px solid #e0e0e0",
                      whiteSpace: "nowrap",
                      width: 1,
                    }}
                  >
                    Type
                  </th>
                  <th
                    style={{
                      padding: "12px 20px",
                      textAlign: "left",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: "#666",
                      borderBottom: "2px solid #e0e0e0",
                      whiteSpace: "nowrap",
                      width: 1,
                    }}
                  >
                    Customer PO #
                  </th>
                  <th
                    style={{
                      padding: "12px 20px",
                      textAlign: "left",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: "#666",
                      borderBottom: "2px solid #e0e0e0",
                      whiteSpace: "nowrap",
                      width: 1,
                    }}
                  >
                    Date
                  </th>
                  <th
                    style={{
                      padding: "12px 20px",
                      textAlign: "right",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: "#666",
                      borderBottom: "2px solid #e0e0e0",
                      whiteSpace: "nowrap",
                      width: 1,
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
                        colSpan={5}
                        style={{
                          backgroundColor: "#f5f5f5",
                          padding: "12px 20px",
                          borderBottom: "1px solid #e0e0e0",
                          fontWeight: 600,
                          fontSize: "1rem",
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
                            style={{
                              padding: "16px 20px",
                              borderBottom: "1px solid #f0f0f0",
                              verticalAlign: "top",
                              width: "100%",
                            }}
                          >
                            <div style={{ fontWeight: 500 }}>{item.description}</div>
                          </td>
                          <td
                            style={{
                              padding: "16px 20px",
                              borderBottom: "1px solid #f0f0f0",
                              color: "#666",
                              verticalAlign: "top",
                              whiteSpace: "nowrap",
                              // width: 1,
                            }}
                          >
                            {chargeType}
                          </td>
                          <td
                            style={{
                              padding: "16px 20px",
                              borderBottom: "1px solid #f0f0f0",
                              color: "#666",
                              fontSize: "0.9rem",
                              verticalAlign: "top",
                              whiteSpace: "nowrap",
                              // width: 1,
                            }}
                          >
                            {item.charge?.purchaseOrderNumber || "-"}
                          </td>
                          <td
                            style={{
                              padding: "16px 20px",
                              borderBottom: "1px solid #f0f0f0",
                              color: "#666",
                              fontSize: "0.9rem",
                              verticalAlign: "top",
                              whiteSpace: "nowrap",
                              // width: 1,
                            }}
                          >
                            {formatDateRange(
                              item.charge?.billingPeriodStart,
                              item.charge?.billingPeriodEnd,
                            )}
                          </td>
                          <td
                            style={{
                              padding: "16px 20px",
                              textAlign: "right",
                              borderBottom: "1px solid #f0f0f0",
                              fontWeight: 500,
                              verticalAlign: "top",
                              whiteSpace: "nowrap",
                              // width: 1,
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
            style={{
              marginTop: 40,
              padding: "30px",
              backgroundColor: "#f8f9fa",
              borderRadius: 8,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <div style={{ minWidth: 300 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 12,
                  fontSize: "1rem",
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
                        marginBottom: 8,
                        fontSize: "0.95rem",
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
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "1.4rem",
                  fontWeight: "bold",
                  marginTop: 16,
                  paddingTop: 16,
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
  );
}
