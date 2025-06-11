import { graphql } from "@/graphql";
import {
  useCreateNoteMutation as _useCreateNoteMutation,
  useCurrentUserQuery,
  useDeleteNoteMutation,
  useListNotesByEntityIdQuery,
  useUpdateNoteMutation,
} from "@/graphql/hooks";

// Re-exporting types
export type { Note } from "@/graphql/graphql";

// Re-exporting hooks
export {
  useListNotesByEntityIdQuery,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
  useCurrentUserQuery,
};

// GraphQL fragments
export const NoteFieldsFragment = graphql(`
  fragment NoteFields on Note {
    _id
    company_id
    created_at
    created_by
    created_by_user {
      id
      firstName
      lastName
      email
    }
    deleted
    parent_entity_id
    sub_notes {
      _id
    }
    updated_at
    updated_by
    value
  }
`);

// GraphQL queries
graphql(`
  query ListNotesByEntityId($parent_entity_id: String!) {
    listNotesByEntityId(parent_entity_id: $parent_entity_id) {
      ...NoteFields
    }
  }
`);

graphql(`
  query CurrentUser {
    currentUser {
      es_user_id
      es_user_name
    }
  }
`);

// GraphQL mutations
graphql(`
  mutation CreateNote($input: NoteInput!) {
    createNote(input: $input) {
      ...NoteFields
    }
  }
`);

graphql(`
  mutation UpdateNote($id: String!, $value: JSON!) {
    updateNote(id: $id, value: $value) {
      ...NoteFields
    }
  }
`);

graphql(`
  mutation DeleteNote($id: String!) {
    deleteNote(id: $id) {
      ...NoteFields
    }
  }
`);

// Custom hook with optimistic updates for creating notes
export function useCreateNoteMutation(options?: Parameters<typeof _useCreateNoteMutation>[0]) {
  return _useCreateNoteMutation({
    ...options,
    update(cache, result, opts) {
      const newNote = result.data?.createNote;
      if (newNote) {
        // Update the cache for listNotesByEntityId query
        cache.modify({
          fields: {
            listNotesByEntityId(existing = [], { readField, toReference }) {
              // Check if this is for the same parent_entity_id
              const newNoteRef = cache.writeFragment({
                data: newNote,
                fragment: NoteFieldsFragment,
              });

              // Add the new note to the beginning of the list
              return [newNoteRef, ...existing];
            },
          },
        });
      }

      // Call user-provided update if passed
      options?.update?.(cache, result, opts);
    },
  });
}
