"use client";

import { graphql } from "@/graphql";
import {
  QuoteLineItemType,
  useCartPage_CreateQuoteRevisionMutation,
  useCartPage_GetQuoteByIdQuery,
  useCartPage_UpdateQuoteMutation,
} from "@/graphql/hooks";
import { createSearchClient } from "@/lib/searchClient";
import { useConfig } from "@/providers/ConfigProvider";
import { useNotification } from "@/providers/NotificationProvider";
import { GeneratedImage } from "@/ui/GeneratedImage";
import { useAuth0 } from "@auth0/auth0-react";
import { history } from "instantsearch.js/es/lib/routers";
import { simple } from "instantsearch.js/es/lib/stateMappings";
import { Book, Calendar, Check, Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import {
  Configure,
  HierarchicalMenu,
  InstantSearch,
  useBreadcrumb,
  useClearRefinements,
  useCurrentRefinements,
  useHits,
  usePagination,
  useRefinementList,
  useSearchBox,
  useStats,
} from "react-instantsearch";
import "instantsearch.css/themes/satellite.css";
import { DateRange } from "@mui/x-date-pickers-pro";
import { DateRangeCalendar } from "@mui/x-date-pickers-pro/DateRangeCalendar";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

// GraphQL Queries
graphql(`
  query CartPage_GetQuoteById($id: String!) {
    quoteById(id: $id) {
      id
      status
      sellerWorkspaceId
      currentRevisionId
      currentRevision {
        id
        revisionNumber
        lineItems {
          ... on QuoteRevisionRentalLineItem {
            id
            type
            description
            sellersPriceId
            pimCategoryId
            quantity
            rentalStartDate
            rentalEndDate
            price {
              ... on RentalPrice {
                id
                name
                pricePerDayInCents
                pricePerWeekInCents
                pricePerMonthInCents
                pimCategoryName
                pimCategoryPath
              }
            }
          }
          ... on QuoteRevisionSaleLineItem {
            id
            type
            description
            sellersPriceId
            pimCategoryId
            quantity
            price {
              ... on SalePrice {
                id
                name
                unitCostInCents
                pimCategoryName
                pimCategoryPath
              }
            }
          }
        }
      }
    }
  }
`);

graphql(`
  mutation CartPage_CreateQuoteRevision($input: CreateQuoteRevisionInput!) {
    createQuoteRevision(input: $input) {
      id
      quoteId
      revisionNumber
    }
  }
`);

graphql(`
  mutation CartPage_UpdateQuote($input: UpdateQuoteInput!) {
    updateQuote(input: $input) {
      id
      currentRevisionId
    }
  }
`);

// Types
interface PriceHit {
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

interface CartItem {
  priceId: string;
  priceName: string;
  priceType: "RENTAL" | "SALE";
  quantity: number;
  unitCostInCents?: number;
  pricePerDayInCents?: number;
  pricePerWeekInCents?: number;
  pricePerMonthInCents?: number;
  pimCategoryId: string;
  pimCategoryName: string;
  description: string;
  // Per-item rental dates
  rentalStartDate?: Date | null;
  rentalEndDate?: Date | null;
  // Unique identifier for cart items (especially important for rentals)
  cartItemId?: string;
}

interface CartContextType {
  saleItems: CartItem[];
  rentalItems: CartItem[];
  isDrawerOpen: boolean;
  addItem: (hit: PriceHit) => void;
  removeItem: (cartItemId: string, type: "RENTAL" | "SALE") => void;
  updateQuantity: (priceId: string, type: "RENTAL" | "SALE", quantity: number) => void;
  updateRentalDates: (cartItemId: string, start: Date | null, end: Date | null) => void;
  toggleDrawer: () => void;
  getTotalItems: () => number;
  cartAnimation: boolean;
}

const CartContext = React.createContext<CartContextType | undefined>(undefined);

function useCart() {
  const context = React.useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}

// Cart Provider
function CartProvider({ children, quoteData }: { children: React.ReactNode; quoteData: any }) {
  const [saleItems, setSaleItems] = React.useState<CartItem[]>([]);
  const [rentalItems, setRentalItems] = React.useState<CartItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [cartAnimation, setCartAnimation] = React.useState(false);
  const [isHydrated, setIsHydrated] = React.useState(false);

  // Hydrate cart from quote data on mount
  React.useEffect(() => {
    if (isHydrated || !quoteData?.quoteById?.currentRevision?.lineItems) {
      return;
    }

    const lineItems = quoteData.quoteById.currentRevision.lineItems;
    const newSaleItems: CartItem[] = [];
    const newRentalItems: CartItem[] = [];

    lineItems.forEach((lineItem: any) => {
      if (lineItem.type === "SALE") {
        const cartItem: CartItem = {
          priceId: lineItem.sellersPriceId,
          priceName: lineItem.price?.name || lineItem.description,
          priceType: "SALE",
          quantity: lineItem.quantity,
          unitCostInCents: lineItem.price?.unitCostInCents,
          pimCategoryId: lineItem.pimCategoryId,
          pimCategoryName: lineItem.price?.pimCategoryName || "",
          description: lineItem.description,
          cartItemId: crypto.randomUUID(),
        };
        newSaleItems.push(cartItem);
      } else if (lineItem.type === "RENTAL") {
        const cartItem: CartItem = {
          priceId: lineItem.sellersPriceId,
          priceName: lineItem.price?.name || lineItem.description,
          priceType: "RENTAL",
          quantity: lineItem.quantity,
          pricePerDayInCents: lineItem.price?.pricePerDayInCents,
          pricePerWeekInCents: lineItem.price?.pricePerWeekInCents,
          pricePerMonthInCents: lineItem.price?.pricePerMonthInCents,
          pimCategoryId: lineItem.pimCategoryId,
          pimCategoryName: lineItem.price?.pimCategoryName || "",
          description: lineItem.description,
          rentalStartDate: lineItem.rentalStartDate ? new Date(lineItem.rentalStartDate) : null,
          rentalEndDate: lineItem.rentalEndDate ? new Date(lineItem.rentalEndDate) : null,
          cartItemId: crypto.randomUUID(),
        };
        newRentalItems.push(cartItem);
      }
    });

    setSaleItems(newSaleItems);
    setRentalItems(newRentalItems);
    setIsHydrated(true);
  }, [quoteData, isHydrated]);

  const addItem = (hit: PriceHit) => {
    const item: CartItem = {
      priceId: hit.objectID,
      priceName: hit.name || "Unnamed Price",
      priceType: hit.priceType,
      quantity: 1,
      unitCostInCents: hit.unitCostInCents || undefined,
      pricePerDayInCents: hit.pricePerDayInCents || undefined,
      pricePerWeekInCents: hit.pricePerWeekInCents || undefined,
      pricePerMonthInCents: hit.pricePerMonthInCents || undefined,
      pimCategoryId: hit.pimCategoryId,
      pimCategoryName: hit.pimCategoryName,
      description: hit.name || "Unnamed Price",
      rentalStartDate: null,
      rentalEndDate: null,
      cartItemId: crypto.randomUUID(), // Unique ID for each cart item
    };

    if (hit.priceType === "SALE") {
      // For SALE items, increment quantity if already exists
      setSaleItems((prev) => {
        const exists = prev.find((i) => i.priceId === item.priceId);
        if (exists) {
          return prev.map((i) =>
            i.priceId === item.priceId ? { ...i, quantity: i.quantity + 1 } : i,
          );
        }
        return [...prev, item];
      });
    } else {
      // For RENTAL items, always create a new entry (never increment quantity)
      // Each rental can have different dates, so each is unique
      setRentalItems((prev) => [...prev, item]);
    }

    // Trigger cart button animation
    setCartAnimation(true);
    setTimeout(() => setCartAnimation(false), 600);
  };

  const removeItem = (cartItemId: string, type: "RENTAL" | "SALE") => {
    if (type === "SALE") {
      setSaleItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
    } else {
      setRentalItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
    }
  };

  const updateQuantity = (priceId: string, type: "RENTAL" | "SALE", quantity: number) => {
    if (quantity < 1) return;

    if (type === "SALE") {
      setSaleItems((prev) => prev.map((i) => (i.priceId === priceId ? { ...i, quantity } : i)));
    } else {
      setRentalItems((prev) => prev.map((i) => (i.priceId === priceId ? { ...i, quantity } : i)));
    }
  };

  const updateRentalDates = (cartItemId: string, start: Date | null, end: Date | null) => {
    setRentalItems((prev) =>
      prev.map((i) =>
        i.cartItemId === cartItemId ? { ...i, rentalStartDate: start, rentalEndDate: end } : i,
      ),
    );
  };

  const toggleDrawer = () => {
    setIsDrawerOpen((prev) => !prev);
  };

  const getTotalItems = () => {
    return (
      saleItems.reduce((sum, item) => sum + item.quantity, 0) +
      rentalItems.reduce((sum, item) => sum + item.quantity, 0)
    );
  };

  return (
    <CartContext.Provider
      value={{
        saleItems,
        rentalItems,
        isDrawerOpen,
        addItem,
        removeItem,
        updateQuantity,
        updateRentalDates,
        toggleDrawer,
        getTotalItems,
        cartAnimation,
      }}
    >
      {children}
    </CartContext.Provider>
  );
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
      <input
        type="text"
        value={localQuery}
        onChange={(e) => {
          setLocalQuery(e.target.value);
          refine(e.target.value);
        }}
        placeholder="Search"
        className="w-full pl-4 pr-20 py-3 text-sm border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
      />

      {/* Right-side buttons container */}
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
        {localQuery && (
          <button
            onClick={() => {
              setLocalQuery("");
              refine("");
            }}
            className="p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
        <button className="p-2 bg-gray-200 hover:bg-gray-300 rounded transition-colors cursor-pointer">
          <svg
            className="w-4 h-4 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Filter Section Component
interface FilterProps {
  title: string;
  attribute: string;
  searchable?: boolean;
}

function FilterSection({ title, attribute, searchable = false }: FilterProps) {
  const { items, refine, searchForItems } = useRefinementList({
    attribute,
    limit: 100,
  });
  const [showAll, setShowAll] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  if (items.length === 0 && !searchQuery) return null;

  const displayItems = showAll ? items : items.slice(0, 6);

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>

      {searchable && (
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            searchForItems(e.target.value);
          }}
          placeholder={`Search ${title.toLowerCase()}...`}
          className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg mb-2 focus:border-blue-500 outline-none"
        />
      )}

      {items.length === 0 && searchQuery ? (
        <p className="text-xs text-gray-500 text-center py-2">No results found</p>
      ) : (
        <div className="space-y-1.5">
          {displayItems.map((item) => (
            <label
              key={item.label}
              className="flex items-center cursor-pointer px-2 py-1.5 rounded hover:bg-gray-50 transition-colors"
            >
              <input
                type="checkbox"
                checked={item.isRefined}
                onChange={() => refine(item.value)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
              />
              <span
                className={`ml-2 text-sm flex-1 ${item.isRefined ? "font-medium text-gray-900" : "text-gray-700"}`}
              >
                {item.label}
              </span>
              <span className="text-xs text-gray-500">{item.count}</span>
            </label>
          ))}
        </div>
      )}

      {items.length > 6 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
        >
          {showAll ? "Show less" : `Show ${items.length - 6} more`}
        </button>
      )}
    </div>
  );
}

// Category Breadcrumbs Component
function CategoryBreadcrumbs() {
  const { items, refine, canRefine } = useBreadcrumb({
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

  // Always show breadcrumbs, even with no selection
  return (
    <div className="flex items-center gap-2 text-sm">
      {items.length === 0 ? (
        // No category selected - show just "All Categories" as current
        <span className="text-gray-900 font-semibold">All Categories</span>
      ) : (
        // Categories selected - show full breadcrumb trail
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

// Active Filters Component (excluding categories)
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

  // Filter out category refinements
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
              <X className="w-3 h-3" />
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

// Price Card Component
function PriceCard({ hit }: { hit: PriceHit }) {
  const cart = useCart();
  const priceName = hit.name || "Unnamed Price";
  const priceType = hit.priceType;
  const [buttonState, setButtonState] = React.useState<"default" | "adding" | "added">("default");

  const isInCart =
    priceType === "SALE"
      ? cart.saleItems.some((i) => i.priceId === hit.objectID)
      : cart.rentalItems.some((i) => i.priceId === hit.objectID);

  const handleAddItem = () => {
    setButtonState("adding");
    cart.addItem(hit);

    // Show "Item added" state
    setTimeout(() => {
      setButtonState("added");
      // Revert back to default
      setTimeout(() => {
        setButtonState("default");
      }, 1500);
    }, 300);
  };

  const formatPrice = (cents: number | null): string => {
    if (cents === null || cents === undefined) return "-";
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
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
        {isInCart && (
          <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 text-xs font-semibold rounded flex items-center gap-1">
            <ShoppingCart className="w-3 h-3" />
            In Cart
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
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-600">7 Days</span>
                  {hit.pricePerDayInCents &&
                    hit.pricePerWeekInCents &&
                    (() => {
                      const dailyRate = hit.pricePerDayInCents;
                      const weeklyRate = hit.pricePerWeekInCents;
                      const weeklyDailyRate = weeklyRate / 7;
                      const savings = ((dailyRate - weeklyDailyRate) / dailyRate) * 100;
                      return savings > 0 ? (
                        <span className="text-green-600 font-medium">
                          {savings.toFixed(0)}% savings
                        </span>
                      ) : null;
                    })()}
                </div>
                <span className="font-semibold">{formatPrice(hit.pricePerWeekInCents)}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-600">28 Days</span>
                  {hit.pricePerDayInCents &&
                    hit.pricePerMonthInCents &&
                    (() => {
                      const dailyRate = hit.pricePerDayInCents;
                      const monthlyRate = hit.pricePerMonthInCents;
                      const monthlyDailyRate = monthlyRate / 28;
                      const savings = ((dailyRate - monthlyDailyRate) / dailyRate) * 100;
                      return savings > 0 ? (
                        <span className="text-green-600 font-medium">
                          {savings.toFixed(0)}% savings
                        </span>
                      ) : null;
                    })()}
                </div>
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

        {/* Add Item Button */}
        <button
          onClick={handleAddItem}
          disabled={buttonState !== "default"}
          className="w-full py-2 px-4 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2 cursor-pointer relative overflow-hidden transition-all duration-500"
          style={{
            background:
              buttonState === "added"
                ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
          }}
        >
          {/* Icon - simple transition */}
          {buttonState === "added" ? (
            <Check className="w-4 h-4" />
          ) : (
            <ShoppingCart className="w-4 h-4" />
          )}

          {/* Text */}
          <span>{buttonState === "added" ? "Item added!" : "Add Item"}</span>
        </button>
      </div>
    </div>
  );
}

// Price Grid
function PriceGrid() {
  const { hits } = useHits<PriceHit>();
  const { items: refinements } = useCurrentRefinements();
  const { refine: clearFilters, canRefine } = useClearRefinements();

  if (hits.length === 0) {
    const hasFilters = refinements.length > 0;

    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
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
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            Clear all filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {hits.map((hit) => (
        <PriceCard key={hit.objectID} hit={hit} />
      ))}
    </div>
  );
}

// Cart Drawer Component
function CartDrawer({ quoteId, workspaceId }: { quoteId: string; workspaceId: string }) {
  const cart = useCart();
  const router = useRouter();
  const { notifySuccess, notifyError } = useNotification();
  const [createRevision, { loading: creatingRevision }] = useCartPage_CreateQuoteRevisionMutation();
  const [updateQuote, { loading: updatingQuote }] = useCartPage_UpdateQuoteMutation();
  const [validationErrors, setValidationErrors] = React.useState<string[]>([]);

  const loading = creatingRevision || updatingQuote;

  // Get quote data to determine next revision number
  const { data: quoteData } = useCartPage_GetQuoteByIdQuery({
    variables: { id: quoteId },
    fetchPolicy: "cache-and-network",
  });

  const handleAddToQuote = async () => {
    // Validate all rental items have dates
    const errors: string[] = [];
    cart.rentalItems.forEach((item) => {
      if (!item.rentalStartDate || !item.rentalEndDate) {
        errors.push(`${item.priceName} is missing rental dates`);
      }
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);

    // Calculate next revision number
    const currentRevisionNumber = quoteData?.quoteById?.currentRevision?.revisionNumber || 0;
    const nextRevisionNumber = currentRevisionNumber + 1;

    const lineItems = [
      ...cart.saleItems.map((item) => ({
        id: crypto.randomUUID(),
        description: item.description,
        sellersPriceId: item.priceId,
        type: QuoteLineItemType.Sale,
        quantity: item.quantity,
        pimCategoryId: item.pimCategoryId,
      })),
      ...cart.rentalItems.map((item) => ({
        id: crypto.randomUUID(),
        description: item.description,
        sellersPriceId: item.priceId,
        type: QuoteLineItemType.Rental,
        quantity: item.quantity,
        pimCategoryId: item.pimCategoryId,
        rentalStartDate: item.rentalStartDate!.toISOString(),
        rentalEndDate: item.rentalEndDate!.toISOString(),
      })),
    ];

    try {
      // Step 1: Create the revision
      const { data: revisionData } = await createRevision({
        variables: {
          input: {
            quoteId,
            revisionNumber: nextRevisionNumber,
            lineItems,
          },
        },
      });

      if (!revisionData?.createQuoteRevision?.id) {
        throw new Error("Failed to create revision");
      }

      const newRevisionId = revisionData.createQuoteRevision.id;

      // Step 2: Update the quote to set the new revision as current
      await updateQuote({
        variables: {
          input: {
            id: quoteId,
            currentRevisionId: newRevisionId,
          },
        },
        // Force refetch the quote details to update the cache
        refetchQueries: ["SalesQuoteDetail_GetQuoteById"],
        // Wait for refetch to complete before redirecting
        awaitRefetchQueries: true,
      });

      notifySuccess("Items added to quote successfully");

      // Navigate back to quote details
      router.push(`/app/${workspaceId}/sales-quotes/${quoteId}`);
    } catch (error) {
      console.error("Error adding items to quote:", error);
      notifyError("Failed to add items to quote");
    }
  };

  const totalItems = cart.getTotalItems();

  return (
    <>
      {/* Backdrop */}
      {cart.isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 transition-opacity"
          onClick={cart.toggleDrawer}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-[700px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          cart.isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-gray-700" />
              <h2 className="text-lg font-semibold text-gray-900">
                Cart ({totalItems} {totalItems === 1 ? "item" : "items"})
              </h2>
            </div>
            <button
              onClick={cart.toggleDrawer}
              className="p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {totalItems === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 text-sm">Your cart is empty</p>
                <p className="text-gray-500 text-xs mt-1">Add items to get started</p>
              </div>
            ) : (
              <>
                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-red-900 mb-1">
                      Please fix these errors:
                    </p>
                    <ul className="text-xs text-red-700 space-y-1">
                      {validationErrors.map((error, i) => (
                        <li key={i}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Sale Items */}
                {cart.saleItems.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">
                        SALE
                      </span>
                      {cart.saleItems.length} {cart.saleItems.length === 1 ? "item" : "items"}
                    </h3>
                    <div className="space-y-3">
                      {cart.saleItems.map((item) => (
                        <CartItemCard key={item.cartItemId} item={item} type="SALE" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Rental Items */}
                {cart.rentalItems.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                        RENTAL
                      </span>
                      {cart.rentalItems.length} {cart.rentalItems.length === 1 ? "item" : "items"}
                    </h3>
                    <div className="space-y-3">
                      {cart.rentalItems.map((item, index) => (
                        <CartItemCard key={item.cartItemId || index} item={item} type="RENTAL" />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {totalItems > 0 && (
            <div className="border-t border-gray-200 p-4">
              <button
                onClick={handleAddToQuote}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-3 rounded-lg font-medium transition-colors cursor-pointer"
              >
                {loading ? "Updating..." : "Update quote items"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Cart Item Card
function CartItemCard({ item, type }: { item: CartItem; type: "RENTAL" | "SALE" }) {
  const cart = useCart();
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [popoverPosition, setPopoverPosition] = React.useState({ top: 0, right: 0 });
  const [tempDates, setTempDates] = React.useState<[Date | null, Date | null]>([null, null]);
  const [originalDates, setOriginalDates] = React.useState<[Date | null, Date | null]>([
    null,
    null,
  ]);

  // Get unique date ranges from other rental items for suggestions
  const dateRangeSuggestions = React.useMemo(() => {
    const uniqueRanges = new Map<string, { start: Date; end: Date }>();

    cart.rentalItems.forEach((rentalItem) => {
      // Skip current item and items without dates
      if (rentalItem.cartItemId === item.cartItemId) return;
      if (!rentalItem.rentalStartDate || !rentalItem.rentalEndDate) return;

      const key = `${rentalItem.rentalStartDate.getTime()}-${rentalItem.rentalEndDate.getTime()}`;
      if (!uniqueRanges.has(key)) {
        uniqueRanges.set(key, {
          start: rentalItem.rentalStartDate,
          end: rentalItem.rentalEndDate,
        });
      }
    });

    return Array.from(uniqueRanges.values());
  }, [cart.rentalItems, item.cartItemId]);

  const formatPrice = (cents: number | undefined): string => {
    if (!cents) return "$0.00";
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const handleDateRangeChange = (newValue: any) => {
    const [start, end] = newValue;
    // Convert to Date objects - handle both Date and potential date-like objects
    const startDate = start ? (start instanceof Date ? start : new Date(start as any)) : null;
    const endDate = end ? (end instanceof Date ? end : new Date(end as any)) : null;
    setTempDates([startDate, endDate]);
  };

  const handleOpenDatePicker = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popoverHeight = 450; // Approximate height of the date picker popover
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Determine if we should show popover above or below the button
      let top: number;
      if (spaceBelow >= popoverHeight + 16) {
        // Enough space below - position below the button
        top = rect.bottom + 8;
      } else if (spaceAbove >= popoverHeight + 16) {
        // Not enough space below, but enough above - position above the button
        top = rect.top - popoverHeight - 8;
      } else {
        // Not enough space in either direction - position at top with some margin
        top = Math.max(16, Math.min(rect.bottom + 8, viewportHeight - popoverHeight - 16));
      }

      setPopoverPosition({
        top,
        right: window.innerWidth - rect.right,
      });
    }
    // Store current dates as original and temporary
    const currentDates: [Date | null, Date | null] = [
      item.rentalStartDate ?? null,
      item.rentalEndDate ?? null,
    ];
    setOriginalDates(currentDates);
    setTempDates(currentDates);
    setShowDatePicker(true);
  };

  const handleClear = () => {
    setTempDates([null, null]);
  };

  const handleAccept = () => {
    const [start, end] = tempDates;
    cart.updateRentalDates(item.cartItemId!, start, end);
    setShowDatePicker(false);
  };

  const handleCancel = () => {
    setShowDatePicker(false);
  };

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex gap-3 mb-2">
        {/* Thumbnail Image */}
        <div className="w-12 h-12 flex-shrink-0 rounded-md overflow-hidden bg-gray-200">
          <GeneratedImage
            entity="price"
            entityId={item.priceId}
            size="list"
            alt={item.priceName}
            showIllustrativeBanner={false}
          />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 truncate">{item.priceName}</h4>
          <p className="text-xs text-gray-600 truncate">{item.pimCategoryName}</p>
          <p className="text-xs font-semibold text-gray-900 mt-1">
            {type === "SALE"
              ? formatPrice(item.unitCostInCents)
              : formatPrice(item.pricePerDayInCents)}
            {type === "RENTAL" && "/day"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={() => cart.removeItem(item.cartItemId!, type)}
            className="text-red-600 hover:bg-red-50 p-1 rounded transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {/* Only show quantity controls for SALE items */}
          {type === "SALE" && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => cart.updateQuantity(item.priceId, type, item.quantity - 1)}
                className="p-1 hover:bg-gray-200 rounded transition-colors cursor-pointer"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
              <button
                onClick={() => cart.updateQuantity(item.priceId, type, item.quantity + 1)}
                className="p-1 hover:bg-gray-200 rounded transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Rental Dates for Rental Items */}
      {type === "RENTAL" && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <button
            ref={buttonRef}
            onClick={handleOpenDatePicker}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium w-full cursor-pointer"
          >
            <Calendar className="w-3 h-3" />
            {item.rentalStartDate && item.rentalEndDate
              ? `${formatDate(item.rentalStartDate)} - ${formatDate(item.rentalEndDate)}`
              : "Set rental dates"}
          </button>

          {showDatePicker && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-[60]" onClick={() => setShowDatePicker(false)} />

              {/* Popover Card - Fixed positioning to escape drawer overflow */}
              <div
                className="fixed z-[70] bg-white rounded-lg shadow-2xl border border-gray-200 p-4"
                style={{
                  top: `${popoverPosition.top}px`,
                  right: `${popoverPosition.right}px`,
                }}
              >
                <div className="flex gap-4">
                  {/* Date Range Calendar */}
                  <div>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DateRangeCalendar value={tempDates} onChange={handleDateRangeChange} />
                    </LocalizationProvider>
                  </div>

                  {/* Suggestions Column */}
                  {dateRangeSuggestions.length > 0 && (
                    <div className="w-64 border-l border-gray-200 pl-4">
                      <h3 className="text-sm font-semibold text-blue-600 mb-3">Suggestions</h3>
                      <div className="space-y-2">
                        {dateRangeSuggestions.map((range, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              // Auto-accept: apply dates immediately and close picker
                              cart.updateRentalDates(item.cartItemId!, range.start, range.end);
                              setShowDatePicker(false);
                            }}
                            className="w-full flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2 rounded transition-colors cursor-pointer"
                          >
                            <Calendar className="w-3 h-3 shrink-0" />
                            <span className="font-medium">
                              {formatDate(range.start)} - {formatDate(range.end)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={handleClear}
                    className="flex-1 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleAccept}
                    className="flex-1 px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors cursor-pointer"
                  >
                    Accept
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Header Component with Cart Button
function HeaderWithCartButton() {
  const cart = useCart();
  const totalItems = cart.getTotalItems();

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
      {/* Top Section - Title, Search, Cart */}
      <div className="w-full px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 whitespace-nowrap">Add Items to Quote</h1>

          {/* Search Bar - flex-1 makes it take remaining space */}
          <div className="flex-1">
            <SearchBar />
          </div>

          {/* Cart Icon Button */}
          <button
            onClick={cart.toggleDrawer}
            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <ShoppingCart
              className={`w-7 h-7 text-gray-700 ${cart.cartAnimation ? "animate-bounce" : ""}`}
            />
            {totalItems > 0 && (
              <span
                className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center transition-transform ${cart.cartAnimation ? "scale-125" : "scale-100"}`}
              >
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Bottom Section - Category Breadcrumbs */}
      <div className="w-full px-6 py-3 bg-gray-50/80 backdrop-blur-sm">
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
    </div>
  );
}

// Main Page Component
export default function CartPage() {
  const params = useParams();
  const quoteId = params?.quote_id as string;
  const workspaceId = params?.workspace_id as string;
  const config = useConfig();
  const { getAccessTokenSilently } = useAuth0();
  const [searchClient, setSearchClient] = React.useState<any>(null);

  // Fetch quote to verify it exists
  const { data: quoteData, loading: quoteLoading } = useCartPage_GetQuoteByIdQuery({
    variables: { id: quoteId },
    fetchPolicy: "cache-and-network",
  });

  React.useEffect(() => {
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
  }, [getAccessTokenSilently, config.searchApiUrl, workspaceId]);

  if (quoteLoading || !searchClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!quoteData?.quoteById) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-600">Quote not found</p>
      </div>
    );
  }

  const routing = {
    router: history({ cleanUrlOnDispose: false }),
    stateMapping: simple(),
  };

  return (
    <CartProvider quoteData={quoteData}>
      <div className="min-h-screen bg-gray-50">
        <InstantSearch searchClient={searchClient} indexName="es_erp_prices" routing={routing}>
          <Configure hitsPerPage={24} />

          {/* Header */}
          <HeaderWithCartButton />

          {/* Main Content with Sidebar */}
          <div className="flex">
            {/* Sidebar Filters - Snapped to left edge */}
            <aside className="w-80 bg-white border-r border-gray-200 p-6 sticky top-[88px] h-[calc(100vh-88px)] overflow-y-auto shrink-0">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Filters</h2>

              {/* Categories */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Categories</h3>
                <div className="max-h-72 overflow-y-auto">
                  <HierarchicalMenu
                    attributes={[
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
                    ]}
                    limit={100}
                    separator="|"
                    sortBy={["name"]}
                  />
                </div>
              </div>

              <FilterSection title="Price Type" attribute="priceType" />
              <FilterSection title="Price Book" attribute="price_book_name" searchable />
              <FilterSection title="Location" attribute="location" />
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6">
              <ActiveFilters />
              <ResultsBar />
              <PriceGrid />
              <CustomPagination />
            </main>
          </div>

          {/* Cart Drawer */}
          <CartDrawer quoteId={quoteId} workspaceId={workspaceId} />
        </InstantSearch>
      </div>
    </CartProvider>
  );
}
