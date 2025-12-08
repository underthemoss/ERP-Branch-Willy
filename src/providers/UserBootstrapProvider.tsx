"use client";

import { graphql } from "@/graphql";
import { useSyncCurrentUserMutation } from "@/graphql/hooks";
import { useAuth0ErpUser } from "@/hooks/useAuth0ErpUser";
import { useEffect, useRef } from "react";

graphql(`
  mutation SyncCurrentUser {
    syncCurrentUser {
      id
      email
    }
  }
`);

interface UserBootstrapProviderProps {
  children: React.ReactNode;
}

/**
 * UserBootstrapProvider ensures the authenticated user is synced with the backend.
 * This calls the syncCurrentUser mutation on mount to create/update the user record
 * in the database, replicating the Auth0 post-login webhook logic.
 *
 * Must be placed within Auth0ClientProvider and ApolloClientProvider.
 */
export function UserBootstrapProvider({ children }: UserBootstrapProviderProps) {
  const hasCalledSync = useRef(false);
  const [syncCurrentUser] = useSyncCurrentUserMutation();
  const { user } = useAuth0ErpUser();

  useEffect(() => {
    if (hasCalledSync.current || !user) {
      return;
    }

    hasCalledSync.current = true;
    syncCurrentUser().catch((error) => {
      console.error("Failed to sync current user:", error);
    });
  }, [syncCurrentUser, user]);

  return children;
}
