"use client";

import { useNotification } from "@/providers/NotificationProvider";
import { AlertCircle, BookOpen, Building2, FileText, Loader2, MapPin, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { Controller, SubmitHandler, useForm, useWatch } from "react-hook-form";
import { AutoCompleteSelect } from "../AutoCompleteSelect";
import { useListBusinessContactsQuery } from "../contacts/api";
import { ProjectSelector } from "../ProjectSelector";
import {
  useCreatePriceBookMutation,
  useListPriceBooksQuery,
  useUpdatePriceBookMutation,
} from "./api";

interface PriceBookFormFields {
  name: string;
  notes?: string;
  isDefault: boolean;
  parentPriceBookId?: string;
  parentPriceBookPercentageFactor?: number;
  businessContactId?: string;
  projectId?: string;
  location?: string;
}

interface PriceBookDialogProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  priceBook?: {
    id: string;
    name: string;
    notes?: string;
    location?: string;
    businessContactId?: string;
    projectId?: string;
  };
}

export function PriceBookDialog({ open, onClose, mode, priceBook }: PriceBookDialogProps) {
  const router = useRouter();
  const { workspace_id } = useParams<{ workspace_id: string }>();
  const { notifySuccess, notifyError } = useNotification();

  const [createPriceBook, { loading: createLoading, error: createError }] =
    useCreatePriceBookMutation();
  const [updatePriceBook, { loading: updateLoading, error: updateError }] =
    useUpdatePriceBookMutation();

  const loading = mode === "create" ? createLoading : updateLoading;
  const error = mode === "create" ? createError : updateError;

  const { data: priceBooksData, loading: priceBooksLoading } = useListPriceBooksQuery({
    variables: { page: { number: 1, size: 100 }, filter: { workspaceId: workspace_id! } },
    skip: mode === "edit", // Only load for create mode
  });

  const { data: companiesData, loading: companiesLoading } = useListBusinessContactsQuery({
    variables: {
      workspaceId: workspace_id,
      page: { number: 1, size: 100 },
    },
  });

  const { control, handleSubmit, setValue, reset } = useForm<PriceBookFormFields>({
    defaultValues: {
      name: priceBook?.name || "",
      notes: priceBook?.notes || "",
      parentPriceBookPercentageFactor: undefined,
      businessContactId: priceBook?.businessContactId || "",
      projectId: priceBook?.projectId || "",
      location: priceBook?.location || "",
      parentPriceBookId: "",
    },
  });

  // State for duplication checkbox (only used in create mode)
  const [enableDuplication, setEnableDuplication] = React.useState(false);

  // Watch parentPriceBookId to show/hide percentage factor field
  const parentPriceBookId = useWatch({ control, name: "parentPriceBookId" });

  // Reset form when priceBook changes (edit mode)
  useEffect(() => {
    if (mode === "edit" && priceBook) {
      reset({
        name: priceBook.name,
        notes: priceBook.notes || "",
        businessContactId: priceBook.businessContactId || "",
        projectId: priceBook.projectId || "",
        location: priceBook.location || "",
        parentPriceBookId: "",
        parentPriceBookPercentageFactor: undefined,
      });
    }
  }, [mode, priceBook, reset]);

  // Handle duplication checkbox change
  const handleDuplicationToggle = (checked: boolean) => {
    setEnableDuplication(checked);
    if (!checked) {
      // Clear duplication fields when unchecking
      setValue("parentPriceBookId", "");
      setValue("parentPriceBookPercentageFactor", undefined);
    }
  };

  const onSubmit: SubmitHandler<PriceBookFormFields> = async (data) => {
    try {
      if (mode === "create") {
        const response = await createPriceBook({
          variables: {
            input: {
              workspaceId: workspace_id!,
              name: data.name,
              notes: data.notes,
              parentPriceBookId: data.parentPriceBookId || undefined,
              parentPriceBookPercentageFactor:
                data.parentPriceBookId && data.parentPriceBookPercentageFactor !== undefined
                  ? data.parentPriceBookPercentageFactor
                  : undefined,
              projectId: data.projectId || undefined,
              location: data.location || undefined,
              businessContactId: data.businessContactId || undefined,
            },
          },
        });

        if (response.data?.createPriceBook?.id) {
          notifySuccess("Price book created successfully");
          onClose();
          router.push(
            `/app/${workspace_id}/prices/price-books/${response.data.createPriceBook.id}`,
          );
        }
      } else {
        // Edit mode
        await updatePriceBook({
          variables: {
            input: {
              id: priceBook!.id,
              name: data.name,
              notes: data.notes || "",
              projectId: data.projectId || undefined,
              location: data.location || "",
              businessContactId: data.businessContactId || undefined,
            },
          },
        });

        notifySuccess("Price book updated successfully");
        onClose();
        router.push(`/app/${workspace_id}/prices/price-books/${priceBook!.id}`);
      }
    } catch (err: any) {
      notifyError(
        err?.message || `Failed to ${mode === "create" ? "create" : "update"} price book`,
      );
    }
  };

  // Prepare price book options for AutoCompleteSelect (create mode only)
  const priceBookOptions =
    priceBooksData?.listPriceBooks?.items?.map((pb: any) => ({
      value: pb.id,
      label: pb.name,
      icon: <BookOpen className="w-4 h-4 text-purple-600" />,
    })) || [];

  // Prepare company options for AutoCompleteSelect
  const companyOptions =
    companiesData?.listContacts?.items?.map((company: any) => ({
      value: company.id,
      label: company.name,
      icon: <Building2 className="w-4 h-4 text-blue-600" />,
    })) || [];

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [open, loading, onClose]);

  if (!open) return null;

  const title = mode === "create" ? "New Price Book" : "Edit Price Book";
  const submitButtonText = mode === "create" ? "Create Price Book" : "Save Changes";
  const loadingText = mode === "create" ? "Creating..." : "Saving...";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={() => !loading && onClose()}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-100">
              <BookOpen className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          </div>
          <button
            type="button"
            onClick={() => !loading && onClose()}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-6">
          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">
                  Error {mode === "create" ? "creating" : "updating"} price book
                </p>
                <p className="text-sm text-red-700 mt-1">{error.message}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form id="price-book-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                Price Book Name <span className="text-red-500">*</span>
              </label>
              <Controller
                name="name"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <input
                    id="name"
                    type="text"
                    placeholder="Enter price book name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-400 transition-colors"
                    {...field}
                  />
                )}
              />
            </div>

            {/* Duplication - Only show in create mode */}
            {mode === "create" && (
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableDuplication}
                    onChange={(e) => handleDuplicationToggle(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Duplicate prices from an existing price book
                  </span>
                </label>
                <p className="mt-1 text-xs text-gray-500 ml-6">
                  Copy prices from an existing price book as a starting point
                </p>

                {enableDuplication && (
                  <div className="ml-6 mt-4 space-y-4 transition-all duration-200 animate-in fade-in slide-in-from-top-2">
                    <div>
                      <label
                        htmlFor="parentPriceBookId"
                        className="block text-sm font-medium text-gray-700 mb-1.5"
                      >
                        Select price book to duplicate
                      </label>
                      <Controller
                        name="parentPriceBookId"
                        control={control}
                        render={({ field }) => (
                          <AutoCompleteSelect
                            options={priceBookOptions}
                            value={field.value || ""}
                            onChange={field.onChange}
                            placeholder={
                              priceBooksLoading ? "Loading price books..." : "Select a price book"
                            }
                          />
                        )}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="parentPriceBookPercentageFactor"
                        className="block text-sm font-medium text-gray-700 mb-1.5"
                      >
                        Percentage Factor
                      </label>
                      <Controller
                        name="parentPriceBookPercentageFactor"
                        control={control}
                        render={({ field }) => (
                          <input
                            id="parentPriceBookPercentageFactor"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="e.g., 1.10 for 10% markup"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-400 transition-colors"
                            value={field.value === undefined ? "" : field.value}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === "" ? undefined : parseFloat(e.target.value),
                              )
                            }
                          />
                        )}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Multiply parent prices by this factor (e.g., 1.10 for 10% increase)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Company */}
            <div>
              <label
                htmlFor="businessContactId"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  Company
                </div>
              </label>
              <Controller
                name="businessContactId"
                control={control}
                render={({ field }) => (
                  <AutoCompleteSelect
                    options={companyOptions}
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder={companiesLoading ? "Loading companies..." : "Select a company"}
                  />
                )}
              />
              <p className="mt-1 text-xs text-gray-500">
                Associate this price book with a specific customer or vendor
              </p>
            </div>

            {/* Project */}
            <div>
              <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 mb-1.5">
                Project
              </label>
              <Controller
                name="projectId"
                control={control}
                render={({ field }) => (
                  <ProjectSelector
                    projectId={field.value}
                    onChange={(projectId) => field.onChange(projectId)}
                  />
                )}
              />
              <p className="mt-1 text-xs text-gray-500">
                Link this price book to a specific project
              </p>
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  Location
                </div>
              </label>
              <Controller
                name="location"
                control={control}
                render={({ field }) => (
                  <input
                    id="location"
                    type="text"
                    placeholder="e.g., Pacific Northwest, Texas, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-400 transition-colors"
                    {...field}
                  />
                )}
              />
              <p className="mt-1 text-xs text-gray-500">
                Specify the geographic region or location for this price book
              </p>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-gray-500" />
                  Notes
                </div>
              </label>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <textarea
                    id="notes"
                    rows={4}
                    placeholder="Add any additional notes or details about this price book..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-400 resize-none transition-colors"
                    {...field}
                  />
                )}
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={() => onClose()}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="price-book-form"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? loadingText : submitButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}
