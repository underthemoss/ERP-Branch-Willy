"use client";

import { graphql } from "@/graphql";
import {
  useContactDisplayPage_DeleteContactMutation,
  useContactDisplayPage_GetContactByIdQuery,
} from "@/graphql/hooks";
import ResourceMapSearchSelector from "@/ui/resource_map/ResourceMapSearchSelector";
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
  Grid,
  Paper,
  Typography,
} from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

// --- GraphQL queries and mutations for this component ---
export const CONTACT_DISPLAY_PAGE_GET_CONTACT_BY_ID = graphql(`
  query ContactDisplayPage_GetContactById($id: ID!) {
    getContactById(id: $id) {
      __typename
      ... on PersonContact {
        id
        name
        phone
        notes
        email
        role
        businessId
        resourceMapIds
        createdAt
        updatedAt
        resource_map_entries {
          path
        }
      }
      ... on BusinessContact {
        id
        name
        phone
        notes
        address
        taxId
        website
        createdAt
        updatedAt
        resource_map_entries {
          path
        }
      }
    }
  }
`);

export const CONTACT_DISPLAY_PAGE_DELETE_CONTACT = graphql(`
  mutation ContactDisplayPage_DeleteContact($id: ID!) {
    deleteContactById(id: $id)
  }
`);

export default function ContactDisplayPage() {
  const { contact_id, workspace_id } = useParams<{ contact_id: string; workspace_id: string }>();
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleteContact] = useContactDisplayPage_DeleteContactMutation();
  const [deleting, setDeleting] = React.useState(false);
  const { data, loading, error } = useContactDisplayPage_GetContactByIdQuery({
    variables: { id: contact_id },
    fetchPolicy: "cache-and-network",
  });

  const contact = data?.getContactById;
  const isPerson = contact?.__typename === "PersonContact";
  const isBusiness = contact?.__typename === "BusinessContact";

  // Helper to format ISO date strings
  function formatDate(dateString?: string | null) {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 6, mb: 6 }}>
      {loading && (
        <Typography variant="body1" color="text.secondary">
          Loading contact details...
        </Typography>
      )}
      {(error || !contact) && !loading && (
        <Typography variant="body1" color="error">
          Contact not found.
        </Typography>
      )}
      {contact && (
        <Grid container spacing={3}>
          {/* Main Content */}
          <Grid size={{ xs: 12, md: 8 }}>
            {/* Top Card: Contact Overview */}
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
              <Grid container alignItems="center" justifyContent="space-between">
                <Grid size={{ xs: 12, md: 8 }}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Typography variant="h4" gutterBottom>
                      {contact.name}
                    </Typography>
                    <Chip
                      label={isPerson ? "Person" : "Business"}
                      color={isPerson ? "secondary" : "primary"}
                      sx={{ fontWeight: 600, fontSize: "1rem" }}
                    />
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: { md: "right", xs: "left" } }}>
                  <Button
                    variant="contained"
                    color="primary"
                    sx={{ mr: 1 }}
                    data-testid="edit-contact"
                    onClick={() => router.push(`/app/${workspace_id}/contacts/${contact.id}/edit`)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    data-testid="delete-contact"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    Delete
                  </Button>
                </Grid>
              </Grid>
              <Divider sx={{ my: 2 }} />
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Contact Type: {isPerson ? "Person" : "Business"}
                </Typography>
              </Box>
            </Paper>

            {/* Details Card */}
            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Contact Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box display="flex" flexDirection="column" gap={2}>
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
            </Paper>
          </Grid>

          {/* Sidebar */}
          <Grid size={{ xs: 12, md: 4 }}>
            {/* Metadata Card */}
            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Metadata
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <Box display="flex" flexDirection="column" gap={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    ID
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {contact.id}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Type
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {isPerson ? "Person" : "Business"}
                  </Typography>
                </Box>
                {isPerson && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {contact.email || "—"}
                    </Typography>
                  </Box>
                )}
                {"createdAt" in contact && contact.createdAt && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Created At
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formatDate(contact.createdAt)}
                    </Typography>
                  </Box>
                )}
                {"updatedAt" in contact && contact.updatedAt && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Updated At
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formatDate(contact.updatedAt)}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>

            {/* Reporting Designation Card */}
            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Reporting Designation
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <ResourceMapSearchSelector
                readonly={true}
                onSelectionChange={() => {}}
                selectedIds={isPerson && contact.resourceMapIds ? contact.resourceMapIds : []}
              />
            </Paper>

            {/* Stubbed Help/Support Card */}
            <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: "#fffbe6" }}>
              <Typography variant="body1" sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Box
                  component="span"
                  sx={{
                    display: "inline-block",
                    width: 24,
                    height: 24,
                    bgcolor: "#ffe082",
                    borderRadius: "50%",
                    mr: 1,
                    textAlign: "center",
                    fontWeight: "bold",
                  }}
                >
                  ?
                </Box>
                Need help with this contact?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Our team would be happy to help you with any kind of problem you might have!
              </Typography>
              <Button variant="contained" color="warning" size="small" disabled>
                Get Help (stub)
              </Button>
            </Paper>

            {/* Stubbed Quick Links */}
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Quick Links
              </Typography>
              <Button variant="outlined" size="small" sx={{ mb: 1, width: "100%" }} disabled>
                Invite Team (stub)
              </Button>
              <Button variant="outlined" size="small" sx={{ mb: 1, width: "100%" }} disabled>
                View All Contacts (stub)
              </Button>
              <Button variant="outlined" size="small" sx={{ width: "100%" }} disabled>
                Upgrade Plan (stub)
              </Button>
            </Paper>
          </Grid>
        </Grid>
      )}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={async () => {
          setDeleting(true);
          try {
            await deleteContact({ variables: { id: contact?.id || "" } });
            setDeleteDialogOpen(false);
            router.push(`/app/${workspace_id}/contacts`);
          } catch (err) {
            setDeleting(false);
            alert("Failed to delete contact.");
          }
        }}
        deleting={deleting}
      />
    </Container>
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
