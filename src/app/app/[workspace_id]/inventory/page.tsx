"use client";

import { graphql } from "@/graphql";
import { useListAssetsQuery } from "@/graphql/hooks";
import { Box } from "@mui/material";
import { DataGridPro, GridColDef } from "@mui/x-data-grid-pro";
import { PageContainer } from "@toolpad/core/PageContainer";
import * as React from "react";

graphql(`
  query ListAssets($page: ListAssetsPage) {
    listAssets(page: $page) {
      items {
        id
        name
        custom_name
        description
        pim_category_name
        pim_make
        pim_product_name
        pim_product_model
        pim_product_year
      }
      page {
        number
        size
        totalItems
        totalPages
      }
    }
  }
`);

export default function Inventory() {
  const [page, setPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const { data, loading, previousData } = useListAssetsQuery({
    variables: { page: { number: page + 1, size: pageSize } },
    fetchPolicy: "network-only",
  });
  console.log(page);
  const rows =
    (data || previousData)?.listAssets?.items.map((item) => ({
      id: item.id ?? "",
      name: item.name,
      custom_name: item.custom_name,
      description: item.description,
      pim_category_name: item.pim_category_name,
      pim_make: item.pim_make,
      pim_product_name: item.pim_product_name,
      pim_product_model: item.pim_product_model,
      pim_product_year: item.pim_product_year,
    })) || [];

  const totalItems =
    (data || previousData)?.listAssets?.page.totalItems ?? 0;

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 100 },
    { field: "name", headerName: "Name", flex: 1 },
    { field: "custom_name", headerName: "Custom Name", flex: 1 },
    { field: "description", headerName: "Description", flex: 1 },
    { field: "pim_category_name", headerName: "Category", flex: 1 },
    { field: "pim_make", headerName: "Make", flex: 1 },
    { field: "pim_product_name", headerName: "Product Name", flex: 1 },
    { field: "pim_product_model", headerName: "Model", flex: 1 },
    { field: "pim_product_year", headerName: "Year", width: 120 },
  ];

  return (
    <PageContainer>
      <Box sx={{ height: 600, width: "100%" }}>
        <DataGridPro
          columns={columns}
          rows={rows}
          loading={loading}
          pagination
          paginationMode="server"
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model) => {
            console.log({ model });
            setPage(model.page);
            setPageSize(model.pageSize);
          }}
          pageSizeOptions={[10, 25, 50]}
          rowCount={totalItems}
        />
      </Box>
    </PageContainer>
  );
}
