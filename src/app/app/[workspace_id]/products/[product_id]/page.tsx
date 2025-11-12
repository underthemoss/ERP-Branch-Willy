"use client";

import { graphql } from "@/graphql";
import { useGetPimProductDetailByIdQuery } from "@/graphql/hooks";
import { GeneratedImage } from "@/ui/GeneratedImage";
import Link from "next/link";
import { useParams } from "next/navigation";

const GET_PIM_PRODUCT_DETAIL = graphql(`
  query GetPimProductDetailById($id: ID!) {
    getPimProductById(id: $id) {
      id
      name
      make
      model
      year
      sku
      upc
      manufacturer_part_number
      pim_category_id
      pim_category_path
      pim_category_platform_id
      is_deleted
    }
  }
`);

export default function ProductDetailPage() {
  const params = useParams();
  const workspaceId = params.workspace_id as string;
  const productId = params.product_id as string;

  const { data, loading, error } = useGetPimProductDetailByIdQuery({
    variables: { id: productId },
    fetchPolicy: "cache-and-network",
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-7xl">
          {/* Breadcrumb Skeleton */}
          <div className="mb-6 h-6 w-96 animate-pulse rounded bg-gray-200" />

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Image Skeleton */}
            <div className="aspect-square w-full animate-pulse rounded-xl bg-gray-200" />

            {/* Content Skeleton */}
            <div className="space-y-6">
              <div className="h-10 w-3/4 animate-pulse rounded bg-gray-200" />
              <div className="h-6 w-1/2 animate-pulse rounded bg-gray-200" />
              <div className="space-y-3">
                <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.getPimProductById) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">Product Not Found</h2>
          <p className="mb-6 text-gray-600">
            {error?.message || "The product you're looking for doesn't exist or has been removed."}
          </p>
          <Link
            href={`/app/${workspaceId}/search/products`}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Product Search
          </Link>
        </div>
      </div>
    );
  }

  const product = data.getPimProductById;

  // Build category breadcrumb from path
  const categoryParts = product.pim_category_path?.split("|").filter(Boolean) || [];

  // Build make/model/year line
  const makeModelYear = [product.make, product.model, product.year].filter(Boolean).join(" • ");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Breadcrumb Navigation */}
        <nav className="mb-6 flex items-center gap-2 text-sm">
          <Link
            href={`/app/${workspaceId}/search/products`}
            className="text-gray-500 transition-colors hover:text-gray-900"
          >
            Products
          </Link>
          {categoryParts.map((category, index) => (
            <div key={index} className="flex items-center gap-2">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              <span className="text-gray-500">{category}</span>
            </div>
          ))}
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="font-medium text-gray-900">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Product Image */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="aspect-square w-full bg-gray-50">
              <GeneratedImage
                entity="pim-product"
                entityId={product.id || ""}
                size="full"
                alt={product.name || "Product image"}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
            </div>
          </div>

          {/* Product Information */}
          <div className="space-y-6">
            {/* Product Name */}
            <div>
              <h1 className="mb-2 text-4xl font-bold tracking-tight text-gray-900">
                {product.name}
              </h1>
              {makeModelYear && <p className="text-lg text-gray-600">{makeModelYear}</p>}
            </div>

            {/* Identifiers */}
            {(product.sku || product.upc || product.manufacturer_part_number) && (
              <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Product Identifiers
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {product.sku && (
                    <div>
                      <div className="text-xs font-medium text-gray-500">SKU</div>
                      <div className="mt-1 font-mono text-sm font-semibold text-gray-900">
                        {product.sku}
                      </div>
                    </div>
                  )}
                  {product.upc && (
                    <div>
                      <div className="text-xs font-medium text-gray-500">UPC</div>
                      <div className="mt-1 font-mono text-sm font-semibold text-gray-900">
                        {product.upc}
                      </div>
                    </div>
                  )}
                  {product.manufacturer_part_number && (
                    <div className="sm:col-span-2">
                      <div className="text-xs font-medium text-gray-500">
                        Manufacturer Part Number
                      </div>
                      <div className="mt-1 font-mono text-sm font-semibold text-gray-900">
                        {product.manufacturer_part_number}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Category Information */}
            {categoryParts.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Category
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  {categoryParts.map((category, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                        {category}
                      </span>
                      {index < categoryParts.length - 1 && (
                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                          <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <Link
                href={`/app/${workspaceId}/search/prices?productId=${product.id}`}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                View Pricing
              </Link>

              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-900 transition-colors hover:border-gray-400 hover:bg-gray-50"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Add to Quote
              </button>
            </div>

            {/* Back to Search */}
            <Link
              href={`/app/${workspaceId}/search/products`}
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-500 transition-colors hover:text-blue-600"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Product Search
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
