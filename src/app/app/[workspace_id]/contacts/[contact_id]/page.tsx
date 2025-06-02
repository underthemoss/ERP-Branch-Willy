"use client";

import { useDeleteContactMutation, useGetContactByIdQuery } from "@/ui/contacts/api";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Typography,
} from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

export default function ContactDisplayPage() {
  const { contact_id, workspace_id } = useParams<{ contact_id: string; workspace_id: string }>();
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleteContact] = useDeleteContactMutation();
  const [deleting, setDeleting] = React.useState(false);
  const { data, loading, error } = useGetContactByIdQuery({
    variables: { id: contact_id },
    fetchPolicy: "cache-and-network",
  });

  if (loading) {
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
    <>
      <Container maxWidth="sm">
        <Box mt={4} mb={2} display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h1" gutterBottom>
              {contact.name}
            </Typography>
            <Chip
              label={isPerson ? "Person" : "Business"}
              color={isPerson ? "secondary" : "primary"}
              sx={{ fontWeight: 600, fontSize: "1rem" }}
            />
          </Box>
          {(isPerson || isBusiness) && (
            <Box display="flex" gap={1}>
              <Button
                variant="contained"
                color="primary"
                sx={{ height: 40 }}
                data-testid="edit-contact"
                onClick={() => router.push(`/app/${workspace_id}/contacts/${contact.id}/edit`)}
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                color="error"
                sx={{ height: 40 }}
                data-testid="delete-contact"
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete
              </Button>
            </Box>
          )}
        </Box>
        <Card>
          <CardContent>
            <Box display="flex" flexDirection="column" gap={2}>
              <Typography variant="subtitle1" color="text.secondary">
                Contact Details
              </Typography>
              <Divider />
              <Typography>
                <strong>Phone:</strong> {contact.phone || "—"}
              </Typography>
              {isPerson && (
                <>
                  <Typography>
                    <strong>Email:</strong> {contact.email || "—"}
                  </Typography>
                  <Typography>
                    <strong>Role:</strong> {contact.role || "—"}
                  </Typography>
                  <Typography>
                    <strong>Business ID:</strong> {contact.businessId || "—"}
                  </Typography>
                </>
              )}
              {isBusiness && (
                <>
                  <Typography>
                    <strong>Address:</strong> {contact.address || "—"}
                  </Typography>
                  <Typography>
                    <strong>Tax ID:</strong> {contact.taxId || "—"}
                  </Typography>
                  <Typography>
                    <strong>Website:</strong> {contact.website || "—"}
                  </Typography>
                </>
              )}
              <Typography>
                <strong>Notes:</strong> {contact.notes || "—"}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={async () => {
          setDeleting(true);
          try {
            await deleteContact({ variables: { id: contact.id } });
            setDeleteDialogOpen(false);
            router.push(`/app/${workspace_id}/contacts`);
          } catch (err) {
            setDeleting(false);
            alert("Failed to delete contact.");
          }
        }}
        deleting={deleting}
      />
    </>
  );
}

// Add the confirmation dialog at the end of the component
function DeleteConfirmationDialog({
  open,
  onClose,
  onConfirm,
  deleting,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deleting?: boolean;
}) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Delete Contact</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete this contact? This action cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={deleting}>
          Cancel
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained" disabled={deleting}>
          {deleting ? "Deleting..." : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
