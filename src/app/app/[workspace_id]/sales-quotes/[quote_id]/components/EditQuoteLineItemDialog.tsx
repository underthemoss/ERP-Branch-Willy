"use client";

import { IntakeFormLineItem } from "@/graphql/graphql";
import { GeneratedImage } from "@/ui/GeneratedImage";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { Calendar, DollarSign, Loader2, Pencil, Truck, X } from "lucide-react";
import * as React from "react";
import { PriceHit, PriceSearchModal } from "./PriceSearchModal";

// Original request from intake form submission
interface OriginalRequest {
  id: string;
  description: string;
  quantity: number;
  durationInDays: number;
  rentalStartDate?: string | null;
  rentalEndDate?: string | null;
  deliveryMethod?: string | null;
  deliveryLocation?: string | null;
  deliveryNotes?: string | null;
  customPriceName?: string | null;
  pimCategory?: { name: string } | null;
}

// Line item type that matches the GraphQL response
interface LineItem {
  id: string;
  type: "RENTAL" | "SALE" | "SERVICE";
  description: string;
  quantity: number;
  pimCategoryId?: string;
  pimCategory?: { name: string } | null;
  sellersPriceId?: string | null;
  price?: {
    id?: string;
    name?: string;
    pricePerDayInCents?: number;
    pricePerWeekInCents?: number;
    pricePerMonthInCents?: number;
    unitCostInCents?: number;
  } | null;
  rentalStartDate?: string | null;
  rentalEndDate?: string | null;
  subtotalInCents?: number;
  deliveryMethod?: string | null;
  deliveryLocation?: string | null;
  deliveryNotes?: string | null;
  intakeFormSubmissionLineItemId?: string | null;
  intakeFormSubmissionLineItem?: OriginalRequest | null;
}

interface EditQuoteLineItemDialogProps {
  open: boolean;
  onClose: () => void;
  lineItem: LineItem;
  allLineItems: LineItem[];
  quoteId: string;
  revisionId: string;
  revisionNumber: number;
  revisionStatus: string;
  workspaceId: string;
  onSave: (updatedLineItems: LineItem[], createNewRevision: boolean) => Promise<void>;
  mode?: "edit" | "add";
  /** When adding a new line item, this is the submission line item to link to and pre-populate from */
  linkedSubmissionLineItem?: IntakeFormLineItem | null;
}

export function EditQuoteLineItemDialog({
  open,
  onClose,
  lineItem,
  allLineItems,
  quoteId,
  revisionId,
  revisionNumber,
  revisionStatus,
  workspaceId,
  onSave,
  mode = "edit",
  linkedSubmissionLineItem,
}: EditQuoteLineItemDialogProps) {
  // Form state
  const [description, setDescription] = React.useState(lineItem.description);
  const [quantity, setQuantity] = React.useState(lineItem.quantity);
  const [rentalStartDate, setRentalStartDate] = React.useState<Date | null>(
    lineItem.rentalStartDate ? new Date(lineItem.rentalStartDate) : null,
  );
  const [rentalEndDate, setRentalEndDate] = React.useState<Date | null>(
    lineItem.rentalEndDate ? new Date(lineItem.rentalEndDate) : null,
  );
  const [deliveryMethod, setDeliveryMethod] = React.useState(lineItem.deliveryMethod || "");
  const [deliveryLocation, setDeliveryLocation] = React.useState(lineItem.deliveryLocation || "");
  const [deliveryNotes, setDeliveryNotes] = React.useState(lineItem.deliveryNotes || "");

  // Selected price state
  const [selectedPriceId, setSelectedPriceId] = React.useState(lineItem.sellersPriceId || "");
  const [selectedPrice, setSelectedPrice] = React.useState<PriceHit | null>(null);

  // UI state
  const [loading, setLoading] = React.useState(false);
  const [priceSearchOpen, setPriceSearchOpen] = React.useState(false);

  // Reset form when lineItem changes or linkedSubmissionLineItem is provided
  React.useEffect(() => {
    // If we have a linked submission line item (when adding), pre-populate from it
    if (linkedSubmissionLineItem && mode === "add") {
      setDescription(lineItem.description); // Use price name from lineItem (already set)
      setQuantity(linkedSubmissionLineItem.quantity);
      setRentalStartDate(
        linkedSubmissionLineItem.rentalStartDate
          ? new Date(linkedSubmissionLineItem.rentalStartDate)
          : null,
      );
      setRentalEndDate(
        linkedSubmissionLineItem.rentalEndDate
          ? new Date(linkedSubmissionLineItem.rentalEndDate)
          : null,
      );
      setDeliveryMethod(linkedSubmissionLineItem.deliveryMethod || "");
      setDeliveryLocation(linkedSubmissionLineItem.deliveryLocation || "");
      setDeliveryNotes(linkedSubmissionLineItem.deliveryNotes || "");
      setSelectedPriceId(lineItem.sellersPriceId || "");
      setSelectedPrice(null);
    } else {
      setDescription(lineItem.description);
      setQuantity(lineItem.quantity);
      setRentalStartDate(lineItem.rentalStartDate ? new Date(lineItem.rentalStartDate) : null);
      setRentalEndDate(lineItem.rentalEndDate ? new Date(lineItem.rentalEndDate) : null);
      setDeliveryMethod(lineItem.deliveryMethod || "");
      setDeliveryLocation(lineItem.deliveryLocation || "");
      setDeliveryNotes(lineItem.deliveryNotes || "");
      setSelectedPriceId(lineItem.sellersPriceId || "");
      setSelectedPrice(null);
    }
  }, [lineItem, linkedSubmissionLineItem, mode]);

  const handlePriceSelect = (price: PriceHit) => {
    setSelectedPriceId(price.objectID);
    setSelectedPrice(price);
    setDescription(price.name || lineItem.description);
    setPriceSearchOpen(false);
  };

  // Handle when a new price is created - update the line item with the new price and save immediately
  const handlePriceCreated = async (priceId: string) => {
    setSelectedPriceId(priceId);
    setPriceSearchOpen(false);

    // Save immediately with the new price
    setLoading(true);
    try {
      const updatedItem: LineItem = {
        ...lineItem,
        description,
        quantity,
        sellersPriceId: priceId,
        ...(lineItem.type === "RENTAL" && {
          rentalStartDate: rentalStartDate?.toISOString() || lineItem.rentalStartDate,
          rentalEndDate: rentalEndDate?.toISOString() || lineItem.rentalEndDate,
        }),
        deliveryMethod: deliveryMethod || null,
        deliveryLocation: deliveryLocation || null,
        deliveryNotes: deliveryNotes || null,
        // Include the linked submission line item ID if provided
        intakeFormSubmissionLineItemId:
          linkedSubmissionLineItem?.id || lineItem.intakeFormSubmissionLineItemId || null,
      };

      const updatedLineItems = allLineItems.map((item) =>
        item.id === lineItem.id ? updatedItem : item,
      );

      const createNewRevision = revisionStatus === "SENT";
      await onSave(updatedLineItems, createNewRevision);
      onClose();
    } catch (error) {
      console.error("Error saving line item with new price:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Build updated line item
      const updatedItem: LineItem = {
        ...lineItem,
        description,
        quantity,
        sellersPriceId: selectedPriceId || lineItem.sellersPriceId,
        ...(lineItem.type === "RENTAL" && {
          rentalStartDate: rentalStartDate?.toISOString() || lineItem.rentalStartDate,
          rentalEndDate: rentalEndDate?.toISOString() || lineItem.rentalEndDate,
        }),
        deliveryMethod: deliveryMethod || null,
        deliveryLocation: deliveryLocation || null,
        deliveryNotes: deliveryNotes || null,
        // Include the linked submission line item ID if provided
        intakeFormSubmissionLineItemId:
          linkedSubmissionLineItem?.id || lineItem.intakeFormSubmissionLineItemId || null,
      };

      // Update the line items array
      const updatedLineItems = allLineItems.map((item) =>
        item.id === lineItem.id ? updatedItem : item,
      );

      // Determine if we need a new revision (if current revision is SENT)
      const createNewRevision = revisionStatus === "SENT";

      await onSave(updatedLineItems, createNewRevision);
      onClose();
    } catch (error) {
      console.error("Error saving line item:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents: number | null | undefined): string => {
    if (cents === null || cents === undefined) return "—";
    return `$${(cents / 100).toFixed(2)}`;
  };

  // Get current price display info
  const currentPriceName =
    selectedPrice?.name || lineItem.price?.name || lineItem.description || "No price selected";
  const currentPriceDisplay =
    lineItem.type === "RENTAL"
      ? selectedPrice
        ? `${formatPrice(selectedPrice.pricePerDayInCents)}/day`
        : lineItem.price?.pricePerDayInCents
          ? `${formatPrice(lineItem.price.pricePerDayInCents)}/day`
          : "—"
      : selectedPrice
        ? formatPrice(selectedPrice.unitCostInCents)
        : lineItem.price?.unitCostInCents
          ? formatPrice(lineItem.price.unitCostInCents)
          : "—";

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

        {/* Dialog */}
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col z-10">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Pencil className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {mode === "add" ? "Add Line Item" : "Edit Line Item"}
                </h2>
                <p className="text-sm text-gray-500">
                  {lineItem.type} • Revision #{revisionNumber}
                  {revisionStatus === "SENT" && (
                    <span className="ml-2 text-amber-600">(will create new revision)</span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Price Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Pricing
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    {selectedPriceId || lineItem.sellersPriceId ? (
                      <GeneratedImage
                        entity="price"
                        entityId={selectedPriceId || lineItem.sellersPriceId || ""}
                        size="list"
                        alt={currentPriceName}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300">
                        <span className="text-gray-400 text-xl font-medium">?</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{currentPriceName}</p>
                    <p className="text-sm text-gray-500">{currentPriceDisplay}</p>
                    {lineItem.pimCategory && (
                      <p className="text-xs text-gray-400 mt-1">{lineItem.pimCategory.name}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setPriceSearchOpen(true)}
                    className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    Change Price
                  </button>
                </div>
                {/* Quantity for sale items only */}
                {lineItem.type === "SALE" && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-gray-700">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Rental Dates Section (only for rentals) */}
            {lineItem.type === "RENTAL" && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Rental Dates
                </h3>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <DatePicker
                        value={rentalStartDate}
                        onChange={(date) => setRentalStartDate(date as Date | null)}
                        slotProps={{
                          textField: {
                            size: "small",
                            fullWidth: true,
                          },
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <DatePicker
                        value={rentalEndDate}
                        onChange={(date) => setRentalEndDate(date as Date | null)}
                        minDate={rentalStartDate || undefined}
                        slotProps={{
                          textField: {
                            size: "small",
                            fullWidth: true,
                          },
                        }}
                      />
                    </div>
                  </div>
                </LocalizationProvider>
              </div>
            )}

            {/* Delivery Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Delivery Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Method
                  </label>
                  <select
                    value={deliveryMethod}
                    onChange={(e) => setDeliveryMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">Select method</option>
                    <option value="DELIVERY">Delivery</option>
                    <option value="PICKUP">Pickup</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Location
                  </label>
                  <input
                    type="text"
                    value={deliveryLocation}
                    onChange={(e) => setDeliveryLocation(e.target.value)}
                    placeholder="Enter delivery address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Notes
                  </label>
                  <textarea
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="Any special delivery instructions"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Saving..." : mode === "add" ? "Add Item" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      {/* Price Search Modal */}
      <PriceSearchModal
        open={priceSearchOpen}
        onClose={() => setPriceSearchOpen(false)}
        onSelect={handlePriceSelect}
        onPriceCreated={handlePriceCreated}
        workspaceId={workspaceId}
        pimCategoryId={lineItem.pimCategoryId}
        pimCategoryName={lineItem.pimCategory?.name}
        priceType={
          lineItem.type === "RENTAL" ? "RENTAL" : lineItem.type === "SALE" ? "SALE" : undefined
        }
        currentPriceId={lineItem.sellersPriceId || undefined}
        originalRequest={lineItem.intakeFormSubmissionLineItem || undefined}
      />
    </>
  );
}
