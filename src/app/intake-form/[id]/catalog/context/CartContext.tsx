"use client";

import { DeliveryMethod, LineItemPriceForecast, RequestType } from "@/graphql/graphql";
import {
  useCreateIntakeFormSubmissionLineItemMutation,
  useCreateIntakeFormSubmissionMutation,
  useDeleteIntakeFormSubmissionLineItemMutation,
  useListIntakeFormSubmissionLineItemsQuery,
  useSubmitIntakeFormSubmissionMutation,
  useUpdateIntakeFormSubmissionLineItemMutation,
  useUpdateIntakeFormSubmissionMutation,
} from "@/ui/intake-forms/api";
import { useRouter, useSearchParams } from "next/navigation";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

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

export interface DeliveryDetails {
  quantity: number;
  deliveryDate?: Date;
  rentalStartDate?: Date;
  rentalEndDate?: Date;
  deliveryMethod: "DELIVERY" | "PICKUP";
  deliveryLocation?: string;
  deliveryNotes?: string;
}

export interface CartItem {
  // From price hit
  priceId: string;
  priceName: string;
  priceType: "RENTAL" | "SALE";
  pimCategoryId: string;
  pimCategoryName: string;
  pimCategoryPath: string;
  unitCostInCents?: number;
  pricePerDayInCents?: number;
  pricePerWeekInCents?: number;
  pricePerMonthInCents?: number;

  // From delivery dialog
  quantity: number;
  deliveryDate?: Date;
  rentalStartDate?: Date;
  rentalEndDate?: Date;
  deliveryMethod: "DELIVERY" | "PICKUP";
  deliveryLocation?: string;
  deliveryNotes?: string;

  // Tracking
  tempId: string; // Local ID for optimistic UI
  lineItemId?: string; // DB ID after save

  // Backend calculated values
  subtotalInCents?: number;
  priceForecast?: LineItemPriceForecast | null;
}

export interface ContactInfo {
  fullName: string;
  email: string;
  phoneNumber: string;
  company: string;
  purchaseOrderNumber?: string;
}

interface CartContextType {
  items: CartItem[];
  submissionId: string | null;
  isDrawerOpen: boolean;
  cartAnimation: boolean;
  isLoading: boolean;

  // Item management
  addItem: (priceHit: PriceHit, delivery: DeliveryDetails) => Promise<void>;
  updateItem: (tempId: string, updates: Partial<CartItem>) => Promise<void>;
  removeItem: (tempId: string) => Promise<void>;

  // Drawer
  toggleDrawer: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;

  // Utils
  getTotalItems: () => number;

  // Subtotals
  itemSubtotals: Record<string, number>; // tempId -> subtotal in cents
  setItemSubtotal: (tempId: string, subtotalInCents: number) => void;
  getCartTotal: () => number;

  // Checkout
  submitRequest: (contactInfo: ContactInfo) => Promise<void>;
  isSubmitting: boolean;
  isSubmitted: boolean;
  submittedContactInfo: ContactInfo | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}

interface CartProviderProps {
  children: React.ReactNode;
  formId: string;
  workspaceId: string;
}

export function CartProvider({ children, formId, workspaceId }: CartProviderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const existingSubmissionId = searchParams.get("submissionId");

  const [items, setItems] = useState<CartItem[]>([]);
  const [submissionId, setSubmissionId] = useState<string | null>(existingSubmissionId);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [cartAnimation, setCartAnimation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedContactInfo, setSubmittedContactInfo] = useState<ContactInfo | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [itemSubtotals, setItemSubtotals] = useState<Record<string, number>>({});

  // GraphQL mutations
  const [createSubmission] = useCreateIntakeFormSubmissionMutation();
  const [createLineItem] = useCreateIntakeFormSubmissionLineItemMutation();
  const [updateLineItem] = useUpdateIntakeFormSubmissionLineItemMutation();
  const [deleteLineItem] = useDeleteIntakeFormSubmissionLineItemMutation();
  const [updateSubmission] = useUpdateIntakeFormSubmissionMutation();
  const [submitSubmission] = useSubmitIntakeFormSubmissionMutation();

  // Query existing line items if we have a submission ID
  const { data: lineItemsData, refetch: refetchLineItems } =
    useListIntakeFormSubmissionLineItemsQuery({
      variables: { submissionId: existingSubmissionId || "" },
      skip: !existingSubmissionId,
      fetchPolicy: "cache-and-network",
    });

  // Hydrate cart from existing submission
  useEffect(() => {
    if (isHydrated || !lineItemsData?.listIntakeFormSubmissionLineItems) {
      return;
    }

    const existingItems = lineItemsData.listIntakeFormSubmissionLineItems;
    const hydratedItems: CartItem[] = existingItems.map((item) => ({
      priceId: item.priceId || "",
      priceName:
        item.price?.__typename === "RentalPrice" || item.price?.__typename === "SalePrice"
          ? item.price.name || item.description
          : item.description,
      priceType: item.type === "RENTAL" ? "RENTAL" : "SALE",
      pimCategoryId: item.pimCategoryId,
      pimCategoryName: item.pimCategory?.name || "",
      pimCategoryPath: "",
      quantity: item.quantity,
      deliveryDate: item.startDate ? new Date(item.startDate) : undefined,
      rentalStartDate: item.rentalStartDate ? new Date(item.rentalStartDate) : undefined,
      rentalEndDate: item.rentalEndDate ? new Date(item.rentalEndDate) : undefined,
      deliveryMethod: (item.deliveryMethod as "DELIVERY" | "PICKUP") || "DELIVERY",
      deliveryLocation: item.deliveryLocation || undefined,
      deliveryNotes: item.deliveryNotes || undefined,
      tempId: crypto.randomUUID(),
      lineItemId: item.id,
      subtotalInCents: item.subtotalInCents,
      priceForecast: item.priceForecast,
    }));

    setItems(hydratedItems);
    setIsHydrated(true);
  }, [lineItemsData, isHydrated]);

  // Calculate rental duration
  const calculateDuration = (startDate?: Date, endDate?: Date): number => {
    if (!startDate || !endDate) return 1;
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  };

  // Add item to cart
  const addItem = useCallback(
    async (priceHit: PriceHit, delivery: DeliveryDetails) => {
      setIsLoading(true);

      try {
        // Create temp item for optimistic UI
        const tempItem: CartItem = {
          priceId: priceHit.objectID,
          priceName: priceHit.name || "Unnamed Price",
          priceType: priceHit.priceType,
          pimCategoryId: priceHit.pimCategoryId,
          pimCategoryName: priceHit.pimCategoryName,
          pimCategoryPath: priceHit.pimCategoryPath,
          unitCostInCents: priceHit.unitCostInCents || undefined,
          pricePerDayInCents: priceHit.pricePerDayInCents || undefined,
          pricePerWeekInCents: priceHit.pricePerWeekInCents || undefined,
          pricePerMonthInCents: priceHit.pricePerMonthInCents || undefined,
          ...delivery,
          tempId: crypto.randomUUID(),
        };

        // Add to state immediately (optimistic)
        setItems((prev) => [...prev, tempItem]);

        // Trigger cart animation
        setCartAnimation(true);
        setTimeout(() => setCartAnimation(false), 600);

        // Open drawer on first item
        if (items.length === 0 && !submissionId) {
          setIsDrawerOpen(true);
        }

        let currentSubmissionId = submissionId;

        // Create submission if this is the first item
        if (!currentSubmissionId) {
          const result = await createSubmission({
            variables: {
              input: {
                formId,
                workspaceId,
              },
            },
          });

          if (result.data?.createIntakeFormSubmission?.id) {
            currentSubmissionId = result.data.createIntakeFormSubmission.id;
            setSubmissionId(currentSubmissionId);

            // Update URL with submission ID
            const newUrl = `/intake-form/${formId}/catalog?submissionId=${currentSubmissionId}`;
            router.push(newUrl, { scroll: false });
          } else {
            throw new Error("Failed to create submission");
          }
        }

        // Create line item
        const isRental = priceHit.priceType === "RENTAL";
        const duration = isRental
          ? calculateDuration(delivery.rentalStartDate, delivery.rentalEndDate)
          : 1;

        // Check if this is a custom/unlisted item (priceId starts with "custom-")
        const isCustomItem = priceHit.objectID.startsWith("custom-");

        const lineItemResult = await createLineItem({
          variables: {
            submissionId: currentSubmissionId,
            input: {
              description: priceHit.name || priceHit.pimCategoryName,
              pimCategoryId: priceHit.pimCategoryId,
              // For custom items, don't send priceId, use customPriceName instead
              priceId: isCustomItem ? undefined : priceHit.objectID,
              customPriceName: isCustomItem ? priceHit.name : undefined,
              quantity: delivery.quantity,
              durationInDays: duration,
              startDate: isRental
                ? delivery.rentalStartDate?.toISOString()
                : delivery.deliveryDate?.toISOString(),
              rentalStartDate: delivery.rentalStartDate?.toISOString(),
              rentalEndDate: delivery.rentalEndDate?.toISOString(),
              type: isRental ? RequestType.Rental : RequestType.Purchase,
              deliveryMethod:
                delivery.deliveryMethod === "DELIVERY"
                  ? DeliveryMethod.Delivery
                  : DeliveryMethod.Pickup,
              deliveryLocation: delivery.deliveryLocation,
              // For custom items, include the description in the notes
              deliveryNotes:
                isCustomItem && priceHit.category_lvl1
                  ? `${priceHit.category_lvl1}${delivery.deliveryNotes ? `\n\n${delivery.deliveryNotes}` : ""}`
                  : delivery.deliveryNotes,
            },
          },
        });

        // Update temp item with real ID
        const lineItemId = lineItemResult.data?.createIntakeFormSubmissionLineItem?.id;
        if (lineItemId) {
          setItems((prev) =>
            prev.map((item) => (item.tempId === tempItem.tempId ? { ...item, lineItemId } : item)),
          );
        }
      } catch (error) {
        console.error("Error adding item:", error);
        // Remove optimistic item on error
        setItems((prev) =>
          prev.filter((item) => item.lineItemId !== undefined || prev.length === 1),
        );
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [submissionId, items.length, formId, workspaceId, createSubmission, createLineItem, router],
  );

  // Update item
  const updateItem = useCallback(
    async (tempId: string, updates: Partial<CartItem>) => {
      const item = items.find((i) => i.tempId === tempId);
      if (!item?.lineItemId) return;

      setIsLoading(true);

      try {
        // Update locally first (optimistic)
        setItems((prev) => prev.map((i) => (i.tempId === tempId ? { ...i, ...updates } : i)));

        const isRental = item.priceType === "RENTAL";
        const newStartDate = updates.rentalStartDate ?? item.rentalStartDate;
        const newEndDate = updates.rentalEndDate ?? item.rentalEndDate;
        const duration = isRental ? calculateDuration(newStartDate, newEndDate) : 1;

        await updateLineItem({
          variables: {
            id: item.lineItemId,
            input: {
              description: item.priceName,
              pimCategoryId: item.pimCategoryId,
              priceId: item.priceId,
              quantity: updates.quantity ?? item.quantity,
              durationInDays: duration,
              startDate: isRental
                ? newStartDate?.toISOString()
                : (updates.deliveryDate ?? item.deliveryDate)?.toISOString(),
              rentalStartDate: newStartDate?.toISOString(),
              rentalEndDate: newEndDate?.toISOString(),
              type: isRental ? RequestType.Rental : RequestType.Purchase,
              deliveryMethod:
                (updates.deliveryMethod ?? item.deliveryMethod) === "DELIVERY"
                  ? DeliveryMethod.Delivery
                  : DeliveryMethod.Pickup,
              deliveryLocation: updates.deliveryLocation ?? item.deliveryLocation,
              deliveryNotes: updates.deliveryNotes ?? item.deliveryNotes,
            },
          },
        });
      } catch (error) {
        console.error("Error updating item:", error);
        // Revert on error
        await refetchLineItems();
      } finally {
        setIsLoading(false);
      }
    },
    [items, updateLineItem, refetchLineItems],
  );

  // Remove item
  const removeItem = useCallback(
    async (tempId: string) => {
      const item = items.find((i) => i.tempId === tempId);
      if (!item?.lineItemId) {
        // Just remove from local state if not saved
        setItems((prev) => prev.filter((i) => i.tempId !== tempId));
        return;
      }

      setIsLoading(true);

      try {
        // Remove locally first (optimistic)
        setItems((prev) => prev.filter((i) => i.tempId !== tempId));

        await deleteLineItem({
          variables: { id: item.lineItemId },
        });
      } catch (error) {
        console.error("Error removing item:", error);
        // Revert on error
        await refetchLineItems();
      } finally {
        setIsLoading(false);
      }
    },
    [items, deleteLineItem, refetchLineItems],
  );

  // Submit request
  const submitRequest = useCallback(
    async (contactInfo: ContactInfo) => {
      if (!submissionId) {
        throw new Error("No submission to submit");
      }

      setIsSubmitting(true);

      try {
        // Update submission with contact info before submitting
        await updateSubmission({
          variables: {
            id: submissionId,
            input: {
              name: contactInfo.fullName,
              email: contactInfo.email,
              phone: contactInfo.phoneNumber || undefined,
              companyName: contactInfo.company || undefined,
              purchaseOrderNumber: contactInfo.purchaseOrderNumber || undefined,
            },
          },
        });

        // Submit the submission
        await submitSubmission({
          variables: { id: submissionId },
        });

        setIsSubmitted(true);
        setSubmittedContactInfo(contactInfo);
      } catch (error) {
        console.error("Error submitting request:", error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [submissionId, updateSubmission, submitSubmission],
  );

  // Drawer controls
  const toggleDrawer = useCallback(() => setIsDrawerOpen((prev) => !prev), []);
  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  // Utils
  const getTotalItems = useCallback(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  // Subtotals management
  const setItemSubtotal = useCallback((tempId: string, subtotalInCents: number) => {
    setItemSubtotals((prev) => ({ ...prev, [tempId]: subtotalInCents }));
  }, []);

  const getCartTotal = useCallback(() => {
    return items.reduce((total, item) => {
      // Use backend-calculated subtotal if available
      if (item.subtotalInCents !== undefined) {
        return total + item.subtotalInCents;
      }
      // Fall back to local calculation for new items
      if (item.priceType === "RENTAL") {
        return total + (itemSubtotals[item.tempId] || 0);
      }
      // For sales, calculate from unit cost * quantity
      return total + (item.unitCostInCents || 0) * item.quantity;
    }, 0);
  }, [items, itemSubtotals]);

  // Clean up subtotals when items are removed
  useEffect(() => {
    const itemIds = new Set(items.map((item) => item.tempId));
    setItemSubtotals((prev) => {
      const newSubtotals: Record<string, number> = {};
      for (const [tempId, subtotal] of Object.entries(prev)) {
        if (itemIds.has(tempId)) {
          newSubtotals[tempId] = subtotal;
        }
      }
      return newSubtotals;
    });
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        submissionId,
        isDrawerOpen,
        cartAnimation,
        isLoading,
        addItem,
        updateItem,
        removeItem,
        toggleDrawer,
        openDrawer,
        closeDrawer,
        getTotalItems,
        itemSubtotals,
        setItemSubtotal,
        getCartTotal,
        submitRequest,
        isSubmitting,
        isSubmitted,
        submittedContactInfo,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
