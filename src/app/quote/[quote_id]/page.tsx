"use client";

import { graphql } from "@/graphql";
import { useAcceptQuoteMutation, useBuyerReviewQuote_GetQuoteByIdQuery } from "@/graphql/hooks";
import { useNotification } from "@/providers/NotificationProvider";
import { CheckCircle2, FileQuestion, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import * as React from "react";
import { QuoteDisplay } from "../components/QuoteDisplay";
import { SignatureAcceptanceDialog, SignatureData } from "../components/SignatureAcceptanceDialog";

// GraphQL Query
graphql(`
  query BuyerReviewQuote_GetQuoteById($id: String!) {
    quoteById(id: $id) {
      id
      status
      sellerWorkspaceId
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
            address
          }
        }
        ... on BusinessContact {
          id
          contactType
          name
          phone
          address
        }
      }
      sellersProject {
        id
        name
        project_code
        description
      }
      currentRevision {
        id
        revisionNumber
        validUntil
        createdAt
        lineItems {
          ... on QuoteRevisionRentalLineItem {
            id
            type
            description
            quantity
            pimCategory {
              name
            }
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
          }
          ... on QuoteRevisionSaleLineItem {
            id
            type
            description
            quantity
            pimCategory {
              name
            }
            price {
              ... on SalePrice {
                id
                name
                unitCostInCents
              }
            }
            subtotalInCents
          }
          ... on QuoteRevisionServiceLineItem {
            id
            type
            description
            quantity
            subtotalInCents
          }
        }
      }
      validUntil
      createdAt
      updatedAt
    }
  }
`);

// GraphQL Mutation (already exists)
graphql(`
  mutation AcceptQuote($input: AcceptQuoteInput!) {
    acceptQuote(input: $input) {
      quote {
        id
        status
        updatedAt
      }
      salesOrder {
        id
        sales_order_number
      }
    }
  }
`);

export default function BuyerQuoteReviewPage() {
  const params = useParams();
  const quoteId = params?.quote_id as string;
  const { notifySuccess, notifyError } = useNotification();

  const [acceptDialogOpen, setAcceptDialogOpen] = React.useState(false);
  const [accepted, setAccepted] = React.useState(false);

  const { data, loading, error } = useBuyerReviewQuote_GetQuoteByIdQuery({
    variables: { id: quoteId },
    fetchPolicy: "cache-and-network",
  });

  const [acceptQuote, { loading: accepting }] = useAcceptQuoteMutation();

  const handleAcceptWithSignature = async (signatureData: SignatureData): Promise<void> => {
    try {
      // TODO: Update mutation to include signature data once API supports it
      const result = await acceptQuote({
        variables: {
          input: {
            quoteId,
            // TODO: Add signature fields when API supports them
            // signature: signatureData.signature,
            // signatureType: signatureData.signatureType,
            // signerName: signatureData.name,
            // signedAt: signatureData.date,
          },
        },
      });

      if (result.data?.acceptQuote) {
        notifySuccess("Quote accepted successfully! 🎉");
        setAccepted(true);
        setTimeout(() => {
          setAcceptDialogOpen(false);
        }, 2000);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to accept quote. Please try again.";
      notifyError(message);
      throw err;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-5">
            <Loader2 className="w-7 h-7 text-emerald-600 animate-spin" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Loading</h2>
          <p className="text-sm text-slate-500">Preparing your quote...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data?.quoteById) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/20">
            <FileQuestion className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-3">Quote not found</h1>
          <p className="text-slate-600 text-sm leading-relaxed mb-8">
            {error
              ? `Error loading quote: ${error.message}`
              : "The quote you're looking for doesn&apos;t exist or you don&apos;t have permission to view it."}
          </p>
        </div>
      </div>
    );
  }

  const quote = data.quoteById;

  // Already accepted state
  if (accepted || quote.status === "ACCEPTED") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20 animate-bounce">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-3">Quote Accepted!</h1>
          <p className="text-slate-600 text-sm leading-relaxed mb-8">
            This quote has been accepted. A sales order has been created and you'll receive a
            confirmation email shortly.
          </p>
        </div>
      </div>
    );
  }

  // Quote rejected/cancelled/expired
  if (["REJECTED", "CANCELLED", "EXPIRED"].includes(quote.status)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/20">
            <FileQuestion className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-3">Quote Unavailable</h1>
          <p className="text-slate-600 text-sm leading-relaxed mb-8">
            This quote is {quote.status.toLowerCase()} and can no longer be accepted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Review Your Quote</h1>
          <p className="text-slate-600">
            Please review the details below and accept to proceed with your order
          </p>
        </div>

        {/* Quote Display */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 mb-6">
          <QuoteDisplay quoteId={quoteId} />
        </div>

        {/* Accept Button */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h3 className="text-lg font-semibold text-slate-900 mb-1">Ready to proceed?</h3>
              <p className="text-sm text-slate-600">Accept this quote to create your sales order</p>
            </div>
            <button
              onClick={() => setAcceptDialogOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg"
            >
              <CheckCircle2 className="w-5 h-5" />
              Accept & Sign Quote
            </button>
          </div>
        </div>
      </div>

      {/* Signature Dialog */}
      <SignatureAcceptanceDialog
        open={acceptDialogOpen}
        onClose={() => setAcceptDialogOpen(false)}
        onAccept={handleAcceptWithSignature}
        quoteNumber={quote.id}
        defaultName={quote.sellersBuyerContact?.name || ""}
        loading={accepting}
      />
    </div>
  );
}
