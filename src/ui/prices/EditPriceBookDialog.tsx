"use client";

import { useNotification } from "@/providers/NotificationProvider";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { DialogProps } from "@toolpad/core";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { useListBusinessContactsQuery } from "../contacts/api";
import { ProjectSelector } from "../ProjectSelector";
import { useUpdatePriceBookMutation } from "./api";

interface EditPriceBookFields {
  name: string;
  notes?: string;
  businessContactId?: string;
  projectId?: string;
  location?: string;
}

interface EditPriceBookDialogProps extends DialogProps {
  priceBook: {
    id: string;
    name: string;
    notes?: string;
    location?: string;
    businessContactId?: string;
    projectId?: string;
  };
}

export function EditPriceBookDialog({ open, onClose, priceBook }: EditPriceBookDialogProps) {
  const router = useRouter();
  const { workspace_id } = useParams<{ workspace_id: string }>();
  const { notifySuccess, notifyError } = useNotification();
  const [updatePriceBook, { loading }] = useUpdatePriceBookMutation();
  const { data: companiesData, loading: companiesLoading } = useListBusinessContactsQuery({
    variables: {
      workspaceId: workspace_id,
      page: { number: 1, size: 100 },
    },
  });

  const { control, handleSubmit, reset } = useForm<EditPriceBookFields>({
    defaultValues: {
      name: priceBook.name,
      notes: priceBook.notes || "",
      businessContactId: priceBook.businessContactId || "",
      projectId: priceBook.projectId || "",
      location: priceBook.location || "",
    },
  });

  // Reset form when priceBook changes
  useEffect(() => {
    reset({
      name: priceBook.name,
      notes: priceBook.notes || "",
      businessContactId: priceBook.businessContactId || "",
      projectId: priceBook.projectId || "",
      location: priceBook.location || "",
    });
  }, [priceBook, reset]);

  const onSubmit: SubmitHandler<EditPriceBookFields> = async (data) => {
    try {
      await updatePriceBook({
        variables: {
          input: {
            id: priceBook.id,
            name: data.name,
            notes: data.notes || undefined,
            projectId: data.projectId || undefined,
            location: data.location || undefined,
            businessContactId: data.businessContactId || undefined,
          },
        },
        refetchQueries: ["GetPriceBookById"],
      });
      notifySuccess("Price book updated successfully");
      onClose();
    } catch (error: any) {
      notifyError(error?.message || "Failed to update price book");
    }
  };

  return (
    <Dialog fullWidth open={open} onClose={() => onClose()}>
      <DialogTitle>Edit Price Book</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Name */}
            <Controller
              name="name"
              control={control}
              rules={{ required: "Name is required" }}
              render={({ field, fieldState }) => (
                <TextField
                  label="Price Book Name"
                  fullWidth
                  variant="outlined"
                  required
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  {...field}
                />
              )}
            />

            {/* Company Dropdown */}
            <Controller
              name="businessContactId"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Company</InputLabel>
                  <Select label="Company" {...field} disabled={companiesLoading}>
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {companiesData?.listContacts?.items?.map((company: any) => (
                      <MenuItem key={company.id} value={company.id}>
                        {company.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />

            {/* Project Dropdown */}
            <Controller
              name="projectId"
              control={control}
              render={({ field }) => (
                <ProjectSelector
                  projectId={field.value}
                  onChange={(projectId) => field.onChange(projectId)}
                />
              )}
            />

            {/* Location Text Field */}
            <Controller
              name="location"
              control={control}
              render={({ field }) => (
                <TextField label="Location" fullWidth variant="outlined" {...field} />
              )}
            />
            {/* Notes */}
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <TextField
                  label="Notes"
                  multiline
                  rows={4}
                  fullWidth
                  variant="outlined"
                  {...field}
                />
              )}
            />
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose()} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
