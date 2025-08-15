import { InventoryStatus } from "@/graphql/graphql";

export interface GroupedInventoryItem {
  lineItemId: string | null;
  categoryName: string | null;
  productName: string | null;
  productModel: string | null;
  totalCount: number;
  receivedCount: number;
  onOrderCount: number;
  fulfillmentPercentage: number;
  items: any[];
}

export function groupInventoryByLineItem(items: any[]): GroupedInventoryItem[] {
  const grouped = new Map<string, GroupedInventoryItem>();

  items.forEach((item) => {
    const lineItemId = item.purchaseOrderLineItemId || "no-line-item";

    if (!grouped.has(lineItemId)) {
      // Extract product/category info from the line item or the inventory item itself
      const lineItem = item.purchaseOrderLineItem;
      const categoryName = lineItem?.so_pim_category?.name || item.pimCategoryName;
      const productName = lineItem?.so_pim_product?.name || item.asset?.pim_product_name;
      const productModel = lineItem?.so_pim_product?.model;

      grouped.set(lineItemId, {
        lineItemId: item.purchaseOrderLineItemId,
        categoryName,
        productName,
        productModel,
        totalCount: 0,
        receivedCount: 0,
        onOrderCount: 0,
        fulfillmentPercentage: 0,
        items: [],
      });
    }

    const group = grouped.get(lineItemId)!;
    group.items.push(item);
    group.totalCount++;

    if (item.status === InventoryStatus.Received) {
      group.receivedCount++;
    } else if (item.status === InventoryStatus.OnOrder) {
      group.onOrderCount++;
    }
  });

  // Calculate fulfillment percentage for each group
  grouped.forEach((group) => {
    if (group.totalCount > 0) {
      group.fulfillmentPercentage = Math.round((group.receivedCount / group.totalCount) * 100);
    }
  });

  // Convert to array and sort by line item ID
  return Array.from(grouped.values()).sort((a, b) => {
    if (!a.lineItemId) return 1;
    if (!b.lineItemId) return -1;
    return a.lineItemId.localeCompare(b.lineItemId);
  });
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return "-";

  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "-";

  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  } catch {
    return dateString;
  }
}

export function getItemDescription(item: any): string {
  // Try to get the most descriptive name for the item
  if (item.purchaseOrderLineItem?.so_pim_product?.name) {
    return item.purchaseOrderLineItem.so_pim_product.name;
  }
  if (item.purchaseOrderLineItem?.so_pim_category?.name) {
    return item.purchaseOrderLineItem.so_pim_category.name;
  }
  if (item.pimCategoryName) {
    return item.pimCategoryName;
  }
  if (item.asset?.pim_product_name) {
    return item.asset.pim_product_name;
  }
  if (item.asset?.name) {
    return item.asset.name;
  }
  return "Unknown Item";
}
