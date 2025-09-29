"use client";

import { graphql } from "@/graphql";
import { RequestType } from "@/graphql/graphql";
import {
  useCreateIntakeFormSubmissionLineItemMutation,
  useDeleteIntakeFormSubmissionLineItemMutation,
  useGetIntakeFormByIdQuery,
  useGetIntakeFormSubmissionByIdQuery,
  useListIntakeFormSubmissionLineItemsQuery,
  useSubmitIntakeFormSubmissionMutation,
  useUpdateIntakeFormSubmissionLineItemMutation,
} from "@/graphql/hooks";
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
import React, { useEffect, useState } from "react";
import RequestConfirmation from "../components/RequestConfirmation";
import RequestFormWithLineItems from "./components/RequestFormWithLineItems";

const steps = ["Portal Landing", "Request Form", "Request Confirmation", "Request Landing"];

export interface ContactInfo {
  fullName: string;
  email: string;
  phoneNumber: string;
  company: string;
  purchaseOrderNumber?: string;
}

export interface LineItem {
  id?: string;
  description: string;
  startDate: Date;
  type: "RENTAL" | "PURCHASE";
  durationInDays: number;
  quantity: number;
}

// New line item type with pricebook support
export interface NewLineItem {
  id?: string; // Add ID for tracking created items
  // Core fields
  type: "RENTAL" | "PURCHASE";
  pimCategoryId: string;
  pimCategoryName?: string; // Store for display
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
  newLineItems?: NewLineItem[]; // New line items with pricebook support
  requestNumber?: string;
  submittedDate?: Date;
  submissionId?: string;
}

// GraphQL queries and mutations
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
      pricebook {
        id
        name
      }
      pricebookId
      workspace {
        id
        name
        logoUrl
        bannerImageUrl
      }
    }
  }

  query GetIntakeFormSubmissionById($id: String!) {
    getIntakeFormSubmissionById(id: $id) {
      id
      formId
      workspaceId
      name
      email
      createdAt
      phone
      companyName
      purchaseOrderNumber
      status
      submittedAt
      userId
    }
  }

  query ListIntakeFormSubmissionLineItems($submissionId: String!) {
    listIntakeFormSubmissionLineItems(submissionId: $submissionId) {
      id
      description
      startDate
      type
      durationInDays
      quantity
      pimCategoryId
      priceId
      customPriceName
      deliveryLocation
      deliveryMethod
      deliveryNotes
      rentalStartDate
      rentalEndDate
    }
  }

  mutation CreateIntakeFormSubmissionLineItem(
    $submissionId: String!
    $input: IntakeFormLineItemInput!
  ) {
    createIntakeFormSubmissionLineItem(submissionId: $submissionId, input: $input) {
      id
      description
      startDate
      type
      durationInDays
      quantity
      pimCategoryId
      priceId
      customPriceName
      deliveryLocation
      deliveryMethod
      deliveryNotes
      rentalStartDate
      rentalEndDate
    }
  }

  mutation UpdateIntakeFormSubmissionLineItem($id: String!, $input: IntakeFormLineItemInput!) {
    updateIntakeFormSubmissionLineItem(id: $id, input: $input) {
      id
      description
      quantity
    }
  }

  mutation DeleteIntakeFormSubmissionLineItem($id: String!) {
    deleteIntakeFormSubmissionLineItem(id: $id)
  }

  mutation SubmitIntakeFormSubmission($id: String!) {
    submitIntakeFormSubmission(id: $id) {
      id
      formId
      workspaceId
      name
      email
      createdAt
      phone
      companyName
      purchaseOrderNumber
      userId
      status
      submittedAt
    }
  }
`);

export default function IntakeFormSubmissionPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;
  const submissionId = params.submissionId as string;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [activeStep, setActiveStep] = useState(1); // Start at line items step since submission exists
  const [submissionStatus, setSubmissionStatus] = useState<"DRAFT" | "SUBMITTED">("DRAFT");
  const [formData, setFormData] = useState<FormData>({
    contact: {
      fullName: "",
      email: "",
      phoneNumber: "",
      company: "",
      purchaseOrderNumber: "",
    },
    lineItems: [],
    newLineItems: [],
    submissionId: submissionId,
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

  // Query to get the submission details
  const { data: submissionData, loading: loadingSubmission } = useGetIntakeFormSubmissionByIdQuery({
    variables: { id: submissionId },
    fetchPolicy: "cache-and-network",
    skip: !submissionId,
  });

  // Query to get line items for this submission
  const {
    data: lineItemsData,
    loading: loadingLineItems,
    refetch: refetchLineItems,
  } = useListIntakeFormSubmissionLineItemsQuery({
    variables: { submissionId },
    fetchPolicy: "cache-and-network",
    skip: !submissionId,
  });

  // Mutations for line items
  const [createLineItem] = useCreateIntakeFormSubmissionLineItemMutation();
  const [updateLineItem] = useUpdateIntakeFormSubmissionLineItemMutation();
  const [deleteLineItem] = useDeleteIntakeFormSubmissionLineItemMutation();
  const [submitSubmission, { loading: submitting }] = useSubmitIntakeFormSubmissionMutation();

  // Extract form details
  const intakeForm = intakeFormData?.getIntakeFormById;
  const workspaceId = intakeForm?.workspaceId;
  const projectId = intakeForm?.projectId;
  const pricebookId = intakeForm?.pricebookId;
  const pricebookName = intakeForm?.pricebook?.name;

  // Update submission status when submission data is loaded
  useEffect(() => {
    if (submissionData?.getIntakeFormSubmissionById) {
      const submission = submissionData.getIntakeFormSubmissionById;
      setSubmissionStatus(submission.status as "DRAFT" | "SUBMITTED");

      // Update contact info from submission
      setFormData((prev) => ({
        ...prev,
        contact: {
          fullName: submission.name,
          email: submission.email,
          phoneNumber: submission.phone || "",
          company: submission.companyName || "",
          purchaseOrderNumber: submission.purchaseOrderNumber || "",
        },
        requestNumber: submission.id,
        submittedDate: submission.submittedAt ? new Date(submission.submittedAt) : undefined,
      }));

      // If already submitted, go to confirmation page
      if (submission.status === "SUBMITTED") {
        setActiveStep(2);
      }
    }
  }, [submissionData]);

  // Update formData when line items are loaded
  useEffect(() => {
    if (lineItemsData?.listIntakeFormSubmissionLineItems) {
      const lineItems = lineItemsData.listIntakeFormSubmissionLineItems.map((item) => ({
        id: item.id,
        description: item.description,
        type: item.type as "RENTAL" | "PURCHASE",
        pimCategoryId: item.pimCategoryId,
        priceId: item.priceId || undefined,
        customProductName: item.customPriceName || undefined,
        isCustomProduct: !!item.customPriceName,
        quantity: item.quantity,
        deliveryLocation: item.deliveryLocation || undefined,
        deliveryMethod: item.deliveryMethod as "DELIVERY" | "PICKUP" | undefined,
        deliveryNotes: item.deliveryNotes || undefined,
        rentalStartDate: item.rentalStartDate ? new Date(item.rentalStartDate) : undefined,
        rentalEndDate: item.rentalEndDate ? new Date(item.rentalEndDate) : undefined,
        deliveryDate:
          item.type === "PURCHASE" && item.startDate ? new Date(item.startDate) : undefined,
        durationInDays: item.durationInDays,
      }));

      setFormData((prev) => ({
        ...prev,
        newLineItems: lineItems as NewLineItem[],
      }));
    }
  }, [lineItemsData]);

  const handleAddLineItem = async (lineItem: NewLineItem) => {
    try {
      const result = await createLineItem({
        variables: {
          submissionId,
          input: {
            description: lineItem.isCustomProduct
              ? lineItem.customProductName || "Custom Product"
              : lineItem.priceName || lineItem.pimCategoryName || "Product",
            startDate: (
              lineItem.deliveryDate ||
              lineItem.rentalStartDate ||
              new Date()
            ).toISOString(),
            type: lineItem.type === "RENTAL" ? RequestType.Rental : RequestType.Purchase,
            durationInDays: lineItem.rentalDuration || 0,
            quantity: lineItem.quantity,
            pimCategoryId: lineItem.pimCategoryId,
            priceId: lineItem.priceId,
            customPriceName: lineItem.isCustomProduct ? lineItem.customProductName : undefined,
            deliveryLocation: lineItem.deliveryLocation,
            deliveryMethod: (lineItem.deliveryMethod || "DELIVERY") as any,
            deliveryNotes: lineItem.deliveryNotes,
            rentalStartDate: lineItem.rentalStartDate?.toISOString(),
            rentalEndDate: lineItem.rentalEndDate?.toISOString(),
          },
        },
      });

      if (result.data?.createIntakeFormSubmissionLineItem) {
        await refetchLineItems();
      }
    } catch (error) {
      console.error("Error creating line item:", error);
    }
  };

  const handleUpdateLineItem = async (lineItemId: string, lineItem: NewLineItem) => {
    try {
      await updateLineItem({
        variables: {
          id: lineItemId,
          input: {
            description: lineItem.isCustomProduct
              ? lineItem.customProductName || "Custom Product"
              : lineItem.priceName || lineItem.pimCategoryName || "Product",
            startDate: (
              lineItem.deliveryDate ||
              lineItem.rentalStartDate ||
              new Date()
            ).toISOString(),
            type: lineItem.type === "RENTAL" ? RequestType.Rental : RequestType.Purchase,
            durationInDays: lineItem.rentalDuration || 0,
            quantity: lineItem.quantity,
            pimCategoryId: lineItem.pimCategoryId,
            priceId: lineItem.priceId,
            customPriceName: lineItem.isCustomProduct ? lineItem.customProductName : undefined,
            deliveryLocation: lineItem.deliveryLocation,
            deliveryMethod: (lineItem.deliveryMethod || "DELIVERY") as any,
            deliveryNotes: lineItem.deliveryNotes,
            rentalStartDate: lineItem.rentalStartDate?.toISOString(),
            rentalEndDate: lineItem.rentalEndDate?.toISOString(),
          },
        },
      });

      await refetchLineItems();
    } catch (error) {
      console.error("Error updating line item:", error);
    }
  };

  const handleDeleteLineItem = async (lineItemId: string) => {
    try {
      await deleteLineItem({
        variables: { id: lineItemId },
      });
      await refetchLineItems();
    } catch (error) {
      console.error("Error deleting line item:", error);
    }
  };

  const handleConfirm = async () => {
    try {
      const result = await submitSubmission({
        variables: { id: submissionId },
      });

      if (result.data?.submitIntakeFormSubmission) {
        const submission = result.data.submitIntakeFormSubmission;
        setSubmissionStatus(submission.status as "DRAFT" | "SUBMITTED");
        setFormData((prev) => ({
          ...prev,
          requestNumber: submission.id,
          submittedDate: submission.submittedAt
            ? new Date(submission.submittedAt)
            : new Date(submission.createdAt),
        }));
        // Stay on confirmation page to show status change
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const handleNewRequest = () => {
    // Navigate back to the form without submission ID to start fresh
    router.push(`/intake-form/${formId}`);
  };

  const handlePortalHome = () => {
    router.push(`/intake-form/${formId}`);
  };

  const renderStepContent = () => {
    if (loadingForm || loadingLineItems || loadingSubmission) {
      return (
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Paper elevation={1} sx={{ p: 4, textAlign: "center" }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Loading submission...</Typography>
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
      case 1:
        return (
          <RequestFormWithLineItems
            projectId={projectId || ""}
            projectName={intakeForm?.project?.name || ""}
            projectCode={intakeForm?.project?.projectCode || ""}
            companyName={intakeForm?.workspace?.name || ""}
            workspaceId={workspaceId || ""}
            workspaceLogo={intakeForm?.workspace?.logoUrl}
            workspaceBanner={intakeForm?.workspace?.bannerImageUrl}
            pricebookId={pricebookId}
            pricebookName={pricebookName}
            submissionId={submissionId}
            submissionStatus={submissionStatus}
            lineItems={formData.newLineItems || []}
            onAddLineItem={handleAddLineItem}
            onUpdateLineItem={handleUpdateLineItem}
            onDeleteLineItem={handleDeleteLineItem}
            onContinue={() => setActiveStep(2)}
            onBack={() => router.push(`/intake-form/${formId}`)}
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
            submissionStatus={submissionStatus}
            onConfirm={handleConfirm}
            onNewRequest={handleNewRequest}
            onBack={() => setActiveStep(1)}
            isSubmitting={submitting}
          />
        );
      default:
        return null;
    }
  };

  return <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5" }}>{renderStepContent()}</Box>;
}
