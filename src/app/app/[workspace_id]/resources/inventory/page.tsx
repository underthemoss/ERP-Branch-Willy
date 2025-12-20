"use client";

import { graphql } from "@/graphql";
import { InventoryStatus, PoLineItemStatus, PurchaseOrderStatus } from "@/graphql/graphql";
import { useListResourcesInventoryQuery } from "@/graphql/hooks";
import {
  ArrowUpDown,
  Calendar,
  Check,
  Clock,
  ExternalLink,
  Filter,
  Package,
  Search,
  ShoppingCart,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import * as React from "react";

// Query to get all purchase orders with their line items for the workspace (buyer)
graphql(`
  query ListResourcesInventory($workspaceId: String!, $limit: Int, $offset: Int) {
    listPurchaseOrders(workspaceId: $workspaceId, limit: $limit, offset: $offset) {
      items {
        id
        purchase_order_number
        status
        seller_id
        seller {
          ... on BusinessContact {
            id
            name
          }
          ... on PersonContact {
            id
            name
          }
        }
        created_at
        fulfillmentProgress {
          fulfillmentPercentage
          isFullyFulfilled
          isPartiallyFulfilled
          onOrderItems
          receivedItems
          totalItems
          status
        }
        line_items {
          ... on RentalPurchaseOrderLineItem {
            id
            lineitem_type
            lineitem_status
            po_quantity
            po_pim_id
            delivery_date
            off_rent_date
            delivery_location
            delivery_method
            so_pim_product {
              name
              model
              sku
              year
            }
            so_pim_category {
              id
              name
              path
            }
            price {
              ... on RentalPrice {
                pricePerDayInCents
                pricePerWeekInCents
                pricePerMonthInCents
              }
            }
            inventory {
              id
              status
              assetId
              receivedAt
              conditionOnReceipt
            }
            purchaseOrder {
              id
              purchase_order_number
            }
          }
          ... on SalePurchaseOrderLineItem {
            id
            lineitem_type
            lineitem_status
            po_quantity
            po_pim_id
            delivery_date
            delivery_location
            delivery_method
            so_pim_product {
              name
              model
              sku
              year
            }
            so_pim_category {
              id
              name
              path
            }
            price {
              ... on SalePrice {
                unitCostInCents
              }
            }
            inventory {
              id
              status
              assetId
              receivedAt
              conditionOnReceipt
            }
            purchaseOrder {
              id
              purchase_order_number
            }
          }
        }
      }
      total
      limit
      offset
    }
  }
`);

// Types for processed inventory items
interface InventoryItem {
  id: string;
  lineItemId: string;
  productName: string;
  categoryName: string;
  categoryPath: string;
  model: string | null;
  sku: string | null;
  year: string | null;
  quantity: number;
  type: "RENTAL" | "SALE";
  lineItemStatus: PoLineItemStatus;
  purchaseOrderStatus: PurchaseOrderStatus;
  purchaseOrderId: string;
  purchaseOrderNumber: string;
  sellerName: string;
  deliveryDate: string | null;
  deliveryLocation: string | null;
  offRentDate: string | null;
  // Inventory tracking
  inventoryCount: number;
  receivedCount: number;
  onOrderCount: number;
  // Computed status for display
  displayStatus: "DRAFT" | "ON_ORDER" | "PARTIALLY_RECEIVED" | "RECEIVED" | "ACTIVE" | "RETURNED";
}

function getDisplayStatus(item: InventoryItem): InventoryItem["displayStatus"] {
  // If PO is still draft, show as draft
  if (item.purchaseOrderStatus === PurchaseOrderStatus.Draft) {
    return "DRAFT";
  }

  // If PO is submitted, check inventory status
  if (item.inventoryCount === 0) {
    return "ON_ORDER";
  }

  if (item.receivedCount === 0) {
    return "ON_ORDER";
  }

  if (item.receivedCount < item.quantity) {
    return "PARTIALLY_RECEIVED";
  }

  // For rentals, check if active or returned
  if (item.type === "RENTAL") {
    if (item.offRentDate) {
      const offRentDate = new Date(item.offRentDate);
      if (offRentDate <= new Date()) {
        return "RETURNED";
      }
    }
    return "ACTIVE";
  }

  return "RECEIVED";
}

function getStatusBadge(status: InventoryItem["displayStatus"]) {
  const badges: Record<
    InventoryItem["displayStatus"],
    { bg: string; text: string; icon: React.ReactNode; label: string }
  > = {
    DRAFT: {
      bg: "bg-gray-100",
      text: "text-gray-700",
      icon: <Clock className="w-3 h-3" />,
      label: "Draft",
    },
    ON_ORDER: {
      bg: "bg-amber-100",
      text: "text-amber-700",
      icon: <Truck className="w-3 h-3" />,
      label: "On Order",
    },
    PARTIALLY_RECEIVED: {
      bg: "bg-blue-100",
      text: "text-blue-700",
      icon: <Package className="w-3 h-3" />,
      label: "Partially Received",
    },
    RECEIVED: {
      bg: "bg-green-100",
      text: "text-green-700",
      icon: <Check className="w-3 h-3" />,
      label: "Received",
    },
    ACTIVE: {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      icon: <Calendar className="w-3 h-3" />,
      label: "Active Rental",
    },
    RETURNED: {
      bg: "bg-purple-100",
      text: "text-purple-700",
      icon: <Check className="w-3 h-3" />,
      label: "Returned",
    },
  };

  const badge = badges[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}
    >
      {badge.icon}
      {badge.label}
    </span>
  );
}

function getTypeBadge(type: "RENTAL" | "SALE") {
  if (type === "RENTAL") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
        <Calendar className="w-3 h-3" />
        Rental
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-violet-50 text-violet-700">
      <ShoppingCart className="w-3 h-3" />
      Purchase
    </span>
  );
}

export default function ResourcesInventoryPage() {
  const params = useParams();
  const workspaceId = params.workspace_id as string;

  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [typeFilter, setTypeFilter] = React.useState<string>("ALL");

  const { data, loading, error } = useListResourcesInventoryQuery({
    variables: { workspaceId, limit: 100, offset: 0 },
    fetchPolicy: "cache-and-network",
    skip: !workspaceId,
  });

  // Process the data into inventory items
  const inventoryItems = React.useMemo<InventoryItem[]>(() => {
    if (!data?.listPurchaseOrders?.items) return [];

    const items: InventoryItem[] = [];

    for (const po of data.listPurchaseOrders.items) {
      if (!po.line_items) continue;

      for (const lineItem of po.line_items) {
        if (!lineItem) continue;

        const isRental = lineItem.__typename === "RentalPurchaseOrderLineItem";
        const productName =
          lineItem.so_pim_product?.name || lineItem.so_pim_category?.name || "Unknown Product";
        const sellerName =
          po.seller?.__typename === "BusinessContact" || po.seller?.__typename === "PersonContact"
            ? po.seller.name
            : "Unknown Seller";

        // Count inventory items by status
        const inventoryCount = lineItem.inventory?.length || 0;
        const receivedCount =
          lineItem.inventory?.filter((inv) => inv.status === "RECEIVED").length || 0;
        const onOrderCount =
          lineItem.inventory?.filter((inv) => inv.status === "ON_ORDER").length || 0;

        const item: InventoryItem = {
          id: `${po.id}-${lineItem.id}`,
          lineItemId: lineItem.id,
          productName,
          categoryName: lineItem.so_pim_category?.name || "",
          categoryPath: lineItem.so_pim_category?.path || "",
          model: lineItem.so_pim_product?.model || null,
          sku: lineItem.so_pim_product?.sku || null,
          year: lineItem.so_pim_product?.year || null,
          quantity: lineItem.po_quantity || 1,
          type: isRental ? "RENTAL" : "SALE",
          lineItemStatus: lineItem.lineitem_status || PoLineItemStatus.Draft,
          purchaseOrderStatus: po.status,
          purchaseOrderId: po.id,
          purchaseOrderNumber: po.purchase_order_number,
          sellerName,
          deliveryDate: lineItem.delivery_date || null,
          deliveryLocation: lineItem.delivery_location || null,
          offRentDate: isRental ? lineItem.off_rent_date : null,
          inventoryCount,
          receivedCount,
          onOrderCount,
          displayStatus: "DRAFT", // Will be computed below
        };

        item.displayStatus = getDisplayStatus(item);
        items.push(item);
      }
    }

    return items;
  }, [data]);

  // Filter items based on search and filters
  const filteredItems = React.useMemo(() => {
    return inventoryItems.filter((item) => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          item.productName.toLowerCase().includes(search) ||
          item.categoryName.toLowerCase().includes(search) ||
          item.purchaseOrderNumber.toLowerCase().includes(search) ||
          item.sellerName.toLowerCase().includes(search) ||
          item.sku?.toLowerCase().includes(search) ||
          item.model?.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== "ALL") {
        if (statusFilter === "ON_ORDER" && item.displayStatus !== "ON_ORDER") return false;
        if (statusFilter === "RECEIVED" && item.displayStatus !== "RECEIVED") return false;
        if (statusFilter === "ACTIVE" && item.displayStatus !== "ACTIVE") return false;
        if (statusFilter === "DRAFT" && item.displayStatus !== "DRAFT") return false;
        if (statusFilter === "PARTIALLY_RECEIVED" && item.displayStatus !== "PARTIALLY_RECEIVED")
          return false;
        if (statusFilter === "RETURNED" && item.displayStatus !== "RETURNED") return false;
      }

      // Type filter
      if (typeFilter !== "ALL") {
        if (typeFilter === "RENTALS" && item.type !== "RENTAL") return false;
        if (typeFilter === "PURCHASES" && item.type !== "SALE") return false;
      }

      return true;
    });
  }, [inventoryItems, searchTerm, statusFilter, typeFilter]);

  // Calculate stats
  const stats = React.useMemo(() => {
    const totalItems = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
    const activeRentals = inventoryItems
      .filter((item) => item.type === "RENTAL" && item.displayStatus === "ACTIVE")
      .reduce((sum, item) => sum + item.quantity, 0);
    const ownedEquipment = inventoryItems
      .filter((item) => item.type === "SALE" && item.displayStatus === "RECEIVED")
      .reduce((sum, item) => sum + item.quantity, 0);
    const pendingDelivery = inventoryItems
      .filter(
        (item) => item.displayStatus === "ON_ORDER" || item.displayStatus === "PARTIALLY_RECEIVED",
      )
      .reduce((sum, item) => sum + item.quantity, 0);

    return { totalItems, activeRentals, ownedEquipment, pendingDelivery };
  }, [inventoryItems]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-7xl px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Resources Inventory</h1>
          <p className="text-gray-600">
            View and manage your purchased and rented equipment from all orders
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            icon={<Package className="w-5 h-5" />}
            label="Total Items"
            value={loading ? "--" : stats.totalItems.toString()}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
          />
          <StatsCard
            icon={<Calendar className="w-5 h-5" />}
            label="Active Rentals"
            value={loading ? "--" : stats.activeRentals.toString()}
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
          />
          <StatsCard
            icon={<ShoppingCart className="w-5 h-5" />}
            label="Owned Equipment"
            value={loading ? "--" : stats.ownedEquipment.toString()}
            iconBgColor="bg-purple-100"
            iconColor="text-purple-600"
          />
          <StatsCard
            icon={<Truck className="w-5 h-5" />}
            label="Pending Delivery"
            value={loading ? "--" : stats.pendingDelivery.toString()}
            iconBgColor="bg-amber-100"
            iconColor="text-amber-600"
          />
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 gap-3 w-full sm:w-auto">
              {/* Search Input */}
              <div className="relative flex-1 sm:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search inventory..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="ON_ORDER">On Order</option>
                <option value="PARTIALLY_RECEIVED">Partially Received</option>
                <option value="RECEIVED">Received</option>
                <option value="ACTIVE">Active Rental</option>
                <option value="RETURNED">Returned</option>
              </select>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Types</option>
                <option value="RENTALS">Rentals</option>
                <option value="PURCHASES">Purchases</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">Error loading inventory: {error.message}</p>
          </div>
        )}

        {/* Inventory Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900 cursor-pointer">
                      Product
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900 cursor-pointer">
                      Status
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Delivery
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                        <p className="text-sm">Loading inventory...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <Package className="w-12 h-12 mb-4 text-gray-300" />
                        <p className="text-lg font-medium mb-1">
                          {inventoryItems.length === 0
                            ? "No inventory items yet"
                            : "No matching items"}
                        </p>
                        <p className="text-sm">
                          {inventoryItems.length === 0
                            ? "Items from your purchase orders will appear here once created."
                            : "Try adjusting your search or filters."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{item.productName}</p>
                          {(item.model || item.sku) && (
                            <p className="text-xs text-gray-500">
                              {item.model && `Model: ${item.model}`}
                              {item.model && item.sku && " • "}
                              {item.sku && `SKU: ${item.sku}`}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">{getTypeBadge(item.type)}</td>
                      <td className="px-4 py-3">{getStatusBadge(item.displayStatus)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{item.quantity}</span>
                          {item.inventoryCount > 0 && (
                            <span className="text-xs text-gray-500">
                              {item.receivedCount}/{item.quantity} received
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-700">{item.sellerName}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/app/${workspaceId}/purchase-orders/${item.purchaseOrderId}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium"
                        >
                          {item.purchaseOrderNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {item.deliveryDate ? (
                          <span className="text-gray-700 text-sm">
                            {new Date(item.deliveryDate).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">Not scheduled</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/app/${workspaceId}/purchase-orders/${item.purchaseOrderId}`}
                          className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700"
                          title="View Order"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Results count */}
          {!loading && filteredItems.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing {filteredItems.length} of {inventoryItems.length} items
              </p>
            </div>
          )}
        </div>

        {/* Info Banner */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Filter className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">About Resources Inventory</h3>
              <p className="text-sm text-blue-700 mt-1">
                This view shows line items from your purchase orders where your organization is the
                buyer. Items progress from <strong>Draft</strong> → <strong>On Order</strong> (when
                PO is submitted) → <strong>Received</strong> (when inventory is marked as received).
                Rentals show as <strong>Active</strong> while on rent and <strong>Returned</strong>{" "}
                when the rental period ends.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stats Card Component
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
