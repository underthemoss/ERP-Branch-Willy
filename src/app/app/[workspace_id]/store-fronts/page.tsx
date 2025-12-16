"use client";

import { ContactType } from "@/graphql/graphql";
import { useContactSelectorListQuery } from "@/graphql/hooks";
import {
  useCreateIntakeFormMutation,
  useDeleteIntakeFormMutation,
  useListIntakeFormsQuery,
  useListIntakeFormSubmissionsQuery,
  useUpdateIntakeFormMutation,
} from "@/ui/intake-forms/api";
import { useListPriceBooksQuery } from "@/ui/prices/api";
import ProjectSelector from "@/ui/ProjectSelector";
import {
  AlertCircle,
  ArrowUpDown,
  CheckCircle,
  Copy,
  Edit,
  ExternalLink,
  Eye,
  FileText,
  Link as LinkIcon,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import * as ReactDOM from "react-dom";

interface IntakeForm {
  id: string;
  projectId?: string | null;
  project?: { id: string; name: string; projectCode: string } | null;
  workspace?: {
    id: string;
    name: string;
    logoUrl?: string | null;
    bannerImageUrl?: string | null;
  } | null;
  pricebook?: { id: string; name: string } | null;
  isActive: boolean;
  isPublic?: boolean;
  sharedWithUsers?: { id: string; email: string }[];
  createdAt: string;
  updatedAt: string;
  submissions?: number;
}

export default function StoreFrontsPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.workspace_id as string;

  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortField, setSortField] = React.useState<
    keyof IntakeForm | "projectName" | "pricebookName" | null
  >(null);
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("desc");
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedForm, setSelectedForm] = React.useState<IntakeForm | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = React.useState<string | null>(null);

  // Form state for create/edit
  const [formProjectId, setFormProjectId] = React.useState("");
  const [formActive, setFormActive] = React.useState(true);
  const [formPricebookId, setFormPricebookId] = React.useState("");
  const [formIsPublic, setFormIsPublic] = React.useState(false);
  const [sharedEmails, setSharedEmails] = React.useState<string[]>([]);
  const [shareInputValue, setShareInputValue] = React.useState("");
  const [shareError, setShareError] = React.useState<string | null>(null);

  // Fetch intake forms
  const { data, loading, refetch } = useListIntakeFormsQuery({
    variables: { workspaceId },
    fetchPolicy: "cache-and-network",
  });

  // Fetch submissions for counting
  const { data: submissionsData } = useListIntakeFormSubmissionsQuery({
    variables: { workspaceId, excludeWithSalesOrder: false },
    fetchPolicy: "cache-and-network",
  });

  // Fetch pricebooks for dropdown
  const { data: priceBooksData } = useListPriceBooksQuery({
    variables: { page: { number: 1, size: 200 }, filter: { workspaceId } },
    fetchPolicy: "cache-and-network",
  });

  // Contacts for share suggestions
  const { data: contactsData } = useContactSelectorListQuery({
    variables: { workspaceId, page: { number: 1, size: 1000 }, contactType: ContactType.Person },
    fetchPolicy: "cache-and-network",
  });

  const personOptions = React.useMemo(() => {
    const items = contactsData?.listContacts?.items || [];
    const persons: { email: string; name: string }[] = items
      .filter((c: any) => c?.__typename === "PersonContact" && c.email)
      .map((c: any) => ({ email: c.email, name: c.name }));
    const seen = new Set<string>();
    return persons.filter((p) => (seen.has(p.email) ? false : (seen.add(p.email), true)));
  }, [contactsData]);

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Mutations
  const [createIntakeForm, { loading: createLoading }] = useCreateIntakeFormMutation({
    onCompleted: () => {
      setCreateDialogOpen(false);
      resetFormState();
      refetch();
    },
  });

  const [deleteIntakeForm, { loading: deleteLoading }] = useDeleteIntakeFormMutation({
    onCompleted: () => {
      setDeleteDialogOpen(false);
      setSelectedForm(null);
      refetch();
    },
  });

  const [updateIntakeForm, { loading: updateLoading }] = useUpdateIntakeFormMutation({
    onCompleted: () => {
      setEditDialogOpen(false);
      setSelectedForm(null);
      resetFormState();
      refetch();
    },
  });

  const resetFormState = () => {
    setFormProjectId("");
    setFormActive(true);
    setFormPricebookId("");
    setFormIsPublic(false);
    setSharedEmails([]);
    setShareInputValue("");
    setShareError(null);
  };

  const handleCreateForm = async () => {
    await createIntakeForm({
      variables: {
        input: {
          workspaceId,
          projectId: formProjectId || null,
          isActive: formActive,
          isPublic: formIsPublic,
          pricebookId: formPricebookId || null,
          sharedWithEmails: formIsPublic ? [] : sharedEmails,
        },
      },
    });
  };

  const handleUpdateForm = async () => {
    if (!selectedForm) return;
    await updateIntakeForm({
      variables: {
        id: selectedForm.id,
        input: {
          projectId: formProjectId || null,
          isActive: formActive,
          isPublic: formIsPublic,
          pricebookId: formPricebookId || null,
          sharedWithEmails: formIsPublic ? [] : sharedEmails,
        },
      },
    });
  };

  const handleDeleteForm = async () => {
    if (!selectedForm) return;
    await deleteIntakeForm({ variables: { id: selectedForm.id } });
  };

  const handleEditClick = (form: IntakeForm) => {
    setSelectedForm(form);
    setFormProjectId(form.projectId || "");
    setFormActive(form.isActive);
    setFormPricebookId(form.pricebook?.id || "");
    setFormIsPublic(form.isPublic || false);
    setSharedEmails(form.sharedWithUsers?.map((u) => u.email) || []);
    setEditDialogOpen(true);
    setActionMenuOpen(null);
  };

  const handleCopyLink = (formId: string) => {
    const link = `${window.location.origin}/intake-form/${formId}`;
    navigator.clipboard.writeText(link);
    setActionMenuOpen(null);
  };

  const handleViewSubmissions = (formId: string) => {
    router.push(`/app/${workspaceId}/requests?intakeFormId=${formId}`);
    setActionMenuOpen(null);
  };

  const handlePreviewForm = (formId: string) => {
    window.open(`/intake-form/${formId}`, "_blank");
    setActionMenuOpen(null);
  };

  const handleAddShareEmail = (email: string) => {
    if (!email.trim()) return;
    if (!isValidEmail(email.trim())) {
      setShareError("Enter a valid email address");
      return;
    }
    if (!sharedEmails.includes(email.trim())) {
      setSharedEmails([...sharedEmails, email.trim()]);
    }
    setShareInputValue("");
    setShareError(null);
  };

  const handleRemoveShareEmail = (email: string) => {
    setSharedEmails(sharedEmails.filter((e) => e !== email));
  };

  // Process forms data
  const forms: IntakeForm[] = (data?.listIntakeForms?.items as IntakeForm[]) || [];
  const allSubmissions = (
    (submissionsData?.listIntakeFormSubmissions?.items as any[]) || []
  ).filter((submission) => submission.status === "SUBMITTED");

  const submissionCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    allSubmissions.forEach((submission) => {
      if (submission.formId) {
        counts[submission.formId] = (counts[submission.formId] || 0) + 1;
      }
    });
    return counts;
  }, [allSubmissions]);

  const rows = React.useMemo(() => {
    return forms.map((form) => ({
      ...form,
      submissions: submissionCounts[form.id] || 0,
      projectName: form.project?.name || form.project?.projectCode || "-",
      pricebookName: form.pricebook?.name || "-",
    }));
  }, [forms, submissionCounts]);

  // Filter and sort
  const filteredRows = React.useMemo(() => {
    let filtered = rows;

    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (row) =>
          row.id.toLowerCase().includes(lower) ||
          row.projectName.toLowerCase().includes(lower) ||
          row.pricebookName.toLowerCase().includes(lower),
      );
    }

    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = (a as any)[sortField];
        const bValue = (b as any)[sortField];

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
  }, [rows, searchQuery, sortField, sortDirection]);

  const handleSort = (field: keyof IntakeForm | "projectName" | "pricebookName") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Calculate stats
  const stats = {
    totalForms: forms.length,
    activeForms: forms.filter((f) => f.isActive).length,
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="container mx-auto max-w-7xl">
          <p className="text-gray-600">Loading store fronts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-7xl px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Store Fronts</h1>
          <p className="text-gray-600">
            Create and manage intake forms for collecting equipment requests
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <StatsCard
            icon={<FileText className="w-5 h-5" />}
            label="Total Forms"
            value={stats.totalForms.toString()}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
          />
          <StatsCard
            icon={<CheckCircle className="w-5 h-5" />}
            label="Active Forms"
            value={stats.activeForms.toString()}
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
          />
        </div>

        {/* Search and Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search forms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <button
              onClick={() => {
                resetFormState();
                setCreateDialogOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Form
            </button>
          </div>
        </div>

        {/* Forms Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-visible">
          <div className="overflow-x-auto min-h-[200px]">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("id")}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900 cursor-pointer"
                    >
                      Form ID
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("projectName")}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900 cursor-pointer"
                    >
                      Project
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("pricebookName")}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900 cursor-pointer"
                    >
                      Pricebook
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Visibility
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Shared With
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("submissions" as any)}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900 cursor-pointer"
                    >
                      Submissions
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("createdAt")}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900 cursor-pointer"
                    >
                      Created
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                      {searchQuery
                        ? "No forms found matching your search."
                        : "No intake forms yet. Create your first form to get started."}
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 font-mono">
                            {row.id}
                          </span>
                          <button
                            onClick={() => handleCopyLink(row.id)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
                            title="Copy form link"
                          >
                            <LinkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {row.project ? (
                          <button
                            onClick={() =>
                              router.push(`/app/${workspaceId}/projects/${row.project!.id}`)
                            }
                            className="text-sm text-blue-600 hover:underline cursor-pointer"
                          >
                            {row.project.name || row.project.projectCode}
                          </button>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {row.pricebook ? (
                          <button
                            onClick={() =>
                              router.push(
                                `/app/${workspaceId}/prices/price-books/${row.pricebook!.id}`,
                              )
                            }
                            className="text-sm text-blue-600 hover:underline cursor-pointer"
                          >
                            {row.pricebook.name}
                          </button>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <VisibilityBadge isPublic={row.isPublic || false} />
                      </td>
                      <td className="px-4 py-3">
                        <SharedWithDisplay users={row.sharedWithUsers || []} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge isActive={row.isActive} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900">{row.submissions}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">{formatDate(row.createdAt)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <ActionMenuButton
                          isOpen={actionMenuOpen === row.id}
                          onToggle={() =>
                            setActionMenuOpen(actionMenuOpen === row.id ? null : row.id)
                          }
                          onEdit={() => handleEditClick(row)}
                          onViewSubmissions={() => handleViewSubmissions(row.id)}
                          onPreview={() => handlePreviewForm(row.id)}
                          onCopyLink={() => handleCopyLink(row.id)}
                          onDelete={() => {
                            setSelectedForm(row);
                            setDeleteDialogOpen(true);
                            setActionMenuOpen(null);
                          }}
                          onClose={() => setActionMenuOpen(null)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results Summary */}
        {filteredRows.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredRows.length} of {rows.length} forms
          </div>
        )}
      </div>

      {/* Create Form Dialog */}
      {createDialogOpen && (
        <FormDialog
          title="Create New Intake Form"
          description="Creating a new intake form will generate a unique URL that can be shared with external users to submit equipment requests."
          projectId={formProjectId}
          onProjectChange={setFormProjectId}
          isActive={formActive}
          onActiveChange={setFormActive}
          pricebookId={formPricebookId}
          onPricebookChange={setFormPricebookId}
          pricebooks={priceBooksData?.listPriceBooks?.items || []}
          isPublic={formIsPublic}
          onPublicChange={setFormIsPublic}
          sharedEmails={sharedEmails}
          shareInputValue={shareInputValue}
          shareError={shareError}
          onShareInputChange={setShareInputValue}
          onAddShareEmail={handleAddShareEmail}
          onRemoveShareEmail={handleRemoveShareEmail}
          personOptions={personOptions}
          onSubmit={handleCreateForm}
          onClose={() => {
            setCreateDialogOpen(false);
            resetFormState();
          }}
          submitLabel="Create Form"
          loading={createLoading}
        />
      )}

      {/* Edit Form Dialog */}
      {editDialogOpen && (
        <FormDialog
          title="Update Intake Form"
          description="Update the settings for this intake form. The form URL will remain the same."
          projectId={formProjectId}
          onProjectChange={setFormProjectId}
          isActive={formActive}
          onActiveChange={setFormActive}
          pricebookId={formPricebookId}
          onPricebookChange={setFormPricebookId}
          pricebooks={priceBooksData?.listPriceBooks?.items || []}
          isPublic={formIsPublic}
          onPublicChange={setFormIsPublic}
          sharedEmails={sharedEmails}
          shareInputValue={shareInputValue}
          shareError={shareError}
          onShareInputChange={setShareInputValue}
          onAddShareEmail={handleAddShareEmail}
          onRemoveShareEmail={handleRemoveShareEmail}
          personOptions={personOptions}
          onSubmit={handleUpdateForm}
          onClose={() => {
            setEditDialogOpen(false);
            setSelectedForm(null);
            resetFormState();
          }}
          submitLabel="Update Form"
          loading={updateLoading}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && selectedForm && (
        <DeleteDialog
          formId={selectedForm.id}
          onConfirm={handleDeleteForm}
          onClose={() => {
            setDeleteDialogOpen(false);
            setSelectedForm(null);
          }}
          loading={deleteLoading}
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

function StatusBadge({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-green-100 text-green-700 border-green-200">
        <CheckCircle className="w-3 h-3" />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-gray-100 text-gray-700 border-gray-200">
      Inactive
    </span>
  );
}

function VisibilityBadge({ isPublic }: { isPublic: boolean }) {
  if (isPublic) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-blue-100 text-blue-700 border-blue-200">
        Public
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-amber-100 text-amber-700 border-amber-200">
      Private
    </span>
  );
}

function SharedWithDisplay({ users }: { users: { id: string; email: string }[] }) {
  if (!users || users.length === 0) {
    return <span className="text-sm text-gray-400">-</span>;
  }

  if (users.length === 1) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 max-w-[140px] truncate">
        {users[0].email}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 max-w-[100px] truncate">
        {users[0].email}
      </span>
      <span
        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 cursor-help"
        title={users
          .slice(1)
          .map((u) => u.email)
          .join(", ")}
      >
        +{users.length - 1}
      </span>
    </div>
  );
}

function ActionMenuButton({
  isOpen,
  onToggle,
  onEdit,
  onViewSubmissions,
  onPreview,
  onCopyLink,
  onDelete,
  onClose,
}: {
  isOpen: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onViewSubmissions: () => void;
  onPreview: () => void;
  onCopyLink: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = React.useState({ top: 0, left: 0 });

  React.useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        left: rect.right - 192, // 192px = w-48
      });
    }
  }, [isOpen]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={onToggle}
        className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors cursor-pointer"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {isOpen &&
        ReactDOM.createPortal(
          <div
            ref={menuRef}
            style={{ top: menuPosition.top, left: menuPosition.left }}
            className="fixed w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[9999]"
          >
            <button
              onClick={onEdit}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
            >
              <Edit className="w-4 h-4" />
              Edit Form
            </button>
            <button
              onClick={onViewSubmissions}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              View Submissions
            </button>
            <button
              onClick={onPreview}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              Preview Form
            </button>
            <button
              onClick={onCopyLink}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              Copy Link
            </button>
            <div className="h-px bg-gray-200 my-1" />
            <button
              onClick={onDelete}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Delete Form
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}

function FormDialog({
  title,
  description,
  projectId,
  onProjectChange,
  isActive,
  onActiveChange,
  pricebookId,
  onPricebookChange,
  pricebooks,
  isPublic,
  onPublicChange,
  sharedEmails,
  shareInputValue,
  shareError,
  onShareInputChange,
  onAddShareEmail,
  onRemoveShareEmail,
  personOptions,
  onSubmit,
  onClose,
  submitLabel,
  loading,
}: {
  title: string;
  description: string;
  projectId: string;
  onProjectChange: (id: string) => void;
  isActive: boolean;
  onActiveChange: (active: boolean) => void;
  pricebookId: string;
  onPricebookChange: (id: string) => void;
  pricebooks: any[];
  isPublic: boolean;
  onPublicChange: (isPublic: boolean) => void;
  sharedEmails: string[];
  shareInputValue: string;
  shareError: string | null;
  onShareInputChange: (value: string) => void;
  onAddShareEmail: (email: string) => void;
  onRemoveShareEmail: (email: string) => void;
  personOptions: { email: string; name: string }[];
  onSubmit: () => void;
  onClose: () => void;
  submitLabel: string;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 z-10 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6 overflow-y-auto flex-1">
          {/* Info Alert */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">{description}</p>
          </div>

          {/* Project */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project (Optional)
            </label>
            <ProjectSelector projectId={projectId} onChange={onProjectChange} />
            <p className="text-xs text-gray-500 mt-1">
              Associate this form with a specific project
            </p>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Active (Accept submissions)
              </label>
            </div>
            <button
              type="button"
              onClick={() => onActiveChange(!isActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                isActive ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isActive ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Pricebook */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pricebook (Optional)
            </label>
            <select
              value={pricebookId}
              onChange={(e) => onPricebookChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">Select a pricebook</option>
              {pricebooks.map((pb: any) => (
                <option key={pb.id} value={pb.id}>
                  {pb.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Choose a pricebook to drive pricing on this form
            </p>
          </div>

          {/* Visibility Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {isPublic ? "Public (anyone with the link)" : "Private"}
              </span>
              <button
                type="button"
                onClick={() => onPublicChange(!isPublic)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  isPublic ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isPublic ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Share with people (only for private) */}
          {!isPublic && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Share with people
              </label>
              <div className="space-y-2">
                {/* Email input */}
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={shareInputValue}
                    onChange={(e) => onShareInputChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        onAddShareEmail(shareInputValue);
                      }
                    }}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                      shareError ? "border-red-300" : "border-gray-300"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => onAddShareEmail(shareInputValue)}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                {shareError && <p className="text-xs text-red-600">{shareError}</p>}

                {/* Suggestions from contacts */}
                {personOptions.length > 0 && (
                  <div className="text-xs text-gray-500">
                    <span>Suggestions: </span>
                    {personOptions.slice(0, 3).map((person, idx) => (
                      <button
                        key={person.email}
                        type="button"
                        onClick={() => onAddShareEmail(person.email)}
                        className="text-blue-600 hover:underline cursor-pointer"
                      >
                        {person.name || person.email}
                        {idx < Math.min(personOptions.length - 1, 2) ? ", " : ""}
                      </button>
                    ))}
                  </div>
                )}

                {/* Shared emails list */}
                {sharedEmails.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {sharedEmails.map((email) => (
                      <span
                        key={email}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                      >
                        {email}
                        <button
                          type="button"
                          onClick={() => onRemoveShareEmail(email)}
                          className="text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                People selected from suggestions are added by email; custom entries are treated as
                emails.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {loading ? "Saving..." : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteDialog({
  formId,
  onConfirm,
  onClose,
  loading,
}: {
  formId: string;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Delete Intake Form</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete this intake form ({formId})? This will remove it from
            the list.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatDate(dateString: string): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
