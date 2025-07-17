// "use client";

import { graphql } from "@/graphql";
import { useSalesOrderLineItemsChartReportQuery } from "@/graphql/hooks";
import { LineChart } from "@mui/x-charts/LineChart";
import * as React from "react";

// GQL document for the chart report
const SALES_ORDER_LINE_ITEMS_CHART_REPORT = graphql(`
  query SalesOrderLineItemsChartReport($salesOrderId: String!) {
    getSalesOrderById(id: $salesOrderId) {
      line_items {
        ... on RentalSalesOrderLineItem {
          id
          so_pim_product {
            name
          }
          so_pim_category{
            name
          }
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
        ... on SaleSalesOrderLineItem {
          id
          so_pim_product {
            name
          }
          so_pim_category{
            name
          }
          unit_cost_in_cents
        }
      }
    }
  }
`);

type Props = {
  salesOrderId: string;
};

export default function SalesOrderCostForcastReport({ salesOrderId }: Props) {
  const { data, loading, error } = useSalesOrderLineItemsChartReportQuery({
    variables: { salesOrderId },
    fetchPolicy: "cache-and-network",
  });

  // Build chart data
  const [dataset, setDataset] = React.useState<any[]>([]);
  const [series, setSeries] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (!data?.getSalesOrderById?.line_items) return;

    const lineItems = data.getSalesOrderById.line_items;
    const rentalItems = lineItems.filter((li: any) => li.calulate_price?.forecast?.days);
    const saleItems = lineItems.filter((li: any) => li.unit_cost_in_cents != null);

    // Collect all unique days from all rental forecasts
    const allDaysSet = new Set<number>();
    rentalItems.forEach((li: any) => {
      li.calulate_price.forecast.days.forEach((d: any) => allDaysSet.add(d.day));
    });
    // For sales, just use day 1
    if (saleItems.length > 0) allDaysSet.add(1);

    const allDays = Array.from(allDaysSet).sort((a, b) => a - b);

    // Build a map of date (day) to chart row
    const dayToRow: Record<number, any> = {};
    allDays.forEach((day) => {
      // Use today as base date, add day offset for each
      const base = new Date();
      const date = new Date(base.getFullYear(), base.getMonth(), base.getDate() + day - 1);
      dayToRow[day] = { date };
    });

    // Add rental item series
    rentalItems.forEach((li: any) => {
      const label = li.so_pim_product?.name || li.id;
      li.calulate_price.forecast.days.forEach((d: any) => {
        dayToRow[d.day][label] = d.accumulative_cost_in_cents / 100;
      });
    });

    // Add sale item series (flat cost at all days)
    saleItems.forEach((li) => {
      if (li?.__typename === "SaleSalesOrderLineItem") {
        const label = li.so_pim_product?.name || li.id;
        const cost = li.unit_cost_in_cents
          ? (li.unit_cost_in_cents * ((li as any).so_quantity || 1)) / 100
          : 0;
        allDays.forEach((day) => {
          dayToRow[day][label] = cost;
        });
      }
    });

    // Build dataset array
    const datasetArr = allDays.map((day) => dayToRow[day]);

    // Build series array: sales first, then rentals
    const salesSeries = saleItems.map((li, idx: number) => {
      if (li?.__typename === "SaleSalesOrderLineItem")
        return {
          id: li.id,
          label:
            li.so_pim_product?.name || li.so_pim_category?.name || `Sale Item ${idx + 1}`,
          dataKey: li.so_pim_product?.name || li.id,
          area: true,
          showMark: false,
          stack: "total",
          color: ["#43a047", "#ffd600", "#ff7043", "#8d6e63"][idx % 4],
        };
      return null;
    });
    const rentalSeries = rentalItems.map((li: any, idx: number) => {
      if (li?.__typename === "RentalSalesOrderLineItem")
        return {
          id: li.id,
          label: li.so_pim_product?.name || li.so_pim_category?.name || `Rental Item ${idx + 1}`,
          dataKey: li.so_pim_product?.name || li.id,
          area: true,
          showMark: false,
          stack: "total",
          color: ["#1976d2", "#64b5f6", "#ab47bc", "#00bcd4"][idx % 4],
        };
      return null;
    });

    setDataset(datasetArr);
    setSeries([...salesSeries, ...rentalSeries]);
  }, [data]);

  if (loading) return <div>Loading price forecast...</div>;
  if (error) return <div>Error loading forecast: {error.message}</div>;
  if (!dataset.length || !series.length) return <div>No forecast data available.</div>;

  return (
    <div>
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
            width: 70,
          },
        ]}
        series={series}
        height={400}
      />
    </div>
  );
}
