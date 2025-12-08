"use client";

import { graphql } from "@/graphql";
import { useQuoteDisplay_GetQuoteQuery } from "@/graphql/hooks";
import { Loader2 } from "lucide-react";
import * as React from "react";

// GraphQL Query
graphql(`
  query QuoteDisplay_GetQuote($id: String!) {
    quoteById(id: $id) {
      id
      status
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
      sellersProject {
        id
        name
        project_code
        description
      }
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
    }
  }
`);

interface QuoteDisplayProps {
  quoteId: string;
}

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

export function QuoteDisplay({ quoteId }: QuoteDisplayProps) {
  const { data, loading, error } = useQuoteDisplay_GetQuoteQuery({
    variables: { id: quoteId },
    fetchPolicy: "cache-and-network",
  });

  if (loading) {
    return (
      <div className="p-6 sm:p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading quote...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.quoteById) {
    return (
      <div className="p-6 sm:p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-sm text-red-600">Failed to load quote</p>
        </div>
      </div>
    );
  }

  const quote = data.quoteById;
  const lineItems = quote.currentRevision?.lineItems || [];
  const totalAmount = lineItems.reduce((sum: number, item: any) => {
    return sum + (item.subtotalInCents || 0);
  }, 0);

  // Group line items by type
  const rentalItems = lineItems.filter((item: any) => item.type === "RENTAL");
  const saleItems = lineItems.filter((item: any) => item.type === "SALE");
  const serviceItems = lineItems.filter((item: any) => item.type === "SERVICE");

  return (
    <div className="p-6 sm:p-8">
      {/* Header */}
      <div className="mb-6 pb-6 border-b border-slate-200">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Quote</h2>
            <p className="text-sm text-slate-500 mt-1">#{quote.id}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Revision</p>
            <p className="text-lg font-semibold text-slate-900">
              #{quote.currentRevision?.revisionNumber || 1}
            </p>
          </div>
        </div>
      </div>

      {/* Contact Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Customer */}
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Customer
          </h3>
          <div className="space-y-1">
            <p className="text-base font-semibold text-slate-900">
              {quote.sellersBuyerContact?.name || "—"}
            </p>
            {quote.sellersBuyerContact?.__typename === "PersonContact" &&
              quote.sellersBuyerContact.business?.name && (
                <p className="text-sm text-slate-600">{quote.sellersBuyerContact.business.name}</p>
              )}
            {quote.sellersBuyerContact?.__typename === "BusinessContact" &&
              quote.sellersBuyerContact.address && (
                <p className="text-sm text-slate-600">{quote.sellersBuyerContact.address}</p>
              )}
            {quote.sellersBuyerContact?.__typename === "PersonContact" &&
              quote.sellersBuyerContact.email && (
                <p className="text-sm text-slate-600">{quote.sellersBuyerContact.email}</p>
              )}
            {quote.sellersBuyerContact?.phone && (
              <p className="text-sm text-slate-600">{quote.sellersBuyerContact.phone}</p>
            )}
          </div>
        </div>

        {/* Details */}
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Details
          </h3>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-slate-500">Date</p>
              <p className="text-sm font-medium text-slate-900">
                {formatDateShort(quote.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Valid Until</p>
              <p className="text-sm font-medium text-slate-900">
                {formatDateShort(quote.validUntil)}
              </p>
            </div>
            {quote.sellersProject && (
              <div>
                <p className="text-xs text-slate-500">Project</p>
                <p className="text-sm font-medium text-slate-900">
                  {quote.sellersProject.name} ({quote.sellersProject.project_code})
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rental Items */}
      {rentalItems.length > 0 && (
        <div className="mb-6">
          <h3 className="text-base font-semibold text-slate-900 mb-3">Rental Items</h3>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    End Date
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rentalItems.map((item: any, idx: number) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-900">{item.description}</p>
                      {item.pimCategory && (
                        <p className="text-xs text-slate-500">{item.pimCategory.name}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatDateShort(item.rentalStartDate)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatDateShort(item.rentalEndDate)}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-slate-900">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
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
        <div className="mb-6">
          <h3 className="text-base font-semibold text-slate-900 mb-3">Sale Items</h3>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {saleItems.map((item: any, idx: number) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-900">{item.description}</p>
                      {item.pimCategory && (
                        <p className="text-xs text-slate-500">{item.pimCategory.name}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-slate-900">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-900">
                      {item.price?.__typename === "SalePrice"
                        ? formatPrice(item.price.unitCostInCents)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
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
        <div className="mb-6">
          <h3 className="text-base font-semibold text-slate-900 mb-3">Service Items</h3>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {serviceItems.map((item: any, idx: number) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-900">{item.description}</p>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-slate-900">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
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
        <div className="mb-6">
          <div className="border border-slate-200 rounded-lg p-8 text-center">
            <p className="text-sm text-slate-500">No items in this quote</p>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="flex justify-end">
        <div className="w-full sm:w-80 space-y-3">
          <div className="border-t-2 border-slate-300 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-base font-semibold text-slate-900">Total</span>
              <span className="text-2xl font-bold text-slate-900">{formatPrice(totalAmount)}</span>
            </div>
          </div>
          <div className="text-sm text-slate-600 text-right">
            Valid until {formatDate(quote.validUntil)}
          </div>
        </div>
      </div>
    </div>
  );
}
