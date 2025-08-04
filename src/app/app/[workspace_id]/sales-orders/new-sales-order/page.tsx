"use client";

import { graphql } from "@/graphql";
import { useCreateSalesOrderMutation } from "@/graphql/hooks";
import ContactSelector from "@/ui/ContactSelector";
import ProjectSelector from "@/ui/ProjectSelector";
import AddIcon from "@mui/icons-material/Add";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { PageContainer } from "@toolpad/core/PageContainer";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

// GQL mutation for creating a new sales order
const CREATE_SALES_ORDER = graphql(`
  mutation CreateSalesOrder($input: SalesOrderInput!) {
    createSalesOrder(input: $input) {
      id
      buyer_id
      project_id
      purchase_order_number
      company_id
      created_at
      updated_at
      updated_by
    }
  }
`);

export default function NewSalesOrderPage() {
  const { workspace_id } = useParams<{ workspace_id: string }>();
  const router = useRouter();
  const [buyerId, setBuyerId] = React.useState<string | undefined>(undefined);
  const [projectId, setProjectId] = React.useState<string | undefined>(undefined);
  const [purchaseOrderNumber, setPurchaseOrderNumber] = React.useState<string>("");

  // Validation state
  const [errors, setErrors] = React.useState<{
    buyerId?: string;
    projectId?: string;
    purchaseOrderNumber?: string;
  }>({});

  // GQL mutation for creating a new sales order
  const [
    createSalesOrder,
    { data: createSalesOrderData, loading: createSalesOrderLoading, error: createSalesOrderError },
  ] = useCreateSalesOrderMutation();

  // Submit handler
  const handleSubmit = async () => {
    const newErrors: { buyerId?: string; projectId?: string; purchaseOrderNumber?: string } = {};
    if (!buyerId) newErrors.buyerId = "Buyer is required";
    if (!projectId) newErrors.projectId = "Project is required";
    if (!purchaseOrderNumber.trim())
      newErrors.purchaseOrderNumber = "Purchase order number is required";
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      const result = await createSalesOrder({
        variables: {
          input: {
            buyer_id: buyerId!,
            project_id: projectId!,
            purchase_order_number: purchaseOrderNumber.trim(),
          },
        },
      });
      const newId = result.data?.createSalesOrder?.id;
      if (newId) {
        router.push(`/app/${workspace_id}/sales-orders/${newId}`);
      }
    }
  };

  return (
    <PageContainer>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 4, mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="h4" sx={{ flexGrow: 1 }}>
              New sales order
            </Typography>
            <Button variant="outlined" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button
              variant="contained"
              sx={{ ml: 2 }}
              onClick={handleSubmit}
              loading={createSalesOrderLoading}
              disabled={createSalesOrderLoading}
            >
              Create Order
            </Button>
          </Box>
          <Box sx={{ maxWidth: 400 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              Purchase Order Number
            </Typography>
            <TextField
              size="small"
              fullWidth
              value={purchaseOrderNumber}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPurchaseOrderNumber(e.target.value)
              }
              placeholder="Enter purchase order number"
              inputProps={{ "data-testid": "purchase-order-number" }}
              error={!!errors.purchaseOrderNumber}
              helperText={errors.purchaseOrderNumber}
            />
          </Box>
        </Box>

        {/* Buyer & Project */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Buyer
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <ContactSelector
                    workspaceId={workspace_id}
                    contactId={buyerId}
                    onChange={setBuyerId}
                    type="any"
                  />
                  {errors.buyerId && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      {errors.buyerId}
                    </Typography>
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Assign who at this business is responsible for this order. Contacts must be linked
                  to the selected buyer entity.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Project
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <ProjectSelector projectId={projectId} onChange={setProjectId} />
                  {errors.projectId && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      {errors.projectId}
                    </Typography>
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Optional — but recommended. Linking a project helps organize deliveries, billing,
                  and on-site coordination.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </PageContainer>
  );
}
