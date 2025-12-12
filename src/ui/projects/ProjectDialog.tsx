"use client";

import { graphql } from "@/graphql";
import { ProjectContactRelationEnum, ProjectStatusEnum, ScopeOfWorkEnum } from "@/graphql/graphql";
import {
  useCreateProjectFromDialogMutation,
  useGetProjectByIdForDisplayQuery,
  useProjectDialogDropdownOptionsQuery,
  useUpdateProjectFromDialogMutation,
} from "@/graphql/hooks";
import { useNotification } from "@/providers/NotificationProvider";
import { ProjectSelector } from "@/ui/ProjectSelector";
import {
  AlertCircle,
  Briefcase,
  CheckSquare,
  FileText,
  FolderTree,
  Hash,
  Layers,
  Loader2,
  Type,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { PersonSelector, SelectedPerson } from "../contacts/PersonSelector";
import { ProjectStatusSelector } from "./ProjectStatusSelector";
import { ScopeOfWorkSelector } from "./ScopeOfWorkSelector";

// GraphQL queries and mutations
graphql(`
  query ProjectDialogDropdownOptions {
    listProjectStatusCodes {
      code
      description
    }
    listScopeOfWorkCodes {
      code
      description
    }
    listProjectContactRelationCodes {
      code
      description
    }
  }

  mutation CreateProjectFromDialog($input: ProjectInput) {
    createProject(input: $input) {
      id
      name
      project_code
    }
  }

  mutation UpdateProjectFromDialog($id: String!, $input: ProjectInput) {
    updateProject(id: $id, input: $input) {
      id
      name
      project_code
    }
  }
`);

interface ProjectFormFields {
  name: string;
  projectCode: string;
  description?: string;
  parentProjectId?: string;
  status?: ProjectStatusEnum | "";
  scopeOfWork: ScopeOfWorkEnum[];
  projectContacts: SelectedPerson[];
}

interface ProjectDialogProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  workspaceId: string;
  projectId?: string;
  initialParentProjectId?: string;
  onSuccess?: () => void;
}

export function ProjectDialog({
  open,
  onClose,
  mode,
  workspaceId,
  projectId,
  initialParentProjectId,
  onSuccess,
}: ProjectDialogProps) {
  const router = useRouter();
  const { notifySuccess, notifyError } = useNotification();

  // Fetch project data for edit mode
  const { data: projectData, loading: projectLoading } = useGetProjectByIdForDisplayQuery({
    variables: { id: projectId ?? "" },
    skip: mode !== "edit" || !projectId,
    fetchPolicy: "cache-and-network",
  });

  const project = projectData?.getProjectById;

  // Fetch dropdown options
  const { data: dropdownData, loading: dropdownLoading } = useProjectDialogDropdownOptionsQuery({
    fetchPolicy: "cache-and-network",
  });

  const [createProject, { loading: createLoading, error: createError }] =
    useCreateProjectFromDialogMutation();
  const [updateProject, { loading: updateLoading, error: updateError }] =
    useUpdateProjectFromDialogMutation();

  const loading = mode === "create" ? createLoading : updateLoading;
  const error = mode === "create" ? createError : updateError;

  const { control, handleSubmit, setValue, reset, watch } = useForm<ProjectFormFields>({
    defaultValues: {
      name: "",
      projectCode: "",
      description: "",
      parentProjectId: initialParentProjectId || "",
      status: "",
      scopeOfWork: [],
      projectContacts: [],
    },
  });

  const scopeOfWork = watch("scopeOfWork");
  const projectContacts = watch("projectContacts");

  // Prefill form for edit mode
  useEffect(() => {
    if (mode === "edit" && project) {
      reset({
        name: project.name || "",
        projectCode: project.project_code || "",
        description: project.description || "",
        parentProjectId: project.parent_project || "",
        status: (project.status as ProjectStatusEnum) || "",
        scopeOfWork: Array.isArray(project.scope_of_work)
          ? (project.scope_of_work.filter(Boolean) as ScopeOfWorkEnum[])
          : [],
        projectContacts: Array.isArray(project.project_contacts)
          ? project.project_contacts
              .filter(
                (c: any) =>
                  c &&
                  c.contact &&
                  c.contact.__typename === "PersonContact" &&
                  c.contact.id &&
                  c.contact.name,
              )
              .map((c: any) => ({
                id: c.contact.id,
                name: c.contact.name,
                role: c.contact.role,
                profilePicture: c.contact.profilePicture,
                relationToProject: c.relation_to_project || "",
              }))
          : [],
      });
    } else if (mode === "create" && initialParentProjectId) {
      setValue("parentProjectId", initialParentProjectId);
    }
  }, [mode, project, initialParentProjectId, reset, setValue]);

  // Prepare dropdown options
  const statusOptions = (dropdownData?.listProjectStatusCodes ?? []).filter(Boolean);
  const scopeOptions = (dropdownData?.listScopeOfWorkCodes ?? []).filter(Boolean);
  const relationshipOptions = (dropdownData?.listProjectContactRelationCodes ?? [])
    .filter(Boolean)
    .map((r) => ({ code: r!.code, description: r!.description }));

  const onSubmit: SubmitHandler<ProjectFormFields> = async (data) => {
    // Validation
    if (!data.name.trim()) {
      notifyError("Project name is required");
      return;
    }
    if (!data.projectCode.trim()) {
      notifyError("Project code is required");
      return;
    }
    if (data.projectContacts.some((c) => !c.relationToProject)) {
      notifyError("Each contact must have a relationship type");
      return;
    }

    try {
      if (mode === "create") {
        const response = await createProject({
          variables: {
            input: {
              workspaceId,
              name: data.name,
              project_code: data.projectCode,
              deleted: false,
              description: data.description?.trim() || undefined,
              parent_project: data.parentProjectId || undefined,
              status: data.status || undefined,
              scope_of_work: data.scopeOfWork.length > 0 ? data.scopeOfWork : undefined,
              project_contacts: data.projectContacts.map((c) => ({
                contact_id: c.id,
                relation_to_project: c.relationToProject as ProjectContactRelationEnum,
              })),
            },
          },
        });

        if (response.data?.createProject?.id) {
          notifySuccess("Project created successfully!");
          onClose();
          if (onSuccess) {
            onSuccess();
          }
          router.push(`/app/${workspaceId}/projects/${response.data.createProject.id}`);
        }
      } else {
        // Edit mode
        const response = await updateProject({
          variables: {
            id: projectId!,
            input: {
              workspaceId,
              name: data.name,
              project_code: data.projectCode,
              deleted: project?.deleted ?? false,
              description: data.description?.trim() || undefined,
              parent_project: data.parentProjectId || undefined,
              status: data.status || undefined,
              scope_of_work: data.scopeOfWork.length > 0 ? data.scopeOfWork : undefined,
              project_contacts: data.projectContacts.map((c) => ({
                contact_id: c.id,
                relation_to_project: c.relationToProject as ProjectContactRelationEnum,
              })),
            },
          },
        });

        if (response.data?.updateProject?.id) {
          notifySuccess("Project updated successfully!");
          onClose();
          if (onSuccess) {
            onSuccess();
          }
          router.refresh();
        }
      }
    } catch (err: any) {
      notifyError(err?.message || `Failed to ${mode === "create" ? "create" : "update"} project`);
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [open, loading, onClose]);

  if (!open) return null;

  const title = mode === "create" ? "Create Project" : "Edit Project";
  const submitButtonText = mode === "create" ? "Create Project" : "Save Changes";
  const loadingText = mode === "create" ? "Creating..." : "Saving...";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={() => !loading && onClose()}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100">
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          </div>
          <button
            type="button"
            onClick={() => !loading && onClose()}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-6">
          {/* Loading state for edit mode */}
          {mode === "edit" && projectLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading project...</span>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">
                  Error {mode === "create" ? "creating" : "updating"} project
                </p>
                <p className="text-sm text-red-700 mt-1">{error.message}</p>
              </div>
            </div>
          )}

          {/* Form */}
          {(!projectLoading || mode === "create") && (
            <form id="project-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Project Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Type className="w-4 h-4 text-gray-500" />
                    Project Name <span className="text-red-500">*</span>
                  </div>
                </label>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <input
                      id="name"
                      type="text"
                      placeholder="Enter project name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-400 transition-colors"
                      {...field}
                    />
                  )}
                />
              </div>

              {/* Project Code */}
              <div>
                <label
                  htmlFor="projectCode"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  <div className="flex items-center gap-1.5">
                    <Hash className="w-4 h-4 text-gray-500" />
                    Project Code <span className="text-red-500">*</span>
                  </div>
                </label>
                <Controller
                  name="projectCode"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <input
                      id="projectCode"
                      type="text"
                      placeholder="Enter project code"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-400 font-mono transition-colors"
                      {...field}
                    />
                  )}
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-gray-500" />
                    Description
                  </div>
                </label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      id="description"
                      rows={3}
                      placeholder="Add project description..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-400 resize-none transition-colors"
                      {...field}
                    />
                  )}
                />
              </div>

              {/* Parent Project */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <FolderTree className="w-4 h-4 text-gray-500" />
                    Parent Project
                  </div>
                </label>
                <Controller
                  name="parentProjectId"
                  control={control}
                  render={({ field }) => (
                    <ProjectSelector projectId={field.value} onChange={field.onChange} />
                  )}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Link this project as a sub-project of an existing project
                </p>
              </div>

              {/* Project Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-gray-500" />
                    Project Status
                  </div>
                </label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <ProjectStatusSelector
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select status..."
                    />
                  )}
                />
              </div>

              {/* Scope of Work */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-gray-500" />
                    Scope of Work
                  </div>
                </label>
                <Controller
                  name="scopeOfWork"
                  control={control}
                  render={({ field }) => (
                    <ScopeOfWorkSelector
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select scope of work..."
                    />
                  )}
                />
              </div>

              {/* Project Contacts */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-gray-500" />
                    Project Contacts
                  </div>
                </label>
                <Controller
                  name="projectContacts"
                  control={control}
                  render={({ field }) => (
                    <PersonSelector
                      workspaceId={workspaceId}
                      selectedPersons={field.value}
                      onChange={field.onChange}
                      relationshipOptions={relationshipOptions}
                      maxSelections={10}
                    />
                  )}
                />
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={() => onClose()}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="project-form"
            disabled={loading || (mode === "edit" && projectLoading)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? loadingText : submitButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}
