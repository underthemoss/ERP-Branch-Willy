"use client";

import {
  AddOutlined,
  BlockOutlined,
  BusinessOutlined,
  DownloadOutlined,
  EditOutlined,
  EmailOutlined,
  FilterListOutlined,
  GroupOutlined,
  ListOutlined,
  LocationOnOutlined,
  MapOutlined,
  MoreVertOutlined,
  PersonOutlined,
  PhoneOutlined,
  SearchOutlined,
  TrendingUpOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Divider,
  Dropdown,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  Modal,
  ModalClose,
  ModalDialog,
  Option,
  Select,
  Sheet,
  Stack,
  Table,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/joy";
import { useMemo, useState } from "react";
import CustomersMap from "./CustomersMap";

// Mock customer data with geographic locations
const mockCustomers = [
  {
    id: "1",
    name: "BuildCo Construction",
    contact: "John Smith",
    email: "john@buildco.com",
    phone: "(555) 123-4567",
    status: "active",
    plan: "Enterprise",
    users: 45,
    revenue: "$12,500/mo",
    created: "2023-01-15",
    lastActive: "2 hours ago",
    address: "123 Main St, Denver, CO",
    lat: 39.7392,
    lng: -104.9903,
  },
  {
    id: "2",
    name: "Heavy Equipment Rentals LLC",
    contact: "Sarah Johnson",
    email: "sarah@heavyequip.com",
    phone: "(555) 234-5678",
    status: "active",
    plan: "Professional",
    users: 28,
    revenue: "$8,200/mo",
    created: "2023-03-22",
    lastActive: "1 day ago",
    address: "456 Oak Ave, Houston, TX",
    lat: 29.7604,
    lng: -95.3698,
  },
  {
    id: "3",
    name: "Mountain View Contractors",
    contact: "Mike Davis",
    email: "mike@mvcontractors.com",
    phone: "(555) 345-6789",
    status: "trial",
    plan: "Trial",
    users: 12,
    revenue: "$0/mo",
    created: "2024-12-01",
    lastActive: "5 minutes ago",
    address: "789 Pine Rd, Phoenix, AZ",
    lat: 33.4484,
    lng: -112.074,
  },
  {
    id: "4",
    name: "Coastal Construction Group",
    contact: "Lisa Anderson",
    email: "lisa@coastal.com",
    phone: "(555) 456-7890",
    status: "active",
    plan: "Enterprise",
    users: 67,
    revenue: "$15,800/mo",
    created: "2022-11-10",
    lastActive: "3 hours ago",
    address: "321 Beach Blvd, Miami, FL",
    lat: 25.7617,
    lng: -80.1918,
  },
  {
    id: "5",
    name: "Midwest Machinery",
    contact: "Tom Wilson",
    email: "tom@midwestmach.com",
    phone: "(555) 567-8901",
    status: "inactive",
    plan: "Professional",
    users: 0,
    revenue: "$0/mo",
    created: "2023-06-15",
    lastActive: "30 days ago",
    address: "654 Industrial Way, Chicago, IL",
    lat: 41.8781,
    lng: -87.6298,
  },
  {
    id: "6",
    name: "Pacific Equipment Services",
    contact: "Jennifer Lee",
    email: "jennifer@pacificequip.com",
    phone: "(555) 678-9012",
    status: "active",
    plan: "Starter",
    users: 8,
    revenue: "$2,500/mo",
    created: "2024-02-20",
    lastActive: "12 hours ago",
    address: "987 Harbor Dr, Seattle, WA",
    lat: 47.6062,
    lng: -122.3321,
  },
  {
    id: "7",
    name: "Desert Construction Co",
    contact: "Robert Martinez",
    email: "robert@desertco.com",
    phone: "(555) 789-0123",
    status: "active",
    plan: "Professional",
    users: 34,
    revenue: "$9,100/mo",
    created: "2023-08-05",
    lastActive: "4 hours ago",
    address: "246 Cactus Ln, Las Vegas, NV",
    lat: 36.1699,
    lng: -115.1398,
  },
  {
    id: "8",
    name: "Northeast Builders",
    contact: "Emily Brown",
    email: "emily@nebuilders.com",
    phone: "(555) 890-1234",
    status: "trial",
    plan: "Trial",
    users: 5,
    revenue: "$0/mo",
    created: "2024-12-10",
    lastActive: "Just now",
    address: "135 Liberty St, Boston, MA",
    lat: 42.3601,
    lng: -71.0589,
  },
  {
    id: "9",
    name: "Southern Equipment Depot",
    contact: "James Taylor",
    email: "james@southerndepot.com",
    phone: "(555) 901-2345",
    status: "active",
    plan: "Enterprise",
    users: 89,
    revenue: "$22,400/mo",
    created: "2022-05-18",
    lastActive: "1 hour ago",
    address: "864 Peachtree Rd, Atlanta, GA",
    lat: 33.749,
    lng: -84.388,
  },
  {
    id: "10",
    name: "Rocky Mountain Rentals",
    contact: "Patricia Garcia",
    email: "patricia@rockymtnrentals.com",
    phone: "(555) 012-3456",
    status: "active",
    plan: "Professional",
    users: 41,
    revenue: "$10,300/mo",
    created: "2023-04-12",
    lastActive: "6 hours ago",
    address: "753 Summit Ave, Salt Lake City, UT",
    lat: 40.7608,
    lng: -111.891,
  },
];

export default function CustomersPage() {
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Filter customers based on search and filters
  const filteredCustomers = useMemo(() => {
    return mockCustomers.filter((customer) => {
      const matchesSearch =
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || customer.status === statusFilter;
      const matchesPlan = planFilter === "all" || customer.plan === planFilter;

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [searchQuery, statusFilter, planFilter]);

  const handleViewDetails = (customer: any) => {
    setSelectedCustomer(customer);
    setDetailsModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "trial":
        return "primary";
      case "inactive":
        return "danger";
      default:
        return "neutral";
    }
  };

  const CustomersList = () => (
    <Sheet
      variant="outlined"
      sx={{
        borderRadius: "sm",
        overflow: "auto",
      }}
    >
      <Table
        stickyHeader
        hoverRow
        sx={{
          "--TableCell-headBackground": "transparent",
          "--Table-headerUnderlineThickness": "1px",
          "& thead th:nth-of-type(1)": { width: "25%" },
          "& thead th:nth-of-type(2)": { width: "20%" },
          "& thead th:nth-of-type(3)": { width: "15%" },
          "& thead th:nth-of-type(4)": { width: "10%" },
          "& thead th:nth-of-type(5)": { width: "10%" },
          "& thead th:nth-of-type(6)": { width: "10%" },
          "& thead th:nth-of-type(7)": { width: "10%" },
        }}
      >
        <thead>
          <tr>
            <th>Company</th>
            <th>Contact</th>
            <th>Status</th>
            <th>Plan</th>
            <th>Users</th>
            <th>Revenue</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredCustomers.map((customer) => (
            <tr key={customer.id}>
              <td>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Avatar size="sm" sx={{ bgcolor: "primary.softBg" }}>
                    <BusinessOutlined sx={{ fontSize: 16 }} />
                  </Avatar>
                  <Box>
                    <Typography level="body-sm" sx={{ fontWeight: 500 }}>
                      {customer.name}
                    </Typography>
                    <Typography level="body-xs" sx={{ color: "text.secondary" }}>
                      {customer.address}
                    </Typography>
                  </Box>
                </Box>
              </td>
              <td>
                <Box>
                  <Typography level="body-sm">{customer.contact}</Typography>
                  <Typography level="body-xs" sx={{ color: "text.secondary" }}>
                    {customer.email}
                  </Typography>
                </Box>
              </td>
              <td>
                <Chip size="sm" color={getStatusColor(customer.status)} variant="soft">
                  {customer.status}
                </Chip>
              </td>
              <td>
                <Typography level="body-sm">{customer.plan}</Typography>
              </td>
              <td>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <GroupOutlined sx={{ fontSize: 16, color: "text.secondary" }} />
                  <Typography level="body-sm">{customer.users}</Typography>
                </Box>
              </td>
              <td>
                <Typography level="body-sm" sx={{ fontWeight: 500 }}>
                  {customer.revenue}
                </Typography>
              </td>
              <td>
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  <Tooltip title="View Details">
                    <IconButton
                      size="sm"
                      variant="plain"
                      onClick={() => handleViewDetails(customer)}
                    >
                      <VisibilityOutlined />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton size="sm" variant="plain">
                      <EditOutlined />
                    </IconButton>
                  </Tooltip>
                  <Dropdown>
                    <MenuButton
                      slots={{ root: IconButton }}
                      slotProps={{ root: { size: "sm", variant: "plain" } }}
                    >
                      <MoreVertOutlined />
                    </MenuButton>
                    <Menu size="sm">
                      <MenuItem>Send Email</MenuItem>
                      <MenuItem>View Activity</MenuItem>
                      <MenuItem>Change Plan</MenuItem>
                      <Divider />
                      <MenuItem color="danger">
                        {customer.status === "active" ? "Suspend Account" : "Activate Account"}
                      </MenuItem>
                    </Menu>
                  </Dropdown>
                </Box>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Sheet>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography level="h2" sx={{ mb: 0.5 }}>
          Customers
        </Typography>
        <Typography level="body-md" sx={{ color: "text.secondary" }}>
          Manage customer accounts and subscriptions
        </Typography>
      </Box>

      {/* Controls */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", alignItems: "center" }}>
        <Input
          placeholder="Search customers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          startDecorator={<SearchOutlined />}
          sx={{ flex: 1, minWidth: 200 }}
        />

        <Select
          value={statusFilter}
          onChange={(_, value) => setStatusFilter(value as string)}
          sx={{ minWidth: 120 }}
        >
          <Option value="all">All Status</Option>
          <Option value="active">Active</Option>
          <Option value="trial">Trial</Option>
          <Option value="inactive">Inactive</Option>
        </Select>

        <Select
          value={planFilter}
          onChange={(_, value) => setPlanFilter(value as string)}
          sx={{ minWidth: 120 }}
        >
          <Option value="all">All Plans</Option>
          <Option value="Enterprise">Enterprise</Option>
          <Option value="Professional">Professional</Option>
          <Option value="Starter">Starter</Option>
          <Option value="Trial">Trial</Option>
        </Select>

        <Box sx={{ flex: 1 }} />

        <ToggleButtonGroup
          value={viewMode}
          onChange={(_, value) => value && setViewMode(value)}
          sx={{ bgcolor: "background.surface" }}
        >
          <Button value="list" startDecorator={<ListOutlined />}>
            List
          </Button>
          <Button value="map" startDecorator={<MapOutlined />}>
            Map
          </Button>
        </ToggleButtonGroup>

        <Button startDecorator={<DownloadOutlined />} variant="outlined">
          Export
        </Button>

        <Button startDecorator={<AddOutlined />} variant="solid">
          New Customer
        </Button>
      </Box>

      {/* Summary Stats */}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <Card sx={{ flex: 1 }}>
          <Typography level="body-sm" sx={{ color: "text.secondary" }}>
            Total Customers
          </Typography>
          <Typography level="h3">{mockCustomers.length}</Typography>
        </Card>
        <Card sx={{ flex: 1 }}>
          <Typography level="body-sm" sx={{ color: "text.secondary" }}>
            Active
          </Typography>
          <Typography level="h3" sx={{ color: "success.500" }}>
            {mockCustomers.filter((c) => c.status === "active").length}
          </Typography>
        </Card>
        <Card sx={{ flex: 1 }}>
          <Typography level="body-sm" sx={{ color: "text.secondary" }}>
            Trial
          </Typography>
          <Typography level="h3" sx={{ color: "primary.500" }}>
            {mockCustomers.filter((c) => c.status === "trial").length}
          </Typography>
        </Card>
        <Card sx={{ flex: 1 }}>
          <Typography level="body-sm" sx={{ color: "text.secondary" }}>
            Total Users
          </Typography>
          <Typography level="h3">{mockCustomers.reduce((sum, c) => sum + c.users, 0)}</Typography>
        </Card>
      </Box>

      {/* View Content */}
      {viewMode === "list" ? (
        <CustomersList />
      ) : (
        <CustomersMap customers={filteredCustomers} onViewDetails={handleViewDetails} />
      )}

      {/* Customer Details Modal */}
      <Modal open={detailsModalOpen} onClose={() => setDetailsModalOpen(false)}>
        <ModalDialog sx={{ width: 500 }}>
          <ModalClose />
          <Typography level="h4" sx={{ mb: 2 }}>
            Customer Details
          </Typography>
          {selectedCustomer && (
            <Stack spacing={2}>
              <Box>
                <Typography level="title-md" sx={{ mb: 1 }}>
                  {selectedCustomer.name}
                </Typography>
                <Chip size="sm" color={getStatusColor(selectedCustomer.status)} variant="soft">
                  {selectedCustomer.status}
                </Chip>
              </Box>

              <Divider />

              <Box>
                <Typography level="body-sm" sx={{ color: "text.secondary", mb: 1 }}>
                  Contact Information
                </Typography>
                <Stack spacing={1}>
                  <Typography level="body-sm">
                    <PersonOutlined sx={{ fontSize: 16, mr: 1 }} />
                    {selectedCustomer.contact}
                  </Typography>
                  <Typography level="body-sm">
                    <EmailOutlined sx={{ fontSize: 16, mr: 1 }} />
                    {selectedCustomer.email}
                  </Typography>
                  <Typography level="body-sm">
                    <PhoneOutlined sx={{ fontSize: 16, mr: 1 }} />
                    {selectedCustomer.phone}
                  </Typography>
                  <Typography level="body-sm">
                    <LocationOnOutlined sx={{ fontSize: 16, mr: 1 }} />
                    {selectedCustomer.address}
                  </Typography>
                </Stack>
              </Box>

              <Divider />

              <Box>
                <Typography level="body-sm" sx={{ color: "text.secondary", mb: 1 }}>
                  Account Details
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography level="body-sm">Plan:</Typography>
                    <Typography level="body-sm" sx={{ fontWeight: 500 }}>
                      {selectedCustomer.plan}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography level="body-sm">Users:</Typography>
                    <Typography level="body-sm" sx={{ fontWeight: 500 }}>
                      {selectedCustomer.users}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography level="body-sm">Revenue:</Typography>
                    <Typography level="body-sm" sx={{ fontWeight: 500 }}>
                      {selectedCustomer.revenue}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography level="body-sm">Created:</Typography>
                    <Typography level="body-sm" sx={{ fontWeight: 500 }}>
                      {selectedCustomer.created}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography level="body-sm">Last Active:</Typography>
                    <Typography level="body-sm" sx={{ fontWeight: 500 }}>
                      {selectedCustomer.lastActive}
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              <Divider />

              <Box sx={{ display: "flex", gap: 1 }}>
                <Button variant="solid" sx={{ flex: 1 }}>
                  Edit Customer
                </Button>
                <Button variant="outlined" sx={{ flex: 1 }}>
                  View Activity
                </Button>
              </Box>
            </Stack>
          )}
        </ModalDialog>
      </Modal>
    </Box>
  );
}
