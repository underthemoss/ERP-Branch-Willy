"use client";

/**
 * /app page - workspace selection landing
 *
 * This page renders when the user navigates to /app without a workspace ID.
 * The WorkspaceContextResolver in the layout will show the workspace selection screen.
 * Once a workspace is selected, the user is redirected to /app/[workspace_id].
 */
export default function AppPage() {
  // The WorkspaceContextResolver in layout.tsx handles showing
  // the workspace selection screen when no workspace is selected
  return null;
}
