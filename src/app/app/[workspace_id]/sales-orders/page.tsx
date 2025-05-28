"use client";

import AddIcon from "@mui/icons-material/Add";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

export default function SalesOrdersPage() {
  return (
    <Box sx={{ p: 4 }}>
      <Grid container spacing={3} mb={4}>
        <Grid sx={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Buyer
              </Typography>
              <Card variant="outlined" sx={{ mt: 1, mb: 2 }}>
                <CardContent>
                  <Typography fontWeight={600}>Business Entity</Typography>
                  <Typography color="text.secondary" fontSize={14}>
                    contact@businessentity.com
                  </Typography>
                </CardContent>
              </Card>
              <Typography color="text.secondary" fontSize={13}>
                Assign who at this business is responsible for this order. Contacts must be linked
                to the selected buyer entity.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid sx={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Project
              </Typography>
              <Card variant="outlined" sx={{ mt: 1, mb: 2 }}>
                <CardContent>
                  <Typography fontWeight={600}>Project Name</Typography>
                  <Typography color="text.secondary" fontSize={14}>
                    #849202 • 3274 Doe Meadow Drive, Annapolis Junction, MD
                  </Typography>
                </CardContent>
              </Card>
              <Typography color="text.secondary" fontSize={13}>
                Optional — but recommended. Linking a project helps organize deliveries, billing,
                and on-site coordination.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h6" mb={2}>
        Items in this order
      </Typography>
      <TableContainer component={Box} sx={{ mb: 2 }}>
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
                <span style={{ fontWeight: 500 }}>Medium Track Excavators</span>
              </TableCell>
              <TableCell>Rental</TableCell>
              <TableCell>06/02/2025</TableCell>
              <TableCell>14 days</TableCell>
              <TableCell>Delivery</TableCell>
              <TableCell>Standard</TableCell>
              <TableCell>1</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <span style={{ fontWeight: 500 }}>Front-Brim Hard Hats</span>
              </TableCell>
              <TableCell>Sale</TableCell>
              <TableCell>--</TableCell>
              <TableCell>--</TableCell>
              <TableCell>Delivery</TableCell>
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
