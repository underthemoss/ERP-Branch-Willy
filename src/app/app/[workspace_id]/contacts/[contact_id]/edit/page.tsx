"use client";

import {
  useGetContactByIdQuery,
  useListBusinessContactsQuery,
  useUpdateBusinessContactMutation,
  useUpdatePersonContactMutation,
} from "@/ui/contacts/api";
import ResourceMapSearchSelector from "@/ui/resource_map/ResourceMapSearchSelector";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

export default function EditContactPage() {
  const { workspace_id, contact_id } = useParams<{ workspace_id: string; contact_id: string }>();
  const router = useRouter();

  const {
    data,
    loading: loadingContact,
    error,
  } = useGetContactByIdQuery({
    variables: { id: contact_id },
    fetchPolicy: "cache-and-network",
  });

  // Employee (PersonContact) state
  const [personForm, setPersonForm] = React.useState({
    name: "",
    phone: "",
    email: "",
    role: "",
    businessId: "",
    resourceMapIds: [] as string[],
  });
  const [updateEmployee, { loading: updatingPerson }] = useUpdatePersonContactMutation();

  // Business state
  const [businessForm, setBusinessForm] = React.useState({
    name: "",
    phone: "",
    address: "",
    taxId: "",
    website: "",
  });
  const [updateBusiness, { loading: updatingBusiness }] = useUpdateBusinessContactMutation();

  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Fetch businesses for the businessId select (for PersonContact)
  const { data: businessesData } = useListBusinessContactsQuery({
    variables: { workspaceId: workspace_id, page: {} },
  });
  const businessOptions =
    businessesData?.listContacts?.items
      ?.filter((b) => b?.__typename === "BusinessContact")
      .map((b) => ({
        id: (b as { id?: string }).id ?? "",
        name: (b as { name?: string }).name ?? "",
      })) ?? [];

  // Populate form with contact data
  React.useEffect(() => {
    if (data?.getContactById && data.getContactById.__typename === "PersonContact") {
      setPersonForm({
        name: data.getContactById.name ?? "",
        phone: data.getContactById.phone ?? "",
        email: data.getContactById.email ?? "",
        role: data.getContactById.role ?? "",
        businessId: data.getContactById.businessId ?? "",
        resourceMapIds: data.getContactById.resourceMapIds ?? [],
      });
    } else if (data?.getContactById && data.getContactById.__typename === "BusinessContact") {
      setBusinessForm({
        name: data.getContactById.name ?? "",
        phone: data.getContactById.phone ?? "",
        address: data.getContactById.address ?? "",
        taxId: data.getContactById.taxId ?? "",
        website: data.getContactById.website ?? "",
      });
    }
  }, [data]);

  // Handlers for PersonContact
  const handlePersonChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setPersonForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };
  const handlePersonSelectChange = (e: React.ChangeEvent<{ value: unknown; name?: string }>) => {
    setPersonForm((prev) => ({
      ...prev,
      businessId: e.target.value as string,
    }));
  };

  // Handlers for BusinessContact
  const handleBusinessChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setBusinessForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Submit for PersonContact
  const handlePersonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!personForm.name || !personForm.email || !personForm.role || !personForm.businessId) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }
    try {
      const result = await updateEmployee({
        variables: {
          id: contact_id,
          input: {
            name: personForm.name,
            phone: personForm.phone || undefined,
            email: personForm.email,
            role: personForm.role,
            businessId: personForm.businessId,
            resourceMapIds: personForm.resourceMapIds,
          },
        },
      });
      if (result.data?.updatePersonContact?.id) {
        router.push(`/app/${workspace_id}/contacts/${contact_id}`);
      } else {
        setErrorMsg("Failed to update employee.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update employee.");
    }
  };

  // Submit for BusinessContact
  const handleBusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!businessForm.name || !businessForm.taxId) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }
    try {
      const result = await updateBusiness({
        variables: {
          id: contact_id,
          input: {
            name: businessForm.name,
            phone: businessForm.phone || undefined,
            address: businessForm.address || undefined,
            taxId: businessForm.taxId,
            website: businessForm.website || undefined,
          },
        },
      });
      if (result.data?.updateBusinessContact?.id) {
        router.push(`/app/${workspace_id}/contacts/${contact_id}`);
      } else {
        setErrorMsg("Failed to update business.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update business.");
    }
  };

  if (loadingContact) {
    return (
      <Container maxWidth="sm">
        <Typography variant="h5" mt={4}>
          Loading contact...
        </Typography>
      </Container>
    );
  }

  if (error || !data?.getContactById) {
    return (
      <Container maxWidth="sm">
        <Typography variant="h5" mt={4} color="error">
          Contact not found.
        </Typography>
      </Container>
    );
  }

  const contact = data.getContactById;
  const isPerson = contact.__typename === "PersonContact";
  const isBusiness = contact.__typename === "BusinessContact";

  return (
    <Container maxWidth="sm">
      <Box mt={4} mb={2}>
        <Typography variant="h1" gutterBottom>
          Edit {isPerson ? "Employee" : isBusiness ? "Business" : "Contact"}
        </Typography>
      </Box>
      {isPerson && (
        <form onSubmit={handlePersonSubmit}>
          <Box display="flex" flexDirection="column" gap={3}>
            <TextField
              label="Name"
              name="name"
              value={personForm.name}
              onChange={handlePersonChange}
              required
              fullWidth
            />
            <TextField
              label="Phone"
              name="phone"
              value={personForm.phone}
              onChange={handlePersonChange}
              fullWidth
            />
            <TextField
              label="Email"
              name="email"
              value={personForm.email}
              onChange={handlePersonChange}
              required
              type="email"
              fullWidth
            />
            <TextField
              label="Role"
              name="role"
              value={personForm.role}
              onChange={handlePersonChange}
              required
              fullWidth
            />
            <TextField
              select
              label="Business"
              name="businessId"
              value={personForm.businessId}
              onChange={handlePersonSelectChange}
              required
              fullWidth
            >
              <MenuItem value="">Select a business</MenuItem>
              {businessOptions.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.name}
                </MenuItem>
              ))}
            </TextField>
            <ResourceMapSearchSelector
              selectedIds={personForm.resourceMapIds}
              onSelectionChange={(ids: string[]) =>
                setPersonForm((prev) => ({ ...prev, resourceMapIds: ids }))
              }
              readonly={false}
            />
            {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => router.back()}
                disabled={updatingPerson}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                type="submit"
                disabled={updatingPerson}
                sx={{ minWidth: 120 }}
                data-testid="save-contact"
              >
                {updatingPerson ? <CircularProgress size={24} /> : "Save"}
              </Button>
            </Box>
          </Box>
        </form>
      )}
      {isBusiness && (
        <form onSubmit={handleBusinessSubmit}>
          <Box display="flex" flexDirection="column" gap={3}>
            <TextField
              label="Business Name"
              name="name"
              value={businessForm.name}
              onChange={handleBusinessChange}
              required
              fullWidth
            />
            <TextField
              label="Phone"
              name="phone"
              value={businessForm.phone}
              onChange={handleBusinessChange}
              fullWidth
            />
            <TextField
              label="Address"
              name="address"
              value={businessForm.address}
              onChange={handleBusinessChange}
              fullWidth
            />
            <TextField
              label="Tax ID"
              name="taxId"
              value={businessForm.taxId}
              onChange={handleBusinessChange}
              required
              fullWidth
            />
            <TextField
              label="Website"
              name="website"
              value={businessForm.website}
              onChange={handleBusinessChange}
              fullWidth
            />
            {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => router.back()}
                disabled={updatingBusiness}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                type="submit"
                disabled={updatingBusiness}
                sx={{ minWidth: 120 }}
                data-testid="save-contact"
              >
                {updatingBusiness ? <CircularProgress size={24} /> : "Save Changes"}
              </Button>
            </Box>
          </Box>
        </form>
      )}
    </Container>
  );
}
