"use client";

import { useCreatePersonContactMutation, useListBusinessContactsQuery } from "@/ui/contacts/api";
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

export default function CreateEmployeePage() {
  const { workspace_id } = useParams<{ workspace_id: string }>();
  const router = useRouter();

  const [form, setForm] = React.useState({
    name: "",
    phone: "",
    email: "",
    role: "",
    businessId: "",
  });
  const [error, setError] = React.useState<string | null>(null);

  const [createEmployee, { loading }] = useCreatePersonContactMutation();

  // Fetch businesses for the businessId select
  const { data: businessesData } = useListBusinessContactsQuery({
    variables: { workspaceId: workspace_id, page: { size: 10000 } },
  });

  // Type guard for BusinessContact
  function isBusinessContact(b: { __typename?: string }): b is {
    __typename: "BusinessContact";
    id: string;
    name: string;
    profilePicture?: string | null;
  } {
    return b?.__typename === "BusinessContact";
  }

  const businessOptions =
    businessesData?.listContacts?.items?.filter(isBusinessContact).map((b) => ({
      id: b.id ?? "",
      name: b.name ?? "",
    })) ?? [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSelectChange = (e: React.ChangeEvent<{ value: unknown; name?: string }>) => {
    setForm((prev) => ({
      ...prev,
      businessId: e.target.value as string,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name || !form.email || !form.role || !form.businessId) {
      setError("Please fill in all required fields.");
      return;
    }
    try {
      const result = await createEmployee({
        variables: {
          workspaceId: workspace_id,
          name: form.name,
          phone: form.phone || undefined,
          email: form.email,
          role: form.role,
          businessId: form.businessId,
        },
      });
      if (result.data?.createPersonContact?.id) {
        router.push(`../contacts/${result.data.createPersonContact.id}`);
      } else {
        setError("Failed to create employee.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create employee.");
    }
  };

  return (
    <Container maxWidth="sm">
      <Box mt={4} mb={2}>
        <Typography variant="h1" gutterBottom>
          Add New Employee
        </Typography>
      </Box>
      <form onSubmit={handleSubmit}>
        <Box display="flex" flexDirection="column" gap={3}>
          <TextField
            label="Name"
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
          <TextField
            label="Email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            type="email"
            fullWidth
          />
          <TextField
            label="Role"
            name="role"
            value={form.role}
            onChange={handleChange}
            required
            fullWidth
          />
          <TextField
            select
            label="Business"
            name="businessId"
            value={form.businessId}
            onChange={handleSelectChange}
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
              {loading ? <CircularProgress size={24} /> : "Add Employee"}
            </Button>
          </Box>
        </Box>
      </form>
    </Container>
  );
}
