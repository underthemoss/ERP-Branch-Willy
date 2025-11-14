"use client";

import { graphql } from "@/graphql";
import { useSalesQuotesPage_ListQuotesQuery } from "@/graphql/hooks";
import {
  AlertCircle,
  ArrowUpDown,
  Ban,
  CheckCircle,
  CheckCircle2,
  CircleDot,
  Clock,
  DollarSign,
  Eye,
  FileText,
  Filter,
  Pencil,
  Plus,
  Search,
  XCircle,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { CreateQuoteDialog } from "./components/CreateQuoteDialog";

// GraphQL Query
graphql(`
  query SalesQuotesPage_ListQuotes($filter: ListQuotesFilter!, $page: ListQuotesPage) {
    listQuotes(query: { filter: $filter, page: $page }) {
      items {
        id
        status
        validUntil
        createdAt
        updatedAt
        sellersBuyerContact {
          __typename
          ... on PersonContact {
            id
            name
            business {
              id
              name
            }
          }
          ... on BusinessContact {
            id
            name
          }
        }
        sellersProject {
          id
          name
          project_code
        }
        currentRevision {
          id
          revisionNumber
          validUntil
          lineItems {
            ... on QuoteRevisionRentalLineItem {
              subtotalInCents
            }
            ... on QuoteRevisionSaleLineItem {
              subtotalInCents
            }
            ... on QuoteRevisionServiceLineItem {
              subtotalInCents
            }
          }
        }
      }
    }
  }
`);

type QuoteStatus = "ACTIVE" | "ACCEPTED" | "REJECTED" | "CANCELLED" | "EXPIRED";

interface QuoteRow {
  id: string;
  quoteNumber: string;
  buyer: string;
  company: string;
  project: string | null;
  createdAt: string;
  validUntil: string;
  amount: number;
  status: QuoteStatus;
}

export default function SalesQuotesPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params?.workspace_id as string;
  const [searchTerm, setSearchTerm] = React.useState("");
  const [sortField, setSortField] = React.useState<keyof QuoteRow | null>(null);
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("desc");
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);

  const { data, loading, error } = useSalesQuotesPage_ListQuotesQuery({
    variables: {
      filter: {
        sellerWorkspaceId: workspaceId,
      },
      page: {
        number: 1,
        size: 100,
      },
    },
    fetchPolicy: "cache-and-network",
  });

  // Transform data to table rows
  const rows: QuoteRow[] = React.useMemo(() => {
    if (!data?.listQuotes?.items) return [];

    return data.listQuotes.items.map((quote: any) => {
      const buyer =
        quote.sellersBuyerContact?.__typename === "PersonContact"
          ? quote.sellersBuyerContact.name
          : quote.sellersBuyerContact?.__typename === "BusinessContact"
            ? quote.sellersBuyerContact.name
            : "Unknown";

      const company =
        quote.sellersBuyerContact?.__typename === "PersonContact"
          ? quote.sellersBuyerContact.business?.name || "—"
          : quote.sellersBuyerContact?.__typename === "BusinessContact"
            ? quote.sellersBuyerContact.name
            : "—";

      const totalAmount =
        quote.currentRevision?.lineItems.reduce((sum: number, item: any) => {
          return sum + (item.subtotalInCents || 0);
        }, 0) || 0;

      return {
        id: quote.id,
        quoteNumber: quote.id,
        buyer,
        company,
        project: quote.sellersProject?.name || null,
        createdAt: quote.createdAt,
        validUntil: quote.validUntil || quote.currentRevision?.validUntil || "",
        amount: totalAmount / 100, // Convert cents to dollars
        status: quote.status as QuoteStatus,
      };
    });
  }, [data]);

  // Calculate stats
  const stats = React.useMemo(() => {
    const activeCount = rows.filter((r) => r.status === "ACTIVE").length;
    const totalValue = rows
      .filter((r) => r.status === "ACTIVE")
      .reduce((sum, r) => sum + r.amount, 0);
    const pendingCount = rows.filter((r) => r.status === "ACTIVE").length;

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const acceptedThisMonth = rows.filter((r) => {
      if (r.status !== "ACCEPTED") return false;
      const createdDate = new Date(r.createdAt);
      return createdDate >= firstDayOfMonth;
    }).length;

    return {
      activeCount,
      totalValue,
      pendingCount,
      acceptedThisMonth,
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
          row.quoteNumber.toLowerCase().includes(lower) ||
          row.buyer.toLowerCase().includes(lower) ||
          row.company.toLowerCase().includes(lower) ||
          (row.project && row.project.toLowerCase().includes(lower)) ||
          row.status.toLowerCase().includes(lower),
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

  const handleSort = (field: keyof QuoteRow) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleRowClick = (quoteId: string) => {
    router.push(`/app/${workspaceId}/sales-quotes/${quoteId}`);
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="container mx-auto max-w-7xl">
          <p className="text-gray-600">Loading quotes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="container mx-auto max-w-7xl">
          <p className="text-red-600">Error loading quotes: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-7xl px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quotes</h1>
          <p className="text-gray-600">Manage quotes you&apos;ve created for customers</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            icon={<FileText className="w-5 h-5" />}
            label="Active Quotes"
            value={stats.activeCount.toString()}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
          />
          <StatsCard
            icon={<DollarSign className="w-5 h-5" />}
            label="Total Value"
            value={`$${stats.totalValue.toLocaleString()}`}
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
          />
          <StatsCard
            icon={<Clock className="w-5 h-5" />}
            label="Pending Response"
            value={stats.pendingCount.toString()}
            iconBgColor="bg-amber-100"
            iconColor="text-amber-600"
          />
          <StatsCard
            icon={<CheckCircle className="w-5 h-5" />}
            label="Accepted This Month"
            value={stats.acceptedThisMonth.toString()}
            iconBgColor="bg-emerald-100"
            iconColor="text-emerald-600"
          />
        </div>

        {/* Search and Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search quotes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 cursor-pointer">
                <Filter className="w-4 h-4" />
                Filter
              </button>
              <button
                onClick={() => setCreateDialogOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Create Quote
              </button>
            </div>
          </div>
        </div>

        {/* Quotes Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("quoteNumber")}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900 cursor-pointer"
                    >
                      Quote #
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("buyer")}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900 cursor-pointer"
                    >
                      Buyer
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("company")}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900 cursor-pointer"
                    >
                      Company
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("project")}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900 cursor-pointer"
                    >
                      Project
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
                      onClick={() => handleSort("validUntil")}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900 cursor-pointer"
                    >
                      Valid Until
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("amount")}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900 cursor-pointer"
                    >
                      Amount
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                      {searchTerm
                        ? "No quotes found matching your search."
                        : "No quotes yet. Create your first quote to get started."}
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
                        <span className="text-sm font-medium text-gray-900">{row.quoteNumber}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900">{row.buyer}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">{row.company}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">{row.project || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">{formatDate(row.createdAt)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">
                          {row.validUntil ? formatDate(row.validUntil) : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900">
                          ${row.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(row.id);
                          }}
                          className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                          title="View Quote"
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
            Showing {filteredRows.length} of {rows.length} quotes
          </div>
        )}
      </div>

      {/* Create Quote Dialog */}
      <CreateQuoteDialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} />
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

function StatusBadge({ status }: { status: QuoteStatus }) {
  const statusConfig = {
    ACTIVE: {
      icon: <CircleDot className="w-3 h-3" />,
      label: "Active",
      bgColor: "bg-blue-100",
      textColor: "text-blue-700",
      borderColor: "border-blue-200",
    },
    ACCEPTED: {
      icon: <CheckCircle2 className="w-3 h-3" />,
      label: "Accepted",
      bgColor: "bg-green-100",
      textColor: "text-green-700",
      borderColor: "border-green-200",
    },
    REJECTED: {
      icon: <XCircle className="w-3 h-3" />,
      label: "Rejected",
      bgColor: "bg-red-100",
      textColor: "text-red-700",
      borderColor: "border-red-200",
    },
    CANCELLED: {
      icon: <Ban className="w-3 h-3" />,
      label: "Cancelled",
      bgColor: "bg-gray-100",
      textColor: "text-gray-700",
      borderColor: "border-gray-200",
    },
    EXPIRED: {
      icon: <AlertCircle className="w-3 h-3" />,
      label: "Expired",
      bgColor: "bg-orange-100",
      textColor: "text-orange-700",
      borderColor: "border-orange-200",
    },
  };

  const config = statusConfig[status];

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
