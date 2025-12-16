"use client";

import {
  useListIntakeFormsQuery,
  useListIntakeFormSubmissionsByFormIdQuery,
  useListIntakeFormSubmissionsQuery,
} from "@/ui/intake-forms/api";
import {
  ArrowUpDown,
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

interface SubmissionRow {
  id: string;
  formId: string;
  name: string | null;
  email: string | null;
  companyName: string | null;
  totalInCents: number;
  createdAt: string;
  submittedAt: string | null;
  quoteId: string | null;
  salesOrderId: string | null;
  salesOrderReferenceNumber: string | null;
  lineItemCount: number;
}

export default function RequestsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = params.workspace_id as string;

  // Get initial filter from URL query param
  const initialFormFilter = searchParams.get("intakeFormId") || "";

  const [searchTerm, setSearchTerm] = React.useState("");
  const [sortField, setSortField] = React.useState<keyof SubmissionRow | null>("submittedAt");
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("desc");
  const [selectedFormId, setSelectedFormId] = React.useState(initialFormFilter);
  const [filterDropdownOpen, setFilterDropdownOpen] = React.useState(false);
  const filterRef = React.useRef<HTMLDivElement>(null);

  // Close filter dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFilterDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch intake forms for the filter dropdown
  const { data: formsData } = useListIntakeFormsQuery({
    variables: { workspaceId },
    fetchPolicy: "cache-and-network",
  });

  const forms = (formsData?.listIntakeForms?.items as any[]) || [];

  // Fetch submissions - use different query based on whether we're filtering by form
  const { data: allSubmissionsData, loading: allSubmissionsLoading } =
    useListIntakeFormSubmissionsQuery({
      variables: {
        workspaceId,
        excludeWithSalesOrder: false,
      },
      fetchPolicy: "cache-and-network",
      skip: !!selectedFormId, // Skip this query if we have a form filter
    });

  const { data: filteredSubmissionsData, loading: filteredSubmissionsLoading } =
    useListIntakeFormSubmissionsByFormIdQuery({
      variables: {
        workspaceId,
        intakeFormId: selectedFormId,
      },
      fetchPolicy: "cache-and-network",
      skip: !selectedFormId, // Skip this query if we don't have a form filter
    });

  const submissionsLoading = selectedFormId ? filteredSubmissionsLoading : allSubmissionsLoading;
  const submissionsData = selectedFormId ? filteredSubmissionsData : allSubmissionsData;

  // Transform data to rows
  const rows: SubmissionRow[] = React.useMemo(() => {
    const items = (submissionsData?.listIntakeFormSubmissions?.items as any[]) || [];
    const filtered = items.filter((submission) => submission.status === "SUBMITTED");

    return filtered.map((s) => ({
      id: s.id,
      formId: s.formId,
      name: s.name,
      email: s.email,
      companyName: s.companyName,
      totalInCents: s.totalInCents || 0,
      createdAt: s.createdAt,
      submittedAt: s.submittedAt,
      quoteId: s.quote?.id || null,
      salesOrderId: s.salesOrder?.id || null,
      salesOrderReferenceNumber: s.salesOrder?.referenceNumber || null,
      lineItemCount: s.lineItems?.length || 0,
    }));
  }, [submissionsData]);

  // Calculate stats
  const stats = React.useMemo(() => {
    const totalSubmissions = rows.length;
    const thisMonth = rows.filter((sub) => {
      const subDate = new Date(sub.createdAt);
      const now = new Date();
      return subDate.getMonth() === now.getMonth() && subDate.getFullYear() === now.getFullYear();
    }).length;
    const pendingReview = rows.filter((s) => !s.salesOrderId && !s.quoteId).length;
    const convertedToOrders = rows.filter((s) => s.salesOrderId).length;

    return {
      totalSubmissions,
      thisMonth,
      pendingReview,
      convertedToOrders,
    };
  }, [rows]);

  // Filter and sort rows
  const filteredRows = React.useMemo(() => {
    let filtered = rows;

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (row) =>
          row.id.toLowerCase().includes(lower) ||
          (row.name && row.name.toLowerCase().includes(lower)) ||
          (row.email && row.email.toLowerCase().includes(lower)) ||
          (row.companyName && row.companyName.toLowerCase().includes(lower)),
      );
    }

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

  const handleRowClick = (submissionId: string) => {
    router.push(`/app/${workspaceId}/requests/${submissionId}`);
  };

  const handleFormFilterChange = (formId: string) => {
    setSelectedFormId(formId);
    setFilterDropdownOpen(false);
    // Update URL without navigation
    const url = new URL(window.location.href);
    if (formId) {
      url.searchParams.set("intakeFormId", formId);
    } else {
      url.searchParams.delete("intakeFormId");
    }
    window.history.replaceState({}, "", url.toString());
  };

  const clearFormFilter = () => {
    handleFormFilterChange("");
  };

  const selectedForm = forms.find((f) => f.id === selectedFormId);

  if (submissionsLoading && !submissionsData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="container mx-auto max-w-7xl">
          <p className="text-gray-600">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-7xl px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Requests</h1>
          <p className="text-gray-600">
            View and manage equipment requests from intake form submissions
          </p>
        </div>

        {/* Active Filter Banner */}
        {selectedFormId && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                Filtered by form:{" "}
                <span className="font-medium">
                  {selectedForm?.project?.name || selectedForm?.id || selectedFormId}
                </span>
              </span>
            </div>
            <button
              onClick={clearFormFilter}
              className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-100 rounded transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            icon={<FileText className="w-5 h-5" />}
            label="Total Submissions"
            value={stats.totalSubmissions.toString()}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
          />
          <StatsCard
            icon={<Calendar className="w-5 h-5" />}
            label="This Month"
            value={stats.thisMonth.toString()}
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
          />
          <StatsCard
            icon={<Clock className="w-5 h-5" />}
            label="Pending Review"
            value={stats.pendingReview.toString()}
            iconBgColor="bg-amber-100"
            iconColor="text-amber-600"
          />
          <StatsCard
            icon={<CheckCircle className="w-5 h-5" />}
            label="Converted to Orders"
            value={stats.convertedToOrders.toString()}
            iconBgColor="bg-emerald-100"
            iconColor="text-emerald-600"
          />
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 gap-3 w-full sm:w-auto">
              {/* Search Input */}
              <div className="relative flex-1 sm:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Form Filter Dropdown */}
              <div className="relative" ref={filterRef}>
                <button
                  onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                  className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors cursor-pointer ${
                    selectedFormId
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {selectedFormId ? "Form Filter Active" : "Filter by Form"}
                  </span>
                </button>

                {filterDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 max-h-64 overflow-y-auto">
                    <button
                      onClick={() => handleFormFilterChange("")}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 cursor-pointer ${
                        !selectedFormId ? "bg-blue-50 text-blue-700" : "text-gray-700"
                      }`}
                    >
                      All Forms
                    </button>
                    <div className="h-px bg-gray-200 my-1" />
                    {forms.length === 0 ? (
                      <div className="px-4 py-2 text-sm text-gray-500">No forms available</div>
                    ) : (
                      forms.map((form) => (
                        <button
                          key={form.id}
                          onClick={() => handleFormFilterChange(form.id)}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 cursor-pointer ${
                            selectedFormId === form.id
                              ? "bg-blue-50 text-blue-700"
                              : "text-gray-700"
                          }`}
                        >
                          <div className="font-medium truncate">
                            {form.project?.name || form.project?.projectCode || "Untitled Form"}
                          </div>
                          <div className="text-xs text-gray-500 font-mono truncate">{form.id}</div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("name")}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900 cursor-pointer"
                    >
                      Contact
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("companyName")}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900 cursor-pointer"
                    >
                      Company
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("lineItemCount")}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900 cursor-pointer"
                    >
                      Line Items
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("totalInCents")}
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
                    Sales Order
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("submittedAt")}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900 cursor-pointer"
                    >
                      Submitted
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
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      {searchTerm
                        ? "No requests found matching your search."
                        : "No submissions yet. Requests will appear here when submitted."}
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => handleRowClick(row.id)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{row.name || "—"}</p>
                          <p className="text-xs text-gray-500">{row.email || "—"}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">{row.companyName || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900">{row.lineItemCount}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900">
                          $
                          {(row.totalInCents / 100).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {row.quoteId ? (
                          <Link
                            href={`/app/${workspaceId}/sales-quotes/${row.quoteId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                          >
                            View Quote
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {row.salesOrderId ? (
                          <Link
                            href={`/app/${workspaceId}/sales-orders/${row.salesOrderId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                          >
                            View Order
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">
                          {formatDate(row.submittedAt || row.createdAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(row.id);
                          }}
                          className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
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
            Showing {filteredRows.length} of {rows.length} requests
            {selectedFormId && " (filtered)"}
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

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
