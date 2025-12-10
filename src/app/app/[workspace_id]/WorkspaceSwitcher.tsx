"use client";

import { graphql } from "@/graphql";
import { useFetchWorkspacesQuery } from "@/graphql/hooks";
import { CustomDialog } from "@/ui/CustomDialog";
import AddIcon from "@mui/icons-material/Add";
import { AccountPopoverFooter, AccountPreview, SignOutButton } from "@toolpad/core/Account";
import { useDialogs } from "@toolpad/core/useDialogs";
import Link from "next/link";
import * as React from "react";

graphql(`
  query fetchWorkspaces {
    listWorkspaces {
      items {
        id
        companyId
        name
      }
    }
  }
`);

export default function WorkspaceSwitcher() {
  const dialogs = useDialogs();
  const { data, loading } = useFetchWorkspacesQuery();
  const workspaces =
    data?.listWorkspaces?.items.map((d) => {
      return {
        id: d.id,
        name: d.name,
        subtext: d.companyId,
        image: "/favicon.ico",
      };
    }) || [];

  return (
    <div className="flex flex-col w-full">
      {/* Account Preview Section */}
      <div className="mb-2">
        <AccountPreview variant="expanded" />
      </div>

      <hr className="border-gray-200" />

      {/* Workspaces Navigation */}
      <nav aria-label="Workspace switcher" className="flex-1 py-3">
        <h2 className="px-4 mb-2 text-sm font-semibold text-gray-700">Workspaces</h2>

        {loading ? (
          <div className="px-4 py-8 text-center" role="status" aria-live="polite">
            <p className="text-sm text-gray-500">Loading workspaces...</p>
          </div>
        ) : workspaces.length === 0 ? (
          <div className="px-4 py-6 text-center" role="status">
            <p className="text-sm text-gray-500 mb-2">No workspaces found</p>
            <p className="text-xs text-gray-400">Create your first workspace to get started</p>
          </div>
        ) : (
          <ul className="space-y-1 px-2" role="list">
            {workspaces.map((workspace) => (
              <li key={workspace.id}>
                <Link
                  href={`/app/${workspace.id}`}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg 
                           transition-all duration-150 ease-in-out
                           hover:bg-gray-100 hover:shadow-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                           active:scale-[0.98]"
                  aria-label={`Switch to workspace ${workspace.name}`}
                >
                  {/* Avatar */}
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 
                               flex items-center justify-center text-white font-semibold text-sm
                               shadow-sm ring-2 ring-white"
                    role="img"
                    aria-label={`${workspace.name} avatar`}
                  >
                    {workspace?.name?.[0]?.toUpperCase() || "W"}
                  </div>

                  {/* Workspace Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{workspace.name}</p>
                    {workspace.subtext && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">{workspace.subtext}</p>
                    )}
                  </div>

                  {/* Visual indicator for current/hover state */}
                  <div
                    className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 opacity-0 
                               group-hover:opacity-100 transition-opacity"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}

        <hr className="border-gray-200 my-3" />

        {/* Add New Workspace Button */}
        <div className="px-2">
          <button
            type="button"
            onClick={() => {
              dialogs.open(CustomDialog);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 
                     text-sm font-medium text-blue-600 rounded-lg
                     transition-all duration-150 ease-in-out
                     hover:bg-blue-50 hover:text-blue-700
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                     active:scale-[0.98]"
            aria-label="Add new workspace"
          >
            <AddIcon className="w-5 h-5" aria-hidden="true" />
            <span>Add New Workspace</span>
          </button>
        </div>
      </nav>

      <hr className="border-gray-200" />

      {/* Account Footer */}
      <div className="mt-2">
        <AccountPopoverFooter>
          <SignOutButton />
        </AccountPopoverFooter>
      </div>
    </div>
  );
}
