"use client";

import { AddressValidationField } from "@/ui/contacts/AddressValidationField";
import { useCreateBusinessContactMutation } from "@/ui/contacts/api";
import { BusinessNameWithBrandSearch } from "@/ui/contacts/BusinessNameWithBrandSearch";
import { AlertCircle, ArrowLeft, Building2, Loader2, Save } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

export default function CreateBusinessPage() {
  const { workspace_id } = useParams<{ workspace_id: string }>();
  const router = useRouter();

  const [form, setForm] = React.useState({
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
  const [selectedBrand, setSelectedBrand] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [createBusiness, { loading }] = useCreateBusinessContactMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name || !form.taxId) {
      setError("Please fill in all required fields.");
      return;
    }
    try {
      // Use validated address if available, otherwise use the original input
      const finalAddress = locationData?.validatedAddress || form.address;

      const result = await createBusiness({
        variables: {
          workspaceId: workspace_id,
          name: form.name,
          phone: form.phone || undefined,
          address: finalAddress || undefined,
          taxId: form.taxId,
          website: form.website || undefined,
          brandId: form.brandId || undefined,
          latitude: locationData?.lat || undefined,
          longitude: locationData?.lng || undefined,
          placeId: locationData?.placeId || undefined,
        },
      });

      if (result.data?.createBusinessContact?.id) {
        router.push(`/app/${workspace_id}/contacts/${result.data.createBusinessContact.id}`);
      } else {
        setError("Failed to create business.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create business.");
    }
  };

  const handleBrandSelected = React.useCallback((brand: any) => {
    if (brand) {
      setSelectedBrand(brand);
      // Auto-populate website from brand data
      if (brand.domain) {
        setForm((prev) => ({ ...prev, website: `https://${brand.domain}` }));
      }
    } else {
      setSelectedBrand(null);
    }
  }, []);

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
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add New Business</h1>
              <p className="text-gray-600 mt-1">Create a new business contact</p>
            </div>
          </div>
        </div>

        {/* Brand Banner */}
        {selectedBrand?.images?.find((img: any) => img.type === "banner") && (
          <div className="mb-6 relative">
            <div className="h-48 rounded-lg overflow-hidden shadow-sm border border-gray-200">
              <img
                src={
                  selectedBrand.images.find((img: any) => img.type === "banner")?.formats?.[0]?.src
                }
                alt={`${selectedBrand.name} banner`}
                className="w-full h-full object-cover"
              />
            </div>
            {selectedBrand?.logos?.find((logo: any) => logo.type === "logo") && (
              <div
                className={`absolute -bottom-10 left-6 w-20 h-20 rounded-full border-4 border-white shadow-lg flex items-center justify-center ${
                  selectedBrand.logos.find((logo: any) => logo.type === "logo")?.theme === "dark"
                    ? "bg-white"
                    : "bg-gray-900"
                }`}
              >
                <img
                  src={
                    selectedBrand.logos.find((logo: any) => logo.type === "logo")?.formats?.[0]?.src
                  }
                  alt={`${selectedBrand.name} logo`}
                  className="w-full h-full rounded-full object-contain p-2"
                />
              </div>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
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
                    value={form.name}
                    onChange={(value) => setForm((prev) => ({ ...prev, name: value }))}
                    brandId={form.brandId}
                    onBrandIdChange={(brandId) => setForm((prev) => ({ ...prev, brandId }))}
                    onBrandSelected={handleBrandSelected}
                    required
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <AddressValidationField
                    value={form.address}
                    onChange={(value) => setForm((prev) => ({ ...prev, address: value }))}
                    onLocationChange={(lat, lng, placeId) => {
                      setLocationData((prev) => ({
                        lat,
                        lng,
                        placeId,
                        validatedAddress: prev?.validatedAddress || form.address,
                      }));
                    }}
                    onValidatedAddressChange={(validatedAddress) => {
                      setLocationData((prev) => ({
                        lat: prev?.lat || 0,
                        lng: prev?.lng || 0,
                        placeId: prev?.placeId || "",
                        validatedAddress,
                      }));
                      setForm((prev) => ({ ...prev, address: validatedAddress }));
                    }}
                    label=""
                    fullWidth
                  />
                </div>

                <div>
                  <label htmlFor="taxId" className="block text-sm font-medium text-gray-700 mb-1">
                    Tax ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="taxId"
                    name="taxId"
                    value={form.taxId}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="12-3456789"
                  />
                </div>

                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={form.website}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="https://example.com"
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
                    <span>Add Business</span>
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
