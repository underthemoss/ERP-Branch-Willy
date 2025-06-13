"use client";

import { graphql } from "@/graphql";
import {
  useCreateRentalSalesOrderLineItemMutation,
  useSalesOrderRentalListPricesQuery,
} from "@/graphql/hooks";
import { Dialog } from "@mui/material";
import { useParams } from "next/navigation";
import React, { useState } from "react";
import CreateRentalLineItemConfirmationStep from "./CreateRentalLineItemConfirmationStep";
import CreateRentalLineItemDeliveryNotesStep from "./CreateRentalLineItemDeliveryNotesStep";
import CreateRentalLineItemFulfillmentDetailsStep from "./CreateRentalLineItemFulfillmentDetailsStep";
import CreateRentalLineItemPricingSelectionStep from "./CreateRentalLineItemPricingSelectionStep";
import CreateRentalLineItemProductSelectionStep from "./CreateRentalLineItemProductSelectionStep";

// GQL mutation declaration (for codegen)
graphql(`
  mutation createRentalSalesOrderLineItem($input: CreateRentalSalesOrderLineItemInput!) {
    createRentalSalesOrderLineItem(input: $input) {
      ... on RentalSalesOrderLineItem {
        id
        so_pim_id
        so_quantity
        price_per_day_in_cents
        price_per_week_in_cents
        price_per_month_in_cents
      }
    }
  }
`);

graphql(`
  query SalesOrderRentalListPrices {
    listPrices(page: { number: 0, size: 10000 }, filter: { priceType: RENTAL }) {
      items {
        __typename
        ... on RentalPrice {
          pimProductId
          pimProduct {
            name
          }
          pimCategoryId
          priceBook {
            name
            id
          }
          name
          id
          pricePerDayInCents
          pricePerWeekInCents
          pricePerMonthInCents
          priceType
        }
      }
    }
  }
`);

// Add date formatting function
const formatDate = (dateString: string | null): string => {
  if (!dateString) return "";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (e) {
    return dateString;
  }
};

interface RentalCostCalculationInput {
  pricePerDayInCents: number | null;
  pricePerWeekInCents: number | null;
  pricePerMonthInCents: number | null;
  startDate: string | null;
  endDate: string | null;
}

const calculateRentalCost = (
  input: RentalCostCalculationInput,
): { totalCost: number; breakdown: string[] } => {
  const { pricePerDayInCents, pricePerWeekInCents, pricePerMonthInCents, startDate, endDate } =
    input;

  if (!startDate || !endDate || !pricePerDayInCents) {
    return { totalCost: 0, breakdown: ["Invalid dates or pricing information"] };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  if (totalDays <= 0) {
    return { totalCost: 0, breakdown: ["Invalid date range"] };
  }

  let remainingDays = totalDays;
  let totalCost = 0;
  const breakdown: string[] = [];

  // Calculate using monthly rates first (if available)
  if (pricePerMonthInCents) {
    const months = Math.floor(remainingDays / 30);
    if (months > 0) {
      const monthlyCost = months * pricePerMonthInCents;
      totalCost += monthlyCost;
      breakdown.push(
        `${months} month(s) at $${(pricePerMonthInCents / 100).toFixed(2)}/month = $${(monthlyCost / 100).toFixed(2)}`,
      );
      remainingDays -= months * 30;
    }
  }

  // Then calculate using weekly rates (if available)
  if (pricePerWeekInCents && remainingDays >= 7) {
    const weeks = Math.floor(remainingDays / 7);
    if (weeks > 0) {
      const weeklyCost = weeks * pricePerWeekInCents;
      totalCost += weeklyCost;
      breakdown.push(
        `${weeks} week(s) at $${(pricePerWeekInCents / 100).toFixed(2)}/week = $${(weeklyCost / 100).toFixed(2)}`,
      );
      remainingDays -= weeks * 7;
    }
  }

  // Finally, calculate remaining days using daily rate
  if (remainingDays > 0 && pricePerDayInCents) {
    const dailyCost = remainingDays * pricePerDayInCents;
    totalCost += dailyCost;
    breakdown.push(
      `${remainingDays} day(s) at $${(pricePerDayInCents / 100).toFixed(2)}/day = $${(dailyCost / 100).toFixed(2)}`,
    );
  }

  breakdown.push(`Total Cost: $${(totalCost / 100).toFixed(2)}`);
  return { totalCost, breakdown };
};

// Add utility types and functions for price handling
type PriceInCents = {
  pricePerDayInCents: number | null;
  pricePerWeekInCents: number | null;
  pricePerMonthInCents: number | null;
};

const formatCentsToUSD = (cents: number | null): string | undefined => {
  if (cents == null) return undefined;
  return `$${(cents / 100).toFixed(2)}`;
};

const getPriceFromRentalPrice = (
  rentalPrice: any,
  isCustom: boolean,
  customPrices: PriceInCents,
): PriceInCents => {
  if (isCustom) {
    return customPrices;
  }
  return {
    pricePerDayInCents: rentalPrice?.pricePerDayInCents ?? null,
    pricePerWeekInCents: rentalPrice?.pricePerWeekInCents ?? null,
    pricePerMonthInCents: rentalPrice?.pricePerMonthInCents ?? null,
  };
};

interface CreateRentalLineItemDialogProps {
  open: boolean;
  onClose: () => void;
  salesOrderId: string;
  onSuccess: () => void;
}

export const CreateRentalLineItemDialog: React.FC<CreateRentalLineItemDialogProps> = ({
  open,
  onClose,
  salesOrderId,
  onSuccess,
}) => {
  // Wizard navigation state
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Product Selection State
  const [soPimId, setSoPimId] = useState<string>("");

  // Step 2: Pricing State
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [customPrices, setCustomPrices] = useState<PriceInCents>({
    pricePerDayInCents: null,
    pricePerWeekInCents: null,
    pricePerMonthInCents: null,
  });

  // Step 3: Fulfillment State
  const [fulfillmentMethod, setFulfillmentMethod] = useState<"Delivery" | "Pickup">("Delivery");
  const [deliveryLocation, setDeliveryLocation] = useState<string>("");
  const [deliveryCharge, setDeliveryCharge] = useState<string>("0.00");
  const [dateRange, setDateRange] = useState<[string | null, string | null]>([null, null]);

  // Step 4: Notes State
  const [deliveryNotes, setDeliveryNotes] = useState<string>("");

  // Get workspace_id for price book links
  const { workspace_id } = useParams<{ workspace_id: string }>();

  // Fetch prices for selected PIM product
  const { data: pricesData, loading: pricesLoading } = useSalesOrderRentalListPricesQuery({
    variables: {},
    fetchPolicy: "cache-and-network",
  });

  const rentalPrices =
    pricesData?.listPrices?.items
      ?.filter((item) => item.__typename === "RentalPrice")
      .filter((i) => i.pimCategoryId === soPimId || i.pimProductId === soPimId) ?? [];

  const [createLineItem, { loading }] = useCreateRentalSalesOrderLineItemMutation();

  const handleClose = () => {
    setSoPimId("");
    setError(null);
    setStep(1);
    setSelectedPrice(0);
    setCustomPrices({
      pricePerDayInCents: null,
      pricePerWeekInCents: null,
      pricePerMonthInCents: null,
    });
    setFulfillmentMethod("Delivery");
    setDeliveryLocation("3274 Doe Meadow Drive, Annapolis Junction, MD 20701");
    setDeliveryCharge("0.00");
    setDateRange([null, null]);
    setDeliveryNotes("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (step !== 5) return;

    try {
      const isCustomPrice = selectedPrice === rentalPrices.length;
      const selectedRentalPrice = isCustomPrice ? null : rentalPrices[selectedPrice ?? 0];
      const prices = getPriceFromRentalPrice(selectedRentalPrice, isCustomPrice, customPrices);

      await createLineItem({
        variables: {
          input: {
            sales_order_id: salesOrderId,
            so_pim_id: soPimId,
            so_quantity: 1,
            price_id: isCustomPrice ? null : selectedRentalPrice?.id || null,
            price_per_day_in_cents: prices.pricePerDayInCents,
            price_per_week_in_cents: prices.pricePerWeekInCents,
            price_per_month_in_cents: prices.pricePerMonthInCents,
            unit_cost_in_cents: null,
          },
        },
      });
      handleClose();
      onSuccess();
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    }
  };

  // (No transaction type selection here; this is the rental wizard only)

  return (
    <Dialog open={open} onClose={handleClose} maxWidth={step === 2 ? "md" : "sm"} fullWidth>
      {/* Step 1: Select product */}
      {step === 1 && (
        <CreateRentalLineItemProductSelectionStep
          soPimId={soPimId}
          setSoPimId={setSoPimId}
          onCancel={handleClose}
          onContinue={() => setStep(2)}
          onBack={handleClose}
        />
      )}

      {/* Step 2: Select price */}
      {step === 2 && (
        <CreateRentalLineItemPricingSelectionStep
          soPimId={soPimId}
          pricesLoading={pricesLoading}
          rentalPrices={rentalPrices}
          selectedPrice={selectedPrice}
          setSelectedPrice={setSelectedPrice}
          workspace_id={workspace_id}
          onCancel={handleClose}
          onContinue={() => setStep(3)}
          onBack={() => setStep(1)}
          customPrices={customPrices}
          setCustomPrices={setCustomPrices}
        />
      )}

      {/* Step 3: Fulfillment details */}
      {step === 3 && (
        <CreateRentalLineItemFulfillmentDetailsStep
          fulfillmentMethod={fulfillmentMethod}
          setFulfillmentMethod={setFulfillmentMethod}
          deliveryLocation={deliveryLocation}
          setDeliveryLocation={setDeliveryLocation}
          deliveryCharge={deliveryCharge}
          setDeliveryCharge={setDeliveryCharge}
          dateRange={dateRange}
          setDateRange={setDateRange}
          onCancel={handleClose}
          onContinue={() => setStep(4)}
          onBack={() => setStep(2)}
        />
      )}

      {/* Step 4: Delivery notes */}
      {step === 4 && (
        <CreateRentalLineItemDeliveryNotesStep
          deliveryNotes={deliveryNotes}
          setDeliveryNotes={setDeliveryNotes}
          onCancel={handleClose}
          onSubmit={(e) => {
            e.preventDefault();
            setStep(5);
          }}
          onBack={() => setStep(3)}
        />
      )}

      {/* Step 5: Confirmation */}
      {step === 5 &&
        (() => {
          const isCustomPrice = selectedPrice === rentalPrices.length;
          const selectedRentalPrice = rentalPrices[selectedPrice ?? 0];
          const prices = getPriceFromRentalPrice(selectedRentalPrice, isCustomPrice, customPrices);

          return (
            <CreateRentalLineItemConfirmationStep
              productName={selectedRentalPrice?.pimProduct?.name || ""}
              priceTier={isCustomPrice ? "Custom Price" : selectedRentalPrice?.name || ""}
              priceBookName={isCustomPrice ? undefined : selectedRentalPrice?.priceBook?.name}
              pricePerDay={formatCentsToUSD(prices.pricePerDayInCents)}
              pricePerWeek={formatCentsToUSD(prices.pricePerWeekInCents)}
              pricePerMonth={formatCentsToUSD(prices.pricePerMonthInCents)}
              fulfillmentMethod={fulfillmentMethod}
              deliveryLocation={deliveryLocation}
              deliveryCharge={deliveryCharge}
              deliveryDate={formatDate(dateRange[0])}
              offRentDate={formatDate(dateRange[1])}
              deliveryNotes={deliveryNotes}
              rentalCostBreakdown={(() => {
                if (!dateRange[0] || !dateRange[1]) return undefined;

                const result = calculateRentalCost({
                  pricePerDayInCents: prices.pricePerDayInCents,
                  pricePerWeekInCents: prices.pricePerWeekInCents,
                  pricePerMonthInCents: prices.pricePerMonthInCents,
                  startDate: dateRange[0],
                  endDate: dateRange[1],
                });

                return result.breakdown;
              })()}
              onCancel={handleClose}
              onSubmit={handleSubmit}
              onBack={() => setStep(4)}
            />
          );
        })()}
    </Dialog>
  );
};

export default CreateRentalLineItemDialog;
