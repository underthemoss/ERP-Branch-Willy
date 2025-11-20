"use client";

import { graphql } from "@/graphql";
import {
  useAcceptQuoteMutation,
  useBuyerQuoteView_GetQuoteByIdQuery,
  useRejectQuoteMutation,
} from "@/graphql/hooks";
import { useNotification } from "@/providers/NotificationProvider";
import { GeneratedImage } from "@/ui/GeneratedImage";
import { RentalPricingBreakdown } from "@/ui/sales-quotes/RentalPricingBreakdown";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  Mail,
  Phone,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

// GraphQL Queries and Mutations
graphql(`
  query BuyerQuoteView_GetQuoteById($id: String!) {
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

graphql(`
  mutation AcceptQuote($input: AcceptQuoteInput!) {
    acceptQuote(input: $input) {
      quote {
        id
        status
        updatedAt
      }
      salesOrder {
        id
        sales_order_number
      }
    }
  }
`);

graphql(`
  mutation RejectQuote($quoteId: String!) {
    rejectQuote(quoteId: $quoteId) {
      id
      status
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
    month: "long",
    day: "numeric",
  });
}

function StatusBadge({ status }: { status: QuoteStatusType }) {
  const config = {
    ACTIVE: {
      icon: <Clock className="w-4 h-4" />,
      label: "Awaiting Your Response",
      classes: "bg-blue-100 text-blue-700 border-blue-200",
    },
    ACCEPTED: {
      icon: <CheckCircle2 className="w-4 h-4" />,
      label: "Accepted",
      classes: "bg-green-100 text-green-700 border-green-200",
    },
    REJECTED: {
      icon: <XCircle className="w-4 h-4" />,
      label: "Rejected",
      classes: "bg-red-100 text-red-700 border-red-200",
    },
    CANCELLED: {
      icon: <AlertCircle className="w-4 h-4" />,
      label: "Cancelled",
      classes: "bg-gray-100 text-gray-700 border-gray-200",
    },
    EXPIRED: {
      icon: <Clock className="w-4 h-4" />,
      label: "Expired",
      classes: "bg-orange-100 text-orange-700 border-orange-200",
    },
  };

  const statusConfig = config[status] || config.ACTIVE;

  return (
    <span
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-base font-medium border ${statusConfig.classes}`}
    >
      {statusConfig.icon}
      {statusConfig.label}
    </span>
  );
}

function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  confirmColor,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  confirmColor: "green" | "red";
  loading: boolean;
}) {
  if (!open) return null;

  const colorClasses = {
    green: "bg-green-600 hover:bg-green-700 focus:ring-green-500",
    red: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-30 transition-opacity"
          onClick={onClose}
        />

        {/* Dialog */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-6">{message}</p>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${colorClasses[confirmColor]}`}
            >
              {loading ? "Processing..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BuyerQuoteViewPage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params?.quote_id as string;
  const { notifySuccess, notifyError } = useNotification();

  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set());
  const [acceptDialogOpen, setAcceptDialogOpen] = React.useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false);

  const { data, loading, error, refetch } = useBuyerQuoteView_GetQuoteByIdQuery({
    variables: { id: quoteId },
    fetchPolicy: "cache-and-network",
  });

  const [acceptQuote, { loading: accepting }] = useAcceptQuoteMutation();
  const [rejectQuote, { loading: rejecting }] = useRejectQuoteMutation();

  const quote = data?.quoteById;

  const toggleItemExpansion = (itemId: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleAccept = async () => {
    try {
      await acceptQuote({
        variables: {
          input: {
            quoteId,
          },
        },
      });
      notifySuccess("Quote accepted successfully!");
      setAcceptDialogOpen(false);
      refetch();
    } catch (err: any) {
      notifyError(err.message || "Failed to accept quote");
    }
  };

  const handleReject = async () => {
    try {
      await rejectQuote({
        variables: { quoteId },
      });
      notifySuccess("Quote rejected");
      setRejectDialogOpen(false);
      refetch();
    } catch (err: any) {
      notifyError(err.message || "Failed to reject quote");
    }
  };

  // Calculate totals
  const totalAmount = React.useMemo(() => {
    if (!quote?.currentRevision?.lineItems) return 0;
    return quote.currentRevision.lineItems.reduce((sum: number, item: any) => {
      return sum + (item.subtotalInCents || 0);
    }, 0);
  }, [quote?.currentRevision?.lineItems]);

  // Check if quote is expired
  const isExpired = React.useMemo(() => {
    if (!quote?.currentRevision?.validUntil) return false;
    return new Date() > new Date(quote.currentRevision.validUntil);
  }, [quote?.currentRevision?.validUntil]);

  const canRespond = quote && quote.status === "ACTIVE" && !isExpired;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading quote...</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg border border-red-200 p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Quote Not Found</h2>
          <p className="text-gray-600">
            {error
              ? "There was an error loading this quote. Please check your link and try again."
              : "This quote does not exist or you don't have permission to view it."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto max-w-4xl px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Your Quote</h1>
              <p className="text-sm text-gray-600 mt-1">Received {formatDate(quote.createdAt)}</p>
            </div>
            <StatusBadge status={quote.status as QuoteStatusType} />
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Expiration Warning */}
        {isExpired && quote.status === "ACTIVE" && (
          <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-orange-900">Quote Expired</h3>
              <p className="text-sm text-orange-800">
                This quote expired on {formatDate(quote.currentRevision?.validUntil)}. Please
                contact the seller if you would still like to proceed.
              </p>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {quote.status === "ACCEPTED" && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900">Quote Accepted</h3>
              <p className="text-sm text-green-800">
                You accepted this quote on {formatDate(quote.updatedAt)}. The seller will contact
                you to proceed with the order.
              </p>
            </div>
          </div>
        )}

        {quote.status === "REJECTED" && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Quote Rejected</h3>
              <p className="text-sm text-red-800">
                You rejected this quote on {formatDate(quote.updatedAt)}.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {canRespond && (
          <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ready to decide?</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setAcceptDialogOpen(true)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                <ThumbsUp className="w-5 h-5" />
                Accept Quote
              </button>
              <button
                onClick={() => setRejectDialogOpen(true)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg font-medium transition-colors"
              >
                <ThumbsDown className="w-5 h-5" />
                Decline Quote
              </button>
            </div>
            {quote.currentRevision?.validUntil && (
              <p className="text-sm text-gray-600 mt-4 text-center">
                Valid until {formatDate(quote.currentRevision.validUntil)}
              </p>
            )}
          </div>
        )}

        {/* Quote Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Quote Summary</h2>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-3xl font-bold text-gray-900">{formatPrice(totalAmount)}</p>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Items</h2>
          </div>
          <div className="overflow-x-auto">
            {quote.currentRevision?.lineItems && quote.currentRevision.lineItems.length > 0 ? (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Description
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
                  {quote.currentRevision.lineItems.map((item: any, index: number) => {
                    const isExpanded = expandedItems.has(item.id);
                    const isRental = item.type === "RENTAL";
                    return (
                      <React.Fragment key={item.id || index}>
                        <tr className="hover:bg-gray-50">
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
                                {isRental && item.rentalStartDate && item.rentalEndDate && (
                                  <div className="flex items-center gap-1 mt-1 text-xs text-blue-600">
                                    <Calendar className="w-3 h-3" />
                                    <span>
                                      {formatDate(item.rentalStartDate)} -{" "}
                                      {formatDate(item.rentalEndDate)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
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
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-sm font-medium text-gray-900">
                                {formatPrice(item.subtotalInCents)}
                              </span>
                              {isRental && item.rentalStartDate && item.rentalEndDate && (
                                <button
                                  onClick={() => toggleItemExpansion(item.id)}
                                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                                  title={isExpanded ? "Hide breakdown" : "Show breakdown"}
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-gray-600" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-600" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {isRental && isExpanded && item.rentalStartDate && item.rentalEndDate && (
                          <tr>
                            <td colSpan={4} className="px-6 py-4 bg-gray-50">
                              <div className="max-w-md ml-auto">
                                <RentalPricingBreakdown
                                  priceId={item.sellersPriceId}
                                  startDate={new Date(item.rentalStartDate)}
                                  endDate={new Date(item.rentalEndDate)}
                                  compact={false}
                                  showSavings={false}
                                  isExpanded={true}
                                />
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-4 text-right text-base font-semibold text-gray-900"
                    >
                      Total:
                    </td>
                    <td className="px-6 py-4 text-right text-xl font-bold text-gray-900">
                      {formatPrice(totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <div className="px-6 py-16 text-center text-gray-500">No items in this quote</div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto max-w-4xl px-4 py-6">
          <p className="text-sm text-gray-600 text-center">
            Questions about this quote? Please contact the seller directly.
          </p>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={acceptDialogOpen}
        onClose={() => setAcceptDialogOpen(false)}
        onConfirm={handleAccept}
        title="Accept Quote"
        message="Are you sure you want to accept this quote? The seller will be notified and will proceed with your order."
        confirmText="Yes, Accept"
        confirmColor="green"
        loading={accepting}
      />

      <ConfirmDialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        onConfirm={handleReject}
        title="Decline Quote"
        message="Are you sure you want to decline this quote? This action cannot be undone."
        confirmText="Yes, Decline"
        confirmColor="red"
        loading={rejecting}
      />
    </div>
  );
}
