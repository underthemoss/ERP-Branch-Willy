import { graphql } from "@/graphql";

// Re-exporting types
export {
  type FulfilmentBaseFieldsFragment as FulfilmentBase,
  type BusinessContactFieldsFragment as BusinessContact,
  type RentalFulfilmentFieldsFragment as RentalFulfilment,
  type SaleFulfilmentFieldsFragment as SaleFulfilment,
  type ServiceFulfilmentFieldsFragment as ServiceFulfilment,
  type RentalFulfilmentPriceFieldsFragment as RentalFulfilmentPrice,
  type SaleFulfilmentPriceFieldsFragment as SaleFulfilmentPrice,
  type InventoryAssignment_RentalFulFulfilmentFieldsFragment as InventoryAssignment_RentalFulFulfilment,
  FulfilmentType,
} from "@/graphql/graphql";

// Re-exporting other hooks, that do not need any modifications
export {
  useGetFulfilmentByIdQuery,
  useSetRentalEndDateMutation,
  useSetRentalStartDateMutation,
  useSetExpectedRentalEndDateMutation,
  useListChargesForFulfilmentQuery,
  useListRentalFulfilmentsQuery,
  useAssignInventoryToRentalFulfilmentMutation,
  useUnassignInventoryFromRentalFulfilmentMutation,
  useCreatePurchaseOrderForFulfilmentMutation,
  useCreateRentalPurchaseOrderLineItemForFulfilmentMutation,
  useGeneratePurchaseOrderReferenceNumberMutation,
  useSetFulfilmentPurchaseOrderLineItemIdMutationMutation,
  useSubmitPurchaseOrderForFulfilmentMutation,
} from "@/graphql/hooks";

export const RentalFulfilmentPriceFields = graphql(`
  fragment RentalFulfilmentPriceFields on RentalPrice {
    id
    name
    pimProduct {
      id
      name
    }
    pimCategory {
      id
      name
      path
    }
    priceType
    priceBook {
      id
      name
    }
    pricePerDayInCents
    pricePerWeekInCents
    pricePerMonthInCents
    createdAt
    updatedAt
  }
`);

export const SaleFulfilmentPriceFields = graphql(`
  fragment SaleFulfilmentPriceFields on SalePrice {
    id
    name
    pimProduct {
      id
      name
    }
    pimCategory {
      id
      name
      path
    }
    priceType
    priceBook {
      id
      name
    }
    createdAt
    updatedAt
    unitCostInCents
    discounts
  }
`);

export const FulfilmentBaseFields = graphql(`
  fragment FulfilmentBaseFields on FulfilmentBase {
    id
    contact {
      ... on BusinessContact {
        id
        name
      }
      ... on PersonContact {
        id
        name
      }
    }
    project {
      id
      name
      project_code
      status
    }
    purchaseOrderNumber
    salesOrderId
    salesOrderPONumber
    salesOrderType
    workflowId
    workflowColumnId
    assignedTo {
      id
      firstName
      lastName
      email
    }
    createdAt
    updatedAt
    salesOrderLineItem {
      __typename
      ... on RentalSalesOrderLineItem {
        id
        lineitem_type
        created_by_user {
          id
          firstName
          lastName
        }
        updated_by_user {
          id
          firstName
          lastName
        }
        price {
          __typename
          ... on RentalPrice {
            ...RentalFulfilmentPriceFields
          }
          ... on SalePrice {
            ...SaleFulfilmentPriceFields
          }
        }
      }
      ... on SaleSalesOrderLineItem {
        id
        lineitem_type
        created_by_user {
          id
          firstName
          lastName
        }
        updated_by_user {
          id
          firstName
          lastName
        }
        price {
          __typename
          ... on RentalPrice {
            ...RentalFulfilmentPriceFields
          }
          ... on SalePrice {
            ...SaleFulfilmentPriceFields
          }
        }
      }
    }
  }
`);

export const RentalFulfilmentFields = graphql(`
  fragment RentalFulfilmentFields on RentalFulfilment {
    ...FulfilmentBaseFields
    id
    rentalStartDate
    rentalEndDate
    expectedRentalEndDate
    inventory {
      id
    }
  }
`);

export const SaleFulfilmentFields = graphql(`
  fragment SaleFulfilmentFields on SaleFulfilment {
    ...FulfilmentBaseFields
    salePrice
    quantity
  }
`);

export const ServiceFulfilmentFields = graphql(`
  fragment ServiceFulfilmentFields on ServiceFulfilment {
    ...FulfilmentBaseFields
    serviceDate
  }
`);

export const InventoryAssignment_RentalFulFulfilmentFields = graphql(`
  fragment InventoryAssignment_RentalFulFulfilmentFields on RentalFulfilment {
    id
    contactId
    contact {
      __typename
      ... on BusinessContact {
        id
        name
      }
      ... on PersonContact {
        id
        name
      }
    }
    project {
      id
      name
      project_code
    }
    purchaseOrderNumber
    purchaseOrderLineItemId
    purchaseOrderLineItem {
      __typename
      ... on RentalPurchaseOrderLineItem {
        id
        purchase_order_id
        purchaseOrder {
          id
          purchase_order_number
          status
        }
      }
      ... on SalePurchaseOrderLineItem {
        id
        purchase_order_id
        purchaseOrder {
          id
          purchase_order_number
          status
        }
      }
    }
    salesOrderId
    salesOrder {
      id
      sales_order_number
      purchase_order_number
      status
      buyer {
        __typename
        ... on BusinessContact {
          id
          name
        }
        ... on PersonContact {
          id
          name
        }
      }
    }
    salesOrderPONumber
    inventory {
      id
    }
    rentalStartDate
    expectedRentalEndDate
    rentalEndDate
    pimCategoryId
    pimCategoryName
    pimCategoryPath
    priceName
    inventoryId
  }
`);

export const GetFulfilmentById = graphql(`
  query GetFulfilmentById($id: ID!) {
    getFulfilmentById(id: $id) {
      __typename
      ... on FulfilmentBase {
        ...FulfilmentBaseFields
      }
      ... on RentalFulfilment {
        ...RentalFulfilmentFields
      }
      ... on SaleFulfilment {
        ...SaleFulfilmentFields
      }
      ... on ServiceFulfilment {
        ...ServiceFulfilmentFields
      }
    }
  }
`);

export const SetRentalStartDate = graphql(`
  mutation SetRentalStartDate($fulfilmentId: ID!, $rentalStartDate: DateTime!) {
    setRentalStartDate(fulfilmentId: $fulfilmentId, rentalStartDate: $rentalStartDate) {
      ...RentalFulfilmentFields
    }
  }
`);

export const SetRentalEndDate = graphql(`
  mutation SetRentalEndDate($fulfilmentId: ID!, $rentalEndDate: DateTime!) {
    setRentalEndDate(fulfilmentId: $fulfilmentId, rentalEndDate: $rentalEndDate) {
      ...RentalFulfilmentFields
    }
  }
`);

export const SetExpectedRentalEndDate = graphql(`
  mutation SetExpectedRentalEndDate($fulfilmentId: ID!, $expectedRentalEndDate: DateTime!) {
    setExpectedRentalEndDate(
      fulfilmentId: $fulfilmentId
      expectedRentalEndDate: $expectedRentalEndDate
    ) {
      ...RentalFulfilmentFields
    }
  }
`);

export const ListChargesForFulfilment = graphql(`
  query ListChargesForFulfilment($fulfilmentId: ID!, $workspaceId: ID!) {
    listCharges(filter: { fulfilmentId: $fulfilmentId, workspaceId: $workspaceId }) {
      items {
        id
        amountInCents
        description
        chargeType
        createdAt
        invoiceId
        billingPeriodStart
        billingPeriodEnd
      }
    }
  }
`);

export const AssignInventoryToRentalFulfilment = graphql(`
  mutation AssignInventoryToRentalFulfilment(
    $fulfilmentId: ID!
    $inventoryId: ID!
    $allowOverlappingReservations: Boolean
  ) {
    assignInventoryToRentalFulfilment(
      fulfilmentId: $fulfilmentId
      inventoryId: $inventoryId
      allowOverlappingReservations: $allowOverlappingReservations
    ) {
      ...InventoryAssignment_RentalFulFulfilmentFields
    }
  }
`);

export const UnassignInventoryFromRentalFulfilment = graphql(`
  mutation UnassignInventoryFromRentalFulfilment($fulfilmentId: ID!) {
    unassignInventoryFromRentalFulfilment(fulfilmentId: $fulfilmentId) {
      ...InventoryAssignment_RentalFulFulfilmentFields
    }
  }
`);

export const ListRentalFulfilments = graphql(`
  query ListRentalFulfilments($filter: ListRentalFulfilmentsFilter!, $page: ListFulfilmentsPage) {
    listRentalFulfilments(filter: $filter, page: $page) {
      items {
        ...InventoryAssignment_RentalFulFulfilmentFields
      }
    }
  }
`);

// Purchase Order Mutations for CreatePurchaseOrderDialog
export const CreatePurchaseOrderForFulfilment = graphql(`
  mutation CreatePurchaseOrderForFulfilment($input: PurchaseOrderInput) {
    createPurchaseOrder(input: $input) {
      id
      purchase_order_number
      status
    }
  }
`);

export const CreateRentalPurchaseOrderLineItemForFulfilment = graphql(`
  mutation CreateRentalPurchaseOrderLineItemForFulfilment(
    $input: CreateRentalPurchaseOrderLineItemInput
  ) {
    createRentalPurchaseOrderLineItem(input: $input) {
      id
      purchase_order_id
      lineitem_status
    }
  }
`);

export const SetFulfilmentPurchaseOrderLineItemIdMutation = graphql(`
  mutation SetFulfilmentPurchaseOrderLineItemIdMutation(
    $fulfilmentId: ID!
    $purchaseOrderLineItemId: ID
  ) {
    setFulfilmentPurchaseOrderLineItemId(
      fulfilmentId: $fulfilmentId
      purchaseOrderLineItemId: $purchaseOrderLineItemId
    ) {
      id
      purchaseOrderLineItemId
    }
  }
`);

export const SubmitPurchaseOrderForFulfilment = graphql(`
  mutation SubmitPurchaseOrderForFulfilment($id: ID!) {
    submitPurchaseOrder(id: $id) {
      id
      status
    }
  }
`);

export const GeneratePurchaseOrderReferenceNumber = graphql(`
  mutation GeneratePurchaseOrderReferenceNumber($input: GenerateReferenceNumberInput!) {
    generateReferenceNumber(input: $input) {
      referenceNumber
    }
  }
`);
