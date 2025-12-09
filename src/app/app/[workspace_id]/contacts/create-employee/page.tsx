"use client";

import { useCreatePersonContactMutation } from "@/ui/contacts/api";
import { BusinessSelector } from "@/ui/contacts/BusinessSelector";
import ResourceMapSearchSelector from "@/ui/resource_map/ResourceMapSearchSelector";
import { AlertCircle, ArrowLeft, Loader2, Save, User } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

export default function CreateEmployeePage() {
  const { workspace_id } = useParams<{ workspace_id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get businessId from query params
  const businessIdFromQuery = searchParams.get("businessId") || "";

  const [form, setForm] = React.useState<{
    name: string;
    phone: string;
    email: string;
    role: string;
    businessId: string;
    resourceMapIds: string[];
  }>({
    name: "",
    phone: "",
    email: "",
    role: "",
    businessId: businessIdFromQuery,
    resourceMapIds: [],
  });
  const [error, setError] = React.useState<string | null>(null);

  const [createEmployee, { loading }] = useCreatePersonContactMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name || !form.email || !form.role || !form.businessId) {
      setError("Please fill in all required fields.");
      return;
    }
    try {
      const result = await createEmployee({
        variables: {
          workspaceId: workspace_id,
          name: form.name,
          phone: form.phone || undefined,
          email: form.email,
          role: form.role,
          businessId: form.businessId,
          resourceMapIds: form.resourceMapIds,
        },
      });
      if (result.data?.createPersonContact?.id) {
        router.push(`../contacts/${result.data.createPersonContact.id}`);
      } else {
        setError("Failed to create employee.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create employee.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-3xl px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <User className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add New Employee</h1>
              <p className="text-gray-600 mt-1">Create a new employee contact</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Employee Information</h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="john@company.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="role"
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Project Manager"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business <span className="text-red-500">*</span>
                  </label>
                  <BusinessSelector
                    value={form.businessId}
                    onChange={(businessId) => setForm((prev) => ({ ...prev, businessId }))}
                    workspaceId={workspace_id}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resource Maps
                  </label>
                  <ResourceMapSearchSelector
                    selectedIds={form.resourceMapIds}
                    onSelectionChange={(ids: string[]) =>
                      setForm((prev) => ({ ...prev, resourceMapIds: ids }))
                    }
                    readonly={false}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] justify-center"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Add Employee</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
