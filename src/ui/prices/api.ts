import { graphql } from "@/graphql";
import {
  useCreatePriceBookMutation as _useCreatePriceBookMutation,
  useCreateRentalPriceMutation as _useCreateRentalPriceMutation,
  useCreateSalePriceMutation as _useCreateSalePriceMutation,
  useDeletePriceBookByIdMutation as _useDeletePriceBookByIdMutation,
} from "@/graphql/hooks";

export {
  useListPriceBooksQuery,
  useListPricesQuery,
  useGetPriceBookByIdQuery,
  useListPriceNamesQuery,
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
    updatedAt
    createdAt
    createdByUser {
      id
      firstName
      lastName
    }
    updatedByUser {
      id
      firstName
      lastName
    }
    parentPriceBook {
      id
      name
    }
    parentPriceBookPercentageFactor
    location
    businessContact {
      id
      name
    }
    project {
      id
      name
    }
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
    priceBook {
      id
      name
    }
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
    priceBook {
      id
      name
    }
  }
`);

graphql(`
  query ListPrices($filter: ListPricesFilter, $page: ListPricesPage!) {
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

graphql(`
  mutation DeletePriceBookById($id: ID!) {
    deletePriceBookById(id: $id)
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

export function useDeletePriceBookByIdMutation(
  options?: Parameters<typeof _useDeletePriceBookByIdMutation>[0],
) {
  return _useDeletePriceBookByIdMutation({
    ...options,
    refetchQueries: ["ListPriceBooks"],
  });
}

// ListPriceBookCategories query for category dropdown
graphql(`
  query ListPriceBookCategories($priceBookId: String) {
    listPriceBookCategories(priceBookId: $priceBookId) {
      id
      name
    }
  }
`);

graphql(`
  mutation CreateRentalPrice($input: CreateRentalPriceInput!) {
    createRentalPrice(input: $input) {
      ...RentalPriceFields
    }
  }
`);

graphql(`
  mutation CreateSalePrice($input: CreateSalePriceInput!) {
    createSalePrice(input: $input) {
      ...SalePriceFields
    }
  }
`);

export function useCreateRentalPriceMutation(
  options?: Parameters<typeof _useCreateRentalPriceMutation>[0],
) {
  return _useCreateRentalPriceMutation({
    ...options,
    refetchQueries: ["ListPrices", "ListPriceBookCategories", "ListPriceNames"],
  });
}

export function useCreateSalePriceMutation(
  options?: Parameters<typeof _useCreateSalePriceMutation>[0],
) {
  return _useCreateSalePriceMutation({
    ...options,
    refetchQueries: ["ListPrices", "ListPriceBookCategories", "ListPriceNames"],
  });
}

// ListPriceNames query for class dropdown
graphql(`
  query ListPriceNames($priceBookId: String, $pimCategoryId: String) {
    listPriceNames(priceBookId: $priceBookId, pimCategoryId: $pimCategoryId)
  }
`);
