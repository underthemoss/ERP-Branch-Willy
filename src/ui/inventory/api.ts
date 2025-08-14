import { graphql } from "@/graphql";

// Re-exporting types
export type {} from "@/graphql/graphql";

// Re-exporting hooks
export {} from "@/graphql/hooks";

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
