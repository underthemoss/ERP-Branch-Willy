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
        updated_at
        updated_by
        value
      }
      updated_at
      updated_by
      value
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
  query GetNoteById($id: String!) {
    getNoteById(id: $id) {
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
        // Check if this is a reply by looking at the parent_entity_id
        const parentEntityId = newNote.parent_entity_id;

        // Try to find if the parent is a note (reply scenario)
        const parentNoteFragment = cache.readFragment({
          id: cache.identify({ __typename: "Note", _id: parentEntityId }),
          fragment: NoteFieldsFragment,
        });

        if (parentNoteFragment) {
          // This is a reply - update the parent note's sub_notes
          cache.writeFragment({
            id: cache.identify({ __typename: "Note", _id: parentEntityId }),
            fragment: NoteFieldsFragment,
            data: {
              ...parentNoteFragment,
              sub_notes: [...(parentNoteFragment.sub_notes || []), newNote],
            },
          });
        } else {
          // This is a top-level note - update the listNotesByEntityId query
          cache.modify({
            fields: {
              listNotesByEntityId(existing = [], { readField, toReference }) {
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
      }

      // Call user-provided update if passed
      options?.update?.(cache, result, opts);
    },
  });
}
