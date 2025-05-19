"use client";

import { graphql } from "@/graphql";
import { useListAssetsLazyQuery } from "@/graphql/hooks";
import { Avatar, Box } from "@mui/material";
import { DataGridPro, GridColDef, GridRowScrollEndParams } from "@mui/x-data-grid-pro";
import { PageContainer } from "@toolpad/core/PageContainer";
import * as React from "react";

graphql(`
  query ListAssets($page: ListAssetsPage) {
    listAssets(page: $page) {
      items {
        id
        photo_id
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
  const pageSize = 50;
  const [rows, setRows] = React.useState<any[]>([]);
  const [page, setPage] = React.useState(1);

  const [totalItems, setTotalItems] = React.useState(0);
  const [loadAssets, { data, loading, previousData }] = useListAssetsLazyQuery({
    fetchPolicy: "network-only",
  });

  React.useEffect(() => {
    setRows([]);
    setPage(1);
    loadAssets({ variables: { page: { number: 1, size: pageSize } } });
  }, [loadAssets, pageSize]);

  React.useEffect(() => {
    if (!data) {
      return;
    }
    const items = data.listAssets?.items || [];
    setRows((prev) => [
      ...prev,
      ...items.map((item) => ({
        id: item.id ?? "",
        photo_id: item.photo_id ?? "",
        name: item.name,
        custom_name: item.custom_name,
        description: item.description,
        pim_category_name: item.pim_category_name,
        pim_make: item.pim_make,
        pim_product_name: item.pim_product_name,
        pim_product_model: item.pim_product_model,
        pim_product_year: item.pim_product_year,
      })),
    ]);
    setTotalItems(data.listAssets?.page.totalItems || 0);
    setPage((data.listAssets?.page.number || 0) + 1);
  }, [data]);

  const columns: GridColDef[] = [
    {
      field: "photo_id",
      headerName: "",
      width: 60,
      renderCell: (params) => {
        if (!params.value) return <></>;
        return <Avatar sx={{ width: 32, height: 32, marginTop: 1 }}>{params.value}</Avatar>;
      },
      sortable: false,
      filterable: false,
    },
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
          rowCount={totalItems}
          initialState={{
            pagination: { paginationModel: { pageSize } },
          }}
          hideFooter
          onRowsScrollEnd={(params: GridRowScrollEndParams) => {
            if (!loading && rows.length < totalItems) {
              loadAssets({
                variables: { page: { number: page, size: pageSize } },
              });
            }
          }}
        />
      </Box>
    </PageContainer>
  );
}
