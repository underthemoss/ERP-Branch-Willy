"use client";

import { DeliveryMethod, IntakeFormLineItem, RequestType } from "@/graphql/graphql";
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  DollarSign,
  FileText,
  MapPin,
  Package,
  ShoppingCart,
  Truck,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

interface QuoteLineItem {
  intakeFormSubmissionLineItemId?: string | null;
}

interface SourceSubmissionCardProps {
  submission: {
    id: string;
    name?: string | null;
    email?: string | null;
    companyName?: string | null;
    lineItems?: IntakeFormLineItem[] | null;
  };
  quoteLineItems: QuoteLineItem[];
  workspaceId: string;
}

function formatPrice(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "—";
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
    month: "short",
    day: "numeric",
  });
}

interface SubmissionLineItemRowProps {
  item: IntakeFormLineItem;
  isCovered: boolean;
}

function SubmissionLineItemRow({ item, isCovered }: SubmissionLineItemRowProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const isRental = item.type === RequestType.Rental;
  const price = item.price as any; // Price can be RentalPrice or SalePrice

  return (
    <div
      className={`rounded-lg border ${
        isCovered ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
      }`}
    >
      {/* Main row - always visible */}
      <div
        className="flex items-start gap-3 p-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Checkbox indicator */}
        <div className="flex-shrink-0 mt-0.5">
          {isCovered ? (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          ) : (
            <Circle className="w-4 h-4 text-gray-400" />
          )}
        </div>

        {/* Item details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 truncate">{item.description}</span>
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                isRental ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
              }`}
            >
              {isRental ? "Rental" : "Sale"}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <span>Qty: {item.quantity}</span>
            {item.pimCategory?.name && (
              <>
                <span>•</span>
                <span className="truncate">{item.pimCategory.name}</span>
              </>
            )}
            {item.customPriceName && (
              <>
                <span>•</span>
                <span className="truncate italic">{item.customPriceName}</span>
              </>
            )}
          </div>
        </div>

        {/* Expand/collapse button */}
        <button className="flex-shrink-0 p-1 hover:bg-gray-200 rounded transition-colors">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-0 border-t border-gray-200 mt-0">
          <div className="grid grid-cols-2 gap-3 mt-3">
            {/* Dates */}
            {isRental && (item.rentalStartDate || item.rentalEndDate) && (
              <div className="col-span-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                  <Calendar className="w-3 h-3" />
                  <span className="font-medium">Rental Period</span>
                </div>
                <p className="text-sm text-gray-900 ml-4">
                  {formatDate(item.rentalStartDate)} - {formatDate(item.rentalEndDate)}
                  {item.durationInDays > 0 && (
                    <span className="text-gray-500 ml-1">({item.durationInDays} days)</span>
                  )}
                </p>
              </div>
            )}

            {/* Price info */}
            {(price || item.subtotalInCents > 0) && (
              <div className="col-span-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                  <DollarSign className="w-3 h-3" />
                  <span className="font-medium">Pricing</span>
                </div>
                <div className="ml-4 text-sm">
                  {price?.name && (
                    <p className="text-gray-900">
                      <span className="font-medium">Price:</span> {price.name}
                    </p>
                  )}
                  {isRental && price && (
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-gray-600 mt-1">
                      {price.pricePerDayInCents && (
                        <span>{formatPrice(price.pricePerDayInCents)}/day</span>
                      )}
                      {price.pricePerWeekInCents && (
                        <span>{formatPrice(price.pricePerWeekInCents)}/week</span>
                      )}
                      {price.pricePerMonthInCents && (
                        <span>{formatPrice(price.pricePerMonthInCents)}/month</span>
                      )}
                    </div>
                  )}
                  {!isRental && price?.unitCostInCents && (
                    <p className="text-gray-600 mt-1">
                      {formatPrice(price.unitCostInCents)} per unit
                    </p>
                  )}
                  {item.subtotalInCents > 0 && (
                    <p className="text-gray-900 mt-1 font-medium">
                      Subtotal: {formatPrice(item.subtotalInCents)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Delivery info */}
            {(item.deliveryMethod || item.deliveryLocation) && (
              <div className="col-span-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                  <Truck className="w-3 h-3" />
                  <span className="font-medium">Delivery</span>
                </div>
                <div className="ml-4 text-sm">
                  {item.deliveryMethod && (
                    <p className="text-gray-900">
                      <span className="font-medium">Method:</span>{" "}
                      {item.deliveryMethod === DeliveryMethod.Delivery ? "Delivery" : "Pickup"}
                    </p>
                  )}
                  {item.deliveryLocation && (
                    <p className="text-gray-600 mt-1 flex items-start gap-1">
                      <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{item.deliveryLocation}</span>
                    </p>
                  )}
                  {item.deliveryNotes && (
                    <p className="text-gray-500 mt-1 italic text-xs">{item.deliveryNotes}</p>
                  )}
                </div>
              </div>
            )}

            {/* Category */}
            {item.pimCategory?.name && (
              <div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                  <Package className="w-3 h-3" />
                  <span className="font-medium">Category</span>
                </div>
                <p className="text-sm text-gray-900 ml-4">{item.pimCategory.name}</p>
              </div>
            )}

            {/* Custom price name */}
            {item.customPriceName && (
              <div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                  <span className="font-medium">Custom Request</span>
                </div>
                <p className="text-sm text-gray-900 ml-4 italic">{item.customPriceName}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function SourceSubmissionCard({
  submission,
  quoteLineItems,
  workspaceId,
}: SourceSubmissionCardProps) {
  // Calculate which submission line items are covered by quote line items
  const coverageMap = React.useMemo(() => {
    const map = new Map<string, boolean>();
    if (!submission.lineItems) return map;

    const linkedIds = new Set(
      quoteLineItems.map((qli) => qli.intakeFormSubmissionLineItemId).filter(Boolean),
    );

    for (const item of submission.lineItems) {
      map.set(item.id, linkedIds.has(item.id));
    }
    return map;
  }, [submission.lineItems, quoteLineItems]);

  const coveredCount = [...coverageMap.values()].filter(Boolean).length;
  const totalCount = submission.lineItems?.length ?? 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-gray-600" />
        Source Submission
      </h3>

      {/* Submission Info */}
      <div className="space-y-3">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Submission ID</p>
          <Link
            href={`/app/${workspaceId}/intake-forms?submissionId=${submission.id}`}
            className="text-sm font-mono text-blue-600 hover:underline mt-1 block"
          >
            {submission.id}
          </Link>
        </div>
        {submission.name && (
          <div className="border-t border-gray-200 pt-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Submitted By</p>
            <p className="text-sm text-gray-900 mt-1">{submission.name}</p>
          </div>
        )}
        {submission.email && (
          <div className="border-t border-gray-200 pt-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Email</p>
            <p className="text-sm text-gray-900 mt-1">{submission.email}</p>
          </div>
        )}
        {submission.companyName && (
          <div className="border-t border-gray-200 pt-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Company</p>
            <p className="text-sm text-gray-900 mt-1">{submission.companyName}</p>
          </div>
        )}
      </div>

      {/* Requested Items Section */}
      {submission.lineItems && submission.lineItems.length > 0 && (
        <div className="mt-6 border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-gray-600" />
              Requested Items
            </h4>
            <span className="text-xs text-gray-500">
              {coveredCount}/{totalCount} quoted
            </span>
          </div>

          <div className="space-y-2">
            {submission.lineItems.map((item) => {
              const isCovered = coverageMap.get(item.id) ?? false;
              return <SubmissionLineItemRow key={item.id} item={item} isCovered={isCovered} />;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
