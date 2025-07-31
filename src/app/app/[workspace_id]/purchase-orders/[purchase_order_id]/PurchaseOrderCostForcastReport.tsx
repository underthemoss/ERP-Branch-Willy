"use client";

import { graphql } from "@/graphql";
import { usePurchaseOrderLineItemsChartReportQuery } from "@/graphql/hooks";
import { Box, Button, Checkbox, FormControlLabel, Paper, Typography } from "@mui/material";
import {
  ChartsTooltipContainer,
  useAxesTooltip,
  useItemTooltip,
} from "@mui/x-charts/ChartsTooltip";
import { HighlightItemData, HighlightScope } from "@mui/x-charts/context";
import { LineChart } from "@mui/x-charts/LineChart";
import * as React from "react";

// Color palette for chart series - Material Design colors
const CHART_COLORS = [
  "#f44336", // Red 500
  "#2196f3", // Blue 500
  "#4caf50", // Green 500
  "#ff9800", // Orange 500
  "#9c27b0", // Purple 500
  "#00bcd4", // Cyan 500
  "#673ab7", // Deep Purple 500
  "#009688", // Teal 500
  "#e91e63", // Pink 500
  "#3f51b5", // Indigo 500
  "#8bc34a", // Light Green 500
  "#ffeb3b", // Yellow 500
  "#ff5722", // Deep Orange 500
  "#03a9f4", // Light Blue 500
  "#cddc39", // Lime 500
  "#ffc107", // Amber 500
];

// GQL document for the chart report
const PURCHASE_ORDER_LINE_ITEMS_CHART_REPORT = graphql(`
  query PurchaseOrderLineItemsChartReport($purchaseOrderId: String!) {
    getPurchaseOrderById(id: $purchaseOrderId) {
      line_items {
        ... on RentalPurchaseOrderLineItem {
          id
          so_pim_product {
            name
          }
          so_pim_category {
            name
          }
          delivery_date
          off_rent_date
          delivery_charge_in_cents
          calulate_price {
            forecast {
              days {
                day
                cost_in_cents
                accumulative_cost_in_cents
              }
            }
          }
        }
        ... on SalePurchaseOrderLineItem {
          id
          so_pim_product {
            name
          }
          so_pim_category {
            name
          }
          delivery_date
          delivery_charge_in_cents
          price {
            __typename
            ... on SalePrice {
              unitCostInCents
            }
          }
          po_quantity
        }
      }
    }
  }
`);

type Props = {
  purchaseOrderId: string;
};

// Custom tooltip content component
function CustomTooltipContent({ highlightedItem }: { highlightedItem: HighlightItemData | null }) {
  const tooltipData = useAxesTooltip();
  const [highlightedSeriesId, setHighlightedSeriesId] = React.useState<string | number | null>(
    null,
  );

  if (!tooltipData || tooltipData.length === 0) {
    return null;
  }

  const axisData = tooltipData[0];
  if (!axisData) {
    return null;
  }

  // Filter series items based on chart highlighting
  const displayItems = highlightedItem
    ? axisData.seriesItems.filter((item) => item.seriesId === highlightedItem.seriesId)
    : axisData.seriesItems;

  // Calculate sum of displayed values only
  const sum = displayItems.reduce((total, item) => {
    const value = typeof item.value === "number" ? item.value : 0;
    return total + value;
  }, 0);

  const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <Paper
      elevation={0}
      sx={{
        m: 1,
        border: "solid",
        borderWidth: 2,
        borderColor: "divider",
        table: { borderSpacing: 0 },
        thead: {
          td: {
            px: 1.5,
            py: 0.75,
            borderBottom: "solid",
            borderWidth: 2,
            borderColor: "divider",
          },
        },
        tbody: {
          "tr:first-of-type": { td: { paddingTop: 1.5 } },
          "tr:last-of-type": { td: { paddingBottom: 1.5 } },
          tr: {
            "td:first-of-type": { paddingLeft: 1.5 },
            "td:last-of-type": { paddingRight: 1.5 },
            td: {
              paddingRight: "7px",
              paddingBottom: "10px",
            },
          },
        },
      }}
      onMouseLeave={() => setHighlightedSeriesId(null)}
    >
      <table>
        <thead>
          <tr>
            <td colSpan={3}>
              <Typography>{axisData.axisFormattedValue}</Typography>
            </td>
          </tr>
        </thead>
        <tbody>
          {displayItems.map((seriesItem) => {
            const isHighlighted = highlightedSeriesId === seriesItem.seriesId;
            return (
              <tr
                key={seriesItem.seriesId}
                onMouseEnter={() => setHighlightedSeriesId(seriesItem.seriesId)}
                style={{ cursor: "pointer" }}
              >
                <td aria-label={`${seriesItem.formattedLabel}-series-color`}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      backgroundColor: seriesItem.color,
                      opacity: highlightedSeriesId && !isHighlighted ? 0.3 : 1,
                    }}
                  />
                </td>
                <td>
                  <Typography
                    fontWeight={isHighlighted ? "bold" : "light"}
                    sx={{ opacity: highlightedSeriesId && !isHighlighted ? 0.3 : 1 }}
                  >
                    {seriesItem.formattedLabel}
                  </Typography>
                </td>
                <td>
                  <Typography
                    fontWeight={isHighlighted ? "bold" : "normal"}
                    sx={{ opacity: highlightedSeriesId && !isHighlighted ? 0.3 : 1 }}
                  >
                    {seriesItem.formattedValue}
                  </Typography>
                </td>
              </tr>
            );
          })}
          {displayItems.length > 1 && (
            <tr>
              <td colSpan={2}>
                <Typography fontWeight="bold">Total</Typography>
              </td>
              <td>
                <Typography fontWeight="bold">{currencyFormatter.format(sum)}</Typography>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Paper>
  );
}

// Custom tooltip wrapper that follows mouse
function CustomAxisTooltip({ highlightedItem }: { highlightedItem: HighlightItemData | null }) {
  return (
    <ChartsTooltipContainer trigger="axis">
      <CustomTooltipContent highlightedItem={highlightedItem} />
    </ChartsTooltipContainer>
  );
}

export default function PurchaseOrderCostForcastReport({ purchaseOrderId }: Props) {
  const { data, loading, error } = usePurchaseOrderLineItemsChartReportQuery({
    variables: { purchaseOrderId },
    fetchPolicy: "cache-and-network",
  });

  // Build chart data
  const [dataset, setDataset] = React.useState<any[]>([]);
  const [series, setSeries] = React.useState<any[]>([]);
  const [allSeries, setAllSeries] = React.useState<any[]>([]);
  const [visibleSeriesIds, setVisibleSeriesIds] = React.useState<Set<string>>(new Set());
  const [highlightedItem, setHighlightedItem] = React.useState<HighlightItemData | null>(null);
  const [hoveredSeriesId, setHoveredSeriesId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!data?.getPurchaseOrderById?.line_items) return;

    const lineItems = data.getPurchaseOrderById.line_items;
    const rentalItems = lineItems.filter((li: any) => li.calulate_price?.forecast?.days);
    const saleItems = lineItems.filter(
      (li: any) => li.price?.__typename === "SalePrice" && li.price.unitCostInCents != null,
    );

    // Collect all unique days from all rental forecasts
    const allDaysSet = new Set<number>();
    rentalItems.forEach((li: any) => {
      li.calulate_price.forecast.days.forEach((d: any) => allDaysSet.add(d.day));
    });
    // For sales, just use day 1
    if (saleItems.length > 0) allDaysSet.add(1);

    const allDays = Array.from(allDaysSet).sort((a, b) => a - b);

    // Find the earliest delivery date from rental items
    let earliestDeliveryDate: Date | null = null;
    rentalItems.forEach((li: any) => {
      if (li.delivery_date) {
        const deliveryDate = new Date(li.delivery_date);
        if (!earliestDeliveryDate || deliveryDate < earliestDeliveryDate) {
          earliestDeliveryDate = deliveryDate;
        }
      }
    });

    // Use today's date or the earliest delivery date, whichever is earlier
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day

    let baseDeliveryDate: Date;
    if (!earliestDeliveryDate) {
      baseDeliveryDate = today;
    } else {
      // Compare dates and use the earlier one
      const deliveryDateCopy = new Date(earliestDeliveryDate);
      deliveryDateCopy.setHours(0, 0, 0, 0); // Reset time to start of day
      baseDeliveryDate = deliveryDateCopy < today ? deliveryDateCopy : today;
    }

    // Build a map of date (day) to chart row
    const dayToRow: Record<number, any> = {};
    allDays.forEach((day) => {
      // Use the base delivery date and add day offset
      const date = new Date(baseDeliveryDate!);
      date.setDate(date.getDate() + day - 1);
      dayToRow[day] = { date };
    });

    // Add rental item series
    rentalItems.forEach((li: any) => {
      const label = li.so_pim_product?.name || li.id;
      const deliveryCharge = (li.delivery_charge_in_cents || 0) / 100;

      // Calculate the offset between the item's delivery date and the base date
      let dayOffset = 0;
      if (li.delivery_date) {
        const itemDeliveryDate = new Date(li.delivery_date);
        itemDeliveryDate.setHours(0, 0, 0, 0);
        dayOffset = Math.floor(
          (itemDeliveryDate.getTime() - baseDeliveryDate.getTime()) / (1000 * 60 * 60 * 24),
        );
      }

      // Only add costs starting from the item's delivery date
      li.calulate_price.forecast.days.forEach((d: any) => {
        const adjustedDay = d.day + dayOffset;
        if (dayToRow[adjustedDay]) {
          // Add delivery charge to the accumulative cost
          dayToRow[adjustedDay][label] = d.accumulative_cost_in_cents / 100 + deliveryCharge;
        }
      });

      // Fill in zero values for days before the item's delivery date
      allDays.forEach((day) => {
        if (day < 1 + dayOffset && dayToRow[day]) {
          dayToRow[day][label] = 0;
        }
      });
    });

    // Add sale item series (flat cost starting from their delivery date)
    saleItems.forEach((li: any) => {
      if (li?.__typename === "SalePurchaseOrderLineItem") {
        const label = li.so_pim_product?.name || li.id;
        const quantity = li.po_quantity || 1;

        // Use price from price node
        let unitCost = 0;
        if (li.price?.__typename === "SalePrice" && li.price.unitCostInCents) {
          unitCost = li.price.unitCostInCents;
        }

        // Add delivery charge to the unit cost
        const deliveryCharge = (li.delivery_charge_in_cents || 0) / 100;
        const cost = (unitCost * quantity) / 100 + deliveryCharge;

        // Calculate the offset between the item's delivery date and the base date
        let dayOffset = 0;
        if (li.delivery_date) {
          const itemDeliveryDate = new Date(li.delivery_date);
          itemDeliveryDate.setHours(0, 0, 0, 0);
          dayOffset = Math.floor(
            (itemDeliveryDate.getTime() - baseDeliveryDate.getTime()) / (1000 * 60 * 60 * 24),
          );
        }

        // Add the cost starting from the delivery date
        allDays.forEach((day) => {
          if (day >= 1 + dayOffset && dayToRow[day]) {
            dayToRow[day][label] = cost;
          } else if (dayToRow[day]) {
            dayToRow[day][label] = 0;
          }
        });
      }
    });

    // Build dataset array
    const datasetArr = allDays.map((day) => dayToRow[day]);

    // Sort rental items by off-rent date (earliest first)
    const sortedRentalItems = [...rentalItems].sort((a: any, b: any) => {
      const dateA = a.off_rent_date ? new Date(a.off_rent_date).getTime() : Infinity;
      const dateB = b.off_rent_date ? new Date(b.off_rent_date).getTime() : Infinity;
      return dateA - dateB;
    });

    // Build series array: sales first, then rentals ordered by off-rent date
    const currencyFormatter = (value: number | null) => {
      if (value === null) return "";
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    };

    const highlightScope: HighlightScope = {
      highlight: "series",
      fade: "global",
    };

    let colorIndex = 0;
    const salesSeries = saleItems.map((li: any, idx: number) => {
      if (li?.__typename === "SalePurchaseOrderLineItem") {
        const series = {
          id: li.id,
          label: li.so_pim_product?.name || li.so_pim_category?.name || `Sale Item ${idx + 1}`,
          dataKey: li.so_pim_product?.name || li.id,
          area: true,
          showMark: false,
          stack: "total",
          color: CHART_COLORS[colorIndex % CHART_COLORS.length],
          valueFormatter: currencyFormatter,
          highlightScope,
        };
        colorIndex++;
        return series;
      }
      return null;
    });
    const rentalSeries = sortedRentalItems.map((li: any, idx: number) => {
      if (li?.__typename === "RentalPurchaseOrderLineItem") {
        const series = {
          id: li.id,
          label: li.so_pim_product?.name || li.so_pim_category?.name || `Rental Item ${idx + 1}`,
          dataKey: li.so_pim_product?.name || li.id,
          area: true,
          showMark: false,
          stack: "total",
          color: CHART_COLORS[colorIndex % CHART_COLORS.length],
          valueFormatter: currencyFormatter,
          highlightScope,
        };
        colorIndex++;
        return series;
      }
      return null;
    });

    const allSeriesArray = [...salesSeries, ...rentalSeries].filter(Boolean) as any[];

    setDataset(datasetArr);
    setAllSeries(allSeriesArray);

    // Initialize all series as visible
    if (visibleSeriesIds.size === 0) {
      setVisibleSeriesIds(new Set(allSeriesArray.map((s) => s.id)));
    }
  }, [data]);

  // Update visible series when checkboxes change
  React.useEffect(() => {
    const visibleSeries = allSeries.filter((s) => visibleSeriesIds.has(s.id));
    setSeries(visibleSeries);
  }, [allSeries, visibleSeriesIds]);

  const handleSeriesToggle = (seriesId: string) => {
    setVisibleSeriesIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(seriesId)) {
        newSet.delete(seriesId);
      } else {
        newSet.add(seriesId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setVisibleSeriesIds(new Set(allSeries.map((s) => s.id)));
  };

  const handleDeselectAll = () => {
    setVisibleSeriesIds(new Set());
  };

  // Handle hover to highlight series in chart
  React.useEffect(() => {
    if (hoveredSeriesId) {
      const seriesIndex = allSeries.findIndex((s) => s.id === hoveredSeriesId);
      if (seriesIndex !== -1) {
        setHighlightedItem({
          seriesId: hoveredSeriesId,
          dataIndex: undefined,
        } as HighlightItemData);
      }
    } else {
      setHighlightedItem(null);
    }
  }, [hoveredSeriesId, allSeries]);

  // Create a custom tooltip component that has access to highlightedItem
  const TooltipWithHighlight = React.useCallback(() => {
    return <CustomAxisTooltip highlightedItem={highlightedItem} />;
  }, [highlightedItem]);

  if (loading) return <div>Loading cost forecast...</div>;
  if (error) return <div>Error loading forecast: {error.message}</div>;
  if (!dataset.length || !allSeries.length) return <div>No forecast data available.</div>;

  return (
    <div>
      {series.length > 0 ? (
        <LineChart
          dataset={dataset}
          xAxis={[
            {
              id: "Date",
              dataKey: "date",
              scaleType: "time",
              min: dataset[0]?.date,
              max: dataset[dataset.length - 1]?.date,
              valueFormatter: (date) =>
                date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            },
          ]}
          yAxis={[
            {
              width: 80,
              valueFormatter: (value: number) => {
                return new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(value);
              },
            },
          ]}
          series={series}
          height={400}
          highlightedItem={highlightedItem}
          onHighlightChange={setHighlightedItem}
          slots={{
            tooltip: TooltipWithHighlight,
            legend: () => null,
          }}
          slotProps={{
            tooltip: {
              trigger: "axis",
            },
          }}
        />
      ) : (
        <Box
          sx={{
            height: 400,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            backgroundColor: "background.paper",
          }}
        >
          <Typography color="text.secondary">
            Select one or more items below to view the cost forecast
          </Typography>
        </Box>
      )}

      {/* Checkbox Legend */}
      <Box sx={{ mt: 1 }}>
        {/* Select/Deselect All buttons */}
        <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
          <Button
            size="small"
            onClick={handleSelectAll}
            sx={{
              textTransform: "none",
              color: "primary.main",
              padding: "2px 8px",
              minWidth: "auto",
              "&:hover": {
                backgroundColor: "action.hover",
              },
            }}
          >
            Select All
          </Button>
          <Typography sx={{ color: "text.secondary", alignSelf: "center" }}>|</Typography>
          <Button
            size="small"
            onClick={handleDeselectAll}
            sx={{
              textTransform: "none",
              color: "primary.main",
              padding: "2px 8px",
              minWidth: "auto",
              "&:hover": {
                backgroundColor: "action.hover",
              },
            }}
          >
            Deselect All
          </Button>
        </Box>

        {/* Checkboxes */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {allSeries.map((s) => (
            <FormControlLabel
              key={s.id}
              onMouseEnter={() => setHoveredSeriesId(s.id)}
              onMouseLeave={() => setHoveredSeriesId(null)}
              control={
                <Checkbox
                  size="small"
                  checked={visibleSeriesIds.has(s.id)}
                  onChange={() => handleSeriesToggle(s.id)}
                  sx={{ py: 0 }}
                />
              }
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      backgroundColor: s.color,
                      borderRadius: "2px",
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: "0.875rem",
                      opacity: highlightedItem && highlightedItem.seriesId !== s.id ? 0.5 : 1,
                    }}
                  >
                    {s.label}
                  </Typography>
                </Box>
              }
              sx={{ m: 0, mr: 2, cursor: "pointer" }}
            />
          ))}
        </Box>
      </Box>
    </div>
  );
}
