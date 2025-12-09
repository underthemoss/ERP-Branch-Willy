"use client";

import { graphql } from "@/graphql";
import { useGetQuoteForPrintQuery } from "@/graphql/hooks";
import { useConfig } from "@/providers/ConfigProvider";
import { useParams } from "next/navigation";
import * as React from "react";

// GraphQL Query
const GET_QUOTE_FOR_PRINT = graphql(`
  query GetQuoteForPrint($id: String!, $workspaceId: String!) {
    quoteById(id: $id) {
      id
      status
      sellerWorkspaceId
      sellersBuyerContactId
      sellersBuyerContact {
        ... on PersonContact {
          id
          contactType
          name
          email
          phone
          business {
            id
            name
            address
          }
        }
        ... on BusinessContact {
          id
          contactType
          name
          phone
          address
        }
      }
      sellersProjectId
      sellersProject {
        id
        name
        project_code
        description
      }
      currentRevisionId
      currentRevision {
        id
        revisionNumber
        validUntil
        createdAt
        lineItems {
          ... on QuoteRevisionRentalLineItem {
            id
            type
            description
            quantity
            pimCategory {
              name
            }
            price {
              ... on RentalPrice {
                id
                name
                pricePerDayInCents
                pricePerWeekInCents
                pricePerMonthInCents
              }
            }
            rentalStartDate
            rentalEndDate
            subtotalInCents
          }
          ... on QuoteRevisionSaleLineItem {
            id
            type
            description
            quantity
            pimCategory {
              name
            }
            price {
              ... on SalePrice {
                id
                name
                unitCostInCents
              }
            }
            subtotalInCents
          }
          ... on QuoteRevisionServiceLineItem {
            id
            type
            description
            quantity
            subtotalInCents
          }
        }
      }
      validUntil
      createdAt
      updatedAt
      signatureUrl
    }

    # Fetch workspace branding
    getWorkspaceById(id: $workspaceId) {
      id
      name
      logoUrl
      bannerImageUrl
      brandId
    }
  }
`);

function formatPrice(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "$0.00";
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateShort(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type QuoteStatusType = "ACTIVE" | "ACCEPTED" | "REJECTED" | "CANCELLED" | "EXPIRED";

function StatusBadge({ status }: { status: QuoteStatusType }) {
  const config = {
    ACTIVE: {
      label: "Active",
      classes: "bg-blue-100 text-blue-800 border-blue-300",
    },
    ACCEPTED: {
      label: "Accepted",
      classes: "bg-green-100 text-green-800 border-green-300",
    },
    REJECTED: {
      label: "Rejected",
      classes: "bg-red-100 text-red-800 border-red-300",
    },
    CANCELLED: {
      label: "Cancelled",
      classes: "bg-gray-100 text-gray-800 border-gray-300",
    },
    EXPIRED: {
      label: "Expired",
      classes: "bg-orange-100 text-orange-800 border-orange-300",
    },
  };

  const statusConfig = config[status] || config.ACTIVE;

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.classes}`}
    >
      {statusConfig.label}
    </span>
  );
}

function LineItemImage({
  priceId,
  graphqlUrl,
  alt,
}: {
  priceId: string | null | undefined;
  graphqlUrl: string;
  alt: string;
}) {
  const [hasError, setHasError] = React.useState(false);

  if (!priceId || hasError) {
    return (
      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
        <svg
          className="w-5 h-5 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  const url = new URL(graphqlUrl);
  const pathPrefix = url.pathname.replace(/\/graphql$/, "");
  const imageUrl = `${url.protocol}//${url.host}${pathPrefix}/api/images/prices/${priceId}`;

  return (
    <img
      src={imageUrl}
      alt={alt}
      className="w-10 h-10 rounded object-cover flex-shrink-0"
      onError={() => setHasError(true)}
    />
  );
}

export default function SalesQuotePrintPage() {
  const params = useParams();
  const quote_id = params?.quote_id as string;
  const workspace_id = params?.workspace_id as string;
  const { graphqlUrl } = useConfig();

  const { data, loading, error } = useGetQuoteForPrintQuery({
    variables: { id: quote_id, workspaceId: workspace_id },
    fetchPolicy: "no-cache",
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading quote...</p>
      </div>
    );
  }

  if (error || !data?.quoteById) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            {error ? `Error loading quote: ${error.message}` : "Quote not found"}
          </p>
        </div>
      </div>
    );
  }

  const quote = data.quoteById;
  const workspace = data.getWorkspaceById;

  // Calculate totals
  const lineItems = quote.currentRevision?.lineItems || [];
  const totalAmount = lineItems.reduce((sum: number, item: any) => {
    return sum + (item.subtotalInCents || 0);
  }, 0);

  // Group line items by type
  const rentalItems = lineItems.filter((item: any) => item.type === "RENTAL");
  const saleItems = lineItems.filter((item: any) => item.type === "SALE");
  const serviceItems = lineItems.filter((item: any) => item.type === "SERVICE");

  // Get brand primary color or use default
  const primaryColor = "#1e40af"; // Default blue

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
          }

          .avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          table {
            page-break-inside: auto !important;
          }

          thead {
            display: table-header-group !important;
          }

          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }

        @media screen {
          .print-container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 20mm;
          }
        }
      `}</style>

      <div className="print-container bg-white">
        {/* Header with Logo and Title */}
        <div className="avoid-break mb-4">
          <div className="flex items-start justify-between mb-3">
            {/* Logo */}
            {workspace?.logoUrl && (
              <div className="w-24 h-12">
                <img
                  src={workspace.logoUrl}
                  alt={workspace.name || "Company Logo"}
                  className="h-full w-full object-contain object-left"
                />
              </div>
            )}

            {/* Title and Status */}
            <div className="text-right">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight mb-1">Quote</h1>
              <div className="flex items-center justify-end gap-2">
                <StatusBadge status={quote.status as QuoteStatusType} />
              </div>
            </div>
          </div>

          {/* Quote Number and Revision */}
          <div className="border-t border-b border-gray-200 py-2">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-600">Quote Number</p>
                <p className="text-sm font-semibold text-gray-900">{quote.id}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600">Revision</p>
                <p className="text-sm font-semibold text-gray-900">
                  #{quote.currentRevision?.revisionNumber || 1}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information Grid */}
        <div className="avoid-break grid grid-cols-3 gap-4 mb-5">
          {/* From */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              From
            </h3>
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-gray-900">{workspace?.name || "—"}</p>
            </div>
          </div>

          {/* To */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              To
            </h3>
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-gray-900">
                {quote.sellersBuyerContact?.name || "—"}
              </p>
              {quote.sellersBuyerContact?.__typename === "PersonContact" &&
                quote.sellersBuyerContact.business?.name && (
                  <p className="text-xs text-gray-600">{quote.sellersBuyerContact.business.name}</p>
                )}
              {quote.sellersBuyerContact?.__typename === "BusinessContact" &&
                quote.sellersBuyerContact.address && (
                  <p className="text-xs text-gray-600">{quote.sellersBuyerContact.address}</p>
                )}
              {quote.sellersBuyerContact?.__typename === "PersonContact" &&
                quote.sellersBuyerContact.email && (
                  <p className="text-xs text-gray-600">{quote.sellersBuyerContact.email}</p>
                )}
              {quote.sellersBuyerContact?.phone && (
                <p className="text-xs text-gray-600">{quote.sellersBuyerContact.phone}</p>
              )}
            </div>
          </div>

          {/* Details */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Details
            </h3>
            <div className="space-y-1">
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="text-xs font-medium text-gray-900">
                  {formatDateShort(quote.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Valid Until</p>
                <p className="text-xs font-medium text-gray-900">
                  {formatDateShort(quote.validUntil)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Rental Items */}
        {rentalItems.length > 0 && (
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Rental Items</h2>
            <div className="border border-gray-200 rounded overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-12"></th>
                    <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      End Date
                    </th>
                    <th className="px-2 py-1.5 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-2 py-1.5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Rate/Day
                    </th>
                    <th className="px-2 py-1.5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {rentalItems.map((item: any, idx: number) => (
                    <tr key={item.id || idx} className="hover:bg-gray-50">
                      <td className="px-2 py-1.5">
                        <LineItemImage
                          priceId={item.price?.id}
                          graphqlUrl={graphqlUrl}
                          alt={item.description || "Product image"}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <p className="text-xs font-medium text-gray-900">{item.description}</p>
                        {item.pimCategory && (
                          <p className="text-xs text-gray-500">{item.pimCategory.name}</p>
                        )}
                      </td>
                      <td className="px-2 py-1.5 text-xs text-gray-600">
                        {formatDateShort(item.rentalStartDate)}
                      </td>
                      <td className="px-2 py-1.5 text-xs text-gray-600">
                        {formatDateShort(item.rentalEndDate)}
                      </td>
                      <td className="px-2 py-1.5 text-center text-xs text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-2 py-1.5 text-right text-xs text-gray-900">
                        {item.price?.__typename === "RentalPrice"
                          ? formatPrice(item.price.pricePerDayInCents)
                          : "—"}
                      </td>
                      <td className="px-2 py-1.5 text-right text-xs font-semibold text-gray-900">
                        {formatPrice(item.subtotalInCents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sale Items */}
        {saleItems.length > 0 && (
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Sale Items</h2>
            <div className="border border-gray-200 rounded overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-12"></th>
                    <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-2 py-1.5 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-2 py-1.5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-2 py-1.5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {saleItems.map((item: any, idx: number) => (
                    <tr key={item.id || idx} className="hover:bg-gray-50">
                      <td className="px-2 py-1.5">
                        <LineItemImage
                          priceId={item.price?.id}
                          graphqlUrl={graphqlUrl}
                          alt={item.description || "Product image"}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <p className="text-xs font-medium text-gray-900">{item.description}</p>
                        {item.pimCategory && (
                          <p className="text-xs text-gray-500">{item.pimCategory.name}</p>
                        )}
                      </td>
                      <td className="px-2 py-1.5 text-center text-xs text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-2 py-1.5 text-right text-xs text-gray-900">
                        {item.price?.__typename === "SalePrice"
                          ? formatPrice(item.price.unitCostInCents)
                          : "—"}
                      </td>
                      <td className="px-2 py-1.5 text-right text-xs font-semibold text-gray-900">
                        {formatPrice(item.subtotalInCents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Service Items */}
        {serviceItems.length > 0 && (
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Service Items</h2>
            <div className="border border-gray-200 rounded overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-2 py-1.5 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-2 py-1.5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {serviceItems.map((item: any, idx: number) => (
                    <tr key={item.id || idx} className="hover:bg-gray-50">
                      <td className="px-2 py-1.5">
                        <p className="text-xs font-medium text-gray-900">{item.description}</p>
                      </td>
                      <td className="px-2 py-1.5 text-center text-xs text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-2 py-1.5 text-right text-xs font-semibold text-gray-900">
                        {formatPrice(item.subtotalInCents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* No Items Message */}
        {lineItems.length === 0 && (
          <div className="mb-5">
            <div className="border border-gray-200 rounded p-6 text-center">
              <p className="text-sm text-gray-500">No items in this quote</p>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="avoid-break flex justify-end">
          <div className="w-64 space-y-2">
            <div className="border-t-2 border-gray-300 pt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-900">Total</span>
                <span className="text-lg font-bold text-gray-900">{formatPrice(totalAmount)}</span>
              </div>
            </div>
            <div className="text-xs text-gray-600 text-right">
              Valid until {formatDate(quote.validUntil)}
            </div>
          </div>
        </div>

        {/* Signature Block - Only show for accepted quotes */}
        {quote.status === "ACCEPTED" && quote.signatureUrl && (
          <div className="avoid-break mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-end">
              <div className="w-80">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Authorized Signature
                </h3>
                <div className="border border-gray-300 rounded-lg bg-gray-50 p-4 mb-3">
                  <img
                    src={quote.signatureUrl}
                    alt="Authorized signature"
                    className="max-h-24 w-auto mx-auto"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center pb-1 border-b border-gray-300">
                    <span className="text-xs text-gray-900 font-medium">
                      {quote.sellersBuyerContact?.name || "—"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 text-right">
                    Accepted on {formatDate(quote.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-3 border-t border-gray-200 text-center text-xs text-gray-500">
          <p>Quote generated on {formatDate(new Date().toISOString())}</p>
        </div>
      </div>
    </>
  );
}
