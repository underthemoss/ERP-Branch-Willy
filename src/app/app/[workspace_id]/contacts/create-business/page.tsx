"use client";

import { AddressValidationField } from "@/ui/contacts/AddressValidationField";
import { useCreateBusinessContactMutation } from "@/ui/contacts/api";
import {
  Alert,
  Box,
  Button,
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
  });
  const [locationData, setLocationData] = React.useState<{
    lat: number;
    lng: number;
    placeId: string;
    validatedAddress: string;
  } | null>(null);
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
        },
      });

      // Log location data for future use when lat/lng/placeId fields are added to the schema
      if (locationData) {
        console.log("Location data saved for future use:", {
          lat: locationData.lat,
          lng: locationData.lng,
          placeId: locationData.placeId,
          address: finalAddress,
        });
      }

      if (result.data?.createBusinessContact?.id) {
        router.push(`../contacts/${result.data.createBusinessContact.id}`);
      } else {
        setError("Failed to create business.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create business.");
    }
  };

  return (
    <Container maxWidth="sm">
      <Box mt={4} mb={2}>
        <Typography variant="h1" gutterBottom>
          Add New Business
        </Typography>
      </Box>
      <form onSubmit={handleSubmit}>
        <Box display="flex" flexDirection="column" gap={3}>
          <TextField
            label="Business Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            fullWidth
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
