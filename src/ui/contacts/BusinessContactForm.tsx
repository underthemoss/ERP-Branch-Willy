import { graphql } from "@/graphql";
import { useCreateBusinessContactMutation } from "@/ui/contacts/api";
import { Box, Button, Grid, TextField } from "@mui/material";
import { DialogProps } from "@toolpad/core";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useParams } from "next/navigation";
import React from "react";
import { Controller, useForm } from "react-hook-form";

type FormData = {
  businessName: string;
  address: string;
  taxId: string;
  website?: string;
  phone?: string;
};

export function BusinessContactForm({ onClose }: Pick<DialogProps, "onClose">) {
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      businessName: "",
      address: "",
      taxId: "",
      website: "",
      phone: "",
    },
  });

  const { workspace_id } = useParams<{ workspace_id: string }>();

  const [createBusinessContact, { loading }] = useCreateBusinessContactMutation();
  const notifications = useNotifications();

  const onSubmit = async (data: FormData) => {
    try {
      await createBusinessContact({
        refetchQueries: [],
        variables: {
          workspaceId: workspace_id,
          name: data.businessName,
          phone: data.phone,
          address: data.address,
          taxId: data.taxId,
          website: data.website,
        },
      });
      notifications.show("New Business contact created!", {
        severity: "success",
      });
      onClose();
    } catch (error) {
      console.error("Error creating business contact:", error);
      notifications.show("Faild to create business contact", {
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
      <Grid container spacing="24px">
        <Grid size={{ xs: 12 }}>
          <Controller
            name="businessName"
            control={control}
            rules={{ required: "Business name is required" }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Business Name"
                required
                fullWidth
                error={!!errors.businessName}
                helperText={errors.businessName?.message}
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
            render={({ field }) => <TextField {...field} label="Address" fullWidth />}
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
