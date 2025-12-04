"use client";

import { GeneratedImage } from "@/ui/GeneratedImage";
import { ShoppingCart } from "lucide-react";
import React from "react";
import { useClearRefinements, useCurrentRefinements, useHits } from "react-instantsearch";
import { PriceHit } from "../context/CartContext";

interface CatalogPriceCardProps {
  hit: PriceHit;
  onClick: (hit: PriceHit) => void;
}

function CatalogPriceCard({ hit, onClick }: CatalogPriceCardProps) {
  const priceName = hit.name || "Unnamed Price";
  const priceType = hit.priceType;

  const formatPrice = (cents: number | null): string => {
    if (cents === null || cents === undefined) return "-";
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col h-full">
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
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[40px]">
          {priceName}
        </h3>

        {/* Category */}
        {hit.pimCategoryName && (
          <p className="text-xs text-gray-500 mb-3 truncate">{hit.pimCategoryName}</p>
        )}

        {/* Pricing - flex-grow to push button to bottom */}
        <div className="border-t border-gray-100 pt-3 mb-3 flex-grow">
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
                          {savings.toFixed(0)}% off
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
                          {savings.toFixed(0)}% off
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

        {/* Add to Request Button */}
        <button
          onClick={() => onClick(hit)}
          className="w-full py-2 px-4 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Add to Request</span>
        </button>
      </div>
    </div>
  );
}

interface CatalogPriceGridProps {
  onPriceClick: (hit: PriceHit) => void;
}

export default function CatalogPriceGrid({ onPriceClick }: CatalogPriceGridProps) {
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
        <CatalogPriceCard key={hit.objectID} hit={hit} onClick={onPriceClick} />
      ))}
    </div>
  );
}
