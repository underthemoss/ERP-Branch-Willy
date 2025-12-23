"use client";

import { graphql } from "@/graphql";
import { useGetPurchaseOrderByIdPrintQuery } from "@/graphql/hooks";
import { addDays } from "date-fns";
import { useParams } from "next/navigation";
import * as React from "react";

// GQL Query (same as detail page)
const PURCHASE_ORDER_DETAIL_QUERY = graphql(`
  query GetPurchaseOrderByIdPrint($id: String) {
    getPurchaseOrderById(id: $id) {
      id
      status
      purchase_order_number
      company_id
      created_at
      created_by
      updated_at
      updated_by
      seller_id
      project_id
      seller {
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
        workspaceId
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
        ... on RentalPurchaseOrderLineItem {
          id
          po_pim_id
          po_quantity
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
        ... on SalePurchaseOrderLineItem {
          id
          po_pim_id
          po_quantity
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

function formatDate(date: string | null | undefined) {
  if (!date) return "";
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return "";
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function formatDateShort(date: string | null | undefined) {
  if (!date) return "";
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return "";
    // Format as YYYY-MM-DD
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
}

function formatCurrency(amount: number) {
  // Format with $ symbol without US prefix
  return `$${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export default function PurchaseOrderPrintPage() {
  const { purchase_order_id } = useParams<{ purchase_order_id: string }>();

  const { data, loading, error } = useGetPurchaseOrderByIdPrintQuery({
    variables: { id: purchase_order_id },
    fetchPolicy: "no-cache",
  });

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: 32, color: "#888" }}>
        Loading purchase order...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", marginTop: 32, color: "#c00" }}>
        Error loading purchase order: {error.message}
      </div>
    );
  }

  type PurchaseOrderType = NonNullable<typeof data>["getPurchaseOrderById"];
  type LineItemType = PurchaseOrderType extends { line_items?: (infer T)[] } ? T : any;

  const purchaseOrder: PurchaseOrderType | undefined = data?.getPurchaseOrderById;

  // Use real line items
  const lineItems: LineItemType[] =
    (purchaseOrder as PurchaseOrderType & { line_items?: LineItemType[] })?.line_items || [];

  // Calculate totals from real data
  function getLineItemTotal(item: any): number {
    if (!item) return 0;
    if (
      item.__typename === "RentalPurchaseOrderLineItem" &&
      item.calulate_price &&
      typeof item.calulate_price.total_including_delivery_in_cents === "number"
    ) {
      return item.calulate_price.total_including_delivery_in_cents / 100;
    }
    if (
      item.__typename === "SalePurchaseOrderLineItem" &&
      item.price?.__typename === "SalePrice" &&
      typeof item.price.unitCostInCents === "number" &&
      typeof item.po_quantity === "number"
    ) {
      const itemTotal = (item.price.unitCostInCents * item.po_quantity) / 100;
      const deliveryCharge = (item.delivery_charge_in_cents ?? 0) / 100;
      return itemTotal + deliveryCharge;
    }
    return 0;
  }

  function getUnitPrice(item: any): number {
    if (!item) return 0;
    if (
      item.__typename === "RentalPurchaseOrderLineItem" &&
      item.price?.__typename === "RentalPrice" &&
      typeof item.price.pricePerDayInCents === "number"
    ) {
      // For print, show price per day if available
      return item.price.pricePerDayInCents / 100;
    }
    if (
      item.__typename === "SalePurchaseOrderLineItem" &&
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
    if (!item || item.__typename !== "RentalPurchaseOrderLineItem") return "";

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

  // Calculate totals from line items
  let subtotal = 0;
  let deliveryTotal = 0;

  lineItems.forEach((item: any) => {
    if (!item) return;

    if (item.__typename === "RentalPurchaseOrderLineItem") {
      const itemDeliveryCharge = (item.delivery_charge_in_cents ?? 0) / 100;
      const itemTotal = getLineItemTotal(item);
      const itemSubtotal = itemTotal - itemDeliveryCharge;

      subtotal += itemSubtotal;
      deliveryTotal += itemDeliveryCharge;
    } else if (item.__typename === "SalePurchaseOrderLineItem") {
      const quantity = item.po_quantity || 1;
      const unitPrice = getUnitPrice(item);
      const itemSubtotal = unitPrice * quantity;
      const itemDeliveryCharge = (item.delivery_charge_in_cents ?? 0) / 100;

      subtotal += itemSubtotal;
      deliveryTotal += itemDeliveryCharge;
    }
  });

  const total = subtotal + deliveryTotal;

  // Vendor info (the supplier we're ordering from)
  const vendor = purchaseOrder?.seller;

  // Group line items by type
  const saleItems = lineItems.filter(
    (item: any) => item.__typename === "SalePurchaseOrderLineItem",
  );
  const rentalItems = lineItems.filter(
    (item: any) => item.__typename === "RentalPurchaseOrderLineItem",
  );

  return (
    <div>
      <style>
        {`
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
          h1, h2, h3, h4, h5, h6 {
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }
          
          /* Table sections */
          .table-section {
            page-break-inside: auto !important;
          }
        }
        
        @media screen {
          .print-container {
            max-width: 794px;
            margin: 0 auto;
            padding: 40px;
          }
        }
        `}
      </style>
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
              style={{
                textAlign: "center",
                marginBottom: 4,
                fontSize: "1.8rem",
                fontWeight: 300,
                letterSpacing: "0.5px",
                color: "#1a1a1a",
              }}
            >
              PURCHASE ORDER
            </h1>
            <div
              style={{
                textAlign: "center",
                fontSize: "0.9rem",
                fontWeight: 600,
                color: "#333",
              }}
            >
              {purchaseOrder?.status}
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
                style={{
                  margin: "0 0 6px 0",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  color: "#666",
                }}
              >
                Vendor
              </h2>
              <div style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: 4 }}>
                {vendor?.name || "—"}
              </div>
              {vendor?.__typename === "BusinessContact" && vendor.address && (
                <div style={{ fontSize: "0.8rem", color: "#666", marginBottom: 2 }}>
                  {vendor.address}
                </div>
              )}
              {vendor?.phone && (
                <div style={{ fontSize: "0.8rem", color: "#666" }}>{vendor.phone}</div>
              )}
              {vendor?.__typename === "PersonContact" && vendor.email && (
                <div style={{ fontSize: "0.8rem", color: "#666" }}>{vendor.email}</div>
              )}
            </div>

            <div style={{ flex: 1, textAlign: "right" }}>
              <h2
                style={{
                  margin: "0 0 6px 0",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  color: "#666",
                }}
              >
                Order Details
              </h2>
              <div style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: 4 }}>
                #{purchaseOrder?.purchase_order_number || "—"}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#666", marginBottom: 2 }}>
                Date: {formatDate(new Date().toISOString())}
              </div>
            </div>
          </div>

          {/* Project Information */}
          {purchaseOrder?.project && (
            <div className="project-info avoid-break" style={{ marginBottom: 20 }}>
              <div
                style={{
                  backgroundColor: "#f5f5f5",
                  padding: "12px 16px",
                  borderRadius: 8,
                  marginBottom: 20,
                }}
              >
                <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#333" }}>
                  Project: {purchaseOrder.project.name}
                  {purchaseOrder.project.project_code && (
                    <span
                      style={{
                        color: "#666",
                        fontWeight: 400,
                        marginLeft: 8,
                        fontSize: "0.85rem",
                      }}
                    >
                      (Code: {purchaseOrder.project.project_code})
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Sales Items */}
          {saleItems.length > 0 &&
            (() => {
              // Calculate totals for sales items
              let saleAmountTotal = 0;
              let saleDeliveryTotal = 0;
              let saleTotalTotal = 0;

              saleItems.forEach((item: any) => {
                const quantity = item.po_quantity || 1;
                const unitPrice = getUnitPrice(item);
                const itemSubtotal = unitPrice * quantity;
                const deliveryCharge = (item.delivery_charge_in_cents ?? 0) / 100;

                saleAmountTotal += itemSubtotal;
                saleDeliveryTotal += deliveryCharge;
                saleTotalTotal += getLineItemTotal(item);
              });

              return (
                <div className="table-section" style={{ marginBottom: 20 }}>
                  <h2
                    style={{
                      margin: "0 0 10px 0",
                      fontSize: "0.95rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: "#666",
                    }}
                  >
                    Sales Items
                  </h2>
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
                          <th
                            style={{
                              padding: "6px 8px",
                              textAlign: "left",
                              fontWeight: 600,
                              fontSize: "0.75rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              color: "#666",
                              borderBottom: "2px solid #e0e0e0",
                            }}
                          >
                            Description
                          </th>
                          <th
                            style={{
                              padding: "6px 8px",
                              textAlign: "center",
                              fontWeight: 600,
                              fontSize: "0.75rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              color: "#666",
                              borderBottom: "2px solid #e0e0e0",
                              width: "80px",
                            }}
                          >
                            Qty
                          </th>
                          <th
                            style={{
                              padding: "6px 8px",
                              textAlign: "right",
                              fontWeight: 600,
                              fontSize: "0.75rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              color: "#666",
                              borderBottom: "2px solid #e0e0e0",
                              width: "120px",
                            }}
                          >
                            Rate
                          </th>
                          <th
                            style={{
                              padding: "6px 8px",
                              textAlign: "right",
                              fontWeight: 600,
                              fontSize: "0.75rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              color: "#666",
                              borderBottom: "2px solid #e0e0e0",
                              width: "120px",
                            }}
                          >
                            Amount
                          </th>
                          <th
                            style={{
                              padding: "6px 8px",
                              textAlign: "right",
                              fontWeight: 600,
                              fontSize: "0.75rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              color: "#666",
                              borderBottom: "2px solid #e0e0e0",
                              width: "120px",
                            }}
                          >
                            Delivery
                          </th>
                          <th
                            style={{
                              padding: "6px 8px",
                              textAlign: "right",
                              fontWeight: 600,
                              fontSize: "0.75rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              color: "#666",
                              borderBottom: "2px solid #e0e0e0",
                              width: "120px",
                            }}
                          >
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {saleItems.map((item: any, idx: number) => {
                          const quantity = item.po_quantity || 1;
                          const unitPrice = getUnitPrice(item);
                          const subtotal = unitPrice * quantity;
                          const deliveryCharge = (item.delivery_charge_in_cents ?? 0) / 100;
                          return (
                            <tr key={item.id || idx}>
                              <td
                                style={{
                                  padding: "6px 8px",
                                  borderBottom: "1px solid #f0f0f0",
                                  verticalAlign: "middle",
                                }}
                              >
                                <div style={{ fontWeight: 500 }}>{getDescription(item)}</div>
                              </td>
                              <td
                                style={{
                                  padding: "6px 8px",
                                  textAlign: "center",
                                  borderBottom: "1px solid #f0f0f0",
                                  color: "#666",
                                }}
                              >
                                {item.po_quantity ?? "—"}
                              </td>
                              <td
                                style={{
                                  padding: "6px 8px",
                                  textAlign: "right",
                                  borderBottom: "1px solid #f0f0f0",
                                }}
                              >
                                {formatCurrency(unitPrice)}
                              </td>
                              <td
                                style={{
                                  padding: "6px 8px",
                                  textAlign: "right",
                                  borderBottom: "1px solid #f0f0f0",
                                }}
                              >
                                {formatCurrency(subtotal)}
                              </td>
                              <td
                                style={{
                                  padding: "6px 8px",
                                  textAlign: "right",
                                  borderBottom: "1px solid #f0f0f0",
                                }}
                              >
                                {formatCurrency(deliveryCharge)}
                              </td>
                              <td
                                style={{
                                  padding: "6px 8px",
                                  textAlign: "right",
                                  borderBottom: "1px solid #f0f0f0",
                                  fontWeight: 500,
                                }}
                              >
                                {formatCurrency(getLineItemTotal(item))}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{ backgroundColor: "#f5f5f5" }}>
                          <td
                            colSpan={3}
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
                              padding: "6px 8px",
                              textAlign: "right",
                              fontWeight: 600,
                              fontSize: "0.8rem",
                              borderTop: "2px solid #e0e0e0",
                            }}
                          >
                            {formatCurrency(saleAmountTotal)}
                          </td>
                          <td
                            style={{
                              padding: "6px 8px",
                              textAlign: "right",
                              fontWeight: 600,
                              fontSize: "0.8rem",
                              borderTop: "2px solid #e0e0e0",
                            }}
                          >
                            {formatCurrency(saleDeliveryTotal)}
                          </td>
                          <td
                            style={{
                              padding: "6px 8px",
                              textAlign: "right",
                              fontWeight: 600,
                              fontSize: "0.8rem",
                              borderTop: "2px solid #e0e0e0",
                            }}
                          >
                            {formatCurrency(saleTotalTotal)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              );
            })()}

          {/* Rental Items */}
          {rentalItems.length > 0 &&
            (() => {
              // Calculate totals for rental items
              let rentalAmountTotal = 0;
              let rentalDeliveryTotal = 0;
              let rentalTotalTotal = 0;

              rentalItems.forEach((item: any) => {
                const deliveryCharge = (item.delivery_charge_in_cents ?? 0) / 100;
                const itemTotal = getLineItemTotal(item);
                const itemSubtotal = itemTotal - deliveryCharge;

                rentalAmountTotal += itemSubtotal;
                rentalDeliveryTotal += deliveryCharge;
                rentalTotalTotal += itemTotal;
              });

              return (
                <div className="table-section" style={{ marginBottom: 20 }}>
                  <h2
                    style={{
                      margin: "0 0 10px 0",
                      fontSize: "0.95rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: "#666",
                    }}
                  >
                    Rental Items
                  </h2>
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
                          <th
                            style={{
                              padding: "6px 8px",
                              textAlign: "left",
                              fontWeight: 600,
                              fontSize: "0.75rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              color: "#666",
                              borderBottom: "2px solid #e0e0e0",
                            }}
                          >
                            Description
                          </th>
                          <th
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
                            End Date
                          </th>
                          <th
                            style={{
                              padding: "6px 8px",
                              textAlign: "center",
                              fontWeight: 600,
                              fontSize: "0.75rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              color: "#666",
                              borderBottom: "2px solid #e0e0e0",
                              width: "60px",
                            }}
                          >
                            Days
                          </th>
                          <th
                            style={{
                              padding: "6px 8px",
                              textAlign: "right",
                              fontWeight: 600,
                              fontSize: "0.75rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              color: "#666",
                              borderBottom: "2px solid #e0e0e0",
                              width: "120px",
                            }}
                          >
                            Amount
                          </th>
                          <th
                            style={{
                              padding: "6px 8px",
                              textAlign: "right",
                              fontWeight: 600,
                              fontSize: "0.75rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              color: "#666",
                              borderBottom: "2px solid #e0e0e0",
                              width: "120px",
                            }}
                          >
                            Delivery
                          </th>
                          <th
                            style={{
                              padding: "6px 8px",
                              textAlign: "right",
                              fontWeight: 600,
                              fontSize: "0.75rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              color: "#666",
                              borderBottom: "2px solid #e0e0e0",
                              width: "120px",
                            }}
                          >
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rentalItems.map((item: any, idx: number) => {
                          const deliveryCharge = (item.delivery_charge_in_cents ?? 0) / 100;
                          const total = getLineItemTotal(item);
                          const subtotal = total - deliveryCharge;
                          return (
                            <tr key={item.id || idx}>
                              <td
                                style={{
                                  padding: "6px 8px",
                                  borderBottom: "1px solid #f0f0f0",
                                  verticalAlign: "top",
                                }}
                              >
                                <div style={{ fontWeight: 500 }}>{getDescription(item)}</div>
                                <div
                                  style={{ fontSize: "0.75rem", color: "#666", marginTop: "2px" }}
                                >
                                  {getRateDetails(item)}
                                </div>
                              </td>
                              <td
                                style={{
                                  padding: "6px 8px",
                                  borderBottom: "1px solid #f0f0f0",
                                  color: "#666",
                                  fontSize: "0.8rem",
                                  verticalAlign: "middle",
                                }}
                              >
                                {formatDateShort(item.delivery_date)}
                              </td>
                              <td
                                style={{
                                  padding: "6px 8px",
                                  borderBottom: "1px solid #f0f0f0",
                                  color: "#666",
                                  fontSize: "0.8rem",
                                  verticalAlign: "middle",
                                }}
                              >
                                {formatDateShort(item.off_rent_date)}
                              </td>
                              <td
                                style={{
                                  padding: "6px 8px",
                                  textAlign: "center",
                                  borderBottom: "1px solid #f0f0f0",
                                  color: "#666",
                                }}
                              >
                                {item.totalDaysOnRent ?? "—"}
                              </td>
                              <td
                                style={{
                                  padding: "6px 8px",
                                  textAlign: "right",
                                  borderBottom: "1px solid #f0f0f0",
                                }}
                              >
                                {formatCurrency(subtotal)}
                              </td>
                              <td
                                style={{
                                  padding: "6px 8px",
                                  textAlign: "right",
                                  borderBottom: "1px solid #f0f0f0",
                                }}
                              >
                                {formatCurrency(deliveryCharge)}
                              </td>
                              <td
                                style={{
                                  padding: "6px 8px",
                                  textAlign: "right",
                                  borderBottom: "1px solid #f0f0f0",
                                  fontWeight: 500,
                                }}
                              >
                                {formatCurrency(total)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{ backgroundColor: "#f5f5f5" }}>
                          <td
                            colSpan={4}
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
                              padding: "6px 8px",
                              textAlign: "right",
                              fontWeight: 600,
                              fontSize: "0.8rem",
                              borderTop: "2px solid #e0e0e0",
                            }}
                          >
                            {formatCurrency(rentalAmountTotal)}
                          </td>
                          <td
                            style={{
                              padding: "6px 8px",
                              textAlign: "right",
                              fontWeight: 600,
                              fontSize: "0.8rem",
                              borderTop: "2px solid #e0e0e0",
                            }}
                          >
                            {formatCurrency(rentalDeliveryTotal)}
                          </td>
                          <td
                            style={{
                              padding: "6px 8px",
                              textAlign: "right",
                              fontWeight: 600,
                              fontSize: "0.8rem",
                              borderTop: "2px solid #e0e0e0",
                            }}
                          >
                            {formatCurrency(rentalTotalTotal)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              );
            })()}

          {/* Show message if no items */}
          {lineItems.length === 0 && (
            <div style={{ marginBottom: 20 }}>
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
                  }}
                >
                  <tbody>
                    <tr>
                      <td
                        style={{
                          textAlign: "center",
                          color: "#888",
                          padding: "40px",
                          fontSize: "0.9rem",
                        }}
                      >
                        No order items
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Summary Section */}
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
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                  fontSize: "0.9rem",
                }}
              >
                <span>Subtotal:</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(subtotal)}</span>
              </div>

              <div
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
                <span>Delivery:</span>
                <span>{formatCurrency(deliveryTotal)}</span>
              </div>

              <div
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
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
