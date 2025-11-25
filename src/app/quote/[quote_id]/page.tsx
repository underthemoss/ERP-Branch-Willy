"use client";

import { graphql } from "@/graphql";
import { useAcceptQuoteMutation } from "@/graphql/hooks";
import { useConfig } from "@/providers/ConfigProvider";
import { useNotification } from "@/providers/NotificationProvider";
import { useAuth0 } from "@auth0/auth0-react";
import { FileQuestion, FileText, Lock, Sparkles } from "lucide-react";
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
  const { notifySuccess } = useNotification();
  const { isAuthenticated, isLoading } = useAuth0();

  // Extract URL parameters from search params
  const fileKey = searchParams.get("file_key");
  const pdfQuoteId = searchParams.get("sales_quote_id");
  const workspaceId = searchParams.get("workspace_id");
  const recipientName = searchParams.get("recipient_name");

  // Build PDF URL from GraphQL endpoint
  const pdfUrl = React.useMemo(() => {
    if (!fileKey || !pdfQuoteId || !workspaceId) return null;

    const graphqlUrl = new URL(config.graphqlUrl);
    const apiBase = `${graphqlUrl.protocol}//${graphqlUrl.host}${graphqlUrl.pathname.replace(/\/graphql$/, "")}`;

    return `${apiBase}/api/pdf?file_key=${encodeURIComponent(fileKey)}&quote_id=${encodeURIComponent(pdfQuoteId)}&workspace_id=${encodeURIComponent(workspaceId)}`;
  }, [fileKey, pdfQuoteId, workspaceId, config.graphqlUrl]);

  const [acceptDialogOpen, setAcceptDialogOpen] = React.useState(false);

  const [acceptQuote, { loading: accepting }] = useAcceptQuoteMutation();

  const handleAcceptWithSignature = async (signatureData: SignatureData): Promise<void> => {
    console.log("Quote accepted with signature:", signatureData);
    const result = await acceptQuote({
      variables: {
        input: {
          quoteId,
        },
      },
    });

    if (result.errors && result.errors.length > 0) {
      throw new Error(result.errors[0].message);
    }

    notifySuccess("Quote accepted successfully!");
    setTimeout(() => {
      setAcceptDialogOpen(false);
    }, 2000);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-5">
            <div className="animate-spin rounded-full h-7 w-7 border-2 border-emerald-200 border-t-emerald-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Loading</h2>
          <p className="text-sm text-slate-500">Preparing your quote...</p>
        </div>
      </div>
    );
  }

  // PDF viewer for all users with valid URL
  if (pdfUrl) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        {!isAuthenticated && <AuthBanner />}
        <PdfViewerAdvanced
          pdfUrl={pdfUrl}
          showAcceptButton={true}
          onAcceptClick={() => setAcceptDialogOpen(true)}
          hasBanner={!isAuthenticated}
        />
        <SignatureAcceptanceDialog
          open={acceptDialogOpen}
          onClose={() => setAcceptDialogOpen(false)}
          onAccept={handleAcceptWithSignature}
          quoteNumber={quoteId}
          defaultName={recipientName || ""}
          loading={accepting}
        />
      </div>
    );
  }

  // No PDF params - show appropriate message based on auth state
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        <AuthBanner />
        <div className="min-h-[calc(100vh-72px)] flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-slate-500/20">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-slate-900 mb-3">Sign in to continue</h1>
            <p className="text-slate-600 text-sm leading-relaxed mb-8">
              Sign in to view this quote. If you don&apos;t have an account yet, contact your sales
              representative for assistance.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 text-sm rounded-xl">
                <Sparkles className="w-4 h-4" />
                Use the link from your email
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated but no PDF params
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/20">
            <FileQuestion className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-3">Quote not found</h1>
          <p className="text-slate-600 text-sm leading-relaxed mb-8">
            The link appears to be incomplete or has expired. Please use the original link from your
            email to view the quote.
          </p>
          <div className="flex flex-col gap-4 items-center">
            <div className="inline-flex items-center gap-3 px-5 py-3 bg-white border border-slate-200 rounded-xl shadow-sm">
              <FileText className="w-5 h-5 text-slate-400" />
              <span className="text-sm text-slate-600">Check your email for the quote link</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
