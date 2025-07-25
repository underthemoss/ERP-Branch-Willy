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
          createdAt
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
          salesOrderLineItem {
            __typename
            ... on RentalSalesOrderLineItem {
              id
              price {
                ... on RentalPrice {
                  id
                  name
                  pimCategoryName
                }
              }
            }
            ... on SaleSalesOrderLineItem {
              id
              so_quantity
              price {
                __typename
                ... on SalePrice {
                  id
                  name
                  pimCategoryName
                  unitCostInCents
                }
              }
            }
          }
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
  if (!start || !end) return { start: "", end: "" };

  const startDate = new Date(start);
  const endDate = new Date(end);

  const formattedStart = startDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const formattedEnd = endDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return { start: formattedStart, end: formattedEnd };
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
          @page {
            size: A4;
            margin: 15mm;
          }

          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            overflow: visible;
          }

          /* Avoid page breaks inside important elements */
          .avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Table printing optimizations */
          table {
            page-break-inside: auto !important;
          }

          thead {
            display: table-header-group !important;
          }

          tfoot {
            display: table-footer-group !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Keep section headers with their content */
          h1,
          h2,
          h3,
          h4,
          h5,
          h6 {
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }

          /* Table sections */
          .table-section {
            page-break-inside: auto !important;
          }

          .invoice-container {
            margin: 0 !important;
            padding: 0 !important;
            transform: none !important;
            width: 100% !important;
            max-width: 100% !important;
          }

          .invoice-title {
            font-size: 1.8rem !important;
          }

          .invoice-status {
            font-size: 0.9rem !important;
          }

          .section-header {
            font-size: 0.85rem !important;
          }

          .company-name {
            font-size: 0.95rem !important;
          }

          .contact-details {
            font-size: 0.8rem !important;
          }

          .invoice-number {
            font-size: 0.95rem !important;
          }

          .invoice-dates {
            font-size: 0.8rem !important;
          }

          .table-header {
            font-size: 0.75rem !important;
            padding: 6px 8px !important;
          }

          .table-cell {
            font-size: 0.85rem !important;
            padding: 6px 8px !important;
          }

          .project-header {
            font-size: 0.9rem !important;
            padding: 6px 8px !important;
          }

          .project-info {
            font-size: 0.9rem !important;
          }

          .charge-type-header {
            font-size: 0.95rem !important;
          }

          .description-cell {
            max-width: none !important;
            word-break: break-word !important;
          }

          .date-cell {
            white-space: normal !important;
            font-size: 0.8rem !important;
          }

          .summary-section {
            margin-top: 25px !important;
            padding: 20px !important;
          }

          .summary-text {
            font-size: 0.9rem !important;
          }

          .total-due {
            font-size: 1.2rem !important;
          }
        }

        @media screen {
          .print-container {
            max-width: 794px;
            margin: 0 auto;
          }
        }
      `}</style>
      <div
        className="print-container"
        style={{
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          color: "#333333",
          lineHeight: 1.6,
          backgroundColor: "#ffffff",
        }}
      >
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
          <div className="avoid-break" style={{ marginBottom: 20 }}>
            <h1
              className="invoice-title"
              style={{
                textAlign: "center",
                marginBottom: 4,
                fontSize: "1.8rem",
                fontWeight: 300,
                letterSpacing: "0.5px",
                color: "#1a1a1a",
              }}
            >
              INVOICE
            </h1>
            <div
              className="invoice-status"
              style={{
                textAlign: "center",
                fontSize: "0.9rem",
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
            className="avoid-break"
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "15px",
              marginBottom: 25,
              paddingBottom: 20,
            }}
          >
            <div style={{ flex: 1 }}>
              <h2
                className="section-header"
                style={{
                  margin: "0 0 6px 0",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  color: "#666",
                }}
              >
                From
              </h2>
              <div
                className="company-name"
                style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: 2 }}
              >
                {invoice.seller?.name}
              </div>
              {invoice.seller?.__typename === "BusinessContact" && invoice.seller.address && (
                <div
                  className="contact-details"
                  style={{ fontSize: "0.8rem", color: "#666", marginBottom: 2 }}
                >
                  {invoice.seller.address}
                </div>
              )}
              {invoice.seller?.phone && (
                <div className="contact-details" style={{ fontSize: "0.8rem", color: "#666" }}>
                  {invoice.seller.phone}
                </div>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <h2
                className="section-header"
                style={{
                  margin: "0 0 6px 0",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  color: "#666",
                }}
              >
                Bill To
              </h2>
              <div
                className="company-name"
                style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: 4 }}
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
                  margin: "0 0 6px 0",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  color: "#666",
                }}
              >
                Invoice
              </h2>
              <div
                className="invoice-number"
                style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: 4 }}
              >
                {invoice.id}
              </div>
              <div
                className="invoice-dates"
                style={{ fontSize: "0.8rem", color: "#666", marginBottom: 2 }}
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
            <div style={{ marginBottom: 20 }}>
              {(() => {
                // Group all charges by charge type first
                const chargeTypeGroups: {
                  [chargeType: string]: {
                    items: Array<{
                      chargeId: string;
                      description: string;
                      totalInCents: number;
                      charge: any;
                      projectName: string;
                      projectCode: string | null;
                    }>;
                    subtotal: number;
                  };
                } = {};

                Object.entries(groupedCharges).forEach(([projectId, projectData]) => {
                  Object.entries(projectData.chargeTypes).forEach(([chargeType, charges]) => {
                    charges.forEach((charge) => {
                      // Check if charge should be grouped as MISC
                      const isMiscCharge =
                        !charge.charge?.salesOrderId || !charge.charge?.projectId;
                      const groupType = isMiscCharge ? "MISC" : chargeType;

                      if (!chargeTypeGroups[groupType]) {
                        chargeTypeGroups[groupType] = {
                          items: [],
                          subtotal: 0,
                        };
                      }

                      chargeTypeGroups[groupType].items.push({
                        ...charge,
                        projectName: projectData.project.name,
                        projectCode: projectData.project.project_code,
                      });
                      chargeTypeGroups[groupType].subtotal += charge.totalInCents;
                    });
                  });
                });

                // Check if there's only one unique project across all charges (excluding null/undefined projectIds)
                const uniqueProjects = Object.entries(groupedCharges)
                  .filter(([projectId]) => projectId !== "no-project")
                  .map(([_, projectData]) => projectData);
                const hasOneProject = uniqueProjects.length === 1;
                const singleProject = hasOneProject ? uniqueProjects[0].project : null;

                return (
                  <>
                    {/* Project Information - shown at top if only one project */}
                    {hasOneProject && singleProject && (
                      <div className="project-info avoid-break" style={{ marginBottom: 20 }}>
                        <div
                          style={{
                            backgroundColor: "#f5f5f5",
                            padding: "12px 16px",
                            borderRadius: 8,
                          }}
                        >
                          <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#333" }}>
                            Project: {singleProject.name}
                            {singleProject.project_code && (
                              <span
                                style={{
                                  color: "#666",
                                  fontWeight: 400,
                                  marginLeft: 8,
                                  fontSize: "0.85rem",
                                }}
                              >
                                (Code: {singleProject.project_code})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {Object.entries(chargeTypeGroups).map(([chargeType, group], index) => {
                      // Group items by project within this charge type
                      const projectGroups: {
                        [projectKey: string]: {
                          projectName: string;
                          projectCode: string | null;
                          items: typeof group.items;
                        };
                      } = {};

                      group.items.forEach((item) => {
                        const projectKey = `${item.projectName}:${item.projectCode || ""}`;
                        if (!projectGroups[projectKey]) {
                          projectGroups[projectKey] = {
                            projectName: item.projectName,
                            projectCode: item.projectCode,
                            items: [],
                          };
                        }
                        projectGroups[projectKey].items.push(item);
                      });

                      return (
                        <div
                          key={chargeType}
                          className="table-section"
                          style={{
                            marginBottom: index < Object.keys(chargeTypeGroups).length - 1 ? 20 : 0,
                          }}
                        >
                          <h3
                            className="charge-type-header"
                            style={{
                              margin: "0 0 10px 0",
                              fontSize: "0.95rem",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              color: "#666",
                            }}
                          >
                            {chargeType} Charges
                          </h3>
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
                                fontSize: "0.85rem",
                                tableLayout: "auto",
                              }}
                            >
                              <thead>
                                <tr style={{ backgroundColor: "#fafafa" }}>
                                  {chargeType === "RENTAL" ? (
                                    <>
                                      <th
                                        className="table-header"
                                        style={{
                                          padding: "6px 8px",
                                          textAlign: "left",
                                          fontWeight: 600,
                                          fontSize: "0.75rem",
                                          textTransform: "uppercase",
                                          letterSpacing: "0.5px",
                                          color: "#666",
                                          borderBottom: "2px solid #e0e0e0",
                                          width: "100px",
                                        }}
                                      >
                                        Start Date
                                      </th>
                                      <th
                                        className="table-header"
                                        style={{
                                          padding: "8px 12px",
                                          textAlign: "left",
                                          fontWeight: 600,
                                          fontSize: "0.95rem",
                                          textTransform: "uppercase",
                                          letterSpacing: "0.8px",
                                          color: "#666",
                                          borderBottom: "2px solid #e0e0e0",
                                          width: "100px",
                                        }}
                                      >
                                        End Date
                                      </th>
                                    </>
                                  ) : (
                                    <th
                                      className="table-header"
                                      style={{
                                        padding: "8px 12px",
                                        textAlign: "left",
                                        fontWeight: 600,
                                        fontSize: "0.95rem",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.8px",
                                        color: "#666",
                                        borderBottom: "2px solid #e0e0e0",
                                        width: "120px",
                                      }}
                                    >
                                      Date
                                    </th>
                                  )}
                                  <th
                                    className="table-header"
                                    style={{
                                      padding: "8px 12px",
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
                                  {chargeType === "SALE" && (
                                    <>
                                      <th
                                        className="table-header"
                                        style={{
                                          padding: "6px 8px",
                                          textAlign: "right",
                                          fontWeight: 600,
                                          fontSize: "0.75rem",
                                          textTransform: "uppercase",
                                          letterSpacing: "0.5px",
                                          color: "#666",
                                          borderBottom: "2px solid #e0e0e0",
                                          whiteSpace: "nowrap",
                                          width: "60px",
                                        }}
                                      >
                                        QTY
                                      </th>
                                      <th
                                        className="table-header"
                                        style={{
                                          padding: "8px 12px",
                                          textAlign: "right",
                                          fontWeight: 600,
                                          fontSize: "0.95rem",
                                          textTransform: "uppercase",
                                          letterSpacing: "0.8px",
                                          color: "#666",
                                          borderBottom: "2px solid #e0e0e0",
                                          whiteSpace: "nowrap",
                                          width: "80px",
                                        }}
                                      >
                                        RATE
                                      </th>
                                    </>
                                  )}
                                  <th
                                    className="table-header"
                                    style={{
                                      padding: "8px 12px",
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
                                {Object.entries(projectGroups).map(([projectKey, projectData]) => (
                                  <>
                                    {!hasOneProject && chargeType !== "MISC" && (
                                      <tr key={`project-${projectKey}`}>
                                        <td
                                          colSpan={
                                            chargeType === "SALE"
                                              ? 5
                                              : chargeType === "RENTAL"
                                                ? 4
                                                : 3
                                          }
                                          className="project-header"
                                          style={{
                                            backgroundColor: "#f5f5f5",
                                            padding: "6px 8px",
                                            borderBottom: "1px solid #e0e0e0",
                                            fontWeight: 600,
                                            fontSize: "0.9rem",
                                            color: "#333",
                                          }}
                                        >
                                          Project: {projectData.projectName}
                                          {projectData.projectCode && (
                                            <span
                                              style={{
                                                color: "#666",
                                                fontWeight: 400,
                                                marginLeft: 10,
                                              }}
                                            >
                                              (Code: {projectData.projectCode})
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    )}
                                    {projectData.items.map((item) => {
                                      // For non-RENTAL charges, use billingPeriodStart or fallback to createdAt
                                      const singleDate =
                                        item.charge?.billingPeriodStart || item.charge?.createdAt;

                                      const dateRange = formatDateRange(
                                        item.charge?.billingPeriodStart,
                                        item.charge?.billingPeriodEnd,
                                      );

                                      // Get the description based on charge type
                                      let description: string;
                                      const pimCategoryName =
                                        item.charge?.salesOrderLineItem?.price?.pimCategoryName;

                                      if (chargeType === "RENTAL") {
                                        // For rental charges, include pimCategoryName first, then use charge.description and strip the prefix
                                        const rawDescription =
                                          item.charge?.description || item.description;
                                        let cleanDescription = rawDescription;

                                        if (pimCategoryName && rawDescription) {
                                          const prefixToRemove = `Rental charge for ${pimCategoryName}:`;
                                          cleanDescription = rawDescription
                                            .replace(prefixToRemove, "")
                                            .trim();
                                        }

                                        // Combine pimCategoryName with cleaned description
                                        if (pimCategoryName && cleanDescription) {
                                          description = `${pimCategoryName}: ${cleanDescription}`;
                                        } else if (pimCategoryName) {
                                          description = pimCategoryName;
                                        } else {
                                          description = cleanDescription;
                                        }
                                      } else if (chargeType === "SERVICE") {
                                        // For service charges, use charge.description
                                        description = item.charge?.description || item.description;
                                      } else if (chargeType === "SALE") {
                                        // For SALE charges, include pimCategoryName first, then price.name or charge.description
                                        const priceName =
                                          item.charge?.salesOrderLineItem?.price?.name;
                                        const baseDescription =
                                          priceName || item.charge?.description || item.description;

                                        if (
                                          pimCategoryName &&
                                          baseDescription &&
                                          pimCategoryName !== baseDescription
                                        ) {
                                          description = `${pimCategoryName}: ${baseDescription}`;
                                        } else if (pimCategoryName) {
                                          description = pimCategoryName;
                                        } else {
                                          description = baseDescription;
                                        }
                                      } else {
                                        // For other charge types, use salesOrderLineItem.price.name or fallback to charge.description
                                        description =
                                          item.charge?.salesOrderLineItem?.price?.name ||
                                          item.charge?.description ||
                                          item.description;
                                      }

                                      // Get quantity and rate for SALE charge types
                                      const quantity =
                                        item.charge?.salesOrderLineItem?.__typename ===
                                        "SaleSalesOrderLineItem"
                                          ? item.charge.salesOrderLineItem.so_quantity
                                          : null;
                                      const unitCostInCents =
                                        item.charge?.salesOrderLineItem?.__typename ===
                                          "SaleSalesOrderLineItem" &&
                                        item.charge.salesOrderLineItem.price?.__typename ===
                                          "SalePrice"
                                          ? item.charge.salesOrderLineItem.price.unitCostInCents
                                          : null;

                                      return (
                                        <tr key={item.chargeId}>
                                          {chargeType === "RENTAL" ? (
                                            <>
                                              <td
                                                className="table-cell date-cell"
                                                style={{
                                                  padding: "6px 8px",
                                                  borderBottom: "1px solid #f0f0f0",
                                                  color: "#666",
                                                  fontSize: "0.8rem",
                                                  verticalAlign: "middle",
                                                  width: "100px",
                                                }}
                                              >
                                                {dateRange.start || "-"}
                                              </td>
                                              <td
                                                className="table-cell date-cell"
                                                style={{
                                                  padding: "10px 12px",
                                                  borderBottom: "1px solid #f0f0f0",
                                                  color: "#666",
                                                  fontSize: "1rem",
                                                  verticalAlign: "top",
                                                  width: "100px",
                                                }}
                                              >
                                                {dateRange.end || "-"}
                                              </td>
                                            </>
                                          ) : (
                                            <td
                                              className="table-cell date-cell"
                                              style={{
                                                padding: "10px 12px",
                                                borderBottom: "1px solid #f0f0f0",
                                                color: "#666",
                                                fontSize: "1rem",
                                                verticalAlign: "top",
                                                width: "120px",
                                              }}
                                            >
                                              {singleDate ? formatDate(singleDate) : "-"}
                                            </td>
                                          )}
                                          <td
                                            className="table-cell description-cell"
                                            style={{
                                              padding: "6px 8px",
                                              borderBottom: "1px solid #f0f0f0",
                                              verticalAlign: "middle",
                                              width: "auto",
                                            }}
                                          >
                                            <div style={{ fontWeight: 500 }}>{description}</div>
                                          </td>
                                          {chargeType === "SALE" && (
                                            <>
                                              <td
                                                className="table-cell"
                                                style={{
                                                  padding: "6px 8px",
                                                  textAlign: "right",
                                                  borderBottom: "1px solid #f0f0f0",
                                                  verticalAlign: "middle",
                                                  whiteSpace: "nowrap",
                                                }}
                                              >
                                                {quantity || "-"}
                                              </td>
                                              <td
                                                className="table-cell"
                                                style={{
                                                  padding: "10px 12px",
                                                  textAlign: "right",
                                                  borderBottom: "1px solid #f0f0f0",
                                                  verticalAlign: "top",
                                                  whiteSpace: "nowrap",
                                                }}
                                              >
                                                {unitCostInCents
                                                  ? `$${(unitCostInCents / 100).toFixed(2)}`
                                                  : "-"}
                                              </td>
                                            </>
                                          )}
                                          <td
                                            className="table-cell"
                                            style={{
                                              padding: "6px 8px",
                                              textAlign: "right",
                                              borderBottom: "1px solid #f0f0f0",
                                              fontWeight: 500,
                                              verticalAlign: "middle",
                                              whiteSpace: "nowrap",
                                            }}
                                          >
                                            ${(item.totalInCents / 100).toFixed(2)}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </>
                                ))}
                                <tr style={{ backgroundColor: "#f8f9fa" }}>
                                  <td
                                    colSpan={
                                      chargeType === "SALE" ? 4 : chargeType === "RENTAL" ? 3 : 2
                                    }
                                    style={{
                                      padding: "6px 8px",
                                      textAlign: "right",
                                      fontWeight: 600,
                                      fontSize: "0.8rem",
                                      borderTop: "2px solid #e0e0e0",
                                    }}
                                  >
                                    Subtotal:
                                  </td>
                                  <td
                                    style={{
                                      padding: "10px 12px",
                                      textAlign: "right",
                                      fontWeight: 600,
                                      fontSize: "1.05rem",
                                      borderTop: "2px solid #e0e0e0",
                                    }}
                                  >
                                    ${(group.subtotal / 100).toFixed(2)}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </>
                );
              })()}
              <div
                className="summary-section avoid-break"
                style={{
                  marginTop: 25,
                  padding: "20px",
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
                      marginBottom: 8,
                      fontSize: "0.9rem",
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
                        paddingTop: 6,
                        borderTop: "1px solid #e0e0e0",
                        marginBottom: 6,
                      }}
                    >
                      {invoice.taxLineItems.map((taxItem) => (
                        <div
                          key={taxItem.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 5,
                            fontSize: "0.85rem",
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
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            marginTop: 4,
                            paddingTop: 4,
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
                        marginBottom: 6,
                        paddingTop: 6,
                        borderTop: "1px solid #e0e0e0",
                        fontSize: "0.85rem",
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
                      fontSize: "1.2rem",
                      fontWeight: "bold",
                      marginTop: 10,
                      paddingTop: 10,
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
      </div>
    </>
  );
}
