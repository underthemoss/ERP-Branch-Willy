"use client";

import { AddressValidationField } from "@/ui/contacts/AddressValidationField";
import { useCreateBusinessContactMutation } from "@/ui/contacts/api";
import { BusinessNameWithBrandSearch } from "@/ui/contacts/BusinessNameWithBrandSearch";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardMedia,
  CircularProgress,
  Container,
  TextField,
  Typography,
} from "@mui/material";
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
        router.push(`../contacts/${result.data.createBusinessContact.id}`);
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
    <Container maxWidth="sm">
      <Box mt={4} mb={2}>
        <Typography variant="h1" gutterBottom>
          Add New Business
        </Typography>
      </Box>

      {/* Brand Banner */}
      {selectedBrand?.images?.find((img: any) => img.type === "banner") && (
        <Box sx={{ mb: 6, position: "relative" }}>
          <Card sx={{ height: 200, overflow: "visible" }}>
            <CardMedia
              component="img"
              height="200"
              image={
                selectedBrand.images.find((img: any) => img.type === "banner")?.formats?.[0]?.src
              }
              alt={`${selectedBrand.name} banner`}
              sx={{ objectFit: "cover" }}
            />
          </Card>
          {selectedBrand?.logos?.find((logo: any) => logo.type === "logo") && (
            <Avatar
              src={selectedBrand.logos.find((logo: any) => logo.type === "logo")?.formats?.[0]?.src}
              sx={{
                position: "absolute",
                bottom: -40,
                left: 20,
                width: 80,
                height: 80,
                border: "4px solid white",
                bgcolor:
                  selectedBrand.logos.find((logo: any) => logo.type === "logo")?.theme === "dark"
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
                selectedBrand.images.find((img: any) => img.type === "banner")?.formats?.[0]?.src
              }
              alt={`${selectedBrand.name} banner`}
              sx={{ objectFit: "cover" }}
            />
          </Card>
        )}

      <form onSubmit={handleSubmit}>
        <Box display="flex" flexDirection="column" gap={3}>
          <BusinessNameWithBrandSearch
            value={form.name}
            onChange={(value) => setForm((prev) => ({ ...prev, name: value }))}
            brandId={form.brandId}
            onBrandIdChange={(brandId) => setForm((prev) => ({ ...prev, brandId }))}
            onBrandSelected={handleBrandSelected}
            required
          />
          <TextField
            label="Phone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            fullWidth
          />
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
            label="Address"
            fullWidth
          />
          <TextField
            label="Tax ID"
            name="taxId"
            value={form.taxId}
            onChange={handleChange}
            required
            fullWidth
          />
          <TextField
            label="Website"
            name="website"
            value={form.website}
            onChange={handleChange}
            fullWidth
          />
          {error && <Alert severity="error">{error}</Alert>}
          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={loading}
              sx={{ minWidth: 120 }}
            >
              {loading ? <CircularProgress size={24} /> : "Add Business"}
            </Button>
          </Box>
        </Box>
      </form>
    </Container>
  );
}
