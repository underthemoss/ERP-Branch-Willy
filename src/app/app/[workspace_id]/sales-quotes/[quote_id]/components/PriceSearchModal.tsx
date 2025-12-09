"use client";

import { createSearchClient } from "@/lib/searchClient";
import { useConfig } from "@/providers/ConfigProvider";
import { GeneratedImage } from "@/ui/GeneratedImage";
import { useAuth0 } from "@auth0/auth0-react";
import { Book, Calendar, Check, Info, PlusCircle, Search, X } from "lucide-react";
import * as React from "react";
import {
  Configure,
  HierarchicalMenu,
  InstantSearch,
  useClearRefinements,
  useCurrentRefinements,
  useHits,
  usePagination,
  useRefinementList,
  useSearchBox,
  useStats,
} from "react-instantsearch";
import { AddNewPriceDialog } from "./AddNewPriceDialog";
import "instantsearch.css/themes/satellite.css";

// Types
export interface PriceHit {
  objectID: string;
  _id: string;
  workspaceId: string;
  name: string | null;
  priceType: "RENTAL" | "SALE";
  pimCategoryId: string;
  pimCategoryPath: string;
  pimCategoryName: string;
  pimProductId: string | null;
  priceBookId: string | null;
  pricePerDayInCents: number | null;
  pricePerWeekInCents: number | null;
  pricePerMonthInCents: number | null;
  unitCostInCents: number | null;
  price_book: { name: string } | null;
  location: string | null;
  category_lvl1?: string;
  category_lvl2?: string;
  category_lvl3?: string;
  category_lvl4?: string;
  category_lvl5?: string;
  category_lvl6?: string;
  category_lvl7?: string;
  category_lvl8?: string;
  category_lvl9?: string;
  category_lvl10?: string;
  category_lvl11?: string;
  category_lvl12?: string;
}

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

interface PriceSearchModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (price: PriceHit) => void;
  onPriceCreated?: (priceId: string) => void;
  workspaceId: string;
  pimCategoryId?: string;
  pimCategoryName?: string;
  priceType?: "RENTAL" | "SALE";
  currentPriceId?: string;
  originalRequest?: OriginalRequest;
}

// Search Bar Component
function SearchBar() {
  const { query, refine } = useSearchBox();
  const [localQuery, setLocalQuery] = React.useState(query);

  React.useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        value={localQuery}
        onChange={(e) => {
          setLocalQuery(e.target.value);
          refine(e.target.value);
        }}
        placeholder="Search prices..."
        className="w-full pl-10 pr-10 py-3 text-sm border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
      />
      {localQuery && (
        <button
          onClick={() => {
            setLocalQuery("");
            refine("");
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded cursor-pointer"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      )}
    </div>
  );
}

// Filter Section Component
function FilterSection({ title, attribute }: { title: string; attribute: string }) {
  const { items, refine } = useRefinementList({
    attribute,
    limit: 10,
    showMore: true,
    showMoreLimit: 50,
  });

  if (items.length === 0) return null;

  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">{title}</h3>
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {items.map((item) => (
          <label key={item.value} className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={item.isRefined}
              onChange={() => refine(item.value)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 group-hover:text-gray-900 truncate flex-1">
              {item.label}
            </span>
            <span className="text-xs text-gray-400 flex-shrink-0">{item.count}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// Active Filters Component
function ActiveFilters() {
  const { items: refinements } = useCurrentRefinements();
  const { refine: clearFilters, canRefine } = useClearRefinements();

  if (refinements.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {refinements.map((refinement) =>
        refinement.refinements.map((item) => (
          <button
            key={`${refinement.attribute}-${item.value}`}
            onClick={() => refinement.refine(item)}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium cursor-pointer hover:bg-blue-200 transition-colors"
          >
            {item.label}
            <X className="w-3 h-3" />
          </button>
        )),
      )}
      {canRefine && (
        <button
          onClick={() => clearFilters()}
          className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer underline"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

// Results Count
function ResultsBar() {
  const { nbHits } = useStats();
  return (
    <div className="mb-4">
      <p className="text-sm text-gray-600">
        <span className="font-semibold">{nbHits.toLocaleString()}</span> prices found
      </p>
    </div>
  );
}

// Price Card for Selection
function SelectablePriceCard({
  hit,
  onSelect,
  isCurrentPrice,
}: {
  hit: PriceHit;
  onSelect: (price: PriceHit) => void;
  isCurrentPrice: boolean;
}) {
  const priceName = hit.name || "Unnamed Price";
  const priceType = hit.priceType;

  const formatPrice = (cents: number | null): string => {
    if (cents === null || cents === undefined) return "-";
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div
      className={`bg-white rounded-lg border overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200 ${
        isCurrentPrice ? "border-green-500 ring-2 ring-green-200" : "border-gray-200"
      }`}
    >
      {/* Image */}
      <div className="relative w-full pt-[75%] bg-gray-100">
        <GeneratedImage
          entity="price"
          size="card"
          entityId={hit.objectID}
          alt={priceName}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        <div
          className={`absolute top-3 right-3 px-3 py-1 text-xs font-bold rounded ${
            priceType === "RENTAL" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
          }`}
        >
          {priceType}
        </div>
        {isCurrentPrice && (
          <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 text-xs font-semibold rounded flex items-center gap-1">
            <Check className="w-3 h-3" />
            Current
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[40px]">
          {priceName}
        </h3>

        {/* Price Book Badge */}
        {hit.price_book?.name && (
          <div className="mb-3">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 max-w-full">
              <Book className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{hit.price_book.name}</span>
            </span>
          </div>
        )}

        {/* Pricing */}
        <div className="border-t border-gray-100 pt-3 mb-3">
          {priceType === "RENTAL" ? (
            <div className="space-y-1 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">1 Day</span>
                <span className="font-semibold">{formatPrice(hit.pricePerDayInCents)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">7 Days</span>
                <span className="font-semibold">{formatPrice(hit.pricePerWeekInCents)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">28 Days</span>
                <span className="font-semibold">{formatPrice(hit.pricePerMonthInCents)}</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Unit Cost:</span>
              <span className="font-semibold">{formatPrice(hit.unitCostInCents)}</span>
            </div>
          )}
        </div>

        {/* Select Button */}
        <button
          onClick={() => onSelect(hit)}
          disabled={isCurrentPrice}
          className={`w-full py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 cursor-pointer transition-all ${
            isCurrentPrice
              ? "bg-green-100 text-green-700 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {isCurrentPrice ? (
            <>
              <Check className="w-4 h-4" />
              Current Price
            </>
          ) : (
            "Select Price"
          )}
        </button>
      </div>
    </div>
  );
}

// Price Grid
function PriceGrid({
  onSelect,
  currentPriceId,
}: {
  onSelect: (price: PriceHit) => void;
  currentPriceId?: string;
}) {
  const { hits } = useHits<PriceHit>();
  const { items: refinements } = useCurrentRefinements();
  const { refine: clearFilters, canRefine } = useClearRefinements();

  if (hits.length === 0) {
    const hasFilters = refinements.length > 0;

    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <Search className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
        <p className="text-sm text-gray-600 mb-4">
          {hasFilters
            ? "Try adjusting your search or removing some filters"
            : "Try adjusting your search terms"}
        </p>
        {hasFilters && canRefine && (
          <button
            onClick={() => clearFilters()}
            className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer font-medium"
          >
            Clear all filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {hits.map((hit) => (
        <SelectablePriceCard
          key={hit.objectID}
          hit={hit}
          onSelect={onSelect}
          isCurrentPrice={hit.objectID === currentPriceId}
        />
      ))}
    </div>
  );
}

// Pagination
function CustomPagination() {
  const { currentRefinement, nbPages, refine } = usePagination();

  if (nbPages <= 1) return null;

  const getVisiblePages = () => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 7;

    if (nbPages <= maxVisible) {
      return Array.from({ length: nbPages }, (_, i) => i);
    }

    pages.push(0);

    if (currentRefinement > 2) {
      pages.push("ellipsis");
    }

    const start = Math.max(1, currentRefinement - 1);
    const end = Math.min(nbPages - 2, currentRefinement + 1);

    for (let i = start; i <= end; i++) {
      if (!pages.includes(i)) pages.push(i);
    }

    if (currentRefinement < nbPages - 3) {
      pages.push("ellipsis");
    }

    if (!pages.includes(nbPages - 1)) {
      pages.push(nbPages - 1);
    }

    return pages;
  };

  return (
    <div className="flex justify-center items-center gap-1 mt-6">
      <button
        onClick={() => refine(currentRefinement - 1)}
        disabled={currentRefinement === 0}
        className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        Previous
      </button>

      {getVisiblePages().map((page, idx) =>
        page === "ellipsis" ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => refine(page)}
            className={`w-10 h-10 rounded text-sm font-medium cursor-pointer ${
              currentRefinement === page
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {page + 1}
          </button>
        ),
      )}

      <button
        onClick={() => refine(currentRefinement + 1)}
        disabled={currentRefinement >= nbPages - 1}
        className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        Next
      </button>
    </div>
  );
}

// Main Modal Component
export function PriceSearchModal({
  open,
  onClose,
  onSelect,
  onPriceCreated,
  workspaceId,
  pimCategoryId,
  pimCategoryName,
  priceType,
  currentPriceId,
  originalRequest,
}: PriceSearchModalProps) {
  const config = useConfig();
  const { getAccessTokenSilently } = useAuth0();
  const [searchClient, setSearchClient] = React.useState<ReturnType<
    typeof createSearchClient
  > | null>(null);
  const [addPriceDialogOpen, setAddPriceDialogOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;

    async function initializeSearch() {
      try {
        const token = await getAccessTokenSilently({ cacheMode: "on" });
        const client = createSearchClient(token, config.searchApiUrl, workspaceId);
        setSearchClient(client);
      } catch (err) {
        console.error("Error initializing search client:", err);
      }
    }

    initializeSearch();
  }, [open, getAccessTokenSilently, config.searchApiUrl, workspaceId]);

  // Build filters - workspaceId is always required, category and type are optional
  const workspaceFilter = `workspaceId:${workspaceId}`;
  const categoryFilter = pimCategoryId ? `pimCategoryId:${pimCategoryId}` : undefined;
  const typeFilter = priceType ? `priceType:${priceType}` : undefined;
  const filters = [workspaceFilter, categoryFilter, typeFilter].filter(Boolean).join(" AND ");

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-gray-50 rounded-xl shadow-2xl w-full max-w-6xl mx-4 h-[90vh] flex flex-col z-10">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white rounded-t-xl">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Select Price</h2>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-gray-500">
                  Search and select a price for this line item
                </p>
                {pimCategoryName && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                    {pimCategoryName}
                  </span>
                )}
                {priceType && (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      priceType === "RENTAL"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {priceType}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Original Request Info */}
          {originalRequest && (
            <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-blue-700 mb-1">Original Request</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <span className="font-medium text-gray-900">{originalRequest.description}</span>
                    {originalRequest.customPriceName && (
                      <span className="text-gray-600">
                        Requested: &quot;{originalRequest.customPriceName}&quot;
                      </span>
                    )}
                    <span className="text-gray-600">Qty: {originalRequest.quantity}</span>
                    {originalRequest.durationInDays > 0 && (
                      <span className="text-gray-600">{originalRequest.durationInDays} days</span>
                    )}
                    {originalRequest.rentalStartDate && originalRequest.rentalEndDate && (
                      <span className="inline-flex items-center gap-1 text-gray-600">
                        <Calendar className="w-3 h-3" />
                        {new Date(originalRequest.rentalStartDate).toLocaleDateString()} -{" "}
                        {new Date(originalRequest.rentalEndDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          {searchClient ? (
            <InstantSearch searchClient={searchClient} indexName="es_erp_prices">
              <Configure hitsPerPage={12} filters={filters} />

              <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <aside className="w-72 bg-white border-r border-gray-200 p-4 overflow-y-auto shrink-0">
                  <div className="mb-4">
                    <SearchBar />
                  </div>

                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Categories</h3>
                    <div className="max-h-48 overflow-y-auto">
                      <HierarchicalMenu
                        attributes={[
                          "category_lvl1",
                          "category_lvl2",
                          "category_lvl3",
                          "category_lvl4",
                          "category_lvl5",
                          "category_lvl6",
                        ]}
                        limit={50}
                        separator="|"
                        sortBy={["name"]}
                      />
                    </div>
                  </div>

                  <FilterSection title="Price Type" attribute="priceType" />
                  <FilterSection title="Price Book" attribute="price_book_name" />
                  <FilterSection title="Location" attribute="location" />
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-4 overflow-y-auto">
                  <ActiveFilters />
                  <ResultsBar />
                  <PriceGrid onSelect={onSelect} currentPriceId={currentPriceId} />
                  <CustomPagination />
                </main>
              </div>

              {/* Floating Add New Price Button */}
              <div className="absolute bottom-6 left-6">
                <button
                  onClick={() => setAddPriceDialogOpen(true)}
                  className="flex items-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-lg font-medium transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-5 h-5" />
                  Add New Price
                </button>
              </div>
            </InstantSearch>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500">Loading search...</p>
            </div>
          )}
        </div>
      </div>

      {/* Add New Price Dialog */}
      {priceType && (
        <AddNewPriceDialog
          open={addPriceDialogOpen}
          onClose={() => setAddPriceDialogOpen(false)}
          onPriceCreated={(priceId) => {
            setAddPriceDialogOpen(false);
            if (onPriceCreated) {
              onPriceCreated(priceId);
            }
          }}
          workspaceId={workspaceId}
          pimCategoryId={pimCategoryId}
          pimCategoryName={pimCategoryName}
          priceType={priceType}
          originalRequest={originalRequest}
        />
      )}
    </>
  );
}
