"use client";

import { graphql } from "@/graphql";
import { QuoteStatus, ResourceTypes } from "@/graphql/graphql";
import {
  useCreatePdfFromPageAndAttachToQuoteMutation,
  useSalesQuoteDetail_CreateQuoteRevisionMutation,
  useSalesQuoteDetail_GetQuoteByIdQuery,
  useSalesQuoteDetail_UpdateQuoteMutation,
  useSalesQuoteDetail_UpdateQuoteRevisionMutation,
} from "@/graphql/hooks";
import { useNotification } from "@/providers/NotificationProvider";
import { useSelectedWorkspace } from "@/providers/WorkspaceProvider";
import AttachedFilesSection from "@/ui/AttachedFilesSection";
import { GeneratedImage } from "@/ui/GeneratedImage";
import NotesSection from "@/ui/notes/NotesSection";
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
  FileText,
  Info,
  Mail,
  Pencil,
  Phone,
  Plus,
  Printer,
  ShoppingCart,
  Trash2,
  User,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import * as React from "react";
import { AcceptQuoteDialog } from "./components/AcceptQuoteDialog";
import { DeleteQuoteLineItemDialog } from "./components/DeleteQuoteLineItemDialog";
import { EditQuoteLineItemDialog } from "./components/EditQuoteLineItemDialog";
import { PriceHit, PriceSearchModal } from "./components/PriceSearchModal";
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

// GraphQL Mutation for updating quote revision
graphql(`
  mutation SalesQuoteDetail_UpdateQuoteRevision($input: UpdateQuoteRevisionInput!) {
    updateQuoteRevision(input: $input) {
      id
      revisionNumber
      status
      lineItems {
        ... on QuoteRevisionRentalLineItem {
          id
          type
          description
          quantity
          pimCategoryId
          sellersPriceId
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
          sellersPriceId
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
  }
`);

// GraphQL Mutation for creating new quote revision
graphql(`
  mutation SalesQuoteDetail_CreateQuoteRevision($input: CreateQuoteRevisionInput!) {
    createQuoteRevision(input: $input) {
      id
      revisionNumber
      status
    }
  }
`);

// GraphQL Mutation for updating quote
graphql(`
  mutation SalesQuoteDetail_UpdateQuote($input: UpdateQuoteInput!) {
    updateQuote(input: $input) {
      id
      currentRevisionId
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
      intakeFormSubmissionId
      intakeFormSubmission {
        id
        name
        email
        companyName
      }
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
            deliveryMethod
            deliveryLocation
            deliveryNotes
            intakeFormSubmissionLineItemId
            intakeFormSubmissionLineItem {
              id
              description
              quantity
              durationInDays
              rentalStartDate
              rentalEndDate
              deliveryMethod
              deliveryLocation
              deliveryNotes
              customPriceName
              pimCategory {
                name
              }
            }
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
            deliveryMethod
            deliveryLocation
            deliveryNotes
            intakeFormSubmissionLineItemId
            intakeFormSubmissionLineItem {
              id
              description
              quantity
              durationInDays
              rentalStartDate
              rentalEndDate
              deliveryMethod
              deliveryLocation
              deliveryNotes
              customPriceName
              pimCategory {
                name
              }
            }
          }
          ... on QuoteRevisionServiceLineItem {
            id
            type
            description
            quantity
            sellersPriceId
            subtotalInCents
            deliveryMethod
            deliveryLocation
            deliveryNotes
            intakeFormSubmissionLineItemId
            intakeFormSubmissionLineItem {
              id
              description
              quantity
              durationInDays
              rentalStartDate
              rentalEndDate
              deliveryMethod
              deliveryLocation
              deliveryNotes
              customPriceName
            }
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
  const [expandedPriceBreakdown, setExpandedPriceBreakdown] = React.useState<Set<string>>(
    new Set(),
  );
  const [cachekey, setCacheKey] = React.useState(0);
  const { notifySuccess, notifyError } = useNotification();

  // Edit/Delete line item state
  const [editLineItemDialogOpen, setEditLineItemDialogOpen] = React.useState(false);
  const [deleteLineItemDialogOpen, setDeleteLineItemDialogOpen] = React.useState(false);
  const [selectedLineItem, setSelectedLineItem] = React.useState<any>(null);

  // Add line item state
  const [addLineItemPriceSearchOpen, setAddLineItemPriceSearchOpen] = React.useState(false);
  const [addLineItemDialogOpen, setAddLineItemDialogOpen] = React.useState(false);
  const [newLineItemPrice, setNewLineItemPrice] = React.useState<any>(null);

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

  const togglePriceBreakdown = (itemId: string) => {
    setExpandedPriceBreakdown((prev) => {
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

  const [updateQuoteRevision] = useSalesQuoteDetail_UpdateQuoteRevisionMutation();
  const [createQuoteRevision] = useSalesQuoteDetail_CreateQuoteRevisionMutation();
  const [updateQuote] = useSalesQuoteDetail_UpdateQuoteMutation();

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

  // "Edit/Delete Line Items" - available for ACTIVE or REJECTED quotes
  const canEditLineItems = quote?.status === "ACTIVE" || quote?.status === "REJECTED";

  // Handlers for edit/delete line items
  const handleEditLineItem = (item: any) => {
    setSelectedLineItem(item);
    setEditLineItemDialogOpen(true);
  };

  const handleDeleteLineItem = (item: any) => {
    setSelectedLineItem(item);
    setDeleteLineItemDialogOpen(true);
  };

  // Convert line item to mutation input format
  const lineItemToInput = (item: any) => ({
    id: item.id,
    description: item.description,
    type: item.type,
    quantity: item.quantity,
    sellersPriceId: item.sellersPriceId,
    pimCategoryId: item.pimCategoryId,
    ...(item.type === "RENTAL" && {
      rentalStartDate: item.rentalStartDate,
      rentalEndDate: item.rentalEndDate,
    }),
    deliveryLocation: item.deliveryLocation,
    deliveryMethod: item.deliveryMethod,
    deliveryNotes: item.deliveryNotes,
  });

  // Save line items (either update existing revision or create new one)
  const handleSaveLineItems = async (updatedLineItems: any[], createNewRevision: boolean) => {
    const lineItemInputs = updatedLineItems.map(lineItemToInput);

    try {
      if (createNewRevision) {
        // Create new revision when current is SENT
        const newRevisionNumber = (quote?.currentRevision?.revisionNumber || 0) + 1;
        const result = await createQuoteRevision({
          variables: {
            input: {
              quoteId: quote!.id,
              revisionNumber: newRevisionNumber,
              lineItems: lineItemInputs,
            },
          },
        });

        // Update quote to point to new revision
        if (result.data?.createQuoteRevision?.id) {
          await updateQuote({
            variables: {
              input: {
                id: quote!.id,
                currentRevisionId: result.data.createQuoteRevision.id,
              },
            },
          });
        }
        notifySuccess("Line item updated. A new revision has been created.");
      } else {
        // Update existing revision
        await updateQuoteRevision({
          variables: {
            input: {
              id: quote!.currentRevision!.id,
              lineItems: lineItemInputs,
            },
          },
        });
        notifySuccess("Line item updated successfully.");
      }
      refetch();
    } catch (error) {
      console.error("Error saving line items:", error);
      notifyError("Failed to save changes. Please try again.");
      throw error;
    }
  };

  // Delete line item handler
  const handleConfirmDeleteLineItem = async () => {
    if (!selectedLineItem || !quote?.currentRevision?.lineItems) return;

    const updatedLineItems = quote.currentRevision.lineItems.filter(
      (item: any) => item.id !== selectedLineItem.id,
    );
    const createNewRevision = revisionStatus === "SENT";

    await handleSaveLineItems(updatedLineItems, createNewRevision);
  };

  // Add line item - price selected handler
  const handleAddLineItemPriceSelected = (price: PriceHit) => {
    // Create a new line item skeleton based on the selected price
    const newLineItem = {
      id: `new-${Date.now()}`, // Temporary ID
      type: price.priceType as "RENTAL" | "SALE",
      description: price.name || "",
      quantity: 1,
      pimCategoryId: price.pimCategoryId,
      pimCategory: price.pimCategoryName ? { name: price.pimCategoryName } : null,
      sellersPriceId: price.objectID,
      price: {
        id: price.objectID,
        name: price.name || "",
        pricePerDayInCents: price.pricePerDayInCents || undefined,
        pricePerWeekInCents: price.pricePerWeekInCents || undefined,
        pricePerMonthInCents: price.pricePerMonthInCents || undefined,
        unitCostInCents: price.unitCostInCents || undefined,
      },
      rentalStartDate: null,
      rentalEndDate: null,
      subtotalInCents: 0,
      deliveryMethod: null,
      deliveryLocation: null,
      deliveryNotes: null,
    };
    setNewLineItemPrice(newLineItem);
    setAddLineItemPriceSearchOpen(false);
    setAddLineItemDialogOpen(true);
  };

  // Add line item - save handler (adds new item to the list)
  const handleAddLineItemSave = async (updatedLineItems: any[], createNewRevision: boolean) => {
    // The updatedLineItems will contain the new item - save it
    await handleSaveLineItems(updatedLineItems, createNewRevision);
    setAddLineItemDialogOpen(false);
    setNewLineItemPrice(null);
  };

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
                  <button
                    onClick={() => setAddLineItemPriceSearchOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                {quote.currentRevision?.lineItems && quote.currentRevision.lineItems.length > 0 ? (
                  <table className="w-full table-fixed">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="w-[35%] px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="w-[10%] px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="w-[8%] px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Qty
                        </th>
                        <th className="w-[17%] px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="w-[15%] px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Subtotal
                        </th>
                        {canEditLineItems && (
                          <th className="w-[15%] px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Actions
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {quote.currentRevision.lineItems.map((item: any, index: number) => {
                        const isExpanded = expandedItems.has(item.id);
                        const isPriceBreakdownExpanded = expandedPriceBreakdown.has(item.id);
                        const isRental = item.type === "RENTAL";
                        const hasOriginalRequest = !!item.intakeFormSubmissionLineItem;
                        return (
                          <React.Fragment key={item.id || index}>
                            <tr className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                                    {item.sellersPriceId ? (
                                      <GeneratedImage
                                        entity="price"
                                        entityId={item.sellersPriceId}
                                        size="list"
                                        alt={item.description}
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300">
                                        <span className="text-gray-400 text-lg font-medium">?</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                      {item.price?.name || item.description}
                                    </p>
                                    {item.pimCategory && (
                                      <p className="text-xs text-gray-500">
                                        {item.pimCategory.name}
                                      </p>
                                    )}
                                    {hasOriginalRequest && (
                                      <button
                                        onClick={() => toggleItemExpansion(item.id)}
                                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline cursor-pointer whitespace-nowrap"
                                      >
                                        <span>{isExpanded ? "Hide" : "Show"} request</span>
                                        <ChevronDown
                                          className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                        />
                                      </button>
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
                              <td className="px-6 py-4 text-left text-sm text-gray-900">
                                {isRental && item.rentalStartDate && item.rentalEndDate ? (
                                  <div className="flex items-center gap-1 text-xs text-gray-700">
                                    <Calendar className="w-3 h-3 text-gray-400" />
                                    <span>
                                      {formatDate(item.rentalStartDate)} -{" "}
                                      {formatDate(item.rentalEndDate)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {item.sellersPriceId ? (
                                    <>
                                      <span className="text-sm font-medium text-gray-900">
                                        {formatPrice(item.subtotalInCents)}
                                      </span>
                                      {isRental && item.rentalStartDate && item.rentalEndDate && (
                                        <button
                                          onClick={() => togglePriceBreakdown(item.id)}
                                          className="p-1 hover:bg-gray-200 rounded transition-colors cursor-pointer"
                                          title={
                                            isPriceBreakdownExpanded
                                              ? "Hide breakdown"
                                              : "Show breakdown"
                                          }
                                        >
                                          <svg
                                            className={`w-4 h-4 text-gray-600 transition-transform ${isPriceBreakdownExpanded ? "rotate-180" : ""}`}
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
                                    </>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-amber-600 whitespace-nowrap">
                                      <AlertCircle className="w-3 h-3" />
                                      Set price
                                    </span>
                                  )}
                                </div>
                              </td>
                              {canEditLineItems && (
                                <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => handleEditLineItem(item)}
                                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                      title="Edit line item"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteLineItem(item)}
                                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                      title="Delete line item"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                            {isExpanded && hasOriginalRequest && (
                              <tr>
                                <td
                                  colSpan={canEditLineItems ? 6 : 5}
                                  className="px-6 py-4 bg-blue-50"
                                >
                                  <div className="text-xs text-blue-700 font-semibold mb-2 flex items-center gap-1">
                                    <Info className="w-3 h-3" />
                                    Original Request Details
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <p className="text-xs text-gray-500 mb-0.5">Description</p>
                                      <p className="font-medium text-gray-900">
                                        {item.intakeFormSubmissionLineItem.description}
                                      </p>
                                    </div>
                                    {item.intakeFormSubmissionLineItem.customPriceName && (
                                      <div>
                                        <p className="text-xs text-gray-500 mb-0.5">
                                          Requested Price
                                        </p>
                                        <p className="font-medium text-gray-900">
                                          {item.intakeFormSubmissionLineItem.customPriceName}
                                        </p>
                                      </div>
                                    )}
                                    <div>
                                      <p className="text-xs text-gray-500 mb-0.5">Quantity</p>
                                      <p className="font-medium text-gray-900">
                                        {item.intakeFormSubmissionLineItem.quantity}
                                      </p>
                                    </div>
                                    {item.intakeFormSubmissionLineItem.durationInDays > 0 && (
                                      <div>
                                        <p className="text-xs text-gray-500 mb-0.5">Duration</p>
                                        <p className="font-medium text-gray-900">
                                          {item.intakeFormSubmissionLineItem.durationInDays} days
                                        </p>
                                      </div>
                                    )}
                                    {item.intakeFormSubmissionLineItem.rentalStartDate && (
                                      <div>
                                        <p className="text-xs text-gray-500 mb-0.5">
                                          Requested Dates
                                        </p>
                                        <p className="font-medium text-gray-900">
                                          {formatDate(
                                            item.intakeFormSubmissionLineItem.rentalStartDate,
                                          )}{" "}
                                          -{" "}
                                          {formatDate(
                                            item.intakeFormSubmissionLineItem.rentalEndDate,
                                          )}
                                        </p>
                                      </div>
                                    )}
                                    {item.intakeFormSubmissionLineItem.deliveryMethod && (
                                      <div>
                                        <p className="text-xs text-gray-500 mb-0.5">
                                          Delivery Method
                                        </p>
                                        <p className="font-medium text-gray-900">
                                          {item.intakeFormSubmissionLineItem.deliveryMethod}
                                        </p>
                                      </div>
                                    )}
                                    {item.intakeFormSubmissionLineItem.deliveryLocation && (
                                      <div>
                                        <p className="text-xs text-gray-500 mb-0.5">
                                          Delivery Location
                                        </p>
                                        <p className="font-medium text-gray-900">
                                          {item.intakeFormSubmissionLineItem.deliveryLocation}
                                        </p>
                                      </div>
                                    )}
                                    {item.intakeFormSubmissionLineItem.deliveryNotes && (
                                      <div className="col-span-2">
                                        <p className="text-xs text-gray-500 mb-0.5">
                                          Delivery Notes
                                        </p>
                                        <p className="font-medium text-gray-900">
                                          {item.intakeFormSubmissionLineItem.deliveryNotes}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                            {/* Price Breakdown Row */}
                            {isPriceBreakdownExpanded &&
                              isRental &&
                              item.rentalStartDate &&
                              item.rentalEndDate && (
                                <tr>
                                  <td
                                    colSpan={canEditLineItems ? 6 : 5}
                                    className="px-6 py-4 bg-gray-50"
                                  >
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
                        {canEditLineItems && <td />}
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

            {/* Comments and Notes */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Comments & Notes</h2>
              <div className="border-t border-gray-200 pt-4">
                <NotesSection entityId={quote.id} workspaceId={workspaceId} />
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

            {/* Source Submission - show if quote was generated from intake form */}
            {quote.intakeFormSubmissionId && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  Source Submission
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Submission ID</p>
                    <Link
                      href={`/app/${workspaceId}/intake-forms?submissionId=${quote.intakeFormSubmissionId}`}
                      className="text-sm font-mono text-blue-600 hover:underline mt-1 block"
                    >
                      {quote.intakeFormSubmissionId}
                    </Link>
                  </div>
                  {quote.intakeFormSubmission?.name && (
                    <div className="border-t border-gray-200 pt-3">
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Submitted By</p>
                      <p className="text-sm text-gray-900 mt-1">
                        {quote.intakeFormSubmission.name}
                      </p>
                    </div>
                  )}
                  {quote.intakeFormSubmission?.email && (
                    <div className="border-t border-gray-200 pt-3">
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Email</p>
                      <p className="text-sm text-gray-900 mt-1">
                        {quote.intakeFormSubmission.email}
                      </p>
                    </div>
                  )}
                  {quote.intakeFormSubmission?.companyName && (
                    <div className="border-t border-gray-200 pt-3">
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Company</p>
                      <p className="text-sm text-gray-900 mt-1">
                        {quote.intakeFormSubmission.companyName}
                      </p>
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

      {/* Edit Line Item Dialog */}
      {selectedLineItem && quote.currentRevision && (
        <EditQuoteLineItemDialog
          open={editLineItemDialogOpen}
          onClose={() => {
            setEditLineItemDialogOpen(false);
            setSelectedLineItem(null);
          }}
          lineItem={selectedLineItem}
          allLineItems={quote.currentRevision.lineItems as any[]}
          quoteId={quote.id}
          revisionId={quote.currentRevision.id}
          revisionNumber={quote.currentRevision.revisionNumber}
          revisionStatus={quote.currentRevision.status}
          workspaceId={workspaceId}
          onSave={handleSaveLineItems}
        />
      )}

      {/* Delete Line Item Dialog */}
      {selectedLineItem && (
        <DeleteQuoteLineItemDialog
          open={deleteLineItemDialogOpen}
          onClose={() => {
            setDeleteLineItemDialogOpen(false);
            setSelectedLineItem(null);
          }}
          onConfirm={handleConfirmDeleteLineItem}
          lineItemDescription={selectedLineItem.description}
          lineItemType={selectedLineItem.type}
        />
      )}

      {/* Add Line Item - Price Search Modal */}
      <PriceSearchModal
        open={addLineItemPriceSearchOpen}
        onClose={() => setAddLineItemPriceSearchOpen(false)}
        onSelect={handleAddLineItemPriceSelected}
        workspaceId={workspaceId}
      />

      {/* Add Line Item - Details Dialog */}
      {newLineItemPrice && quote?.currentRevision && (
        <EditQuoteLineItemDialog
          open={addLineItemDialogOpen}
          onClose={() => {
            setAddLineItemDialogOpen(false);
            setNewLineItemPrice(null);
          }}
          lineItem={newLineItemPrice}
          allLineItems={[...(quote.currentRevision.lineItems as any[]), newLineItemPrice]}
          quoteId={quote.id}
          revisionId={quote.currentRevision.id}
          revisionNumber={quote.currentRevision.revisionNumber}
          revisionStatus={quote.currentRevision.status}
          workspaceId={workspaceId}
          onSave={handleAddLineItemSave}
          mode="add"
        />
      )}
    </div>
  );
}
