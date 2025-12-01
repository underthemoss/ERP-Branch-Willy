import { graphql } from "@/graphql";

// Re-exporting types
export { useListProjectsQuery } from "@/graphql/hooks";

graphql(`
  query ListProjects($workspaceId: String!) {
    listProjects(workspaceId: $workspaceId) {
      id
      name
      project_code
      description
      workspaceId
      created_at
      created_by
      created_by_user {
        firstName
        lastName
      }
      updated_at
      updated_by_user {
        firstName
        lastName
      }
      deleted
      scope_of_work
      status
    }
  }
`);
