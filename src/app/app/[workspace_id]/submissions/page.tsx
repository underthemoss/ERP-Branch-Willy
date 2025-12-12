"use client";

import { IntakeFormSubmissionStatus } from "@/graphql/graphql";
import { useListIntakeFormSubmissionsAsBuyerQuery } from "@/ui/intake-forms/api";
import {
  ArrowUpDown,
  CheckCircle2,
  CircleDot,
  Clock,
  DollarSign,
  Eye,
  FileText,
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
  quoteId: string | null;
  quoteStatus: string | null;
  itemCount: number;
};

export default function SubmissionsPage() {
  const router = useRouter();
  const { workspace_id } = useParams<{ workspace_id: string }>();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [sortField, setSortField] = React.useState<keyof SubmissionRow | null>("createdAt");
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = React.useState<IntakeFormSubmissionStatus | "ALL">("ALL");

  const { data, loading, error } = useListIntakeFormSubmissionsAsBuyerQuery({
    variables: {
      buyerWorkspaceId: workspace_id,
      limit: 100,
    },
    fetchPolicy: "cache-and-network",
  });

  // Transform data to table rows
  const rows: SubmissionRow[] = React.useMemo(() => {
    if (!data?.listIntakeFormSubmissionsAsBuyer?.items) return [];

    return data.listIntakeFormSubmissionsAsBuyer.items.map((submission): SubmissionRow => {
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
        quoteId: submission.quote?.id || null,
        quoteStatus: submission.quote?.status || null,
        itemCount: submission.lineItems?.length || 0,
      };
    });
  }, [data]);

  // Calculate stats
  const stats = React.useMemo(() => {
    const draftCount = rows.filter((r) => r.status === "DRAFT").length;
    const submittedCount = rows.filter((r) => r.status === "SUBMITTED").length;
    const totalValue = rows
      .filter((r) => r.status === "SUBMITTED")
      .reduce((sum, r) => sum + r.amount, 0);
    const withQuotes = rows.filter((r) => r.quoteId !== null).length;

    return {
      draftCount,
      submittedCount,
      totalValue,
      withQuotes,
    };
  }, [rows]);

  // Filter and sort rows
  const filteredRows = React.useMemo(() => {
    let filtered = rows;

    // Apply status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((row) => row.status === statusFilter);
    }

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
  }, [rows, searchTerm, sortField, sortDirection, statusFilter]);

  const handleSort = (field: keyof SubmissionRow) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleRowClick = (row: SubmissionRow) => {
    if (row.status === "DRAFT") {
      router.push(`/intake-form/${row.formId}/catalog?submissionId=${row.id}`);
    } else {
      router.push(`/intake-form/${row.formId}/orders/${row.id}`);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="container mx-auto max-w-7xl">
          <p className="text-gray-600">Loading submissions...</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-7xl px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Submissions</h1>
          <p className="text-gray-600">Track equipment requests you&apos;ve submitted to sellers</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            icon={<FileText className="w-5 h-5" />}
            label="Total Submissions"
            value={rows.length.toString()}
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
          <StatsCard
            icon={<Clock className="w-5 h-5" />}
            label="Drafts"
            value={stats.draftCount.toString()}
            iconBgColor="bg-amber-100"
            iconColor="text-amber-600"
          />
        </div>

        {/* Search and Filter Bar */}
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
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as IntakeFormSubmissionStatus | "ALL")
                }
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Quote
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="w-12 h-12 text-gray-300" />
                        <p className="text-gray-500 font-medium">
                          {searchTerm || statusFilter !== "ALL"
                            ? "No submissions found matching your filters."
                            : "No submissions yet"}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {!searchTerm && statusFilter === "ALL"
                            ? "Submissions you make through intake forms will appear here."
                            : ""}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => handleRowClick(row)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
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
                      <td className="px-4 py-3">
                        {row.quoteId ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/quote/${row.quoteId}`);
                            }}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                          >
                            View Quote
                          </button>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(row);
                          }}
                          className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                          title={row.status === "DRAFT" ? "Continue Editing" : "View Details"}
                        >
                          {row.status === "DRAFT" ? (
                            <Pencil className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
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
            Showing {filteredRows.length} of {rows.length} submissions
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
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
