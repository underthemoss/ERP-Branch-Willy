"use client";

import { IntakeFormSubmissionLineItemFieldsFragment, RequestType } from "@/graphql/graphql";
import {
  ListIntakeFormSubmissionLineItemsQuery,
  useCreateIntakeFormSubmissionLineItemMutation,
  useDeleteIntakeFormSubmissionLineItemMutation,
  useGetIntakeFormByIdQuery,
  useGetIntakeFormSubmissionByIdQuery,
  useListIntakeFormSubmissionLineItemsQuery,
  useSubmitIntakeFormSubmissionMutation,
  useUpdateIntakeFormSubmissionLineItemMutation,
} from "@/ui/intake-forms/api";
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
import IntakeFormHeader from "../components/IntakeFormHeader";
import RequestConfirmation from "../components/RequestConfirmation";
import RequestFormWithLineItems from "./components/RequestFormWithLineItems";

// Type for a single line item from the GraphQL query
type IntakeFormLineItemFromQuery =
  ListIntakeFormSubmissionLineItemsQuery["listIntakeFormSubmissionLineItems"][number];

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
  id?: string; // Add ID for tracking created items
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
  submissionId?: string;
}

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
          fullName: submission.name || "",
          email: submission.email || "",
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

  // Helper function to derive a display label from line item fields
  // Priority: customPriceName → priceName → categoryName → "Product"
  const deriveLineItemLabel = (lineItem: {
    customProductName?: string;
    priceName?: string;
    pimCategoryName?: string;
  }): string => {
    if (lineItem.customProductName) {
      return lineItem.customProductName;
    }
    if (lineItem.priceName) {
      return lineItem.priceName;
    }
    if (lineItem.pimCategoryName) {
      return lineItem.pimCategoryName;
    }
    return "Product";
  };

  // Helper function to map line items from GraphQL to LineItem
  const mapLineItemToLineItem = (item: IntakeFormSubmissionLineItemFieldsFragment): LineItem => {
    const isRental = item.type === "RENTAL";
    const isCustom = !!item.customPriceName;

    // Derive label from available fields
    // Since we now store the label in description, use it directly as a fallback
    const label = item.customPriceName || item.price?.name || item.pimCategory?.name || "Product";

    const baseItem: LineItem = {
      id: item.id,
      type: item.type as "RENTAL" | "PURCHASE",
      pimCategoryId: item.pimCategoryId,
      pimCategoryName: undefined, // No longer parsed from description
      label: label,
      priceId: item.priceId || undefined,
      priceName: undefined, // No longer parsed from description
      isCustomProduct: isCustom,
      customProductName: item.customPriceName || undefined,
      quantity: item.quantity,
      deliveryLocation: item.deliveryLocation || undefined,
      deliveryMethod: item.deliveryMethod as "DELIVERY" | "PICKUP" | undefined,
      deliveryNotes: item.deliveryNotes || undefined,
    };

    if (isRental) {
      return {
        ...baseItem,
        rentalStartDate: item.rentalStartDate ? new Date(item.rentalStartDate) : undefined,
        rentalEndDate: item.rentalEndDate ? new Date(item.rentalEndDate) : undefined,
        rentalDuration: item.durationInDays || 0,
      };
    } else {
      return {
        ...baseItem,
        deliveryDate: item.startDate ? new Date(item.startDate) : undefined,
      };
    }
  };

  // Map line items directly from query data
  const lineItems = lineItemsData?.listIntakeFormSubmissionLineItems
    ? lineItemsData.listIntakeFormSubmissionLineItems.map(mapLineItemToLineItem)
    : [];

  const handleAddLineItem = async (lineItem: LineItem) => {
    console.log("Adding line item:", lineItem);

    try {
      await createLineItem({
        variables: {
          submissionId,
          input: {
            description: deriveLineItemLabel(lineItem),
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
      console.error("Error creating line item:", error);
    }
  };

  const handleUpdateLineItem = async (lineItemId: string, lineItem: LineItem) => {
    try {
      await updateLineItem({
        variables: {
          id: lineItemId,
          input: {
            description: deriveLineItemLabel(lineItem),
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
            lineItems={lineItems}
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
            lineItems={lineItems}
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

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5" }}>
      {/* Render consistent header at page level */}
      {intakeForm && (
        <IntakeFormHeader
          companyName={intakeForm.workspace?.name || ""}
          workspaceLogo={intakeForm.workspace?.logoUrl}
          workspaceBanner={intakeForm.workspace?.bannerImageUrl}
        />
      )}

      {/* Then render the step content */}
      {renderStepContent()}
    </Box>
  );
}
