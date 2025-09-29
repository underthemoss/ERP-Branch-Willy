"use client";

import { graphql } from "@/graphql";
import { ContactType, DeliveryMethod, LineItemStatus, PoLineItemStatus } from "@/graphql/graphql";
import {
  useAssignInventoryToRentalFulfilmentForConversionMutation,
  useContactSelectorListQuery,
  useCreatePurchaseOrderMutation,
  useCreateRentalPriceMutation,
  useCreateRentalPurchaseOrderLineItemMutation,
  useCreateRentalSalesOrderLineItemMutation,
  useCreateSalePriceMutation,
  useCreateSalePurchaseOrderLineItemMutation,
  useCreateSaleSalesOrderLineItemMutation,
  useCreateSalesOrderMutation,
  useGetIntakeFormSubmissionByIdForConversionQuery,
  useListInventoryForConversionLazyQuery,
  useListPricesQuery,
  useListRentalFulfilmentsForConversionLazyQuery,
  useSubmitPurchaseOrderForConversionMutation,
  useSubmitSalesOrderForConversionMutation,
  useUpdateIntakeFormSubmissionForConversionMutation,
} from "@/graphql/hooks";
import { useNotification } from "@/providers/NotificationProvider";
import ContactSelector from "@/ui/ContactSelector";
import ProjectSelector from "@/ui/ProjectSelector";
import { gql, useQuery } from "@apollo/client";
import {
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Radio,
  RadioGroup,
  Step,
  StepLabel,
  Stepper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from "@mui/material";
import Checkbox from "@mui/material/Checkbox";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { PriceSelectionDialog } from "../prices/PriceSelectionDialog";

// GraphQL Queries and Mutations
graphql(`
  query GetIntakeFormSubmissionByIdForConversion($id: String!) {
    getIntakeFormSubmissionById(id: $id) {
      id
      formId
      workspaceId
      name
      email
      phone
      companyName
      purchaseOrderNumber
      status
    }
  }
`);

graphql(`
  mutation UpdateIntakeFormSubmissionForConversion(
    $id: String!
    $input: UpdateIntakeFormSubmissionInput!
  ) {
    updateIntakeFormSubmission(id: $id, input: $input) {
      id
      salesOrderId
      purchaseOrderId
    }
  }
`);

graphql(`
  mutation SubmitSalesOrderForConversion($id: ID!) {
    submitSalesOrder(id: $id) {
      id
      status
    }
  }
`);

graphql(`
  mutation SubmitPurchaseOrderForConversion($id: ID!) {
    submitPurchaseOrder(id: $id) {
      id
      status
    }
  }
`);

graphql(`
  query ListRentalFulfilmentsForConversion(
    $filter: ListRentalFulfilmentsFilter!
    $page: ListFulfilmentsPage
  ) {
    listRentalFulfilments(filter: $filter, page: $page) {
      items {
        id
        salesOrderLineItemId
        salesOrderId
      }
    }
  }
`);

graphql(`
  query ListInventoryForConversion($query: ListInventoryQuery) {
    listInventory(query: $query) {
      items {
        id
        purchaseOrderLineItemId
        purchaseOrderId
      }
    }
  }
`);

graphql(`
  mutation AssignInventoryToRentalFulfilmentForConversion(
    $fulfilmentId: ID!
    $inventoryId: ID!
    $allowOverlappingReservations: Boolean
  ) {
    assignInventoryToRentalFulfilment(
      fulfilmentId: $fulfilmentId
      inventoryId: $inventoryId
      allowOverlappingReservations: $allowOverlappingReservations
    ) {
      id
    }
  }
`);

const GET_INTAKE_FORM_FOR_SUBMISSION = gql`
  query GetIntakeFormForSubmission($formId: String!) {
    getIntakeFormById(id: $formId) {
      projectId
      project {
        id
        name
        projectCode
      }
      pricebookId
      pricebook {
        id
        name
        parentPriceBook {
          id
          name
          businessContact {
            id
            name
            contactType
          }
        }
      }
    }
  }
`;

const GET_SUBMISSION_LINE_ITEMS = gql`
  query GetSubmissionLineItems($submissionId: String!) {
    listIntakeFormSubmissionLineItems(submissionId: $submissionId) {
      id
      description
      type
      quantity
      startDate
      durationInDays
      priceId
      pimCategoryId
      customPriceName
      deliveryLocation
      deliveryMethod
      deliveryNotes
      rentalStartDate
      rentalEndDate
    }
  }
`;

interface ConvertSubmissionDialogProps {
  open: boolean;
  onClose: () => void;
  submissionId: string;
  workspaceId: string;
}

type ConversionType = "SO_ONLY" | "SO_AND_PO";

interface LineItemMapping {
  submissionLineItem: any;
  priceId?: string;
  vendorPriceId?: string;
  needsPriceCreation: boolean;
  needsVendorPriceCreation: boolean;
  customPriceName?: string;
  includeInPO?: boolean;
  salesOrderLineItemId?: string;
  purchaseOrderLineItemId?: string;
}

export default function ConvertSubmissionDialog({
  open,
  onClose,
  submissionId,
  workspaceId,
}: ConvertSubmissionDialogProps) {
  const router = useRouter();
  const { notifySuccess, notifyError, notifyWarning, notifyInfo } = useNotification();

  // State
  const [activeStep, setActiveStep] = useState(0);
  const [conversionType, setConversionType] = useState<ConversionType>("SO_ONLY");
  const [buyerContactId, setBuyerContactId] = useState<string>("");
  const [vendorContactId, setVendorContactId] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [lineItemMappings, setLineItemMappings] = useState<LineItemMapping[]>([]);
  const [isCreatingOrders, setIsCreatingOrders] = useState(false);
  const [currentPriceBookId, setCurrentPriceBookId] = useState<string>("");
  const [priceSelectionOpen, setPriceSelectionOpen] = useState(false);
  const [priceSelectionIndex, setPriceSelectionIndex] = useState<number | null>(null);
  const [priceSelectionType, setPriceSelectionType] = useState<"SO" | "PO">("SO");

  // Track manually selected prices to preserve them during re-renders
  const [manuallySelectedPrices, setManuallySelectedPrices] = useState<{
    [lineItemId: string]: { priceId?: string; vendorPriceId?: string };
  }>({});

  // Track vendor contact source for helper text
  const [vendorContactSource, setVendorContactSource] = useState<string>("");

  // Fetch submission data
  const { data: submissionData, loading: loadingSubmission } =
    useGetIntakeFormSubmissionByIdForConversionQuery({
      variables: { id: submissionId },
      skip: !open,
      fetchPolicy: "cache-and-network",
    });

  // Fetch intake form data
  const { data: intakeFormData } = useQuery(GET_INTAKE_FORM_FOR_SUBMISSION, {
    variables: { formId: submissionData?.getIntakeFormSubmissionById?.formId || "" },
    skip: !submissionData?.getIntakeFormSubmissionById?.formId,
    fetchPolicy: "cache-and-network",
  });

  // Fetch line items
  const { data: lineItemsData } = useQuery(GET_SUBMISSION_LINE_ITEMS, {
    variables: { submissionId },
    skip: !open,
    fetchPolicy: "cache-and-network",
  });

  // Fetch contacts for matching
  const { data: contactsData } = useContactSelectorListQuery({
    variables: {
      workspaceId,
      page: { number: 1, size: 1000 },
      contactType: ContactType.Person,
    },
    fetchPolicy: "cache-and-network",
  });

  // Fetch prices for validation
  const { data: pricesData } = useListPricesQuery({
    variables: {
      workspaceId,
      page: { number: 1, size: 1000 },
      priceBookId: intakeFormData?.getIntakeFormById?.pricebookId || undefined,
      shouldListPriceBooks: false,
    },
    skip: !intakeFormData?.getIntakeFormById?.pricebookId,
    fetchPolicy: "cache-and-network",
  });

  // Fetch all prices for price comparison and display
  const { data: allPricesData } = useListPricesQuery({
    variables: {
      workspaceId,
      page: { number: 1, size: 1000 },
      shouldListPriceBooks: false,
    },
    fetchPolicy: "cache-and-network",
  });

  // Mutations
  const [createSalesOrder] = useCreateSalesOrderMutation();
  const [createPurchaseOrder] = useCreatePurchaseOrderMutation();
  const [createRentalSalesOrderLineItem] = useCreateRentalSalesOrderLineItemMutation();
  const [createSaleSalesOrderLineItem] = useCreateSaleSalesOrderLineItemMutation();
  const [createRentalPurchaseOrderLineItem] = useCreateRentalPurchaseOrderLineItemMutation();
  const [createSalePurchaseOrderLineItem] = useCreateSalePurchaseOrderLineItemMutation();
  const [createRentalPrice] = useCreateRentalPriceMutation();
  const [createSalePrice] = useCreateSalePriceMutation();
  const [assignInventoryToFulfilment] = useAssignInventoryToRentalFulfilmentForConversionMutation();
  const [submitSalesOrder] = useSubmitSalesOrderForConversionMutation();
  const [submitPurchaseOrder] = useSubmitPurchaseOrderForConversionMutation();
  const [getListRentalFulfilments] = useListRentalFulfilmentsForConversionLazyQuery();
  const [getListInventory] = useListInventoryForConversionLazyQuery();
  const [updateIntakeFormSubmission] = useUpdateIntakeFormSubmissionForConversionMutation();

  // Auto-set vendor contact when conversion type changes to SO_AND_PO
  useEffect(() => {
    if (conversionType === "SO_AND_PO" && intakeFormData) {
      const intakeForm = intakeFormData.getIntakeFormById;

      // Check if the pricebook has a parent pricebook with a business contact
      if (intakeForm?.pricebook?.parentPriceBook?.businessContact) {
        const parentBusinessContact = intakeForm.pricebook.parentPriceBook.businessContact;
        setVendorContactId(parentBusinessContact.id);
        setVendorContactSource(
          `Auto-selected from parent pricebook: ${intakeForm.pricebook.parentPriceBook.name}`,
        );
      } else {
        // Clear the vendor contact source if no parent pricebook contact
        setVendorContactSource("");
      }
    } else {
      // Clear vendor contact when switching back to SO_ONLY
      if (conversionType === "SO_ONLY") {
        setVendorContactId("");
        setVendorContactSource("");
      }
    }
  }, [conversionType, intakeFormData]);

  // Initialize data when submission loads
  useEffect(() => {
    if (submissionData && intakeFormData && lineItemsData) {
      const submission = submissionData.getIntakeFormSubmissionById;
      const intakeForm = intakeFormData.getIntakeFormById;
      const lineItems = lineItemsData.listIntakeFormSubmissionLineItems;

      // Set project from intake form
      if (intakeForm?.projectId) {
        setProjectId(intakeForm.projectId);
      }

      // Set pricebook for price creation
      if (intakeForm?.pricebookId) {
        setCurrentPriceBookId(intakeForm.pricebookId);
      }

      // Try to match buyer contact
      if (submission?.email && contactsData) {
        const matchedContact = contactsData.listContacts?.items?.find(
          (contact: any) =>
            contact.__typename === "PersonContact" && contact.email === submission.email,
        );
        if (matchedContact) {
          setBuyerContactId(matchedContact.id);
        }
      }

      // Initialize line item mappings
      if (lineItems) {
        const mappings: LineItemMapping[] = lineItems.map((item: any) => {
          // Check if we have manually selected prices for this line item
          const manualPrices = manuallySelectedPrices[item.id];

          // Use manually selected price if available, otherwise use the original price
          const finalPriceId = manualPrices?.priceId || item.priceId;

          // Try to find vendor price if we have a priceId
          let vendorPriceId = manualPrices?.vendorPriceId || undefined;

          // Only look up vendor price from parentPriceId if we don't have a manual selection
          if (!vendorPriceId && finalPriceId && pricesData) {
            const customerPrice = pricesData.listPrices?.items?.find(
              (p: any) => p.id === finalPriceId,
            );
            // Check if the price has a parentPriceId field (vendor price reference)
            // The parentPriceId points to the vendor price that this customer price was derived from
            if (customerPrice) {
              // For RentalPrice or SalePrice, check for parentPriceId
              if (customerPrice.__typename === "RentalPrice" && customerPrice.parentPriceId) {
                vendorPriceId = customerPrice.parentPriceId;
              } else if (customerPrice.__typename === "SalePrice" && customerPrice.parentPriceId) {
                vendorPriceId = customerPrice.parentPriceId;
              }
            }
          }

          return {
            submissionLineItem: item,
            priceId: finalPriceId,
            vendorPriceId,
            needsPriceCreation: !finalPriceId,
            needsVendorPriceCreation: conversionType === "SO_AND_PO" && !vendorPriceId,
            customPriceName: item.customPriceName,
            includeInPO: true, // Default to including in PO
          };
        });
        setLineItemMappings(mappings);
      }
    }
  }, [
    submissionData,
    intakeFormData,
    lineItemsData,
    contactsData,
    pricesData,
    conversionType,
    manuallySelectedPrices,
  ]);

  // Check if we can proceed to next step
  const canProceedToNextStep = useMemo(() => {
    switch (activeStep) {
      case 0: // Configuration step
        return true;
      case 1: // Validation step
        const hasRequiredFields = buyerContactId && projectId;

        // All line items must have SO prices
        const allSOPricesSet = lineItemMappings.every((mapping) => !!mapping.priceId);

        // If SO+PO mode, check vendor requirements
        const vendorRequirementsMet =
          conversionType === "SO_ONLY" ||
          (vendorContactId &&
            lineItemMappings.every(
              (mapping) =>
                // If includeInPO is true, must have vendor price
                !mapping.includeInPO || !!mapping.vendorPriceId,
            ));

        return hasRequiredFields && allSOPricesSet && vendorRequirementsMet;
      case 2: // Preview step
        return true;
      default:
        return false;
    }
  }, [activeStep, buyerContactId, projectId, lineItemMappings, conversionType, vendorContactId]);

  const steps = ["Configure", "Validate & Resolve", "Preview", "Create Orders"];

  const handleNext = () => {
    if (activeStep === 2) {
      // Create orders
      handleCreateOrders();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handlePriceSelect = (priceId: string) => {
    if (priceSelectionIndex === null) return;

    const lineItem = lineItemMappings[priceSelectionIndex]?.submissionLineItem;
    if (!lineItem) return;

    // Track the manually selected price
    const lineItemId = lineItem.id;
    setManuallySelectedPrices((prev) => ({
      ...prev,
      [lineItemId]: {
        ...prev[lineItemId],
        ...(priceSelectionType === "SO" ? { priceId } : { vendorPriceId: priceId }),
      },
    }));

    const newMappings = [...lineItemMappings];
    if (priceSelectionType === "SO") {
      newMappings[priceSelectionIndex] = {
        ...newMappings[priceSelectionIndex],
        priceId: priceId,
        needsPriceCreation: false,
      };
    } else {
      newMappings[priceSelectionIndex] = {
        ...newMappings[priceSelectionIndex],
        vendorPriceId: priceId,
        needsVendorPriceCreation: false,
      };
    }
    setLineItemMappings(newMappings);
    setPriceSelectionOpen(false);
    setPriceSelectionIndex(null);
  };

  const openPriceSelection = (index: number, type: "SO" | "PO") => {
    setPriceSelectionIndex(index);
    setPriceSelectionType(type);
    setPriceSelectionOpen(true);
  };

  // Helper function to get price details
  const getPriceDetails = (priceId: string | undefined) => {
    if (!priceId || !allPricesData) return null;
    const price = allPricesData.listPrices?.items?.find((p: any) => p.id === priceId);
    if (!price) return null;

    if (price.__typename === "RentalPrice") {
      return {
        type: "RENTAL",
        dayPrice: price.pricePerDayInCents,
        weekPrice: price.pricePerWeekInCents,
        monthPrice: price.pricePerMonthInCents,
      };
    } else if (price.__typename === "SalePrice") {
      return {
        type: "SALE",
        unitCost: price.unitCostInCents,
      };
    }
    return null;
  };

  // Calculate margin percentage
  const calculateMargin = (soPrice: number, poPrice: number) => {
    if (poPrice === 0) return 0;
    return ((soPrice - poPrice) / poPrice) * 100;
  };

  // Format price for display
  const formatPrice = (cents: number | undefined) => {
    if (cents === undefined || cents === null) return "-";
    return `$${(cents / 100).toFixed(2)}`;
  };

  const handleCreateOrders = async () => {
    setIsCreatingOrders(true);
    const submission = submissionData?.getIntakeFormSubmissionById;

    if (!submission) {
      notifyError("Submission data not found");
      return;
    }

    try {
      // Step 1: Create Sales Order
      const salesOrderResult = await createSalesOrder({
        variables: {
          input: {
            workspace_id: workspaceId,
            buyer_id: buyerContactId,
            project_id: projectId || undefined,
            purchase_order_number: submission.purchaseOrderNumber || "",
          },
        },
      });

      const salesOrderId = salesOrderResult.data?.createSalesOrder?.id;
      if (!salesOrderId) {
        throw new Error("Failed to create sales order");
      }

      // Step 2: Create Sales Order Line Items
      const updatedMappings = [...lineItemMappings];
      for (let i = 0; i < updatedMappings.length; i++) {
        const mapping = updatedMappings[i];
        const item = mapping.submissionLineItem;

        // Create price if needed
        const finalPriceId = mapping.priceId;
        if (mapping.needsPriceCreation && currentPriceBookId) {
          // This would need to be handled through the AddNewPriceDialog
          // For now, we'll skip custom price creation in the automated flow
          notifyWarning(`Custom price needed for ${item.description} - skipping line item`);
          continue;
        }

        let lineItemResult;
        if (item.type === "RENTAL") {
          lineItemResult = await createRentalSalesOrderLineItem({
            variables: {
              input: {
                sales_order_id: salesOrderId,
                price_id: finalPriceId,
                so_quantity: item.quantity,
                delivery_date: item.rentalStartDate || item.startDate,
                off_rent_date: item.rentalEndDate,
                delivery_method: item.deliveryMethod || DeliveryMethod.Delivery,
                delivery_location: item.deliveryLocation,
                deliveryNotes: item.deliveryNotes,
                lineitem_status: LineItemStatus.Confirmed,
                so_pim_id: item.pimCategoryId,
              },
            },
          });
          updatedMappings[i].salesOrderLineItemId =
            lineItemResult.data?.createRentalSalesOrderLineItem?.id;
        } else {
          lineItemResult = await createSaleSalesOrderLineItem({
            variables: {
              input: {
                sales_order_id: salesOrderId,
                price_id: finalPriceId,
                so_quantity: item.quantity,
                delivery_date: item.startDate,
                delivery_method: item.deliveryMethod || DeliveryMethod.Delivery,
                delivery_location: item.deliveryLocation,
                deliveryNotes: item.deliveryNotes,
                lineitem_status: LineItemStatus.Confirmed,
                so_pim_id: item.pimCategoryId,
              },
            },
          });
          updatedMappings[i].salesOrderLineItemId =
            lineItemResult.data?.createSaleSalesOrderLineItem?.id;
        }
      }

      // Step 3: Submit Sales Order if SO_ONLY mode
      if (conversionType === "SO_ONLY") {
        notifyInfo("Submitting sales order...");

        await submitSalesOrder({
          variables: { id: salesOrderId },
        });
      }

      // Step 4: Create Purchase Order if needed
      let purchaseOrderId: string | undefined;
      if (conversionType === "SO_AND_PO") {
        const purchaseOrderResult = await createPurchaseOrder({
          variables: {
            input: {
              workspace_id: workspaceId,
              seller_id: vendorContactId,
              project_id: projectId || undefined,
              // PO number will be auto-generated
            },
          },
        });

        purchaseOrderId = purchaseOrderResult.data?.createPurchaseOrder?.id;
        if (!purchaseOrderId) {
          throw new Error("Failed to create purchase order");
        }

        // Step 4: Create Purchase Order Line Items (only for items marked for inclusion)
        for (let i = 0; i < updatedMappings.length; i++) {
          const mapping = updatedMappings[i];
          const item = mapping.submissionLineItem;

          // Skip if not included in PO
          if (!mapping.includeInPO) {
            continue;
          }

          const vendorPriceId = mapping.vendorPriceId;

          if (!vendorPriceId) {
            notifyWarning(`Vendor price not set for ${item.description} - skipping PO line item`);
            continue;
          }

          let poLineItemResult;
          if (item.type === "RENTAL") {
            poLineItemResult = await createRentalPurchaseOrderLineItem({
              variables: {
                input: {
                  purchase_order_id: purchaseOrderId,
                  price_id: vendorPriceId,
                  po_quantity: item.quantity,
                  delivery_date: item.rentalStartDate || item.startDate,
                  off_rent_date: item.rentalEndDate,
                  delivery_method: item.deliveryMethod || DeliveryMethod.Delivery,
                  delivery_location: item.deliveryLocation,
                  deliveryNotes: item.deliveryNotes,
                  lineitem_status: PoLineItemStatus.Confirmed,
                  po_pim_id: item.pimCategoryId,
                },
              },
            });
            updatedMappings[i].purchaseOrderLineItemId =
              poLineItemResult.data?.createRentalPurchaseOrderLineItem?.id;
          } else {
            poLineItemResult = await createSalePurchaseOrderLineItem({
              variables: {
                input: {
                  purchase_order_id: purchaseOrderId,
                  price_id: vendorPriceId,
                  po_quantity: item.quantity,
                  delivery_date: item.startDate,
                  delivery_method: item.deliveryMethod || DeliveryMethod.Delivery,
                  delivery_location: item.deliveryLocation,
                  deliveryNotes: item.deliveryNotes,
                  lineitem_status: PoLineItemStatus.Confirmed,
                  po_pim_id: item.pimCategoryId,
                },
              },
            });
            updatedMappings[i].purchaseOrderLineItemId =
              poLineItemResult.data?.createSalePurchaseOrderLineItem?.id;
          }
        }

        // Step 5: Submit both orders to generate fulfilments and inventory
        notifyInfo("Submitting orders...");

        await submitSalesOrder({
          variables: { id: salesOrderId },
        });

        await submitPurchaseOrder({
          variables: { id: purchaseOrderId },
        });

        // Step 6: Query for fulfilments and inventory
        notifyInfo("Retrieving fulfilments and inventory...");

        const { data: fulfilmentsData } = await getListRentalFulfilments({
          variables: {
            filter: {
              salesOrderId: salesOrderId,
              workspaceId: workspaceId,
            },
            page: {
              size: 100,
            },
          },
          fetchPolicy: "network-only",
        });

        const { data: inventoryData } = await getListInventory({
          variables: {
            query: {
              filter: {
                purchaseOrderId: purchaseOrderId,
              },
              page: {
                size: 100,
              },
            },
          },
          fetchPolicy: "network-only",
        });

        // Step 7: Assign inventory to rental fulfilments
        const fulfilments = fulfilmentsData?.listRentalFulfilments?.items || [];
        const inventory = inventoryData?.listInventory?.items || [];

        notifyInfo("Assigning inventory to fulfilments...");

        for (const mapping of updatedMappings) {
          if (
            mapping.submissionLineItem.type === "RENTAL" &&
            mapping.includeInPO &&
            mapping.salesOrderLineItemId &&
            mapping.purchaseOrderLineItemId
          ) {
            // Find the fulfilment for this SO line item
            const fulfilment = fulfilments.find(
              (f: any) => f.salesOrderLineItemId === mapping.salesOrderLineItemId,
            );

            // Find the inventory for this PO line item
            const inv = inventory.find(
              (i: any) => i.purchaseOrderLineItemId === mapping.purchaseOrderLineItemId,
            );

            if (fulfilment && inv) {
              try {
                await assignInventoryToFulfilment({
                  variables: {
                    fulfilmentId: fulfilment.id,
                    inventoryId: inv.id,
                    allowOverlappingReservations: false,
                  },
                });
                notifySuccess(`Assigned inventory for ${mapping.submissionLineItem.description}`);
              } catch (error) {
                console.error(
                  `Failed to assign inventory for ${mapping.submissionLineItem.description}:`,
                  error,
                );
                notifyWarning(
                  `Could not assign inventory for ${mapping.submissionLineItem.description}`,
                );
                // Continue with other assignments even if one fails
              }
            } else {
              if (!fulfilment) {
                notifyWarning(`No fulfilment found for ${mapping.submissionLineItem.description}`);
              }
              if (!inv) {
                notifyWarning(`No inventory found for ${mapping.submissionLineItem.description}`);
              }
            }
          }
        }
      }

      // Step 8: Update the intake form submission with the order IDs
      notifyInfo("Updating submission with order references...");

      try {
        await updateIntakeFormSubmission({
          variables: {
            id: submissionId,
            input: {
              salesOrderId: salesOrderId,
              purchaseOrderId: purchaseOrderId || undefined,
            },
          },
        });
      } catch (error) {
        console.error("Failed to update submission with order IDs:", error);
        // Don't fail the whole process if this update fails
        notifyWarning(
          "Could not update submission with order references, but orders were created successfully",
        );
      }

      // Success!
      notifySuccess(
        conversionType === "SO_AND_PO"
          ? "Sales Order and Purchase Order created successfully!"
          : "Sales Order created successfully!",
      );

      // Redirect to the sales order
      router.push(`/app/${workspaceId}/sales-orders/${salesOrderId}`);
      onClose();
    } catch (error: any) {
      notifyError(`Failed to create orders: ${error.message}`);
      setIsCreatingOrders(false);
    }
  };

  const renderConfigurationStep = () => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Select Conversion Type
      </Typography>
      <RadioGroup
        value={conversionType}
        onChange={(e) => setConversionType(e.target.value as ConversionType)}
      >
        <Paper sx={{ p: 2, mb: 2 }}>
          <FormControlLabel
            value="SO_ONLY"
            control={<Radio />}
            label={
              <Box>
                <Typography variant="subtitle1">Sales Order Only</Typography>
                <Typography variant="body2" color="text.secondary">
                  Create a sales order from the intake form submission
                </Typography>
              </Box>
            }
          />
        </Paper>
        <Paper sx={{ p: 2 }}>
          <FormControlLabel
            value="SO_AND_PO"
            control={<Radio />}
            label={
              <Box>
                <Typography variant="subtitle1">Sales Order + Purchase Order</Typography>
                <Typography variant="body2" color="text.secondary">
                  Create both a sales order and a corresponding purchase order
                </Typography>
              </Box>
            }
          />
        </Paper>
      </RadioGroup>
    </Box>
  );

  const renderValidationStep = () => {
    const submission = submissionData?.getIntakeFormSubmissionById;
    const intakeForm = intakeFormData?.getIntakeFormById;

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Validate and Resolve Requirements
        </Typography>

        {/* All contacts and project in one row */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2}>
            {/* Buyer Contact */}
            <Grid size={{ xs: 12, md: conversionType === "SO_AND_PO" ? 4 : 6 }}>
              <Typography variant="subtitle1" gutterBottom>
                Buyer Contact
              </Typography>
              <ContactSelector
                workspaceId={workspaceId}
                contactId={buyerContactId}
                onChange={setBuyerContactId}
                type="any"
              />
              {submission?.email && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: "block" }}
                >
                  Submission email: {submission.email}
                </Typography>
              )}
            </Grid>

            {/* Project */}
            <Grid size={{ xs: 12, md: conversionType === "SO_AND_PO" ? 4 : 6 }}>
              <Typography variant="subtitle1" gutterBottom>
                Project
              </Typography>
              <ProjectSelector projectId={projectId} onChange={setProjectId} />
              {intakeForm?.project && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: "block" }}
                >
                  Intake form project: {intakeForm.project.name || intakeForm.project.projectCode}
                </Typography>
              )}
            </Grid>

            {/* Vendor Contact (if PO needed) */}
            {conversionType === "SO_AND_PO" && (
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Vendor/Supplier Contact
                </Typography>
                <ContactSelector
                  workspaceId={workspaceId}
                  contactId={vendorContactId}
                  onChange={(newContactId) => {
                    setVendorContactId(newContactId);
                    // Clear the auto-selection source when user manually selects
                    if (newContactId !== vendorContactId) {
                      setVendorContactSource("");
                    }
                  }}
                  type="any"
                />
                {vendorContactSource && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: "block" }}
                  >
                    {vendorContactSource}
                  </Typography>
                )}
              </Grid>
            )}
          </Grid>
        </Paper>

        {/* Line Items Price Validation */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Line Items
          </Typography>
          <List>
            {lineItemMappings.map((mapping, index) => {
              const item = mapping.submissionLineItem;
              const hasPrice = !!mapping.priceId;
              const hasVendorPrice = conversionType === "SO_ONLY" || !!mapping.vendorPriceId;

              return (
                <ListItem key={index} divider sx={{ display: "block", py: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                    {/* Type and Quantity Info - Fixed width */}
                    <Box sx={{ width: 250, flexShrink: 0, pt: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        {item.customPriceName || item.description}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Type: <strong>{item.type}</strong>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Qty: <strong>{item.quantity}</strong>
                      </Typography>
                    </Box>

                    {/* Price Table */}
                    <Box sx={{ flex: 1 }}>
                      {(() => {
                        const soPrice = getPriceDetails(mapping.priceId);
                        const poPrice =
                          conversionType === "SO_AND_PO"
                            ? getPriceDetails(mapping.vendorPriceId)
                            : null;

                        // For rental items
                        if (item.type === "RENTAL") {
                          const dayMargin =
                            soPrice &&
                            poPrice &&
                            soPrice.type === "RENTAL" &&
                            poPrice.type === "RENTAL"
                              ? calculateMargin(soPrice.dayPrice || 0, poPrice.dayPrice || 0)
                              : null;
                          const weekMargin =
                            soPrice &&
                            poPrice &&
                            soPrice.type === "RENTAL" &&
                            poPrice.type === "RENTAL"
                              ? calculateMargin(soPrice.weekPrice || 0, poPrice.weekPrice || 0)
                              : null;
                          const monthMargin =
                            soPrice &&
                            poPrice &&
                            soPrice.type === "RENTAL" &&
                            poPrice.type === "RENTAL"
                              ? calculateMargin(soPrice.monthPrice || 0, poPrice.monthPrice || 0)
                              : null;

                          return (
                            <TableContainer>
                              <Table size="small" sx={{ minWidth: 400 }}>
                                <TableHead>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: "bold", width: 150 }}>
                                      Price
                                    </TableCell>
                                    <TableCell align="right">
                                      Day
                                      {dayMargin !== null && (
                                        <Typography
                                          component="span"
                                          variant="caption"
                                          sx={{
                                            ml: 1,
                                            color: dayMargin >= 0 ? "success.main" : "error.main",
                                            fontWeight: "bold",
                                          }}
                                        >
                                          ({dayMargin >= 0 ? "+" : ""}
                                          {dayMargin.toFixed(1)}%)
                                        </Typography>
                                      )}
                                    </TableCell>
                                    <TableCell align="right">
                                      Week
                                      {weekMargin !== null && (
                                        <Typography
                                          component="span"
                                          variant="caption"
                                          sx={{
                                            ml: 1,
                                            color: weekMargin >= 0 ? "success.main" : "error.main",
                                            fontWeight: "bold",
                                          }}
                                        >
                                          ({weekMargin >= 0 ? "+" : ""}
                                          {weekMargin.toFixed(1)}%)
                                        </Typography>
                                      )}
                                    </TableCell>
                                    <TableCell align="right">
                                      4 Weeks
                                      {monthMargin !== null && (
                                        <Typography
                                          component="span"
                                          variant="caption"
                                          sx={{
                                            ml: 1,
                                            color: monthMargin >= 0 ? "success.main" : "error.main",
                                            fontWeight: "bold",
                                          }}
                                        >
                                          ({monthMargin >= 0 ? "+" : ""}
                                          {monthMargin.toFixed(1)}%)
                                        </Typography>
                                      )}
                                    </TableCell>
                                    <TableCell align="center" sx={{ width: 120 }}>
                                      Actions
                                    </TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  <TableRow>
                                    <TableCell component="th" scope="row">
                                      Sales Order
                                      {hasPrice ? (
                                        <CheckIcon
                                          sx={{ fontSize: 14, color: "success.main", ml: 0.5 }}
                                        />
                                      ) : (
                                        <WarningIcon
                                          sx={{ fontSize: 14, color: "warning.main", ml: 0.5 }}
                                        />
                                      )}
                                    </TableCell>
                                    <TableCell align="right">
                                      {soPrice && soPrice.type === "RENTAL"
                                        ? formatPrice(soPrice.dayPrice)
                                        : "-"}
                                    </TableCell>
                                    <TableCell align="right">
                                      {soPrice && soPrice.type === "RENTAL"
                                        ? formatPrice(soPrice.weekPrice)
                                        : "-"}
                                    </TableCell>
                                    <TableCell align="right">
                                      {soPrice && soPrice.type === "RENTAL"
                                        ? formatPrice(soPrice.monthPrice)
                                        : "-"}
                                    </TableCell>
                                    <TableCell align="center">
                                      <Button
                                        size="small"
                                        variant={hasPrice ? "text" : "contained"}
                                        onClick={() => openPriceSelection(index, "SO")}
                                      >
                                        {hasPrice ? "Change" : "Set price"}
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                  {conversionType === "SO_AND_PO" && (
                                    <TableRow>
                                      <TableCell component="th" scope="row">
                                        <Box sx={{ display: "flex", alignItems: "center" }}>
                                          <Checkbox
                                            size="small"
                                            checked={mapping.includeInPO !== false}
                                            onChange={(e) => {
                                              const newMappings = [...lineItemMappings];
                                              newMappings[index] = {
                                                ...newMappings[index],
                                                includeInPO: e.target.checked,
                                              };
                                              setLineItemMappings(newMappings);
                                            }}
                                            sx={{ p: 0, mr: 0.5 }}
                                          />
                                          Purchase Order
                                          {mapping.includeInPO &&
                                            (hasVendorPrice ? (
                                              <CheckIcon
                                                sx={{
                                                  fontSize: 14,
                                                  color: "success.main",
                                                  ml: 0.5,
                                                }}
                                              />
                                            ) : (
                                              <WarningIcon
                                                sx={{
                                                  fontSize: 14,
                                                  color: "warning.main",
                                                  ml: 0.5,
                                                }}
                                              />
                                            ))}
                                        </Box>
                                      </TableCell>
                                      <TableCell align="right">
                                        {poPrice && poPrice.type === "RENTAL"
                                          ? formatPrice(poPrice.dayPrice)
                                          : "-"}
                                      </TableCell>
                                      <TableCell align="right">
                                        {poPrice && poPrice.type === "RENTAL"
                                          ? formatPrice(poPrice.weekPrice)
                                          : "-"}
                                      </TableCell>
                                      <TableCell align="right">
                                        {poPrice && poPrice.type === "RENTAL"
                                          ? formatPrice(poPrice.monthPrice)
                                          : "-"}
                                      </TableCell>
                                      <TableCell align="center">
                                        {mapping.includeInPO ? (
                                          vendorContactId ? (
                                            <Button
                                              size="small"
                                              variant={hasVendorPrice ? "text" : "contained"}
                                              onClick={() => openPriceSelection(index, "PO")}
                                            >
                                              {hasVendorPrice ? "Change" : "Set price"}
                                            </Button>
                                          ) : (
                                            <Typography variant="caption" color="text.secondary">
                                              Select vendor first
                                            </Typography>
                                          )
                                        ) : (
                                          <Typography variant="caption" color="text.secondary">
                                            Not included
                                          </Typography>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          );
                        }

                        // For sale items
                        if (item.type === "SALE") {
                          const unitMargin =
                            soPrice && poPrice && soPrice.type === "SALE" && poPrice.type === "SALE"
                              ? calculateMargin(soPrice.unitCost || 0, poPrice.unitCost || 0)
                              : null;

                          return (
                            <TableContainer>
                              <Table size="small" sx={{ minWidth: 300 }}>
                                <TableHead>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: "bold", width: 150 }}>
                                      Price
                                    </TableCell>
                                    <TableCell align="right">
                                      Unit Cost
                                      {unitMargin !== null && (
                                        <Typography
                                          component="span"
                                          variant="caption"
                                          sx={{
                                            ml: 1,
                                            color: unitMargin >= 0 ? "success.main" : "error.main",
                                            fontWeight: "bold",
                                          }}
                                        >
                                          ({unitMargin >= 0 ? "+" : ""}
                                          {unitMargin.toFixed(1)}%)
                                        </Typography>
                                      )}
                                    </TableCell>
                                    <TableCell align="center" sx={{ width: 120 }}>
                                      Actions
                                    </TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  <TableRow>
                                    <TableCell component="th" scope="row">
                                      Sales Order
                                      {hasPrice ? (
                                        <CheckIcon
                                          sx={{ fontSize: 14, color: "success.main", ml: 0.5 }}
                                        />
                                      ) : (
                                        <WarningIcon
                                          sx={{ fontSize: 14, color: "warning.main", ml: 0.5 }}
                                        />
                                      )}
                                    </TableCell>
                                    <TableCell align="right">
                                      {soPrice && soPrice.type === "SALE"
                                        ? formatPrice(soPrice.unitCost)
                                        : "-"}
                                    </TableCell>
                                    <TableCell align="center">
                                      <Button
                                        size="small"
                                        variant={hasPrice ? "text" : "contained"}
                                        onClick={() => openPriceSelection(index, "SO")}
                                      >
                                        {hasPrice ? "Change" : "Set price"}
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                  {conversionType === "SO_AND_PO" && (
                                    <TableRow>
                                      <TableCell component="th" scope="row">
                                        <Box sx={{ display: "flex", alignItems: "center" }}>
                                          <Checkbox
                                            size="small"
                                            checked={mapping.includeInPO !== false}
                                            onChange={(e) => {
                                              const newMappings = [...lineItemMappings];
                                              newMappings[index] = {
                                                ...newMappings[index],
                                                includeInPO: e.target.checked,
                                              };
                                              setLineItemMappings(newMappings);
                                            }}
                                            sx={{ p: 0, mr: 0.5 }}
                                          />
                                          Purchase Order
                                          {mapping.includeInPO &&
                                            (hasVendorPrice ? (
                                              <CheckIcon
                                                sx={{
                                                  fontSize: 14,
                                                  color: "success.main",
                                                  ml: 0.5,
                                                }}
                                              />
                                            ) : (
                                              <WarningIcon
                                                sx={{
                                                  fontSize: 14,
                                                  color: "warning.main",
                                                  ml: 0.5,
                                                }}
                                              />
                                            ))}
                                        </Box>
                                      </TableCell>
                                      <TableCell align="right">
                                        {poPrice && poPrice.type === "SALE"
                                          ? formatPrice(poPrice.unitCost)
                                          : "-"}
                                      </TableCell>
                                      <TableCell align="center">
                                        {mapping.includeInPO ? (
                                          vendorContactId ? (
                                            <Button
                                              size="small"
                                              variant={hasVendorPrice ? "text" : "contained"}
                                              onClick={() => openPriceSelection(index, "PO")}
                                            >
                                              {hasVendorPrice ? "Change" : "Set price"}
                                            </Button>
                                          ) : (
                                            <Typography variant="caption" color="text.secondary">
                                              Select vendor first
                                            </Typography>
                                          )
                                        ) : (
                                          <Typography variant="caption" color="text.secondary">
                                            Not included
                                          </Typography>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          );
                        }

                        return null;
                      })()}
                    </Box>
                  </Box>
                </ListItem>
              );
            })}
          </List>
        </Paper>
      </Box>
    );
  };

  const renderPreviewStep = () => {
    const submission = submissionData?.getIntakeFormSubmissionById;

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Review Orders to be Created
        </Typography>

        {/* Sales Order Preview */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom color="primary">
            Sales Order
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <Typography variant="body2" color="text.secondary">
                PO Number
              </Typography>
              <Typography variant="body1">{submission?.purchaseOrderNumber || "-"}</Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="body2" color="text.secondary">
                Buyer
              </Typography>
              <Typography variant="body1">
                {buyerContactId ? `Contact ID: ${buyerContactId}` : "-"}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="body2" color="text.secondary">
                Project
              </Typography>
              <Typography variant="body1">
                {projectId ? `Project ID: ${projectId}` : "-"}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="body2" color="text.secondary">
                Line Items
              </Typography>
              <Typography variant="body1">{lineItemMappings.length} items</Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Purchase Order Preview (if applicable) */}
        {conversionType === "SO_AND_PO" && (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom color="primary">
              Purchase Order
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  PO Number
                </Typography>
                <Typography variant="body1">Auto-generated</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Vendor
                </Typography>
                <Typography variant="body1">
                  {vendorContactId ? `Contact ID: ${vendorContactId}` : "-"}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Project
                </Typography>
                <Typography variant="body1">
                  {projectId ? `Project ID: ${projectId}` : "-"}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Line Items
                </Typography>
                <Typography variant="body1">{lineItemMappings.length} items</Typography>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Line Items Table */}
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Description</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="center">Qty</TableCell>
                <TableCell>Delivery</TableCell>
                <TableCell>SO Price</TableCell>
                {conversionType === "SO_AND_PO" && <TableCell>PO Price</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {lineItemMappings.map((mapping, index) => {
                const item = mapping.submissionLineItem;
                return (
                  <TableRow key={index}>
                    <TableCell>{item.customPriceName || item.description}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.type}
                        size="small"
                        color={item.type === "RENTAL" ? "primary" : "secondary"}
                      />
                    </TableCell>
                    <TableCell align="center">{item.quantity}</TableCell>
                    <TableCell>{item.deliveryMethod || "-"}</TableCell>
                    <TableCell>
                      {mapping.priceId ? (
                        <CheckCircleIcon color="success" fontSize="small" />
                      ) : (
                        <WarningIcon color="warning" fontSize="small" />
                      )}
                    </TableCell>
                    {conversionType === "SO_AND_PO" && (
                      <TableCell>
                        {mapping.includeInPO ? (
                          mapping.vendorPriceId ? (
                            <CheckCircleIcon color="success" fontSize="small" />
                          ) : (
                            <WarningIcon color="warning" fontSize="small" />
                          )
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderConfigurationStep();
      case 1:
        return renderValidationStep();
      case 2:
        return renderPreviewStep();
      case 3:
        return (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 4 }}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Creating Orders...
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Please wait while we create your orders
            </Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>Convert Submission to Order</DialogTitle>
        <DialogContent>
          {loadingSubmission ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
              {renderStepContent()}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isCreatingOrders}>
            Cancel
          </Button>
          {activeStep > 0 && activeStep < 3 && (
            <Button onClick={handleBack} disabled={isCreatingOrders}>
              Back
            </Button>
          )}
          {activeStep < 3 && (
            <Button
              onClick={handleNext}
              variant="contained"
              disabled={!canProceedToNextStep || isCreatingOrders}
              endIcon={activeStep === 2 ? <CheckCircleIcon /> : <ArrowForwardIcon />}
            >
              {activeStep === 2 ? "Create Orders" : "Next"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Price Selection Dialog */}
      <PriceSelectionDialog
        open={priceSelectionOpen}
        onClose={() => {
          setPriceSelectionOpen(false);
          setPriceSelectionIndex(null);
        }}
        onSelect={handlePriceSelect}
        workspaceId={workspaceId}
        pimCategoryId={
          priceSelectionIndex !== null
            ? lineItemMappings[priceSelectionIndex]?.submissionLineItem?.pimCategoryId
            : undefined
        }
        priceType={
          priceSelectionIndex !== null
            ? lineItemMappings[priceSelectionIndex]?.submissionLineItem?.type === "RENTAL"
              ? "RENTAL"
              : "SALE"
            : "BOTH"
        }
        title={
          priceSelectionType === "SO"
            ? "Select Sales Order Price"
            : "Select Purchase Order Vendor Price"
        }
        selectedPriceId={
          priceSelectionIndex !== null
            ? priceSelectionType === "SO"
              ? lineItemMappings[priceSelectionIndex]?.priceId
              : lineItemMappings[priceSelectionIndex]?.vendorPriceId
            : undefined
        }
        priceBookId={undefined}
        comparisonPrice={
          priceSelectionType === "PO" && priceSelectionIndex !== null
            ? (() => {
                const soPrice = getPriceDetails(lineItemMappings[priceSelectionIndex]?.priceId);
                const soPriceData = allPricesData?.listPrices?.items?.find(
                  (p: any) => p.id === lineItemMappings[priceSelectionIndex]?.priceId,
                );
                if (!soPrice) return undefined;

                return {
                  id: lineItemMappings[priceSelectionIndex]?.priceId || "",
                  name: soPriceData?.name || "Unnamed Price",
                  type: soPrice.type as "RENTAL" | "SALE",
                  dayPrice: soPrice.type === "RENTAL" ? soPrice.dayPrice : undefined,
                  weekPrice: soPrice.type === "RENTAL" ? soPrice.weekPrice : undefined,
                  monthPrice: soPrice.type === "RENTAL" ? soPrice.monthPrice : undefined,
                  unitCost: soPrice.type === "SALE" ? soPrice.unitCost : undefined,
                };
              })()
            : undefined
        }
      />
    </>
  );
}
