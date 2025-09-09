import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormHelperText,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DialogProps, useDialogs, useNotifications } from "@toolpad/core";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useSidebar } from "../sidebar/useSidebar";
import { AddressValidationField } from "./AddressValidationField";
import {
  BusinessContact,
  PersonContact,
  useDeleteContactMutation,
  useGetContactByIdQuery,
  useUpdateBusinessContactMutation,
  useUpdatePersonContactMutation,
} from "./api";

type PersonContactFormProps = {
  contact: PersonContact;
  isEditing?: boolean;
  setIsEditing: (isEditing: boolean) => void;
};

type PersonContactFormData = {
  name: string;
  email: string;
  phone?: string;
  notes?: string;
};

export function PersonContactForm({ contact, isEditing, setIsEditing }: PersonContactFormProps) {
  const [updatePersonContact] = useUpdatePersonContactMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PersonContactFormData>({
    defaultValues: {
      name: contact.name,
      email: contact.email,
      phone: contact.phone ?? "",
      notes: contact.notes ?? "",
    },
    mode: "onBlur",
  });

  const onSubmit = async (data: PersonContactFormData) => {
    await updatePersonContact({
      variables: { id: contact.id, input: data },
    });
    setIsEditing(false);
  };

  return (
    <Box component="form" mt={4} onSubmit={handleSubmit(onSubmit)}>
      <Typography fontWeight={600} mb={3}>
        Contact Information
      </Typography>
      <Stack spacing={2}>
        <TextField
          label="Name"
          fullWidth
          disabled={!isEditing}
          error={!!errors.name}
          helperText={errors.name?.message}
          {...register("name", { required: "Name is required" })}
        />
        <TextField
          label="Email Address"
          fullWidth
          disabled={!isEditing}
          error={!!errors.email}
          helperText={errors.email?.message}
          {...register("email", {
            required: "Email is required",
            pattern: {
              value: /^[^@]+@[^@]+\.[^@]+$/,
              message: "Enter a valid email",
            },
          })}
        />
        <TextField label="Primary Number" fullWidth disabled={!isEditing} {...register("phone")} />
        <TextField
          label="Notes"
          fullWidth
          multiline
          minRows={4}
          disabled={!isEditing}
          {...register("notes")}
        />
      </Stack>
      <Box mt={3} display="flex" justifyContent="flex-end" gap={1}>
        <Button
          variant={isEditing ? "outlined" : "contained"}
          onClick={() => {
            if (isEditing) {
              reset();
              setIsEditing(false);
            } else {
              setIsEditing(true);
            }
          }}
        >
          {isEditing ? "Cancel" : "Edit"}
        </Button>
        {isEditing && (
          <Button type="submit" variant="contained">
            Save Changes
          </Button>
        )}
      </Box>
    </Box>
  );
}

type BusinessContactFormProps = {
  contact: BusinessContact;
  isEditing?: boolean;
  setIsEditing: (isEditing: boolean) => void;
};

type BusinessContactFormData = {
  name: string;
  taxId?: string;
  phone?: string;
  website?: string;
  address?: string;
  notes?: string;
  lat?: number | null;
  lng?: number | null;
  placeId?: string;
};

export function BusinessContactForm({
  contact,
  isEditing,
  setIsEditing,
}: BusinessContactFormProps) {
  const [updateBusinessContact] = useUpdateBusinessContactMutation();

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<BusinessContactFormData>({
    defaultValues: {
      name: contact.name,
      taxId: contact.taxId ?? "",
      phone: contact.phone ?? "",
      website: contact.website ?? "",
      address: contact.address ?? "",
      notes: contact.notes ?? "",
      lat: null,
      lng: null,
      placeId: "",
    },
    mode: "onBlur",
  });

  const onSubmit = async (data: BusinessContactFormData) => {
    // Log location data for future schema updates
    if (data.lat && data.lng) {
      console.log("Location data for future schema update:", {
        lat: data.lat,
        lng: data.lng,
        placeId: data.placeId,
      });
    }

    await updateBusinessContact({
      variables: {
        id: contact.id,
        input: {
          name: data.name,
          taxId: data.taxId,
          phone: data.phone,
          website: data.website,
          address: data.address,
          notes: data.notes,
        },
      },
    });
    setIsEditing(false);
  };

  return (
    <Box component="form" mt={4} onSubmit={handleSubmit(onSubmit)}>
      <Typography fontWeight={600} mb={3}>
        Contact Information
      </Typography>
      <Stack spacing={2}>
        <TextField
          label="Name"
          fullWidth
          disabled={!isEditing}
          error={!!errors.name}
          helperText={errors.name?.message}
          {...register("name", { required: "Name is required" })}
        />
        <TextField label="Tax ID" fullWidth disabled={!isEditing} {...register("taxId")} />
        <TextField label="Phone Number" fullWidth disabled={!isEditing} {...register("phone")} />
        <TextField label="Website" fullWidth disabled={!isEditing} {...register("website")} />
        {isEditing ? (
          <Controller
            name="address"
            control={control}
            render={({ field }) => (
              <AddressValidationField
                value={field.value || ""}
                onChange={field.onChange}
                onLocationChange={(lat, lng, placeId) => {
                  setValue("lat", lat);
                  setValue("lng", lng);
                  setValue("placeId", placeId);
                }}
                label="Address"
                fullWidth
              />
            )}
          />
        ) : (
          <TextField
            label="Address"
            fullWidth
            multiline
            minRows={4}
            disabled={true}
            {...register("address")}
          />
        )}
        <TextField
          label="Notes"
          fullWidth
          multiline
          minRows={4}
          disabled={!isEditing}
          {...register("notes")}
        />
      </Stack>
      <Box mt={3} display="flex" justifyContent="flex-end" gap={1}>
        <Button
          variant={isEditing ? "outlined" : "contained"}
          onClick={() => {
            if (isEditing) {
              reset();
              setIsEditing(false);
            } else {
              setIsEditing(true);
            }
          }}
        >
          {isEditing ? "Cancel" : "Edit"}
        </Button>
        {isEditing && (
          <Button type="submit" variant="contained">
            Save Changes
          </Button>
        )}
      </Box>
    </Box>
  );
}

function DeleteContactConfirmationDialog({
  onClose,
  open,
  payload,
}: DialogProps<{ contact: BusinessContact | PersonContact }>) {
  const [deleteContact, { loading, error }] = useDeleteContactMutation();
  const router = useRouter();
  const notifications = useNotifications();
  const { contact } = payload;

  const handleDelete = async () => {
    await deleteContact({ variables: { id: contact.id } });
    onClose();
    router.back();
    notifications.show(`${contact.name} has been deleted`, {
      severity: "success",
      autoHideDuration: 3000,
    });
  };

  return (
    <Dialog fullWidth open={open} onClose={() => onClose()}>
      <DialogTitle>Delete Contact</DialogTitle>
      <DialogContent>Are you sure you want to delete {contact.name}?</DialogContent>
      {error && (
        <FormHelperText error>Something went wrong. Please try again later.</FormHelperText>
      )}
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={() => onClose()}>
          Cancel
        </Button>
        <Button variant="contained" color="error" loading={loading} onClick={handleDelete}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function SidebarSingleContact() {
  const { getSidebarState } = useSidebar();
  const sidebarState = getSidebarState("contact");
  const router = useRouter();
  const dialogs = useDialogs();
  const contactId = sidebarState?.id;

  const { data, loading, error } = useGetContactByIdQuery({
    skip: !contactId,
    variables: { id: contactId || "" },
  });

  const [isEditing, setIsEditing] = useState(false);

  const contact = data?.getContactById;

  if (loading) {
    return (
      <Box p={1}>
        <LinearProgress />
      </Box>
    );
  }

  if (!contact && error?.message.toLowerCase().includes("not found")) {
    return (
      <Box p={1}>
        <Typography>Contact not found</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={1}>
        <Typography>Something went wrong</Typography>
      </Box>
    );
  }

  return (
    <Box p={1}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1}>
        <IconButton size="small" onClick={() => router.back()}>
          <ArrowBackIosNewIcon fontSize="small" />
        </IconButton>
        <Typography variant="h6" fontWeight={600}>
          Contact Info
        </Typography>
      </Stack>

      {/* Avatar + Buttons */}
      <Stack spacing={3} mt={3} direction="row">
        <Avatar
          alt={contact?.name}
          src={contact?.profilePicture || undefined}
          sx={{ width: 80, height: 80 }}
        />
        <Stack spacing={1}>
          <Typography variant="h6" fontWeight={600}>
            {contact?.name}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              color="inherit"
              disabled={isEditing}
              onClick={() =>
                dialogs.open(DeleteContactConfirmationDialog, {
                  contact: contact!,
                })
              }
            >
              Delete
            </Button>
          </Stack>
        </Stack>
      </Stack>

      {/* Form: PersonContact */}
      {contact?.__typename === "PersonContact" && (
        <PersonContactForm contact={contact} isEditing={isEditing} setIsEditing={setIsEditing} />
      )}

      {/* Form: BusinessContact */}
      {contact?.__typename === "BusinessContact" && (
        <BusinessContactForm contact={contact} isEditing={isEditing} setIsEditing={setIsEditing} />
      )}

      {/* Recent Transactions */}
      <Box mt={4}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography fontWeight={600}>Recent Transactions</Typography>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <VisibilityIcon fontSize="small" />
            <Typography variant="body2">12</Typography>
          </Stack>
        </Stack>

        <Box
          mt={2}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          p={2}
          borderRadius={2}
          border="1px solid #e0e0e0"
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <SwapHorizIcon fontSize="small" />
            <Box>
              <Typography fontWeight={500}>R-482020</Typography>
              <Typography variant="body2" color="text.secondary">
                Apr 12, 2025
              </Typography>
            </Box>
          </Stack>
          <IconButton size="small">
            <span>•••</span>
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}
