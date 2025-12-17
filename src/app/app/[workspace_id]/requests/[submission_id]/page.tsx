"use client";

import { GeneratedImage } from "@/ui/GeneratedImage";
import {
  useGetIntakeFormSubmissionByIdQuery,
  useListIntakeFormSubmissionLineItemsQuery,
} from "@/ui/intake-forms/api";
import ConvertSubmissionDialog from "@/ui/intake-forms/ConvertSubmissionDialog";
import { GenerateQuoteDialog } from "@/ui/intake-forms/GenerateQuoteDialog";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle,
  ChevronDown,
  Clock,
  DollarSign,
  FileText,
  Mail,
  Package,
  Phone,
  ShoppingCart,
  User,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

export default function SubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspace_id as string;
  const submissionId = params.submission_id as string;

  const [convertDialogOpen, setConvertDialogOpen] = React.useState(false);
  const [generateQuoteDialogOpen, setGenerateQuoteDialogOpen] = React.useState(false);
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set());

  // Fetch submission details
  const { data, loading, error, refetch } = useGetIntakeFormSubmissionByIdQuery({
    variables: { id: submissionId },
    fetchPolicy: "cache-and-network",
  });

  // Fetch line items
  const { data: lineItemsData, loading: lineItemsLoading } =
    useListIntakeFormSubmissionLineItemsQuery({
      variables: { submissionId },
      fetchPolicy: "cache-and-network",
    });

  const submission = data?.getIntakeFormSubmissionById;
  const lineItems = lineItemsData?.listIntakeFormSubmissionLineItems || [];

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

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="container mx-auto max-w-7xl">
          <p className="text-gray-600">Loading submission...</p>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="container mx-auto max-w-7xl">
          <p className="text-red-600">Error loading submission: {error?.message || "Not found"}</p>
        </div>
      </div>
    );
  }

  const hasQuote = !!submission.quote?.id;
  const hasSalesOrder = !!submission.salesOrder?.id;
  const totalInDollars = submission.totalInCents
    ? (submission.totalInCents / 100).toFixed(2)
    : "0.00";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-7xl px-4 py-6">
        {/* Back Navigation */}
        <button
          onClick={() => router.push(`/app/${workspaceId}/requests`)}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Requests
        </button>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">Request Details</h1>
              <StatusBadge status={submission.status} />
            </div>
            <p className="font-mono text-sm text-gray-600">{submission.id}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {!hasSalesOrder && (
              <button
                onClick={() => setConvertDialogOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                Convert to Order
              </button>
            )}
            {!hasQuote && (
              <button
                onClick={() => setGenerateQuoteDialogOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                Generate Quote
              </button>
            )}
          </div>
        </div>

        {/* Summary Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3 mb-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Submitted:</span>
              <span className="text-sm font-medium text-gray-900">
                {formatDate(submission.submittedAt || submission.createdAt)}
              </span>
            </div>
            <div className="h-4 w-px bg-gray-200 hidden sm:block" />
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Items:</span>
              <span className="text-sm font-medium text-gray-900">{lineItems.length}</span>
            </div>
            <div className="h-4 w-px bg-gray-200 hidden sm:block" />
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Total:</span>
              <span className="text-sm font-medium text-gray-900">${totalInDollars}</span>
            </div>
            {hasQuote && (
              <>
                <div className="h-4 w-px bg-gray-200 hidden sm:block" />
                <Link
                  href={`/app/${workspaceId}/sales-quotes/${submission.quote?.id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  View Quote
                </Link>
              </>
            )}
            {hasSalesOrder && (
              <>
                <div className="h-4 w-px bg-gray-200 hidden sm:block" />
                <Link
                  href={`/app/${workspaceId}/sales-orders/${submission.salesOrder?.id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  View Sales Order
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Line Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Line Items */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Line Items</h2>
              </div>

              {lineItemsLoading ? (
                <div className="px-6 py-8 text-center text-gray-500">Loading line items...</div>
              ) : lineItems.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="mb-4">
                      <Package className="w-16 h-16 mx-auto text-gray-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No line items</h3>
                    <p className="text-sm text-gray-600">
                      This request doesn&apos;t have any line items yet.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full table-fixed">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="w-[40%] px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="w-[10%] px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="w-[8%] px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Qty
                        </th>
                        <th className="w-[22%] px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="w-[20%] px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {lineItems.map((item: any) => {
                        const isExpanded = expandedItems.has(item.id);
                        const isRental = item.type === "RENTAL";
                        const hasDeliveryDetails =
                          item.deliveryMethod || item.deliveryLocation || item.deliveryNotes;
                        return (
                          <React.Fragment key={item.id}>
                            <tr className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                                    {item.priceId ? (
                                      <GeneratedImage
                                        entity="price"
                                        entityId={item.priceId}
                                        size="list"
                                        alt={item.description}
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300">
                                        <span className="text-gray-400 text-lg font-medium">?</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {item.price?.name ||
                                        item.customPriceName ||
                                        item.description ||
                                        "Untitled"}
                                    </p>
                                    {item.pimCategory && (
                                      <p className="text-xs text-gray-500 truncate">
                                        {item.pimCategory.name}
                                      </p>
                                    )}
                                    {hasDeliveryDetails && (
                                      <button
                                        onClick={() => toggleItemExpansion(item.id)}
                                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline cursor-pointer whitespace-nowrap"
                                      >
                                        <span>{isExpanded ? "Hide" : "Show"} details</span>
                                        <ChevronDown
                                          className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                        />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <TypeBadge type={item.type} />
                              </td>
                              <td className="px-6 py-4 text-right text-sm text-gray-900">
                                {item.quantity}
                              </td>
                              <td className="px-6 py-4 text-left text-sm text-gray-900">
                                {isRental && item.rentalStartDate && item.rentalEndDate ? (
                                  <div className="flex items-center gap-1 text-xs text-gray-700">
                                    <Calendar className="w-3 h-3 text-gray-400" />
                                    <span>
                                      {formatDate(item.rentalStartDate)} –{" "}
                                      {formatDate(item.rentalEndDate)}
                                    </span>
                                  </div>
                                ) : isRental && item.durationInDays ? (
                                  <span className="text-sm text-gray-600">
                                    {item.durationInDays} days
                                  </span>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="text-sm font-medium text-gray-900">
                                  {item.subtotalInCents
                                    ? `$${(item.subtotalInCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                                    : "—"}
                                </span>
                              </td>
                            </tr>
                            {isExpanded && hasDeliveryDetails && (
                              <tr>
                                <td colSpan={5} className="px-6 py-4 bg-blue-50">
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    {item.deliveryMethod && (
                                      <div>
                                        <p className="text-xs text-gray-500 mb-0.5">
                                          Delivery Method
                                        </p>
                                        <p className="font-medium text-gray-900">
                                          {item.deliveryMethod}
                                        </p>
                                      </div>
                                    )}
                                    {item.deliveryLocation && (
                                      <div>
                                        <p className="text-xs text-gray-500 mb-0.5">
                                          Delivery Location
                                        </p>
                                        <p className="font-medium text-gray-900">
                                          {item.deliveryLocation}
                                        </p>
                                      </div>
                                    )}
                                    {item.deliveryNotes && (
                                      <div className="col-span-2 md:col-span-4">
                                        <p className="text-xs text-gray-500 mb-0.5">
                                          Delivery Notes
                                        </p>
                                        <p className="font-medium text-gray-900">
                                          {item.deliveryNotes}
                                        </p>
                                      </div>
                                    )}
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
                          ${totalInDollars}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h3>
              <div className="space-y-3">
                {submission.name && (
                  <div className="flex items-start gap-3">
                    <User className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="text-sm font-medium text-gray-900">{submission.name}</p>
                    </div>
                  </div>
                )}
                {submission.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium text-gray-900">{submission.email}</p>
                    </div>
                  </div>
                )}
                {submission.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-sm font-medium text-gray-900">{submission.phone}</p>
                    </div>
                  </div>
                )}
                {submission.companyName && (
                  <div className="flex items-start gap-3">
                    <Building2 className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Company</p>
                      <p className="text-sm font-medium text-gray-900">{submission.companyName}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submission Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Submission Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Form ID</span>
                  <span className="font-mono text-gray-900 text-xs">{submission.formId}</span>
                </div>
                {submission.purchaseOrderNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">PO Number</span>
                    <span className="font-medium text-gray-900">
                      {submission.purchaseOrderNumber}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-100">
                  <span className="text-gray-500">Created</span>
                  <span className="text-gray-900">{formatDate(submission.createdAt)}</span>
                </div>
                {submission.submittedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Submitted</span>
                    <span className="text-gray-900">{formatDate(submission.submittedAt)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Form Information */}
            {submission.form && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Form Information</h3>
                <div className="space-y-2 text-sm">
                  {submission.form.workspace && (
                    <div className="flex items-center gap-2">
                      {submission.form.workspace.logoUrl && (
                        <img
                          src={submission.form.workspace.logoUrl}
                          alt=""
                          className="w-6 h-6 rounded"
                        />
                      )}
                      <span className="font-medium text-gray-900">
                        {submission.form.workspace.name}
                      </span>
                    </div>
                  )}
                  {submission.form.project && (
                    <div className="flex justify-between pt-2 border-t border-gray-100">
                      <span className="text-gray-500">Project</span>
                      <Link
                        href={`/app/${workspaceId}/projects/${submission.form.project.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {submission.form.project.name}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Related Records */}
            {(hasQuote || hasSalesOrder) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Related Records</h3>
                <div className="space-y-2">
                  {hasQuote && (
                    <Link
                      href={`/app/${workspaceId}/sales-quotes/${submission.quote?.id}`}
                      className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Quote</span>
                      </div>
                      <span className="text-xs font-mono text-green-700">
                        {submission.quote?.id?.slice(0, 8)}...
                      </span>
                    </Link>
                  )}
                  {hasSalesOrder && (
                    <Link
                      href={`/app/${workspaceId}/sales-orders/${submission.salesOrder?.id}`}
                      className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Sales Order</span>
                      </div>
                      <span className="text-xs font-mono text-blue-700">
                        {submission.salesOrder?.id?.slice(0, 8)}...
                      </span>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Convert to Order Dialog */}
      <ConvertSubmissionDialog
        open={convertDialogOpen}
        onClose={() => setConvertDialogOpen(false)}
        submissionId={submissionId}
        workspaceId={workspaceId}
      />

      {/* Generate Quote Dialog */}
      <GenerateQuoteDialog
        open={generateQuoteDialogOpen}
        onClose={() => setGenerateQuoteDialogOpen(false)}
        submissionId={submissionId}
        workspaceId={workspaceId}
        submissionEmail={submission.email}
        submissionName={submission.name}
        formProjectId={submission.form?.projectId}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

// Helper Components

function StatusBadge({ status }: { status: string }) {
  if (status === "SUBMITTED") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border bg-green-100 text-green-700 border-green-200">
        <CheckCircle className="w-3 h-3" />
        Submitted
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border bg-gray-100 text-gray-700 border-gray-200">
      <Clock className="w-3 h-3" />
      Draft
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  if (type === "RENTAL") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
        Rental
      </span>
    );
  }
  if (type === "SALE") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
        Sale
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
      {type}
    </span>
  );
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
