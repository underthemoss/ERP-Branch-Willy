"use client";

import ContactSelector from "@/ui/ContactSelector";
import AddIcon from "@mui/icons-material/Add";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useParams } from "next/navigation";
import * as React from "react";

export default function NewSalesOrderPage() {
  const { workspace_id } = useParams<{ workspace_id: string }>();
  const [buyerId, setBuyerId] = React.useState<string | undefined>(undefined);

  return (
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", mb: 4 }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4">New sales order</Typography>
        </Box>
        <Button variant="outlined">Cancel</Button>
        <Button variant="contained" sx={{ ml: 2 }}>
          Submit Order
        </Button>
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
              <Paper variant="outlined" sx={{ display: "flex", alignItems: "center", p: 2, mb: 2 }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body1" fontWeight={700}>
                    Project Name
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    #849202 • 3274 Dee Meadow Drive, Annapolis Jun...
                  </Typography>
                </Box>
                <KeyboardArrowDownIcon color="action" />
              </Paper>
              <Typography variant="body2" color="text.secondary">
                Optional — but recommended. Linking a project helps organize deliveries, billing,
                and on-site coordination.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Items Table */}
      <Typography variant="h6" gutterBottom>
        Items in this order
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Item Details</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Date Requested</TableCell>
              <TableCell>Term</TableCell>
              <TableCell>Fulfillment</TableCell>
              <TableCell>Rate</TableCell>
              <TableCell>QTY</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>
                <span style={{ marginRight: 8, cursor: "grab", color: "#bbb" }}>⋮⋮</span>
                Medium Track Excavators
              </TableCell>
              <TableCell>Rental</TableCell>
              <TableCell>06/02/2025</TableCell>
              <TableCell>14 days</TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight={700} component="span">
                  Delivery
                </Typography>
                <Typography variant="body2" color="text.secondary" component="span">
                  {" "}
                  3274 Dee Meadow Drive,...
                </Typography>
              </TableCell>
              <TableCell>Standard</TableCell>
              <TableCell>1</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <span style={{ marginRight: 8, cursor: "grab", color: "#bbb" }}>⋮⋮</span>
                Front-Brim Hard Hats
              </TableCell>
              <TableCell>Sale</TableCell>
              <TableCell>--</TableCell>
              <TableCell>--</TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight={700} component="span">
                  Delivery
                </Typography>
                <Typography variant="body2" color="text.secondary" component="span">
                  {" "}
                  3274 Dee Meadow Drive,...
                </Typography>
              </TableCell>
              <TableCell>Standard</TableCell>
              <TableCell>20</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <Button variant="outlined" startIcon={<AddIcon />}>
        Add New Item
      </Button>
    </Box>
  );
}
