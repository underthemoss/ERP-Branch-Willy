"use client";

import { GeneratedImage } from "@/ui/GeneratedImage";
import { useGetCurrentUserQuery } from "@/ui/notes/api";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import { Calendar, Check, FileQuestion } from "lucide-react";
import React, { useEffect, useState } from "react";
import { CartItem, ContactInfo, useCart } from "../context/CartContext";

// Check if an item is a custom/unlisted item (no real price)
const isCustomItem = (item: CartItem): boolean => {
  return (
    item.priceId.startsWith("custom-") ||
    (!item.pricePerDayInCents && !item.unitCostInCents && !item.subtotalInCents)
  );
};

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CheckoutModal({ open, onClose }: CheckoutModalProps) {
  const cart = useCart();
  const [error, setError] = useState<string | null>(null);

  // Fetch current user for pre-population
  const { data: userData, loading: userLoading } = useGetCurrentUserQuery({
    fetchPolicy: "cache-and-network",
  });

  // Contact form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [company, setCompany] = useState("");
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [hasPrePopulated, setHasPrePopulated] = useState(false);

  // Pre-populate form with current user data
  useEffect(() => {
    if (userData?.getCurrentUser && !hasPrePopulated && open) {
      const user = userData.getCurrentUser;
      const userFullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
      if (userFullName && !fullName) {
        setFullName(userFullName);
      }
      if (user.email && !email) {
        setEmail(user.email);
      }
      setHasPrePopulated(true);
    }
  }, [userData, hasPrePopulated, open, fullName, email]);

  // Reset pre-populated flag when modal closes
  useEffect(() => {
    if (!open) {
      setHasPrePopulated(false);
    }
  }, [open]);

  const validateEmail = (value: string): boolean => {
    if (!value.trim()) {
      setEmailError("Email is required");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError(null);
    return true;
  };

  const isContactFormValid = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return fullName.trim() !== "" && email.trim() !== "" && emailRegex.test(email);
  };

  const handleSubmit = async () => {
    if (!isContactFormValid()) {
      setError("Please fill in required fields");
      return;
    }
    try {
      setError(null);
      const contactInfo: ContactInfo = {
        fullName,
        email,
        phoneNumber,
        company,
        purchaseOrderNumber: purchaseOrderNumber || undefined,
      };
      await cart.submitRequest(contactInfo);
      // Close modal - the OrderConfirmation will be shown
      onClose();
    } catch (err) {
      console.error("Error submitting request:", err);
      setError("Failed to submit request. Please try again.");
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const formatDate = (date?: Date): string => {
    if (!date) return "-";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatPrice = (cents?: number): string => {
    if (!cents) return "$0.00";
    return `$${(cents / 100).toFixed(2)}`;
  };

  const rentalItems = cart.items.filter((item) => item.priceType === "RENTAL");
  const saleItems = cart.items.filter((item) => item.priceType === "SALE");

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h5" component="span" fontWeight="bold">
          Complete Your Request
        </Typography>
      </DialogTitle>

      <DialogContent>
        {/* Loading state for user data */}
        {userLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {/* Error Message */}
        {error && (
          <Box
            sx={{
              p: 2,
              mb: 3,
              bgcolor: "error.lighter",
              borderRadius: 1,
              border: "1px solid",
              borderColor: "error.light",
            }}
          >
            <Typography variant="body2" color="error.main">
              {error}
            </Typography>
          </Box>
        )}

        <Grid container spacing={3}>
          {/* Left Column: Contact Information */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Typography variant="h6" gutterBottom>
              Your Information
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              We&apos;ll send confirmation and updates to this contact.
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                fullWidth
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                size="small"
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) {
                    validateEmail(e.target.value);
                  }
                }}
                onBlur={(e) => validateEmail(e.target.value)}
                required
                error={!!emailError}
                helperText={emailError}
                size="small"
              />
              <TextField
                fullWidth
                label="Phone Number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                size="small"
              />
              <TextField
                fullWidth
                label="Company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                size="small"
              />
              <TextField
                fullWidth
                label="PO Number (optional)"
                value={purchaseOrderNumber}
                onChange={(e) => setPurchaseOrderNumber(e.target.value)}
                size="small"
              />
            </Box>
          </Grid>

          {/* Right Column: Order Summary */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Typography variant="h6" gutterBottom>
              Order Summary
            </Typography>

            <Box
              sx={{
                maxHeight: 400,
                overflowY: "auto",
                pr: 1,
              }}
            >
              {/* Rental Items */}
              {rentalItems.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
                    Rentals ({rentalItems.length})
                  </Typography>
                  {rentalItems.map((item) => (
                    <Box
                      key={item.tempId}
                      sx={{
                        display: "flex",
                        gap: 1.5,
                        p: 1.5,
                        bgcolor: "grey.50",
                        borderRadius: 1,
                        mb: 1,
                      }}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1,
                          overflow: "hidden",
                          flexShrink: 0,
                        }}
                      >
                        <GeneratedImage
                          entity="price"
                          entityId={item.priceId}
                          size="list"
                          alt={item.priceName}
                          showIllustrativeBanner={false}
                        />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight="medium" noWrap>
                          {item.priceName}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <Calendar size={10} className="text-gray-500" />
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(item.rentalStartDate)} - {formatDate(item.rentalEndDate)}
                          </Typography>
                        </Box>
                        {item.deliveryLocation && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {item.deliveryMethod === "DELIVERY" ? "Delivery" : "Pickup"} •{" "}
                            {item.deliveryLocation}
                          </Typography>
                        )}
                      </Box>
                      {isCustomItem(item) ? (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            color: "warning.main",
                          }}
                        >
                          <FileQuestion size={12} />
                          <Typography variant="caption" fontWeight="medium" color="warning.main">
                            Quote pending
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" fontWeight="medium">
                          {item.subtotalInCents
                            ? formatPrice(item.subtotalInCents)
                            : cart.itemSubtotals[item.tempId]
                              ? formatPrice(cart.itemSubtotals[item.tempId])
                              : `${formatPrice(item.pricePerDayInCents)}/day`}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              )}

              {/* Sale Items */}
              {saleItems.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="success.main" sx={{ mb: 1 }}>
                    Purchases ({saleItems.length})
                  </Typography>
                  {saleItems.map((item) => (
                    <Box
                      key={item.tempId}
                      sx={{
                        display: "flex",
                        gap: 1.5,
                        p: 1.5,
                        bgcolor: "grey.50",
                        borderRadius: 1,
                        mb: 1,
                      }}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1,
                          overflow: "hidden",
                          flexShrink: 0,
                        }}
                      >
                        <GeneratedImage
                          entity="price"
                          entityId={item.priceId}
                          size="list"
                          alt={item.priceName}
                          showIllustrativeBanner={false}
                        />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight="medium" noWrap>
                          {item.priceName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Qty: {item.quantity}
                        </Typography>
                        {item.deliveryDate && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <Calendar size={10} className="text-gray-500" />
                            <Typography variant="caption" color="text.secondary">
                              Delivery: {formatDate(item.deliveryDate)}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      {isCustomItem(item) ? (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            color: "warning.main",
                          }}
                        >
                          <FileQuestion size={12} />
                          <Typography variant="caption" fontWeight="medium" color="warning.main">
                            Quote pending
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" fontWeight="medium">
                          {formatPrice(
                            item.subtotalInCents ?? (item.unitCostInCents || 0) * item.quantity,
                          )}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Total Items
              </Typography>
              <Typography variant="body2">{cart.getTotalItems()}</Typography>
            </Box>

            {/* Show estimated total only if there are priced items */}
            {cart.getCartTotal() > 0 && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mt: 1,
                }}
              >
                <Typography variant="body1" fontWeight="medium">
                  Estimated Total
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {formatPrice(cart.getCartTotal())}
                </Typography>
              </Box>
            )}

            {/* Show note about quote pending items */}
            {cart.items.some(isCustomItem) && (
              <Box
                sx={{
                  mt: 2,
                  p: 1.5,
                  bgcolor: "warning.50",
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "warning.200",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "warning.main" }}>
                  <FileQuestion size={14} />
                  <Typography variant="body2" fontWeight="medium" color="warning.main">
                    Some items require a quote
                  </Typography>
                </Box>
                <Typography
                  variant="caption"
                  color="warning.main"
                  sx={{ display: "block", mt: 0.5 }}
                >
                  We&apos;ll contact you with pricing for unlisted items after you submit.
                </Typography>
              </Box>
            )}

            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              Final pricing will be confirmed based on your selected dates.
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={!isContactFormValid() || cart.isSubmitting}
          startIcon={cart.isSubmitting ? null : <Check size={16} />}
        >
          {cart.isSubmitting ? "Submitting..." : "Submit Request"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
