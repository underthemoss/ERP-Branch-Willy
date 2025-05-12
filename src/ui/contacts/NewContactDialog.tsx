import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  Input,
  InputLabel,
} from "@mui/material";
import { DialogProps } from "@toolpad/core";
import { useState } from "react";
import { BusinessContactForm } from "./BusinessContactForm";
import { EmployeeContactForm } from "./EmployeeContactForm";

export function NewContactDialog({ open, onClose }: DialogProps) {
  const [formType, setFormType] = useState<"business" | "employee">("business");

  const formBody =
    formType === "business" ? (
      <BusinessContactForm onClose={onClose} />
    ) : (
      <EmployeeContactForm onClose={onClose} />
    );

  return (
    <Dialog fullWidth open={open} onClose={() => onClose()}>
      <DialogTitle>New Contact</DialogTitle>
      <DialogContent>
        For a new business or business contact, choose Business. For individuals, choose Employee.
        <Box sx={{ display: "flex", gap: "12px", mt: "22px" }}>
          <Button
            variant={formType === "business" ? "contained" : "text"}
            onClick={() => setFormType("business")}
            color="secondary"
          >
            Business
          </Button>
          <Button
            variant={formType === "employee" ? "contained" : "text"}
            color="secondary"
            onClick={() => setFormType("employee")}
          >
            Employee
          </Button>
        </Box>
        <Box sx={{ mt: 2 }}>{formBody}</Box>
      </DialogContent>
    </Dialog>
  );
}
