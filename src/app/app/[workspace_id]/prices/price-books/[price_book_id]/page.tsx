"use client";

import { useDeletePriceBookByIdMutation, useGetPriceBookByIdQuery } from "@/ui/prices/api";
import { PricesTable } from "@/ui/prices/PriceBookPricesTable";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Skeleton,
  Typography,
} from "@mui/material";
import { PageContainer } from "@toolpad/core/PageContainer";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

export default function PriceBook() {
  const { price_book_id, workspace_id } = useParams();
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [deletePriceBook] = useDeletePriceBookByIdMutation();

  const { data, loading, error } = useGetPriceBookByIdQuery({
    variables: {
      id: price_book_id as string,
    },
  });

  const priceBook = data?.getPriceBookById;
  const isLoading = loading || !priceBook;
  const hasError = Boolean(error);

  return (
    <PageContainer>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h4" gutterBottom>
          Price Book
        </Typography>
        <Button
          variant="contained"
          color="error"
          onClick={() => setDeleteDialogOpen(true)}
          sx={{ minWidth: 100 }}
        >
          Delete
        </Button>
      </Box>
      {isLoading ? (
        <Card variant="outlined" sx={{ mb: 4, backgroundColor: "#fafbfc" }}>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                gap: 2,
                alignItems: "stretch",
                minHeight: 200,
              }}
            >
              {/* Editable Information (Left) */}
              <Box sx={{ flex: 1, minWidth: 300 }}>
                <Box>
                  <Box
                    sx={{
                      mb: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box>
                      <Skeleton width={40} height={16} variant="text" />
                      <Skeleton width={120} height={32} variant="text" />
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                      <Skeleton width={40} height={16} variant="text" />
                      <Skeleton width={100} height={24} variant="text" />
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      mb: 2,
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      gap: 2,
                      alignItems: { sm: "flex-end" },
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Skeleton width={60} height={16} variant="text" />
                      <Skeleton width="80%" height={24} variant="text" />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Skeleton width={100} height={16} variant="text" />
                      <Skeleton width="60%" height={24} variant="text" />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Skeleton width={60} height={16} variant="text" />
                      <Skeleton width="70%" height={24} variant="text" />
                    </Box>
                  </Box>
                </Box>
              </Box>
              {/* Vertical Divider */}
              <Divider
                orientation="vertical"
                flexItem
                sx={{
                  display: { xs: "none", md: "block" },
                  mx: 2,
                  borderColor: "#e0e0e0",
                }}
              />
              {/* System Information (Right) */}
              <Box sx={{ flex: 1, minWidth: 300 }}>
                <Box>
                  <Box sx={{ mb: 2 }}>
                    <Skeleton width={30} height={16} variant="text" />
                    <Skeleton width={100} height={24} variant="text" />
                  </Box>
                  <Box
                    sx={{
                      mb: 2,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "40px",
                    }}
                  >
                    <Box>
                      <Skeleton width={60} height={16} variant="text" />
                      <Skeleton width={100} height={24} variant="text" />
                    </Box>
                    <Box>
                      <Skeleton width={60} height={16} variant="text" />
                      <Skeleton width={100} height={24} variant="text" />
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      mb: 2,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "40px",
                    }}
                  >
                    <Box>
                      <Skeleton width={60} height={16} variant="text" />
                      <Skeleton width={100} height={24} variant="text" />
                    </Box>
                    <Box>
                      <Skeleton width={60} height={16} variant="text" />
                      <Skeleton width={100} height={24} variant="text" />
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      ) : hasError ? (
        <Typography color="error">Error loading price book</Typography>
      ) : (
        <Card variant="outlined" sx={{ mb: 4, backgroundColor: "#fafbfc" }}>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                gap: 2,
                alignItems: "stretch",
                minHeight: 200,
              }}
            >
              {/* Editable Information (Left) */}
              <Box sx={{ flex: 1, minWidth: 300 }}>
                <Box>
                  <Box
                    sx={{
                      mb: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Name
                      </Typography>
                      <Typography variant="h6">{priceBook.name}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                      <Typography variant="caption" color="text.secondary">
                        Parent
                      </Typography>
                      {priceBook.parentPriceBook ? (
                        <Box>
                          <Link
                            href={`/app/${workspace_id}/prices/${priceBook.parentPriceBook.id}`}
                            passHref
                            style={{ textDecoration: "none", color: "inherit" }}
                          >
                            <Typography
                              sx={{
                                textDecoration: "underline",
                                color: "primary.main",
                                cursor: "pointer",
                                display: "inline",
                              }}
                            >
                              {priceBook.parentPriceBook.name}
                            </Typography>
                          </Link>
                          {priceBook.parentPriceBookPercentageFactor !== undefined &&
                          priceBook.parentPriceBookPercentageFactor !== null ? (
                            <Typography
                              component="span"
                              color="text.secondary"
                              sx={{ ml: 1, display: "inline" }}
                            >
                              ({`${priceBook.parentPriceBookPercentageFactor * 100}%`})
                            </Typography>
                          ) : null}
                        </Box>
                      ) : (
                        <Typography>-</Typography>
                      )}
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      mb: 2,
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      gap: 2,
                      alignItems: { sm: "flex-end" },
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Location
                      </Typography>
                      <Typography>{priceBook.location || "-"}</Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Business Contact
                      </Typography>
                      <Typography>
                        {priceBook.businessContact ? priceBook.businessContact.name : "-"}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Project
                      </Typography>
                      <Typography>{priceBook.project ? priceBook.project.name : "-"}</Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
              {/* Vertical Divider */}
              <Divider
                orientation="vertical"
                flexItem
                sx={{
                  display: { xs: "none", md: "block" },
                  mx: 2,
                  borderColor: "#e0e0e0",
                }}
              />
              {/* System Information (Right) */}
              <Box sx={{ flex: 1, minWidth: 300 }}>
                <Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      ID
                    </Typography>
                    <Typography>{priceBook.id}</Typography>
                  </Box>
                  <Box
                    sx={{
                      mb: 2,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "40px",
                    }}
                  >
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Created By
                      </Typography>
                      <Typography>
                        {priceBook.createdByUser
                          ? `${priceBook.createdByUser.firstName} ${priceBook.createdByUser.lastName}`
                          : "-"}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Created At
                      </Typography>
                      <Typography>
                        {priceBook.createdAt ? new Date(priceBook.createdAt).toLocaleString() : "-"}
                      </Typography>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      mb: 2,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "40px",
                    }}
                  >
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Updated By
                      </Typography>
                      <Typography>
                        {priceBook.updatedByUser
                          ? `${priceBook.updatedByUser.firstName} ${priceBook.updatedByUser.lastName}`
                          : "-"}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Updated At
                      </Typography>
                      <Typography>
                        {priceBook.updatedAt ? new Date(priceBook.updatedAt).toLocaleString() : "-"}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}
      <Divider sx={{ mb: 2 }} />
      <Box>
        <PricesTable />
      </Box>
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={async () => {
          setDeleting(true);
          try {
            await deletePriceBook({ variables: { id: price_book_id as string } });
            setDeleteDialogOpen(false);
            router.push(`/app/${workspace_id}/prices`);
          } catch (err) {
            setDeleting(false);
            alert("Failed to delete price book.");
          }
        }}
        deleting={deleting}
      />
    </PageContainer>
  );
}

// DeleteConfirmationDialog component
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
      <DialogTitle>Delete Price Book</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete this price book? This action cannot be undone.
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
