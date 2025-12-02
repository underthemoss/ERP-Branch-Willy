"use client";

import { Package, ShoppingBag } from "lucide-react";
import Link from "next/link";

interface OrdersHeaderProps {
  projectName: string;
  companyName: string;
  logoUrl?: string;
  formId: string;
}

export default function OrdersHeader({
  projectName,
  companyName,
  logoUrl,
  formId,
}: OrdersHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
      <div className="w-full px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo/Branding */}
          <div className="flex items-center gap-3 shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt={companyName} className="h-10 w-auto object-contain" />
            ) : (
              <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-lg">
                  {companyName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-gray-900 leading-tight">{projectName}</h1>
              <p className="text-xs text-gray-500">{companyName}</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-4">
            <Link
              href={`/intake-form/${formId}/orders`}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">My Orders</span>
            </Link>

            <Link
              href={`/intake-form/${formId}/catalog`}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Browse Catalog</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
