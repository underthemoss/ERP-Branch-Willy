"use client";

import { graphql } from "@/graphql";
import { useRentalPricingBreakdown_BulkCalculateSubTotalQuery } from "@/graphql/hooks";
import { AlertCircle, Calendar, Loader2, TrendingDown } from "lucide-react";
import * as React from "react";

// Flexible type for price forecast data that can come from different sources
interface PriceForecastData {
  accumulative_cost_in_cents: number;
  days: Array<{
    day: number;
    cost_in_cents: number;
    accumulative_cost_in_cents: number;
    rental_period: {
      days1: number;
      days7: number;
      days28: number;
    };
    savings_compared_to_day_rate_in_cents?: number;
    savings_compared_to_day_rate_in_fraction?: number;
    details: {
      plainText?: string;
      rates?: {
        pricePer1DayInCents: number;
        pricePer7DaysInCents: number;
        pricePer28DaysInCents: number;
      };
    };
  }>;
}

// GraphQL Query
graphql(`
  query RentalPricingBreakdown_BulkCalculateSubTotal($inputs: [BulkCalculateSubTotalInput!]!) {
    bulkCalculateSubTotal(inputs: $inputs) {
      accumulative_cost_in_cents
      days {
        accumulative_cost_in_cents
        cost_in_cents
        day
        details {
          rates {
            pricePer1DayInCents
            pricePer7DaysInCents
            pricePer28DaysInCents
          }
        }
        rental_period {
          days1
          days7
          days28
        }
        savings_compared_to_day_rate_in_cents
        savings_compared_to_day_rate_in_fraction
      }
    }
  }
`);

interface RentalPricingBreakdownProps {
  priceId?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  compact?: boolean;
  showSavings?: boolean;
  onTotalCalculated?: (totalInCents: number) => void;
  isExpanded?: boolean;
  /** Pre-fetched price forecast data - if provided, skips the GraphQL fetch */
  priceForecast?: PriceForecastData | null;
  /** Pre-calculated subtotal in cents - used with priceForecast */
  subtotalInCents?: number;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function calculateDurationInDays(start: Date, end: Date): number {
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function RentalPricingBreakdown({
  priceId,
  startDate,
  endDate,
  compact = false,
  showSavings = true,
  onTotalCalculated,
  isExpanded = true,
  priceForecast,
  subtotalInCents,
}: RentalPricingBreakdownProps) {
  // Check if we have pre-fetched data
  const hasPrefetchedData = !!priceForecast && priceForecast.days.length > 0;

  // Calculate duration (returns 0 if dates are missing)
  const durationInDays = startDate && endDate ? calculateDurationInDays(startDate, endDate) : 0;

  // Fetch pricing data (skip if no valid dates OR if we have pre-fetched data)
  const { data, loading, error } = useRentalPricingBreakdown_BulkCalculateSubTotalQuery({
    variables: {
      inputs: [
        {
          priceId: priceId || "",
          durationInDays,
        },
      ],
    },
    skip: hasPrefetchedData || !priceId || !startDate || !endDate || durationInDays === 0,
    fetchPolicy: "cache-and-network",
  });

  // Use pre-fetched data or fetched data
  const forecast = hasPrefetchedData ? priceForecast : data?.bulkCalculateSubTotal?.[0];
  const totalCost = subtotalInCents ?? forecast?.accumulative_cost_in_cents ?? 0;

  // Notify parent of total (must be before any conditional returns)
  React.useEffect(() => {
    if (onTotalCalculated && totalCost > 0) {
      onTotalCalculated(totalCost);
    }
  }, [totalCost, onTotalCalculated]);

  // Early return if dates are missing AND no pre-fetched data
  if (!hasPrefetchedData && (!startDate || !endDate)) {
    return null;
  }

  // Loading state (only show if we're actually fetching)
  if (loading && !hasPrefetchedData) {
    if (compact) {
      return (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Calculating pricing...</span>
        </div>
      );
    }

    return (
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span className="text-sm text-gray-600">Calculating pricing...</span>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
        </div>
      </div>
    );
  }

  // Error state (only show if we're fetching and got an error)
  if (error && !hasPrefetchedData) {
    if (compact) {
      return (
        <div className="flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="w-3 h-3" />
          <span>Unable to calculate</span>
        </div>
      );
    }

    return (
      <div className="bg-red-50 rounded-lg p-4 border border-red-200">
        <div className="flex items-center gap-2 text-red-800">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Unable to calculate pricing</span>
        </div>
        <p className="text-xs text-red-600 mt-1">Please try again later</p>
      </div>
    );
  }

  // No data state check
  if (!forecast?.days || forecast.days.length === 0) {
    return null;
  }

  // Get the last day for final pricing breakdown
  const lastDay = forecast.days[forecast.days.length - 1];
  const breakdown = lastDay.rental_period;
  const rates = lastDay.details.rates;
  const savings = lastDay.savings_compared_to_day_rate_in_cents ?? 0;
  const savingsPercent = (lastDay.savings_compared_to_day_rate_in_fraction ?? 0) * 100;

  // Calculate what it would cost with daily rate only
  const totalDays = forecast.days.length;
  const dailyOnlyCost = rates ? rates.pricePer1DayInCents * totalDays : 0;

  const hasSavings = savings > 0 && savingsPercent > 0;

  // Compact view
  if (compact) {
    return (
      <div className="text-xs">
        {/* Expandable breakdown - only show if rates are available */}
        {isExpanded && rates && (
          <div className="space-y-1 mb-1">
            {breakdown.days28 > 0 && (
              <div className="flex justify-between text-gray-700">
                <span>
                  {breakdown.days28} × 28-day @ {formatPrice(rates.pricePer28DaysInCents)}
                </span>
                <span className="font-medium">
                  {formatPrice(breakdown.days28 * rates.pricePer28DaysInCents)}
                </span>
              </div>
            )}
            {breakdown.days7 > 0 && (
              <div className="flex justify-between text-gray-700">
                <span>
                  {breakdown.days7} × 7-day @ {formatPrice(rates.pricePer7DaysInCents)}
                </span>
                <span className="font-medium">
                  {formatPrice(breakdown.days7 * rates.pricePer7DaysInCents)}
                </span>
              </div>
            )}
            {breakdown.days1 > 0 && (
              <div className="flex justify-between text-gray-700">
                <span>
                  {breakdown.days1} × 1-day @ {formatPrice(rates.pricePer1DayInCents)}
                </span>
                <span className="font-medium">
                  {formatPrice(breakdown.days1 * rates.pricePer1DayInCents)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full view
  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-blue-600" />
        <h4 className="text-sm font-semibold text-gray-900">Pricing Breakdown</h4>
        <span className="text-xs text-gray-500">({totalDays} days)</span>
      </div>

      {rates && (
        <div className="space-y-2 mb-3">
          {breakdown.days28 > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-700">
                {breakdown.days28} × 28-day period @ {formatPrice(rates.pricePer28DaysInCents)}
              </span>
              <span className="font-semibold text-gray-900">
                {formatPrice(breakdown.days28 * rates.pricePer28DaysInCents)}
              </span>
            </div>
          )}
          {breakdown.days7 > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-700">
                {breakdown.days7} × 7-day period @ {formatPrice(rates.pricePer7DaysInCents)}
              </span>
              <span className="font-semibold text-gray-900">
                {formatPrice(breakdown.days7 * rates.pricePer7DaysInCents)}
              </span>
            </div>
          )}
          {breakdown.days1 > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-700">
                {breakdown.days1} × daily @ {formatPrice(rates.pricePer1DayInCents)}
              </span>
              <span className="font-semibold text-gray-900">
                {formatPrice(breakdown.days1 * rates.pricePer1DayInCents)}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="pt-3 border-t border-gray-300">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-gray-900">Subtotal:</span>
          <span className="text-lg font-bold text-gray-900">{formatPrice(totalCost)}</span>
        </div>

        {showSavings && hasSavings && dailyOnlyCost > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-md p-2 mt-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4 text-green-600" />
                <span className="text-green-800 font-medium">Your Savings</span>
              </div>
              <span className="text-green-700 font-semibold">
                {formatPrice(savings)} ({savingsPercent.toFixed(0)}%)
              </span>
            </div>
            <p className="text-xs text-green-700 mt-1">
              vs. daily rate only: {formatPrice(dailyOnlyCost)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
