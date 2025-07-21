"use client";

import { graphql } from "@/graphql";

graphql(`
  query GetPricesSaleCreateDialog {
    listPrices(page: { number: 0, size: 10000 }, filter: { priceType: SALE }) {
      items {
        __typename
        ... on SalePrice {
          priceBook {
            id
            name
          }
          pimProduct {
            name
            make
            model
            pim_category_path
          }
          pimCategory {
            name
            id
            path
          }
          id
          pimCategoryId
          pimProductId
          unitCostInCents
        }
      }
    }
  }
`);

graphql(`
  query GetSalesOrderSaleLineItemByIdCreateDialog($id: String!) {
    getSalesOrderLineItemById(id: $id) {
      ... on SaleSalesOrderLineItem {
        id
        so_pim_id
        so_quantity
        unit_cost_in_cents
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
  mutation updateSaleSalesOrderLineCreateDialog($input: UpdateSaleSalesOrderLineItemInput!) {
    updateSaleSalesOrderLineItem(input: $input) {
      id
    }
  }
`);

// Export the generated hook (after codegen runs, this will be available)
export { useGetSalesOrderRentalLineItemByIdCreateDialogQuery } from "@/graphql/hooks";
