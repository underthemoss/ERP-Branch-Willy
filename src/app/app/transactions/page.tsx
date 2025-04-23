"use client";
import * as React from "react";
import {
  DataGridPro,
  GridColDef,
  GridRenderEditCellParams,
  GridRowId,
} from "@mui/x-data-grid-pro";
import { PageContainer } from "@toolpad/core/PageContainer";
import { DateRangePicker } from "@mui/x-date-pickers-pro/DateRangePicker";
import dayjs, { Dayjs } from "dayjs";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import { StepLabel } from "@mui/material";

function MiniCalendarEditCell(props: GridRenderEditCellParams) {
  const value = props.value
    ? [dayjs(props.value?.[0]), dayjs(props.value?.[1])]
    : ([null, null] as any);
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
              <Step>
             2
              </Step>
              <Step>
                1
              </Step>
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
  const rows: Row[] = [
    {
      id: "1",
      product: "Skid steer",
      status: "Received",
    },
    {
      id: "2",
      product: "Telehandler",
      status: "Accepted",
    },
  ];
  return (
    <PageContainer>
      <div style={{ flex: 1, maxHeight: 400 }}>
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
