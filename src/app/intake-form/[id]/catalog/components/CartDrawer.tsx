"use client";

import { GeneratedImage } from "@/ui/GeneratedImage";
import { RentalPricingBreakdown } from "@/ui/sales-quotes/RentalPricingBreakdown";
import { Calendar, Edit2, FileQuestion, Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { CartItem, useCart } from "../context/CartContext";
import EditItemDialog from "./EditItemDialog";

// Check if an item is a custom/unlisted item (no real price)
const isCustomItem = (item: CartItem): boolean => {
  return (
    item.priceId.startsWith("custom-") ||
    (!item.pricePerDayInCents && !item.unitCostInCents && !item.subtotalInCents)
  );
};

interface CartLineItemProps {
  item: CartItem;
  onEdit: (item: CartItem) => void;
  onSubtotalChange: (tempId: string, subtotalInCents: number) => void;
}

function CartLineItem({ item, onEdit, onSubtotalChange }: CartLineItemProps) {
  const cart = useCart();
  const isRental = item.priceType === "RENTAL";
  const lastSubtotalRef = useRef<number | undefined>(undefined);

  const formatPrice = (cents?: number): string => {
    if (!cents) return "$0.00";
    return `$${(cents / 100).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date?: Date): string => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getDurationDays = (): number => {
    if (!item.rentalStartDate || !item.rentalEndDate) return 0;
    const diffTime = Math.abs(item.rentalEndDate.getTime() - item.rentalStartDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Local state for subtotal to avoid re-render loops
  const [localSubtotal, setLocalSubtotal] = useState<number | undefined>(
    cart.itemSubtotals[item.tempId],
  );

  // Callback to update subtotal - only updates local state
  const handleTotalCalculated = (totalInCents: number) => {
    if (lastSubtotalRef.current !== totalInCents) {
      lastSubtotalRef.current = totalInCents;
      setLocalSubtotal(totalInCents);
    }
  };

  // Sync local subtotal to cart context via effect (debounced)
  useEffect(() => {
    if (localSubtotal !== undefined && localSubtotal !== cart.itemSubtotals[item.tempId]) {
      onSubtotalChange(item.tempId, localSubtotal);
    }
  }, [localSubtotal, item.tempId, onSubtotalChange, cart.itemSubtotals]);

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex gap-3">
        {/* Thumbnail Image */}
        <div className="w-14 h-14 flex-shrink-0 rounded-md overflow-hidden bg-gray-200">
          <GeneratedImage
            entity="price"
            entityId={item.priceId}
            size="list"
            alt={item.priceName}
            showIllustrativeBanner={false}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="min-w-0 pr-2">
              <h4 className="text-sm font-medium text-gray-900 truncate">{item.priceName}</h4>
              <p className="text-xs text-gray-500 truncate">{item.pimCategoryName}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => onEdit(item)}
                className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => cart.removeItem(item.tempId)}
                className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                title="Remove"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Price Type Badge */}
          <span
            className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded ${
              isRental ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
            }`}
          >
            {item.priceType}
          </span>

          {/* Details */}
          <div className="mt-2 space-y-1">
            {isRental ? (
              <>
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Calendar className="w-3 h-3" />
                  {item.rentalStartDate && item.rentalEndDate ? (
                    <span>
                      {formatDate(item.rentalStartDate)} - {formatDate(item.rentalEndDate)}
                      <span className="text-gray-400 ml-1">({getDurationDays()} days)</span>
                    </span>
                  ) : (
                    <span className="text-amber-600">Dates not set</span>
                  )}
                </div>

                {/* Rental Pricing Breakdown - only show if item has priceId and dates, or priceForecast */}
                {isCustomItem(item) ? (
                  <div className="mt-2 bg-amber-50 rounded p-2 border border-amber-200">
                    <div className="flex items-center gap-1.5 text-amber-700">
                      <FileQuestion className="w-4 h-4" />
                      <span className="text-xs font-medium">Quote pending</span>
                    </div>
                    <p className="text-xs text-amber-600 mt-1">
                      We&apos;ll provide pricing for this item
                    </p>
                  </div>
                ) : (item.priceId && item.rentalStartDate && item.rentalEndDate) ||
                  item.priceForecast ? (
                  <div className="mt-2 bg-white rounded p-2 border border-gray-200">
                    <RentalPricingBreakdown
                      priceId={item.priceId}
                      startDate={item.rentalStartDate}
                      endDate={item.rentalEndDate}
                      compact={true}
                      showSavings={false}
                      onTotalCalculated={item.priceForecast ? undefined : handleTotalCalculated}
                      isExpanded={true}
                      priceForecast={item.priceForecast}
                      subtotalInCents={item.subtotalInCents}
                    />
                    {(item.subtotalInCents ||
                      item.priceForecast ||
                      localSubtotal !== undefined) && (
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                        <span className="text-xs font-medium text-gray-700">Subtotal:</span>
                        <span className="text-sm font-bold text-gray-900">
                          {formatPrice(
                            item.subtotalInCents ||
                              item.priceForecast?.accumulative_cost_in_cents ||
                              localSubtotal ||
                              0,
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs font-medium text-gray-900">
                    {formatPrice(item.pricePerDayInCents)}/day
                  </p>
                )}
              </>
            ) : (
              <>
                {/* Quantity controls for sale items */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        cart.updateItem(item.tempId, { quantity: Math.max(1, item.quantity - 1) })
                      }
                      disabled={item.quantity <= 1}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => cart.updateItem(item.tempId, { quantity: item.quantity + 1 })}
                      className="p-1 hover:bg-gray-200 rounded cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  {isCustomItem(item) ? (
                    <div className="flex items-center gap-1 text-amber-700">
                      <FileQuestion className="w-3 h-3" />
                      <span className="text-xs font-medium">Quote pending</span>
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-gray-900">
                      {formatPrice((item.unitCostInCents || 0) * item.quantity)}
                    </p>
                  )}
                </div>
                {item.deliveryDate && (
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Calendar className="w-3 h-3" />
                    <span>Delivery: {formatDate(item.deliveryDate)}</span>
                  </div>
                )}
              </>
            )}

            {/* Delivery info */}
            {item.deliveryMethod && (
              <p className="text-xs text-gray-500">
                {item.deliveryMethod === "DELIVERY" ? "Delivery" : "Pickup"}
                {item.deliveryLocation && ` • ${item.deliveryLocation}`}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface CartDrawerProps {
  onCheckout: () => void;
}

export default function CartDrawer({ onCheckout }: CartDrawerProps) {
  const cart = useCart();
  const totalItems = cart.getTotalItems();
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);

  const saleItems = cart.items.filter((item) => item.priceType === "SALE");
  const rentalItems = cart.items.filter((item) => item.priceType === "RENTAL");

  // Check if all rental items have dates
  const hasIncompleteRentals = rentalItems.some(
    (item) => !item.rentalStartDate || !item.rentalEndDate,
  );

  // Check if all items are custom (no pricing)
  const allItemsAreCustom = cart.items.length > 0 && cart.items.every(isCustomItem);

  // Get cart total
  const cartTotal = cart.getCartTotal();

  // Stable callback for subtotal changes
  const handleSubtotalChange = useCallback(
    (tempId: string, subtotalInCents: number) => {
      cart.setItemSubtotal(tempId, subtotalInCents);
    },
    [cart],
  );

  const formatPrice = (cents: number): string => {
    return `$${(cents / 100).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <>
      {/* Backdrop */}
      {cart.isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 transition-opacity"
          onClick={cart.closeDrawer}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          cart.isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-gray-700" />
              <h2 className="text-lg font-semibold text-gray-900">
                Your Request ({totalItems} {totalItems === 1 ? "item" : "items"})
              </h2>
            </div>
            <button
              onClick={cart.closeDrawer}
              className="p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {totalItems === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 text-sm">Your request is empty</p>
                <p className="text-gray-500 text-xs mt-1">Browse the catalog to add items</p>
              </div>
            ) : (
              <>
                {/* Validation Warning */}
                {hasIncompleteRentals && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs text-amber-800">
                      Some rental items are missing dates. Please edit them before checkout.
                    </p>
                  </div>
                )}

                {/* Rental Items */}
                {rentalItems.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                        RENTAL
                      </span>
                      {rentalItems.length} {rentalItems.length === 1 ? "item" : "items"}
                    </h3>
                    <div className="space-y-3">
                      {rentalItems.map((item) => (
                        <CartLineItem
                          key={item.tempId}
                          item={item}
                          onEdit={setEditingItem}
                          onSubtotalChange={handleSubtotalChange}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Sale Items */}
                {saleItems.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">
                        PURCHASE
                      </span>
                      {saleItems.length} {saleItems.length === 1 ? "item" : "items"}
                    </h3>
                    <div className="space-y-3">
                      {saleItems.map((item) => (
                        <CartLineItem
                          key={item.tempId}
                          item={item}
                          onEdit={setEditingItem}
                          onSubtotalChange={handleSubtotalChange}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer with Total */}
          {totalItems > 0 && (
            <div className="border-t border-gray-200 p-4 space-y-3">
              {/* Cart Total */}
              {cartTotal > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-700">Estimated Total:</span>
                  <span className="text-lg font-bold text-gray-900">{formatPrice(cartTotal)}</span>
                </div>
              )}
              {cartTotal === 0 && !hasIncompleteRentals && !allItemsAreCustom && (
                <p className="text-xs text-gray-500 text-center">Set rental dates to see pricing</p>
              )}
              {allItemsAreCustom && (
                <div className="flex items-center justify-center gap-1.5 py-2 text-amber-700">
                  <FileQuestion className="w-4 h-4" />
                  <span className="text-sm font-medium">All items pending quote</span>
                </div>
              )}

              <button
                onClick={onCheckout}
                disabled={hasIncompleteRentals || cart.isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors cursor-pointer"
              >
                {cart.isLoading ? "Loading..." : "Request Quote"}
              </button>
              {hasIncompleteRentals && (
                <p className="text-xs text-gray-500 text-center">
                  Set dates for all rental items to continue
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Item Dialog */}
      {editingItem && (
        <EditItemDialog
          open={!!editingItem}
          onClose={() => setEditingItem(null)}
          item={editingItem}
        />
      )}
    </>
  );
}
