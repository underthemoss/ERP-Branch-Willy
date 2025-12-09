"use client";

import { ContactType } from "@/graphql/graphql";
import { useListContactsQuery } from "@/ui/contacts/api";
import {
  ArrowUpDown,
  Building2,
  Eye,
  Grid3x3,
  List,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  User,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { ContactCard } from "./components/ContactCard";

export default function ContactsPage() {
  const { workspace_id } = useParams<{ workspace_id: string }>();
  const router = useRouter();

  // View state with localStorage persistence
  const [view, setView] = React.useState<"grid" | "table">("table");
  const [contactTypeFilter, setContactTypeFilter] = React.useState("All");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [addDialogOpen, setAddDialogOpen] = React.useState(false);
  const [sortField, setSortField] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("desc");

  // Load view preference from localStorage
  React.useEffect(() => {
    const savedView = localStorage.getItem("contacts-view");
    if (savedView === "grid" || savedView === "table") {
      setView(savedView);
    }
  }, []);

  // Save view preference to localStorage
  const handleViewChange = (newView: "grid" | "table") => {
    setView(newView);
    localStorage.setItem("contacts-view", newView);
  };

  const { data, loading } = useListContactsQuery({
    variables: {
      workspaceId: workspace_id,
      page: {
        size: 10_000,
      },
      contactType:
        contactTypeFilter === "All"
          ? undefined
          : contactTypeFilter === "PERSON"
            ? ContactType.Person
            : contactTypeFilter === "BUSINESS"
              ? ContactType.Business
              : undefined,
    },
    fetchPolicy: "cache-and-network",
  });

  const rows = React.useMemo(() => {
    return (
      data?.listContacts?.items?.map((contact) => {
        const isPerson = contact?.__typename === "PersonContact";
        const isBusiness = contact?.__typename === "BusinessContact";
        return {
          id: contact?.id ?? "",
          name: contact?.name ?? "",
          type: contact?.contactType ?? "",
          phone: contact?.phone ?? "",
          email: isPerson ? (contact?.email ?? "") : "",
          role: isPerson ? (contact?.role ?? "") : "",
          businessId: isPerson ? (contact?.businessId ?? "") : "",
          address: isBusiness ? (contact?.address ?? "") : "",
          taxId: isBusiness ? (contact?.taxId ?? "") : "",
          website: isBusiness ? (contact?.website ?? "") : "",
          notes: contact?.notes ?? "",
          profilePicture: contact?.profilePicture ?? "",
          updatedAt: contact?.updatedAt ?? "",
          brand: isBusiness
            ? contact?.brand
              ? {
                  name: contact.brand.name ?? null,
                  logos: contact.brand.logos ?? null,
                }
              : null
            : null,
          __typename: contact?.__typename,
        };
      }) ?? []
    );
  }, [data]);

  const filteredRows = React.useMemo(() => {
    let filtered = rows;

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
    const total = rows.length;
    const persons = rows.filter((r) => r.type === "PERSON").length;
    const businesses = rows.filter((r) => r.type === "BUSINESS").length;
    return { total, persons, businesses };
  }, [rows]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleRowClick = (contactId: string) => {
    router.push(`/app/${workspace_id}/contacts/${contactId}`);
  };

  const handleEdit = (e: React.MouseEvent, contactId: string) => {
    e.stopPropagation();
    router.push(`/app/${workspace_id}/contacts/${contactId}/edit`);
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="container mx-auto max-w-7xl">
          <p className="text-gray-600">Loading contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-7xl px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Contacts</h1>
          <p className="text-gray-600">Manage your business and employee contacts</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <StatsCard
            icon={<User className="w-5 h-5" />}
            label="Total Contacts"
            value={stats.total.toString()}
            iconBgColor="bg-gray-100"
            iconColor="text-gray-600"
          />
          <StatsCard
            icon={<User className="w-5 h-5" />}
            label="Individuals"
            value={stats.persons.toString()}
            iconBgColor="bg-purple-100"
            iconColor="text-purple-600"
          />
          <StatsCard
            icon={<Building2 className="w-5 h-5" />}
            label="Businesses"
            value={stats.businesses.toString()}
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
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {/* Filter Buttons */}
              <button
                onClick={() => setContactTypeFilter("All")}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  contactTypeFilter === "All"
                    ? "bg-gray-900 text-white"
                    : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setContactTypeFilter("PERSON")}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  contactTypeFilter === "PERSON"
                    ? "bg-purple-600 text-white"
                    : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Individuals
              </button>
              <button
                onClick={() => setContactTypeFilter("BUSINESS")}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  contactTypeFilter === "BUSINESS"
                    ? "bg-blue-600 text-white"
                    : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Businesses
              </button>

              {/* View Toggle */}
              <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => handleViewChange("table")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                    view === "table" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleViewChange("grid")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                    view === "grid" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"
                  }`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => setAddDialogOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Contact
              </button>
            </div>
          </div>
        </div>

        {/* Table View */}
        {view === "table" && (
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
                        Name
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <button
                        onClick={() => handleSort("type")}
                        className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900"
                      >
                        Type
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Contact Info
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        {searchTerm
                          ? "No contacts found matching your search."
                          : "No contacts yet. Add your first contact to get started."}
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row) => {
                      const isPerson = row.type === "PERSON";
                      const initials = row.name
                        ?.split(" ")
                        .slice(-2)
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase();
                      const businessLogo = row.brand?.logos?.find((l) => l?.type === "logo")
                        ?.formats?.[0]?.src;
                      const logoTheme = row.brand?.logos?.find((l) => l?.type === "logo")?.theme;

                      return (
                        <tr
                          key={row.id}
                          onClick={() => handleRowClick(row.id)}
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                                  businessLogo
                                    ? logoTheme === "dark"
                                      ? "bg-white border border-gray-200"
                                      : logoTheme === "light"
                                        ? "bg-gray-900"
                                        : "bg-white border border-gray-200"
                                    : isPerson
                                      ? "bg-purple-500"
                                      : "bg-blue-500"
                                }`}
                              >
                                {businessLogo || row.profilePicture ? (
                                  <img
                                    src={businessLogo || row.profilePicture || undefined}
                                    alt={row.name}
                                    className="w-full h-full rounded-full object-contain p-1"
                                  />
                                ) : (
                                  <span>{initials}</span>
                                )}
                              </div>
                              <span className="text-sm font-medium text-gray-900">{row.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <TypeBadge type={row.type} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              {row.phone && (
                                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                                  {row.phone}
                                </div>
                              )}
                              {row.email && (
                                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                                  {row.email}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              {row.role && (
                                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                  <User className="w-3.5 h-3.5 text-gray-400" />
                                  {row.role}
                                </div>
                              )}
                              {row.address && (
                                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                  {row.address}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRowClick(row.id);
                                }}
                                className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="View Contact"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => handleEdit(e, row.id)}
                                className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Edit Contact"
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
        )}

        {/* Grid View */}
        {view === "grid" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRows.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">
                  {searchTerm
                    ? "No contacts found matching your search."
                    : "No contacts yet. Add your first contact to get started."}
                </p>
              </div>
            ) : (
              filteredRows.map((contact, index) => (
                <div
                  key={contact.id}
                  style={{
                    animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`,
                  }}
                >
                  <ContactCard contact={contact} workspaceId={workspace_id} />
                </div>
              ))
            )}
          </div>
        )}

        {/* Results Summary */}
        {filteredRows.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredRows.length} of {rows.length} contacts
          </div>
        )}
      </div>

      {/* Add Contact Dialog */}
      {addDialogOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setAddDialogOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Add New Contact</h2>
            <p className="text-gray-600 mb-6">Choose the type of contact to create</p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setAddDialogOpen(false);
                  router.push(`/app/${workspace_id}/contacts/create-business`);
                }}
                className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg hover:from-blue-100 hover:to-blue-200 hover:border-blue-300 transition-all duration-200"
              >
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900">Add Business</p>
                  <p className="text-sm text-gray-600">Create a business contact</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setAddDialogOpen(false);
                  router.push(`/app/${workspace_id}/contacts/create-employee`);
                }}
                className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-200 rounded-lg hover:from-purple-100 hover:to-purple-200 hover:border-purple-300 transition-all duration-200"
              >
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900">Add Employee</p>
                  <p className="text-sm text-gray-600">Create a person contact</p>
                </div>
              </button>
            </div>

            <button
              onClick={() => setAddDialogOpen(false)}
              className="w-full mt-4 px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
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

function TypeBadge({ type }: { type: string }) {
  const isPerson = type === "PERSON";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
        isPerson
          ? "bg-purple-100 text-purple-700 border-purple-200"
          : "bg-blue-100 text-blue-700 border-blue-200"
      }`}
    >
      {isPerson ? <User className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
      {isPerson ? "Person" : "Business"}
    </span>
  );
}
