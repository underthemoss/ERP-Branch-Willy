"use client";

import { IntakeFormLineItem, RequestType } from "@/graphql/graphql";
import { FileText, Package, X } from "lucide-react";
import * as React from "react";

interface SelectSubmissionLineItemDialogProps {
  open: boolean;
  onClose: () => void;
  unlinkedLineItems: IntakeFormLineItem[];
  onSelect: (item: IntakeFormLineItem | null) => void;
}

export function SelectSubmissionLineItemDialog({
  open,
  onClose,
  unlinkedLineItems,
  onSelect,
}: SelectSubmissionLineItemDialogProps) {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  // Reset selection when dialog opens
  React.useEffect(() => {
    if (open) {
      setSelectedId(null);
    }
  }, [open]);

  if (!open) return null;

  const handleContinue = () => {
    if (selectedId === null) {
      // User selected "None"
      onSelect(null);
    } else {
      const selectedItem = unlinkedLineItems.find((item) => item.id === selectedId);
      onSelect(selectedItem || null);
    }
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Which request item is this for?
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Description */}
          <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
            <p className="text-sm text-blue-700">
              The customer submitted a request with items below. Select which item you&apos;re
              creating a quote line item for, or choose &quot;None&quot; to add a different item.
            </p>
          </div>

          {/* Options List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {unlinkedLineItems.map((item) => (
              <label
                key={item.id}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedId === item.id
                    ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="submissionLineItem"
                  value={item.id}
                  checked={selectedId === item.id}
                  onChange={() => setSelectedId(item.id)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{item.description}</span>
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                        item.type === RequestType.Rental
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {item.type === RequestType.Rental ? "Rental" : "Sale"}
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
                        <span className="italic">&quot;{item.customPriceName}&quot;</span>
                      </>
                    )}
                    {item.priceId && (
                      <>
                        <span>•</span>
                        <span className="text-green-600">Has price</span>
                      </>
                    )}
                  </div>
                </div>
                <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </label>
            ))}

            {/* "None" option */}
            <label
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                selectedId === null
                  ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="submissionLineItem"
                value=""
                checked={selectedId === null}
                onChange={() => setSelectedId(null)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="text-sm text-gray-600">None - adding a different item</span>
            </label>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleContinue}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
