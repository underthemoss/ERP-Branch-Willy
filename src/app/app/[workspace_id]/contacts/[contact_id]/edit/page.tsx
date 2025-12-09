"use client";

import { AddressValidationField } from "@/ui/contacts/AddressValidationField";
import {
  useGetContactByIdQuery,
  useUpdateBusinessContactMutation,
  useUpdatePersonContactMutation,
} from "@/ui/contacts/api";
import { BusinessNameWithBrandSearch } from "@/ui/contacts/BusinessNameWithBrandSearch";
import { BusinessSelector } from "@/ui/contacts/BusinessSelector";
import ResourceMapSearchSelector from "@/ui/resource_map/ResourceMapSearchSelector";
import { AlertCircle, ArrowLeft, Building2, Loader2, Save, User } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

export default function EditContactPage() {
  const { workspace_id, contact_id } = useParams<{ workspace_id: string; contact_id: string }>();
  const router = useRouter();

  const {
    data,
    loading: loadingContact,
    error,
  } = useGetContactByIdQuery({
    variables: { id: contact_id },
    fetchPolicy: "cache-and-network",
  });

  // Employee (PersonContact) state
  const [personForm, setPersonForm] = React.useState({
    name: "",
    phone: "",
    email: "",
    role: "",
    businessId: "",
    resourceMapIds: [] as string[],
  });
  const [updateEmployee, { loading: updatingPerson }] = useUpdatePersonContactMutation();

  // Business state
  const [businessForm, setBusinessForm] = React.useState({
    name: "",
    phone: "",
    address: "",
    taxId: "",
    website: "",
    brandId: null as string | null,
  });
  const [locationData, setLocationData] = React.useState<{
    lat: number;
    lng: number;
    placeId: string;
    validatedAddress: string;
  } | null>(null);
  const [initialPlaceId, setInitialPlaceId] = React.useState<string | undefined>(undefined);
  const [selectedBrand, setSelectedBrand] = React.useState<any>(null);
  const [updateBusiness, { loading: updatingBusiness }] = useUpdateBusinessContactMutation();

  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Populate form with contact data
  React.useEffect(() => {
    if (data?.getContactById && data.getContactById.__typename === "PersonContact") {
      setPersonForm({
        name: data.getContactById.name ?? "",
        phone: data.getContactById.phone ?? "",
        email: data.getContactById.email ?? "",
        role: data.getContactById.role ?? "",
        businessId: data.getContactById.businessId ?? "",
        resourceMapIds: data.getContactById.resourceMapIds ?? [],
      });
    } else if (data?.getContactById && data.getContactById.__typename === "BusinessContact") {
      setBusinessForm({
        name: data.getContactById.name ?? "",
        phone: data.getContactById.phone ?? "",
        address: data.getContactById.address ?? "",
        taxId: data.getContactById.taxId ?? "",
        website: data.getContactById.website ?? "",
        brandId: data.getContactById.brandId ?? null,
      });
      if (data.getContactById.brand) {
        setSelectedBrand(data.getContactById.brand);
      }
      if (data.getContactById.placeId) {
        setInitialPlaceId(data.getContactById.placeId);
        if (data.getContactById.latitude && data.getContactById.longitude) {
          setLocationData({
            lat: data.getContactById.latitude,
            lng: data.getContactById.longitude,
            placeId: data.getContactById.placeId,
            validatedAddress: data.getContactById.address ?? "",
          });
        }
      }
    }
  }, [data]);

  // Handlers for PersonContact
  const handlePersonChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setPersonForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Handlers for BusinessContact
  const handleBusinessChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setBusinessForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleBrandSelected = React.useCallback((brand: any) => {
    if (brand) {
      setSelectedBrand(brand);
      if (brand.domain) {
        setBusinessForm((prev) => ({ ...prev, website: `https://${brand.domain}` }));
      }
    } else {
      setSelectedBrand(null);
    }
  }, []);

  // Submit for PersonContact
  const handlePersonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!personForm.name || !personForm.email || !personForm.role || !personForm.businessId) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }
    try {
      const result = await updateEmployee({
        variables: {
          id: contact_id,
          input: {
            name: personForm.name,
            phone: personForm.phone || undefined,
            email: personForm.email,
            role: personForm.role,
            businessId: personForm.businessId,
            resourceMapIds: personForm.resourceMapIds,
          },
        },
      });
      if (result.data?.updatePersonContact?.id) {
        router.push(`/app/${workspace_id}/contacts/${contact_id}`);
      } else {
        setErrorMsg("Failed to update employee.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update employee.");
    }
  };

  // Submit for BusinessContact
  const handleBusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!businessForm.name || !businessForm.taxId) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }
    try {
      const finalAddress = locationData?.validatedAddress || businessForm.address;

      if (locationData) {
        console.log("Location data for future schema update:", {
          lat: locationData.lat,
          lng: locationData.lng,
          placeId: locationData.placeId,
          address: finalAddress,
        });
      }

      const result = await updateBusiness({
        variables: {
          id: contact_id,
          input: {
            name: businessForm.name,
            phone: businessForm.phone || undefined,
            address: finalAddress || undefined,
            taxId: businessForm.taxId,
            website: businessForm.website || undefined,
            brandId: businessForm.brandId || undefined,
            latitude: locationData?.lat || undefined,
            longitude: locationData?.lng || undefined,
            placeId: locationData?.placeId || undefined,
          },
        },
      });
      if (result.data?.updateBusinessContact?.id) {
        router.push(`/app/${workspace_id}/contacts/${contact_id}`);
      } else {
        setErrorMsg("Failed to update business.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update business.");
    }
  };

  if (loadingContact) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="container mx-auto max-w-3xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading contact...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.getContactById) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="container mx-auto max-w-3xl">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="text-lg font-semibold text-red-900">Contact Not Found</h3>
                <p className="text-sm text-red-700 mt-1">
                  The contact you're looking for doesn't exist or you don't have access to it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const contact = data.getContactById;
  const isPerson = contact.__typename === "PersonContact";
  const isBusiness = contact.__typename === "BusinessContact";

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
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isPerson ? "bg-purple-100" : "bg-blue-100"
              }`}
            >
              {isPerson ? (
                <User className="w-6 h-6 text-purple-600" />
              ) : (
                <Building2 className="w-6 h-6 text-blue-600" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Edit {isPerson ? "Employee" : "Business"}
              </h1>
              <p className="text-gray-600 mt-1">Update contact information</p>
            </div>
          </div>
        </div>

        {/* Person Form */}
        {isPerson && (
          <form onSubmit={handlePersonSubmit}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={personForm.name}
                      onChange={handlePersonChange}
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
                      value={personForm.email}
                      onChange={handlePersonChange}
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
                      value={personForm.phone}
                      onChange={handlePersonChange}
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
                      value={personForm.role}
                      onChange={handlePersonChange}
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
                      value={personForm.businessId}
                      onChange={(businessId) => setPersonForm((prev) => ({ ...prev, businessId }))}
                      workspaceId={workspace_id}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Resource Maps
                    </label>
                    <ResourceMapSearchSelector
                      selectedIds={personForm.resourceMapIds}
                      onSelectionChange={(ids: string[]) =>
                        setPersonForm((prev) => ({ ...prev, resourceMapIds: ids }))
                      }
                      readonly={false}
                    />
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{errorMsg}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => router.back()}
                  disabled={updatingPerson}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingPerson}
                  data-testid="save-contact"
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] justify-center"
                >
                  {updatingPerson ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Business Form */}
        {isBusiness && (
          <>
            {/* Brand Banner */}
            {selectedBrand?.images?.find((img: any) => img.type === "banner") && (
              <div className="mb-6 relative">
                <div className="h-48 rounded-lg overflow-hidden shadow-sm border border-gray-200">
                  <img
                    src={
                      selectedBrand.images.find((img: any) => img.type === "banner")?.formats?.[0]
                        ?.src
                    }
                    alt={`${selectedBrand.name} banner`}
                    className="w-full h-full object-cover"
                  />
                </div>
                {selectedBrand?.logos?.find((logo: any) => logo.type === "logo") && (
                  <div
                    className={`absolute -bottom-10 left-6 w-20 h-20 rounded-full border-4 border-white shadow-lg flex items-center justify-center ${
                      selectedBrand.logos.find((logo: any) => logo.type === "logo")?.theme ===
                      "dark"
                        ? "bg-white"
                        : "bg-gray-900"
                    }`}
                  >
                    <img
                      src={
                        selectedBrand.logos.find((logo: any) => logo.type === "logo")?.formats?.[0]
                          ?.src
                      }
                      alt={`${selectedBrand.name} logo`}
                      className="w-full h-full rounded-full object-contain p-2"
                    />
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleBusinessSubmit}>
              <div
                className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6 ${
                  selectedBrand?.logos?.find((logo: any) => logo.type === "logo") ? "mt-12" : ""
                }`}
              >
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Business Name <span className="text-red-500">*</span>
                      </label>
                      <BusinessNameWithBrandSearch
                        value={businessForm.name}
                        onChange={(value) => setBusinessForm((prev) => ({ ...prev, name: value }))}
                        brandId={businessForm.brandId}
                        onBrandIdChange={(brandId) =>
                          setBusinessForm((prev) => ({ ...prev, brandId }))
                        }
                        onBrandSelected={handleBrandSelected}
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Phone
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={businessForm.phone}
                        onChange={handleBusinessChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <AddressValidationField
                        value={businessForm.address}
                        onChange={(value) =>
                          setBusinessForm((prev) => ({ ...prev, address: value }))
                        }
                        onLocationChange={(lat, lng, placeId) => {
                          setLocationData((prev) => ({
                            lat,
                            lng,
                            placeId,
                            validatedAddress: prev?.validatedAddress || businessForm.address,
                          }));
                        }}
                        onValidatedAddressChange={(validatedAddress) => {
                          setLocationData((prev) => ({
                            lat: prev?.lat || 0,
                            lng: prev?.lng || 0,
                            placeId: prev?.placeId || "",
                            validatedAddress,
                          }));
                          setBusinessForm((prev) => ({ ...prev, address: validatedAddress }));
                        }}
                        label=""
                        fullWidth
                        placeId={initialPlaceId}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="taxId"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Tax ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="taxId"
                        name="taxId"
                        value={businessForm.taxId}
                        onChange={handleBusinessChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="12-3456789"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="website"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Website
                      </label>
                      <input
                        type="url"
                        id="website"
                        name="website"
                        value={businessForm.website}
                        onChange={handleBusinessChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
                </div>

                {errorMsg && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-800">{errorMsg}</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    disabled={updatingBusiness}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingBusiness}
                    data-testid="save-contact"
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] justify-center"
                  >
                    {updatingBusiness ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
