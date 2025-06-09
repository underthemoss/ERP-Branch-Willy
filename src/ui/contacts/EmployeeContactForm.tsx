import { graphql } from "@/graphql";
import { useCreatePersonContactMutation, useListBusinessContactsQuery } from "@/ui/contacts/api";
import { Autocomplete, Box, Button, Grid, TextField, Typography } from "@mui/material";
import { DialogProps, useNotifications } from "@toolpad/core";
import { useParams } from "next/navigation";
import React from "react";
import { Controller, useForm } from "react-hook-form";

type EmployeeFormData = {
  name: string;
  phone: string;
  email: string;
  role: string;
  business: {
    id: string;
    label: string;
    profilePicture?: string;
  } | null;
};

export function EmployeeContactForm({ onClose }: Pick<DialogProps, "onClose">) {
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      role: "",
      business: { id: "", label: "", profilePicture: "" },
    },
  });

  const { workspace_id } = useParams<{ workspace_id: string }>();

  const { data: businessContacts } = useListBusinessContactsQuery({
    variables: {
      workspaceId: workspace_id,
      page: {
        size: 10,
        number: 1,
      },
    },
  });

  const businessOptions = businessContacts?.listContacts?.items.map((contact) => {
    if (contact.__typename === "BusinessContact") {
      return {
        id: contact.id,
        label: contact.name,
        profilePicture: contact.profilePicture,
      };
    }
  });
  const [createPersonContact, { loading }] = useCreatePersonContactMutation();
  const notifications = useNotifications();

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      await createPersonContact({
        variables: {
          workspaceId: workspace_id,
          name: data.name,
          phone: data.phone,
          email: data.email,
          role: data.role,
          businessId: data.business?.id as string,
        },
      });

      notifications.show("New contact created!", {
        severity: "success",
      });
      onClose();
    } catch (error) {
      console.error("Error creating contact:", error);
      notifications.show("Faild to create contact", {
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
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <Controller
            name="name"
            control={control}
            rules={{ required: "Name is required" }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Name"
                required
                fullWidth
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Controller
            name="business"
            control={control}
            rules={{ required: "Business is required", validate: (value) => !!value?.id }}
            render={({ field }) => (
              <Autocomplete
                options={businessOptions || []}
                freeSolo={false}
                onChange={(_, value) => field.onChange(value)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Business"
                    fullWidth
                    required
                    error={!!errors.business}
                    helperText={errors.business?.message}
                  />
                )}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Controller
            name="email"
            control={control}
            rules={{ required: "Email is required" }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Email"
                type="email"
                fullWidth
                required
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Controller
            name="role"
            control={control}
            rules={{ required: "Role is required" }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Role"
                fullWidth
                required
                error={!!errors.role}
                helperText={errors.role?.message}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Phone"
                fullWidth
                error={!!errors.phone}
                helperText={errors.phone?.message}
              />
            )}
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
