"use client";

import { graphql } from "@/graphql";
import { QuoteStatus, ResourceTypes } from "@/graphql/graphql";
import {
  useCreatePdfFromPageAndAttachToQuoteMutation,
  useSalesQuoteDetail_GetQuoteByIdQuery,
} from "@/graphql/hooks";
import { useNotification } from "@/providers/NotificationProvider";
import { useSelectedWorkspace } from "@/providers/WorkspaceProvider";
import AttachedFilesSection from "@/ui/AttachedFilesSection";
import { GeneratedImage } from "@/ui/GeneratedImage";
import { RentalCalendarView } from "@/ui/sales-quotes/RentalCalendarView";
import { RentalPricingBreakdown } from "@/ui/sales-quotes/RentalPricingBreakdown";
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
  Printer,
  ShoppingCart,
  User,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import * as React from "react";
import { AcceptQuoteDialog } from "./components/AcceptQuoteDialog";
import { SendQuoteDialog } from "./components/SendQuoteDialog";

// GraphQL Mutation for PDF generation
graphql(`
  mutation CreatePdfFromPageAndAttachToQuote(
    $entity_id: String!
    $path: String!
    $file_name: String!
    $workspaceId: String!
  ) {
    createPdfFromPageAndAttachToEntityId(
      entity_id: $entity_id
      path: $path
      file_name: $file_name
      workspaceId: $workspaceId
    ) {
      success
      error_message
    }
  }
`);

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
          employees {
            items {
              id
              name
              email
              role
            }
          }
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
        status
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
  const [sendDialogOpen, setSendDialogOpen] = React.useState(false);
  const [acceptDialogOpen, setAcceptDialogOpen] = React.useState(false);
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set());
  const [cachekey, setCacheKey] = React.useState(0);
  const { notifySuccess, notifyError } = useNotification();

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

  const { data, loading, error, refetch } = useSalesQuoteDetail_GetQuoteByIdQuery({
    variables: { id: quoteId },
    fetchPolicy: "cache-and-network",
  });

  const [createPdf, { loading: pdfLoading, data: pdfData, error: pdfError }] =
    useCreatePdfFromPageAndAttachToQuoteMutation();

  const quote = data?.quoteById;

  // Determine CTA visibility based on quote and revision status
  const isQuoteActive = quote?.status === "ACTIVE";
  const revisionStatus = quote?.currentRevision?.status;
  const hasLineItems = (quote?.currentRevision?.lineItems?.length ?? 0) > 0;

  // "Send Quote" - only available for ACTIVE quotes with DRAFT revisions that have line items
  const canSendQuote = isQuoteActive && revisionStatus === "DRAFT" && hasLineItems;

  // "Accept on Behalf" - only available for ACTIVE quotes with SENT revisions
  const canAcceptQuote = isQuoteActive && revisionStatus === "SENT";

  // "Edit Items" - only available for ACTIVE quotes
  const canEditItems = isQuoteActive;

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
              <button
                onClick={async () => {
                  if (!quote?.id || !workspaceId || !quoteId) return;
                  // Format file name as sales-quote-YYYY-MM-DD
                  const today = new Date();
                  const yyyy = today.getFullYear();
                  const mm = String(today.getMonth() + 1).padStart(2, "0");
                  const dd = String(today.getDate()).padStart(2, "0");
                  const fileName = `sales-quote-${yyyy}-${mm}-${dd}`;

                  try {
                    const result = await createPdf({
                      variables: {
                        entity_id: quote.id,
                        path: `print/sales-quote/${workspaceId}/${quoteId}`,
                        file_name: fileName,
                        workspaceId: workspaceId,
                      },
                    });

                    if (result.data?.createPdfFromPageAndAttachToEntityId?.success) {
                      notifySuccess("PDF generated successfully and added to attached files");
                      setCacheKey((k) => k + 1);
                    } else if (result.data?.createPdfFromPageAndAttachToEntityId?.error_message) {
                      notifyError(result.data.createPdfFromPageAndAttachToEntityId.error_message);
                    }
                  } catch (error) {
                    notifyError("Failed to generate PDF");
                  }
                }}
                disabled={pdfLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Printer className="w-4 h-4" />
                {pdfLoading ? "Generating..." : "Print PDF"}
              </button>
              {canAcceptQuote && (
                <button
                  onClick={() => setAcceptDialogOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Accept on Behalf
                </button>
              )}
              {canSendQuote && (
                <button
                  onClick={() => setSendDialogOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Send Quote
                </button>
              )}
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
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Line Items</h2>
                {canEditItems && (
                  <Link
                    href={`/app/${workspaceId}/sales-quotes/${quoteId}/cart`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Edit Items
                  </Link>
                )}
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
                                      <p className="text-xs text-gray-500">
                                        {item.pimCategory.name}
                                      </p>
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
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <span className="text-sm font-medium text-gray-900">
                                    {formatPrice(item.subtotalInCents)}
                                  </span>
                                  {isRental && item.rentalStartDate && item.rentalEndDate && (
                                    <button
                                      onClick={() => toggleItemExpansion(item.id)}
                                      className="p-1 hover:bg-gray-200 rounded transition-colors cursor-pointer"
                                      title={isExpanded ? "Hide breakdown" : "Show breakdown"}
                                    >
                                      <svg
                                        className={`w-4 h-4 text-gray-600 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M19 9l-7 7-7-7"
                                        />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                            {isRental &&
                              isExpanded &&
                              item.rentalStartDate &&
                              item.rentalEndDate && (
                                <tr>
                                  <td colSpan={5} className="px-6 py-4 bg-gray-50">
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
                  <div className="px-6 py-16 text-center">
                    <div className="max-w-md mx-auto">
                      <div className="mb-4">
                        <ShoppingCart className="w-16 h-16 mx-auto text-gray-300" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No items in this quote
                      </h3>
                      <p className="text-sm text-gray-600 mb-6">
                        Add products, rentals, or services to build your quote. Items you add will
                        appear here with pricing and delivery details.
                      </p>
                      {canEditItems && (
                        <Link
                          href={`/app/${workspaceId}/sales-quotes/${quoteId}/cart`}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          Add Items to Quote
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* File Upload Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Attached Files</h2>
              <div className="border-t border-gray-200 pt-4">
                <AttachedFilesSection
                  key={`files-${cachekey}`}
                  entityId={quote.id}
                  entityType={ResourceTypes.ErpQuote}
                />
              </div>
            </div>
            {/* Rental Calendar */}
            <RentalCalendarView quoteId={quoteId} />
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

      {/* Accept Quote Dialog */}
      <AcceptQuoteDialog
        open={acceptDialogOpen}
        onClose={() => setAcceptDialogOpen(false)}
        quoteId={quote.id}
        onSuccess={() => refetch()}
      />

      {/* Send Quote Dialog */}
      <SendQuoteDialog
        open={sendDialogOpen}
        onClose={() => setSendDialogOpen(false)}
        quote={quote}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
