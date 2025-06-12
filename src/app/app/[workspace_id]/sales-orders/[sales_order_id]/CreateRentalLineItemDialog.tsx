"use client";

import { graphql } from "@/graphql";
import {
  useCreateRentalSalesOrderLineItemMutation,
  useSalesOrderRentalListPricesQuery,
} from "@/graphql/hooks";
import { Dialog } from "@mui/material";
import { useParams } from "next/navigation";
import React, { useState } from "react";
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
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Product Selection State
  const [soPimId, setSoPimId] = useState<string>("");

  // Step 2: Pricing State
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);

  // Step 3: Fulfillment State
  const [fulfillmentMethod, setFulfillmentMethod] = useState<"Delivery" | "Pickup">("Delivery");
  const [deliveryLocation, setDeliveryLocation] = useState<string>(
    "3274 Doe Meadow Drive, Annapolis Junction, MD 20701",
  );
  const [deliveryCharge, setDeliveryCharge] = useState<string>("0.00");
  const [deliveryDate, setDeliveryDate] = useState<string>("");
  const [daysRented, setDaysRented] = useState<string>("");

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
    setFulfillmentMethod("Delivery");
    setDeliveryLocation("3274 Doe Meadow Drive, Annapolis Junction, MD 20701");
    setDeliveryCharge("0.00");
    setDeliveryDate("");
    setDaysRented("");
    setDeliveryNotes("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // Only validate on last step
    if (step !== 4) return;
    // TODO: Add validation for required fields if needed
    try {
      const selectedRentalPrice = rentalPrices.find((p) => p.id === selectedPrice?.toString());
      await createLineItem({
        variables: {
          input: {
            sales_order_id: salesOrderId,
            so_pim_id: soPimId,
            so_quantity: 1, // Default to 1 for now
            price_id: selectedPrice?.toString() || null,
            price_per_day_in_cents: selectedRentalPrice?.pricePerDayInCents || null,
            price_per_week_in_cents: selectedRentalPrice?.pricePerWeekInCents || null,
            price_per_month_in_cents: selectedRentalPrice?.pricePerMonthInCents || null,
            unit_cost_in_cents: null, // Optional field
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
          deliveryDate={deliveryDate}
          setDeliveryDate={setDeliveryDate}
          offRentDate={daysRented}
          setOffRentDate={setDaysRented}
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
          onSubmit={handleSubmit}
          onBack={() => setStep(3)}
        />
      )}
    </Dialog>
  );
};

export default CreateRentalLineItemDialog;
