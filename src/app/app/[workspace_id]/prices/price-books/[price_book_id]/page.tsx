"use client";

import { ResourceTypes } from "@/graphql/graphql";
import { useNotification } from "@/providers/NotificationProvider";
import FileUpload from "@/ui/FileUpload";
import {
  useDeletePriceBookByIdMutation,
  useExportPricesMutation,
  useGetPriceBookByIdQuery,
  useImportPricesMutation,
} from "@/ui/prices/api";
import { PriceBookDialog } from "@/ui/prices/PriceBookDialog";
import { PricesTable } from "@/ui/prices/PriceBookPricesTable";
import { ChevronDown, ChevronUp, Download, FileUp, Pencil, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

// Helper component for expandable notes
function NotesSection({ notes }: { notes: string }) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const shouldTruncate = notes.length > 150;
  const displayText = shouldTruncate && !isExpanded ? notes.slice(0, 150) + "..." : notes;

  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes</label>
      <div className="mt-1">
        <p className="text-sm text-gray-900 whitespace-pre-wrap">{displayText}</p>
        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show more
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default function PriceBook() {
  const { price_book_id, workspace_id } = useParams();
  const router = useRouter();
  const { notifySuccess, notifyError } = useNotification();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [deletePriceBook] = useDeletePriceBookByIdMutation();

  // Export / Import state and mutations
  const [importDialogOpen, setImportDialogOpen] = React.useState(false);
  const [runExportPrices, { loading: exporting }] = useExportPricesMutation();
  const [runImportPrices, { loading: importing }] = useImportPricesMutation();

  const { data, loading, error } = useGetPriceBookByIdQuery({
    variables: {
      id: price_book_id as string,
    },
  });

  const priceBook = data?.getPriceBookById;
  const isLoading = loading || !priceBook;
  const hasError = Boolean(error);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-7xl px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Price Book</h1>
            <p className="text-gray-600">View and manage price book details</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setEditDialogOpen(true)}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={async () => {
                try {
                  const res = await runExportPrices({
                    variables: { priceBookId: price_book_id as string },
                  });
                  const url = res.data?.exportPrices?.url;
                  if (url) {
                    window.open(url, "_blank", "noopener,noreferrer");
                  } else {
                    notifyError("Export did not return a file URL.");
                  }
                } catch (e: any) {
                  notifyError(e?.message || "Failed to export prices.");
                }
              }}
              disabled={exporting || isLoading}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => setImportDialogOpen(true)}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileUp className="w-4 h-4" />
              Import
            </button>
            <button
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>

        {/* Price Book Details Card */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column - Loading */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-4 w-12 bg-gray-200 rounded mb-2 animate-pulse"></div>
                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div>
                    <div className="h-4 w-12 bg-gray-200 rounded mb-2 animate-pulse"></div>
                    <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <div className="h-4 w-16 bg-gray-200 rounded mb-2 animate-pulse"></div>
                    <div className="h-6 w-full bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div>
                    <div className="h-4 w-20 bg-gray-200 rounded mb-2 animate-pulse"></div>
                    <div className="h-6 w-full bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div>
                    <div className="h-4 w-16 bg-gray-200 rounded mb-2 animate-pulse"></div>
                    <div className="h-6 w-full bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
              {/* Right Column - Loading */}
              <div className="space-y-6 border-l border-gray-200 pl-8">
                <div>
                  <div className="h-4 w-8 bg-gray-200 rounded mb-2 animate-pulse"></div>
                  <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="h-4 w-20 bg-gray-200 rounded mb-2 animate-pulse"></div>
                    <div className="h-6 w-full bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div>
                    <div className="h-4 w-20 bg-gray-200 rounded mb-2 animate-pulse"></div>
                    <div className="h-6 w-full bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="h-4 w-20 bg-gray-200 rounded mb-2 animate-pulse"></div>
                    <div className="h-6 w-full bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div>
                    <div className="h-4 w-20 bg-gray-200 rounded mb-2 animate-pulse"></div>
                    <div className="h-6 w-full bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : hasError ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">Error loading price book</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Editable Information (Left) */}
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Name
                    </label>
                    <h2 className="text-xl font-semibold text-gray-900 mt-1">{priceBook.name}</h2>
                  </div>
                  <div className="text-right">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Parent
                    </label>
                    {priceBook.parentPriceBook ? (
                      <div className="mt-1">
                        <Link
                          href={`/app/${workspace_id}/prices/price-books/${priceBook.parentPriceBook.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {priceBook.parentPriceBook.name}
                        </Link>
                        {priceBook.parentPriceBookPercentageFactor !== undefined &&
                        priceBook.parentPriceBookPercentageFactor !== null ? (
                          <span className="text-gray-500 ml-1">
                            (x{`${priceBook.parentPriceBookPercentageFactor}`})
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <p className="text-gray-600 mt-1">-</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Location
                    </label>
                    <p className="text-sm text-gray-900 mt-1">{priceBook.location || "-"}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Business Contact
                    </label>
                    {priceBook.businessContact ? (
                      <Link
                        href={`/app/${workspace_id}/contacts/${priceBook.businessContact.id}`}
                        className="text-sm text-blue-600 hover:underline mt-1 block"
                      >
                        {priceBook.businessContact.name}
                      </Link>
                    ) : (
                      <p className="text-sm text-gray-900 mt-1">-</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Project
                    </label>
                    {priceBook.project ? (
                      <Link
                        href={`/app/${workspace_id}/projects/${priceBook.project.id}`}
                        className="text-sm text-blue-600 hover:underline mt-1 block"
                      >
                        {priceBook.project.name}
                      </Link>
                    ) : (
                      <p className="text-sm text-gray-900 mt-1">-</p>
                    )}
                  </div>
                </div>
                {priceBook.notes && <NotesSection notes={priceBook.notes} />}
              </div>

              {/* System Information (Right) */}
              <div className="space-y-6 border-l border-gray-200 pl-8">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    ID
                  </label>
                  <p className="text-sm text-gray-900 mt-1 font-mono">{priceBook.id}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Created By
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {priceBook.createdByUser
                        ? `${priceBook.createdByUser.firstName} ${priceBook.createdByUser.lastName}`
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Created At
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {priceBook.createdAt ? new Date(priceBook.createdAt).toLocaleString() : "-"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Updated By
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {priceBook.updatedByUser
                        ? `${priceBook.updatedByUser.firstName} ${priceBook.updatedByUser.lastName}`
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Updated At
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {priceBook.updatedAt ? new Date(priceBook.updatedAt).toLocaleString() : "-"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Prices Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <PricesTable />
        </div>

        {/* Delete Confirmation Dialog */}
        {deleteDialogOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Price Book</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this price book? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setDeleteDialogOpen(false)}
                    disabled={deleting}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      setDeleting(true);
                      try {
                        await deletePriceBook({ variables: { id: price_book_id as string } });
                        setDeleteDialogOpen(false);
                        router.push(`/app/${workspace_id}/prices`);
                      } catch (err) {
                        setDeleting(false);
                        notifyError("Failed to delete price book.");
                      }
                    }}
                    disabled={deleting}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Import Prices Dialog */}
        {importDialogOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Import Prices</h3>
                <button
                  onClick={() => setImportDialogOpen(false)}
                  disabled={importing}
                  className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-4">
                  Upload a CSV file to import prices into this price book.
                </p>
                <FileUpload
                  entityType={ResourceTypes.ErpPricebook}
                  acceptedTypes={["text/csv", "application/vnd.ms-excel", ".csv"]}
                  entityId={price_book_id as string}
                  label="Select CSV file"
                  helperText="Accepted format: .csv"
                  onUploadSuccess={async ({ fileId }) => {
                    if (!fileId) {
                      notifyError("Upload failed to create a file record.");
                      return;
                    }
                    try {
                      const res = await runImportPrices({
                        variables: { fileId, priceBookId: price_book_id as string },
                      });
                      const imported = res.data?.importPrices?.imported ?? 0;
                      const failed = res.data?.importPrices?.failed ?? 0;
                      setImportDialogOpen(false);
                      notifySuccess(`Import complete. Imported: ${imported}, Failed: ${failed}`);
                    } catch (err: any) {
                      notifyError(err?.message || "Failed to import prices.");
                    }
                  }}
                  onError={(e) => notifyError(e.message)}
                />
              </div>
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setImportDialogOpen(false)}
                  disabled={importing}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Price Book Dialog */}
        {priceBook && (
          <PriceBookDialog
            open={editDialogOpen}
            onClose={() => setEditDialogOpen(false)}
            mode="edit"
            priceBook={{
              id: priceBook.id,
              name: priceBook.name,
              notes: priceBook.notes || undefined,
              location: priceBook.location || undefined,
              businessContactId: priceBook.businessContact?.id,
              projectId: priceBook.project?.id,
            }}
          />
        )}
      </div>
    </div>
  );
}
