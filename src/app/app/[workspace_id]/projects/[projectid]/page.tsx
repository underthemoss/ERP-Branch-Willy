"use client";

import { graphql } from "@/graphql";
import {
  ResourceTypes,
  useDeleteProjectMutation,
  useGetProjectBasicQuery,
  useGetProjectByIdForDisplayQuery,
  useProjectCodeDescriptionsQuery,
} from "@/graphql/hooks";
import { parseDate } from "@/lib/parseDate";
import AttachedFilesSection from "@/ui/AttachedFilesSection";
import NotesSection from "@/ui/notes/NotesSection";
import { ReferenceNumbersSection } from "@/ui/reference-numbers";
import { format } from "date-fns";
import {
  AlertCircle,
  ArrowUp,
  Briefcase,
  CheckCircle,
  Copy,
  Edit,
  FileText,
  FolderOpen,
  HelpCircle,
  Plus,
  Trash2,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

// --- GraphQL queries and mutations for this component ---
graphql(`
  query getProjectByIdForDisplay($id: String!) {
    getProjectById(id: $id) {
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
      parent_project
      sub_projects {
        id
        name
        project_code
        status
        deleted
      }
      project_contacts {
        contact_id
        relation_to_project
        contact {
          ... on PersonContact {
            id
            name
            role
            profilePicture
          }
        }
      }
    }
  }

  # For fetching parent project details
  query getProjectBasic($id: String!) {
    getProjectById(id: $id) {
      id
      name
      project_code
      status
      deleted
    }
  }
`);

graphql(`
  query ProjectCodeDescriptions {
    listProjectStatusCodes {
      code
      description
    }
    listScopeOfWorkCodes {
      code
      description
    }
  }

  mutation deleteProject($id: String!) {
    deleteProject(id: $id) {
      id
    }
  }
`);

export default function ProjectDetailAltPage() {
  const { projectid, workspace_id } = useParams<{ projectid: string; workspace_id: string }>();
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleteProject, { loading: deleting }] = useDeleteProjectMutation();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const { data, loading, error } = useGetProjectByIdForDisplayQuery({
    variables: { id: projectid ?? "" },
    skip: !projectid,
    fetchPolicy: "cache-and-network",
  });

  const { data: codeDescData } = useProjectCodeDescriptionsQuery({
    fetchPolicy: "cache-and-network",
  });

  const scopeOfWorkDescMap = codeDescData?.listScopeOfWorkCodes
    ? Object.fromEntries(
        codeDescData.listScopeOfWorkCodes
          .filter(Boolean)
          .map((item) => [item!.code, item!.description]),
      )
    : {};

  const statusDescMap = codeDescData?.listProjectStatusCodes
    ? Object.fromEntries(
        codeDescData.listProjectStatusCodes
          .filter(Boolean)
          .map((item) => [item!.code, item!.description]),
      )
    : {};

  const project = data?.getProjectById;

  // Fetch parent project if needed
  const parentProjectId = project?.parent_project;
  const { data: parentData } = useGetProjectBasicQuery({
    variables: { id: parentProjectId ?? "" },
    skip: !parentProjectId,
  });

  const handleDelete = async () => {
    if (!project?.id) return;
    try {
      await deleteProject({ variables: { id: project.id } });
      setDeleteDialogOpen(false);
      router.push(`/app/${workspace_id}/projects`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete project.");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-7xl px-4 py-6">
        {/* Go to parent project link */}
        {project?.parent_project && parentData?.getProjectById && (
          <div className="mb-4">
            <Link
              href={`/app/${workspace_id}/projects/${project.parent_project}`}
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold hover:underline"
            >
              <ArrowUp className="w-4 h-4" />
              Go to parent project: {parentData.getProjectById.name}
            </Link>
          </div>
        )}

        {loading && <p className="text-gray-600">Loading project details...</p>}

        {(error || !project) && !loading && <p className="text-red-600">Project not found.</p>}

        {project && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Top Card: Project Overview */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white flex-shrink-0">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border mt-1 ${
                          project.deleted
                            ? "bg-red-100 text-red-700 border-red-200"
                            : "bg-green-100 text-green-700 border-green-200"
                        }`}
                      >
                        {project.deleted ? (
                          <>
                            <Trash2 className="w-3 h-3" />
                            Deleted
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        router.push(`/app/${workspace_id}/projects/${project.id}/edit`)
                      }
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      data-testid="edit-project"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteDialogOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                      data-testid="delete-project"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>

                <div className="h-px bg-gray-200 my-4" />

                <div className="space-y-3">
                  {/* Project Code */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 min-w-[120px]">Project Code:</span>
                    <span className="text-sm font-medium text-gray-900 font-mono">
                      {project.project_code}
                    </span>
                    <button
                      onClick={() => copyToClipboard(project.project_code)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Copy Project Code"
                      data-testid="project-details-copy-code"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 min-w-[120px]">Status:</span>
                    {project.status ? (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200 font-mono"
                        title={statusDescMap[project.status] || ""}
                      >
                        {project.status}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">—</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Details Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h2>
                <div className="h-px bg-gray-200 mb-4" />
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Description:</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {project.description || "—"}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Scope of Work:</h3>
                    {project.scope_of_work && project.scope_of_work.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {project.scope_of_work.filter(Boolean).map((code) => (
                          <span
                            key={code as string}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200 font-mono"
                            title={scopeOfWorkDescMap[code as string] || ""}
                          >
                            {code as string}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">—</p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Project Contacts:</h3>
                    {project.project_contacts && project.project_contacts.length > 0 ? (
                      <div className="space-y-2">
                        {project.project_contacts
                          .filter(
                            (c: any) =>
                              c &&
                              c.contact &&
                              c.contact.__typename === "PersonContact" &&
                              c.contact.id &&
                              c.contact.name,
                          )
                          .map((c: any) => (
                            <div
                              key={c.contact_id}
                              className="flex items-center gap-3 p-2 rounded-lg bg-gray-50"
                            >
                              {c.contact.profilePicture ? (
                                <img
                                  src={c.contact.profilePicture}
                                  alt={c.contact.name}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-bold">
                                  {c.contact.name[0]}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">
                                  {c.contact.name}
                                </p>
                                {c.contact.role && (
                                  <p className="text-xs text-gray-500">{c.contact.role}</p>
                                )}
                              </div>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200 font-mono">
                                {c.relation_to_project.replace(/_/g, " ")}
                              </span>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No contacts assigned.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Reference Numbers Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <ReferenceNumbersSection projectId={project.id} />
              </div>

              {/* Sub Projects Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Sub Projects</h2>
                <div className="h-px bg-gray-200 mb-4" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {project.sub_projects &&
                    project.sub_projects.length > 0 &&
                    project.sub_projects
                      .filter(Boolean)
                      .map(
                        (child) =>
                          child && (
                            <ChildProjectCard
                              key={child.id}
                              project={child}
                              workspaceId={workspace_id}
                            />
                          ),
                      )}
                  <AddSubProjectCard workspaceId={workspace_id} parentId={project.id} />
                </div>
              </div>

              {/* Attached Files Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Attached Files</h2>
                <div className="h-px bg-gray-200 mb-4" />
                <AttachedFilesSection entityId={project.id} entityType={ResourceTypes.ErpProject} />
              </div>

              {/* Notes Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <NotesSection entityId={project.id} workspaceId={workspace_id} />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Metadata Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
                <div className="h-px bg-gray-200 mb-4" />
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Project ID</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-mono text-gray-900 break-all">{project.id}</p>
                      <button
                        onClick={() => copyToClipboard(project.id)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0"
                        title="Copy Project ID"
                        data-testid="project-details-copy-id"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 mb-1">Created By</p>
                    <p className="text-sm font-medium text-gray-900">
                      {project.created_by_user
                        ? `${project.created_by_user.firstName} ${project.created_by_user.lastName}`
                        : "—"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(() => {
                        const date = parseDate(project.created_at);
                        return date ? format(date, "MMM d, yyyy, h:mm a") : "";
                      })()}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 mb-1">Updated By</p>
                    <p className="text-sm font-medium text-gray-900">
                      {project.updated_by_user
                        ? `${project.updated_by_user.firstName} ${project.updated_by_user.lastName}`
                        : "—"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(() => {
                        const date = parseDate(project.updated_at);
                        return date ? format(date, "MMM d, yyyy, h:mm a") : "";
                      })()}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 mb-1">Status</p>
                    <p className="text-sm font-medium text-gray-900">
                      {project.deleted ? "Deleted" : "Active"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <DeleteConfirmationDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={handleDelete}
          deleting={deleting}
          errorMsg={errorMsg}
        />
      </div>
    </div>
  );
}

/** Child Project Card */
function ChildProjectCard({ project, workspaceId }: { project: any; workspaceId: string }) {
  return (
    <Link
      href={`/app/${workspaceId}/projects/${project.id}`}
      className="block group focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
    >
      <div className="relative bg-white border-2 border-blue-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all">
        {/* Left accent bar */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-l-lg" />

        <div className="pl-2">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-sm font-bold text-gray-900 line-clamp-2 flex-1">{project.name}</h3>
            {project.status && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white whitespace-nowrap flex-shrink-0">
                {project.status}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 mb-1">
            <span className="font-semibold">Requested By:</span> —
          </p>
          <p className="text-xs text-gray-600 font-mono">{project.project_code}</p>
        </div>
      </div>
    </Link>
  );
}

/** Add Sub Project Card */
function AddSubProjectCard({ workspaceId, parentId }: { workspaceId: string; parentId: string }) {
  return (
    <Link
      href={`/app/${workspaceId}/projects/create-project?parent_project=${parentId}`}
      className="block group focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
    >
      <div className="relative bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-100 transition-all min-h-[140px] flex flex-col items-center justify-center">
        {/* Left accent bar */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-l-lg" />

        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center mb-2">
            <Plus className="w-6 h-6 text-blue-700" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 mb-1">Add Sub Project</h3>
          <p className="text-xs text-gray-600">Create a new sub project</p>
        </div>
      </div>
    </Link>
  );
}

/** Delete Confirmation Dialog */
function DeleteConfirmationDialog({
  open,
  onClose,
  onConfirm,
  deleting,
  errorMsg,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deleting?: boolean;
  errorMsg?: string | null;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div
        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Delete Project</h2>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete this project? This action cannot be undone.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{errorMsg}</p>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
