"use client";

import { graphql } from "@/graphql";
import { RequestType } from "@/graphql/graphql";
import { useCreateIntakeFormSubmissionMutation, useGetIntakeFormByIdQuery } from "@/graphql/hooks";
import {
  Box,
  CircularProgress,
  Container,
  Paper,
  Step,
  StepLabel,
  Stepper,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import IntakeFormLanding from "./components/IntakeFormLanding";
import RequestConfirmation from "./components/RequestConfirmation";
import RequestForm from "./components/RequestForm";
import ThankYou from "./components/ThankYou";

const steps = ["Portal Landing", "Request Form", "Request Confirmation", "Request Landing"];

export interface ContactInfo {
  fullName: string;
  email: string;
  phoneNumber: string;
  company: string;
  purchaseOrderNumber?: string;
}

export interface LineItem {
  description: string;
  startDate: Date;
  type: "RENTAL" | "PURCHASE";
  durationInDays: number;
  quantity: number;
}

export interface FormData {
  contact: ContactInfo;
  lineItems: LineItem[];
  requestNumber?: string;
  submittedDate?: Date;
}

graphql(`
  query GetIntakeFormById($id: String!) {
    getIntakeFormById(id: $id) {
      id
      workspaceId
      projectId
      project {
        id
        name
        projectCode
      }
      isActive
      createdAt
      updatedAt
      workspace {
        id
        name
        logoUrl
        bannerImageUrl
      }
    }
  }
  mutation CreateIntakeFormSubmission($input: IntakeFormSubmissionInput!) {
    createIntakeFormSubmission(input: $input) {
      id
      formId
      workspaceId
      name
      email
      createdAt
      phone
      companyName
      purchaseOrderNumber
      lineItems {
        description
        startDate
        type
        durationInDays
        quantity
      }
    }
  }
`);

export default function IntakeFormPage() {
  const params = useParams();
  const formId = params.id as string; // This is the intake form ID from the URL
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

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

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleFormSubmit = (contact: ContactInfo, lineItems: LineItem[]) => {
    setFormData({ ...formData, contact, lineItems });
    handleNext();
  };

  const handleConfirm = async () => {
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
            name: formData.contact.fullName,
            email: formData.contact.email,
            phone: formData.contact.phoneNumber || undefined,
            companyName: formData.contact.company || undefined,
            purchaseOrderNumber: formData.contact.purchaseOrderNumber || undefined,
            lineItems: formData.lineItems.map((item) => ({
              description: item.description,
              startDate: item.startDate.toISOString(),
              type: item.type === "RENTAL" ? RequestType.Rental : RequestType.Purchase,
              durationInDays: item.durationInDays,
              quantity: item.quantity,
            })),
          },
        },
      });

      if (result.data?.createIntakeFormSubmission) {
        const submission = result.data.createIntakeFormSubmission;
        setFormData((prev) => ({
          ...prev,
          requestNumber: submission.id,
          submittedDate: new Date(submission.createdAt),
        }));
        handleNext();
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      // In production, you'd want to show an error message to the user
    }
  };

  const handleNewRequest = () => {
    setFormData({
      contact: {
        fullName: "",
        email: "",
        phoneNumber: "",
        company: "",
        purchaseOrderNumber: "",
      },
      lineItems: [],
    });
    setActiveStep(1); // Skip landing page for new request
  };

  const handlePortalHome = () => {
    setActiveStep(0);
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
            companyName={intakeForm?.workspace?.name || ""}
            formData={formData}
            onSubmit={handleFormSubmit}
            onBack={handleBack}
          />
        );
      case 2:
        return (
          <RequestConfirmation
            projectId={projectId || ""}
            projectName={intakeForm?.project?.name || ""}
            projectCode={intakeForm?.project?.projectCode || ""}
            companyName={intakeForm?.workspace?.name || ""}
            formData={formData}
            onConfirm={handleConfirm}
            onNewRequest={handleNewRequest}
            isSubmitting={submitting}
          />
        );
      case 3:
        return (
          <ThankYou
            projectId={projectId || ""}
            projectName={intakeForm?.project?.name || ""}
            projectCode={intakeForm?.project?.projectCode || ""}
            companyName={intakeForm?.workspace?.name || ""}
            logoUrl={intakeForm?.workspace?.logoUrl || ""}
            bannerImageUrl={intakeForm?.workspace?.bannerImageUrl || ""}
            requestNumber={formData.requestNumber}
            onPortalHome={handlePortalHome}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5" }}>
      {!isMobile && activeStep > 0 && activeStep < 3 && (
        <Container maxWidth="lg" sx={{ pt: 4 }}>
          <Stepper activeStep={activeStep - 1} sx={{ mb: 4 }}>
            {steps.slice(1, -1).map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Container>
      )}
      {renderStepContent()}
    </Box>
  );
}
