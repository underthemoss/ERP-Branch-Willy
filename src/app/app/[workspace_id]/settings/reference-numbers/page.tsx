"use client";

import DefaultReferenceNumbersSection from "@/ui/reference-numbers/DefaultReferenceNumbersSection";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export default function ReferenceNumbersSettingsPage() {
  return (
    <Box sx={{ padding: 4, maxWidth: 1200 }}>
      <Typography variant="h4" gutterBottom>
        Reference Numbers Settings
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Configure default reference number templates that will be used for all new purchase orders,
        sales orders and invoices. These templates define how purchase orders, sales orders, and
        invoices are numbered.
      </Typography>

      <DefaultReferenceNumbersSection />
    </Box>
  );
}
