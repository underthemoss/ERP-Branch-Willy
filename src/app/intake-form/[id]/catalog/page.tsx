"use client";

import { createSearchClient } from "@/lib/searchClient";
import { useConfig } from "@/providers/ConfigProvider";
import {
  useGetIntakeFormByIdQuery,
  useGetIntakeFormSubmissionByIdQuery,
} from "@/ui/intake-forms/api";
import { useAuth0 } from "@auth0/auth0-react";
import { CircularProgress, Container, Paper, Typography } from "@mui/material";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import {
  Configure,
  InstantSearch,
  useBreadcrumb,
  useClearRefinements,
  useCurrentRefinements,
  usePagination,
  useStats,
} from "react-instantsearch";
import "instantsearch.css/themes/satellite.css";
import { HelpCircle } from "lucide-react";
import CartDrawer from "./components/CartDrawer";
import CatalogHeader from "./components/CatalogHeader";
import CatalogPriceGrid from "./components/CatalogPriceGrid";
import CatalogSidebar from "./components/CatalogSidebar";
import CheckoutModal from "./components/CheckoutModal";
import DeliveryDetailsDialog from "./components/DeliveryDetailsDialog";
import OrderConfirmation from "./components/OrderConfirmation";
import RequestUnlistedItemDialog from "./components/RequestUnlistedItemDialog";
import { CartProvider, PriceHit, useCart } from "./context/CartContext";

// Category Breadcrumbs Component
function CategoryBreadcrumbs() {
  const { items, refine } = useBreadcrumb({
    attributes: [
      "category_lvl1",
      "category_lvl2",
      "category_lvl3",
      "category_lvl4",
      "category_lvl5",
      "category_lvl6",
      "category_lvl7",
      "category_lvl8",
      "category_lvl9",
      "category_lvl10",
      "category_lvl11",
      "category_lvl12",
    ],
  });

  return (
    <div className="flex items-center gap-2 text-sm">
      {items.length === 0 ? (
        <span className="text-gray-900 font-semibold">All Categories</span>
      ) : (
        <>
          <button
            onClick={() => refine(null)}
            className="text-gray-600 hover:text-gray-900 font-medium cursor-pointer transition-colors"
          >
            All Categories
          </button>
          {items.map((item, index) => (
            <React.Fragment key={item.value}>
              <span className="text-gray-400">/</span>
              <button
                onClick={() => refine(item.value)}
                className={`hover:text-gray-900 cursor-pointer transition-colors ${
                  index === items.length - 1
                    ? "text-gray-900 font-semibold"
                    : "text-gray-600 font-medium"
                }`}
              >
                {item.label}
              </button>
            </React.Fragment>
          ))}
        </>
      )}
    </div>
  );
}

// Results Bar
function ResultsBar() {
  const { nbHits } = useStats();

  return (
    <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
      <div className="text-sm text-gray-600">
        <span className="font-semibold text-gray-900">{nbHits.toLocaleString()}</span> results
      </div>
    </div>
  );
}

// Pagination Component
function CustomPagination() {
  const { currentRefinement, nbPages, refine } = usePagination();

  if (nbPages <= 1) return null;

  const pages = Array.from({ length: nbPages }, (_, i) => i);
  const maxVisible = 7;
  let visiblePages: number[];

  if (nbPages <= maxVisible) {
    visiblePages = pages;
  } else {
    const start = Math.max(0, currentRefinement - 3);
    const end = Math.min(nbPages, start + maxVisible);
    visiblePages = pages.slice(start, end);
  }

  return (
    <div className="flex justify-center items-center gap-2 mt-8">
      <button
        onClick={() => refine(currentRefinement - 1)}
        disabled={currentRefinement === 0}
        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {visiblePages[0] > 0 && (
        <>
          <button
            onClick={() => refine(0)}
            className="min-w-[40px] h-10 px-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            1
          </button>
          {visiblePages[0] > 1 && <span className="text-gray-400">...</span>}
        </>
      )}

      {visiblePages.map((page) => (
        <button
          key={page}
          onClick={() => refine(page)}
          className={`min-w-[40px] h-10 px-3 rounded-lg border cursor-pointer ${
            page === currentRefinement
              ? "bg-blue-600 text-white border-blue-600"
              : "border-gray-300 hover:bg-gray-50"
          }`}
        >
          {page + 1}
        </button>
      ))}

      {visiblePages[visiblePages.length - 1] < nbPages - 1 && (
        <>
          {visiblePages[visiblePages.length - 1] < nbPages - 2 && (
            <span className="text-gray-400">...</span>
          )}
          <button
            onClick={() => refine(nbPages - 1)}
            className="min-w-[40px] h-10 px-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            {nbPages}
          </button>
        </>
      )}

      <button
        onClick={() => refine(currentRefinement + 1)}
        disabled={currentRefinement >= nbPages - 1}
        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

// Active Filters Component
function ActiveFilters() {
  const { items } = useCurrentRefinements();
  const { refine: clear } = useClearRefinements({
    excludedAttributes: [
      "category_lvl1",
      "category_lvl2",
      "category_lvl3",
      "category_lvl4",
      "category_lvl5",
      "category_lvl6",
      "category_lvl7",
      "category_lvl8",
      "category_lvl9",
      "category_lvl10",
      "category_lvl11",
      "category_lvl12",
    ],
  });

  const nonCategoryItems = items.filter((item) => !item.attribute.startsWith("category_lvl"));

  if (nonCategoryItems.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {nonCategoryItems.map((item) =>
        item.refinements.map((refinement) => (
          <div
            key={`${item.attribute}-${refinement.label}`}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs text-blue-700 font-medium"
          >
            <span>{refinement.label}</span>
            <button
              onClick={() => item.refine(refinement)}
              className="hover:text-blue-900 cursor-pointer"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )),
      )}
      {nonCategoryItems.length > 0 && (
        <button
          onClick={() => clear()}
          className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-300 rounded-full hover:bg-gray-50 cursor-pointer"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

// Main Catalog Content Component
function CatalogContent({
  formId,
  projectName,
  companyName,
  logoUrl,
  pricebookId,
}: {
  formId: string;
  projectName: string;
  companyName: string;
  logoUrl?: string;
  pricebookId?: string;
}) {
  const cart = useCart();
  const [selectedPrice, setSelectedPrice] = useState<PriceHit | null>(null);
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isUnlistedDialogOpen, setIsUnlistedDialogOpen] = useState(false);

  const handlePriceClick = (priceHit: PriceHit) => {
    setSelectedPrice(priceHit);
    setIsDeliveryDialogOpen(true);
  };

  const handleDeliveryClose = () => {
    setIsDeliveryDialogOpen(false);
    setSelectedPrice(null);
  };

  const handleUnlistedItemSubmit = (customPriceHit: PriceHit) => {
    // Close the unlisted dialog and open delivery dialog with the custom item
    setIsUnlistedDialogOpen(false);
    setSelectedPrice(customPriceHit);
    setIsDeliveryDialogOpen(true);
  };

  const handleCheckoutOpen = () => {
    cart.closeDrawer();
    setIsCheckoutOpen(true);
  };

  const handleCheckoutClose = () => {
    setIsCheckoutOpen(false);
  };

  // Show confirmation if submitted
  if (cart.isSubmitted) {
    return <OrderConfirmation projectName={projectName} companyName={companyName} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <CatalogHeader
        projectName={projectName}
        companyName={companyName}
        logoUrl={logoUrl}
        formId={formId}
      />

      {/* Category Breadcrumbs */}
      <div className="w-full px-6 py-3 bg-gray-50/80 backdrop-blur-sm border-b border-gray-200">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
          <CategoryBreadcrumbs />
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="flex">
        {/* Sidebar Filters */}
        <CatalogSidebar />

        {/* Main Content */}
        <main className="flex-1 p-6">
          <ActiveFilters />
          <ResultsBar />
          <CatalogPriceGrid onPriceClick={handlePriceClick} />
          <CustomPagination />
        </main>
      </div>

      {/* Cart Drawer */}
      <CartDrawer onCheckout={handleCheckoutOpen} />

      {/* Floating "Request Unlisted Item" Button */}
      <button
        onClick={() => setIsUnlistedDialogOpen(true)}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-full shadow-lg hover:shadow-xl hover:border-gray-400 transition-all text-gray-700 hover:text-gray-900 cursor-pointer"
      >
        <HelpCircle className="w-5 h-5" />
        <span className="text-sm font-medium">Can&apos;t find what you need?</span>
      </button>

      {/* Request Unlisted Item Dialog */}
      <RequestUnlistedItemDialog
        open={isUnlistedDialogOpen}
        onClose={() => setIsUnlistedDialogOpen(false)}
        onSubmit={handleUnlistedItemSubmit}
      />

      {/* Delivery Details Dialog */}
      {selectedPrice && (
        <DeliveryDetailsDialog
          open={isDeliveryDialogOpen}
          onClose={handleDeliveryClose}
          priceHit={selectedPrice}
        />
      )}

      {/* Checkout Modal */}
      <CheckoutModal open={isCheckoutOpen} onClose={handleCheckoutClose} />

      {/* Pricebook Filter */}
      <Configure
        filters={pricebookId ? `priceBookId:${pricebookId}` : undefined}
        hitsPerPage={24}
      />
    </div>
  );
}

// Main Page Component
export default function IntakeFormCatalogPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const formId = params.id as string;
  const submissionId = searchParams.get("submissionId");
  const config = useConfig();
  const { getAccessTokenSilently, loginWithRedirect, user } = useAuth0();
  const [searchClient, setSearchClient] = useState<ReturnType<typeof createSearchClient> | null>(
    null,
  );

  // Query to get the intake form by ID
  const {
    data: intakeFormData,
    loading: loadingForm,
    error: formError,
  } = useGetIntakeFormByIdQuery({
    variables: { id: formId },
    fetchPolicy: "cache-and-network",
    skip: !formId,
  });

  // Query to check if submission is already submitted
  const { data: submissionData, loading: loadingSubmission } = useGetIntakeFormSubmissionByIdQuery({
    variables: { id: submissionId || "" },
    fetchPolicy: "cache-and-network",
    skip: !submissionId,
  });

  // Redirect to orders page if submission is already submitted
  useEffect(() => {
    if (submissionData?.getIntakeFormSubmissionById?.status === "SUBMITTED") {
      router.replace(`/intake-form/${formId}/orders/${submissionId}`);
    }
  }, [submissionData, formId, submissionId, router]);

  // Extract form details
  const intakeForm = intakeFormData?.getIntakeFormById;
  const workspaceId = intakeForm?.workspaceId;
  const pricebookId = intakeForm?.pricebookId;

  // Initialize search client
  useEffect(() => {
    async function initializeSearch() {
      try {
        const token = await getAccessTokenSilently({ cacheMode: "on" });
        const client = createSearchClient(token, config.searchApiUrl, workspaceId);
        setSearchClient(client);
      } catch (err) {
        console.error("Error initializing search client:", err);
      }
    }

    if (workspaceId) {
      initializeSearch();
    }
  }, [getAccessTokenSilently, config.searchApiUrl, workspaceId]);

  // Loading state (including submission check)
  if (loadingForm || loadingSubmission) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={1} sx={{ p: 4, textAlign: "center" }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading catalog...</Typography>
        </Paper>
      </Container>
    );
  }

  // Don't render if redirecting to orders page
  if (submissionData?.getIntakeFormSubmissionById?.status === "SUBMITTED") {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={1} sx={{ p: 4, textAlign: "center" }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Redirecting to your order...</Typography>
        </Paper>
      </Container>
    );
  }

  // Permission error - redirect to login
  if (formError && formError.message.includes("permission")) {
    if (user) {
      return (
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Paper elevation={1} sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h6" color="error" gutterBottom>
              Access Denied
            </Typography>
            <Typography>
              You do not have permission to access this intake form. Please contact the form
              administrator for access.
            </Typography>
          </Paper>
        </Container>
      );
    }
    loginWithRedirect({
      appState: {
        returnTo: window.location.pathname + window.location.search,
      },
    });
    return null;
  }

  // Form not found
  if (formError || (!loadingForm && !intakeForm)) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={1} sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" color="error" gutterBottom>
            Form Not Found
          </Typography>
          <Typography>
            The intake form you&apos;re looking for could not be found or is no longer active.
          </Typography>
        </Paper>
      </Container>
    );
  }

  // Form inactive
  if (!intakeForm?.isActive) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={1} sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" color="warning.main" gutterBottom>
            Form Inactive
          </Typography>
          <Typography>This intake form is no longer accepting submissions.</Typography>
        </Paper>
      </Container>
    );
  }

  // Loading search client
  if (!searchClient) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={1} sx={{ p: 4, textAlign: "center" }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Initializing search...</Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <CartProvider formId={formId} workspaceId={workspaceId || ""}>
      <InstantSearch searchClient={searchClient} indexName="es_erp_prices">
        <CatalogContent
          formId={formId}
          projectName={intakeForm?.project?.name || "Equipment Request"}
          companyName={intakeForm?.workspace?.name || ""}
          logoUrl={intakeForm?.workspace?.logoUrl || undefined}
          pricebookId={pricebookId || undefined}
        />
      </InstantSearch>
    </CartProvider>
  );
}
