"use client";

import { graphql } from "@/graphql";

graphql(`
  query GetPricesCreateDialog {
    listPrices(page: { number: 0, size: 10000 }, filter: { priceType: RENTAL }) {
      items {
        __typename
        ... on RentalPrice {
          priceBook {
            id
            name
          }
          id
          pricePerDayInCents
          pricePerWeekInCents
          pricePerMonthInCents
          pimProductId
          pimCategoryId
        }
      }
    }
  }
`);

graphql(`
  query GetSalesOrderRentalLineItemByIdCreateDialog($id: String!) {
    getSalesOrderLineItemById(id: $id) {
      ... on RentalSalesOrderLineItem {
        id
        so_pim_id
        so_quantity
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
  mutation updateRentalSalesOrderLineCreateDialog($input: UpdateRentalSalesOrderLineItemInput!) {
    updateRentalSalesOrderLineItem(input: $input) {
      ... on RentalSalesOrderLineItem {
        id
      }
    }
  }
`);

// Export the generated hook (after codegen runs, this will be available)
export { useGetSalesOrderRentalLineItemByIdCreateDialogQuery } from "@/graphql/hooks";
