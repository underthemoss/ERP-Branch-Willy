"use client";

import { AddressValidationField } from "@/ui/contacts/AddressValidationField";
import {
  useGetContactByIdQuery,
  useListBusinessContactsQuery,
  useUpdateBusinessContactMutation,
  useUpdatePersonContactMutation,
} from "@/ui/contacts/api";
import { BusinessNameWithBrandSearch } from "@/ui/contacts/BusinessNameWithBrandSearch";
import ResourceMapSearchSelector from "@/ui/resource_map/ResourceMapSearchSelector";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardMedia,
  CircularProgress,
  Container,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
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

  // Fetch businesses for the businessId select (for PersonContact)
  const { data: businessesData } = useListBusinessContactsQuery({
    variables: { workspaceId: workspace_id, page: { size: 1000 } },
    fetchPolicy: "cache-and-network",
  });
  const businessOptions =
    businessesData?.listContacts?.items
      ?.filter((b) => b?.__typename === "BusinessContact")
      .map((b) => ({
        id: (b as { id?: string }).id ?? "",
        name: (b as { name?: string }).name ?? "",
      })) ?? [];

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
      // If there's a brand, fetch and set it
      if (data.getContactById.brand) {
        setSelectedBrand(data.getContactById.brand);
      }
      // Set initial placeId if available
      if (data.getContactById.placeId) {
        setInitialPlaceId(data.getContactById.placeId);
        // Also set initial location data if available
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
  const handlePersonSelectChange = (e: React.ChangeEvent<{ value: unknown; name?: string }>) => {
    setPersonForm((prev) => ({
      ...prev,
      businessId: e.target.value as string,
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
      // Auto-populate website from brand data
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
      // Use validated address if available, otherwise use the original input
      const finalAddress = locationData?.validatedAddress || businessForm.address;

      // Log location data for future schema updates
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
      <Container maxWidth="sm">
        <Typography variant="h5" mt={4}>
          Loading contact...
        </Typography>
      </Container>
    );
  }

  if (error || !data?.getContactById) {
    return (
      <Container maxWidth="sm">
        <Typography variant="h5" mt={4} color="error">
          Contact not found.
        </Typography>
      </Container>
    );
  }

  const contact = data.getContactById;
  const isPerson = contact.__typename === "PersonContact";
  const isBusiness = contact.__typename === "BusinessContact";

  return (
    <Container maxWidth="sm">
      <Box mt={4} mb={2}>
        <Typography variant="h1" gutterBottom>
          Edit {isPerson ? "Employee" : isBusiness ? "Business" : "Contact"}
        </Typography>
      </Box>
      {isPerson && (
        <form onSubmit={handlePersonSubmit}>
          <Box display="flex" flexDirection="column" gap={3}>
            <TextField
              label="Name"
              name="name"
              value={personForm.name}
              onChange={handlePersonChange}
              required
              fullWidth
            />
            <TextField
              label="Phone"
              name="phone"
              value={personForm.phone}
              onChange={handlePersonChange}
              fullWidth
            />
            <TextField
              label="Email"
              name="email"
              value={personForm.email}
              onChange={handlePersonChange}
              required
              type="email"
              fullWidth
            />
            <TextField
              label="Role"
              name="role"
              value={personForm.role}
              onChange={handlePersonChange}
              required
              fullWidth
            />
            <TextField
              select
              label="Business"
              name="businessId"
              value={personForm.businessId}
              onChange={handlePersonSelectChange}
              required
              fullWidth
            >
              <MenuItem value="">Select a business</MenuItem>
              {businessOptions.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.name}
                </MenuItem>
              ))}
            </TextField>
            <ResourceMapSearchSelector
              selectedIds={personForm.resourceMapIds}
              onSelectionChange={(ids: string[]) =>
                setPersonForm((prev) => ({ ...prev, resourceMapIds: ids }))
              }
              readonly={false}
            />
            {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => router.back()}
                disabled={updatingPerson}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                type="submit"
                disabled={updatingPerson}
                sx={{ minWidth: 120 }}
                data-testid="save-contact"
              >
                {updatingPerson ? <CircularProgress size={24} /> : "Save"}
              </Button>
            </Box>
          </Box>
        </form>
      )}
      {isBusiness && (
        <>
          {/* Brand Banner */}
          {selectedBrand?.images?.find((img: any) => img.type === "banner") && (
            <Box sx={{ mb: 8, position: "relative" }}>
              <Card sx={{ height: 200, overflow: "visible" }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={
                    selectedBrand.images.find((img: any) => img.type === "banner")?.formats?.[0]
                      ?.src
                  }
                  alt={`${selectedBrand.name} banner`}
                  sx={{ objectFit: "cover" }}
                />
              </Card>
              {selectedBrand?.logos?.find((logo: any) => logo.type === "logo") && (
                <Avatar
                  src={
                    selectedBrand.logos.find((logo: any) => logo.type === "logo")?.formats?.[0]?.src
                  }
                  sx={{
                    position: "absolute",
                    bottom: -40,
                    left: 20,
                    width: 80,
                    height: 80,
                    border: "4px solid white",
                    bgcolor:
                      selectedBrand.logos.find((logo: any) => logo.type === "logo")?.theme ===
                      "dark"
                        ? "white"
                        : "grey.900",
                    "& img": {
                      objectFit: "contain",
                    },
                  }}
                >
                  {selectedBrand.name?.[0]}
                </Avatar>
              )}
            </Box>
          )}
          {/* Brand Banner without logo overlay */}
          {selectedBrand?.images?.find((img: any) => img.type === "banner") &&
            !selectedBrand?.logos?.find((logo: any) => logo.type === "logo") && (
              <Card sx={{ mb: 3, height: 200 }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={
                    selectedBrand.images.find((img: any) => img.type === "banner")?.formats?.[0]
                      ?.src
                  }
                  alt={`${selectedBrand.name} banner`}
                  sx={{ objectFit: "cover" }}
                />
              </Card>
            )}

          <form onSubmit={handleBusinessSubmit}>
            <Box display="flex" flexDirection="column" gap={3}>
              <BusinessNameWithBrandSearch
                value={businessForm.name}
                onChange={(value) => setBusinessForm((prev) => ({ ...prev, name: value }))}
                brandId={businessForm.brandId}
                onBrandIdChange={(brandId) => setBusinessForm((prev) => ({ ...prev, brandId }))}
                onBrandSelected={handleBrandSelected}
                required
              />
              <TextField
                label="Phone"
                name="phone"
                value={businessForm.phone}
                onChange={handleBusinessChange}
                fullWidth
              />
              <AddressValidationField
                value={businessForm.address}
                onChange={(value) => setBusinessForm((prev) => ({ ...prev, address: value }))}
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
                label="Address"
                fullWidth
                placeId={initialPlaceId}
              />
              <TextField
                label="Tax ID"
                name="taxId"
                value={businessForm.taxId}
                onChange={handleBusinessChange}
                required
                fullWidth
              />
              <TextField
                label="Website"
                name="website"
                value={businessForm.website}
                onChange={handleBusinessChange}
                fullWidth
              />
              {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
              <Box display="flex" justifyContent="flex-end" gap={2}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => router.back()}
                  disabled={updatingBusiness}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={updatingBusiness}
                  sx={{ minWidth: 120 }}
                  data-testid="save-contact"
                >
                  {updatingBusiness ? <CircularProgress size={24} /> : "Save Changes"}
                </Button>
              </Box>
            </Box>
          </form>
        </>
      )}
    </Container>
  );
}
