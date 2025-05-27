import { graphql } from "@/graphql";

// Re-exporting types
export type {
  PimProductFieldsFragment as PimProductFields,
  PimCategoryFieldsFragment as PimCategoryFields,
} from "@/graphql/graphql";

export { useListPimProductsQuery, useListPimCategoriesQuery } from "@/graphql/hooks";

graphql(`
  fragment PimProductFields on PimProduct {
    id
    name
    pim_category_path
  }
`);

graphql(`
  fragment PimCategoryFields on PimCategory {
    id
    name
    path
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
        ...PimProductFields
      }
    }
  }
`);

graphql(`
  query ListPimCategories($page: ListPimCategoriesPage) {
    listPimCategories(page: $page) {
      page {
        number
        size
        totalItems
        totalPages
      }
      items {
        ...PimCategoryFields
      }
    }
  }
`);
