import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { DialogProps } from "@toolpad/core";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { Controller, SubmitHandler, useForm, useWatch } from "react-hook-form";
import { useListBusinessContactsQuery } from "../contacts/api";
import { useListProjectsQuery } from "../projects/api";
import { useCreatePriceBookMutation, useListPriceBooksQuery } from "./api";

interface NewPriceBookFields {
  name: string;
  notes?: string;
  isDefault: boolean;
  parentPriceBookId?: string;
  parentPriceBookPercentageFactor?: number;
  businessContactId?: string;
  projectId?: string;
  location?: string;
}

export function NewPriceBookDialog({ open, onClose }: DialogProps) {
  const router = useRouter();
  const { workspace_id } = useParams<{ workspace_id: string }>();
  const [createPriceBook, { loading, error }] = useCreatePriceBookMutation();
  const { data: priceBooksData, loading: priceBooksLoading } = useListPriceBooksQuery({
    variables: { page: { number: 1, size: 100 } },
  });
  const { data: companiesData, loading: companiesLoading } = useListBusinessContactsQuery({
    variables: {
      workspaceId: workspace_id,
      page: { number: 1, size: 100 },
    },
  });
  const { data: projectsData, loading: projectsLoading } = useListProjectsQuery();

  const { control, handleSubmit, setValue, watch } = useForm<NewPriceBookFields>({
    defaultValues: {
      name: "",
      notes: "",
      parentPriceBookPercentageFactor: undefined,
      businessContactId: "",
      projectId: "",
      location: "",
      parentPriceBookId: "",
    },
  });

  // Watch parentPriceBookId to pre-populate company if duplicating
  const parentPriceBookId = useWatch({ control, name: "parentPriceBookId" });

  const onSubmit: SubmitHandler<NewPriceBookFields> = async (data) => {
    console.log("data:", data);
    const response = await createPriceBook({
      variables: {
        input: {
          name: data.name,
          notes: data.notes,
          parentPriceBookId: data.parentPriceBookId || undefined,
          parentPriceBookPercentageFactor:
            data.parentPriceBookId && data.parentPriceBookPercentageFactor !== undefined
              ? data.parentPriceBookPercentageFactor
              : undefined,
          projectId: data.projectId || undefined,
          location: data.location || undefined,
          businessContactId: data.businessContactId || undefined,
        },
      },
    });

    if (response.data?.createPriceBook?.id) {
      onClose();
      router.push(`/app/${workspace_id}/prices/${response.data.createPriceBook.id}`);
    }
  };

  return (
    <Dialog fullWidth open={open} onClose={() => onClose()}>
      <DialogTitle>New Price Book</DialogTitle>
      <DialogContent>
        <Box mt={1} mb={2}>
          A collection of prices, can be used for a project, region or customer.
        </Box>
        {error && (
          <Box color="error.main" mb={2}>
            Error creating price book: {error.message}
          </Box>
        )}
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack spacing={3}>
            {/* Name */}
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField label="Price Book Name" fullWidth variant="outlined" {...field} />
              )}
            />
            {/* Duplicate Price Book Dropdown */}
            <Controller
              name="parentPriceBookId"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Duplicate Price Book From</InputLabel>
                  <Select label="Duplicate Price Book from" {...field} disabled={priceBooksLoading}>
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {priceBooksData?.listPriceBooks?.items?.map((pb: any) => (
                      <MenuItem key={pb.id} value={pb.id}>
                        {pb.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />

            {/* Parent Price Book Factor (only if duplicating) */}
            {parentPriceBookId && (
              <Controller
                name="parentPriceBookPercentageFactor"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Parent Price Book Percentage Factor"
                    type="number"
                    inputProps={{ min: 0, step: 0.01 }}
                    fullWidth
                    variant="outlined"
                    {...field}
                    value={field.value === undefined ? "" : field.value}
                    onChange={(e) =>
                      field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))
                    }
                  />
                )}
              />
            )}

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
                <FormControl fullWidth>
                  <InputLabel>Project</InputLabel>
                  <Select label="Project" {...field} disabled={projectsLoading}>
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {projectsData?.listProjects?.map((project: any) => (
                      <MenuItem key={project.id} value={project.id}>
                        {project.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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

            <Box textAlign="right">
              <Button type="submit" variant="contained" disabled={loading}>
                Create
              </Button>
            </Box>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
