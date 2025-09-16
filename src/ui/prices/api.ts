import { graphql } from "@/graphql";
import {
  useCreatePriceBookMutation as _useCreatePriceBookMutation,
  useCreateRentalPriceMutation as _useCreateRentalPriceMutation,
  useCreateSalePriceMutation as _useCreateSalePriceMutation,
  useDeletePriceBookByIdMutation as _useDeletePriceBookByIdMutation,
  useDeletePriceByIdMutation as _useDeletePriceByIdMutation,
  useExportPricesMutation as _useExportPricesMutation,
  useImportPricesMutation as _useImportPricesMutation,
  useUpdateRentalPriceMutation as _useUpdateRentalPriceMutation,
  useUpdateSalePriceMutation as _useUpdateSalePriceMutation,
} from "@/graphql/hooks";

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
  query ListPrices(
    $page: ListPricesPage!
    $priceBookId: String
    $pimCategoryId: String
    $name: String
    $priceType: PriceType
    $shouldListPriceBooks: Boolean!
  ) {
    listPrices(
      filter: {
        priceBookId: $priceBookId
        pimCategoryId: $pimCategoryId
        name: $name
        priceType: $priceType
      }
      page: $page
    ) {
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
    listPriceBookCategories(priceBookId: $priceBookId) {
      id
      name
    }
    listPriceNames(priceBookId: $priceBookId, pimCategoryId: $pimCategoryId)
    listPriceBooks(page: { size: 200 }) @include(if: $shouldListPriceBooks) {
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
    refetchQueries: ["ListPrices"],
  });
}

export function useCreateSalePriceMutation(
  options?: Parameters<typeof _useCreateSalePriceMutation>[0],
) {
  return _useCreateSalePriceMutation({
    ...options,
    refetchQueries: ["ListPrices"],
  });
}

graphql(`
  mutation UpdateRentalPrice($input: UpdateRentalPriceInput!) {
    updateRentalPrice(input: $input) {
      ...RentalPriceFields
    }
  }
`);

graphql(`
  mutation UpdateSalePrice($input: UpdateSalePriceInput!) {
    updateSalePrice(input: $input) {
      ...SalePriceFields
    }
  }
`);

export function useUpdateRentalPriceMutation(
  options?: Parameters<typeof _useUpdateRentalPriceMutation>[0],
) {
  return _useUpdateRentalPriceMutation({
    ...options,
    refetchQueries: ["ListPrices"],
  });
}

export function useUpdateSalePriceMutation(
  options?: Parameters<typeof _useUpdateSalePriceMutation>[0],
) {
  return _useUpdateSalePriceMutation({
    ...options,
    refetchQueries: ["ListPrices"],
  });
}

graphql(`
  mutation DeletePriceById($id: ID!) {
    deletePriceById(id: $id)
  }
`);

export function useDeletePriceByIdMutation(
  options?: Parameters<typeof _useDeletePriceByIdMutation>[0],
) {
  return _useDeletePriceByIdMutation({
    ...options,
    refetchQueries: ["ListPrices"],
  });
}

graphql(`
  mutation ExportPrices($priceBookId: ID) {
    exportPrices(priceBookId: $priceBookId) {
      id
      file_key
      file_name
      mime_type
      url
    }
  }
`);

graphql(`
  mutation ImportPrices($fileId: ID!, $priceBookId: ID!) {
    importPrices(fileId: $fileId, priceBookId: $priceBookId) {
      imported
      failed
      errors
    }
  }
`);

export function useExportPricesMutation(options?: Parameters<typeof _useExportPricesMutation>[0]) {
  return _useExportPricesMutation({
    ...options,
  });
}

export function useImportPricesMutation(options?: Parameters<typeof _useImportPricesMutation>[0]) {
  return _useImportPricesMutation({
    ...options,
    refetchQueries: ["ListPrices"],
  });
}
