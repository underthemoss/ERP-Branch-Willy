import { graphql } from "@/graphql";

// Re-exporting types
export type { InventoryFieldsFragment } from "@/graphql/graphql";

// Re-exporting hooks
export { useListInventoryQuery } from "@/graphql/hooks";

graphql(`
  fragment InventoryFields on Inventory {
    id
    status
    fulfilmentId
    purchaseOrderId
    purchaseOrderLineItemId
    isThirdPartyRental
    assetId
    pimCategoryId
    pimCategoryPath
    pimCategoryName
    pimProductId
    resourceMapId
    fulfilmentId
    asset {
      id
      name
      pim_make
      pim_product_model
      pim_product_year
      inventory_branch {
        id
        name
      }
    }
  }
`);

graphql(`
  query ListInventory($query: ListInventoryQuery!) {
    listInventory(query: $query) {
      items {
        ...InventoryFields
      }
    }
  }
`);
