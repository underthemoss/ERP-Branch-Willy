"use client";

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

  const navItems = [
    { name: "Overview", icon: "▲", hasSubmenu: true },
    { name: "Dashboard", icon: "📊", active: true },
    { name: "Inventory", icon: "📦" },
    { name: "Orders", icon: "📋" },
    { name: "Transaction", icon: "💳" },
    { name: "Manufacture", icon: "🏭" },
    { name: "Customers", icon: "👥" },
  ];

  const personalItems = [
    { name: "Message", icon: "💬", badge: 1 },
    { name: "Activity", icon: "📈" },
    { name: "Site Access IP", icon: "🌐" },
  ];

  const otherItems = [
    { name: "General View", icon: "◯" },
    { name: "Reports", icon: "📄" },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-60 bg-[#2D3748] text-white flex flex-col">
        {/* Logo */}
        <div className="p-4 flex items-center gap-3 border-b border-gray-700">
          <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
            <span className="text-[#2D3748] font-bold text-lg">◆</span>
          </div>
          <span className="font-bold text-lg">GemMatrix</span>
          <button className="ml-auto text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
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
              <span className="text-xs">{sidebarExpanded.overview ? "▼" : "▶"}</span>
              <span>Overview</span>
            </button>
            {sidebarExpanded.overview && (
              <div className="space-y-1">
                {navItems.slice(1).map((item) => (
                  <button
                    key={item.name}
                    onClick={() => setActiveNav(item.name)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      activeNav === item.name
                        ? "bg-[#3d4a5c] text-white"
                        : "text-gray-300 hover:bg-[#3d4a5c] hover:text-white"
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span className="text-sm">{item.name}</span>
                  </button>
                ))}
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
              <span className="text-xs">{sidebarExpanded.personal ? "▼" : "▶"}</span>
              <span>Personal</span>
            </button>
            {sidebarExpanded.personal && (
              <div className="space-y-1">
                {personalItems.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => setActiveNav(item.name)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      activeNav === item.name
                        ? "bg-[#3d4a5c] text-white"
                        : "text-gray-300 hover:bg-[#3d4a5c] hover:text-white"
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span className="text-sm flex-1 text-left">{item.name}</span>
                    {item.badge && (
                      <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
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
              <span className="text-xs">{sidebarExpanded.other ? "▼" : "▶"}</span>
              <span>Other</span>
            </button>
            {sidebarExpanded.other && (
              <div className="space-y-1">
                {otherItems.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => setActiveNav(item.name)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      activeNav === item.name
                        ? "bg-[#3d4a5c] text-white"
                        : "text-gray-300 hover:bg-[#3d4a5c] hover:text-white"
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span className="text-sm">{item.name}</span>
                  </button>
                ))}
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
              <span className="text-xs">{sidebarExpanded.general ? "▼" : "▶"}</span>
              <span>General</span>
            </button>
          </div>
        </nav>

        {/* Bottom Actions */}
        <div className="border-t border-gray-700 p-3 space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-[#3d4a5c] hover:text-white transition-colors">
            <span>❓</span>
            <span className="text-sm">Help Center</span>
            <span className="ml-auto text-gray-500">→</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-[#3d4a5c] hover:text-white transition-colors">
            <span>⚙️</span>
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
              <svg
                className="w-5 h-5 text-gray-400 absolute left-3 top-2.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span className="absolute right-3 top-2.5 text-xs text-gray-400 border border-gray-300 px-1.5 py-0.5 rounded">
                ⌘/
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Refresh */}
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>

            {/* Location Selector */}
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <svg
                className="w-4 h-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="text-sm text-gray-700">Austin</span>
              <svg
                className="w-4 h-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Date Range */}
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <svg
                className="w-4 h-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
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
              <div className="flex items-center justify-center gap-4 py-4">
                <DonutChart value={75} color="#10b981" label="Sale" />
                <DonutChart value={60} color="#f59e0b" label="Due" />
                <DonutChart value={45} color="#f59e0b" label="Amount" />
              </div>
            </DashboardCard>

            {/* Purchase Card */}
            <DashboardCard title="Purchase">
              <div className="flex items-center justify-center gap-4 py-4">
                <DonutChart value={85} color="#0ea5e9" label="Purchase" />
                <DonutChart value={55} color="#f59e0b" label="Due" />
                <DonutChart value={70} color="#f59e0b" label="Amount" />
              </div>
            </DashboardCard>

            {/* Sale Interest Card */}
            <DashboardCard title="Sale interest">
              <div className="flex items-center justify-center gap-4 py-4">
                <DonutChart value={50} color="#84cc16" label="Count" />
                <DonutChart value={90} color="#0ea5e9" label="Sale" />
                <DonutChart value={65} color="#f59e0b" label="Interest" />
              </div>
            </DashboardCard>

            {/* Sale Available Card */}
            <DashboardCard title="Sale available for fetch">
              <div className="flex items-center justify-center gap-4 py-4">
                <DonutChart value={40} color="#84cc16" label="Cert" />
                <DonutChart value={75} color="#f59e0b" label="Loose" />
                <DonutChart value={55} color="#f59e0b" label="Amount" />
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
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
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
                  <PieChart />
                </div>
              </div>
            </div>

            {/* Import Polish Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Import polish</h3>
                <button className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
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
                  <PieChart2 />
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
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
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
                <LineChart />
              </div>
            </div>

            {/* Export Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Export</h3>
                <button className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </button>
              </div>

              {/* Bar Chart */}
              <div className="h-64">
                <BarChart />
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
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </button>
      </div>
      {children}
    </div>
  );
}

// Donut Chart Component
function DonutChart({ value, color, label }: { value: number; color: string; label: string }) {
  const circumference = 2 * Math.PI * 35;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 transform -rotate-90">
          <circle cx="40" cy="40" r="35" stroke="#e5e7eb" strokeWidth="6" fill="none" />
          <circle
            cx="40"
            cy="40"
            r="35"
            stroke={color}
            strokeWidth="6"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-gray-700">{label}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 mt-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
        <span className="text-xs text-gray-500">
          {label === "Sale" || label === "Purchase" ? "Sale" : "Due"}
        </span>
      </div>
    </div>
  );
}

// Pie Chart Component
function PieChart() {
  return (
    <svg viewBox="0 0 200 200" className="w-48 h-48">
      <circle cx="100" cy="100" r="80" fill="#f59e0b" />
      <path d="M 100 100 L 100 20 A 80 80 0 0 1 180 100 Z" fill="#06b6d4" />
      <path d="M 100 100 L 180 100 A 80 80 0 0 1 130 170 Z" fill="#a855f7" />
      <path d="M 100 100 L 130 170 A 80 80 0 0 1 20 100 Z" fill="#0ea5e9" />
      <text x="100" y="85" textAnchor="middle" className="text-2xl font-bold fill-white">
        100
      </text>
      <text x="100" y="105" textAnchor="middle" className="text-xs fill-white">
        Total
      </text>
      <text x="140" y="55" className="text-sm font-medium fill-white">
        12
      </text>
      <text x="150" y="130" className="text-sm font-medium fill-white">
        30
      </text>
      <text x="70" y="180" className="text-sm font-medium fill-white">
        70
      </text>
    </svg>
  );
}

// Pie Chart 2 Component
function PieChart2() {
  return (
    <svg viewBox="0 0 200 200" className="w-48 h-48">
      <circle cx="100" cy="100" r="80" fill="#f59e0b" />
      <path d="M 100 100 L 100 20 A 80 80 0 0 1 160 60 Z" fill="#06b6d4" />
      <path d="M 100 100 L 160 60 A 80 80 0 0 1 180 100 Z" fill="#a855f7" />
      <text x="100" y="85" textAnchor="middle" className="text-xl font-bold fill-white">
        9.00
      </text>
      <text x="100" y="105" textAnchor="middle" className="text-xs fill-white">
        Total
      </text>
      <text x="130" y="45" className="text-sm font-medium fill-white">
        1.02
      </text>
      <text x="165" y="80" className="text-sm font-medium fill-white">
        2.17
      </text>
      <text x="130" y="140" className="text-sm font-medium fill-white">
        5.81
      </text>
    </svg>
  );
}

// Line Chart Component
function LineChart() {
  return (
    <svg viewBox="0 0 400 150" className="w-full h-full">
      {/* Grid lines */}
      <line x1="40" y1="20" x2="40" y2="130" stroke="#e5e7eb" strokeWidth="1" />
      <line x1="40" y1="130" x2="380" y2="130" stroke="#e5e7eb" strokeWidth="1" />

      {/* This Month Line */}
      <polyline
        points="40,80 100,70 160,75 220,45 280,50 340,30"
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2"
      />

      {/* Last Month Line */}
      <polyline
        points="40,75 100,50 160,60 220,65 280,45 340,50"
        fill="none"
        stroke="#ef4444"
        strokeWidth="2"
      />

      {/* Dots for This Month */}
      {[40, 100, 160, 220, 280, 340].map((x, i) => (
        <circle key={`this-${i}`} cx={x} cy={[80, 70, 75, 45, 50, 30][i]} r="4" fill="#3b82f6" />
      ))}

      {/* Dots for Last Month */}
      {[40, 100, 160, 220, 280, 340].map((x, i) => (
        <circle key={`last-${i}`} cx={x} cy={[75, 50, 60, 65, 45, 50][i]} r="4" fill="#ef4444" />
      ))}

      {/* X-axis labels */}
      {["Jan", "Feb", "Mar", "Apr", "Mai", "Jun"].map((month, i) => (
        <text
          key={month}
          x={40 + i * 60}
          y="145"
          textAnchor="middle"
          className="text-xs fill-gray-600"
        >
          {month}
        </text>
      ))}

      {/* Y-axis labels */}
      <text x="30" y="130" textAnchor="end" className="text-xs fill-gray-600">
        0
      </text>
      <text x="30" y="90" textAnchor="end" className="text-xs fill-gray-600">
        $2M
      </text>
      <text x="30" y="50" textAnchor="end" className="text-xs fill-gray-600">
        $4M
      </text>
      <text x="30" y="25" textAnchor="end" className="text-xs fill-gray-600">
        $6M
      </text>

      {/* Legend */}
      <circle cx="250" cy="10" r="4" fill="#3b82f6" />
      <text x="260" y="14" className="text-xs fill-gray-700">
        This Month
      </text>
      <circle cx="330" cy="10" r="4" fill="#ef4444" />
      <text x="340" y="14" className="text-xs fill-gray-700">
        Last Month
      </text>
    </svg>
  );
}

// Bar Chart Component
function BarChart() {
  const names = ["Jane", "Warren", "Esther", "Cody", "Albert", "Richards"];
  const values = [4.5, 5.5, 1.8, 4.2, 5.2, 3.8];
  const maxValue = 6;

  return (
    <svg viewBox="0 0 400 200" className="w-full h-full">
      {/* Y-axis labels */}
      <text x="35" y="30" textAnchor="end" className="text-xs fill-gray-600">
        $6M
      </text>
      <text x="35" y="80" textAnchor="end" className="text-xs fill-gray-600">
        $4M
      </text>
      <text x="35" y="130" textAnchor="end" className="text-xs fill-gray-600">
        $2M
      </text>
      <text x="35" y="180" textAnchor="end" className="text-xs fill-gray-600">
        0
      </text>

      {/* Grid lines */}
      <line x1="45" y1="30" x2="380" y2="30" stroke="#e5e7eb" strokeWidth="1" />
      <line x1="45" y1="80" x2="380" y2="80" stroke="#e5e7eb" strokeWidth="1" />
      <line x1="45" y1="130" x2="380" y2="130" stroke="#e5e7eb" strokeWidth="1" />
      <line x1="45" y1="180" x2="380" y2="180" stroke="#e5e7eb" strokeWidth="1" />

      {/* Bars */}
      {names.map((name, i) => {
        const barHeight = (values[i] / maxValue) * 150;
        const x = 55 + i * 55;
        const y = 180 - barHeight;

        return (
          <g key={name}>
            <rect
              x={x}
              y={y}
              width="35"
              height={barHeight}
              fill="#0d9488"
              rx="4"
              className="hover:fill-teal-700 transition-colors cursor-pointer"
            />
            <text x={x + 17.5} y="195" textAnchor="middle" className="text-xs fill-gray-700">
              {name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
