"use client";

import { useCreateRentalPriceMutation, useCreateSalePriceMutation } from "@/graphql/hooks";
import { useListPriceBooksQuery } from "@/ui/prices/api";
import { Calendar, DollarSign, Info, Loader2, Package, X } from "lucide-react";
import * as React from "react";

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

interface AddNewPriceDialogProps {
  open: boolean;
  onClose: () => void;
  onPriceCreated: (priceId: string) => void;
  workspaceId: string;
  pimCategoryId?: string;
  pimCategoryName?: string;
  priceType: "RENTAL" | "SALE";
  originalRequest?: OriginalRequest;
}

export function AddNewPriceDialog({
  open,
  onClose,
  onPriceCreated,
  workspaceId,
  pimCategoryId,
  pimCategoryName,
  priceType,
  originalRequest,
}: AddNewPriceDialogProps) {
  // Form state
  const [name, setName] = React.useState("");
  const [priceBookId, setPriceBookId] = React.useState("");

  // Rental price fields
  const [pricePerDay, setPricePerDay] = React.useState("");
  const [pricePerWeek, setPricePerWeek] = React.useState("");
  const [pricePerMonth, setPricePerMonth] = React.useState("");

  // Sale price fields
  const [unitCost, setUnitCost] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch price books
  const { data: priceBooksData } = useListPriceBooksQuery({
    variables: {
      filter: { workspaceId },
      page: { size: 100 },
    },
    skip: !open,
  });

  const priceBooks = priceBooksData?.listPriceBooks?.items || [];

  // Mutations
  const [createRentalPrice] = useCreateRentalPriceMutation();
  const [createSalePrice] = useCreateSalePriceMutation();

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      setName("");
      setPriceBookId("");
      setPricePerDay("");
      setPricePerWeek("");
      setPricePerMonth("");
      setUnitCost("");
      setError(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Please enter a price name");
      return;
    }

    if (priceType === "RENTAL") {
      if (!pricePerDay) {
        setError("Please enter a daily price");
        return;
      }
    } else {
      if (!unitCost) {
        setError("Please enter a unit cost");
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      if (priceType === "RENTAL") {
        const dayRate = Math.round(parseFloat(pricePerDay) * 100);
        // Default weekly to 7x daily if not set, monthly to 28x daily if not set
        const weekRate = pricePerWeek ? Math.round(parseFloat(pricePerWeek) * 100) : dayRate * 7;
        const monthRate = pricePerMonth
          ? Math.round(parseFloat(pricePerMonth) * 100)
          : dayRate * 28;

        const result = await createRentalPrice({
          variables: {
            input: {
              workspaceId,
              name: name.trim(),
              pimCategoryId: pimCategoryId || "",
              priceBookId: priceBookId || undefined,
              pricePerDayInCents: dayRate,
              pricePerWeekInCents: weekRate,
              pricePerMonthInCents: monthRate,
            },
          },
        });

        if (result.data?.createRentalPrice?.id) {
          onPriceCreated(result.data.createRentalPrice.id);
        }
      } else {
        const result = await createSalePrice({
          variables: {
            input: {
              workspaceId,
              name: name.trim(),
              pimCategoryId: pimCategoryId || "",
              priceBookId: priceBookId || undefined,
              unitCostInCents: Math.round(parseFloat(unitCost) * 100),
            },
          },
        });

        if (result.data?.createSalePrice?.id) {
          onPriceCreated(result.data.createSalePrice.id);
        }
      }
    } catch (err) {
      console.error("Error creating price:", err);
      setError("Failed to create price. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${priceType === "RENTAL" ? "bg-blue-100" : "bg-green-100"}`}
            >
              <DollarSign
                className={`w-5 h-5 ${priceType === "RENTAL" ? "text-blue-600" : "text-green-600"}`}
              />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Add New {priceType === "RENTAL" ? "Rental" : "Sale"} Price
              </h2>
              {pimCategoryName && (
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  {pimCategoryName}
                </p>
              )}
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
        <div className="px-6 py-6 space-y-5">
          {/* Original Request Info */}
          {originalRequest && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-blue-700 mb-1">Original Request</p>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-gray-900">{originalRequest.description}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
                      {originalRequest.customPriceName && (
                        <span>Requested: &quot;{originalRequest.customPriceName}&quot;</span>
                      )}
                      <span>Qty: {originalRequest.quantity}</span>
                      {originalRequest.durationInDays > 0 && (
                        <span>{originalRequest.durationInDays} days</span>
                      )}
                      {originalRequest.rentalStartDate && originalRequest.rentalEndDate && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(originalRequest.rentalStartDate).toLocaleDateString()} -{" "}
                          {new Date(originalRequest.rentalEndDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Price Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Price Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Standard Excavator Rental"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Price Book */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Price Book <span className="text-gray-400">(optional)</span>
            </label>
            <select
              value={priceBookId}
              onChange={(e) => setPriceBookId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">No price book</option>
              {priceBooks.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.name}
                </option>
              ))}
            </select>
          </div>

          {/* Pricing Fields */}
          {priceType === "RENTAL" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Daily Rate <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={pricePerDay}
                      onChange={(e) => setPricePerDay(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Weekly Rate
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={pricePerWeek}
                      onChange={(e) => setPricePerWeek(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Monthly Rate
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={pricePerMonth}
                      onChange={(e) => setPricePerMonth(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Daily rate is required. Weekly (7 days) and monthly (28 days) rates are optional.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Unit Cost <span className="text-red-500">*</span>
              </label>
              <div className="relative w-48">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`px-5 py-2 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-2 disabled:cursor-not-allowed ${
              priceType === "RENTAL"
                ? "bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300"
                : "bg-green-600 hover:bg-green-700 disabled:bg-green-300"
            }`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Creating..." : "Create Price"}
          </button>
        </div>
      </div>
    </div>
  );
}
