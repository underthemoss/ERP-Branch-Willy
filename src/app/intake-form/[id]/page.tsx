"use client";

import { redirect, useParams } from "next/navigation";

// Types exported for backwards compatibility with existing components
export interface ContactInfo {
  fullName: string;
  email: string;
  phoneNumber: string;
  company: string;
  purchaseOrderNumber?: string;
}

// Line item type with pricebook support
export interface LineItem {
  id?: string; // Optional ID for tracking created items
  // Core fields
  type: "RENTAL" | "PURCHASE";
  pimCategoryId: string;
  pimCategoryName?: string; // Store for display
  label?: string; // Computed display label derived from available fields
  priceId?: string;
  priceName?: string; // Store for display
  priceBookName?: string; // Store for display
  unitCostInCents?: number; // Store for display (purchase)

  // Rental pricing fields
  pricePerDayInCents?: number;
  pricePerWeekInCents?: number;
  pricePerMonthInCents?: number;

  // Custom product (when no price selected)
  isCustomProduct?: boolean;
  customProductName?: string;
  isNewProduct?: boolean; // Flag for new product creation flow

  // Quantity and delivery
  quantity: number;
  deliveryDate?: Date;
  deliveryLocation?: string;
  deliveryMethod?: "DELIVERY" | "PICKUP";
  deliveryNotes?: string;

  // Rental specific
  rentalDuration?: number; // days
  rentalStartDate?: Date;
  rentalEndDate?: Date;
}

export interface FormData {
  contact: ContactInfo;
  lineItems: LineItem[];
  requestNumber?: string;
  submittedDate?: Date;
}

// Redirect to the new catalog page
export default function IntakeFormPage() {
  const params = useParams();
  const formId = params.id as string;

  // Redirect to the catalog page
  redirect(`/intake-form/${formId}/catalog`);
}
