import { graphql } from "@/graphql";
import { useCreatePersonContactMutation as _useCreatePersonContactMutation } from "@/graphql/hooks";

// Re-exporting types
export type {
  PersonContactFieldsFragment as PersonContact,
  BusinessContactFieldsFragment as BusinessContact,
} from "@/graphql/graphql";

// Re-exporting other hooks, that do not need any modifications
export {
  useListPersonContactsQuery,
  useCreateBusinessContactMutation,
  useListBusinessContactsQuery,
  useListContactsQuery,
  useGetContactByIdQuery,
  useUpdateBusinessContactMutation,
  useUpdatePersonContactMutation,
  useDeleteContactMutation,
} from "@/graphql/hooks";

export const PersonContactFieldsFragment = graphql(`
  fragment PersonContactFields on PersonContact {
    __typename
    id
    contactType
    notes
    profilePicture
    name
    phone
    email
    role
    businessId
  }
`);

export const BusinessContactFieldsFragment = graphql(`
  fragment BusinessContactFields on BusinessContact {
    __typename
    id
    contactType
    notes
    profilePicture
    name
    phone
    address
    taxId
    website
  }
`);

graphql(`
  query GetContactById($id: ID!) {
    getContactById(id: $id) {
      __typename
      ... on BusinessContact {
        ...BusinessContactFields
      }
      ... on PersonContact {
        ...PersonContactFields
      }
    }
  }
`);

graphql(`
  query ListContacts($workspaceId: String!, $page: ListContactsPage!, $contactType: ContactType) {
    listContacts(filter: { workspaceId: $workspaceId, contactType: $contactType }, page: $page) {
      items {
        ... on PersonContact {
          ...PersonContactFields
        }
        ... on BusinessContact {
          ...BusinessContactFields
        }
      }
    }
  }
`);

graphql(`
  mutation UpdateBusinessContact($id: ID!, $input: UpdateBusinessContactInput!) {
    updateBusinessContact(id: $id, input: $input) {
      ...BusinessContactFields
    }
  }
`);

graphql(`
  mutation UpdatePersonContact($id: ID!, $input: UpdatePersonContactInput!) {
    updatePersonContact(id: $id, input: $input) {
      ...PersonContactFields
    }
  }
`);

graphql(`
  mutation DeleteContact($id: ID!) {
    deleteContactById(id: $id)
  }
`);

graphql(`
  query ListPersonContacts($workspaceId: String!, $page: ListContactsPage!) {
    listContacts(filter: { workspaceId: $workspaceId, contactType: PERSON }, page: $page) {
      items {
        ... on PersonContact {
          ...PersonContactFields
        }
      }
    }
  }
`);

graphql(`
  mutation CreateBusinessContact(
    $workspaceId: String!
    $name: String!
    $phone: String
    $address: String
    $taxId: String!
    $website: String
  ) {
    createBusinessContact(
      input: {
        workspaceId: $workspaceId
        name: $name
        phone: $phone
        address: $address
        taxId: $taxId
        website: $website
      }
    ) {
      id
    }
  }
`);

graphql(`
  mutation CreatePersonContact(
    $workspaceId: String!
    $name: String!
    $phone: String
    $email: String!
    $role: String!
    $businessId: ID!
  ) {
    createPersonContact(
      input: {
        workspaceId: $workspaceId
        name: $name
        phone: $phone
        email: $email
        role: $role
        businessId: $businessId
      }
    ) {
      ...PersonContactFields
    }
  }
`);

graphql(`
  query ListBusinessContacts($workspaceId: String!, $page: ListContactsPage!) {
    listContacts(filter: { workspaceId: $workspaceId, contactType: BUSINESS }, page: $page) {
      items {
        ... on BusinessContact {
          id
          name
          profilePicture
        }
      }
    }
  }
`);

export function useCreatePersonContactMutation(
  options?: Parameters<typeof _useCreatePersonContactMutation>[0],
) {
  return _useCreatePersonContactMutation({
    ...options,
    update(cache, result, opts) {
      const newContact = result.data?.createPersonContact;
      if (newContact) {
        cache.modify({
          fields: {
            listContacts(existing = { items: [] }, { readField }) {
              const newContactRef = cache.writeFragment({
                data: newContact,
                fragment: PersonContactFieldsFragment,
              });

              const alreadyExists = existing.items.some(
                (item: any) => readField("id", item) === newContact.id,
              );
              if (alreadyExists) return existing;

              return {
                ...existing,
                items: [newContactRef, ...existing.items],
              };
            },
          },
        });
      }

      // Call user-provided update if passed
      options?.update?.(cache, result, opts);
    },
  });
}
