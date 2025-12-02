"use client";

import { graphql } from "@/graphql";
import { ContactType, DeliveryMethod, LineItemStatus, PoLineItemStatus } from "@/graphql/graphql";
import {
  useAssignInventoryToRentalFulfilmentMutation,
  useContactSelectorListQuery,
  useCreatePurchaseOrderMutation,
  useCreateRentalPriceMutation,
  useCreateRentalPurchaseOrderLineItemMutation,
  useCreateRentalSalesOrderLineItemMutation,
  useCreateSalePriceMutation,
  useCreateSalePurchaseOrderLineItemMutation,
  useCreateSaleSalesOrderLineItemMutation,
  useCreateSalesOrderMutation,
  useListInventoryItemsLazyQuery,
  useListPricesQuery,
  useListRentalFulfilmentsLazyQuery,
  useSubmitPurchaseOrderMutation,
  useSubmitSalesOrderForConversionMutation,
} from "@/graphql/hooks";
import { useNotification } from "@/providers/NotificationProvider";
import ContactSelector from "@/ui/ContactSelector";
import {
  useGetIntakeFormByIdQuery,
  useGetIntakeFormSubmissionByIdQuery,
  useListIntakeFormSubmissionLineItemsQuery,
  useUpdateIntakeFormSubmissionMutation,
} from "@/ui/intake-forms/api";
import ProjectSelector from "@/ui/ProjectSelector";
import {
  Add as AddIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Error as ErrorIcon,
  PersonAdd as PersonAddIcon,
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
import { DataGridPremium, GridColDef, GridRenderCellParams } from "@mui/x-data-grid-premium";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { PriceSelectionDialog } from "../prices/PriceSelectionDialog";
import { CreateContactDialog } from "./CreateContactDialog";

// Note: Most GraphQL operations have been moved to @/ui/intake-forms/api
// These conversion-specific queries remain here as they're beyond core intake form operations

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

  // Contact creation dialog state
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [contactDialogType, setContactDialogType] = useState<"buyer" | "vendor">("buyer");
  const [contactMatchAttempted, setContactMatchAttempted] = useState(false);
  const [noContactMatchFound, setNoContactMatchFound] = useState(false);

  // Track manually selected prices to preserve them during re-renders
  const [manuallySelectedPrices, setManuallySelectedPrices] = useState<{
    [lineItemId: string]: { priceId?: string; vendorPriceId?: string };
  }>({});

  // Track PO inclusion state to preserve it during re-renders
  const [poInclusionState, setPoInclusionState] = useState<{
    [lineItemId: string]: boolean;
  }>({});

  // Track vendor contact source for helper text
  const [vendorContactSource, setVendorContactSource] = useState<string>("");

  // Navigation dialog state
  const [showNavigationDialog, setShowNavigationDialog] = useState(false);
  const [createdOrderIds, setCreatedOrderIds] = useState<{
    salesOrderId?: string;
    purchaseOrderId?: string;
    hasRentalItems: boolean;
  }>({ hasRentalItems: false });

  // Progress tracking state
  const [creationProgress, setCreationProgress] = useState<{
    salesOrderCreated: boolean;
    purchaseOrderCreated: boolean;
    inventoryAssigned: boolean;
    salesOrderNumber?: string;
    purchaseOrderNumber?: string;
  }>({
    salesOrderCreated: false,
    purchaseOrderCreated: false,
    inventoryAssigned: false,
  });

  // Fetch submission data
  const { data: submissionData, loading: loadingSubmission } = useGetIntakeFormSubmissionByIdQuery({
    variables: { id: submissionId },
    skip: !open,
    fetchPolicy: "cache-and-network",
  });

  // Fetch intake form data
  const { data: intakeFormData } = useGetIntakeFormByIdQuery({
    variables: { id: submissionData?.getIntakeFormSubmissionById?.formId || "" },
    skip: !submissionData?.getIntakeFormSubmissionById?.formId,
    fetchPolicy: "cache-and-network",
  });

  // Fetch line items
  const { data: lineItemsData } = useListIntakeFormSubmissionLineItemsQuery({
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
  const [assignInventoryToFulfilment] = useAssignInventoryToRentalFulfilmentMutation();
  const [submitPurchaseOrder] = useSubmitPurchaseOrderMutation();
  const [submitSalesOrder] = useSubmitSalesOrderForConversionMutation();
  const [getListRentalFulfilments] = useListRentalFulfilmentsLazyQuery();
  const [getListInventory] = useListInventoryItemsLazyQuery();

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
      if (submission?.email && contactsData && !contactMatchAttempted) {
        const matchedContact = contactsData.listContacts?.items?.find(
          (contact: any) =>
            contact.__typename === "PersonContact" && contact.email === submission.email,
        );
        if (matchedContact) {
          setBuyerContactId(matchedContact.id);
          setNoContactMatchFound(false);
        } else {
          // No match found - set flag to show warning
          setNoContactMatchFound(true);
        }
        setContactMatchAttempted(true);
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

          // Check if we have a saved PO inclusion state for this item
          const includeInPO =
            poInclusionState[item.id] !== undefined ? poInclusionState[item.id] : true; // Default to including in PO

          return {
            submissionLineItem: item,
            priceId: finalPriceId,
            vendorPriceId,
            needsPriceCreation: !finalPriceId,
            needsVendorPriceCreation: conversionType === "SO_AND_PO" && !vendorPriceId,
            customPriceName: item.customPriceName,
            includeInPO,
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
    poInclusionState,
    contactMatchAttempted,
    buyerContactId,
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

    // Reset progress state
    setCreationProgress({
      salesOrderCreated: false,
      purchaseOrderCreated: false,
      inventoryAssigned: false,
    });

    // Show the dialog immediately in loading state for SO+PO
    if (conversionType === "SO_AND_PO") {
      setShowNavigationDialog(true);
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
            intake_form_submission_id: submissionId,
          },
        },
      });

      const salesOrderId = salesOrderResult.data?.createSalesOrder?.id;
      const salesOrderNumber = salesOrderResult.data?.createSalesOrder?.sales_order_number;
      if (!salesOrderId) {
        throw new Error("Failed to create sales order");
      }

      // Update progress - Sales Order created
      setCreationProgress((prev) => ({
        ...prev,
        salesOrderCreated: true,
        salesOrderNumber: salesOrderNumber || salesOrderId,
      }));

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
                intake_form_submission_line_item_id: item.id,
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
                intake_form_submission_line_item_id: item.id,
              },
            },
          });
          updatedMappings[i].salesOrderLineItemId =
            lineItemResult.data?.createSaleSalesOrderLineItem?.id;
        }
      }

      // Step 3: Submit Sales Order
      await submitSalesOrder({
        variables: { id: salesOrderId },
      });

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
        const purchaseOrderNumber =
          purchaseOrderResult.data?.createPurchaseOrder?.purchase_order_number;
        if (!purchaseOrderId) {
          throw new Error("Failed to create purchase order");
        }

        // Update progress - Purchase Order created
        setCreationProgress((prev) => ({
          ...prev,
          purchaseOrderCreated: true,
          purchaseOrderNumber: purchaseOrderNumber || purchaseOrderId,
        }));

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

        // Submit the Purchase Order
        await submitPurchaseOrder({
          variables: { id: purchaseOrderId },
        });

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

        // Update progress - Inventory assigned
        setCreationProgress((prev) => ({
          ...prev,
          inventoryAssigned: true,
        }));
      }

      // Check if there are rental items
      const hasRentalItems = lineItemMappings.some(
        (mapping) => mapping.submissionLineItem.type === "RENTAL",
      );

      // Update the created order IDs
      setCreatedOrderIds({
        salesOrderId,
        purchaseOrderId,
        hasRentalItems,
      });

      if (conversionType === "SO_AND_PO") {
        // Dialog is already showing, just update to completed state
        setIsCreatingOrders(false);
      } else {
        // For SO only, redirect directly to the sales order
        router.push(`/app/${workspaceId}/sales-orders/${salesOrderId}`);
        onClose();
      }
    } catch (error: any) {
      notifyError(`Failed to create orders: ${error.message}`);
      setIsCreatingOrders(false);
      setShowNavigationDialog(false);
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
          sx={{ mb: 2 }}
        />
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
      </RadioGroup>
    </Box>
  );

  const renderValidationStep = () => {
    const submission = submissionData?.getIntakeFormSubmissionById;
    const intakeForm = intakeFormData?.getIntakeFormById;

    // Split line items by type
    const rentalItems = lineItemMappings.filter(
      (mapping) => mapping.submissionLineItem.type === "RENTAL",
    );
    const saleItems = lineItemMappings.filter(
      (mapping) => mapping.submissionLineItem.type === "PURCHASE",
    );

    // Create expanded rows for rental items (one row for SO, one for PO if needed)
    const rentalRows = rentalItems.flatMap((mapping, index) => {
      const rows: any[] = [
        {
          id: `${mapping.submissionLineItem.id}-SO`,
          type: "SO",
          mapping,
          originalIndex: lineItemMappings.findIndex((m) => m === mapping),
        },
      ];

      if (conversionType === "SO_AND_PO") {
        rows.push({
          id: `${mapping.submissionLineItem.id}-PO`,
          type: "PO",
          mapping,
          originalIndex: lineItemMappings.findIndex((m) => m === mapping),
        });
      }

      return rows;
    });

    // Rental Items DataGrid Columns
    const rentalColumns: GridColDef[] = [
      {
        field: "product",
        headerName: "Product",
        flex: 1,
        minWidth: 160,
        renderCell: (params: GridRenderCellParams) => {
          const row = params.row;
          const mapping = row.mapping as LineItemMapping;
          const item = mapping.submissionLineItem;

          // Only show product name in SO row
          if (row.type === "SO") {
            return (
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {item.customPriceName || item.description}
                </Typography>
              </Box>
            );
          }
          return null;
        },
      },
      {
        field: "quantity",
        headerName: "Qty",
        width: 80,
        align: "center",
        headerAlign: "center",
        renderCell: (params: GridRenderCellParams) => {
          const row = params.row;
          const mapping = row.mapping as LineItemMapping;

          // Only show quantity in SO row
          if (row.type === "SO") {
            return mapping.submissionLineItem.quantity;
          }
          return null;
        },
      },
      {
        field: "orderType",
        headerName: "Order Type",
        width: 150,
        renderCell: (params: GridRenderCellParams) => {
          const row = params.row;

          if (row.type === "SO") {
            return (
              <Chip
                label="Sales Order"
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 500 }}
              />
            );
          } else {
            return (
              <Chip
                label="Purchase Order"
                size="small"
                color="secondary"
                variant="outlined"
                sx={{ fontWeight: 500 }}
              />
            );
          }
        },
      },
      {
        field: "day",
        headerName: "Day",
        width: 120,
        align: "center",
        headerAlign: "center",
        renderCell: (params: GridRenderCellParams) => {
          const row = params.row;
          const mapping = row.mapping as LineItemMapping;

          if (row.type === "SO") {
            const soPrice = getPriceDetails(mapping.priceId);
            return soPrice && soPrice.type === "RENTAL" ? formatPrice(soPrice.dayPrice) : "-";
          } else {
            if (!mapping.includeInPO) return <Typography variant="body2">-</Typography>;
            const soPrice = getPriceDetails(mapping.priceId);
            const poPrice = getPriceDetails(mapping.vendorPriceId);
            const margin =
              soPrice && poPrice && soPrice.type === "RENTAL" && poPrice.type === "RENTAL"
                ? calculateMargin(soPrice.dayPrice || 0, poPrice.dayPrice || 0)
                : null;

            return (
              <Box>
                <Typography variant="body2">
                  {poPrice && poPrice.type === "RENTAL" ? formatPrice(poPrice.dayPrice) : "-"}
                </Typography>
                {margin !== null && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: margin >= 0 ? "success.main" : "error.main",
                      fontWeight: "bold",
                      display: "block",
                      textAlign: "right",
                    }}
                  >
                    {margin >= 0 ? "+" : ""}
                    {margin.toFixed(1)}%
                  </Typography>
                )}
              </Box>
            );
          }
        },
      },
      {
        field: "week",
        headerName: "Week",
        width: 120,
        align: "center",
        headerAlign: "center",
        renderCell: (params: GridRenderCellParams) => {
          const row = params.row;
          const mapping = row.mapping as LineItemMapping;

          if (row.type === "SO") {
            const soPrice = getPriceDetails(mapping.priceId);
            return (
              <Typography variant="body2">
                {soPrice && soPrice.type === "RENTAL" ? formatPrice(soPrice.weekPrice) : "-"}
              </Typography>
            );
          } else {
            if (!mapping.includeInPO) return <Typography variant="body2">-</Typography>;
            const soPrice = getPriceDetails(mapping.priceId);
            const poPrice = getPriceDetails(mapping.vendorPriceId);
            const margin =
              soPrice && poPrice && soPrice.type === "RENTAL" && poPrice.type === "RENTAL"
                ? calculateMargin(soPrice.weekPrice || 0, poPrice.weekPrice || 0)
                : null;
            return (
              <Box>
                <Typography variant="body2">
                  {poPrice && poPrice.type === "RENTAL" ? formatPrice(poPrice.weekPrice) : "-"}
                </Typography>
                {margin !== null && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: margin >= 0 ? "success.main" : "error.main",
                      fontWeight: "bold",
                      display: "block",
                      textAlign: "right",
                    }}
                  >
                    {margin >= 0 ? "+" : ""}
                    {margin.toFixed(1)}%
                  </Typography>
                )}
              </Box>
            );
          }
        },
      },
      {
        field: "month",
        headerName: "4 Weeks",
        width: 130,
        align: "center",
        headerAlign: "center",
        renderCell: (params: GridRenderCellParams) => {
          const row = params.row;
          const mapping = row.mapping as LineItemMapping;

          if (row.type === "SO") {
            const soPrice = getPriceDetails(mapping.priceId);
            return (
              <Typography variant="body2">
                {soPrice && soPrice.type === "RENTAL" ? formatPrice(soPrice.monthPrice) : "-"}
              </Typography>
            );
          } else {
            if (!mapping.includeInPO) return <Typography variant="body2">-</Typography>;
            const soPrice = getPriceDetails(mapping.priceId);
            const poPrice = getPriceDetails(mapping.vendorPriceId);
            const margin =
              soPrice && poPrice && soPrice.type === "RENTAL" && poPrice.type === "RENTAL"
                ? calculateMargin(soPrice.monthPrice || 0, poPrice.monthPrice || 0)
                : null;
            return (
              <Box>
                <Typography variant="body2">
                  {poPrice && poPrice.type === "RENTAL" ? formatPrice(poPrice.monthPrice) : "-"}
                </Typography>
                {margin !== null && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: margin >= 0 ? "success.main" : "error.main",
                      fontWeight: "bold",
                      display: "block",
                      textAlign: "right",
                    }}
                  >
                    {margin >= 0 ? "+" : ""}
                    {margin.toFixed(1)}%
                  </Typography>
                )}
              </Box>
            );
          }
        },
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 160,
        align: "left",
        headerAlign: "center",
        sortable: false,
        renderCell: (params: GridRenderCellParams) => {
          const row = params.row;
          const mapping = row.mapping as LineItemMapping;

          if (row.type === "SO") {
            const hasPrice = !!mapping.priceId;
            return (
              <Button
                size="small"
                variant={hasPrice ? "outlined" : "contained"}
                onClick={() => openPriceSelection(row.originalIndex, "SO")}
              >
                {hasPrice ? "Change" : "Set Price"}
              </Button>
            );
          } else {
            // PO row - show Include/Exclude button and price button
            const isIncluded = mapping.includeInPO !== false;

            if (!isIncluded) {
              return (
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  onClick={() => {
                    const lineItemId = row.mapping.submissionLineItem.id;
                    // Update the PO inclusion state
                    setPoInclusionState((prev) => ({
                      ...prev,
                      [lineItemId]: true,
                    }));
                    // Update the mappings
                    const newMappings = [...lineItemMappings];
                    newMappings[row.originalIndex] = {
                      ...newMappings[row.originalIndex],
                      includeInPO: true,
                    };
                    setLineItemMappings(newMappings);
                  }}
                  sx={{ minWidth: "auto", px: 1 }}
                >
                  <AddIcon fontSize="small" />
                </Button>
              );
            }

            if (!vendorContactId) {
              return (
                <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                    Select vendor first
                  </Typography>
                </Box>
              );
            }

            const hasVendorPrice = !!mapping.vendorPriceId;
            return (
              <Box sx={{ display: "flex", gap: 0.5 }}>
                <Button
                  size="small"
                  variant={hasVendorPrice ? "outlined" : "contained"}
                  onClick={() => openPriceSelection(row.originalIndex, "PO")}
                >
                  {hasVendorPrice ? "Change" : "Set Price"}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    const lineItemId = row.mapping.submissionLineItem.id;
                    // Update the PO inclusion state
                    setPoInclusionState((prev) => ({
                      ...prev,
                      [lineItemId]: false,
                    }));
                    // Update the mappings
                    const newMappings = [...lineItemMappings];
                    newMappings[row.originalIndex] = {
                      ...newMappings[row.originalIndex],
                      includeInPO: false,
                    };
                    setLineItemMappings(newMappings);
                  }}
                  sx={{ minWidth: "auto", px: 1 }}
                >
                  <CloseIcon fontSize="small" />
                </Button>
              </Box>
            );
          }
        },
      },
    ];

    // Create expanded rows for sale items (one row for SO, one for PO if needed)
    const saleRows = saleItems.flatMap((mapping, index) => {
      const rows: any[] = [
        {
          id: `${mapping.submissionLineItem.id}-SO`,
          type: "SO",
          mapping,
          originalIndex: lineItemMappings.findIndex((m) => m === mapping),
        },
      ];

      if (conversionType === "SO_AND_PO") {
        rows.push({
          id: `${mapping.submissionLineItem.id}-PO`,
          type: "PO",
          mapping,
          originalIndex: lineItemMappings.findIndex((m) => m === mapping),
        });
      }

      return rows;
    });

    // Sale Items DataGrid Columns
    const saleColumns: GridColDef[] = [
      {
        field: "product",
        headerName: "Product",
        flex: 1,
        minWidth: 200,
        renderCell: (params: GridRenderCellParams) => {
          const row = params.row;
          const mapping = row.mapping as LineItemMapping;
          const item = mapping.submissionLineItem;

          // Only show product name in SO row
          if (row.type === "SO") {
            return (
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {item.customPriceName || item.description}
                </Typography>
              </Box>
            );
          }
          return null;
        },
      },
      {
        field: "quantity",
        headerName: "Qty",
        width: 80,
        align: "center",
        headerAlign: "center",
        renderCell: (params: GridRenderCellParams) => {
          const row = params.row;
          const mapping = row.mapping as LineItemMapping;

          // Only show quantity in SO row
          if (row.type === "SO") {
            return mapping.submissionLineItem.quantity;
          }
          return null;
        },
      },
      {
        field: "orderType",
        headerName: "Order Type",
        width: 130,
        renderCell: (params: GridRenderCellParams) => {
          const row = params.row;

          if (row.type === "SO") {
            return (
              <Chip
                label="Sales Order"
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 500 }}
              />
            );
          } else {
            return (
              <Chip
                label="Purchase Order"
                size="small"
                color="secondary"
                variant="outlined"
                sx={{ fontWeight: 500 }}
              />
            );
          }
        },
      },
      {
        field: "unitCost",
        headerName: "Unit Cost",
        width: 130,
        align: "center",
        headerAlign: "center",
        renderCell: (params: GridRenderCellParams) => {
          const row = params.row;
          const mapping = row.mapping as LineItemMapping;

          if (row.type === "SO") {
            const soPrice = getPriceDetails(mapping.priceId);
            const hasPrice = !!mapping.priceId;
            return (
              <Box
                sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}
              >
                <Typography variant="body2">
                  {soPrice && soPrice.type === "SALE" ? formatPrice(soPrice.unitCost) : "-"}
                </Typography>
              </Box>
            );
          } else {
            if (!mapping.includeInPO) return <Typography variant="body2">-</Typography>;
            const soPrice = getPriceDetails(mapping.priceId);
            const poPrice = getPriceDetails(mapping.vendorPriceId);
            const hasVendorPrice = !!mapping.vendorPriceId;
            const margin =
              soPrice && poPrice && soPrice.type === "SALE" && poPrice.type === "SALE"
                ? calculateMargin(soPrice.unitCost || 0, poPrice.unitCost || 0)
                : null;
            return (
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 0.5,
                  }}
                >
                  <Typography variant="body2">
                    {poPrice && poPrice.type === "SALE" ? formatPrice(poPrice.unitCost) : "-"}
                  </Typography>
                </Box>
                {margin !== null && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: margin >= 0 ? "success.main" : "error.main",
                      fontWeight: "bold",
                      display: "block",
                      textAlign: "right",
                    }}
                  >
                    {margin >= 0 ? "+" : ""}
                    {margin.toFixed(1)}%
                  </Typography>
                )}
              </Box>
            );
          }
        },
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 160,
        align: "left",
        headerAlign: "center",
        sortable: false,
        renderCell: (params: GridRenderCellParams) => {
          const row = params.row;
          const mapping = row.mapping as LineItemMapping;

          if (row.type === "SO") {
            const hasPrice = !!mapping.priceId;
            return (
              <Button
                size="small"
                variant={hasPrice ? "outlined" : "contained"}
                onClick={() => openPriceSelection(row.originalIndex, "SO")}
              >
                {hasPrice ? "Change" : "Set Price"}
              </Button>
            );
          } else {
            // PO row - show Include/Exclude button and price button
            const isIncluded = mapping.includeInPO !== false;

            if (!isIncluded) {
              return (
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  onClick={() => {
                    const lineItemId = row.mapping.submissionLineItem.id;
                    // Update the PO inclusion state
                    setPoInclusionState((prev) => ({
                      ...prev,
                      [lineItemId]: true,
                    }));
                    // Update the mappings
                    const newMappings = [...lineItemMappings];
                    newMappings[row.originalIndex] = {
                      ...newMappings[row.originalIndex],
                      includeInPO: true,
                    };
                    setLineItemMappings(newMappings);
                  }}
                  sx={{ minWidth: "auto", px: 1 }}
                >
                  <AddIcon fontSize="small" />
                </Button>
              );
            }

            if (!vendorContactId) {
              return (
                <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                    Select vendor first
                  </Typography>
                </Box>
              );
            }

            const hasVendorPrice = !!mapping.vendorPriceId;
            return (
              <Box sx={{ display: "flex", gap: 0.5 }}>
                <Button
                  size="small"
                  variant={hasVendorPrice ? "outlined" : "contained"}
                  onClick={() => openPriceSelection(row.originalIndex, "PO")}
                >
                  {hasVendorPrice ? "Change" : "Set Price"}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    const lineItemId = row.mapping.submissionLineItem.id;
                    // Update the PO inclusion state
                    setPoInclusionState((prev) => ({
                      ...prev,
                      [lineItemId]: false,
                    }));
                    // Update the mappings
                    const newMappings = [...lineItemMappings];
                    newMappings[row.originalIndex] = {
                      ...newMappings[row.originalIndex],
                      includeInPO: false,
                    };
                    setLineItemMappings(newMappings);
                  }}
                  sx={{ minWidth: "auto", px: 1 }}
                >
                  <CloseIcon fontSize="small" />
                </Button>
              </Box>
            );
          }
        },
      },
    ];

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
              {noContactMatchFound && !buyerContactId && (
                <Alert severity="warning" sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    No existing contact found with email: <strong>{submission?.email}</strong>
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                    Please select an existing contact or create a new one.
                  </Typography>
                </Alert>
              )}
              <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                <Box sx={{ flex: 1 }}>
                  <ContactSelector
                    workspaceId={workspaceId}
                    contactId={buyerContactId}
                    onChange={(newContactId) => {
                      setBuyerContactId(newContactId);
                      // Clear the warning when a contact is selected
                      if (newContactId) {
                        setNoContactMatchFound(false);
                      }
                    }}
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
                </Box>
                {!buyerContactId && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<PersonAddIcon />}
                    onClick={() => {
                      setContactDialogType("buyer");
                      setShowContactDialog(true);
                    }}
                    sx={{ mt: 0.5 }}
                  >
                    New
                  </Button>
                )}
              </Box>
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

        {/* Rental Items DataGrid */}
        {rentalItems.length > 0 && (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Rental Items ({rentalItems.length})
            </Typography>
            <Box sx={{ width: "100%" }}>
              <DataGridPremium
                rows={rentalRows}
                columns={rentalColumns}
                density="standard"
                hideFooter
                disableRowSelectionOnClick
                getRowId={(row) => row.id}
                sx={{
                  "& .MuiDataGrid-cell": {
                    display: "flex",
                    alignItems: "center", // vertical center
                  },
                }}
              />
            </Box>
          </Paper>
        )}

        {/* Sale Items DataGrid */}
        {saleItems.length > 0 && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Sale Items ({saleItems.length})
            </Typography>
            <Box sx={{ width: "100%" }}>
              <DataGridPremium
                rows={saleRows}
                columns={saleColumns}
                density="standard"
                hideFooter
                disableRowSelectionOnClick
                getRowId={(row) => row.id}
                sx={{
                  "& .MuiDataGrid-cell": {
                    display: "flex",
                    alignItems: "center", // vertical center
                  },
                }}
              />
            </Box>
          </Paper>
        )}
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

  const handleNavigationChoice = (
    destination: "sales-order" | "purchase-order" | "rental-fulfillments",
  ) => {
    const { salesOrderId, purchaseOrderId } = createdOrderIds;

    switch (destination) {
      case "sales-order":
        router.push(`/app/${workspaceId}/sales-orders/${salesOrderId}`);
        break;
      case "purchase-order":
        router.push(`/app/${workspaceId}/purchase-orders/${purchaseOrderId}`);
        break;
      case "rental-fulfillments":
        router.push(`/app/${workspaceId}/rental-fulfillments?salesOrderId=${salesOrderId}`);
        break;
    }

    setShowNavigationDialog(false);
    onClose();
  };

  // Handle contact creation
  const handleContactCreated = useCallback(
    (contactId: string) => {
      if (contactDialogType === "buyer") {
        setBuyerContactId(contactId);
        setNoContactMatchFound(false);
      } else {
        setVendorContactId(contactId);
        setVendorContactSource("Manually created");
      }
      setShowContactDialog(false);
      notifySuccess("Contact created and selected successfully");
    },
    [contactDialogType, notifySuccess],
  );

  return (
    <>
      <Dialog open={open && !showNavigationDialog} onClose={onClose} maxWidth="lg" fullWidth>
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

      {/* Progress and Navigation Dialog */}
      <Dialog
        open={showNavigationDialog}
        onClose={() => {
          if (!isCreatingOrders) {
            setShowNavigationDialog(false);
            onClose();
          }
        }}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown={isCreatingOrders}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {isCreatingOrders ? (
              <>
                <Typography variant="h6">Creating Orders...</Typography>
              </>
            ) : (
              <>
                <Typography variant="h6">Orders Created Successfully!</Typography>
              </>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {isCreatingOrders ? (
            // Loading state - show progress with same card layout
            <>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" gutterBottom>
                  Creating your orders and assigning inventory...
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Please wait while we process your request:
                </Typography>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    opacity: creationProgress.salesOrderCreated ? 1 : 0.7,
                    transition: "all 0.3s",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    {creationProgress.salesOrderCreated ? (
                      <CheckCircleIcon sx={{ color: "success.main" }} />
                    ) : (
                      <CircularProgress size={24} />
                    )}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1">
                        Sales Order
                        {creationProgress.salesOrderNumber && (
                          <Typography
                            component="span"
                            variant="body2"
                            color="primary"
                            sx={{ ml: 1 }}
                          >
                            #{creationProgress.salesOrderNumber}
                          </Typography>
                        )}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {creationProgress.salesOrderCreated
                          ? "Sales order created successfully"
                          : "Creating sales order..."}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>

                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    opacity: creationProgress.purchaseOrderCreated ? 1 : 0.7,
                    transition: "all 0.3s",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    {creationProgress.purchaseOrderCreated ? (
                      <CheckCircleIcon sx={{ color: "success.main" }} />
                    ) : (
                      <CircularProgress size={24} />
                    )}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1">
                        Purchase Order
                        {creationProgress.purchaseOrderNumber && (
                          <Typography
                            component="span"
                            variant="body2"
                            color="primary"
                            sx={{ ml: 1 }}
                          >
                            #{creationProgress.purchaseOrderNumber}
                          </Typography>
                        )}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {creationProgress.purchaseOrderCreated
                          ? "Purchase order created successfully"
                          : "Creating purchase order..."}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>

                {lineItemMappings.some(
                  (mapping) => mapping.submissionLineItem.type === "RENTAL",
                ) && (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      opacity: creationProgress.purchaseOrderCreated ? 1 : 0.7,
                      transition: "all 0.3s",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      {creationProgress.inventoryAssigned ? (
                        <CheckCircleIcon sx={{ color: "success.main" }} />
                      ) : (
                        <CircularProgress size={24} sx={{ color: "primary.main" }} />
                      )}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1">Rental Fulfillments</Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            opacity: creationProgress.inventoryAssigned ? 0.9 : 1,
                          }}
                        >
                          {creationProgress.inventoryAssigned
                            ? "Inventory assigned successfully"
                            : "Assigning inventory to fulfillments..."}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                )}
              </Box>
            </>
          ) : (
            // Completed state - show navigation options
            <>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" gutterBottom>
                  All orders have been created and inventory has been assigned successfully.
                </Typography>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
                  }}
                  onClick={() => handleNavigationChoice("sales-order")}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <CheckCircleIcon sx={{ color: "success.main" }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1">
                        Sales Order
                        {creationProgress.salesOrderNumber && (
                          <Typography
                            component="span"
                            variant="body2"
                            color="primary"
                            sx={{ ml: 1 }}
                          >
                            #{creationProgress.salesOrderNumber}
                          </Typography>
                        )}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Review the sales order details and line items
                      </Typography>
                    </Box>
                    <ArrowForwardIcon sx={{ color: "action.active" }} />
                  </Box>
                </Paper>

                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
                  }}
                  onClick={() => handleNavigationChoice("purchase-order")}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <CheckCircleIcon sx={{ color: "success.main" }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1">
                        Purchase Order
                        {creationProgress.purchaseOrderNumber && (
                          <Typography
                            component="span"
                            variant="body2"
                            color="primary"
                            sx={{ ml: 1 }}
                          >
                            #{creationProgress.purchaseOrderNumber}
                          </Typography>
                        )}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Review the purchase order details and vendor items
                      </Typography>
                    </Box>
                    <ArrowForwardIcon sx={{ color: "action.active" }} />
                  </Box>
                </Paper>

                {createdOrderIds.hasRentalItems && (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      "&:hover": {
                        backgroundColor: "action.hover",
                      },
                    }}
                    onClick={() => handleNavigationChoice("rental-fulfillments")}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <CheckCircleIcon sx={{ color: "success.main" }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1">Rental Fulfillments Assigned</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.9 }}>
                          New inventory has been assigned to rental fulfillments
                        </Typography>
                      </Box>
                      <ArrowForwardIcon sx={{ color: "action.active" }} />
                    </Box>
                  </Paper>
                )}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowNavigationDialog(false);
              onClose();
            }}
            disabled={isCreatingOrders}
          >
            {isCreatingOrders ? "Processing..." : "Close"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Contact Dialog */}
      <CreateContactDialog
        open={showContactDialog}
        onClose={() => setShowContactDialog(false)}
        onContactCreated={handleContactCreated}
        workspaceId={workspaceId}
        initialData={{
          name: submissionData?.getIntakeFormSubmissionById?.name || "",
          email: submissionData?.getIntakeFormSubmissionById?.email || "",
          phone: submissionData?.getIntakeFormSubmissionById?.phone || "",
          companyName: submissionData?.getIntakeFormSubmissionById?.companyName || "",
        }}
        type={contactDialogType}
      />
    </>
  );
}
