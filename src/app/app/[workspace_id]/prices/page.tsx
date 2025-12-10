"use client";

import { PriceType } from "@/graphql/graphql";
import { AutoCompleteSelect } from "@/ui/AutoCompleteSelect";
import { GeneratedImage } from "@/ui/GeneratedImage";
import { AddNewPriceDialog } from "@/ui/prices/AddNewPriceDialog";
import {
  useListPriceBooksQuery,
  useListPricesQuery,
  type RentalPriceFields,
  type SalePriceFields,
} from "@/ui/prices/api";
import { DeletePriceDialog } from "@/ui/prices/DeletePriceDialog";
import { EditRentalPriceDialog } from "@/ui/prices/EditRentalPriceDialog";
import { EditSalePriceDialog } from "@/ui/prices/EditSalePriceDialog";
import { NewPriceBookDialog } from "@/ui/prices/NewPriceBookDialog";
import { useDialogs } from "@toolpad/core/useDialogs";
import {
  ArrowUpDown,
  BookOpen,
  Building2,
  Calendar,
  Eye,
  Hash,
  MapPin,
  Pencil,
  Plus,
  Search,
  ShoppingCart,
  Tag,
  Trash2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

type Tab = "prices" | "price-books";

export default function PricingPage() {
  const { workspace_id } = useParams<{ workspace_id: string }>();
  const router = useRouter();
  const dialogs = useDialogs();

  // Tab state with localStorage persistence
  const [activeTab, setActiveTab] = React.useState<Tab>("prices");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [sortField, setSortField] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("desc");

  // Prices tab filters
  const [selectedPriceBook, setSelectedPriceBook] = React.useState<string>("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("");
  const [selectedClass, setSelectedClass] = React.useState<string>("");
  const [selectedPriceTypes, setSelectedPriceTypes] = React.useState<PriceType[]>([]);

  // Dialog state for AddNewPriceDialog
  const [addPriceDialogOpen, setAddPriceDialogOpen] = React.useState(false);

  // State for edit dialogs
  const [editingRentalPrice, setEditingRentalPrice] = React.useState<RentalPriceFields | null>(
    null,
  );
  const [editingSalePrice, setEditingSalePrice] = React.useState<SalePriceFields | null>(null);

  // State for delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deletePriceId, setDeletePriceId] = React.useState<string | null>(null);
  const [deletePriceName, setDeletePriceName] = React.useState<string>("");
  const [deletePriceCategory, setDeletePriceCategory] = React.useState<string>("");
  const [deletePriceType, setDeletePriceType] = React.useState<string>("");

  // Load tab preference from localStorage
  React.useEffect(() => {
    const savedTab = localStorage.getItem("pricing-tab");
    if (savedTab === "prices" || savedTab === "price-books") {
      setActiveTab(savedTab);
    }
  }, []);

  // Save tab preference to localStorage
  const handleTabChange = (newTab: Tab) => {
    setActiveTab(newTab);
    localStorage.setItem("pricing-tab", newTab);
    setSearchTerm(""); // Reset search when switching tabs
  };

  // Fetch prices data
  const {
    data: pricesData,
    loading: pricesLoading,
    error: pricesError,
  } = useListPricesQuery({
    variables: {
      workspaceId: workspace_id,
      page: { number: 1, size: 1000 },
      ...(selectedPriceBook ? { priceBookId: selectedPriceBook } : {}),
      ...(selectedCategory ? { pimCategoryId: selectedCategory } : {}),
      ...(selectedClass ? { name: selectedClass } : {}),
      ...(selectedPriceTypes.length === 1 ? { priceType: selectedPriceTypes[0] } : {}),
      shouldListPriceBooks: true,
    },
    fetchPolicy: "cache-and-network",
  });

  // Fetch price books data
  const {
    data: priceBooksData,
    loading: priceBooksLoading,
    error: priceBooksError,
  } = useListPriceBooksQuery({
    variables: {
      page: { size: 100 },
      filter: { workspaceId: workspace_id },
    },
    fetchPolicy: "cache-and-network",
  });

  // Transform prices data
  const pricesRows = React.useMemo(() => {
    if (!pricesData?.listPrices?.items) return [];
    return pricesData.listPrices.items.map((item: any) => ({
      id: item.id,
      type: item.__typename,
      name: item.name,
      pimCategoryId: item.pimCategoryId,
      pimCategoryName: item.pimCategoryName,
      priceBookId: item.priceBook?.id || "",
      priceBookName: item.priceBook?.name || "Custom Prices",
      pricePerDayInCents: item.pricePerDayInCents,
      pricePerWeekInCents: item.pricePerWeekInCents,
      pricePerMonthInCents: item.pricePerMonthInCents,
      unitCostInCents: item.unitCostInCents,
      priceType: item.priceType,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
  }, [pricesData]);

  // Transform price books data
  const priceBooksRows = React.useMemo(() => {
    if (!priceBooksData?.listPriceBooks?.items) return [];
    return priceBooksData.listPriceBooks.items.map((item) => ({
      id: item.id,
      name: item.name,
      parentPriceBookName: item.parentPriceBook?.name || "",
      businessContactName: item.businessContact?.name || "",
      projectName: item.project?.name || "",
      location: item.location || "",
      createdBy: item.createdByUser
        ? `${item.createdByUser.firstName} ${item.createdByUser.lastName}`
        : "",
      updatedAt: item.updatedAt,
    }));
  }, [priceBooksData]);

  // Filter and sort prices
  const filteredPrices = React.useMemo(() => {
    let filtered = pricesRows;

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter((row) =>
        Object.values(row).some((value) => (value ?? "").toString().toLowerCase().includes(lower)),
      );
    }

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
  }, [pricesRows, searchTerm, sortField, sortDirection]);

  // Filter and sort price books
  const filteredPriceBooks = React.useMemo(() => {
    let filtered = priceBooksRows;

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter((row) =>
        Object.values(row).some((value) => (value ?? "").toString().toLowerCase().includes(lower)),
      );
    }

    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortField as keyof typeof a];
        const bValue = b[sortField as keyof typeof b];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        const aStr = String(aValue);
        const bStr = String(bValue);
        return sortDirection === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
      });
    }

    return filtered;
  }, [priceBooksRows, searchTerm, sortField, sortDirection]);

  // Calculate stats
  const stats = React.useMemo(() => {
    const totalPrices = pricesRows.length;
    const rentalPrices = pricesRows.filter((r) => r.priceType === PriceType.Rental).length;
    const salePrices = pricesRows.filter((r) => r.priceType === PriceType.Sale).length;
    const totalPriceBooks = priceBooksRows.length;
    return { totalPrices, rentalPrices, salePrices, totalPriceBooks };
  }, [pricesRows, priceBooksRows]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handlePriceRowClick = (priceBookId: string | null) => {
    if (priceBookId) {
      router.push(`/app/${workspace_id}/prices/price-books/${priceBookId}`);
    }
  };

  const handlePriceBookRowClick = (priceBookId: string) => {
    router.push(`/app/${workspace_id}/prices/price-books/${priceBookId}`);
  };

  const handleEditPrice = (price: any) => {
    if (price.type === "RentalPrice") {
      setEditingRentalPrice(price as RentalPriceFields);
    } else if (price.type === "SalePrice") {
      setEditingSalePrice(price as SalePriceFields);
    }
  };

  const handleDeletePrice = (price: any) => {
    setDeletePriceId(price.id);
    setDeletePriceName(price.name || "");
    setDeletePriceCategory(price.pimCategoryName || "");
    setDeletePriceType(price.type === "RentalPrice" ? "Rental" : "Sale");
    setDeleteDialogOpen(true);
  };

  const handleDeleteSuccess = () => {
    setDeleteDialogOpen(false);
    setDeletePriceId(null);
    setDeletePriceName("");
    setDeletePriceCategory("");
    setDeletePriceType("");
  };

  const isLoading = activeTab === "prices" ? pricesLoading : priceBooksLoading;

  if (isLoading && !pricesData && !priceBooksData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="container mx-auto max-w-7xl">
          <p className="text-gray-600">Loading pricing data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-7xl px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pricing</h1>
          <p className="text-gray-600">Manage prices and price books</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            icon={<Hash className="w-5 h-5" />}
            label="Total Prices"
            value={stats.totalPrices.toString()}
            iconBgColor="bg-gray-100"
            iconColor="text-gray-600"
          />
          <StatsCard
            icon={<Calendar className="w-5 h-5" />}
            label="Rental Prices"
            value={stats.rentalPrices.toString()}
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
          />
          <StatsCard
            icon={<ShoppingCart className="w-5 h-5" />}
            label="Sale Prices"
            value={stats.salePrices.toString()}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
          />
          <StatsCard
            icon={<BookOpen className="w-5 h-5" />}
            label="Price Books"
            value={stats.totalPriceBooks.toString()}
            iconBgColor="bg-purple-100"
            iconColor="text-purple-600"
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => handleTabChange("prices")}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "prices"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                All Prices
              </button>
              <button
                onClick={() => handleTabChange("price-books")}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "price-books"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                Price Books
              </button>
            </nav>
          </div>

          {/* Search and Actions Bar */}
          <div className="p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
              <div className="relative flex-1 w-full lg:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab === "prices" ? "prices" : "price books"}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div className="flex gap-2 flex-shrink-0 overflow-x-auto items-center">
                {activeTab === "prices" && (
                  <>
                    {/* Price Book Filter */}
                    <AutoCompleteSelect
                      className="w-56"
                      placeholder="All Price Books"
                      value={selectedPriceBook}
                      onChange={setSelectedPriceBook}
                      options={[
                        ...(pricesData?.listPriceBooks?.items?.map((book: any) => ({
                          value: book.id,
                          label: book.name,
                          icon: <BookOpen className="w-4 h-4 text-purple-600" />,
                        })) || []),
                      ]}
                    />

                    {/* Category Filter */}
                    <AutoCompleteSelect
                      className="w-56"
                      placeholder="All Categories"
                      value={selectedCategory}
                      onChange={(value) => {
                        setSelectedCategory(value);
                        setSelectedClass("");
                      }}
                      options={[
                        ...(pricesData?.listPriceBookCategories?.map((cat: any) => ({
                          value: cat.id,
                          label: cat.name,
                          icon: <Tag className="w-4 h-4 text-blue-600" />,
                        })) || []),
                      ]}
                    />

                    {/* Price Type Filter */}
                    <AutoCompleteSelect
                      className="w-40"
                      placeholder="All Types"
                      value={selectedPriceTypes.length === 1 ? selectedPriceTypes[0] : ""}
                      onChange={(value) => {
                        setSelectedPriceTypes(value ? [value as PriceType] : []);
                      }}
                      options={[
                        {
                          value: PriceType.Rental,
                          label: "Rental",
                          icon: <Calendar className="w-4 h-4 text-green-600" />,
                        },
                        {
                          value: PriceType.Sale,
                          label: "Sale",
                          icon: <ShoppingCart className="w-4 h-4 text-blue-600" />,
                        },
                      ]}
                    />

                    <button
                      onClick={() => setAddPriceDialogOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      New Price
                    </button>
                  </>
                )}
                {activeTab === "price-books" && (
                  <button
                    onClick={() => dialogs.open(NewPriceBookDialog)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    New Price Book
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Prices Tab Content */}
        {activeTab === "prices" && (
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
                        onClick={() => handleSort("priceType")}
                        className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900"
                      >
                        Type
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Price Book
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Pricing
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPrices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        {searchTerm
                          ? "No prices found matching your search."
                          : "No prices yet. Add your first price to get started."}
                      </td>
                    </tr>
                  ) : (
                    filteredPrices.map((row) => (
                      <tr
                        key={row.id}
                        onClick={() => handlePriceRowClick(row.priceBookId)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <GeneratedImage
                              entity="price"
                              entityId={row.id}
                              size="list"
                              lazy={true}
                              className="rounded-lg"
                              width={40}
                              height={40}
                              alt={row.name}
                              showIllustrativeBanner={false}
                            />
                            <span
                              className="text-sm font-medium text-gray-900 truncate max-w-xs"
                              title={row.name}
                            >
                              {row.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <PriceTypeBadge type={row.priceType} />
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">
                            {row.pimCategoryName || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (row.priceBookId) {
                                router.push(
                                  `/app/${workspace_id}/prices/price-books/${row.priceBookId}`,
                                );
                              }
                            }}
                            className={`text-sm truncate max-w-xs block ${
                              row.priceBookId
                                ? "text-blue-600 hover:underline"
                                : "text-gray-600 cursor-default"
                            }`}
                            title={row.priceBookName}
                          >
                            {row.priceBookName}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            {row.pricePerDayInCents != null && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                <span className="font-semibold">1D</span>
                                <span className="text-gray-900">
                                  ${(row.pricePerDayInCents / 100).toFixed(0)}
                                </span>
                              </span>
                            )}
                            {row.pricePerWeekInCents != null && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                <span className="font-semibold">7D</span>
                                <span className="text-gray-900">
                                  ${(row.pricePerWeekInCents / 100).toFixed(0)}
                                </span>
                              </span>
                            )}
                            {row.pricePerMonthInCents != null && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                <span className="font-semibold">28D</span>
                                <span className="text-gray-900">
                                  ${(row.pricePerMonthInCents / 100).toFixed(0)}
                                </span>
                              </span>
                            )}
                            {row.unitCostInCents != null && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                <span className="font-semibold">Unit</span>
                                <span className="text-gray-900">
                                  ${(row.unitCostInCents / 100).toFixed(0)}
                                </span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditPrice(row);
                              }}
                              className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit Price"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePrice(row);
                              }}
                              className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete Price"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Price Books Tab Content */}
        {activeTab === "price-books" && (
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
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Business Contact
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left">
                      <button
                        onClick={() => handleSort("updatedAt")}
                        className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900"
                      >
                        Updated
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPriceBooks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        {searchTerm
                          ? "No price books found matching your search."
                          : "No price books yet. Create your first price book to get started."}
                      </td>
                    </tr>
                  ) : (
                    filteredPriceBooks.map((row) => (
                      <tr
                        key={row.id}
                        onClick={() => handlePriceBookRowClick(row.id)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-100 text-purple-600">
                              <BookOpen className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">{row.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            {row.businessContactName && (
                              <>
                                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                                {row.businessContactName}
                              </>
                            )}
                            {!row.businessContactName && "-"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">{row.projectName || "-"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            {row.location && (
                              <>
                                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                {row.location}
                              </>
                            )}
                            {!row.location && "-"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">
                            {row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePriceBookRowClick(row.id);
                              }}
                              className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="View Price Book"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Results Summary */}
        {((activeTab === "prices" && filteredPrices.length > 0) ||
          (activeTab === "price-books" && filteredPriceBooks.length > 0)) && (
          <div className="mt-4 text-sm text-gray-600">
            {activeTab === "prices"
              ? `Showing ${filteredPrices.length} of ${pricesRows.length} prices`
              : `Showing ${filteredPriceBooks.length} of ${priceBooksRows.length} price books`}
          </div>
        )}
      </div>

      {/* Add Price Dialog */}
      {addPriceDialogOpen && (
        <AddNewPriceDialog
          open={addPriceDialogOpen}
          onClose={() => setAddPriceDialogOpen(false)}
          priceBookId={selectedPriceBook}
          onSuccess={() => setAddPriceDialogOpen(false)}
        />
      )}

      {/* Edit Rental Price Dialog */}
      {editingRentalPrice && (
        <EditRentalPriceDialog
          open={!!editingRentalPrice}
          onClose={() => setEditingRentalPrice(null)}
          price={editingRentalPrice}
          onSuccess={() => setEditingRentalPrice(null)}
        />
      )}

      {/* Edit Sale Price Dialog */}
      {editingSalePrice && (
        <EditSalePriceDialog
          open={!!editingSalePrice}
          onClose={() => setEditingSalePrice(null)}
          price={editingSalePrice}
          onSuccess={() => setEditingSalePrice(null)}
        />
      )}

      {/* Delete Price Dialog */}
      <DeletePriceDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        priceId={deletePriceId}
        priceName={deletePriceName}
        priceCategory={deletePriceCategory}
        priceType={deletePriceType}
        onSuccess={handleDeleteSuccess}
      />
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

function PriceTypeBadge({ type }: { type: string }) {
  const isRental = type === PriceType.Rental;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
        isRental
          ? "bg-green-100 text-green-700 border-green-200"
          : "bg-blue-100 text-blue-700 border-blue-200"
      }`}
    >
      {isRental ? <Calendar className="w-3 h-3" /> : <ShoppingCart className="w-3 h-3" />}
      {isRental ? "Rental" : "Sale"}
    </span>
  );
}
