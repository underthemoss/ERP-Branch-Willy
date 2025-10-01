"use client";

import { graphql } from "@/graphql";
import {
  DeliveryMethod,
  LineItemStatus,
  PoLineItemStatus,
  ProjectContactRelationEnum,
  ProjectStatusEnum,
  ScopeOfWorkEnum,
  useSeedCreateBusinessContactMutation,
  useSeedCreatePersonContactMutation,
  useSeedCreatePriceBookMutation,
  useSeedCreateProjectMutation,
  useSeedCreatePurchaseOrderMutation,
  useSeedCreateRentalPriceMenutationMutation,
  useSeedCreateRentalPurchaseOrderLineItemMutation,
  useSeedCreateRentalSalesOrderLineItemMutation,
  useSeedCreateSalesOrderMutation,
  useSeedCreateWorkflowConfigurationMutation,
  useSeedCreateWorkspaceMutation,
  useSeedSubmitPurchaseOrderMutation,
  useSeedSubmitSalesOrderMutation,
  useSeedUpsertPimCategoryMutation,
  WorkspaceAccessType,
} from "@/graphql/hooks";
import { useNotification } from "@/providers/NotificationProvider";
import {
  CheckCircle,
  Error as ErrorIcon,
  RadioButtonUnchecked,
  Science,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

// Define seed mutations for codegen
const SEED_CREATE_WORKSPACE_MUTATION = graphql(`
  mutation SeedCreateWorkspace(
    $name: String!
    $accessType: WorkspaceAccessType!
    $description: String
    $archived: Boolean
  ) {
    createWorkspace(
      name: $name
      accessType: $accessType
      description: $description
      archived: $archived
    ) {
      id
      name
      description
      accessType
      archived
    }
  }
`);

const SEED_CREATE_BUSINESS_CONTACT_MUTATION = graphql(`
  mutation SeedCreateBusinessContact($input: BusinessContactInput!) {
    createBusinessContact(input: $input) {
      id
      name
      address
      phone
      website
      notes
      workspaceId
    }
  }
`);

const SEED_CREATE_PERSON_CONTACT_MUTATION = graphql(`
  mutation SeedCreatePersonContact($input: PersonContactInput!) {
    createPersonContact(input: $input) {
      id
      name
      email
      phone
      role
      notes
      businessId
      workspaceId
    }
  }
`);

const SEED_CREATE_PROJECT_MUTATION = graphql(`
  mutation SeedCreateProject($input: ProjectInput!) {
    createProject(input: $input) {
      id
      name
      project_code
      description
      status
      scope_of_work
      workspaceId
      project_contacts {
        contact_id
        relation_to_project
      }
    }
  }
`);

const SEED_CREATE_PRICE_BOOK_MUTATION = graphql(`
  mutation SeedCreatePriceBook($input: CreatePriceBookInput!) {
    createPriceBook(input: $input) {
      id
      name
      location
      notes
      isDefault
      businessContactId
      projectId
      workspaceId
    }
  }
`);

const SEED_CREATE_SALES_ORDER_MUTATION = graphql(`
  mutation SeedCreateSalesOrder($input: SalesOrderInput!) {
    createSalesOrder(input: $input) {
      id
      purchase_order_number
      sales_order_number
      buyer_id
      project_id
      workspace_id
    }
  }
`);

const SEED_CREATE_PURCHASE_ORDER_MUTATION = graphql(`
  mutation SeedCreatePurchaseOrder($input: PurchaseOrderInput!) {
    createPurchaseOrder(input: $input) {
      id
      purchase_order_number
      seller_id
      project_id
      workspace_id
    }
  }
`);

const SEED_UPSERT_PIM_CATEGORY_MUTATION = graphql(`
  mutation SeedUpsertPimCategory($input: UpsertPimCategoryInput!) {
    upsertPimCategory(input: $input) {
      id
      name
      description
      path
      platform_id
    }
  }
`);

const SEED_CREATE_RENTAL_PRICE_MENUTAION = graphql(`
  mutation SeedCreateRentalPriceMenutation($input: CreateRentalPriceInput!) {
    createRentalPrice(input: $input) {
      id
      name
      pimCategoryId
      priceBookId
      pricePerDayInCents
      pricePerWeekInCents
      pricePerMonthInCents
    }
  }
`);

const SEED_CREATE_RENTAL_PURCHASE_ORDER_LINE_ITEM_MUTATION = graphql(`
  mutation SeedCreateRentalPurchaseOrderLineItem($input: CreateRentalPurchaseOrderLineItemInput!) {
    createRentalPurchaseOrderLineItem(input: $input) {
      id
      purchase_order_id
      price_id
      po_pim_id
      po_quantity
      lineitem_status
      off_rent_date
      delivery_method
      delivery_date
      delivery_location
      delivery_charge_in_cents
    }
  }
`);

const SEED_SUBMIT_PURCHASE_ORDER_MUTATION = graphql(`
  mutation SeedSubmitPurchaseOrder($id: ID!) {
    submitPurchaseOrder(id: $id) {
      id
      status
      purchase_order_number
    }
  }
`);

const SEED_CREATE_RENTAL_SALES_ORDER_LINE_ITEM_MUTATION = graphql(`
  mutation SeedCreateRentalSalesOrderLineItem($input: CreateRentalSalesOrderLineItemInput!) {
    createRentalSalesOrderLineItem(input: $input) {
      id
      sales_order_id
      price_id
      so_pim_id
      so_quantity
      lineitem_status
      off_rent_date
      delivery_method
      delivery_date
      delivery_location
      delivery_charge_in_cents
    }
  }
`);

const SEED_SUBMIT_SALES_ORDER_MUTATION = graphql(`
  mutation SeedSubmitSalesOrder($id: ID!) {
    submitSalesOrder(id: $id) {
      id
      status
      sales_order_number
    }
  }
`);

const SEED_CREATE_WORKFLOW_CONFIGURATION_MUTATION = graphql(`
  mutation SeedCreateWorkflowConfiguration($input: CreateWorkflowConfigurationInput!) {
    createWorkflowConfiguration(input: $input) {
      id
      name
      columns {
        id
        name
        colour
      }
    }
  }
`);

interface SeedStep {
  id: string;
  label: string;
  status: "pending" | "loading" | "completed" | "error";
  errorMessage?: string;
}

interface SeedDataComponentProps {
  variant?: "button" | "card";
}

export default function SeedDataComponent({ variant = "card" }: SeedDataComponentProps) {
  const { notifySuccess, notifyError } = useNotification();
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createdData, setCreatedData] = useState<{
    workspace?: any;
    business?: any;
    employee?: any;
    project?: any;
    priceBook?: any;
    salesOrder?: any;
    purchaseOrder?: any;
    pimCategory?: any;
    rentalPrice?: any;
    purchaseOrderLineItem?: any;
    salesOrderLineItem?: any;
    workflowConfiguration?: any;
  }>({});

  const [steps, setSteps] = useState<SeedStep[]>([
    { id: "workspace", label: "Create Workspace", status: "pending" },
    { id: "business", label: "Create Business Contact", status: "pending" },
    { id: "employee", label: "Create Employee Contact", status: "pending" },
    { id: "project", label: "Create Project", status: "pending" },
    { id: "priceBook", label: "Create Price Book", status: "pending" },
    { id: "salesOrder", label: "Create Sales Order", status: "pending" },
    { id: "purchaseOrder", label: "Create Purchase Order", status: "pending" },
    { id: "pimCategory", label: "Create Skid Steer PIM Category", status: "pending" },
    { id: "rentalPrice", label: "Create Skid Steer Rental Price", status: "pending" },
    { id: "poLineItem", label: "Add Rental Line Item to PO", status: "pending" },
    { id: "submitPO", label: "Submit Purchase Order", status: "pending" },
    { id: "soLineItem", label: "Add Rental Line Item to SO", status: "pending" },
    { id: "submitSO", label: "Submit Sales Order", status: "pending" },
    { id: "workflow", label: "Create Workflow Configuration", status: "pending" },
  ]);

  // Mutations
  const [createWorkspace] = useSeedCreateWorkspaceMutation();
  const [createBusinessContact] = useSeedCreateBusinessContactMutation();
  const [createPersonContact] = useSeedCreatePersonContactMutation();
  const [createProject] = useSeedCreateProjectMutation();
  const [createPriceBook] = useSeedCreatePriceBookMutation();
  const [createSalesOrder] = useSeedCreateSalesOrderMutation();
  const [createPurchaseOrder] = useSeedCreatePurchaseOrderMutation();
  const [upsertPimCategory] = useSeedUpsertPimCategoryMutation();
  const [createRentalPrice] = useSeedCreateRentalPriceMenutationMutation();
  const [createRentalPOLineItem] = useSeedCreateRentalPurchaseOrderLineItemMutation();
  const [submitPurchaseOrder] = useSeedSubmitPurchaseOrderMutation();
  const [createRentalSOLineItem] = useSeedCreateRentalSalesOrderLineItemMutation();
  const [submitSalesOrder] = useSeedSubmitSalesOrderMutation();
  const [createWorkflowConfiguration] = useSeedCreateWorkflowConfigurationMutation();

  const updateStepStatus = (stepId: string, status: SeedStep["status"], errorMessage?: string) => {
    setSteps((prev) =>
      prev.map((step) => (step.id === stepId ? { ...step, status, errorMessage } : step)),
    );
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const runSeedData = async () => {
    setIsRunning(true);
    setCreatedData({});

    // Reset all steps to pending
    setSteps((prev) =>
      prev.map((step) => ({ ...step, status: "pending", errorMessage: undefined })),
    );

    try {
      // Step 1: Create Workspace
      updateStepStatus("workspace", "loading");
      await delay(500);

      const workspaceResult = await createWorkspace({
        variables: {
          name: `Demo Workspace ${Date.now()}`,
          accessType: WorkspaceAccessType.SameDomain,
          description: "A demo workspace created by seed data script",
          archived: false,
        },
      });

      if (!workspaceResult.data?.createWorkspace) {
        throw new Error("Failed to create workspace");
      }

      const workspace = workspaceResult.data.createWorkspace;
      setCreatedData((prev) => ({ ...prev, workspace }));
      updateStepStatus("workspace", "completed");
      notifySuccess(`Workspace "${workspace.name}" created successfully`);

      // Step 2: Create Business Contact
      updateStepStatus("business", "loading");
      await delay(500);

      const businessResult = await createBusinessContact({
        variables: {
          input: {
            name: `Demo Construction Company ${Date.now()}`,
            workspaceId: workspace.id,
            address: "123 Main Street, Demo City, DC 12345",
            phone: "+1 (555) 123-4567",
            website: "https://demo-construction.com",
            notes: "Demo business contact created by seed data script",
          },
        },
      });

      if (!businessResult.data?.createBusinessContact) {
        throw new Error("Failed to create business contact");
      }

      const business = businessResult.data.createBusinessContact;
      setCreatedData((prev) => ({ ...prev, business }));
      updateStepStatus("business", "completed");
      notifySuccess(`Business "${business.name}" created successfully`);

      // Step 3: Create Employee Contact
      updateStepStatus("employee", "loading");
      await delay(500);

      const employeeResult = await createPersonContact({
        variables: {
          input: {
            name: "John Demo Manager",
            email: `john.demo.${Date.now()}@demo-construction.com`,
            businessId: business.id,
            workspaceId: workspace.id,
            phone: "+1 (555) 123-4568",
            role: "Project Manager",
            notes: "Demo employee contact created by seed data script",
          },
        },
      });

      if (!employeeResult.data?.createPersonContact) {
        throw new Error("Failed to create employee contact");
      }

      const employee = employeeResult.data.createPersonContact;
      setCreatedData((prev) => ({ ...prev, employee }));
      updateStepStatus("employee", "completed");
      notifySuccess(`Employee "${employee.name}" created successfully`);

      // Step 4: Create Project
      updateStepStatus("project", "loading");
      await delay(500);

      const projectResult = await createProject({
        variables: {
          input: {
            name: `Demo Construction Project ${Date.now()}`,
            project_code: `DEMO-${Date.now().toString().slice(-6)}`,
            description: "A demo construction project created by seed data script",
            workspaceId: workspace.id,
            deleted: false,
            status: ProjectStatusEnum.ActiveConstruction,
            scope_of_work: [
              ScopeOfWorkEnum.SiteCivil,
              ScopeOfWorkEnum.Foundations,
              ScopeOfWorkEnum.StructuralFrame,
            ],
            project_contacts: [
              {
                contact_id: employee.id,
                relation_to_project: ProjectContactRelationEnum.ProjectManagerGc,
              },
            ],
          },
        },
      });

      if (!projectResult.data?.createProject) {
        throw new Error("Failed to create project");
      }

      const project = projectResult.data.createProject;
      setCreatedData((prev) => ({ ...prev, project }));
      updateStepStatus("project", "completed");
      notifySuccess(`Project "${project.name}" created successfully`);

      // Step 5: Create Price Book
      updateStepStatus("priceBook", "loading");
      await delay(500);

      const priceBookResult = await createPriceBook({
        variables: {
          input: {
            name: `Demo Price Book ${Date.now()}`,
            workspaceId: workspace.id,
            businessContactId: business.id,
            projectId: project.id,
            location: "Demo City, DC",
            notes: "Demo price book created by seed data script",
            isDefault: true,
          },
        },
      });

      if (!priceBookResult.data?.createPriceBook) {
        throw new Error("Failed to create price book");
      }

      const priceBook = priceBookResult.data.createPriceBook;
      setCreatedData((prev) => ({ ...prev, priceBook }));
      updateStepStatus("priceBook", "completed");
      notifySuccess(`Price Book "${priceBook.name}" created successfully`);

      // Step 6: Create Sales Order
      updateStepStatus("salesOrder", "loading");
      await delay(500);

      const salesOrderResult = await createSalesOrder({
        variables: {
          input: {
            buyer_id: business.id,
            project_id: project.id,
            purchase_order_number: `PO-${Date.now().toString().slice(-6)}`,
            sales_order_number: `SO-${Date.now().toString().slice(-6)}`,
            workspace_id: workspace.id,
          },
        },
      });

      if (!salesOrderResult.data?.createSalesOrder) {
        throw new Error("Failed to create sales order");
      }

      const salesOrder = salesOrderResult.data.createSalesOrder;
      setCreatedData((prev) => ({ ...prev, salesOrder }));
      updateStepStatus("salesOrder", "completed");
      notifySuccess(`Sales Order "${salesOrder.purchase_order_number}" created successfully`);

      // Step 7: Create Purchase Order
      updateStepStatus("purchaseOrder", "loading");
      await delay(500);

      const purchaseOrderResult = await createPurchaseOrder({
        variables: {
          input: {
            seller_id: business.id,
            project_id: project.id,
            purchase_order_number: `PO-${Date.now().toString().slice(-6)}`,
            workspace_id: workspace.id,
          },
        },
      });

      if (!purchaseOrderResult.data?.createPurchaseOrder) {
        throw new Error("Failed to create purchase order");
      }

      const purchaseOrder = purchaseOrderResult.data.createPurchaseOrder;
      setCreatedData((prev) => ({ ...prev, purchaseOrder }));
      updateStepStatus("purchaseOrder", "completed");
      notifySuccess(`Purchase Order "${purchaseOrder.purchase_order_number}" created successfully`);

      // Step 8: Create Skid Steer PIM Category
      updateStepStatus("pimCategory", "loading");
      await delay(500);

      const timestamp = Date.now();
      const pimCategoryResult = await upsertPimCategory({
        variables: {
          input: {
            id: `demo-skid-steer-${timestamp}`,
            name: "Skid Steer Loaders",
            description: "Demo skid steer loader category for seed data",
            path: "|Categories|Equipment|Skid Steers|",
            platform_id: `demo-platform-skid-${timestamp}`,
            has_products: false,
          },
        },
      });

      if (!pimCategoryResult.data?.upsertPimCategory) {
        throw new Error("Failed to create skid steer PIM category");
      }

      const pimCategory = pimCategoryResult.data.upsertPimCategory;
      setCreatedData((prev) => ({ ...prev, pimCategory }));
      updateStepStatus("pimCategory", "completed");
      notifySuccess(`PIM Category "${pimCategory.name}" created successfully`);

      // Step 9: Create Skid Steer Rental Price
      updateStepStatus("rentalPrice", "loading");
      await delay(500);

      const rentalPriceResult = await createRentalPrice({
        variables: {
          input: {
            name: "Skid Steer Loader Rental",
            pimCategoryId: pimCategory.id,
            priceBookId: priceBook.id,
            pricePerDayInCents: 25000, // $250/day
            pricePerWeekInCents: 150000, // $1500/week
            pricePerMonthInCents: 500000, // $5000/month
            workspaceId: workspace.id,
          },
        },
      });

      if (!rentalPriceResult.data?.createRentalPrice) {
        throw new Error("Failed to create skid steer rental price");
      }

      const rentalPrice = rentalPriceResult.data.createRentalPrice;
      setCreatedData((prev) => ({ ...prev, rentalPrice }));
      updateStepStatus("rentalPrice", "completed");
      notifySuccess(`Rental Price "${rentalPrice.name}" created successfully`);

      // Step 10: Add Rental Line Item to Purchase Order
      updateStepStatus("poLineItem", "loading");
      await delay(500);

      // Calculate dates: delivery in 2 days, return in 14 days
      const deliveryDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      const offRentDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

      const poLineItemResult = await createRentalPOLineItem({
        variables: {
          input: {
            purchase_order_id: purchaseOrder.id,
            price_id: rentalPrice.id,
            po_pim_id: pimCategory.id,
            po_quantity: 2,
            lineitem_status: PoLineItemStatus.Confirmed,
            off_rent_date: offRentDate.toISOString(),
            delivery_method: DeliveryMethod.Delivery,
            delivery_date: deliveryDate.toISOString(),
            delivery_location: "Demo Construction Site",
            delivery_charge_in_cents: 7500, // $75 delivery
            deliveryNotes: "Demo skid steer rental line item created by seed data script",
          },
        },
      });

      if (!poLineItemResult.data?.createRentalPurchaseOrderLineItem) {
        throw new Error("Failed to create purchase order line item");
      }

      const purchaseOrderLineItem = poLineItemResult.data.createRentalPurchaseOrderLineItem;
      setCreatedData((prev) => ({ ...prev, purchaseOrderLineItem }));
      updateStepStatus("poLineItem", "completed");
      notifySuccess(`Skid steer rental line item added to Purchase Order successfully`);

      // Step 11: Submit Purchase Order
      updateStepStatus("submitPO", "loading");
      await delay(500);

      const submitPOResult = await submitPurchaseOrder({
        variables: {
          id: purchaseOrder.id,
        },
      });

      if (!submitPOResult.data?.submitPurchaseOrder) {
        throw new Error("Failed to submit purchase order");
      }

      const submittedPO = submitPOResult.data.submitPurchaseOrder;
      // Update the purchaseOrder in createdData with the submitted version
      setCreatedData((prev) => ({ ...prev, purchaseOrder: submittedPO }));
      updateStepStatus("submitPO", "completed");
      notifySuccess(`Purchase Order "${submittedPO.purchase_order_number}" submitted successfully`);

      // Step 12: Add Rental Line Item to Sales Order
      updateStepStatus("soLineItem", "loading");
      await delay(500);

      // Calculate dates: delivery in 2 days, return in 14 days (same as PO)
      const soDeliveryDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      const soOffRentDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

      const soLineItemResult = await createRentalSOLineItem({
        variables: {
          input: {
            sales_order_id: salesOrder.id,
            price_id: rentalPrice.id,
            so_pim_id: pimCategory.id,
            so_quantity: 1,
            lineitem_status: LineItemStatus.Confirmed,
            off_rent_date: soOffRentDate.toISOString(),
            delivery_method: DeliveryMethod.Delivery,
            delivery_date: soDeliveryDate.toISOString(),
            delivery_location: "Demo Construction Site",
            delivery_charge_in_cents: 7500, // $75 delivery
            deliveryNotes: "Demo skid steer rental line item created by seed data script",
          },
        },
      });

      if (!soLineItemResult.data?.createRentalSalesOrderLineItem) {
        throw new Error("Failed to create sales order line item");
      }

      const salesOrderLineItem = soLineItemResult.data.createRentalSalesOrderLineItem;
      setCreatedData((prev) => ({ ...prev, salesOrderLineItem }));
      updateStepStatus("soLineItem", "completed");
      notifySuccess(`Rental line item added to Sales Order successfully`);

      // Step 15: Submit Sales Order
      updateStepStatus("submitSO", "loading");
      await delay(500);

      const submitSOResult = await submitSalesOrder({
        variables: {
          id: salesOrder.id,
        },
      });

      if (!submitSOResult.data?.submitSalesOrder) {
        throw new Error("Failed to submit sales order");
      }

      const submittedSO = submitSOResult.data.submitSalesOrder;
      // Update the salesOrder in createdData with the submitted version
      setCreatedData((prev) => ({ ...prev, salesOrder: submittedSO }));
      updateStepStatus("submitSO", "completed");
      notifySuccess(`Sales Order "${submittedSO.sales_order_number}" submitted successfully`);

      // Step 14: Create Workflow Configuration
      updateStepStatus("workflow", "loading");
      await delay(500);

      const workflowResult = await createWorkflowConfiguration({
        variables: {
          input: {
            name: "Equipment Rental Workflow",
            columns: [
              {
                id: "backlog",
                name: "Backlog",
                colour: "#6B7280",
              },
              {
                id: "scheduled",
                name: "Scheduled",
                colour: "#3B82F6",
              },
              {
                id: "in-progress",
                name: "In Progress",
                colour: "#F59E0B",
              },
              {
                id: "delivered",
                name: "Delivered",
                colour: "#10B981",
              },
              {
                id: "returned",
                name: "Returned",
                colour: "#8B5CF6",
              },
            ],
          },
        },
      });

      if (!workflowResult.data?.createWorkflowConfiguration) {
        throw new Error("Failed to create workflow configuration");
      }

      const workflowConfiguration = workflowResult.data.createWorkflowConfiguration;
      setCreatedData((prev) => ({ ...prev, workflowConfiguration }));
      updateStepStatus("workflow", "completed");
      notifySuccess(`Workflow Configuration "${workflowConfiguration.name}" created successfully`);

      notifySuccess("All seed data created successfully! Redirecting to workspace...");

      // Show redirecting state and redirect to the newly created workspace after a short delay
      setIsRedirecting(true);
      setTimeout(() => {
        router.push(`/app/${workspace.id}`);
      }, 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // Find the current loading step and mark it as error
      const currentStep = steps.find((step) => step.status === "loading");
      if (currentStep) {
        updateStepStatus(currentStep.id, "error", errorMessage);
      }

      notifyError(`Seed data creation failed: ${errorMessage}`);
      console.error("Seed data creation error:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStepIcon = (step: SeedStep) => {
    switch (step.status) {
      case "loading":
        return <CircularProgress size={20} />;
      case "completed":
        return <CheckCircle color="success" />;
      case "error":
        return <ErrorIcon color="error" />;
      default:
        return <RadioButtonUnchecked color="disabled" />;
    }
  };

  const getStepColor = (step: SeedStep) => {
    switch (step.status) {
      case "completed":
        return "success.main";
      case "error":
        return "error.main";
      case "loading":
        return "primary.main";
      default:
        return "text.disabled";
    }
  };

  const handleClose = () => {
    if (!isRunning && !isRedirecting) {
      setDialogOpen(false);
      // Reset state when closing
      setSteps((prev) =>
        prev.map((step) => ({ ...step, status: "pending", errorMessage: undefined })),
      );
      setCreatedData({});
      setIsRedirecting(false);
    }
  };

  if (variant === "button") {
    return (
      <>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Science />}
          onClick={() => setDialogOpen(true)}
          sx={{
            borderColor: "warning.main",
            color: "warning.main",
            "&:hover": {
              borderColor: "warning.dark",
              bgcolor: "warning.light",
              color: "warning.dark",
            },
          }}
        >
          Generate Seed Data
        </Button>

        <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Science color="warning" />
              <Typography variant="h6">Seed Data Generator</Typography>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ position: "relative" }}>
            {/* Redirecting Overlay */}
            {isRedirecting && (
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1000,
                  gap: 2,
                }}
              >
                <CircularProgress size={48} color="primary" />
                <Typography variant="h6" color="primary">
                  Redirecting to new workspace...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Please wait while we take you to your new workspace
                </Typography>
              </Box>
            )}

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              This will create sample data including a workspace, business contact, employee,
              project, price book, sales order, and purchase order.
            </Typography>

            <List>
              {steps.map((step) => (
                <ListItem key={step.id} sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>{getStepIcon(step)}</ListItemIcon>
                  <ListItemText
                    primary={step.label}
                    secondary={step.errorMessage}
                    sx={{
                      "& .MuiListItemText-primary": {
                        color: getStepColor(step),
                        fontWeight: step.status === "completed" ? 600 : 400,
                      },
                      "& .MuiListItemText-secondary": {
                        color: "error.main",
                      },
                    }}
                  />
                </ListItem>
              ))}
            </List>

            {Object.keys(createdData).length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Created Resources:
                </Typography>
                {createdData.workspace && (
                  <Alert severity="info" sx={{ mb: 1 }}>
                    <strong>Workspace:</strong> {createdData.workspace.name} (ID:{" "}
                    {createdData.workspace.id})
                  </Alert>
                )}
                {createdData.business && (
                  <Alert severity="info" sx={{ mb: 1 }}>
                    <strong>Business:</strong> {createdData.business.name} (ID:{" "}
                    {createdData.business.id})
                  </Alert>
                )}
                {createdData.employee && (
                  <Alert severity="info" sx={{ mb: 1 }}>
                    <strong>Employee:</strong> {createdData.employee.name} (ID:{" "}
                    {createdData.employee.id})
                  </Alert>
                )}
                {createdData.project && (
                  <Alert severity="info" sx={{ mb: 1 }}>
                    <strong>Project:</strong> {createdData.project.name} (ID:{" "}
                    {createdData.project.id})
                  </Alert>
                )}
                {createdData.priceBook && (
                  <Alert severity="info" sx={{ mb: 1 }}>
                    <strong>Price Book:</strong> {createdData.priceBook.name} (ID:{" "}
                    {createdData.priceBook.id})
                  </Alert>
                )}
                {createdData.salesOrder && (
                  <Alert severity="info" sx={{ mb: 1 }}>
                    <strong>Sales Order:</strong> {createdData.salesOrder.purchase_order_number}{" "}
                    (ID: {createdData.salesOrder.id})
                  </Alert>
                )}
                {createdData.purchaseOrder && (
                  <Alert severity="info" sx={{ mb: 1 }}>
                    <strong>Purchase Order:</strong>{" "}
                    {createdData.purchaseOrder.purchase_order_number} (ID:{" "}
                    {createdData.purchaseOrder.id})
                    {createdData.purchaseOrder.status && (
                      <span> - Status: {createdData.purchaseOrder.status}</span>
                    )}
                  </Alert>
                )}
                {createdData.pimCategory && (
                  <Alert severity="info" sx={{ mb: 1 }}>
                    <strong>Skid Steer PIM Category:</strong> {createdData.pimCategory.name} (ID:{" "}
                    {createdData.pimCategory.id})
                  </Alert>
                )}
                {createdData.rentalPrice && (
                  <Alert severity="info" sx={{ mb: 1 }}>
                    <strong>Skid Steer Rental Price:</strong> {createdData.rentalPrice.name} (ID:{" "}
                    {createdData.rentalPrice.id})
                  </Alert>
                )}
                {createdData.purchaseOrderLineItem && (
                  <Alert severity="info" sx={{ mb: 1 }}>
                    <strong>PO Line Item:</strong> Skid steer rental item added (ID:{" "}
                    {createdData.purchaseOrderLineItem.id})
                  </Alert>
                )}
                {createdData.salesOrderLineItem && (
                  <Alert severity="info" sx={{ mb: 1 }}>
                    <strong>SO Line Item:</strong> Skid steer rental item added (ID:{" "}
                    {createdData.salesOrderLineItem.id})
                  </Alert>
                )}
                {createdData.workflowConfiguration && (
                  <Alert severity="info" sx={{ mb: 1 }}>
                    <strong>Workflow:</strong> {createdData.workflowConfiguration.name} (ID:{" "}
                    {createdData.workflowConfiguration.id})
                  </Alert>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} disabled={isRunning}>
              Close
            </Button>
            {createdData.workspace && !isRunning && (
              <Button
                variant="outlined"
                onClick={() => router.push(`/app/${createdData.workspace.id}`)}
                color="primary"
              >
                Go to Workspace
              </Button>
            )}
            <Button variant="contained" onClick={runSeedData} disabled={isRunning} color="warning">
              {isRunning ? "Creating..." : "Create Seed Data"}
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  // Original card variant for backward compatibility
  return (
    <Box sx={{ maxWidth: 600, mx: "auto", mt: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Seed Data Generator
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        This will create sample data including a workspace, business contact, employee, project,
        price book, sales order, and purchase order.
      </Typography>

      <Button
        variant="contained"
        onClick={runSeedData}
        disabled={isRunning}
        fullWidth
        sx={{ mb: 3 }}
        size="large"
      >
        {isRunning ? "Creating Seed Data..." : "Create Seed Data"}
      </Button>

      <List>
        {steps.map((step) => (
          <ListItem key={step.id} sx={{ px: 0 }}>
            <ListItemIcon sx={{ minWidth: 40 }}>{getStepIcon(step)}</ListItemIcon>
            <ListItemText
              primary={step.label}
              secondary={step.errorMessage}
              sx={{
                "& .MuiListItemText-primary": {
                  color: getStepColor(step),
                  fontWeight: step.status === "completed" ? 600 : 400,
                },
                "& .MuiListItemText-secondary": {
                  color: "error.main",
                },
              }}
            />
          </ListItem>
        ))}
      </List>

      {Object.keys(createdData).length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Created Resources:
          </Typography>
          {createdData.workspace && (
            <Alert severity="info" sx={{ mb: 1 }}>
              <strong>Workspace:</strong> {createdData.workspace.name} (ID:{" "}
              {createdData.workspace.id})
            </Alert>
          )}
          {createdData.business && (
            <Alert severity="info" sx={{ mb: 1 }}>
              <strong>Business:</strong> {createdData.business.name} (ID: {createdData.business.id})
            </Alert>
          )}
          {createdData.employee && (
            <Alert severity="info" sx={{ mb: 1 }}>
              <strong>Employee:</strong> {createdData.employee.name} (ID: {createdData.employee.id})
            </Alert>
          )}
          {createdData.project && (
            <Alert severity="info" sx={{ mb: 1 }}>
              <strong>Project:</strong> {createdData.project.name} (ID: {createdData.project.id})
            </Alert>
          )}
          {createdData.priceBook && (
            <Alert severity="info" sx={{ mb: 1 }}>
              <strong>Price Book:</strong> {createdData.priceBook.name} (ID:{" "}
              {createdData.priceBook.id})
            </Alert>
          )}
          {createdData.salesOrder && (
            <Alert severity="info" sx={{ mb: 1 }}>
              <strong>Sales Order:</strong> {createdData.salesOrder.purchase_order_number} (ID:{" "}
              {createdData.salesOrder.id})
              {createdData.salesOrder.status && (
                <span> - Status: {createdData.salesOrder.status}</span>
              )}
            </Alert>
          )}
          {createdData.salesOrder && (
            <Alert severity="info" sx={{ mb: 1 }}>
              <strong>Sales Order:</strong> {createdData.salesOrder.purchase_order_number} (ID:{" "}
              {createdData.salesOrder.id})
              {createdData.salesOrder.status && (
                <span> - Status: {createdData.salesOrder.status}</span>
              )}
            </Alert>
          )}
          {createdData.purchaseOrder && (
            <Alert severity="info" sx={{ mb: 1 }}>
              <strong>Purchase Order:</strong> {createdData.purchaseOrder.purchase_order_number}{" "}
              (ID: {createdData.purchaseOrder.id})
              {createdData.purchaseOrder.status && (
                <span> - Status: {createdData.purchaseOrder.status}</span>
              )}
            </Alert>
          )}
          {createdData.pimCategory && (
            <Alert severity="info" sx={{ mb: 1 }}>
              <strong>Skid Steer PIM Category:</strong> {createdData.pimCategory.name} (ID:{" "}
              {createdData.pimCategory.id})
            </Alert>
          )}
          {createdData.rentalPrice && (
            <Alert severity="info" sx={{ mb: 1 }}>
              <strong>Skid Steer Rental Price:</strong> {createdData.rentalPrice.name} (ID:{" "}
              {createdData.rentalPrice.id})
            </Alert>
          )}
          {createdData.purchaseOrderLineItem && (
            <Alert severity="info" sx={{ mb: 1 }}>
              <strong>PO Line Item:</strong> Skid steer rental item added (ID:{" "}
              {createdData.purchaseOrderLineItem.id})
            </Alert>
          )}
          {createdData.salesOrderLineItem && (
            <Alert severity="info" sx={{ mb: 1 }}>
              <strong>SO Line Item:</strong> Skid steer rental item added (ID:{" "}
              {createdData.salesOrderLineItem.id})
            </Alert>
          )}
          {createdData.workflowConfiguration && (
            <Alert severity="info" sx={{ mb: 1 }}>
              <strong>Workflow:</strong> {createdData.workflowConfiguration.name} (ID:{" "}
              {createdData.workflowConfiguration.id})
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
}
