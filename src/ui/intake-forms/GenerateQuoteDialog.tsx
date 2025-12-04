"use client";

import { ContactType } from "@/graphql/graphql";
import { useContactSelectorListQuery } from "@/graphql/hooks";
import { useNotification } from "@/providers/NotificationProvider";
import { ContactSelector } from "@/ui/ContactSelector";
import { ProjectSelector } from "@/ui/ProjectSelector";
import { AlertCircle, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useCreateQuoteFromIntakeFormSubmissionMutation } from "./api";
import { CreateContactDialog } from "./CreateContactDialog";

interface GenerateQuoteDialogProps {
  open: boolean;
  onClose: () => void;
  submissionId: string;
  workspaceId: string;
  submissionEmail?: string | null;
  submissionName?: string | null;
  onSuccess?: () => void;
}

export function GenerateQuoteDialog({
  open,
  onClose,
  submissionId,
  workspaceId,
  submissionEmail,
  submissionName,
  onSuccess,
}: GenerateQuoteDialogProps) {
  const router = useRouter();
  const { notifySuccess, notifyError } = useNotification();
  const [createQuoteFromSubmission, { loading }] = useCreateQuoteFromIntakeFormSubmissionMutation();

  const [buyerContactId, setBuyerContactId] = React.useState<string>("");
  const [projectId, setProjectId] = React.useState<string>("");
  const [validForDays, setValidForDays] = React.useState<number>(30);
  const [showContactDialog, setShowContactDialog] = React.useState(false);
  const [contactMatchAttempted, setContactMatchAttempted] = React.useState(false);
  const [noContactMatchFound, setNoContactMatchFound] = React.useState(false);

  // Fetch contacts for auto-matching by email
  const { data: contactsData } = useContactSelectorListQuery({
    variables: {
      workspaceId,
      page: { number: 1, size: 1000 },
      contactType: ContactType.Person,
    },
    skip: !open,
    fetchPolicy: "cache-and-network",
  });

  // Auto-match contact by email when dialog opens
  React.useEffect(() => {
    if (!open || contactMatchAttempted || !submissionEmail || !contactsData) {
      return;
    }

    const matchedContact = contactsData.listContacts?.items?.find(
      (contact) =>
        contact.__typename === "PersonContact" &&
        contact.email?.toLowerCase() === submissionEmail.toLowerCase(),
    );

    if (matchedContact) {
      setBuyerContactId(matchedContact.id);
      setNoContactMatchFound(false);
    } else {
      setNoContactMatchFound(true);
    }
    setContactMatchAttempted(true);
  }, [open, contactsData, submissionEmail, contactMatchAttempted]);

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      setBuyerContactId("");
      setProjectId("");
      setValidForDays(30);
      setContactMatchAttempted(false);
      setNoContactMatchFound(false);
    }
  }, [open]);

  const handleClose = () => {
    onClose();
  };

  const handleCreate = async () => {
    if (!buyerContactId || !projectId) {
      return;
    }

    try {
      // Calculate validUntil date
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + validForDays);

      const { data } = await createQuoteFromSubmission({
        variables: {
          input: {
            intakeFormSubmissionId: submissionId,
            sellersBuyerContactId: buyerContactId,
            sellersProjectId: projectId,
            validUntil: validUntil.toISOString(),
          },
        },
        refetchQueries: ["ListIntakeFormSubmissions", "ListIntakeFormSubmissionsByFormId"],
      });

      if (data?.createQuoteFromIntakeFormSubmission?.id) {
        const quote = data.createQuoteFromIntakeFormSubmission;
        const hasUnpricedItems = quote.currentRevision?.hasUnpricedLineItems ?? false;

        notifySuccess("Quote generated successfully");

        if (onSuccess) {
          onSuccess();
        }

        // Navigate to quote detail page
        router.push(`/app/${workspaceId}/sales-quotes/${quote.id}`);

        handleClose();
      }
    } catch (error) {
      console.error("Error generating quote:", error);
      notifyError("Failed to generate quote from submission");
    }
  };

  const handleContactCreated = (contactId: string) => {
    setBuyerContactId(contactId);
    setNoContactMatchFound(false);
    setShowContactDialog(false);
  };

  const isFormValid = buyerContactId && projectId && validForDays > 0;

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

        {/* Dialog */}
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 z-10">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Generate Quote from Submission
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Create a sales quote from this intake form submission
              </p>
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

              {/* No match warning */}
              {noContactMatchFound && !buyerContactId && submissionEmail && (
                <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-amber-800 font-medium">
                      No contact found with email: {submissionEmail}
                    </p>
                    <p className="text-amber-700 mt-1">
                      Please select an existing contact or create a new one.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <div className="flex-1">
                  <ContactSelector
                    workspaceId={workspaceId}
                    contactId={buyerContactId}
                    onChange={(id) => {
                      setBuyerContactId(id);
                      if (id) {
                        setNoContactMatchFound(false);
                      }
                    }}
                    type="any"
                  />
                </div>
                {!buyerContactId && (
                  <button
                    onClick={() => setShowContactDialog(true)}
                    className="px-3 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    + New
                  </button>
                )}
              </div>
              {submissionEmail && buyerContactId && (
                <p className="text-xs text-green-600 mt-1">
                  Contact matched by email: {submissionEmail}
                </p>
              )}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valid For (days)
              </label>
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
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Generating..." : "Generate Quote"}
            </button>
          </div>
        </div>
      </div>

      {/* Create Contact Dialog */}
      <CreateContactDialog
        open={showContactDialog}
        onClose={() => setShowContactDialog(false)}
        onContactCreated={handleContactCreated}
        workspaceId={workspaceId}
        initialData={{
          name: submissionName || "",
          email: submissionEmail || "",
          phone: "",
          companyName: "",
        }}
        type="buyer"
      />
    </>
  );
}
