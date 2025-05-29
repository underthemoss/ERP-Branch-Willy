import { graphql } from "@/graphql";
import { useCreatePriceBookMutation as _useCreatePriceBookMutation } from "@/graphql/hooks";

// Re-exporting other hooks, that do not need any modifications
export {
  useListPriceBooksQuery,
  useListPricesQuery,
  useGetPriceBookByIdQuery,
} from "@/graphql/hooks";

// Re-exporting types
export type {
  PriceBookFieldsFragment as PriceBookFields,
  RentalPriceFieldsFragment as RentalPriceFields,
  SalePriceFieldsFragment as SalePriceFields,
} from "@/graphql/graphql";

export const PriceBookFieldsFragment = graphql(`
  fragment PriceBookFields on PriceBook {
    id
    name
    createdBy
    updatedAt
    isDefault
  }
`);

export const RentalPriceFieldsFragment = graphql(`
  fragment RentalPriceFields on RentalPrice {
    id
    name
    pimCategoryId
    pimCategoryPath
    pimCategoryName
    priceType
    pricePerDayInCents
    pricePerWeekInCents
    pricePerMonthInCents
    createdAt
    updatedAt
  }
`);

export const SalePriceFieldsFragment = graphql(`
  fragment SalePriceFields on SalePrice {
    id
    name
    createdBy
    pimCategoryId
    pimCategoryPath
    pimCategoryName
    priceType
    unitCostInCents
    createdAt
    updatedAt
  }
`);

graphql(`
  query ListPrices($filter: ListPricesFilter!, $page: ListPricesPage!) {
    listPrices(filter: $filter, page: $page) {
      items {
        __typename
        ... on RentalPrice {
          ...RentalPriceFields
        }
        ... on SalePrice {
          ...SalePriceFields
        }
      }
    }
  }
`);

graphql(`
  query ListPriceBooks($page: ListPriceBooksPage!) {
    listPriceBooks(page: $page) {
      items {
        ...PriceBookFields
      }
      page {
        number
        size
        totalItems
        totalPages
      }
    }
  }
`);

graphql(`
  mutation CreatePriceBook($input: CreatePriceBookInput!) {
    createPriceBook(input: $input) {
      ...PriceBookFields
    }
  }
`);

graphql(`
  query GetPriceBookById($id: ID!) {
    getPriceBookById(id: $id) {
      ...PriceBookFields
    }
  }
`);

export function useCreatePriceBookMutation(
  options?: Parameters<typeof _useCreatePriceBookMutation>[0],
) {
  return _useCreatePriceBookMutation({
    ...options,
    refetchQueries: ["ListPriceBooks"],
  });
}
