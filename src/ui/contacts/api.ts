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
  useSearchBrandsQuery,
  useGetBrandByIdQuery,
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
    resourceMapIds
    updatedAt
    resource_map_entries {
      id
      value
      parent_id
      path
      hierarchy_name
    }
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
    latitude
    longitude
    placeId
    taxId
    website
    brandId
    resourceMapIds
    brand {
      id
      name
      domain
      logos {
        type
        theme
        formats {
          src
          format
          width
          height
        }
      }
      images {
        type
        formats {
          src
          format
          width
          height
        }
      }
    }
    resource_map_entries {
      id
      value
      parent_id
      path
      hierarchy_name
    }
    updatedAt
  }
`);

// TODO: Re-export when backend supports listResourceMapEntriesByTagType query
// export { useListResourceMapEntriesByTagTypeQuery } from "@/graphql/hooks";

graphql(`
  query GetContactById($id: ID!) {
    getContactById(id: $id) {
      __typename
      ... on BusinessContact {
        __typename
        id
        contactType
        notes
        profilePicture
        name
        phone
        address
        latitude
        longitude
        placeId
        taxId
        website
        brandId
        resourceMapIds
        updatedAt
        brand {
          id
          name
          domain
          logos {
            type
            theme
            formats {
              src
              format
              width
              height
            }
          }
          images {
            type
            formats {
              src
              format
              width
              height
            }
          }
        }
        resource_map_entries {
          id
          value
          parent_id
          path
          hierarchy_name
        }
      }
      ... on PersonContact {
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
        resourceMapIds
        updatedAt
        resource_map_entries {
          id
          value
          parent_id
          path
          hierarchy_name
        }
      }
    }
  }
`);

graphql(`
  query ListContacts($workspaceId: String!, $page: ListContactsPage!, $contactType: ContactType) {
    listContacts(filter: { workspaceId: $workspaceId, contactType: $contactType }, page: $page) {
      items {
        ... on PersonContact {
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
          resourceMapIds
          updatedAt
        }
        ... on BusinessContact {
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
          brandId
          resourceMapIds
          updatedAt
          brand {
            id
            name
            domain
            logos {
              type
              theme
              formats {
                src
                format
                width
                height
              }
            }
          }
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
          __typename
          id
          name
          phone
          email
          role
          businessId
          profilePicture
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
    $brandId: ID
    $resourceMapIds: [ID!]
    $latitude: Float
    $longitude: Float
    $placeId: String
  ) {
    createBusinessContact(
      input: {
        workspaceId: $workspaceId
        name: $name
        phone: $phone
        address: $address
        taxId: $taxId
        website: $website
        brandId: $brandId
        resourceMapIds: $resourceMapIds
        latitude: $latitude
        longitude: $longitude
        placeId: $placeId
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
    $businessId: ID!
    $role: String!
    $resourceMapIds: [ID!]
  ) {
    createPersonContact(
      input: {
        workspaceId: $workspaceId
        name: $name
        phone: $phone
        email: $email
        businessId: $businessId
        role: $role
        resourceMapIds: $resourceMapIds
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
          phone
          address
          profilePicture
          brand {
            name
            logos {
              type
              theme
              formats {
                src
              }
            }
          }
        }
      }
    }
  }
`);

graphql(`
  query SearchBrands($query: String!) {
    searchBrands(query: $query) {
      brandId
      name
      domain
      icon
    }
  }
`);

graphql(`
  query GetBrandById($brandId: String!) {
    getBrandById(brandId: $brandId) {
      id
      name
      domain
      description
      logos {
        type
        theme
        formats {
          src
          format
          width
          height
        }
      }
      images {
        type
        formats {
          src
          format
          width
          height
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
