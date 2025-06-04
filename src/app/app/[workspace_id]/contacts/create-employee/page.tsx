"use client";

import { useCreatePersonContactMutation } from "@/ui/contacts/api";
import ContactSelector from "@/ui/ContactSelector";
import ResourceMapSearchSelector from "@/ui/resource_map/ResourceMapSearchSelector";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  TextField,
  Typography,
} from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

export default function CreateEmployeePage() {
  const { workspace_id } = useParams<{ workspace_id: string }>();
  const router = useRouter();

  const [form, setForm] = React.useState<{
    name: string;
    phone: string;
    email: string;
    role: string;
    businessId: string;
    resourceMapIds: string[];
  }>({
    name: "",
    phone: "",
    email: "",
    role: "",
    businessId: "",
    resourceMapIds: [],
  });
  const [error, setError] = React.useState<string | null>(null);

  const [createEmployee, { loading }] = useCreatePersonContactMutation();

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
          resourceMapIds: form.resourceMapIds,
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
          <ContactSelector
            contactId={form.businessId}
            onChange={(id) => setForm((prev) => ({ ...prev, businessId: id }))}
            type="business"
            workspaceId={workspace_id}
          />
          <ResourceMapSearchSelector
            onSelectionChange={(ids: string[]) =>
              setForm((prev) => ({ ...prev, resourceMapIds: ids }))
            }
            readonly={false}
            selectedIds={form.resourceMapIds}
          />

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
