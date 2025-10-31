"use client";

import {
  useCreateIntakeFormSubmissionMutation,
  useGetIntakeFormByIdQuery,
} from "@/ui/intake-forms/api";
import { useAuth0 } from "@auth0/auth0-react";
import {
  Box,
  CircularProgress,
  Container,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import React, { useState } from "react";
import IntakeFormLanding from "./components/IntakeFormLanding";
import RequestForm from "./components/RequestForm";

const steps = ["Portal Landing", "Request Form", "Request Confirmation", "Request Landing"];

export interface ContactInfo {
  fullName: string;
  email: string;
  phoneNumber: string;
  company: string;
  purchaseOrderNumber?: string;
}

// Line item type with pricebook support
export interface LineItem {
  id?: string; // Optional ID for tracking created items
  // Core fields
  type: "RENTAL" | "PURCHASE";
  pimCategoryId: string;
  pimCategoryName?: string; // Store for display
  label?: string; // Computed display label derived from available fields
  priceId?: string;
  priceName?: string; // Store for display
  priceBookName?: string; // Store for display
  unitCostInCents?: number; // Store for display (purchase)

  // Rental pricing fields
  pricePerDayInCents?: number;
  pricePerWeekInCents?: number;
  pricePerMonthInCents?: number;

  // Custom product (when no price selected)
  isCustomProduct?: boolean;
  customProductName?: string;
  isNewProduct?: boolean; // Flag for new product creation flow

  // Quantity and delivery
  quantity: number;
  deliveryDate?: Date;
  deliveryLocation?: string;
  deliveryMethod?: "DELIVERY" | "PICKUP";
  deliveryNotes?: string;

  // Rental specific
  rentalDuration?: number; // days
  rentalStartDate?: Date;
  rentalEndDate?: Date;
}

export interface FormData {
  contact: ContactInfo;
  lineItems: LineItem[];
  requestNumber?: string;
  submittedDate?: Date;
}

export default function IntakeFormPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string; // This is the intake form ID from the URL
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { loginWithRedirect, user } = useAuth0();

  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    contact: {
      fullName: "",
      email: "",
      phoneNumber: "",
      company: "",
      purchaseOrderNumber: "",
    },
    lineItems: [],
  });

  // Query to get the intake form by ID
  const {
    data: intakeFormData,
    loading: loadingForm,
    error: formError,
  } = useGetIntakeFormByIdQuery({
    variables: { id: formId },
    fetchPolicy: "cache-and-network",
    skip: !formId,
  });

  // Mutation to create a submission
  const [createIntakeFormSubmission, { loading: submitting }] =
    useCreateIntakeFormSubmissionMutation();

  // Extract form details
  const intakeForm = intakeFormData?.getIntakeFormById;
  const workspaceId = intakeForm?.workspaceId;
  const projectId = intakeForm?.projectId;
  const pricebookId = intakeForm?.pricebookId;
  const pricebookName = intakeForm?.pricebook?.name;

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleFormSubmit = async (contact: ContactInfo) => {
    // Create the submission after contact info is gathered
    if (!intakeForm || !workspaceId) {
      console.error("Missing form or workspace information");
      return;
    }

    try {
      const result = await createIntakeFormSubmission({
        variables: {
          input: {
            formId: formId,
            workspaceId: workspaceId,
            name: contact.fullName,
            email: contact.email,
            phone: contact.phoneNumber || undefined,
            companyName: contact.company || undefined,
            purchaseOrderNumber: contact.purchaseOrderNumber || undefined,
          },
        },
      });

      if (result.data?.createIntakeFormSubmission) {
        const submission = result.data.createIntakeFormSubmission;
        // Navigate to the new URL with submission ID
        router.push(`/intake-form/${formId}/${submission.id}`);
      }
    } catch (error) {
      console.error("Error creating submission:", error);
    }
  };

  const renderStepContent = () => {
    if (loadingForm) {
      return (
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Paper elevation={1} sx={{ p: 4, textAlign: "center" }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Loading form...</Typography>
          </Paper>
        </Container>
      );
    }

    if (formError && formError.message.includes("permission")) {
      if (user) {
        return (
          // User is logged in but doesn't have access
          <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper elevation={1} sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="h6" color="error" gutterBottom>
                Access Denied
              </Typography>
              <Typography>
                You do not have permission to access this intake form. Please contact the form
                administrator for access.
              </Typography>
            </Paper>
          </Container>
        );
      }
      // redirect to login
      loginWithRedirect({
        appState: {
          returnTo: window.location.pathname,
        },
      });
      return null;
    }

    if (formError || (!loadingForm && !intakeForm)) {
      return (
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Paper elevation={1} sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h6" color="error" gutterBottom>
              Form Not Found
            </Typography>
            <Typography>
              The intake form you&apos;re looking for could not be found or is no longer active.
            </Typography>
          </Paper>
        </Container>
      );
    }

    if (!intakeForm?.isActive) {
      return (
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Paper elevation={1} sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h6" color="warning.main" gutterBottom>
              Form Inactive
            </Typography>
            <Typography>This intake form is no longer accepting submissions.</Typography>
          </Paper>
        </Container>
      );
    }

    switch (activeStep) {
      case 0:
        return (
          <IntakeFormLanding
            projectId={projectId || ""}
            projectName={intakeForm?.project?.name || ""}
            projectCode={intakeForm?.project?.projectCode || ""}
            companyName={intakeForm?.workspace?.name || ""}
            logoUrl={intakeForm?.workspace?.logoUrl || ""}
            bannerImageUrl={intakeForm?.workspace?.bannerImageUrl || ""}
            onCreateRequest={handleNext}
          />
        );
      case 1:
        return (
          <RequestForm
            projectId={projectId || ""}
            projectName={intakeForm?.project?.name || ""}
            projectCode={intakeForm?.project?.projectCode || ""}
            companyName={intakeForm?.workspace?.name || ""}
            workspaceLogo={intakeForm?.workspace?.logoUrl}
            workspaceBanner={intakeForm?.workspace?.bannerImageUrl}
            formData={formData}
            onSubmit={handleFormSubmit}
            onBack={handleBack}
            workspaceId={workspaceId || ""}
            pricebookId={pricebookId}
            pricebookName={pricebookName}
            isSubmitting={submitting}
          />
        );
      default:
        return null;
    }
  };

  return <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5" }}>{renderStepContent()}</Box>;
}
