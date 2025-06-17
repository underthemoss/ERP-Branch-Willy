import React, { useState } from "react";
import { Meta, StoryObj } from "@storybook/react";
import AnnotatedDatePicker, { DayAnnotationMap } from "./AnnotatedDatePicker";
import dayjs, { Dayjs } from "dayjs";
import { Box, Typography } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

const meta: Meta<typeof AnnotatedDatePicker> = {
  title: "UI/AnnotatedDatePicker",
  component: AnnotatedDatePicker,
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof AnnotatedDatePicker>;

const today = dayjs();
const startOfMonth = today.startOf("month");
const endOfMonth = today.endOf("month");

// Generate a price map for the current month (e.g., every 3rd day has a price)
const prices: DayAnnotationMap = {};
for (let i = 0; i <= endOfMonth.diff(startOfMonth, "day"); i++) {
  const d = startOfMonth.add(i, "day");
  if (d.date() % 3 === 0) {
    prices[d.format("YYYY-MM-DD")] = {
      badge: {},
      tooltip: "$" + (d.date() * 10).toFixed(2),
    };
  }
}

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<Dayjs | null>(today);

    return (
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box>
          <Typography variant="h6" gutterBottom>
            AnnotatedDatePicker Example
          </Typography>
          <AnnotatedDatePicker
            value={value}
            onChange={setValue}
            dayAnnotations={prices}
            label="Select a date"
            disablePast={false}
          />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Selected date: {value ? value.format("YYYY-MM-DD") : "None"}
          </Typography>
        </Box>
        <pre>{JSON.stringify(prices, undefined, 2)}</pre>
      </LocalizationProvider>
    );
  },
};
