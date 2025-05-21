import { graphql } from "@/graphql";

// Re-exporting types
export type { PimProductTreeViewItemFragment as PimProductTreeViewItem } from "@/graphql/graphql";

export { useListPimProductsQuery } from "@/graphql/hooks";

graphql(`
  fragment PimProductTreeViewItem on PimProduct {
    id
    name
    pim_category_path
  }
`);

graphql(`
  query ListPimProducts($page: ListPimProductsPage) {
    listPimProducts(page: $page) {
      page {
        number
        size
        totalItems
        totalPages
      }
      items {
        ...PimProductTreeViewItem
      }
    }
  }
`);
