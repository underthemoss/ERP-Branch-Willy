"use client";

import { graphql } from "@/graphql";
import { QuoteStatus } from "@/graphql/graphql";
import { useSalesQuoteDetail_GetQuoteByIdQuery } from "@/graphql/hooks";
import { useSelectedWorkspace } from "@/providers/WorkspaceProvider";
import { GeneratedImage } from "@/ui/GeneratedImage";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDot,
  Clock,
  DollarSign,
  Mail,
  Phone,
  ShoppingCart,
  User,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import * as React from "react";

// GraphQL Query
graphql(`
  query SalesQuoteDetail_GetQuoteById($id: String!) {
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
          }
        }
        ... on BusinessContact {
          id
          contactType
          name
          phone
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
            pimCategoryId
            pimCategory {
              name
            }
            sellersPriceId
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
            pimCategoryId
            pimCategory {
              name
            }
            sellersPriceId
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
            sellersPriceId
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

type QuoteStatusType = "ACTIVE" | "ACCEPTED" | "REJECTED" | "CANCELLED" | "EXPIRED";

function formatPrice(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "$0.00";
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StatusBadge({ status }: { status: QuoteStatusType }) {
  const config = {
    ACTIVE: {
      icon: <CircleDot className="w-3 h-3" />,
      label: "Active",
      classes: "bg-blue-100 text-blue-700 border-blue-200",
    },
    ACCEPTED: {
      icon: <CheckCircle2 className="w-3 h-3" />,
      label: "Accepted",
      classes: "bg-green-100 text-green-700 border-green-200",
    },
    REJECTED: {
      icon: <AlertCircle className="w-3 h-3" />,
      label: "Rejected",
      classes: "bg-red-100 text-red-700 border-red-200",
    },
    CANCELLED: {
      icon: <AlertCircle className="w-3 h-3" />,
      label: "Cancelled",
      classes: "bg-gray-100 text-gray-700 border-gray-200",
    },
    EXPIRED: {
      icon: <Clock className="w-3 h-3" />,
      label: "Expired",
      classes: "bg-orange-100 text-orange-700 border-orange-200",
    },
  };

  const statusConfig = config[status] || config.ACTIVE;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${statusConfig.classes}`}
    >
      {statusConfig.icon}
      {statusConfig.label}
    </span>
  );
}

export default function SalesQuoteDetailPage() {
  const params = useParams();
  const quoteId = params?.quote_id as string;
  const workspaceId = params?.workspace_id as string;
  const [isDescriptionExpanded, setIsDescriptionExpanded] = React.useState(false);

  const { data, loading, error } = useSalesQuoteDetail_GetQuoteByIdQuery({
    variables: { id: quoteId },
    fetchPolicy: "cache-and-network",
  });

  const quote = data?.quoteById;

  // Calculate totals
  const totalAmount = React.useMemo(() => {
    if (!quote?.currentRevision?.lineItems) return 0;
    return quote.currentRevision.lineItems.reduce((sum, item) => {
      return sum + (item.subtotalInCents || 0);
    }, 0);
  }, [quote?.currentRevision?.lineItems]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="container mx-auto max-w-7xl">
          <p className="text-gray-600">Loading quote...</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="container mx-auto max-w-7xl">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">
              {error ? `Error loading quote: ${error.message}` : "Quote not found"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-7xl px-4 py-6">
        {/* Back Button */}
        <Link
          href={`/app/${workspaceId}/sales-quotes`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Quotes</span>
        </Link>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Quote Details</h1>
              <p className="text-gray-600 font-mono text-sm">{quote.id}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/app/${workspaceId}/sales-quotes/${quoteId}/cart`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                Edit quote items
              </Link>
              <StatusBadge status={quote.status as QuoteStatusType} />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 text-green-600 p-3 rounded-lg">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">{formatPrice(totalAmount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Valid Until</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDate(quote.validUntil)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 text-purple-600 p-3 rounded-lg">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Created</p>
                <p className="text-lg font-semibold text-gray-900">{formatDate(quote.createdAt)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-4">
              <div className="bg-amber-100 text-amber-600 p-3 rounded-lg">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Revision</p>
                <p className="text-2xl font-bold text-gray-900">
                  #{quote.currentRevision?.revisionNumber || 1}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Line Items */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Line Items</h2>
              </div>
              <div className="overflow-x-auto">
                {quote.currentRevision?.lineItems && quote.currentRevision.lineItems.length > 0 ? (
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Qty
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {quote.currentRevision.lineItems.map((item: any, index: number) => (
                        <tr key={item.id || index} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {item.sellersPriceId && (
                                <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                                  <GeneratedImage
                                    entity="price"
                                    entityId={item.sellersPriceId}
                                    size="list"
                                    alt={item.description}
                                  />
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {item.description}
                                </p>
                                {item.pimCategory && (
                                  <p className="text-xs text-gray-500">{item.pimCategory.name}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {item.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-gray-900">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-gray-900">
                            {item.type === "RENTAL" && item.price
                              ? formatPrice(item.price.pricePerDayInCents)
                              : item.type === "SALE" && item.price
                                ? formatPrice(item.price.unitCostInCents)
                                : "—"}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                            {formatPrice(item.subtotalInCents)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-4 text-right text-sm font-semibold text-gray-900"
                        >
                          Total:
                        </td>
                        <td className="px-6 py-4 text-right text-lg font-bold text-gray-900">
                          {formatPrice(totalAmount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                ) : (
                  <div className="px-6 py-12 text-center text-gray-500">
                    No line items added yet
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-6">
            {/* Buyer Contact */}
            {quote.sellersBuyerContact && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-600" />
                  Buyer Contact
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {quote.sellersBuyerContact.__typename === "PersonContact"
                        ? quote.sellersBuyerContact.name
                        : quote.sellersBuyerContact.__typename === "BusinessContact"
                          ? quote.sellersBuyerContact.name
                          : "Unknown"}
                    </p>
                    {quote.sellersBuyerContact.__typename === "PersonContact" &&
                      quote.sellersBuyerContact.business?.name && (
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <Building2 className="w-3 h-3" />
                          {quote.sellersBuyerContact.business.name}
                        </p>
                      )}
                  </div>
                  {quote.sellersBuyerContact.__typename === "PersonContact" && (
                    <>
                      {quote.sellersBuyerContact.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          <a
                            href={`mailto:${quote.sellersBuyerContact.email}`}
                            className="hover:text-blue-600"
                          >
                            {quote.sellersBuyerContact.email}
                          </a>
                        </div>
                      )}
                      {quote.sellersBuyerContact.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          <a
                            href={`tel:${quote.sellersBuyerContact.phone}`}
                            className="hover:text-blue-600"
                          >
                            {quote.sellersBuyerContact.phone}
                          </a>
                        </div>
                      )}
                    </>
                  )}
                  {quote.sellersBuyerContact.__typename === "BusinessContact" &&
                    quote.sellersBuyerContact.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <a
                          href={`tel:${quote.sellersBuyerContact.phone}`}
                          className="hover:text-blue-600"
                        >
                          {quote.sellersBuyerContact.phone}
                        </a>
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* Project Information */}
            {quote.sellersProject && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-gray-600" />
                  Project
                </h3>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900">{quote.sellersProject.name}</p>
                  {quote.sellersProject.project_code && (
                    <p className="text-xs text-gray-600 font-mono">
                      {quote.sellersProject.project_code}
                    </p>
                  )}
                  {quote.sellersProject.description && (
                    <div className="mt-2">
                      <div className="relative">
                        <p
                          className={`text-sm text-gray-600 whitespace-pre-wrap ${
                            isDescriptionExpanded ? "" : "max-h-32 overflow-hidden"
                          }`}
                        >
                          {quote.sellersProject.description}
                        </p>
                        {!isDescriptionExpanded && (
                          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                        )}
                      </div>
                      <button
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                      >
                        {isDescriptionExpanded ? (
                          <>
                            <ChevronUp className="w-3 h-3" />
                            Show less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3 h-3" />
                            Show more
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Quote ID</p>
                  <p className="text-sm font-mono text-gray-900 mt-1">{quote.id}</p>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Created</p>
                  <p className="text-sm text-gray-900 mt-1">{formatDate(quote.createdAt)}</p>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Last Updated</p>
                  <p className="text-sm text-gray-900 mt-1">{formatDate(quote.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
