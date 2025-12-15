import { graphql } from "@/graphql";
import {
  useCreateIntakeFormMutation as _useCreateIntakeFormMutation,
  useCreateIntakeFormSubmissionLineItemMutation as _useCreateIntakeFormSubmissionLineItemMutation,
  useDeleteIntakeFormMutation as _useDeleteIntakeFormMutation,
  useDeleteIntakeFormSubmissionLineItemMutation as _useDeleteIntakeFormSubmissionLineItemMutation,
  useUpdateIntakeFormMutation as _useUpdateIntakeFormMutation,
  useUpdateIntakeFormSubmissionLineItemMutation as _useUpdateIntakeFormSubmissionLineItemMutation,
} from "@/graphql/hooks";

// Type re-exports for clean imports
export type {
  IntakeFormFieldsFragment as IntakeForm,
  IntakeFormSubmissionFieldsFragment as IntakeFormSubmission,
  IntakeFormSubmissionLineItemFieldsFragment as IntakeFormLineItem,
  ListIntakeFormSubmissionLineItemsQuery,
} from "@/graphql/graphql";

// Re-export query hooks that don't need modifications
export {
  useGetIntakeFormByIdQuery,
  useListIntakeFormsQuery,
  useGetIntakeFormSubmissionByIdQuery,
  useListIntakeFormSubmissionsQuery,
  useListIntakeFormSubmissionsByFormIdQuery,
  useListIntakeFormSubmissionsAsBuyerQuery,
  useListIntakeFormSubmissionLineItemsQuery,
  useCreateIntakeFormSubmissionMutation,
  useUpdateIntakeFormSubmissionMutation,
  useSubmitIntakeFormSubmissionMutation,
  useCreateQuoteFromIntakeFormSubmissionMutation,
} from "@/graphql/hooks";

// ============================================================================
// FRAGMENTS
// ============================================================================

export const IntakeFormFieldsFragment = graphql(`
  fragment IntakeFormFields on IntakeForm {
    id
    workspaceId
    projectId
    project {
      id
      name
      projectCode
    }
    isActive
    createdAt
    updatedAt
    pricebook {
      id
      name
      parentPriceBook {
        id
        name
        businessContact {
          id
        }
      }
    }
    pricebookId
    workspace {
      id
      name
      logoUrl
      bannerImageUrl
    }
    isPublic
    sharedWithUsers {
      id
      email
    }
  }
`);

export const IntakeFormSubmissionFieldsFragment = graphql(`
  fragment IntakeFormSubmissionFields on IntakeFormSubmission {
    id
    formId
    workspaceId
    name
    email
    createdAt
    phone
    companyName
    purchaseOrderNumber
    status
    submittedAt
    userId
    purchaseOrderId
    totalInCents
    buyerWorkspaceId
    buyerWorkspace {
      id
      name
      logoUrl
    }
    form {
      id
      workspaceId
      projectId
      project {
        id
        name
      }
      workspace {
        id
        name
        logoUrl
      }
    }
    salesOrder {
      id
      status
    }
    quote {
      id
      status
    }
  }
`);

export const IntakeFormSubmissionLineItemFieldsFragment = graphql(`
  fragment IntakeFormSubmissionLineItemFields on IntakeFormLineItem {
    id
    description
    startDate
    type
    durationInDays
    quantity
    pimCategoryId
    pimCategory {
      id
      name
    }
    priceId
    price {
      __typename
      ... on RentalPrice {
        id
        name
      }
      ... on SalePrice {
        id
        name
      }
    }
    customPriceName
    deliveryLocation
    deliveryMethod
    deliveryNotes
    rentalStartDate
    rentalEndDate
    salesOrderId
    salesOrderLineItem {
      __typename
      ... on RentalSalesOrderLineItem {
        id
      }
      ... on SaleSalesOrderLineItem {
        id
      }
    }
    subtotalInCents
    priceForecast {
      accumulative_cost_in_cents
      days {
        day
        cost_in_cents
        accumulative_cost_in_cents
        rental_period {
          days1
          days7
          days28
        }
        strategy
        savings_compared_to_day_rate_in_cents
        savings_compared_to_day_rate_in_fraction
        savings_compared_to_exact_split_in_cents
        details {
          plainText
          rates {
            pricePer1DayInCents
            pricePer7DaysInCents
            pricePer28DaysInCents
          }
          exactSplitDistribution {
            days1
            days7
            days28
          }
          optimalSplit {
            days1
            days7
            days28
          }
        }
      }
    }
    inventoryReservations {
      ... on FulfilmentReservation {
        id
        inventoryId
        startDate
        endDate
        inventory {
          id
          pimCategoryName
          assetId
          asset {
            id
            name
          }
        }
      }
    }
  }
`);

// ============================================================================
// QUERIES
// ============================================================================

graphql(`
  query GetIntakeFormById($id: String!) {
    getIntakeFormById(id: $id) {
      ...IntakeFormFields
    }
  }
`);

graphql(`
  query ListIntakeForms($workspaceId: String!) {
    listIntakeForms(workspaceId: $workspaceId) {
      items {
        ...IntakeFormFields
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
  query GetIntakeFormSubmissionById($id: String!) {
    getIntakeFormSubmissionById(id: $id) {
      ...IntakeFormSubmissionFields
    }
  }
`);

graphql(`
  query ListIntakeFormSubmissions($workspaceId: String!, $excludeWithSalesOrder: Boolean) {
    listIntakeFormSubmissions(
      workspaceId: $workspaceId
      excludeWithSalesOrder: $excludeWithSalesOrder
    ) {
      items {
        ...IntakeFormSubmissionFields
        lineItems {
          ...IntakeFormSubmissionLineItemFields
        }
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
  query ListIntakeFormSubmissionsByFormId($workspaceId: String!, $intakeFormId: String!) {
    listIntakeFormSubmissions(workspaceId: $workspaceId, intakeFormId: $intakeFormId) {
      items {
        ...IntakeFormSubmissionFields
        lineItems {
          ...IntakeFormSubmissionLineItemFields
        }
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
  query ListIntakeFormSubmissionsAsBuyer(
    $buyerWorkspaceId: String!
    $intakeFormId: String
    $page: Int
    $limit: Int
  ) {
    listIntakeFormSubmissionsAsBuyer(
      buyerWorkspaceId: $buyerWorkspaceId
      intakeFormId: $intakeFormId
      page: $page
      limit: $limit
    ) {
      items {
        ...IntakeFormSubmissionFields
        lineItems {
          ...IntakeFormSubmissionLineItemFields
        }
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
  query ListIntakeFormSubmissionLineItems($submissionId: String!) {
    listIntakeFormSubmissionLineItems(submissionId: $submissionId) {
      ...IntakeFormSubmissionLineItemFields
    }
  }
`);

// ============================================================================
// MUTATIONS
// ============================================================================

graphql(`
  mutation CreateIntakeForm($input: IntakeFormInput!) {
    createIntakeForm(input: $input) {
      ...IntakeFormFields
    }
  }
`);

graphql(`
  mutation UpdateIntakeForm($id: String!, $input: UpdateIntakeFormInput!) {
    updateIntakeForm(id: $id, input: $input) {
      ...IntakeFormFields
    }
  }
`);

graphql(`
  mutation DeleteIntakeForm($id: String!) {
    deleteIntakeForm(id: $id) {
      id
    }
  }
`);

graphql(`
  mutation CreateIntakeFormSubmission($input: IntakeFormSubmissionInput!) {
    createIntakeFormSubmission(input: $input) {
      ...IntakeFormSubmissionFields
    }
  }
`);

graphql(`
  mutation UpdateIntakeFormSubmission($id: String!, $input: UpdateIntakeFormSubmissionInput!) {
    updateIntakeFormSubmission(id: $id, input: $input) {
      ...IntakeFormSubmissionFields
    }
  }
`);

graphql(`
  mutation SubmitIntakeFormSubmission($id: String!) {
    submitIntakeFormSubmission(id: $id) {
      ...IntakeFormSubmissionFields
    }
  }
`);

graphql(`
  mutation CreateIntakeFormSubmissionLineItem(
    $submissionId: String!
    $input: IntakeFormLineItemInput!
  ) {
    createIntakeFormSubmissionLineItem(submissionId: $submissionId, input: $input) {
      ...IntakeFormSubmissionLineItemFields
    }
  }
`);

graphql(`
  mutation UpdateIntakeFormSubmissionLineItem($id: String!, $input: IntakeFormLineItemInput!) {
    updateIntakeFormSubmissionLineItem(id: $id, input: $input) {
      ...IntakeFormSubmissionLineItemFields
    }
  }
`);

graphql(`
  mutation DeleteIntakeFormSubmissionLineItem($id: String!) {
    deleteIntakeFormSubmissionLineItem(id: $id)
  }
`);

graphql(`
  mutation CreateQuoteFromIntakeFormSubmission($input: CreateQuoteFromIntakeFormSubmissionInput!) {
    createQuoteFromIntakeFormSubmission(input: $input) {
      id
      status
      sellerWorkspaceId
      sellersBuyerContactId
      sellersProjectId
      intakeFormSubmissionId
      validUntil
      currentRevision {
        id
        revisionNumber
        hasUnpricedLineItems
        lineItems {
          ... on QuoteRevisionRentalLineItem {
            id
            type
            description
            sellersPriceId
            intakeFormSubmissionLineItemId
          }
          ... on QuoteRevisionSaleLineItem {
            id
            type
            description
            sellersPriceId
            intakeFormSubmissionLineItemId
          }
        }
      }
    }
  }
`);

// ============================================================================
// CUSTOM HOOKS WITH CACHE MANAGEMENT
// ============================================================================

/**
 * Custom hook for creating intake forms with automatic cache refresh
 */
export function useCreateIntakeFormMutation(
  options?: Parameters<typeof _useCreateIntakeFormMutation>[0],
) {
  return _useCreateIntakeFormMutation({
    ...options,
    refetchQueries: ["ListIntakeForms"],
  });
}

/**
 * Custom hook for updating intake forms with automatic cache refresh
 */
export function useUpdateIntakeFormMutation(
  options?: Parameters<typeof _useUpdateIntakeFormMutation>[0],
) {
  return _useUpdateIntakeFormMutation({
    ...options,
    refetchQueries: ["ListIntakeForms"],
  });
}

/**
 * Custom hook for deleting intake forms with automatic cache refresh
 */
export function useDeleteIntakeFormMutation(
  options?: Parameters<typeof _useDeleteIntakeFormMutation>[0],
) {
  return _useDeleteIntakeFormMutation({
    ...options,
    refetchQueries: ["ListIntakeForms"],
  });
}

/**
 * Custom hook for creating line items with automatic cache refresh
 */
export function useCreateIntakeFormSubmissionLineItemMutation(
  options?: Parameters<typeof _useCreateIntakeFormSubmissionLineItemMutation>[0],
) {
  return _useCreateIntakeFormSubmissionLineItemMutation({
    ...options,
    refetchQueries: ["ListIntakeFormSubmissionLineItems"],
  });
}

/**
 * Custom hook for updating line items with automatic cache refresh
 */
export function useUpdateIntakeFormSubmissionLineItemMutation(
  options?: Parameters<typeof _useUpdateIntakeFormSubmissionLineItemMutation>[0],
) {
  return _useUpdateIntakeFormSubmissionLineItemMutation({
    ...options,
    refetchQueries: ["ListIntakeFormSubmissionLineItems"],
  });
}

/**
 * Custom hook for deleting line items with automatic cache refresh
 */
export function useDeleteIntakeFormSubmissionLineItemMutation(
  options?: Parameters<typeof _useDeleteIntakeFormSubmissionLineItemMutation>[0],
) {
  return _useDeleteIntakeFormSubmissionLineItemMutation({
    ...options,
    refetchQueries: ["ListIntakeFormSubmissionLineItems"],
  });
}
