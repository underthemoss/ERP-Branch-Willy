"use client";

import { IntakeFormSubmissionStatus } from "@/graphql/graphql";
import {
  useAdoptOrphanedSubmissionsMutation,
  useListMyOrphanedSubmissionsQuery,
} from "@/ui/intake-forms/api";
import {
  ArrowLeft,
  ArrowUpDown,
  Check,
  CheckCircle2,
  CircleDot,
  DollarSign,
  FileText,
  Loader2,
  Pencil,
  Search,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

type SubmissionRow = {
  id: string;
  formId: string;
  seller: string;
  sellerLogoUrl?: string;
  projectName: string;
  projectCode: string | null;
  status: IntakeFormSubmissionStatus;
  createdAt: string;
  submittedAt: string;
  amount: number;
  amountFormatted: string;
  itemCount: number;
};

export default function OrphanedSubmissionsPage() {
  const router = useRouter();
  const { workspace_id } = useParams<{ workspace_id: string }>();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [sortField, setSortField] = React.useState<keyof SubmissionRow | null>("createdAt");
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("desc");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [isAdopting, setIsAdopting] = React.useState(false);

  const { data, loading, error, refetch } = useListMyOrphanedSubmissionsQuery({
    fetchPolicy: "cache-and-network",
  });

  const [adoptOrphanedSubmissions] = useAdoptOrphanedSubmissionsMutation({
    refetchQueries: ["ListMyOrphanedSubmissions", "ListIntakeFormSubmissionsAsBuyer"],
  });

  // Transform data to table rows
  const rows: SubmissionRow[] = React.useMemo(() => {
    if (!data?.listMyOrphanedSubmissions) return [];

    return data.listMyOrphanedSubmissions.map((submission): SubmissionRow => {
      const amountInCents = submission.totalInCents ?? 0;
      return {
        id: submission.id,
        formId: submission.formId,
        seller: submission.form?.workspace?.name || "Unknown Seller",
        sellerLogoUrl: submission.form?.workspace?.logoUrl || undefined,
        projectName: submission.form?.project?.name || "Unnamed Form",
        projectCode: submission.form?.project?.id || null,
        status: submission.status,
        createdAt: submission.createdAt,
        submittedAt: submission.submittedAt || "",
        amount: amountInCents / 100,
        amountFormatted: submission.totalInCents
          ? `$${(submission.totalInCents / 100).toLocaleString()}`
          : "Quote pending",
        itemCount: submission.lineItems?.length || 0,
      };
    });
  }, [data]);

  // Calculate stats
  const stats = React.useMemo(() => {
    const draftCount = rows.filter((r) => r.status === "DRAFT").length;
    const submittedCount = rows.filter((r) => r.status === "SUBMITTED").length;
    const totalValue = rows.reduce((sum, r) => sum + r.amount, 0);

    return {
      draftCount,
      submittedCount,
      totalValue,
      totalCount: rows.length,
    };
  }, [rows]);

  // Filter and sort rows
  const filteredRows = React.useMemo(() => {
    let filtered = rows;

    // Apply search filter
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (row) =>
          row.id.toLowerCase().includes(lower) ||
          row.seller.toLowerCase().includes(lower) ||
          row.projectName.toLowerCase().includes(lower) ||
          (row.projectCode && row.projectCode.toLowerCase().includes(lower)),
      );
    }

    // Apply sorting
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];

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

  const handleSort = (field: keyof SubmissionRow) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredRows.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRows.map((r) => r.id)));
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleAdoptSelected = async () => {
    if (selectedIds.size === 0) return;

    setIsAdopting(true);
    try {
      await adoptOrphanedSubmissions({
        variables: {
          workspaceId: workspace_id,
          submissionIds: Array.from(selectedIds),
        },
      });
      setSelectedIds(new Set());
      await refetch();
    } catch (err) {
      console.error("Failed to adopt submissions:", err);
    } finally {
      setIsAdopting(false);
    }
  };

  const handleAdoptAll = async () => {
    setIsAdopting(true);
    try {
      await adoptOrphanedSubmissions({
        variables: {
          workspaceId: workspace_id,
        },
      });
      setSelectedIds(new Set());
      await refetch();
    } catch (err) {
      console.error("Failed to adopt submissions:", err);
    } finally {
      setIsAdopting(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="container mx-auto max-w-7xl">
          <p className="text-gray-600">Loading orphaned submissions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="container mx-auto max-w-7xl">
          <p className="text-red-600">Error loading submissions: {error.message}</p>
        </div>
      </div>
    );
  }

  // If no orphaned submissions, show empty state with redirect option
  if (rows.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto max-w-7xl px-4 py-6">
          {/* Back button */}
          <button
            onClick={() => router.push(`/app/${workspace_id}/my-requests`)}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Requests
          </button>

          {/* Empty State */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">All caught up!</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              You don&apos;t have any orphaned submissions. All your requests are already linked to
              this workspace.
            </p>
            <button
              onClick={() => router.push(`/app/${workspace_id}/my-requests`)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              View My Requests
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-7xl px-4 py-6">
        {/* Back button */}
        <button
          onClick={() => router.push(`/app/${workspace_id}/my-requests`)}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Requests
        </button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Orphaned Requests</h1>
          <p className="text-gray-600">
            These are requests you submitted before joining this workspace. Add them to your
            workspace to track them here.
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg shrink-0">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">
                {stats.totalCount} request{stats.totalCount !== 1 ? "s" : ""} found
              </h3>
              <p className="text-blue-700 text-sm">
                These requests were submitted using your email address but weren&apos;t linked to
                any workspace. Adding them will make them visible in your &quot;My Requests&quot;
                section.
              </p>
            </div>
            <button
              onClick={handleAdoptAll}
              disabled={isAdopting}
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isAdopting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Add All to Workspace
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatsCard
            icon={<FileText className="w-5 h-5" />}
            label="Total Orphaned"
            value={stats.totalCount.toString()}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
          />
          <StatsCard
            icon={<CheckCircle2 className="w-5 h-5" />}
            label="Submitted"
            value={stats.submittedCount.toString()}
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
          />
          <StatsCard
            icon={<DollarSign className="w-5 h-5" />}
            label="Total Value"
            value={`$${stats.totalValue.toLocaleString()}`}
            iconBgColor="bg-emerald-100"
            iconColor="text-emerald-600"
          />
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search submissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            {selectedIds.size > 0 && (
              <button
                onClick={handleAdoptSelected}
                disabled={isAdopting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isAdopting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Add {selectedIds.size} Selected
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Submissions Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left w-12">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filteredRows.length && filteredRows.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("id")}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900 cursor-pointer"
                    >
                      Submission #
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("seller")}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900 cursor-pointer"
                    >
                      Seller
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
                  <th className="px-4 py-3 text-center">
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Items
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("status")}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900 cursor-pointer"
                    >
                      Status
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
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("amount")}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900 cursor-pointer"
                    >
                      Total
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="w-12 h-12 text-gray-300" />
                        <p className="text-gray-500 font-medium">
                          No submissions found matching your search.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr
                      key={row.id}
                      className={`hover:bg-gray-50 transition-colors ${selectedIds.has(row.id) ? "bg-blue-50" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(row.id)}
                          onChange={() => handleSelectRow(row.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900 font-mono">
                          {row.id}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900">{row.seller}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-900">{row.projectName}</span>
                          {row.projectCode && (
                            <span className="text-xs text-gray-500 font-mono">
                              {row.projectCode}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-gray-600">{row.itemCount}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">{formatDate(row.createdAt)}</span>
                      </td>
                      <td className="px-4 py-3">
                        {row.amount > 0 ? (
                          <span className="text-sm font-medium text-gray-900">
                            {row.amountFormatted}
                          </span>
                        ) : (
                          <span className="text-sm text-amber-600">Quote pending</span>
                        )}
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
            Showing {filteredRows.length} of {rows.length} orphaned submissions
          </div>
        )}
      </div>
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

function StatusBadge({ status }: { status: IntakeFormSubmissionStatus }) {
  const statusConfig = {
    DRAFT: {
      icon: <Pencil className="w-3 h-3" />,
      label: "Draft",
      bgColor: "bg-gray-100",
      textColor: "text-gray-700",
      borderColor: "border-gray-200",
    },
    SUBMITTED: {
      icon: <CircleDot className="w-3 h-3" />,
      label: "Submitted",
      bgColor: "bg-green-100",
      textColor: "text-green-700",
      borderColor: "border-green-200",
    },
  };

  const config = statusConfig[status] || statusConfig.DRAFT;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor}`}
    >
      {config.icon}
      {config.label}
    </span>
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
