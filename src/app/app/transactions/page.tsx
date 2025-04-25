"use client";

import { graphql } from "@/graphql";
import { TransactionType } from "@/graphql/graphql";
import { useCreateTransactionMutation, useGetTransactionsQuery } from "@/graphql/hooks";
import { Box, Button } from "@mui/material";
import Step from "@mui/material/Step";
import Stepper from "@mui/material/Stepper";
import { DataGridPro, GridColDef, GridRenderEditCellParams, GridRowId } from "@mui/x-data-grid-pro";
import { DateRangePicker } from "@mui/x-date-pickers-pro/DateRangePicker";
import { PageContainer } from "@toolpad/core/PageContainer";
import dayjs, { Dayjs } from "dayjs";
import * as React from "react";

graphql(`
  query getTransactions {
    listTransactions {
      items {
        __typename

        ... on BaseTransaction {
          id
          type
        }
        ... on RentalTransaction {
          id
          assetId
          pimId
          startDate
          endDate
        }
      }
    }
  }
`);

graphql(`
  mutation createTransaction($input: TransactionInput!) {
    createTransaction(input: $input) {
      ... on BaseTransaction {
        id
      }
    }
  }
`);

function MiniCalendarEditCell(props: GridRenderEditCellParams) {
  const value = props.value ? [dayjs(props.value?.[0]), dayjs(props.value?.[1])] : ([null, null] as any);
  return (
    <DateRangePicker
      sx={{ flex: 1, border: 0 }}
      defaultValue={value || undefined}
      onChange={([start, end]) => {
        props.api.setEditCellValue({
          id: props.id,
          field: "date_range",
          value: [start?.toDate(), end?.toDate()],
        });
      }}
    />
  );
}
type Row = {
  id: string;
  product?: string;
  date_range?: [Date, Date];
  status: string;
};

export default function ColumnVirtualizationGrid() {
  const { data, loading, refetch } = useGetTransactionsQuery({});
  const [createTransaction] = useCreateTransactionMutation({});
  console.log(data);
  const columns: readonly GridColDef<Row>[] = [
    {
      field: "id",
      headerName: "TXN",
    },
    {
      field: "product",
      headerName: "Product",
      editable: true,
    },
    {
      field: "assignment",
      headerName: "Assignment",
      editable: true,
    },
    {
      field: "date_range",
      headerName: "Dates",
      editable: true,
      minWidth: 270,
      renderEditCell: MiniCalendarEditCell,
      renderCell({ value }) {
        // if (!value) return "";
        // const startDate = dayjs(value?.[0]);
        // const endDate = dayjs(value?.[1]);
        // const rangeText = `${startDate.format("MMM D, YYYY")} - ${endDate.format("MMM D, YYYY")}`;

        return (
          <div
            style={{
              flex: 1,

              width: "100%",
              margin: 0,
              padding: 0,
            }}
          >
            <Stepper>
              <Step>2</Step>
              <Step>1</Step>
            </Stepper>
          </div>
        );
      },
    },
    {
      field: "location",
      headerName: "Location",
      type: "string",
    },
    {
      field: "status",
      headerName: "Status",
      type: "string",
    },
    {
      field: "notes",
      headerName: "Notes",
      type: "string",
    },
  ];

  const rows: Row[] =
    data?.listTransactions.items.map((item) => {
      if (item.__typename === "RentalTransaction")
        return {
          id: item.id,
          product: item.pimId || "",
          status: item.type?.toString() || "",
          notes: item.__typename,
        };
      return {
        id: item.id,
        notes: item.__typename,
        product: "",
        status: "",
      };
    }) || [];

  return (
    <PageContainer maxWidth={false}>
      <Box display={"flex"}>
        <Box flex={1}></Box>
        <Button
          onClick={async () => {
            await createTransaction({ variables: { input: { projectId: "", type: TransactionType.Rental, workspaceId: "" } } });
            refetch();
          }}
        >
          Add
        </Button>
      </Box>
      <div style={{ flex: 1 }}>
        <DataGridPro
          columns={columns}
          rows={rows}
          columnBufferPx={100}
          pinnedColumns={{
            left: ["id", "product", "assignment", "location"],
            right: ["status", "notes"],
          }}
        />
      </div>
    </PageContainer>
  );
}
