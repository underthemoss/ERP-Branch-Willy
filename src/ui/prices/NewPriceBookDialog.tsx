import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  TextField,
} from "@mui/material";
import { DialogProps } from "@toolpad/core";
import { useParams, useRouter } from "next/navigation";
import { Router } from "next/router";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { useCreatePriceBookMutation } from "./api";

interface NewPriceBookFields {
  name: string;
  notes?: string;
  isDefault: boolean;
}

export function NewPriceBookDialog({ open, onClose }: DialogProps) {
  const router = useRouter();
  const { workspace_id } = useParams<{ workspace_id: string }>();
  const [createPriceBook, { loading, error }] = useCreatePriceBookMutation();
  const { control, handleSubmit } = useForm<NewPriceBookFields>({
    defaultValues: {
      name: "",
      notes: "",
      isDefault: false,
    },
  });

  const onSubmit: SubmitHandler<NewPriceBookFields> = async (data) => {
    const response = await createPriceBook({
      variables: {
        input: {
          name: data.name,
          notes: data.notes,
          isDefault: data.isDefault,
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
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField label="Price Book Name" fullWidth variant="outlined" {...field} />
              )}
            />
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

            <Controller
              name="isDefault"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={field.value} />}
                  label="Set as default price book"
                />
              )}
            />

            <Box textAlign="right">
              <Button type="submit" variant="contained" loading={loading}>
                Create
              </Button>
            </Box>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
