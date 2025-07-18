import { graphql } from "@/graphql";

// Re-exporting types
export type {
  PimProductFieldsFragment as PimProductFields,
  PimCategoryFieldsFragment as PimCategoryFields,
} from "@/graphql/graphql";

export {
  useListPimProductsQuery,
  useListPimCategoriesQuery,
  useListPimCategoriesLazyQuery,
  useListPimProductsLazyQuery,
  useGetPimCategoryByIdQuery,
  useGetPimCategoryByIdLazyQuery,
  useGetPimProductByIdQuery,
  useGetPimProductByIdLazyQuery,
} from "@/graphql/hooks";

graphql(`
  fragment PimProductFields on PimProduct {
    id
    name
    pim_category_path
    pim_category_platform_id
  }
`);

graphql(`
  fragment PimCategoryFields on PimCategory {
    id
    name
    path
    has_products
    childrenCount
    productCount
  }
`);

graphql(`
  query ListPimProducts($page: ListPimProductsPage, $filter: ListPimProductsFilter) {
    listPimProducts(page: $page, filter: $filter) {
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
  query ListPimCategories($page: ListPimCategoriesPage, $filter: ListPimCategoriesFilter) {
    listPimCategories(page: $page, filter: $filter) {
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

graphql(`
  query GetPimCategoryById($id: ID!) {
    getPimCategoryById(id: $id) {
      ...PimCategoryFields
    }
  }
`);

graphql(`
  query GetPimProductById($id: ID!) {
    getPimProductById(id: $id) {
      ...PimProductFields
    }
  }
`);
