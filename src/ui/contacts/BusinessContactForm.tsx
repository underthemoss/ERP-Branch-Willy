import { graphql } from "@/graphql";
import { AddressValidationField } from "@/ui/contacts/AddressValidationField";
import { useCreateBusinessContactMutation } from "@/ui/contacts/api";
import { BusinessNameWithBrandSearch } from "@/ui/contacts/BusinessNameWithBrandSearch";
import { Avatar, Box, Button, Card, CardMedia, Grid, TextField, Typography } from "@mui/material";
import { DialogProps } from "@toolpad/core";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useParams } from "next/navigation";
import React, { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";

type FormData = {
  businessName: string;
  address: string;
  taxId: string;
  website?: string;
  phone?: string;
  brandId?: string | null;
};

type LocationData = {
  lat: number;
  lng: number;
  placeId: string;
  validatedAddress: string;
};

export function BusinessContactForm({ onClose }: Pick<DialogProps, "onClose">) {
  const {
    handleSubmit,
    control,
    formState: { errors },
    setValue,
  } = useForm<FormData>({
    defaultValues: {
      businessName: "",
      address: "",
      taxId: "",
      website: "",
      phone: "",
      brandId: null,
    },
  });

  const { workspace_id } = useParams<{ workspace_id: string }>();
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<any>(null);

  const [createBusinessContact, { loading }] = useCreateBusinessContactMutation();
  const notifications = useNotifications();

  const handleBrandSelected = useCallback(
    (brand: any) => {
      if (brand) {
        setSelectedBrand(brand);
        // Handle both brandId (from search) and id (from getBrandById)
        const brandIdValue = brand.brandId || brand.id;
        setValue("brandId", brandIdValue);
        // Auto-populate website from brand data
        if (brand.domain) {
          setValue("website", `https://${brand.domain}`);
        }
        // Note: Brand API doesn't provide address, so we can't auto-populate it
      } else {
        setSelectedBrand(null);
        setValue("brandId", null);
      }
    },
    [setValue],
  );

  const onSubmit = async (data: FormData) => {
    try {
      // Use validated address if available, otherwise use the original input
      const finalAddress = locationData?.validatedAddress || data.address;

      await createBusinessContact({
        refetchQueries: [],
        variables: {
          workspaceId: workspace_id,
          name: data.businessName,
          phone: data.phone,
          address: finalAddress,
          taxId: data.taxId,
          website: data.website,
          brandId: data.brandId,
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

      notifications.show("New Business contact created!", {
        severity: "success",
      });
      onClose();
    } catch (error) {
      console.error("Error creating business contact:", error);
      notifications.show("Failed to create business contact", {
        severity: "error",
      });
      return;
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      sx={{ maxWidth: 600, mx: "auto", mt: 4 }}
    >
      {/* Brand Banner */}
      {selectedBrand?.images?.find((img: any) => img.type === "banner") && (
        <Card sx={{ mb: 3, position: "relative", height: 200 }}>
          <CardMedia
            component="img"
            height="200"
            image={
              selectedBrand.images.find((img: any) => img.type === "banner")?.formats?.[0]?.src
            }
            alt={`${selectedBrand.name} banner`}
            sx={{ objectFit: "cover" }}
          />
          {selectedBrand?.logos?.find((logo: any) => logo.type === "logo") && (
            <Avatar
              src={selectedBrand.logos.find((logo: any) => logo.type === "logo")?.formats?.[0]?.src}
              sx={{
                position: "absolute",
                bottom: -30,
                left: 20,
                width: 80,
                height: 80,
                border: "4px solid white",
              }}
            >
              {selectedBrand.name?.[0]}
            </Avatar>
          )}
        </Card>
      )}

      <Grid container spacing="24px" sx={{ mt: selectedBrand?.images?.length ? 4 : 0 }}>
        <Grid size={{ xs: 12 }}>
          <Controller
            name="businessName"
            control={control}
            rules={{ required: "Business name is required" }}
            render={({ field, fieldState }) => (
              <Controller
                name="brandId"
                control={control}
                render={({ field: brandField }) => (
                  <BusinessNameWithBrandSearch
                    value={field.value}
                    onChange={field.onChange}
                    brandId={brandField.value || null}
                    onBrandIdChange={brandField.onChange}
                    onBrandSelected={handleBrandSelected}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    required
                  />
                )}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Controller
            name="taxId"
            control={control}
            rules={{ required: "Tax ID is required" }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Tax ID"
                required
                fullWidth
                error={!!errors.taxId}
                helperText={errors.taxId?.message}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Controller
            name="address"
            control={control}
            render={({ field, fieldState }) => (
              <AddressValidationField
                value={field.value}
                onChange={field.onChange}
                onLocationChange={(lat, lng, placeId) => {
                  setLocationData((prev) => ({
                    lat,
                    lng,
                    placeId,
                    validatedAddress: prev?.validatedAddress || field.value,
                  }));
                }}
                onValidatedAddressChange={(validatedAddress) => {
                  setLocationData((prev) => ({
                    lat: prev?.lat || 0,
                    lng: prev?.lng || 0,
                    placeId: prev?.placeId || "",
                    validatedAddress,
                  }));
                  field.onChange(validatedAddress);
                }}
                error={fieldState.error}
                label="Address"
                fullWidth
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Controller
            name="website"
            control={control}
            render={({ field }) => <TextField {...field} label="Website" fullWidth />}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => <TextField {...field} label="Phone" fullWidth />}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Box display="flex" justifyContent="flex-end" gap="20px" mt="50px">
            <Button
              type="reset"
              variant="text"
              color="secondary"
              disabled={loading}
              onClick={() => onClose()}
            >
              cancel
            </Button>
            <Button type="submit" variant="contained" color="primary" loading={loading}>
              create
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
