"use client";

import { useCreateBusinessContactMutation } from "@/ui/contacts/api";
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

export default function CreateBusinessPage() {
  const { workspace_id } = useParams<{ workspace_id: string }>();
  const router = useRouter();

  const [form, setForm] = React.useState({
    name: "",
    phone: "",
    address: "",
    taxId: "",
    website: "",
  });
  const [error, setError] = React.useState<string | null>(null);

  const [createBusiness, { loading }] = useCreateBusinessContactMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name || !form.taxId) {
      setError("Please fill in all required fields.");
      return;
    }
    try {
      const result = await createBusiness({
        variables: {
          workspaceId: workspace_id,
          name: form.name,
          phone: form.phone || undefined,
          address: form.address || undefined,
          taxId: form.taxId,
          website: form.website || undefined,
        },
      });
      if (result.data?.createBusinessContact?.id) {
        router.push(`../contacts/${result.data.createBusinessContact.id}`);
      } else {
        setError("Failed to create business.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create business.");
    }
  };

  return (
    <Container maxWidth="sm">
      <Box mt={4} mb={2}>
        <Typography variant="h1" gutterBottom>
          Add New Business
        </Typography>
      </Box>
      <form onSubmit={handleSubmit}>
        <Box display="flex" flexDirection="column" gap={3}>
          <TextField
            label="Business Name"
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
            label="Address"
            name="address"
            value={form.address}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Tax ID"
            name="taxId"
            value={form.taxId}
            onChange={handleChange}
            required
            fullWidth
          />
          <TextField
            label="Website"
            name="website"
            value={form.website}
            onChange={handleChange}
            fullWidth
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
              {loading ? <CircularProgress size={24} /> : "Add Business"}
            </Button>
          </Box>
        </Box>
      </form>
    </Container>
  );
}
