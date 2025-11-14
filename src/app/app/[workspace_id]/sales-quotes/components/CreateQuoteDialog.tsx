"use client";

import { graphql } from "@/graphql";
import { QuoteStatus } from "@/graphql/graphql";
import { useCreateQuoteDialog_CreateQuoteMutation } from "@/graphql/hooks";
import { useNotification } from "@/providers/NotificationProvider";
import { useSelectedWorkspace } from "@/providers/WorkspaceProvider";
import { ContactSelector } from "@/ui/ContactSelector";
import { ProjectSelector } from "@/ui/ProjectSelector";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

graphql(`
  mutation CreateQuoteDialog_CreateQuote($input: CreateQuoteInput!) {
    createQuote(input: $input) {
      id
      status
      sellerWorkspaceId
      sellersBuyerContactId
      sellersProjectId
      validUntil
      createdAt
    }
  }
`);

interface CreateQuoteDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (quoteId: string) => void;
}

export function CreateQuoteDialog({ open, onClose, onSuccess }: CreateQuoteDialogProps) {
  const currentWorkspace = useSelectedWorkspace();
  const router = useRouter();
  const { notifySuccess, notifyError } = useNotification();
  const [createQuote, { loading }] = useCreateQuoteDialog_CreateQuoteMutation();

  const [buyerContactId, setBuyerContactId] = React.useState<string>("");
  const [projectId, setProjectId] = React.useState<string>("");
  const [validForDays, setValidForDays] = React.useState<number>(30);

  const handleClose = () => {
    // Reset form
    setBuyerContactId("");
    setProjectId("");
    setValidForDays(30);
    onClose();
  };

  const handleCreate = async () => {
    if (!currentWorkspace || !buyerContactId || !projectId) {
      return;
    }

    try {
      // Calculate validUntil date
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + validForDays);

      // Create the quote
      const { data } = await createQuote({
        variables: {
          input: {
            sellerWorkspaceId: currentWorkspace.id,
            sellersBuyerContactId: buyerContactId,
            sellersProjectId: projectId,
            validUntil: validUntil.toISOString(),
            status: QuoteStatus.Active,
          },
        },
        refetchQueries: ["SalesQuotesPage_ListQuotes"],
      });

      if (data?.createQuote?.id) {
        notifySuccess("Quote created successfully");
        const quoteId = data.createQuote.id;

        // Call success callback if provided
        if (onSuccess) {
          onSuccess(quoteId);
        }

        // Navigate to the cart page to add items
        router.push(`/app/${currentWorkspace.id}/sales-quotes/${quoteId}/cart`);
        handleClose();
      }
    } catch (error) {
      console.error("Error creating quote:", error);
      notifyError("Failed to create quote");
    }
  };

  const isFormValid = buyerContactId && projectId && validForDays > 0;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Create New Quote</h2>
            <p className="text-sm text-gray-600 mt-1">Initialize a new quote for your customer</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Buyer Contact */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buyer Contact <span className="text-red-500">*</span>
            </label>
            {currentWorkspace && (
              <ContactSelector
                workspaceId={currentWorkspace.id}
                contactId={buyerContactId}
                onChange={setBuyerContactId}
                type="any"
              />
            )}
            <p className="text-xs text-gray-500 mt-1">Select the customer contact for this quote</p>
          </div>

          {/* Project */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project <span className="text-red-500">*</span>
            </label>
            <ProjectSelector projectId={projectId} onChange={setProjectId} />
            <p className="text-xs text-gray-500 mt-1">Link this quote to a project</p>
          </div>

          {/* Valid For (days) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Valid For (days)</label>
            <input
              type="number"
              min="1"
              value={validForDays}
              onChange={(e) => setValidForDays(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Quote will be valid for {validForDays} days
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!isFormValid || loading}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {loading ? "Creating..." : "Create Quote"}
          </button>
        </div>
      </div>
    </div>
  );
}
