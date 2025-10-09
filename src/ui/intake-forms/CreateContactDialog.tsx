"use client";

import { graphql } from "@/graphql";
import { useNotification } from "@/providers/NotificationProvider";
import { useCreatePersonContactMutation, useListBusinessContactsQuery } from "@/ui/contacts/api";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";

interface CreateContactDialogProps {
  open: boolean;
  onClose: () => void;
  onContactCreated: (contactId: string) => void;
  workspaceId: string;
  initialData?: {
    name?: string;
    email?: string;
    phone?: string;
    companyName?: string;
  };
  type: "buyer" | "vendor";
}

type ContactFormData = {
  name: string;
  phone: string;
  email: string;
  role: string;
  business: {
    id: string;
    label: string;
    profilePicture: string;
  } | null;
};

export function CreateContactDialog({
  open,
  onClose,
  onContactCreated,
  workspaceId,
  initialData,
  type,
}: CreateContactDialogProps) {
  const { notifySuccess, notifyError } = useNotification();
  const [isCreating, setIsCreating] = useState(false);

  const {
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ContactFormData>({
    defaultValues: {
      name: initialData?.name || "",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      role: type === "buyer" ? "Customer" : "Vendor",
      business: null,
    },
  });

  // Reset form when dialog opens with new initial data
  useEffect(() => {
    if (open && initialData) {
      reset({
        name: initialData.name || "",
        phone: initialData.phone || "",
        email: initialData.email || "",
        role: type === "buyer" ? "Customer" : "Vendor",
        business: null,
      });
    }
  }, [open, initialData, reset, type]);

  // Fetch business contacts for the dropdown
  const { data: businessContacts, loading: loadingBusinesses } = useListBusinessContactsQuery({
    variables: {
      workspaceId: workspaceId,
      page: {
        size: 100,
        number: 1,
      },
    },
    skip: !open,
  });

  const businessOptions = useMemo(
    () =>
      businessContacts?.listContacts?.items
        ?.filter((contact): contact is any => contact.__typename === "BusinessContact")
        ?.map((contact) => ({
          id: contact.id,
          label: contact.name,
          profilePicture: contact.profilePicture || "",
        })) || [],
    [businessContacts],
  );

  // Try to match company name if provided
  useEffect(() => {
    if (initialData?.companyName && businessOptions.length > 0) {
      const matchedBusiness = businessOptions.find(
        (business) => business.label.toLowerCase() === initialData.companyName?.toLowerCase(),
      );
      if (matchedBusiness) {
        setValue("business", matchedBusiness);
      }
    }
  }, [initialData?.companyName, businessOptions, setValue]);

  const [createPersonContact] = useCreatePersonContactMutation();

  const onSubmit = async (data: ContactFormData) => {
    if (!data.business?.id) {
      notifyError("Please select a business for this contact");
      return;
    }

    setIsCreating(true);
    try {
      const result = await createPersonContact({
        variables: {
          workspaceId: workspaceId,
          name: data.name,
          phone: data.phone,
          email: data.email,
          role: data.role,
          businessId: data.business.id,
        },
      });

      if (result.data?.createPersonContact?.id) {
        notifySuccess(`Contact "${data.name}" created successfully`);
        onContactCreated(result.data.createPersonContact.id);
        onClose();
      } else {
        throw new Error("Failed to create contact");
      }
    } catch (error: any) {
      console.error("Error creating contact:", error);
      notifyError(error.message || "Failed to create contact");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New {type === "buyer" ? "Buyer" : "Vendor"} Contact</DialogTitle>
      <DialogContent>
        {initialData && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Creating a new contact based on the intake form submission data. Please review and
            complete all required fields.
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 2 }}>
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
                    autoFocus
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Controller
                name="business"
                control={control}
                rules={{
                  required: "Business is required",
                  validate: (value) => !!value?.id || "Please select a valid business",
                }}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    options={businessOptions}
                    loading={loadingBusinesses}
                    getOptionLabel={(option) => option.label || ""}
                    isOptionEqualToValue={(option, value) => option.id === value?.id}
                    onChange={(_, value) => field.onChange(value)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Business"
                        fullWidth
                        required
                        error={!!errors.business}
                        helperText={
                          errors.business?.message ||
                          (initialData?.companyName && !field.value
                            ? `Suggestion: ${initialData.companyName}`
                            : "")
                        }
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
                rules={{
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                }}
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
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isCreating}>
          Cancel
        </Button>
        <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={isCreating}>
          {isCreating ? "Creating..." : "Create Contact"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
