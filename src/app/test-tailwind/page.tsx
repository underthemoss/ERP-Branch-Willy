"use client";

import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ConstructionIcon from "@mui/icons-material/Construction";
import DashboardIcon from "@mui/icons-material/Dashboard";
import DescriptionIcon from "@mui/icons-material/Description";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FactoryIcon from "@mui/icons-material/Factory";
import HelpCenterIcon from "@mui/icons-material/HelpCenter";
import InventoryIcon from "@mui/icons-material/Inventory";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import MenuIcon from "@mui/icons-material/Menu";
import MessageIcon from "@mui/icons-material/Message";
import NetworkCellIcon from "@mui/icons-material/NetworkCell";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PeopleIcon from "@mui/icons-material/People";
import RefreshIcon from "@mui/icons-material/Refresh";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import SearchIcon from "@mui/icons-material/Search";
import SettingsIcon from "@mui/icons-material/Settings";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { BarChart } from "@mui/x-charts/BarChart";
import { Gauge } from "@mui/x-charts/Gauge";
import { LineChart } from "@mui/x-charts/LineChart";
import { PieChart } from "@mui/x-charts/PieChart";
import { useState } from "react";

export default function DashboardReference() {
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [activeStockTab, setActiveStockTab] = useState("Stock view");
  const [activePolishTab, setActivePolishTab] = useState("Available to fetch");
  const [sidebarExpanded, setSidebarExpanded] = useState({
    overview: true,
    personal: false,
    other: true,
    general: false,
  });

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-60 bg-[#2D3748] text-white flex flex-col">
        {/* Logo */}
        <div className="p-4 flex items-center gap-3 border-b border-gray-700">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <ConstructionIcon className="text-white" sx={{ fontSize: 20 }} />
          </div>
          <span className="font-bold text-lg">ES ERP</span>
          <button className="ml-auto text-gray-400 hover:text-white">
            <MenuIcon sx={{ fontSize: 20 }} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {/* Overview Section */}
          <div className="px-3 mb-4">
            <button
              onClick={() =>
                setSidebarExpanded({ ...sidebarExpanded, overview: !sidebarExpanded.overview })
              }
              className="flex items-center gap-2 text-gray-400 text-sm mb-2 hover:text-white transition-colors w-full"
            >
              {sidebarExpanded.overview ? (
                <ExpandMoreIcon sx={{ fontSize: 16 }} />
              ) : (
                <ChevronRightIcon sx={{ fontSize: 16 }} />
              )}
              <span>Overview</span>
            </button>
            {sidebarExpanded.overview && (
              <div className="space-y-1">
                <button
                  onClick={() => setActiveNav("Dashboard")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    activeNav === "Dashboard"
                      ? "bg-[#3d4a5c] text-white"
                      : "text-gray-300 hover:bg-[#3d4a5c] hover:text-white"
                  }`}
                >
                  <DashboardIcon sx={{ fontSize: 20 }} />
                  <span className="text-sm">Dashboard</span>
                </button>
                <button
                  onClick={() => setActiveNav("Inventory")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    activeNav === "Inventory"
                      ? "bg-[#3d4a5c] text-white"
                      : "text-gray-300 hover:bg-[#3d4a5c] hover:text-white"
                  }`}
                >
                  <InventoryIcon sx={{ fontSize: 20 }} />
                  <span className="text-sm">Inventory</span>
                </button>
                <button
                  onClick={() => setActiveNav("Orders")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    activeNav === "Orders"
                      ? "bg-[#3d4a5c] text-white"
                      : "text-gray-300 hover:bg-[#3d4a5c] hover:text-white"
                  }`}
                >
                  <ShoppingCartIcon sx={{ fontSize: 20 }} />
                  <span className="text-sm">Orders</span>
                </button>
                <button
                  onClick={() => setActiveNav("Transaction")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    activeNav === "Transaction"
                      ? "bg-[#3d4a5c] text-white"
                      : "text-gray-300 hover:bg-[#3d4a5c] hover:text-white"
                  }`}
                >
                  <AccountBalanceIcon sx={{ fontSize: 20 }} />
                  <span className="text-sm">Transaction</span>
                </button>
                <button
                  onClick={() => setActiveNav("Manufacture")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    activeNav === "Manufacture"
                      ? "bg-[#3d4a5c] text-white"
                      : "text-gray-300 hover:bg-[#3d4a5c] hover:text-white"
                  }`}
                >
                  <FactoryIcon sx={{ fontSize: 20 }} />
                  <span className="text-sm">Manufacture</span>
                </button>
                <button
                  onClick={() => setActiveNav("Customers")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    activeNav === "Customers"
                      ? "bg-[#3d4a5c] text-white"
                      : "text-gray-300 hover:bg-[#3d4a5c] hover:text-white"
                  }`}
                >
                  <PeopleIcon sx={{ fontSize: 20 }} />
                  <span className="text-sm">Customers</span>
                </button>
              </div>
            )}
          </div>

          {/* Personal Section */}
          <div className="px-3 mb-4">
            <button
              onClick={() =>
                setSidebarExpanded({ ...sidebarExpanded, personal: !sidebarExpanded.personal })
              }
              className="flex items-center gap-2 text-gray-400 text-sm mb-2 hover:text-white transition-colors w-full"
            >
              {sidebarExpanded.personal ? (
                <ExpandMoreIcon sx={{ fontSize: 16 }} />
              ) : (
                <ChevronRightIcon sx={{ fontSize: 16 }} />
              )}
              <span>Personal</span>
            </button>
            {sidebarExpanded.personal && (
              <div className="space-y-1">
                <button
                  onClick={() => setActiveNav("Message")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    activeNav === "Message"
                      ? "bg-[#3d4a5c] text-white"
                      : "text-gray-300 hover:bg-[#3d4a5c] hover:text-white"
                  }`}
                >
                  <MessageIcon sx={{ fontSize: 20 }} />
                  <span className="text-sm flex-1 text-left">Message</span>
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    1
                  </span>
                </button>
                <button
                  onClick={() => setActiveNav("Activity")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    activeNav === "Activity"
                      ? "bg-[#3d4a5c] text-white"
                      : "text-gray-300 hover:bg-[#3d4a5c] hover:text-white"
                  }`}
                >
                  <TrendingUpIcon sx={{ fontSize: 20 }} />
                  <span className="text-sm">Activity</span>
                </button>
                <button
                  onClick={() => setActiveNav("Site Access IP")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    activeNav === "Site Access IP"
                      ? "bg-[#3d4a5c] text-white"
                      : "text-gray-300 hover:bg-[#3d4a5c] hover:text-white"
                  }`}
                >
                  <NetworkCellIcon sx={{ fontSize: 20 }} />
                  <span className="text-sm">Site Access IP</span>
                </button>
              </div>
            )}
          </div>

          {/* Other Section */}
          <div className="px-3 mb-4">
            <button
              onClick={() =>
                setSidebarExpanded({ ...sidebarExpanded, other: !sidebarExpanded.other })
              }
              className="flex items-center gap-2 text-gray-400 text-sm mb-2 hover:text-white transition-colors w-full"
            >
              {sidebarExpanded.other ? (
                <ExpandMoreIcon sx={{ fontSize: 16 }} />
              ) : (
                <ChevronRightIcon sx={{ fontSize: 16 }} />
              )}
              <span>Other</span>
            </button>
            {sidebarExpanded.other && (
              <div className="space-y-1">
                <button
                  onClick={() => setActiveNav("General View")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    activeNav === "General View"
                      ? "bg-[#3d4a5c] text-white"
                      : "text-gray-300 hover:bg-[#3d4a5c] hover:text-white"
                  }`}
                >
                  <RemoveRedEyeIcon sx={{ fontSize: 20 }} />
                  <span className="text-sm">General View</span>
                </button>
                <button
                  onClick={() => setActiveNav("Reports")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    activeNav === "Reports"
                      ? "bg-[#3d4a5c] text-white"
                      : "text-gray-300 hover:bg-[#3d4a5c] hover:text-white"
                  }`}
                >
                  <DescriptionIcon sx={{ fontSize: 20 }} />
                  <span className="text-sm">Reports</span>
                </button>
              </div>
            )}
          </div>

          {/* General Section */}
          <div className="px-3">
            <button
              onClick={() =>
                setSidebarExpanded({ ...sidebarExpanded, general: !sidebarExpanded.general })
              }
              className="flex items-center gap-2 text-gray-400 text-sm hover:text-white transition-colors w-full"
            >
              {sidebarExpanded.general ? (
                <ExpandMoreIcon sx={{ fontSize: 16 }} />
              ) : (
                <ChevronRightIcon sx={{ fontSize: 16 }} />
              )}
              <span>General</span>
            </button>
          </div>
        </nav>

        {/* Bottom Actions */}
        <div className="border-t border-gray-700 p-3 space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-[#3d4a5c] hover:text-white transition-colors">
            <HelpCenterIcon sx={{ fontSize: 20 }} />
            <span className="text-sm">Help Center</span>
            <ArrowForwardIcon className="ml-auto" sx={{ fontSize: 16 }} />
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-[#3d4a5c] hover:text-white transition-colors">
            <SettingsIcon sx={{ fontSize: 20 }} />
            <span className="text-sm">Settings</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="search"
                placeholder="Search here.."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              />
              <SearchIcon className="text-gray-400 absolute left-3 top-2.5" sx={{ fontSize: 20 }} />
              <span className="absolute right-3 top-2.5 text-xs text-gray-400 border border-gray-300 px-1.5 py-0.5 rounded">
                ⌘/
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Refresh */}
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <RefreshIcon className="text-gray-600" sx={{ fontSize: 20 }} />
            </button>

            {/* Location Selector */}
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <LocationOnIcon className="text-gray-600" sx={{ fontSize: 18 }} />
              <span className="text-sm text-gray-700">Austin</span>
              <ExpandMoreIcon className="text-gray-600" sx={{ fontSize: 18 }} />
            </button>

            {/* Date Range */}
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <CalendarTodayIcon className="text-gray-600" sx={{ fontSize: 16 }} />
              <span className="text-sm text-gray-700">01/04/2024 - 31/03/2025</span>
            </button>

            {/* Submit Button */}
            <button className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors">
              Submit
            </button>

            {/* User Avatar */}
            <div className="w-9 h-9 bg-teal-500 rounded-full flex items-center justify-center text-white font-medium">
              A
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {/* Location Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">AUSTIN</h2>
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
            {/* Sale Card */}
            <DashboardCard title="Sale">
              <div className="flex items-center justify-center gap-2 py-2">
                <GaugeChart value={75} color="#10b981" label="Sale" />
                <GaugeChart value={60} color="#f59e0b" label="Due" />
                <GaugeChart value={45} color="#f59e0b" label="Amount" />
              </div>
            </DashboardCard>

            {/* Purchase Card */}
            <DashboardCard title="Purchase">
              <div className="flex items-center justify-center gap-2 py-2">
                <GaugeChart value={85} color="#0ea5e9" label="Purchase" />
                <GaugeChart value={55} color="#f59e0b" label="Due" />
                <GaugeChart value={70} color="#f59e0b" label="Amount" />
              </div>
            </DashboardCard>

            {/* Sale Interest Card */}
            <DashboardCard title="Sale interest">
              <div className="flex items-center justify-center gap-2 py-2">
                <GaugeChart value={50} color="#84cc16" label="Count" />
                <GaugeChart value={90} color="#0ea5e9" label="Sale" />
                <GaugeChart value={65} color="#f59e0b" label="Interest" />
              </div>
            </DashboardCard>

            {/* Sale Available Card */}
            <DashboardCard title="Sale available for fetch">
              <div className="flex items-center justify-center gap-2 py-2">
                <GaugeChart value={40} color="#84cc16" label="Cert" />
                <GaugeChart value={75} color="#f59e0b" label="Loose" />
                <GaugeChart value={55} color="#f59e0b" label="Amount" />
              </div>
            </DashboardCard>
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Stock View Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Stock view</h3>
                <button className="text-gray-400 hover:text-gray-600">
                  <OpenInNewIcon sx={{ fontSize: 20 }} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setActiveStockTab("Stock view")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeStockTab === "Stock view"
                      ? "bg-teal-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Stock view
                </button>
                <button
                  onClick={() => setActiveStockTab("Stock detail")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeStockTab === "Stock detail"
                      ? "bg-teal-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Stock detail
                </button>
              </div>

              <div className="flex items-center gap-8">
                {/* Legend */}
                <div className="space-y-3">
                  {[
                    { label: "Sale", color: "#f59e0b", value: "936.5" },
                    { label: "Opening", color: "#0ea5e9", value: "762.12" },
                    { label: "Stock", color: "#a855f7", value: "230.25" },
                    { label: "Purchase", color: "#06b6d4", value: "152.36" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm text-gray-700 flex-1">{item.label}</span>
                      <span className="text-sm font-medium text-gray-900">{item.value}</span>
                    </div>
                  ))}
                </div>

                {/* Pie Chart */}
                <div className="flex-1 flex items-center justify-center">
                  <StockViewPieChart />
                </div>
              </div>
            </div>

            {/* Import Polish Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Import polish</h3>
                <button className="text-gray-400 hover:text-gray-600">
                  <OpenInNewIcon sx={{ fontSize: 20 }} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-6">
                {["Austin pending", "Available to fetch", "Final transferred"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActivePolishTab(tab)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activePolishTab === tab
                        ? "bg-teal-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-8">
                {/* Legend */}
                <div className="space-y-3">
                  {[
                    { label: "Boxes", color: "#06b6d4", value: "1.02" },
                    { label: "Cert", color: "#a855f7", value: "2.17" },
                    { label: "Loose", color: "#f59e0b", value: "5.81" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm text-gray-700 flex-1">{item.label}</span>
                      <span className="text-sm font-medium text-gray-900">{item.value}</span>
                    </div>
                  ))}
                </div>

                {/* Pie Chart */}
                <div className="flex-1 flex items-center justify-center">
                  <ImportPolishPieChart />
                </div>
              </div>
            </div>
          </div>

          {/* Third Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sale Overview Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Sale overview</h3>
                <button className="text-gray-400 hover:text-gray-600">
                  <OpenInNewIcon sx={{ fontSize: 20 }} />
                </button>
              </div>

              <div className="mb-4">
                <div className="text-3xl font-bold text-gray-900">₹8,13,865</div>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <span>↑ 1.6%</span>
                  <span className="text-gray-500">vs last month</span>
                </div>
              </div>

              {/* Line Chart */}
              <div className="h-48">
                <SaleOverviewLineChart />
              </div>
            </div>

            {/* Export Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Export</h3>
                <button className="text-gray-400 hover:text-gray-600">
                  <OpenInNewIcon sx={{ fontSize: 20 }} />
                </button>
              </div>

              {/* Bar Chart */}
              <div className="h-64">
                <ExportBarChart />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Dashboard Card Component
function DashboardCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <OpenInNewIcon sx={{ fontSize: 20 }} />
        </button>
      </div>
      {children}
    </div>
  );
}

// Gauge Chart Component (replaces DonutChart)
function GaugeChart({ value, color, label }: { value: number; color: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <Gauge
        width={100}
        height={100}
        value={value}
        valueMin={0}
        valueMax={100}
        sx={{
          [`& .MuiGauge-valueArc`]: {
            fill: color,
          },
          [`& .MuiGauge-referenceArc`]: {
            fill: "#e5e7eb",
          },
        }}
        text={label}
      />
      <div className="flex items-center gap-1 mt-1">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
        <span className="text-xs text-gray-500">
          {label === "Sale" || label === "Purchase" ? "Sale" : "Due"}
        </span>
      </div>
    </div>
  );
}

// Stock View Pie Chart
function StockViewPieChart() {
  const data = [
    { id: 0, value: 936.5, label: "Sale", color: "#f59e0b" },
    { id: 1, value: 762.12, label: "Opening", color: "#0ea5e9" },
    { id: 2, value: 230.25, label: "Stock", color: "#a855f7" },
    { id: 3, value: 152.36, label: "Purchase", color: "#06b6d4" },
  ];

  return (
    <PieChart
      series={[
        {
          data,
          highlightScope: { fade: "global", highlight: "item" },
          innerRadius: 40,
          outerRadius: 80,
          paddingAngle: 2,
          cornerRadius: 4,
        },
      ]}
      width={200}
      height={200}
      margin={{ right: 5 }}
    />
  );
}

// Import Polish Pie Chart
function ImportPolishPieChart() {
  const data = [
    { id: 0, value: 1.02, label: "Boxes", color: "#06b6d4" },
    { id: 1, value: 2.17, label: "Cert", color: "#a855f7" },
    { id: 2, value: 5.81, label: "Loose", color: "#f59e0b" },
  ];

  return (
    <PieChart
      series={[
        {
          data,
          highlightScope: { fade: "global", highlight: "item" },
          innerRadius: 40,
          outerRadius: 80,
          paddingAngle: 2,
          cornerRadius: 4,
        },
      ]}
      width={200}
      height={200}
      margin={{ right: 5 }}
    />
  );
}

// Sale Overview Line Chart
function SaleOverviewLineChart() {
  const thisMonthData = [2.0, 2.3, 2.2, 3.2, 3.0, 3.8];
  const lastMonthData = [2.2, 3.0, 2.7, 2.5, 3.2, 3.0];

  return (
    <LineChart
      xAxis={[{ data: [0, 1, 2, 3, 4, 5], scaleType: "point" }]}
      series={[
        {
          data: thisMonthData,
          label: "This Month",
          color: "#3b82f6",
          curve: "linear",
        },
        {
          data: lastMonthData,
          label: "Last Month",
          color: "#ef4444",
          curve: "linear",
        },
      ]}
      height={200}
      margin={{ left: 50, right: 10, top: 30, bottom: 30 }}
      grid={{ vertical: false, horizontal: true }}
    />
  );
}

// Export Bar Chart
function ExportBarChart() {
  return (
    <BarChart
      xAxis={[
        {
          scaleType: "band",
          data: ["Jane", "Warren", "Esther", "Cody", "Albert", "Richards"],
        },
      ]}
      series={[
        {
          data: [4.5, 5.5, 1.8, 4.2, 5.2, 3.8],
          color: "#0d9488",
        },
      ]}
      height={256}
      margin={{ left: 50, right: 10, top: 10, bottom: 40 }}
      grid={{ horizontal: true }}
    />
  );
}
