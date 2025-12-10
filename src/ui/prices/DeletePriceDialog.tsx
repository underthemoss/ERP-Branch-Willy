"use client";

import { useNotification } from "@/providers/NotificationProvider";
import { useDeletePriceByIdMutation } from "@/ui/prices/api";
import * as React from "react";

interface DeletePriceDialogProps {
  open: boolean;
  onClose: () => void;
  priceId: string | null;
  priceName?: string;
  priceCategory?: string;
  priceType?: string;
  onSuccess?: () => void;
}

export function DeletePriceDialog({
  open,
  onClose,
  priceId,
  priceName,
  priceCategory,
  priceType,
  onSuccess,
}: DeletePriceDialogProps) {
  const { notifySuccess, notifyError } = useNotification();
  const [deletePrice, { loading: deleting }] = useDeletePriceByIdMutation();

  const handleDelete = async () => {
    if (!priceId) return;

    try {
      await deletePrice({
        variables: {
          id: priceId,
        },
      });
      notifySuccess("Price deleted successfully");
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error deleting price:", error);
      notifyError("Failed to delete price");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Delete</h3>
          <p className="text-gray-600 mb-4">
            Are you sure you want to delete this price? This action cannot be undone.
          </p>
          {(priceName || priceCategory || priceType) && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              {priceCategory && (
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Category:</span>{" "}
                  <span className="text-gray-900">{priceCategory}</span>
                </div>
              )}
              {priceName && (
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Name:</span>{" "}
                  <span className="text-gray-900">{priceName}</span>
                </div>
              )}
              {priceType && (
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Type:</span>{" "}
                  <span className="text-gray-900">{priceType}</span>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              disabled={deleting}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
