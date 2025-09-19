"use client";

import { graphql } from "@/graphql";

graphql(`
  query GetPurchaseOrderSaleLineItemByIdCreateDialog($id: String!) {
    getPurchaseOrderLineItemById(id: $id) {
      ... on SalePurchaseOrderLineItem {
        id
        po_pim_id
        po_quantity
        price {
          ... on SalePrice {
            unitCostInCents
          }
        }
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
        created_at
        updated_at
        lineitem_status
        deliveryNotes
        delivery_date
        delivery_location
        delivery_method
        delivery_charge_in_cents
      }
    }
  }
`);

graphql(`
  mutation updateSalePurchaseOrderLineCreateDialog($input: UpdateSalePurchaseOrderLineItemInput!) {
    updateSalePurchaseOrderLineItem(input: $input) {
      id
    }
  }
`);

// Export the generated hook (after codegen runs, this will be available)
export { useGetPurchaseOrderSaleLineItemByIdCreateDialogQuery } from "@/graphql/hooks";
