"use client";

import {
  Badge,
  Box,
  styled,
  Tooltip,
  tooltipClasses,
  TooltipProps,
  Typography,
} from "@mui/material";
import { DatePicker, DatePickerProps } from "@mui/x-date-pickers/DatePicker";
import { renderDateViewCalendar } from "@mui/x-date-pickers/dateViewRenderers";
import { PickersDay, PickersDayProps } from "@mui/x-date-pickers/PickersDay";
import dayjs, { Dayjs } from "dayjs";
import React from "react";

export type DayAnnotationMap = Record<string, { badge?: {}; tooltip?: string }>;

export interface AnnotatedDatePickerProps
  extends Omit<DatePickerProps, "renderDay" | "value" | "onChange"> {
  value: Dayjs | null;
  onChange: (date: Dayjs | null) => void;
  dayAnnotations: DayAnnotationMap;
}

const LightTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.common.white,
    color: "rgba(0, 0, 0, 0.87)",
    boxShadow: theme.shadows[2],
    fontSize: 11,
  },
}));

function AnnotatedDay(props: PickersDayProps) {
  // @ts-expect-error dayAnnotations is injected via slotProps, but not typed in PickersDayProps
  const dayAnnotations: DayAnnotationMap = props.dayAnnotations || {};
  const { day, outsideCurrentMonth, ...other } = props;
  const dayKey = day.format("YYYY-MM-DD");
  const dayAnnotation =
    !outsideCurrentMonth && dayAnnotations?.[dayKey]
      ? dayAnnotations[dayKey]
      : null;

  return (
    <LightTooltip title={dayAnnotation?.tooltip || ""}>
      <span>
        <Badge
          key={day.toString()}
          variant="dot"
          overlap="circular"
          color="secondary"
          invisible={!dayAnnotation}
        >
          <PickersDay
            {...other}
            outsideCurrentMonth={outsideCurrentMonth}
            day={day}
          />
        </Badge>
      </span>
    </LightTooltip>
  );
}

/**
 * AnnotatedDatePicker
 * A MUI DatePicker that displays annotations (badges/tooltips) under each day cell if provided for that date.
 */
export function AnnotatedDatePicker({
  value,
  onChange,
  dayAnnotations,
  ...props
}: AnnotatedDatePickerProps) {
  return (
    <DatePicker
      value={value}
      disableHighlightToday
      disablePast
      minDate={dayjs().add(5)}
      onChange={onChange}
      {...props}
      slots={{
        day: AnnotatedDay,
      }}
      slotProps={{
        day: {
          dayAnnotations: dayAnnotations,
        } as any,
      }}
    />
  );
}

export default AnnotatedDatePicker;
