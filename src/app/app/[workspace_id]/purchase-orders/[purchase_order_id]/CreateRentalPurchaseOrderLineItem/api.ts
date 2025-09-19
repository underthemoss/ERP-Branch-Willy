"use client";

import { graphql } from "@/graphql";

graphql(`
  query GetPurchaseOrderRentalLineItemByIdCreateDialog($id: String!) {
    getPurchaseOrderLineItemById(id: $id) {
      ... on RentalPurchaseOrderLineItem {
        id
        po_pim_id
        po_quantity
        so_pim_product {
          name
          model
          sku
          manufacturer_part_number
          year
        }
        so_pim_category {
          id
          name
          description
        }
        price_id
        price {
          ... on RentalPrice {
            pricePerDayInCents
            pricePerWeekInCents
            pricePerMonthInCents
          }
        }
        delivery_location
        deliveryNotes
        delivery_date
        delivery_method
        delivery_charge_in_cents
        off_rent_date
        created_at
        updated_at
        lineitem_status
      }
    }
  }
`);

graphql(`
  mutation updateRentalPurchaseOrderLineCreateDialog(
    $input: UpdateRentalPurchaseOrderLineItemInput!
  ) {
    updateRentalPurchaseOrderLineItem(input: $input) {
      ... on RentalPurchaseOrderLineItem {
        id
      }
    }
  }
`);

// Export the generated hook (after codegen runs, this will be available)
export { useGetPurchaseOrderRentalLineItemByIdCreateDialogQuery } from "@/graphql/hooks";
