import { graphql } from "@/graphql";

// List available relations from SpiceDB schema
export const LIST_AVAILABLE_RELATIONS_QUERY = graphql(`
  query ListAvailableRelations($resourceType: String) {
    admin {
      listAvailableRelations(resourceType: $resourceType) {
        relation
        description
        allowedResourceTypes
        allowedSubjectTypes
        isComputed
      }
    }
  }
`);

// List relationships with optional filters
export const LIST_RELATIONSHIPS_QUERY = graphql(`
  query ListRelationships(
    $cursor: String
    $limit: Int
    $resourceType: String
    $resourceId: String
    $relation: String
    $subjectType: String
    $subjectId: String
  ) {
    admin {
      listRelationships(
        cursor: $cursor
        limit: $limit
        resourceType: $resourceType
        resourceId: $resourceId
        relation: $relation
        subjectType: $subjectType
        subjectId: $subjectId
      ) {
        cursor
        relationships {
          resource {
            type
            id
          }
          relation
          subject {
            type
            id
            relation
          }
        }
      }
    }
  }
`);

// List all resource types
export const LIST_RESOURCE_TYPES_QUERY = graphql(`
  query ListResourceTypes {
    admin {
      listResourceTypes
    }
  }
`);

// Delete a specific relationship
export const DELETE_RELATIONSHIP_MUTATION = graphql(`
  mutation DeleteRelationship(
    $resourceType: String!
    $resourceId: String!
    $relation: String!
    $subjectType: String!
    $subjectId: String!
  ) {
    admin {
      deleteRelationship(
        resourceType: $resourceType
        resourceId: $resourceId
        relation: $relation
        subjectType: $subjectType
        subjectId: $subjectId
      ) {
        success
        message
      }
    }
  }
`);

// Get raw Zed schema from SpiceDB
export const GET_RAW_ZED_SCHEMA_QUERY = graphql(`
  query GetRawZedSchema {
    admin {
      rawZedSchema
    }
  }
`);
