"use client";

import { graphql } from "@/graphql";
import { useRentalCalendar_GetQuoteByIdQuery } from "@/graphql/hooks";
import { Calendar } from "lucide-react";
import * as React from "react";

// GraphQL Query
graphql(`
  query RentalCalendar_GetQuoteById($id: String!) {
    quoteById(id: $id) {
      id
      currentRevision {
        id
        lineItems {
          ... on QuoteRevisionRentalLineItem {
            id
            type
            description
            quantity
            rentalStartDate
            rentalEndDate
            sellersPriceId
            price {
              ... on RentalPrice {
                id
                name
              }
            }
          }
        }
      }
    }
  }
`);

interface RentalItem {
  id: string;
  displayName: string;
  quantity: number;
  rentalStartDate: string;
  rentalEndDate: string;
}

interface RentalCalendarViewProps {
  quoteId: string;
}

const COLORS = [
  {
    bg: "#3b82f6",
    bgHover: "#2563eb",
    border: "#2563eb",
    text: "text-white",
  },
  {
    bg: "#10b981",
    bgHover: "#059669",
    border: "#059669",
    text: "text-white",
  },
  {
    bg: "#8b5cf6",
    bgHover: "#7c3aed",
    border: "#7c3aed",
    text: "text-white",
  },
  {
    bg: "#f59e0b",
    bgHover: "#d97706",
    border: "#d97706",
    text: "text-white",
  },
  {
    bg: "#ec4899",
    bgHover: "#db2777",
    border: "#db2777",
    text: "text-white",
  },
  {
    bg: "#6366f1",
    bgHover: "#4f46e5",
    border: "#4f46e5",
    text: "text-white",
  },
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function getDayOfMonth(date: Date): number {
  return date.getDate();
}

function isSameMonth(date: Date, year: number, month: number): boolean {
  return date.getFullYear() === year && date.getMonth() === month;
}

export function RentalCalendarView({ quoteId }: RentalCalendarViewProps) {
  const { data, loading, error } = useRentalCalendar_GetQuoteByIdQuery({
    variables: { id: quoteId },
    fetchPolicy: "cache-and-network",
  });

  // Extract rental items from the query result
  const rentalItems = React.useMemo(() => {
    if (!data?.quoteById?.currentRevision?.lineItems) return [];
    return data.quoteById.currentRevision.lineItems
      .filter((item) => {
        if (!item) return false;
        return (
          item.__typename === "QuoteRevisionRentalLineItem" &&
          "rentalStartDate" in item &&
          "rentalEndDate" in item &&
          item.rentalStartDate != null &&
          item.rentalEndDate != null
        );
      })
      .map((item: any) => ({
        id: item.id,
        displayName: item.price?.name || item.description,
        quantity: item.quantity,
        rentalStartDate: item.rentalStartDate,
        rentalEndDate: item.rentalEndDate,
      }));
  }, [data]);

  const [currentMonth, setCurrentMonth] = React.useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  // Update current month when rental items load
  React.useEffect(() => {
    if (rentalItems.length > 0) {
      const dates = rentalItems.map((item) => new Date(item.rentalStartDate));
      const earliest = new Date(Math.min(...dates.map((d) => d.getTime())));
      setCurrentMonth({ year: earliest.getFullYear(), month: earliest.getMonth() });
    }
  }, [rentalItems]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-600" />
          Quote Timeline
        </h3>
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">Loading quote timeline...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  if (rentalItems.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-600" />
          Quote Timeline
        </h3>
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">No rental items in this quote</p>
        </div>
      </div>
    );
  }

  const daysInMonth = getDaysInMonth(currentMonth.year, currentMonth.month);
  const firstDayOfMonth = getFirstDayOfMonth(currentMonth.year, currentMonth.month);
  const monthName = new Date(currentMonth.year, currentMonth.month).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  // Calculate rental bars for this month
  const rentalBars = rentalItems
    .map((item, index) => {
      const startDate = new Date(item.rentalStartDate);
      const endDate = new Date(item.rentalEndDate);
      const colorIndex = index % COLORS.length;

      // Calculate position in the month
      const monthStart = new Date(currentMonth.year, currentMonth.month, 1);
      const monthEnd = new Date(currentMonth.year, currentMonth.month + 1, 0);

      // Check if rental overlaps with current month
      if (endDate < monthStart || startDate > monthEnd) {
        return null;
      }

      // Calculate start and end positions within the month
      const displayStart = startDate < monthStart ? monthStart : startDate;
      const displayEnd = endDate > monthEnd ? monthEnd : endDate;

      const startDay = getDayOfMonth(displayStart);
      const endDay = getDayOfMonth(displayEnd);
      const startCol = (firstDayOfMonth + startDay - 1) % 7;
      const endCol = (firstDayOfMonth + endDay - 1) % 7;
      const startWeek = Math.floor((firstDayOfMonth + startDay - 1) / 7);
      const endWeek = Math.floor((firstDayOfMonth + endDay - 1) / 7);

      return {
        item,
        colorIndex,
        startDay,
        endDay,
        startCol,
        endCol,
        startWeek,
        endWeek,
        spansSingleWeek: startWeek === endWeek,
      };
    })
    .filter(Boolean);

  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => {
      const newMonth = prev.month - 1;
      if (newMonth < 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { year: prev.year, month: newMonth };
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => {
      const newMonth = prev.month + 1;
      if (newMonth > 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { year: prev.year, month: newMonth };
    });
  };

  // Generate week rows
  const weeks: number[][] = [];
  let currentWeek: number[] = [];

  // Add empty cells for days before month starts
  for (let i = 0; i < firstDayOfMonth; i++) {
    currentWeek.push(0); // 0 represents empty
  }

  // Add days of month
  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Add remaining days to complete last week
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(0);
    }
    weeks.push(currentWeek);
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          Timeline
        </h3>
      </div>

      <div className="p-8">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={goToPreviousMonth}
            className="p-3 hover:bg-gray-100 rounded-xl transition-all duration-200 cursor-pointer hover:shadow-md active:scale-95"
            aria-label="Previous month"
          >
            <svg
              className="w-5 h-5 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h4 className="text-lg font-bold text-gray-900 tracking-tight">{monthName}</h4>
          <button
            onClick={goToNextMonth}
            className="p-3 hover:bg-gray-100 rounded-xl transition-all duration-200 cursor-pointer hover:shadow-md active:scale-95"
            aria-label="Next month"
          >
            <svg
              className="w-5 h-5 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {/* Day headers */}
          <div className="grid grid-cols-7 bg-gradient-to-b from-gray-50 to-gray-100 border-b-2 border-gray-200">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-xs font-bold text-gray-600 text-center py-4 uppercase tracking-wider border-r border-gray-200 last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar weeks */}
          <div className="relative">
            {weeks.map((week, weekIndex) => {
              // Calculate how many bars are in this week
              const barsInWeek = rentalBars.filter(
                (bar) =>
                  bar &&
                  (bar.startWeek === weekIndex ||
                    bar.endWeek === weekIndex ||
                    (bar.startWeek < weekIndex && bar.endWeek > weekIndex)),
              ).length;

              // Calculate minimum height to accommodate all bars
              // Base height: 40px for day number + top spacing
              // Each bar needs: 32px vertical spacing (24px bar height + 8px gap)
              // Bottom padding: 12px
              const minHeight = Math.max(80, 40 + barsInWeek * 32 + 12);

              return (
                <div
                  key={weekIndex}
                  className="grid grid-cols-7 relative"
                  style={{ minHeight: `${minHeight}px` }}
                >
                  {/* Day cells */}
                  {week.map((day, dayIndex) => {
                    const globalDayIndex = weekIndex * 7 + dayIndex;
                    const isEmpty = day === 0;
                    const isToday =
                      day > 0 &&
                      new Date().getDate() === day &&
                      new Date().getMonth() === currentMonth.month &&
                      new Date().getFullYear() === currentMonth.year;

                    return (
                      <div
                        key={globalDayIndex}
                        className={`border-b border-r border-gray-100 last:border-r-0 p-2 relative transition-colors ${
                          isEmpty ? "bg-gray-50" : "bg-white hover:bg-gray-50"
                        }`}
                      >
                        {day > 0 && (
                          <div
                            className={`text-sm font-semibold mb-1 ${
                              isToday
                                ? "inline-flex items-center justify-center w-7 h-7 bg-blue-600 text-white rounded-full"
                                : "text-gray-800"
                            }`}
                          >
                            {day}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Rental bars for this week */}
                  {rentalBars
                    .filter(
                      (bar) =>
                        bar &&
                        (bar.startWeek === weekIndex ||
                          bar.endWeek === weekIndex ||
                          (bar.startWeek < weekIndex && bar.endWeek > weekIndex)),
                    )
                    .map((bar, barIndex) => {
                      if (!bar) return null;

                      const color = COLORS[bar.colorIndex];
                      const isStartWeek = bar.startWeek === weekIndex;
                      const isEndWeek = bar.endWeek === weekIndex;
                      const isMiddleWeek = bar.startWeek < weekIndex && bar.endWeek > weekIndex;

                      const startCol = isStartWeek ? bar.startCol : 0;
                      const endCol = isEndWeek ? bar.endCol : 6;
                      const colSpan = endCol - startCol + 1;

                      // Calculate positioning
                      const leftPercent = (startCol / 7) * 100;
                      const widthPercent = (colSpan / 7) * 100;

                      return (
                        <div
                          key={`${bar.item.id}-${weekIndex}`}
                          className={`absolute rounded-lg px-3 py-1.5 text-xs ${color.text} font-semibold shadow-md cursor-pointer z-10 overflow-hidden transition-colors duration-200 border`}
                          style={{
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                            top: `${40 + barIndex * 32}px`,
                            backgroundColor: color.bg,
                            borderColor: color.border,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = color.bgHover;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = color.bg;
                          }}
                          title={`${bar.item.displayName} (${bar.item.quantity})`}
                        >
                          <div className="truncate">
                            {bar.item.displayName}
                            {bar.item.quantity > 1 && (
                              <span className="ml-1 opacity-90">(×{bar.item.quantity})</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-8 pt-6 border-t-2 border-gray-100">
          <h5 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-1 h-5 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full" />
            Rental Items
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {rentalItems.map((item, index) => {
              const colorIndex = index % COLORS.length;
              const color = COLORS[colorIndex];
              const startDate = new Date(item.rentalStartDate);
              const endDate = new Date(item.rentalEndDate);
              const formattedStart = startDate.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              });
              const formattedEnd = endDate.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 mt-1 shadow-sm border-2 border-white"
                    style={{ backgroundColor: color.bg }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                      {item.displayName}
                      {item.quantity > 1 && (
                        <span className="ml-1.5 text-gray-600 font-normal">(×{item.quantity})</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 font-medium">
                      {formattedStart} → {formattedEnd}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
