"use client";

import { PriceBookFields, useListPriceBooksQuery } from "@/ui/prices/api";
import { NewPriceBookDialog } from "@/ui/prices/NewPriceBookDialog";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { DataGridPro, GridColDef } from "@mui/x-data-grid-pro";
import { useDialogs } from "@toolpad/core/useDialogs";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

export default function Prices() {
  const dialogs = useDialogs();
  const { data, loading, error } = useListPriceBooksQuery({
    variables: {
      page: {
        size: 100,
      },
    },
    fetchPolicy: "cache-and-network",
  });
  const router = useRouter();
  const { workspace_id } = useParams<{ workspace_id: string }>();

  // Define columns for the DataGridPro
  const columns = React.useMemo<GridColDef<any>[]>(
    () => [
      { field: "name", headerName: "Name", minWidth: 150, flex: 1 },
      {
        field: "businessContactName",
        headerName: "Business Contact",
        flex: 1,
      },
      {
        field: "projectName",
        headerName: "Project",
        flex: 1,
      },
      { field: "location", headerName: "Location", minWidth: 150, flex: 1 },
      { field: "createdBy", headerName: "Created By", flex: 1 },
      {
        field: "updatedAt",
        headerName: "Updated At",
        flex: 1,
        valueGetter: (value: string) => new Date(value).toLocaleString(),
      },
      {
        field: "parentPriceBookName",
        headerName: "Parent Price Book",
        flex: 1,
      },
      {
        field: "parentPriceBookPercentageFactor",
        headerName: "Parent % Factor",
        flex: 1,
      },
    ],
    [],
  );

  // Prepare rows for the DataGridPro
  const rows = React.useMemo<any[]>(() => {
    if (!data?.listPriceBooks?.items) return [];
    return data.listPriceBooks.items.map((item) => ({
      ...item,
      id: item.id, // DataGridPro expects an 'id' field
      parentPriceBookName:
        item.parentPriceBook && item.parentPriceBook.name ? item.parentPriceBook.name : "",
      businessContactName:
        item.businessContact && item.businessContact.name ? item.businessContact.name : "",
      projectName: item.project && item.project.name ? item.project.name : "",
      createdBy: `${item.createdByUser?.firstName} ${item.createdByUser?.lastName}`,
      updatedAt: item.updatedAt,
    }));
  }, [data]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Price Books
      </Typography>
      <Box sx={{ height: 500, width: "100%", mb: 2 }}>
        <DataGridPro
          rows={rows}
          columns={columns}
          loading={loading}
          onRowClick={(params) => {
            router.push(`/app/${workspace_id}/prices/price-books/${params.id}`);
          }}
          disableRowSelectionOnClick
        />
      </Box>
      <Box sx={{ mt: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => dialogs.open(NewPriceBookDialog)}
        >
          Create New Price Book
        </Button>
      </Box>
    </Box>
  );
}
