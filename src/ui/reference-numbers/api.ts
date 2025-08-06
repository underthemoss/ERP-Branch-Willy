import { graphql } from "@/graphql";

// GraphQL queries for reference number templates

graphql(`
  query listReferenceNumberTemplates(
    $filter: ReferenceNumberTemplateFilterInput
    $page: PageInfoInput
  ) {
    listReferenceNumberTemplates(filter: $filter, page: $page) {
      id
      type
      template
      seqPadding
      startAt
      resetFrequency
      useGlobalSequence
      projectId
      businessContactId
      deleted
      createdAt
      updatedAt
      createdBy
      updatedBy
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
    }
  }
`);

graphql(`
  mutation createReferenceNumberTemplate($input: CreateReferenceNumberTemplateInput!) {
    createReferenceNumberTemplate(input: $input) {
      id
      type
      template
      seqPadding
      startAt
      resetFrequency
      useGlobalSequence
      projectId
      businessContactId
      deleted
      createdAt
      updatedAt
    }
  }
`);

graphql(`
  mutation updateReferenceNumberTemplate($input: UpdateReferenceNumberTemplateInput!) {
    updateReferenceNumberTemplate(input: $input) {
      id
      type
      template
      seqPadding
      startAt
      resetFrequency
      useGlobalSequence
      projectId
      businessContactId
      deleted
      createdAt
      updatedAt
    }
  }
`);

graphql(`
  mutation deleteReferenceNumberTemplate($id: String!) {
    deleteReferenceNumberTemplate(id: $id)
  }
`);

graphql(`
  mutation ResetSequenceNumber($templateId: String!, $newValue: Int) {
    resetSequenceNumber(templateId: $templateId, newValue: $newValue)
  }
`);

graphql(`
  query GetDefaultTemplates {
    getDefaultTemplates {
      id
      type
      template
      seqPadding
      startAt
      resetFrequency
      useGlobalSequence
      businessContactId
      projectId
      companyId
      createdAt
      updatedAt
      deleted
      createdBy
      updatedBy
      createdByUser {
        id
        firstName
        lastName
        email
      }
      updatedByUser {
        id
        firstName
        lastName
        email
      }
    }
  }
`);
