import React from "react";
import { Meta, StoryObj } from "@storybook/react";
import {
  EntityListPage,
  EntityListPageProps,
  EntityListPageFilter,
} from "./EntityListPage";
import { GridColDef } from "@mui/x-data-grid-premium";

const meta: Meta<typeof EntityListPage> = {
  title: "EntityListPage",
  component: EntityListPage,
};
export default meta;

type Entity = {
  id: string;
  name: string;
  type: string;
  status: string;
  owner: string;
  created_at: string;
};

const mockRows: Entity[] = [
  {
    id: "E-1001",
    name: "Alpha Project",
    type: "Project",
    status: "Active",
    owner: "Jane Smith",
    created_at: "2024-05-01T08:00:00Z",
  },
  {
    id: "E-1002",
    name: "Beta Order",
    type: "Order",
    status: "Pending",
    owner: "John Doe",
    created_at: "2024-04-20T09:15:00Z",
  },
  {
    id: "E-1003",
    name: "Gamma Invoice",
    type: "Invoice",
    status: "Closed",
    owner: "Maria Lopez",
    created_at: "2024-03-15T10:00:00Z",
  },
];

const columns: GridColDef[] = [
  { field: "id", headerName: "ID", width: 120 },
  { field: "name", headerName: "Name", flex: 2, minWidth: 180 },
  { field: "type", headerName: "Type", width: 120 },
  { field: "status", headerName: "Status", width: 120 },
  { field: "owner", headerName: "Owner", width: 140 },
  { field: "created_at", headerName: "Created At", width: 180 },
];

const typeOptions = ["Project", "Order", "Invoice"];
const statusOptions = ["Active", "Pending", "Closed"];
const ownerOptions = ["Jane Smith", "John Doe", "Maria Lopez"];

const Template: StoryObj<EntityListPageProps> = {
  render: (args) => {
    const [search, setSearch] = React.useState("");
    const [typeFilter, setTypeFilter] = React.useState<string[]>([]);
    const [statusFilter, setStatusFilter] = React.useState<string[]>([]);
    const [ownerFilter, setOwnerFilter] = React.useState<string[]>([]);
    const [rows, setRows] = React.useState<Entity[]>(mockRows);

    // Simple filter logic
    const filteredRows = rows.filter((row) => {
      if (typeFilter.length && !typeFilter.includes(row.type)) return false;
      if (statusFilter.length && !statusFilter.includes(row.status))
        return false;
      if (ownerFilter.length && !ownerFilter.includes(row.owner)) return false;
      if (search) {
        const lower = search.toLowerCase();
        if (!Object.values(row).join(" ").toLowerCase().includes(lower)) {
          return false;
        }
      }
      return true;
    });

    const filters: EntityListPageFilter[] = [
      {
        key: "type",
        label: "Type",
        options: typeOptions,
        value: typeFilter,
        onChange: setTypeFilter,
        "data-testid": "entity-type-filter",
      },
      {
        key: "status",
        label: "Status",
        options: statusOptions,
        value: statusFilter,
        onChange: setStatusFilter,
        "data-testid": "entity-status-filter",
      },
      {
        key: "owner",
        label: "Owner",
        options: ownerOptions,
        value: ownerFilter,
        onChange: setOwnerFilter,
        "data-testid": "entity-owner-filter",
      },
    ];

    return (
      <EntityListPage
        {...args}
        columns={columns}
        rows={filteredRows}
        searchValue={search}
        onSearchChange={setSearch}
        filters={filters}
        createButtonLabel="+ Create Entity"
        onCreateClick={() => alert("Create Entity clicked!")}
        title="Entities"
        description="A generic entity list page for any resource type."
        searchPlaceholder="Search entities"
      />
    );
  },
};

export const Default = { ...Template };
