"use client";

import { PersonContactType, ResourceMapTagType } from "@/graphql/hooks";
import { useSelectedWorkspace } from "@/providers/WorkspaceProvider";
import { useCreatePersonContactMutation } from "@/ui/contacts/api";
import { BusinessSelector } from "@/ui/contacts/BusinessSelector";
import { ContactTagsSelector } from "@/ui/contacts/ContactTagsSelector";
import { AlertCircle, ArrowLeft, Building2, Check, Loader2, Save, User, Users } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

type EmployeeType = "internal" | "external";

export default function CreateEmployeePage() {
  const { workspace_id } = useParams<{ workspace_id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get workspace to access the organization's business
  const workspace = useSelectedWorkspace();
  const workspaceBusiness = workspace?.orgBusinessContact;
  const workspaceBusinessId = workspace?.orgBusinessContactId;

  // Get businessId from query params (for external employees)
  const businessIdFromQuery = searchParams.get("businessId") || "";

  // Employee type state - default to internal
  const [employeeType, setEmployeeType] = React.useState<EmployeeType>("internal");

  const [form, setForm] = React.useState<{
    name: string;
    phone: string;
    email: string;
    role: string; // Derived from ROLE tag, but still needed for mutation
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

  // Set business ID based on employee type
  React.useEffect(() => {
    if (employeeType === "internal" && workspaceBusinessId) {
      setForm((prev) => ({ ...prev, businessId: workspaceBusinessId }));
    } else if (employeeType === "external") {
      setForm((prev) => ({ ...prev, businessId: businessIdFromQuery }));
    }
  }, [employeeType, workspaceBusinessId, businessIdFromQuery]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Handle role change from ContactTagsSelector
  const handleRoleChange = (roleValue: string | null) => {
    setForm((prev) => ({
      ...prev,
      role: roleValue || "",
    }));
  };

  // Handle resource map IDs change
  const handleResourceMapIdsChange = (ids: string[]) => {
    setForm((prev) => ({
      ...prev,
      resourceMapIds: ids,
    }));
  };

  // Handle employee type change
  const handleEmployeeTypeChange = (type: EmployeeType) => {
    setEmployeeType(type);
    // Clear error when switching types
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!form.name) {
      setError("Please enter a name.");
      return;
    }
    if (!form.email) {
      setError("Please enter an email address.");
      return;
    }
    if (!form.businessId) {
      if (employeeType === "internal") {
        setError("Workspace business not configured. Please contact your administrator.");
      } else {
        setError("Please select a business.");
      }
      return;
    }
    if (employeeType === "internal" && !form.role) {
      setError("Please select a role tag for internal employees.");
      return;
    }

    try {
      const result = await createEmployee({
        variables: {
          workspaceId: workspace_id,
          name: form.name,
          phone: form.phone || undefined,
          email: form.email,
          businessId: form.businessId,
          resourceMapIds: form.resourceMapIds.length > 0 ? form.resourceMapIds : undefined,
          personType:
            employeeType === "internal" ? PersonContactType.Employee : PersonContactType.External,
        },
      });
      if (result.data?.createPersonContact?.id) {
        router.push(`../contacts/${result.data.createPersonContact.id}`);
      } else {
        setError("Failed to create employee.");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create employee.";
      setError(errorMessage);
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
            {/* Employee Type Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Employee Type <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleEmployeeTypeChange("internal")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                    employeeType === "internal"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">Internal</div>
                    <div className="text-xs opacity-75">Your organization</div>
                  </div>
                  {employeeType === "internal" && (
                    <Check className="w-5 h-5 ml-auto text-blue-600" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleEmployeeTypeChange("external")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                    employeeType === "external"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <Building2 className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">External</div>
                    <div className="text-xs opacity-75">Vendor or customer</div>
                  </div>
                  {employeeType === "external" && (
                    <Check className="w-5 h-5 ml-auto text-blue-600" />
                  )}
                </button>
              </div>
            </div>

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

                {/* Business - Conditional based on employee type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business <span className="text-red-500">*</span>
                  </label>

                  {employeeType === "internal" ? (
                    // Internal: Show workspace business as read-only
                    <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {workspaceBusiness ? (
                          <>
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {workspaceBusiness.name}
                            </div>
                            {workspaceBusiness.address && (
                              <div className="text-xs text-gray-500 truncate">
                                {workspaceBusiness.address}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-sm text-gray-500">
                            {workspaceBusinessId
                              ? "Loading workspace business..."
                              : "Workspace business not configured"}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        <Check className="w-3 h-3" />
                        Your Org
                      </div>
                    </div>
                  ) : (
                    // External: Show business selector
                    <BusinessSelector
                      value={form.businessId}
                      onChange={(businessId) => setForm((prev) => ({ ...prev, businessId }))}
                      workspaceId={workspace_id}
                      required
                    />
                  )}
                </div>

                {/* Resource Map Tags Section */}
                <div className="pt-2">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Organization Tags{" "}
                    {employeeType === "internal" && <span className="text-red-500">*</span>}
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">
                    Assign this contact to a role, business unit, and/or location. Role is required
                    for internal employees and optional for external contacts.
                  </p>
                  <ContactTagsSelector
                    selectedIds={form.resourceMapIds}
                    onChange={handleResourceMapIdsChange}
                    allowedTypes={[
                      ResourceMapTagType.Role,
                      ResourceMapTagType.BusinessUnit,
                      ResourceMapTagType.Location,
                    ]}
                    singleSelectTypes={[ResourceMapTagType.Role]}
                    onRoleChange={handleRoleChange}
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
