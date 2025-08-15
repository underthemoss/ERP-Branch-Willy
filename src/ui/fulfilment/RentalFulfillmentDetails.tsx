import { FragmentType, useFragment } from "@/graphql";
import EditIcon from "@mui/icons-material/Edit";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import React, { useState } from "react";
import {
  FulfilmentBaseFields,
  RentalFulfilmentFields,
  useSetExpectedRentalEndDateMutation,
  useSetRentalEndDateMutation,
  useSetRentalStartDateMutation,
} from "./api";

type RentalFulfillmentDetailsProps = {
  fulfilment: FragmentType<typeof RentalFulfilmentFields>;
  onDateChange?: () => void;
};

export function RentalFulfillmentDetails({
  fulfilment: fulfilmentProp,
  onDateChange,
}: RentalFulfillmentDetailsProps) {
  const [editingDateField, setEditingDateField] = useState<"start" | "expectedEnd" | null>(null);
  const [endRentalDialogOpen, setEndRentalDialogOpen] = useState(false);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);

  // Mutation hooks for rental dates
  const [setRentalStartDate] = useSetRentalStartDateMutation();
  const [setRentalEndDate] = useSetRentalEndDateMutation();
  const [setExpectedRentalEndDate] = useSetExpectedRentalEndDateMutation();

  const fulfilment = useFragment(RentalFulfilmentFields, fulfilmentProp);

  const rentalStartDateValue = fulfilment.rentalStartDate
    ? new Date(fulfilment.rentalStartDate)
    : null;
  const expectedRentalEndDateValue = fulfilment.expectedRentalEndDate
    ? new Date(fulfilment.expectedRentalEndDate)
    : null;
  const rentalEndDateValue = fulfilment.rentalEndDate ? new Date(fulfilment.rentalEndDate) : null;

  const formatDate = (date: Date | null) =>
    date
      ? date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "-";

  return (
    <>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontWeight: 600, marginBottom: 6, color: "#222" }}>Rental Details</div>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <div
            style={{
              color: "#333",
              fontSize: 15,
              display: "flex",
              alignItems: "center",
              gap: 24,
            }}
          >
            {/* Start Date */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 2,
              }}
            >
              <div style={{ fontSize: 13, color: "#888", marginBottom: 2 }}>Start Date</div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {rentalEndDateValue ? (
                  <span>{formatDate(rentalStartDateValue)}</span>
                ) : editingDateField === "start" || !rentalStartDateValue ? (
                  <DatePicker
                    label="Start Date"
                    value={rentalStartDateValue}
                    onChange={async (date) => {
                      if (!date) return;
                      try {
                        await setRentalStartDate({
                          variables: {
                            fulfilmentId: fulfilment.id,
                            rentalStartDate: date.toISOString(),
                          },
                        });
                        setEditingDateField(null);
                        onDateChange?.();
                      } catch (e) {
                        // handle error
                      }
                    }}
                    onClose={() => setEditingDateField(null)}
                    slotProps={{
                      textField: { size: "small", fullWidth: true },
                    }}
                  />
                ) : (
                  <>
                    <span>{formatDate(rentalStartDateValue)}</span>
                    <IconButton
                      size="small"
                      onClick={() => setEditingDateField("start")}
                      aria-label="Edit start date"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </>
                )}
              </div>
            </div>
            {/* End/Expected End Date */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 2,
              }}
            >
              <div style={{ fontSize: 13, color: "#888", marginBottom: 2 }}>
                {rentalEndDateValue ? "End Date" : "Expected End Date"}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {rentalEndDateValue ? (
                  <span>{formatDate(rentalEndDateValue)}</span>
                ) : editingDateField === "expectedEnd" || !expectedRentalEndDateValue ? (
                  <DatePicker
                    label="Expected End Date"
                    value={expectedRentalEndDateValue}
                    onChange={async (date) => {
                      if (!date) return;
                      try {
                        await setExpectedRentalEndDate({
                          variables: {
                            fulfilmentId: fulfilment.id,
                            expectedRentalEndDate: date.toISOString(),
                          },
                        });
                        setEditingDateField(null);
                        onDateChange?.();
                      } catch (e) {
                        // handle error
                      }
                    }}
                    onClose={() => setEditingDateField(null)}
                    slotProps={{
                      textField: { size: "small", fullWidth: true },
                    }}
                  />
                ) : (
                  <>
                    <span>{formatDate(expectedRentalEndDateValue)}</span>
                    <IconButton
                      size="small"
                      onClick={() => setEditingDateField("expectedEnd")}
                      aria-label="Edit expected end date"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </>
                )}
              </div>
            </div>
          </div>
        </LocalizationProvider>
      </div>
      {/* End rental button */}
      {!fulfilment.rentalEndDate && (
        <Box sx={{ marginTop: 4, display: "flex" }}>
          <Button
            variant="contained"
            color="primary"
            disabled={!fulfilment.rentalStartDate}
            style={{ fontWeight: 600, fontSize: 16 }}
            onClick={() => {
              setEndRentalDialogOpen(true);
              setSelectedEndDate(null);
            }}
          >
            End rental
          </Button>
          <Dialog open={endRentalDialogOpen} onClose={() => setEndRentalDialogOpen(false)}>
            <DialogTitle>End Rental</DialogTitle>
            <DialogContent>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Rental End Date"
                  value={selectedEndDate}
                  onChange={(value) => {
                    if (!value) {
                      setSelectedEndDate(null);
                    } else if (value instanceof Date) {
                      setSelectedEndDate(value);
                    } else if (typeof value === "object" && typeof value.toDate === "function") {
                      setSelectedEndDate(value.toDate());
                    } else {
                      setSelectedEndDate(null);
                    }
                  }}
                  slotProps={{
                    textField: { fullWidth: true, size: "small", sx: { mt: 2 } },
                  }}
                />
              </LocalizationProvider>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEndRentalDialogOpen(false)} color="secondary">
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!selectedEndDate) return;
                  try {
                    await setRentalEndDate({
                      variables: {
                        fulfilmentId: fulfilment.id,
                        rentalEndDate: selectedEndDate.toISOString(),
                      },
                    });
                    setEndRentalDialogOpen(false);
                    onDateChange?.();
                  } catch (e) {
                    // handle error
                  }
                }}
                color="primary"
                variant="contained"
                disabled={!selectedEndDate}
              >
                Confirm
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}
    </>
  );
}

export default RentalFulfillmentDetails;
