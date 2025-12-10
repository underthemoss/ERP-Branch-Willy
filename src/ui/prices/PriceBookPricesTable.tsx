"use client";

import { PriceType } from "@/graphql/graphql";
import { useSelectedWorkspaceId } from "@/providers/WorkspaceProvider";
import { AutoCompleteSelect } from "@/ui/AutoCompleteSelect";
import { GeneratedImage } from "@/ui/GeneratedImage";
import { useListPricesQuery, type RentalPriceFields, type SalePriceFields } from "@/ui/prices/api";
import {
  ArrowUpDown,
  Calendar,
  Copy,
  Pencil,
  Plus,
  Search,
  ShoppingCart,
  Tag,
  Trash2,
} from "lucide-react";
import { useParams } from "next/navigation";
import * as React from "react";
import { AddNewPriceDialog } from "./AddNewPriceDialog";
import { DeletePriceDialog } from "./DeletePriceDialog";
import { DuplicatePriceDialog } from "./DuplicatePriceDialog";
import { EditRentalPriceDialog } from "./EditRentalPriceDialog";
import { EditSalePriceDialog } from "./EditSalePriceDialog";

function formatCentsToUSD(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function PricesTable() {
  const workspaceId = useSelectedWorkspaceId() as string;
  const { price_book_id } = useParams<{ price_book_id: string }>();

  // State for filters
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("");
  const [selectedClass, setSelectedClass] = React.useState<string>("");
  const [selectedPriceTypes, setSelectedPriceTypes] = React.useState<PriceType[]>([]);
  const [sortField, setSortField] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc");

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

  // State for duplicate dialog
  const [priceToDuplicate, setPriceToDuplicate] = React.useState<
    (RentalPriceFields | SalePriceFields) | null
  >(null);

  // State for Add Price dialog
  const [addDialogOpen, setAddDialogOpen] = React.useState(false);

  // Fetch prices
  const { data, loading, error } = useListPricesQuery({
    variables: {
      workspaceId,
      priceBookId: price_book_id,
      ...(selectedClass ? { name: selectedClass } : {}),
      ...(selectedCategory ? { pimCategoryId: selectedCategory } : {}),
      ...(selectedPriceTypes.length === 1 ? { priceType: selectedPriceTypes[0] } : {}),
      shouldListPriceBooks: false,
      page: {
        size: 1000,
      },
    },
    fetchPolicy: "cache-and-network",
  });

  // Categories for dropdown
  const allCategories = React.useMemo(() => {
    if (!data?.listPriceBookCategories) return [];
    return data.listPriceBookCategories.map((cat: { id: string; name: string }) => ({
      value: cat.id,
      label: cat.name,
      icon: <Tag className="w-4 h-4 text-blue-600" />,
    }));
  }, [data]);

  // Classes for dropdown
  const allClasses = React.useMemo(() => {
    if (!data?.listPriceNames) return [];
    return data.listPriceNames.filter(Boolean).map((name) => ({
      value: name,
      label: name,
    }));
  }, [data]);

  // Transform rows
  const rows = React.useMemo<(RentalPriceFields | SalePriceFields)[]>(() => {
    if (loading || !data?.listPrices?.items) return [];
    return data.listPrices.items.filter(
      (item) => item.__typename === "RentalPrice" || item.__typename === "SalePrice",
    ) as (RentalPriceFields | SalePriceFields)[];
  }, [data, loading]);

  // Filter and sort rows
  const filteredRows = React.useMemo(() => {
    let filtered = rows;

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
  }, [rows, searchTerm, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleEditPrice = (price: RentalPriceFields | SalePriceFields) => {
    if (price.__typename === "RentalPrice") {
      setEditingRentalPrice(price as RentalPriceFields);
    } else if (price.__typename === "SalePrice") {
      setEditingSalePrice(price as SalePriceFields);
    }
  };

  const handleDeletePrice = (price: RentalPriceFields | SalePriceFields) => {
    setDeletePriceId(price.id);
    setDeletePriceName(price.name || "");
    setDeletePriceCategory(price.pimCategoryName || "");
    setDeletePriceType(price.__typename === "RentalPrice" ? "Rental" : "Sale");
    setDeleteDialogOpen(true);
  };

  const handleDeleteSuccess = () => {
    setDeleteDialogOpen(false);
    setDeletePriceId(null);
    setDeletePriceName("");
    setDeletePriceCategory("");
    setDeletePriceType("");
  };

  const handleDuplicatePrice = (price: RentalPriceFields | SalePriceFields) => {
    setPriceToDuplicate(price);
  };

  return (
    <div>
      {/* Search and Filters Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          <div className="relative flex-1 w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search prices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <div className="flex gap-2 flex-shrink-0 overflow-x-auto items-center">
            <AutoCompleteSelect
              className="w-56"
              placeholder="All Categories"
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={allCategories}
            />
            <AutoCompleteSelect
              className="w-56"
              placeholder="All Classes"
              value={selectedClass}
              onChange={setSelectedClass}
              options={allClasses}
            />
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
              onClick={() => setAddDialogOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Add Price
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort("pimCategoryName")}
                  className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900"
                >
                  Image / Name
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort("pimCategoryName")}
                  className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900"
                >
                  Category
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort("name")}
                  className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900"
                >
                  Class
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Pricing
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort("createdAt")}
                  className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900"
                >
                  Created
                  <ArrowUpDown className="w-3 h-3" />
                </button>
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
          <tbody className="divide-y divide-gray-200 bg-white">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  Loading prices...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-red-600">
                  Error loading prices: {error.message}
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  {searchTerm
                    ? "No prices found matching your search."
                    : "No prices yet. Add your first price to get started."}
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
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
                        alt={row.name || "Price"}
                        showIllustrativeBanner={false}
                      />
                      <span
                        className="text-sm font-medium text-gray-900 truncate max-w-xs"
                        title={row.name || ""}
                      >
                        {row.name || "-"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">{row.pimCategoryName || "-"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">{row.name || "-"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {row.__typename === "RentalPrice" && (
                        <>
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
                        </>
                      )}
                      {row.__typename === "SalePrice" && row.unitCostInCents != null && (
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
                    <span className="text-sm text-gray-600">
                      {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">
                      {row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditPrice(row)}
                        className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit Price"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicatePrice(row)}
                        className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="Duplicate Price"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePrice(row)}
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

      {/* Results Summary */}
      {filteredRows.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Showing {filteredRows.length} of {rows.length} prices
          </p>
        </div>
      )}

      {/* Add Price Dialog */}
      <AddNewPriceDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        priceBookId={price_book_id}
        onSuccess={() => setAddDialogOpen(false)}
      />

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

      {/* Duplicate Price Dialog */}
      <DuplicatePriceDialog
        open={!!priceToDuplicate}
        onClose={() => setPriceToDuplicate(null)}
        price={priceToDuplicate}
        onSuccess={() => setPriceToDuplicate(null)}
      />

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
