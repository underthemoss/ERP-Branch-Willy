"use client";

import { Building2, GitBranch, List, MapPin, Pencil, Plus, Search, Users } from "lucide-react";
import { useParams } from "next/navigation";
import * as React from "react";
import { BusinessUnitsTab } from "./components/BusinessUnitsTab";
import { useResourceMapTags } from "./components/hooks/useResourceMapTags";
import { LocationsTab } from "./components/LocationsTab";
import { RolesTab } from "./components/RolesTab";
import { TagDetailDrawer } from "./components/TagDetailDrawer";
import { ViewResourcesMode } from "./components/ViewResourcesMode";

// Tag types
export type ResourceMapTagType = "LOCATION" | "BUSINESS_UNIT" | "ROLE";

// View modes
export type ResourceMapViewMode = "create-tags" | "view-resources";

// Tab configuration
const TABS = [
  {
    id: "LOCATION" as ResourceMapTagType,
    label: "Locations",
    icon: MapPin,
    description: "Geographic locations with map metadata",
  },
  {
    id: "BUSINESS_UNIT" as ResourceMapTagType,
    label: "Business Units",
    icon: Building2,
    description: "Organizational divisions and departments",
  },
  {
    id: "ROLE" as ResourceMapTagType,
    label: "Roles",
    icon: Users,
    description: "Job roles and responsibilities",
  },
];

export default function ResourceMapPage() {
  const { workspace_id } = useParams<{ workspace_id: string }>();
  const [pageMode, setPageMode] = React.useState<ResourceMapViewMode>("create-tags");
  const [activeTab, setActiveTab] = React.useState<ResourceMapTagType>("LOCATION");
  const [viewMode, setViewMode] = React.useState<"tree" | "list">("tree");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = React.useState(false);

  // Use the hook to get tags and createTag function for the active tab
  const { tags, createTag, refetch } = useResourceMapTags({
    workspaceId: workspace_id,
    tagType: activeTab,
    searchTerm: "",
  });

  const activeTabConfig = TABS.find((t) => t.id === activeTab);

  const handleOpenCreateDrawer = () => {
    setIsCreateDrawerOpen(true);
  };

  const handleCloseCreateDrawer = () => {
    setIsCreateDrawerOpen(false);
  };

  const handleSaveTag = async () => {
    setIsCreateDrawerOpen(false);
    // Refetch to update the list
    await refetch();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-7xl px-4 py-6">
        {/* Header with Mode Toggle */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Resource Map</h1>
              <p className="text-gray-600">
                {pageMode === "create-tags"
                  ? "Organize and manage your locations, business units, and roles in hierarchical structures"
                  : "View and filter resources by their assigned tags"}
              </p>
            </div>

            {/* Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1 self-start">
              <button
                onClick={() => setPageMode("create-tags")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  pageMode === "create-tags"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Pencil className="w-4 h-4" />
                Create Tags
              </button>
              <button
                onClick={() => setPageMode("view-resources")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  pageMode === "view-resources"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Users className="w-4 h-4" />
                View Resources
              </button>
            </div>
          </div>
        </div>

        {/* View Resources Mode */}
        {pageMode === "view-resources" && <ViewResourcesMode workspaceId={workspace_id} />}

        {/* Create Tags Mode - Tab Navigation */}
        {pageMode === "create-tags" && (
          <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px" aria-label="Tabs">
                  {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                      group relative flex-1 py-4 px-6 text-center font-medium text-sm
                      border-b-2 transition-colors duration-200
                      ${
                        isActive
                          ? "border-blue-500 text-blue-600 bg-blue-50/50"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }
                    `}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Icon
                            className={`w-5 h-5 ${isActive ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500"}`}
                          />
                          <span>{tab.label}</span>
                        </div>
                        {isActive && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Tab Description & Actions Bar */}
              <div className="p-4 bg-gray-50/50 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{activeTabConfig?.description}</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder={`Search ${activeTabConfig?.label.toLowerCase()}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-64"
                      />
                    </div>

                    {/* View Toggle */}
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setViewMode("tree")}
                        className={`p-2 rounded-md transition-colors ${
                          viewMode === "tree"
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                        title="Tree View"
                      >
                        <GitBranch className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode("list")}
                        className={`p-2 rounded-md transition-colors ${
                          viewMode === "list"
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                        title="List View"
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Create Button */}
                    <button
                      onClick={handleOpenCreateDrawer}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Add {activeTabConfig?.label.slice(0, -1)}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {activeTab === "LOCATION" && (
                <LocationsTab
                  workspaceId={workspace_id}
                  viewMode={viewMode}
                  searchTerm={searchTerm}
                />
              )}
              {activeTab === "BUSINESS_UNIT" && (
                <BusinessUnitsTab
                  workspaceId={workspace_id}
                  viewMode={viewMode}
                  searchTerm={searchTerm}
                />
              )}
              {activeTab === "ROLE" && (
                <RolesTab workspaceId={workspace_id} viewMode={viewMode} searchTerm={searchTerm} />
              )}
            </div>
          </>
        )}
      </div>

      {/* Create Tag Drawer */}
      <TagDetailDrawer
        open={isCreateDrawerOpen}
        onClose={handleCloseCreateDrawer}
        tag={null}
        tagType={activeTab}
        onSave={handleSaveTag}
        createTag={createTag}
        allTags={tags}
      />
    </div>
  );
}
