import { graphql } from "@/graphql";
import {
  AgentCreateBusinessContactDocument,
  AgentCreateBusinessContactMutation,
  AgentCreateBusinessContactMutationVariables,
  AgentCreatePersonContactDocument,
  AgentCreatePersonContactMutation,
  AgentCreatePersonContactMutationVariables,
  AgentCreatePriceBookDocument,
  AgentCreatePriceBookMutation,
  AgentCreatePriceBookMutationVariables,
  AgentCreateProjectDocument,
  AgentCreateProjectMutation,
  AgentCreateProjectMutationVariables,
  AgentCreateRentalPriceDocument,
  AgentCreateRentalPriceMutation,
  AgentCreateRentalPriceMutationVariables,
  AgentCreateSalePriceDocument,
  AgentCreateSalePriceMutation,
  AgentCreateSalePriceMutationVariables,
  AgentDeletePriceBookDocument,
  AgentDeletePriceBookMutation,
  AgentDeletePriceBookMutationVariables,
  AgentDeletePriceDocument,
  AgentDeletePriceMutation,
  AgentDeletePriceMutationVariables,
  AgentListContactsDocument,
  AgentListContactsQuery,
  AgentListContactsQueryVariables,
  AgentListPriceBooksDocument,
  AgentListPriceBooksQuery,
  AgentListPriceBooksQueryVariables,
  AgentListPricesDocument,
  AgentListPricesQuery,
  AgentListPricesQueryVariables,
  AgentListProjectsDocument,
  AgentListProjectsQuery,
  AgentListProjectsQueryVariables,
  AgentSearchPimCategoriesDocument,
  AgentSearchPimCategoriesQuery,
  AgentSearchPimCategoriesQueryVariables,
  AgentSearchPimProductsDocument,
  AgentSearchPimProductsQuery,
  AgentSearchPimProductsQueryVariables,
  AgentUpdateBusinessContactDocument,
  AgentUpdateBusinessContactMutation,
  AgentUpdateBusinessContactMutationVariables,
  AgentUpdatePersonContactDocument,
  AgentUpdatePersonContactMutation,
  AgentUpdatePersonContactMutationVariables,
  AgentUpdatePriceBookDocument,
  AgentUpdatePriceBookMutation,
  AgentUpdatePriceBookMutationVariables,
  AgentUpdateProjectDocument,
  AgentUpdateProjectMutation,
  AgentUpdateProjectMutationVariables,
  AgentUpdateRentalPriceDocument,
  AgentUpdateRentalPriceMutation,
  AgentUpdateRentalPriceMutationVariables,
  AgentUpdateSalePriceDocument,
  AgentUpdateSalePriceMutation,
  AgentUpdateSalePriceMutationVariables,
  ContactType,
  ProjectStatusEnum,
  ScopeOfWorkEnum,
} from "@/graphql/hooks";
import { ApolloClient, NormalizedCacheObject } from "@apollo/client";

// ============================================================================
// GraphQL Queries and Mutations
// ============================================================================

/**
 * GraphQL query for listing projects
 */
graphql(`
  query AgentListProjects($workspaceId: String!) {
    listProjects(workspaceId: $workspaceId) {
      id
      name
      project_code
      status
      description
      created_at
      updated_at
    }
  }
`);

/**
 * GraphQL mutation for creating a project
 */
graphql(`
  mutation AgentCreateProject($input: ProjectInput!) {
    createProject(input: $input) {
      id
      name
      project_code
      status
      description
      scope_of_work
      created_at
    }
  }
`);

/**
 * GraphQL mutation for updating a project
 */
graphql(`
  mutation AgentUpdateProject($id: String, $input: ProjectInput!) {
    updateProject(id: $id, input: $input) {
      id
      name
      project_code
      status
      description
      scope_of_work
      updated_at
    }
  }
`);

/**
 * GraphQL query for listing contacts
 */
graphql(`
  query AgentListContacts($filter: ListContactsFilter!, $page: ListContactsPage) {
    listContacts(filter: $filter, page: $page) {
      items {
        ... on BusinessContact {
          id
          name
          contactType
          address
          phone
          website
          taxId
          notes
        }
        ... on PersonContact {
          id
          name
          contactType
          email
          phone
          role
          notes
          business {
            id
            name
          }
        }
      }
    }
  }
`);

/**
 * GraphQL mutation for creating a business contact
 */
graphql(`
  mutation AgentCreateBusinessContact($input: BusinessContactInput!) {
    createBusinessContact(input: $input) {
      id
      name
      address
      phone
      website
      taxId
      notes
    }
  }
`);

/**
 * GraphQL mutation for creating a person contact
 */
graphql(`
  mutation AgentCreatePersonContact($input: PersonContactInput!) {
    createPersonContact(input: $input) {
      id
      name
      email
      phone
      role
      notes
      business {
        id
        name
      }
    }
  }
`);

/**
 * GraphQL mutation for updating a business contact
 */
graphql(`
  mutation AgentUpdateBusinessContact($id: ID!, $input: UpdateBusinessContactInput!) {
    updateBusinessContact(id: $id, input: $input) {
      id
      name
      address
      phone
      website
      taxId
      notes
    }
  }
`);

/**
 * GraphQL mutation for updating a person contact
 */
graphql(`
  mutation AgentUpdatePersonContact($id: ID!, $input: UpdatePersonContactInput!) {
    updatePersonContact(id: $id, input: $input) {
      id
      name
      email
      phone
      role
      notes
    }
  }
`);

// ============================================================================
// Price Book GraphQL Queries and Mutations
// ============================================================================

/**
 * GraphQL query for listing price books
 */
graphql(`
  query AgentListPriceBooks($filter: ListPriceBooksFilter!, $page: ListPriceBooksPage!) {
    listPriceBooks(filter: $filter, page: $page) {
      items {
        id
        name
        location
        notes
        parentPriceBookId
        parentPriceBookPercentageFactor
      }
    }
  }
`);

/**
 * GraphQL query for getting a single price book
 */
graphql(`
  query AgentGetPriceBook($id: ID!) {
    getPriceBookById(id: $id) {
      id
      name
      location
      notes
      parentPriceBookId
      parentPriceBookPercentageFactor
    }
  }
`);

/**
 * GraphQL mutation for creating a price book
 */
graphql(`
  mutation AgentCreatePriceBook($input: CreatePriceBookInput!) {
    createPriceBook(input: $input) {
      id
      name
      location
      notes
      parentPriceBookId
      parentPriceBookPercentageFactor
    }
  }
`);

/**
 * GraphQL mutation for updating a price book
 */
graphql(`
  mutation AgentUpdatePriceBook($input: UpdatePriceBookInput!) {
    updatePriceBook(input: $input) {
      id
      name
      location
      notes
      parentPriceBookId
      parentPriceBookPercentageFactor
    }
  }
`);

/**
 * GraphQL mutation for deleting a price book
 */
graphql(`
  mutation AgentDeletePriceBook($id: ID!) {
    deletePriceBookById(id: $id)
  }
`);

// ============================================================================
// Price GraphQL Queries and Mutations
// ============================================================================

/**
 * GraphQL query for listing prices
 */
graphql(`
  query AgentListPrices($filter: ListPricesFilter!, $page: ListPricesPage!) {
    listPrices(filter: $filter, page: $page) {
      items {
        __typename
        ... on RentalPrice {
          id
          name
          priceType
          pricePerDayInCents
          pricePerWeekInCents
          pricePerMonthInCents
          pimCategoryName
          priceBook {
            id
            name
          }
        }
        ... on SalePrice {
          id
          name
          priceType
          unitCostInCents
          pimCategoryName
          priceBook {
            id
            name
          }
        }
      }
    }
  }
`);

/**
 * GraphQL mutation for creating a rental price
 */
graphql(`
  mutation AgentCreateRentalPrice($input: CreateRentalPriceInput!) {
    createRentalPrice(input: $input) {
      id
      name
      priceType
      pricePerDayInCents
      pricePerWeekInCents
      pricePerMonthInCents
    }
  }
`);

/**
 * GraphQL mutation for creating a sale price
 */
graphql(`
  mutation AgentCreateSalePrice($input: CreateSalePriceInput!) {
    createSalePrice(input: $input) {
      id
      name
      priceType
      unitCostInCents
    }
  }
`);

/**
 * GraphQL mutation for updating a rental price
 */
graphql(`
  mutation AgentUpdateRentalPrice($input: UpdateRentalPriceInput!) {
    updateRentalPrice(input: $input) {
      id
      name
      priceType
      pricePerDayInCents
      pricePerWeekInCents
      pricePerMonthInCents
    }
  }
`);

/**
 * GraphQL mutation for updating a sale price
 */
graphql(`
  mutation AgentUpdateSalePrice($input: UpdateSalePriceInput!) {
    updateSalePrice(input: $input) {
      id
      name
      priceType
      unitCostInCents
    }
  }
`);

/**
 * GraphQL mutation for deleting a price
 */
graphql(`
  mutation AgentDeletePrice($id: ID!) {
    deletePriceById(id: $id)
  }
`);

// ============================================================================
// PIM GraphQL Queries
// ============================================================================

/**
 * GraphQL query for searching PIM categories
 */
graphql(`
  query AgentSearchPimCategories($filter: ListPimCategoriesFilter, $page: ListPimCategoriesPage) {
    listPimCategories(filter: $filter, page: $page) {
      items {
        id
        name
        path
        description
        childrenCount
        productCount
        platform_id
      }
      page {
        number
        size
        totalItems
        totalPages
      }
    }
  }
`);

/**
 * GraphQL query for searching PIM products
 */
graphql(`
  query AgentSearchPimProducts($filter: ListPimProductsFilter, $page: ListPimProductsPage) {
    listPimProducts(filter: $filter, page: $page) {
      items {
        id
        name
        make
        model
        year
        sku
        upc
        pim_category_id
        pim_category_path
        pim_category_platform_id
      }
      page {
        number
        size
        totalItems
        totalPages
      }
    }
  }
`);

// ============================================================================
// Constants
// ============================================================================

/**
 * Status options for projects
 */
const PROJECT_STATUS_VALUES = [
  "CONCEPT_OPPORTUNITY",
  "BIDDING_TENDERING",
  "PRE_CONSTRUCTION",
  "MOBILIZATION",
  "ACTIVE_CONSTRUCTION",
  "SUBSTANTIAL_COMPLETION",
  "CLOSE_OUT",
  "WARRANTY_MAINTENANCE",
  "ARCHIVED_CLOSED",
];

/**
 * Scope of work options for projects
 */
const SCOPE_OF_WORK_VALUES = [
  "SITE_CIVIL",
  "FOUNDATIONS",
  "STRUCTURAL_FRAME",
  "BUILDING_ENVELOPE",
  "INTERIOR_BUILD_OUT",
  "MEP",
  "SPECIALTY_SYSTEMS",
  "COMMISSIONING_STARTUP",
  "DEMOBILIZATION_CLOSE_OUT",
  "WARRANTY_SERVICES",
];

/**
 * Contact type options
 */
const CONTACT_TYPE_VALUES = ["BUSINESS", "PERSON"];

// ============================================================================
// Tool Definitions
// ============================================================================

/**
 * OpenAI tool definitions
 * These describe the functions available to the AI agent
 *
 * Note: Workspace context is automatically injected by the frontend
 * when executing tools - the LLM should be unaware of workspace scoping
 */
export const AGENT_TOOLS = [
  // -------------------------------------------------------------------------
  // Project Tools
  // -------------------------------------------------------------------------
  {
    type: "function" as const,
    function: {
      name: "list_projects",
      description:
        "Get all projects in the current workspace. Use this when the user asks about projects, wants to see what projects exist, or needs project information.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_project",
      description:
        "Create a new project in the workspace. Use this when the user wants to create, add, or start a new project.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The name of the project",
          },
          project_code: {
            type: "string",
            description: "A unique code/identifier for the project (e.g., 'PRJ-001')",
          },
          description: {
            type: "string",
            description: "A description of the project",
          },
          status: {
            type: "string",
            enum: PROJECT_STATUS_VALUES,
            description: "The current status of the project",
          },
          scope_of_work: {
            type: "array",
            items: {
              type: "string",
              enum: SCOPE_OF_WORK_VALUES,
            },
            description: "The scope of work categories for this project",
          },
        },
        required: ["name", "project_code"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "update_project",
      description:
        "Update an existing project. Use this when the user wants to edit, modify, change, or update a project's details.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The ID of the project to update. Get this from list_projects first.",
          },
          name: {
            type: "string",
            description: "The new name for the project",
          },
          project_code: {
            type: "string",
            description: "The new project code",
          },
          description: {
            type: "string",
            description: "The new description for the project",
          },
          status: {
            type: "string",
            enum: PROJECT_STATUS_VALUES,
            description: "The new status for the project",
          },
          scope_of_work: {
            type: "array",
            items: {
              type: "string",
              enum: SCOPE_OF_WORK_VALUES,
            },
            description: "The new scope of work categories",
          },
        },
        required: ["id"],
      },
    },
  },

  // -------------------------------------------------------------------------
  // Contact Tools
  // -------------------------------------------------------------------------
  {
    type: "function" as const,
    function: {
      name: "list_contacts",
      description:
        "Get all contacts in the workspace. Contacts can be businesses (companies/organizations) or people (individuals). Use this when the user asks about contacts, customers, clients, vendors, or people.",
      parameters: {
        type: "object",
        properties: {
          contact_type: {
            type: "string",
            enum: CONTACT_TYPE_VALUES,
            description:
              "Filter by contact type: BUSINESS for companies/organizations, PERSON for individuals. Leave empty to get all contacts.",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_business_contact",
      description:
        "Create a new business/company contact. Use this when the user wants to add a company, organization, vendor, or client.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The business/company name",
          },
          address: {
            type: "string",
            description: "The business address",
          },
          phone: {
            type: "string",
            description: "The business phone number",
          },
          website: {
            type: "string",
            description: "The business website URL",
          },
          taxId: {
            type: "string",
            description: "The business tax ID / EIN",
          },
          notes: {
            type: "string",
            description: "Additional notes about the business",
          },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_person_contact",
      description:
        "Create a new person/individual contact. A person must be associated with a business. Use this when the user wants to add a person, employee, or individual contact.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The person's full name",
          },
          email: {
            type: "string",
            description: "The person's email address",
          },
          role: {
            type: "string",
            description: "The person's role/job title (e.g., 'Project Manager', 'Sales Rep')",
          },
          business_id: {
            type: "string",
            description:
              "The ID of the business this person belongs to. Get this from list_contacts first.",
          },
          phone: {
            type: "string",
            description: "The person's phone number",
          },
          notes: {
            type: "string",
            description: "Additional notes about the person",
          },
        },
        required: ["name", "email", "role", "business_id"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "update_business_contact",
      description:
        "Update an existing business/company contact. Use this when the user wants to edit or modify a company's details.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description:
              "The ID of the business contact to update. Get this from list_contacts first.",
          },
          name: {
            type: "string",
            description: "The new business name",
          },
          address: {
            type: "string",
            description: "The new business address",
          },
          phone: {
            type: "string",
            description: "The new phone number",
          },
          website: {
            type: "string",
            description: "The new website URL",
          },
          taxId: {
            type: "string",
            description: "The new tax ID",
          },
          notes: {
            type: "string",
            description: "Updated notes",
          },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "update_person_contact",
      description:
        "Update an existing person contact. Use this when the user wants to edit or modify a person's details.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description:
              "The ID of the person contact to update. Get this from list_contacts first.",
          },
          name: {
            type: "string",
            description: "The new name",
          },
          email: {
            type: "string",
            description: "The new email address",
          },
          role: {
            type: "string",
            description: "The new role/job title",
          },
          phone: {
            type: "string",
            description: "The new phone number",
          },
          notes: {
            type: "string",
            description: "Updated notes",
          },
          business_id: {
            type: "string",
            description: "The ID of the new business to associate with",
          },
        },
        required: ["id"],
      },
    },
  },

  // -------------------------------------------------------------------------
  // Price Book Tools
  // -------------------------------------------------------------------------
  {
    type: "function" as const,
    function: {
      name: "list_price_books",
      description:
        "Get all price books in the workspace. Price books contain pricing information for equipment rentals and sales.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_price_book",
      description:
        "Create a new price book. Use this when the user wants to set up a new pricing catalog.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The name of the price book",
          },
          location: {
            type: "string",
            description: "The location/region this price book applies to",
          },
          notes: {
            type: "string",
            description: "Additional notes about the price book",
          },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "update_price_book",
      description: "Update an existing price book.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The ID of the price book to update",
          },
          name: {
            type: "string",
            description: "The new name",
          },
          location: {
            type: "string",
            description: "The new location",
          },
          notes: {
            type: "string",
            description: "Updated notes",
          },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "delete_price_book",
      description: "Delete a price book.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The ID of the price book to delete",
          },
        },
        required: ["id"],
      },
    },
  },

  // -------------------------------------------------------------------------
  // Price Tools
  // -------------------------------------------------------------------------
  {
    type: "function" as const,
    function: {
      name: "list_prices",
      description:
        "Get all prices in the workspace. Prices can be rental prices (daily/weekly/monthly rates) or sale prices (one-time cost).",
      parameters: {
        type: "object",
        properties: {
          price_book_id: {
            type: "string",
            description: "Filter by a specific price book ID",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_rental_price",
      description: "Create a new rental price with daily, weekly, and monthly rates.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The name of the rental price",
          },
          price_book_id: {
            type: "string",
            description: "The price book to add this price to",
          },
          pim_category_id: {
            type: "string",
            description: "The product category ID",
          },
          price_per_day_in_cents: {
            type: "number",
            description: "Daily rental rate in cents (e.g., 10000 = $100.00)",
          },
          price_per_week_in_cents: {
            type: "number",
            description: "Weekly rental rate in cents",
          },
          price_per_month_in_cents: {
            type: "number",
            description: "Monthly rental rate in cents",
          },
        },
        required: ["name", "price_book_id", "pim_category_id"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_sale_price",
      description: "Create a new sale price for one-time purchase items.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The name of the sale price",
          },
          price_book_id: {
            type: "string",
            description: "The price book to add this price to",
          },
          pim_category_id: {
            type: "string",
            description: "The product category ID",
          },
          unit_cost_in_cents: {
            type: "number",
            description: "Sale price in cents (e.g., 50000 = $500.00)",
          },
        },
        required: ["name", "price_book_id", "pim_category_id"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "delete_price",
      description: "Delete a price (rental or sale).",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The ID of the price to delete",
          },
        },
        required: ["id"],
      },
    },
  },

  // -------------------------------------------------------------------------
  // PIM (Product Information Management) Tools
  // -------------------------------------------------------------------------
  {
    type: "function" as const,
    function: {
      name: "search_pim_categories",
      description:
        "Search for product categories in the PIM (Product Information Management) system. Use this when the user wants to find equipment categories by name or keyword.",
      parameters: {
        type: "object",
        properties: {
          search_term: {
            type: "string",
            description: "Search term to filter categories by name (e.g., 'excavator', 'crane')",
          },
          parent_id: {
            type: "string",
            description: "Filter by parent category ID to find subcategories",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_pim_category_children",
      description:
        "Get the child categories of a specific category. Use this to navigate the category hierarchy and explore subcategories.",
      parameters: {
        type: "object",
        properties: {
          parent_id: {
            type: "string",
            description: "The ID of the parent category. Leave empty to get top-level categories.",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "search_pim_products",
      description:
        "Search for specific products in the PIM system. Use this when the user wants to find products by name, make, model, or SKU.",
      parameters: {
        type: "object",
        properties: {
          search_term: {
            type: "string",
            description: "Search term to filter products by name (e.g., 'Caterpillar', 'D6')",
          },
          category_id: {
            type: "string",
            description: "Filter products by category ID (pim_category_platform_id)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_pim_products_by_category",
      description:
        "Get all products in a specific category. Use this when you know the category and want to see what products are available.",
      parameters: {
        type: "object",
        properties: {
          category_id: {
            type: "string",
            description: "The category ID (pim_category_platform_id) to get products from",
          },
        },
        required: ["category_id"],
      },
    },
  },

  // -------------------------------------------------------------------------
  // Web Tools
  // -------------------------------------------------------------------------
  {
    type: "function" as const,
    function: {
      name: "fetch_url",
      description:
        "Fetch and read content from a website URL. Use this when you need to look up information from a website, get company details, addresses, or any other web content. The tool extracts readable text from the page.",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description:
              "The full URL to fetch (e.g., 'https://example.com/about' or 'https://equipmentshare.com/contact')",
          },
        },
        required: ["url"],
      },
    },
  },
];

// ============================================================================
// Tool Executors
// ============================================================================

/**
 * Tool executor functions
 * These actually execute the GraphQL queries when the AI requests a tool call
 */
export const TOOL_EXECUTORS: Record<
  string,
  (args: any, apolloClient: ApolloClient<NormalizedCacheObject>) => Promise<any>
> = {
  // -------------------------------------------------------------------------
  // Project Executors
  // -------------------------------------------------------------------------
  list_projects: async (
    args: { workspaceId: string },
    apolloClient: ApolloClient<NormalizedCacheObject>,
  ) => {
    const result = await apolloClient.query<
      AgentListProjectsQuery,
      AgentListProjectsQueryVariables
    >({
      query: AgentListProjectsDocument,
      variables: { workspaceId: args.workspaceId },
      fetchPolicy: "network-only",
    });

    return result.data.listProjects;
  },

  create_project: async (
    args: {
      workspaceId: string;
      name: string;
      project_code: string;
      description?: string;
      status?: string;
      scope_of_work?: string[];
    },
    apolloClient: ApolloClient<NormalizedCacheObject>,
  ) => {
    const result = await apolloClient.mutate<
      AgentCreateProjectMutation,
      AgentCreateProjectMutationVariables
    >({
      mutation: AgentCreateProjectDocument,
      variables: {
        input: {
          workspaceId: args.workspaceId,
          name: args.name,
          project_code: args.project_code,
          description: args.description,
          status: args.status as ProjectStatusEnum | undefined,
          scope_of_work: args.scope_of_work as ScopeOfWorkEnum[] | undefined,
          deleted: false,
        },
      },
    });

    return result.data?.createProject;
  },

  update_project: async (
    args: {
      workspaceId: string;
      id: string;
      name?: string;
      project_code?: string;
      description?: string;
      status?: string;
      scope_of_work?: string[];
    },
    apolloClient: ApolloClient<NormalizedCacheObject>,
  ) => {
    // First get the existing project to preserve fields not being updated
    const existing = await apolloClient.query<
      AgentListProjectsQuery,
      AgentListProjectsQueryVariables
    >({
      query: AgentListProjectsDocument,
      variables: { workspaceId: args.workspaceId },
      fetchPolicy: "network-only",
    });

    const project = existing.data.listProjects?.find((p) => p?.id === args.id);
    if (!project) {
      throw new Error(`Project with ID ${args.id} not found`);
    }

    const result = await apolloClient.mutate<
      AgentUpdateProjectMutation,
      AgentUpdateProjectMutationVariables
    >({
      mutation: AgentUpdateProjectDocument,
      variables: {
        id: args.id,
        input: {
          workspaceId: args.workspaceId,
          name: args.name ?? project.name ?? "",
          project_code: args.project_code ?? project.project_code ?? "",
          description: args.description ?? project.description,
          status: (args.status ?? project.status) as ProjectStatusEnum | undefined,
          scope_of_work: args.scope_of_work as ScopeOfWorkEnum[] | undefined,
          deleted: false,
        },
      },
    });

    return result.data?.updateProject;
  },

  // -------------------------------------------------------------------------
  // Contact Executors
  // -------------------------------------------------------------------------
  list_contacts: async (
    args: { workspaceId: string; contact_type?: string },
    apolloClient: ApolloClient<NormalizedCacheObject>,
  ) => {
    const result = await apolloClient.query<
      AgentListContactsQuery,
      AgentListContactsQueryVariables
    >({
      query: AgentListContactsDocument,
      variables: {
        filter: {
          workspaceId: args.workspaceId,
          contactType: args.contact_type as ContactType | undefined,
        },
        page: { size: 100 },
      },
      fetchPolicy: "network-only",
    });

    return result.data.listContacts?.items;
  },

  create_business_contact: async (
    args: {
      workspaceId: string;
      name: string;
      address?: string;
      phone?: string;
      website?: string;
      taxId?: string;
      notes?: string;
    },
    apolloClient: ApolloClient<NormalizedCacheObject>,
  ) => {
    const result = await apolloClient.mutate<
      AgentCreateBusinessContactMutation,
      AgentCreateBusinessContactMutationVariables
    >({
      mutation: AgentCreateBusinessContactDocument,
      variables: {
        input: {
          workspaceId: args.workspaceId,
          name: args.name,
          address: args.address,
          phone: args.phone,
          website: args.website,
          taxId: args.taxId,
          notes: args.notes,
        },
      },
    });

    return result.data?.createBusinessContact;
  },

  create_person_contact: async (
    args: {
      workspaceId: string;
      name: string;
      email: string;
      role: string;
      business_id: string;
      phone?: string;
      notes?: string;
    },
    apolloClient: ApolloClient<NormalizedCacheObject>,
  ) => {
    const result = await apolloClient.mutate<
      AgentCreatePersonContactMutation,
      AgentCreatePersonContactMutationVariables
    >({
      mutation: AgentCreatePersonContactDocument,
      variables: {
        input: {
          workspaceId: args.workspaceId,
          name: args.name,
          email: args.email,
          role: args.role,
          businessId: args.business_id,
          phone: args.phone,
          notes: args.notes,
        },
      },
    });

    return result.data?.createPersonContact;
  },

  update_business_contact: async (
    args: {
      workspaceId: string;
      id: string;
      name?: string;
      address?: string;
      phone?: string;
      website?: string;
      taxId?: string;
      notes?: string;
    },
    apolloClient: ApolloClient<NormalizedCacheObject>,
  ) => {
    const result = await apolloClient.mutate<
      AgentUpdateBusinessContactMutation,
      AgentUpdateBusinessContactMutationVariables
    >({
      mutation: AgentUpdateBusinessContactDocument,
      variables: {
        id: args.id,
        input: {
          name: args.name,
          address: args.address,
          phone: args.phone,
          website: args.website,
          taxId: args.taxId,
          notes: args.notes,
        },
      },
    });

    return result.data?.updateBusinessContact;
  },

  update_person_contact: async (
    args: {
      workspaceId: string;
      id: string;
      name?: string;
      email?: string;
      role?: string;
      phone?: string;
      notes?: string;
      business_id?: string;
    },
    apolloClient: ApolloClient<NormalizedCacheObject>,
  ) => {
    const result = await apolloClient.mutate<
      AgentUpdatePersonContactMutation,
      AgentUpdatePersonContactMutationVariables
    >({
      mutation: AgentUpdatePersonContactDocument,
      variables: {
        id: args.id,
        input: {
          name: args.name,
          email: args.email,
          role: args.role,
          phone: args.phone,
          notes: args.notes,
          businessId: args.business_id,
        },
      },
    });

    return result.data?.updatePersonContact;
  },

  // -------------------------------------------------------------------------
  // Price Book Executors
  // -------------------------------------------------------------------------
  list_price_books: async (
    args: { workspaceId: string },
    apolloClient: ApolloClient<NormalizedCacheObject>,
  ) => {
    const result = await apolloClient.query<
      AgentListPriceBooksQuery,
      AgentListPriceBooksQueryVariables
    >({
      query: AgentListPriceBooksDocument,
      variables: {
        filter: { workspaceId: args.workspaceId },
        page: { number: 1, size: 100 },
      },
      fetchPolicy: "network-only",
    });

    return result.data.listPriceBooks?.items;
  },

  create_price_book: async (
    args: {
      workspaceId: string;
      name: string;
      location?: string;
      notes?: string;
    },
    apolloClient: ApolloClient<NormalizedCacheObject>,
  ) => {
    const result = await apolloClient.mutate<
      AgentCreatePriceBookMutation,
      AgentCreatePriceBookMutationVariables
    >({
      mutation: AgentCreatePriceBookDocument,
      variables: {
        input: {
          workspaceId: args.workspaceId,
          name: args.name,
          location: args.location,
          notes: args.notes,
        },
      },
    });

    return result.data?.createPriceBook;
  },

  update_price_book: async (
    args: {
      workspaceId: string;
      id: string;
      name?: string;
      location?: string;
      notes?: string;
    },
    apolloClient: ApolloClient<NormalizedCacheObject>,
  ) => {
    const result = await apolloClient.mutate<
      AgentUpdatePriceBookMutation,
      AgentUpdatePriceBookMutationVariables
    >({
      mutation: AgentUpdatePriceBookDocument,
      variables: {
        input: {
          id: args.id,
          name: args.name,
          location: args.location,
          notes: args.notes,
        },
      },
    });

    return result.data?.updatePriceBook;
  },

  delete_price_book: async (
    args: { id: string },
    apolloClient: ApolloClient<NormalizedCacheObject>,
  ) => {
    const result = await apolloClient.mutate<
      AgentDeletePriceBookMutation,
      AgentDeletePriceBookMutationVariables
    >({
      mutation: AgentDeletePriceBookDocument,
      variables: { id: args.id },
    });

    return { deleted: result.data?.deletePriceBookById };
  },

  // -------------------------------------------------------------------------
  // Price Executors
  // -------------------------------------------------------------------------
  list_prices: async (
    args: { workspaceId: string; price_book_id?: string },
    apolloClient: ApolloClient<NormalizedCacheObject>,
  ) => {
    const result = await apolloClient.query<AgentListPricesQuery, AgentListPricesQueryVariables>({
      query: AgentListPricesDocument,
      variables: {
        filter: {
          workspaceId: args.workspaceId,
          priceBookId: args.price_book_id,
        },
        page: { number: 1, size: 100 },
      },
      fetchPolicy: "network-only",
    });

    return result.data.listPrices?.items;
  },

  create_rental_price: async (
    args: {
      workspaceId: string;
      name: string;
      price_book_id: string;
      pim_category_id: string;
      price_per_day_in_cents?: number;
      price_per_week_in_cents?: number;
      price_per_month_in_cents?: number;
    },
    apolloClient: ApolloClient<NormalizedCacheObject>,
  ) => {
    const result = await apolloClient.mutate<
      AgentCreateRentalPriceMutation,
      AgentCreateRentalPriceMutationVariables
    >({
      mutation: AgentCreateRentalPriceDocument,
      variables: {
        input: {
          workspaceId: args.workspaceId,
          name: args.name,
          priceBookId: args.price_book_id,
          pimCategoryId: args.pim_category_id,
          pricePerDayInCents: args.price_per_day_in_cents ?? 0,
          pricePerWeekInCents: args.price_per_week_in_cents ?? 0,
          pricePerMonthInCents: args.price_per_month_in_cents ?? 0,
        },
      },
    });

    return result.data?.createRentalPrice;
  },

  create_sale_price: async (
    args: {
      workspaceId: string;
      name: string;
      price_book_id: string;
      pim_category_id: string;
      unit_cost_in_cents?: number;
    },
    apolloClient: ApolloClient<NormalizedCacheObject>,
  ) => {
    const result = await apolloClient.mutate<
      AgentCreateSalePriceMutation,
      AgentCreateSalePriceMutationVariables
    >({
      mutation: AgentCreateSalePriceDocument,
      variables: {
        input: {
          workspaceId: args.workspaceId,
          name: args.name,
          priceBookId: args.price_book_id,
          pimCategoryId: args.pim_category_id,
          unitCostInCents: args.unit_cost_in_cents ?? 0,
        },
      },
    });

    return result.data?.createSalePrice;
  },

  delete_price: async (args: { id: string }, apolloClient: ApolloClient<NormalizedCacheObject>) => {
    const result = await apolloClient.mutate<
      AgentDeletePriceMutation,
      AgentDeletePriceMutationVariables
    >({
      mutation: AgentDeletePriceDocument,
      variables: { id: args.id },
    });

    return { deleted: result.data?.deletePriceById };
  },

  // -------------------------------------------------------------------------
  // PIM Executors
  // -------------------------------------------------------------------------
  search_pim_categories: async (
    args: { search_term?: string; parent_id?: string },
    apolloClient: ApolloClient<NormalizedCacheObject>,
  ) => {
    const result = await apolloClient.query<
      AgentSearchPimCategoriesQuery,
      AgentSearchPimCategoriesQueryVariables
    >({
      query: AgentSearchPimCategoriesDocument,
      variables: {
        filter: {
          searchTerm: args.search_term,
          parentId: args.parent_id,
        },
        page: { number: 1, size: 50 },
      },
      fetchPolicy: "network-only",
    });

    return {
      categories: result.data.listPimCategories?.items,
      pagination: result.data.listPimCategories?.page,
    };
  },

  get_pim_category_children: async (
    args: { parent_id?: string },
    apolloClient: ApolloClient<NormalizedCacheObject>,
  ) => {
    const result = await apolloClient.query<
      AgentSearchPimCategoriesQuery,
      AgentSearchPimCategoriesQueryVariables
    >({
      query: AgentSearchPimCategoriesDocument,
      variables: {
        filter: {
          parentId: args.parent_id,
        },
        page: { number: 1, size: 100 },
      },
      fetchPolicy: "network-only",
    });

    return {
      categories: result.data.listPimCategories?.items,
      pagination: result.data.listPimCategories?.page,
    };
  },

  search_pim_products: async (
    args: { search_term?: string; category_id?: string },
    apolloClient: ApolloClient<NormalizedCacheObject>,
  ) => {
    const result = await apolloClient.query<
      AgentSearchPimProductsQuery,
      AgentSearchPimProductsQueryVariables
    >({
      query: AgentSearchPimProductsDocument,
      variables: {
        filter: {
          searchTerm: args.search_term,
          pimCategoryPlatformId: args.category_id,
        },
        page: { number: 1, size: 50 },
      },
      fetchPolicy: "network-only",
    });

    return {
      products: result.data.listPimProducts?.items,
      pagination: result.data.listPimProducts?.page,
    };
  },

  get_pim_products_by_category: async (
    args: { category_id: string },
    apolloClient: ApolloClient<NormalizedCacheObject>,
  ) => {
    const result = await apolloClient.query<
      AgentSearchPimProductsQuery,
      AgentSearchPimProductsQueryVariables
    >({
      query: AgentSearchPimProductsDocument,
      variables: {
        filter: {
          pimCategoryPlatformId: args.category_id,
        },
        page: { number: 1, size: 100 },
      },
      fetchPolicy: "network-only",
    });

    return {
      products: result.data.listPimProducts?.items,
      pagination: result.data.listPimProducts?.page,
    };
  },

  // -------------------------------------------------------------------------
  // Web Executors
  // -------------------------------------------------------------------------
  fetch_url: async (
    args: { url: string; _getAuthToken?: () => Promise<string>; _graphqlUrl?: string },
    _apolloClient: ApolloClient<NormalizedCacheObject>,
  ) => {
    // This executor needs auth token and API URL injected from useAgentChat
    // They are passed via _getAuthToken and _graphqlUrl
    const { url, _getAuthToken, _graphqlUrl } = args;

    if (!_getAuthToken || !_graphqlUrl) {
      throw new Error("fetch_url requires auth context - internal error");
    }

    const token = await _getAuthToken();

    // Derive API URL from GraphQL URL
    const apiUrl = new URL(_graphqlUrl);
    const pathPrefix = apiUrl.pathname.replace(/\/graphql$/, "");
    const fetchUrlEndpoint = `${apiUrl.protocol}//${apiUrl.host}${pathPrefix}/api/agent/fetch-url`;

    const response = await fetch(fetchUrlEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      return { url, error: data.error };
    }

    return {
      url: data.url,
      title: data.title,
      content: data.content,
    };
  },
};
