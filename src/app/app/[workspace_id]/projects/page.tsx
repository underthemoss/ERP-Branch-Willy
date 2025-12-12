"use client";

import { graphql } from "@/graphql";
import { useListTopLevelProjectsQuery } from "@/graphql/hooks";
import { parseDate } from "@/lib/parseDate";
import { ProjectDialog } from "@/ui/projects/ProjectDialog";
import { format, formatDistanceToNow } from "date-fns";
import { ArrowUpDown, Briefcase, Eye, FolderOpen, Pencil, Plus, Search } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

graphql(`
  query listTopLevelProjects($workspaceId: String!) {
    listTopLevelProjects(workspaceId: $workspaceId) {
      id
      name
      project_code
      description
      workspaceId
      created_at
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
  }PORT
`);

export default function ProjectsPage() {
  const { workspace_id } = useParams<{ workspace_id: string }>();
  const router = useRouter();

  const { data, loading, refetch } = useListTopLevelProjectsQuery({
    variables: { workspaceId: workspace_id },
    fetchPolicy: "cache-and-network",
  });

  const [searchTerm, setSearchTerm] = React.useState("");
  const [sortField, setSortField] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("desc");
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [editingProjectId, setEditingProjectId] = React.useState<string | null>(null);

  const rows = React.useMemo(() => {
    return (
      data?.listTopLevelProjects?.map((project) => ({
        id: project?.id ?? "",
        name: project?.name ?? "",
        project_code: project?.project_code ?? "",
        description: project?.description ?? "",
        created_at: project?.created_at ?? "",
        created_by: project?.created_by_user
          ? `${project.created_by_user.firstName} ${project.created_by_user.lastName}`
          : "",
        updated_at: project?.updated_at ?? "",
        updated_by: project?.updated_by_user
          ? `${project.updated_by_user.firstName} ${project.updated_by_user.lastName}`
          : "",
        deleted: project?.deleted ?? false,
        scope_of_work: project?.scope_of_work ?? [],
        status: project?.status ?? "",
      })) ?? []
    );
  }, [data]);

  const filteredRows = React.useMemo(() => {
    // Only show active projects (not deleted)
    let filtered = rows.filter((row) => !row.deleted);

    // Apply search filter
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter((row) =>
        Object.values(row).some((value) => (value ?? "").toString().toLowerCase().includes(lower)),
      );
    }

    // Apply sorting
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortField as keyof typeof a];
        const bValue = b[sortField as keyof typeof b];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
        }

        const aStr = String(aValue);
        const bStr = String(bValue);
        return sortDirection === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
      });
    }

    return filtered;
  }, [rows, searchTerm, sortField, sortDirection]);

  const stats = React.useMemo(() => {
    const total = rows.filter((r) => !r.deleted).length;
    return { total };
  }, [rows]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleRowClick = (projectId: string) => {
    router.push(`/app/${workspace_id}/projects/${projectId}`);
  };

  const handleEdit = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setEditingProjectId(projectId);
    setEditDialogOpen(true);
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="container mx-auto max-w-7xl">
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-7xl px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Projects</h1>
          <p className="text-gray-600">View, manage, and organize your projects</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <StatsCard
            icon={<FolderOpen className="w-5 h-5" />}
            label="Active Projects"
            value={stats.total.toString()}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
          />
        </div>

        {/* Search and Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setCreateDialogOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Create Project
              </button>
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("name")}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900"
                    >
                      Project Name
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("project_code")}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900"
                    >
                      Project Code
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Project Status
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("updated_at")}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900"
                    >
                      Updated At
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Updated By
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      {searchTerm
                        ? "No projects found matching your search."
                        : "No projects yet. Create your first project to get started."}
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => {
                    const initials = row.name
                      ?.split(" ")
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase();
                    const updatedDate = parseDate(row.updated_at);

                    return (
                      <tr
                        key={row.id}
                        onClick={() => handleRowClick(row.id)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        data-testid="project-list-item"
                      >
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center text-white text-xs font-bold bg-blue-500">
                              {initials ? (
                                <span>{initials}</span>
                              ) : (
                                <Briefcase className="w-4 h-4" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1 max-w-xs">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {row.name}
                              </p>
                              {row.description && (
                                <p className="text-xs text-gray-500 truncate">{row.description}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-xs text-gray-900 font-mono whitespace-nowrap">
                            {row.project_code}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          {row.status && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200 whitespace-nowrap">
                              {row.status.replace(/_/g, " ")}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          {updatedDate && (
                            <div className="text-xs text-gray-600">
                              <p className="whitespace-nowrap">
                                {format(updatedDate, "MMM d, yyyy")}
                              </p>
                              <p className="text-xs text-gray-500 whitespace-nowrap">
                                {formatDistanceToNow(updatedDate, { addSuffix: true })}
                              </p>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-xs text-gray-600 whitespace-nowrap">
                            {row.updated_by}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRowClick(row.id);
                              }}
                              className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="View Project"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleEdit(e, row.id)}
                              className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit Project"
                              data-testid="project-edit-btn"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results Summary */}
        {filteredRows.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredRows.length} active projects
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <ProjectDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        mode="create"
        workspaceId={workspace_id}
        onSuccess={() => {
          // Refetch the list to show the new project
          refetch();
        }}
      />

      {/* Edit Dialog */}
      {editingProjectId && (
        <ProjectDialog
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setEditingProjectId(null);
          }}
          mode="edit"
          workspaceId={workspace_id}
          projectId={editingProjectId}
          onSuccess={() => {
            // Refetch the list to show updated data
            refetch();
          }}
        />
      )}
    </div>
  );
}

// Helper Components
function StatsCard({
  icon,
  label,
  value,
  iconBgColor,
  iconColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconBgColor: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`${iconBgColor} ${iconColor} p-3 rounded-lg`}>{icon}</div>
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
