"use client";

import { graphql } from "@/graphql";
import { useSendQuoteMutation, useUpdateQuoteForSendMutation } from "@/graphql/hooks";
import { useNotification } from "@/providers/NotificationProvider";
import { getRoleFromResourceMapEntries } from "@/ui/contacts/resourceMapRole";
import { AlertCircle, Mail, User } from "lucide-react";
import * as React from "react";

// GraphQL Mutations
graphql(`
  mutation SendQuote($input: SendQuoteInput!) {
    sendQuote(input: $input) {
      id
      status
      currentRevisionId
      updatedAt
    }
  }
`);

graphql(`
  mutation UpdateQuoteForSend($input: UpdateQuoteInput!) {
    updateQuote(input: $input) {
      id
      sellersBuyerContactId
      updatedAt
    }
  }
`);

interface SendQuoteDialogProps {
  open: boolean;
  onClose: () => void;
  quote: any;
  onSuccess?: () => void;
}

export function SendQuoteDialog({ open, onClose, quote, onSuccess }: SendQuoteDialogProps) {
  const { notifySuccess, notifyError } = useNotification();
  const [sendQuote, { loading: sendingQuote }] = useSendQuoteMutation();
  const [updateQuote, { loading: updatingQuote }] = useUpdateQuoteForSendMutation();
  const [selectedEmployeeId, setSelectedEmployeeId] = React.useState<string>("");

  const loading = sendingQuote || updatingQuote;

  // Validation
  const validationErrors: string[] = [];

  if (!quote.currentRevisionId) {
    validationErrors.push("Quote must have a revision before sending");
  }

  if (!quote.currentRevision?.lineItems?.length) {
    validationErrors.push("Quote must have at least one line item");
  }

  const buyerContact = quote.sellersBuyerContact;
  const isBusinessContact = buyerContact?.__typename === "BusinessContact";
  const isPersonContact = buyerContact?.__typename === "PersonContact";

  // Get employees if business contact - filter for valid email addresses
  const employees = React.useMemo(() => {
    if (!isBusinessContact || !buyerContact?.employees?.items) {
      return [];
    }

    // Filter employees with valid, non-empty email addresses
    const validEmployees = buyerContact.employees.items
      .filter((emp: any) => emp?.email && emp.email.trim() !== "")
      .map((emp: any) => ({
        ...emp,
        role: getRoleFromResourceMapEntries(emp?.resource_map_entries ?? []),
      }));

    // Debug logging
    console.log("[SendQuoteDialog] Business Contact:", buyerContact.name);
    console.log("[SendQuoteDialog] Raw employees count:", buyerContact.employees.items.length);
    console.log("[SendQuoteDialog] Valid employees count:", validEmployees.length);
    console.log("[SendQuoteDialog] Valid employees:", validEmployees);

    return validEmployees;
  }, [isBusinessContact, buyerContact]);

  // Check if business has employees
  if (isBusinessContact && employees.length === 0) {
    validationErrors.push(
      "This business has no employees with email addresses. Please add an employee or change the buyer contact.",
    );
  }

  // Check if person contact has email
  if (isPersonContact && !buyerContact.email) {
    validationErrors.push("Buyer contact must have an email address");
  }

  // Require employee selection for business contacts
  if (isBusinessContact && employees.length > 0 && !selectedEmployeeId) {
    validationErrors.push("Please select an employee to receive the quote");
  }

  const canSend = validationErrors.length === 0;

  // Get the recipient details
  const recipient = React.useMemo(() => {
    if (isPersonContact && buyerContact) {
      return {
        name: buyerContact.name,
        email: buyerContact.email,
      };
    }
    if (isBusinessContact && selectedEmployeeId) {
      const employee = employees.find((emp: any) => emp.id === selectedEmployeeId);
      return employee
        ? {
            name: employee.name,
            email: employee.email,
            role: employee.role,
          }
        : null;
    }
    return null;
  }, [isPersonContact, isBusinessContact, buyerContact, selectedEmployeeId, employees]);

  const handleSend = async () => {
    if (!canSend) return;

    try {
      // Step 1: Update buyer contact if needed (business -> employee)
      if (isBusinessContact && selectedEmployeeId) {
        await updateQuote({
          variables: {
            input: {
              id: quote.id,
              sellersBuyerContactId: selectedEmployeeId,
            },
          },
        });
      }

      // Step 2: Send the quote
      await sendQuote({
        variables: {
          input: {
            quoteId: quote.id,
            revisionId: quote.currentRevisionId!,
          },
        },
        refetchQueries: ["SalesQuoteDetail_GetQuoteById"],
      });

      notifySuccess("Quote sent successfully");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error sending quote:", error);
      notifyError("Failed to send quote. Please try again.");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Send Quote</h2>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="text-2xl">&times;</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 mb-1">Cannot send quote:</p>
                  <ul className="text-sm text-red-700 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Business Contact - Employee Selection */}
          {isBusinessContact && employees.length > 0 && (
            <div className="mb-4">
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Business selected:</strong> {buyerContact.name}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Please select an employee to receive the quote
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select recipient:
                </label>
                {employees.map((employee: any) => (
                  <label
                    key={employee.id}
                    className={`block p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedEmployeeId === employee.id
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="employee"
                        value={employee.id}
                        checked={selectedEmployeeId === employee.id}
                        onChange={(e) => setSelectedEmployeeId(e.target.value)}
                        className="mt-1 text-green-600 focus:ring-green-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <p className="text-sm font-medium text-gray-900">{employee.name}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <p className="text-sm text-gray-600">{employee.email}</p>
                        </div>
                        {employee.role && (
                          <p className="text-xs text-gray-500 mt-1">{employee.role}</p>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Person Contact - Confirmation */}
          {isPersonContact && buyerContact.email && (
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-700 mb-2">Sending quote to:</p>
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-gray-500" />
                <p className="text-sm font-medium text-gray-900">{buyerContact.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <p className="text-sm text-gray-600">{buyerContact.email}</p>
              </div>
            </div>
          )}

          {/* Warning about immutability */}
          {canSend && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800">Important:</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Once sent, the quote will be visible to the buyer and you will not be able to
                    modify it directly. To make changes after sending, you will need to create a new
                    revision.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!canSend || loading}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                Send Quote
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
