"use client";

import { graphql } from "@/graphql";
import { useAcceptQuoteMutation } from "@/graphql/hooks";
import { useConfig } from "@/providers/ConfigProvider";
import { useNotification } from "@/providers/NotificationProvider";
import { useAuth0 } from "@auth0/auth0-react";
import { AlertCircle } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import * as React from "react";
import { AuthBanner } from "../components/AuthBanner";
import { PdfViewerAdvanced } from "../components/PdfViewerAdvanced";
import { SignatureAcceptanceDialog, SignatureData } from "../components/SignatureAcceptanceDialog";

// GraphQL Mutations
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

export default function BuyerQuoteViewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const config = useConfig();
  const quoteId = params?.quote_id as string;
  const { notifySuccess, notifyError } = useNotification();
  const { isAuthenticated, isLoading } = useAuth0();

  // Extract URL parameters from search params
  const fileKey = searchParams.get("file_key");
  const pdfQuoteId = searchParams.get("sales_quote_id");
  const workspaceId = searchParams.get("workspace_id");
  const recipientEmail = searchParams.get("recipient_email");
  const recipientName = searchParams.get("recipient_name");

  // Build PDF URL from GraphQL endpoint
  const pdfUrl = React.useMemo(() => {
    if (!fileKey || !pdfQuoteId || !workspaceId) return null;

    // Derive API base URL from GraphQL URL
    const graphqlUrl = new URL(config.graphqlUrl);
    const apiBase = `${graphqlUrl.protocol}//${graphqlUrl.host}${graphqlUrl.pathname.replace(/\/graphql$/, "")}`;

    return `${apiBase}/api/pdf?file_key=${encodeURIComponent(fileKey)}&quote_id=${encodeURIComponent(pdfQuoteId)}&workspace_id=${encodeURIComponent(workspaceId)}`;
  }, [fileKey, pdfQuoteId, workspaceId, config.graphqlUrl]);

  const [acceptDialogOpen, setAcceptDialogOpen] = React.useState(false);

  const [acceptQuote, { loading: accepting }] = useAcceptQuoteMutation();

  const handleAcceptWithSignature = async (signatureData: SignatureData) => {
    console.log("Quote accepted with signature:", signatureData);
    // TODO: Send signature data to backend when endpoint is ready
    try {
      await acceptQuote({
        variables: {
          input: {
            quoteId,
          },
        },
      });
      notifySuccess("Quote accepted successfully!");
      setAcceptDialogOpen(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to accept quote";
      notifyError(errorMessage);
    }
  };

  // Show loading state while auth is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If we have PDF URL params, show the PDF viewer for ALL users
  if (pdfUrl) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        {/* Only show auth banner for unauthenticated users */}
        {!isAuthenticated && <AuthBanner />}
        <PdfViewerAdvanced
          pdfUrl={pdfUrl}
          showAcceptButton={true}
          onAcceptClick={() => setAcceptDialogOpen(true)}
          hasBanner={!isAuthenticated}
        />
        {/* Signature Acceptance Dialog */}
        <SignatureAcceptanceDialog
          open={acceptDialogOpen}
          onClose={() => setAcceptDialogOpen(false)}
          onAccept={handleAcceptWithSignature}
          quoteNumber={quoteId}
          totalAmount="Quote Total"
          defaultName={recipientName || ""}
          loading={accepting}
        />
      </div>
    );
  }

  // No PDF params - show appropriate message based on auth state
  if (!isAuthenticated) {
    // Unauthenticated without PDF params - prompt to sign in
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <AuthBanner />
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h2>
            <p className="text-gray-600">
              Please sign in to view this quote. If you don&apos;t have an account, contact the
              seller for assistance.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated but no PDF params - show message
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Quote Document Unavailable</h2>
          <p className="text-gray-600">
            The quote document link appears to be incomplete. Please use the link from your email to
            view the quote.
          </p>
        </div>
      </div>
    </div>
  );
}
