"use client";

import { graphql } from "@/graphql";
import { ResourceMapTagType, useListContactsForResourceMapQuery } from "@/graphql/hooks";
import { MAPBOX_STYLE, MAPBOX_TOKEN } from "@/providers/MapboxProvider";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Filter,
  MapPin,
  Maximize2,
  User,
  Users,
} from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";
import * as React from "react";
import Map, {
  GeolocateControl,
  Marker,
  NavigationControl,
  Popup,
  type MapRef,
  type ViewStateChangeEvent,
} from "react-map-gl/mapbox";
import { useResourceMapTags } from "./hooks/useResourceMapTags";
import { ResourceMapTag } from "./types";

// GraphQL query to get contacts with resource_map_entries
graphql(`
  query ListContactsForResourceMap($workspaceId: String!, $page: ListContactsPage!) {
    listContacts(filter: { workspaceId: $workspaceId, contactType: PERSON }, page: $page) {
      items {
        ... on PersonContact {
          __typename
          id
          name
          email
          phone
          profilePicture
          personType
          businessId
          resourceMapIds
          resource_map_entries {
            id
            value
            tagType
            parent_id
            path
            map_point {
              lat
              lng
            }
            location {
              latLng {
                lat
                lng
              }
            }
          }
        }
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

interface ViewResourcesModeProps {
  workspaceId: string;
}

interface FilterState {
  locations: string[];
  businessUnits: string[];
  roles: string[];
}

// Contact with location info extracted
interface ContactWithLocation {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  profilePicture?: string | null;
  personType?: string | null;
  businessId?: string | null;
  resourceMapIds?: string[] | null;
  roleTag?: { id: string; value: string } | null;
  businessUnitTag?: { id: string; value: string } | null;
  locationTag?: { id: string; value: string; lat?: number; lng?: number } | null;
  lat?: number;
  lng?: number;
}

export function ViewResourcesMode({ workspaceId }: ViewResourcesModeProps) {
  const [filters, setFilters] = React.useState<FilterState>({
    locations: [],
    businessUnits: [],
    roles: [],
  });
  const [expandedSections, setExpandedSections] = React.useState<{
    locations: boolean;
    businessUnits: boolean;
    roles: boolean;
  }>({
    locations: true,
    businessUnits: true,
    roles: true,
  });
  const [selectedContactId, setSelectedContactId] = React.useState<string | null>(null);

  // Fetch all tags for each type
  const { tags: locationTags } = useResourceMapTags({
    workspaceId,
    tagType: "LOCATION",
    searchTerm: "",
  });

  const { tags: businessUnitTags } = useResourceMapTags({
    workspaceId,
    tagType: "BUSINESS_UNIT",
    searchTerm: "",
  });

  const { tags: roleTags } = useResourceMapTags({
    workspaceId,
    tagType: "ROLE",
    searchTerm: "",
  });

  // Fetch contacts
  const { data: contactsData, loading: contactsLoading } = useListContactsForResourceMapQuery({
    variables: {
      workspaceId,
      page: { number: 1, size: 500 }, // Get all contacts for now
    },
    fetchPolicy: "cache-and-network",
  });

  // Process contacts to extract location and tag information
  const processedContacts = React.useMemo<ContactWithLocation[]>(() => {
    const items = contactsData?.listContacts?.items || [];
    return items
      .filter(
        (item): item is NonNullable<typeof item> =>
          item !== null && item.__typename === "PersonContact",
      )
      .map((contact) => {
        const entries = contact.resource_map_entries || [];

        // Find tags by type
        const roleEntry = entries.find((e) => e?.tagType === ResourceMapTagType.Role);
        const businessUnitEntry = entries.find(
          (e) => e?.tagType === ResourceMapTagType.BusinessUnit,
        );
        const locationEntry = entries.find((e) => e?.tagType === ResourceMapTagType.Location);

        // Get location coordinates from location tag (location.latLng or map_point)
        const lat =
          locationEntry?.location?.latLng?.lat ?? locationEntry?.map_point?.lat ?? undefined;
        const lng =
          locationEntry?.location?.latLng?.lng ?? locationEntry?.map_point?.lng ?? undefined;

        return {
          id: contact.id,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          profilePicture: contact.profilePicture,
          personType: contact.personType,
          businessId: contact.businessId,
          resourceMapIds: contact.resourceMapIds,
          roleTag: roleEntry ? { id: roleEntry.id!, value: roleEntry.value! } : null,
          businessUnitTag: businessUnitEntry
            ? { id: businessUnitEntry.id!, value: businessUnitEntry.value! }
            : null,
          locationTag: locationEntry
            ? { id: locationEntry.id!, value: locationEntry.value!, lat, lng }
            : null,
          lat,
          lng,
        };
      });
  }, [contactsData]);

  // Filter contacts based on selected filters
  const filteredContacts = React.useMemo(() => {
    return processedContacts.filter((contact) => {
      // If no filters, show all
      if (
        filters.locations.length === 0 &&
        filters.businessUnits.length === 0 &&
        filters.roles.length === 0
      ) {
        return true;
      }

      // Check location filter (OR within same filter type)
      if (filters.locations.length > 0) {
        const hasMatchingLocation =
          contact.locationTag && filters.locations.includes(contact.locationTag.id);
        if (!hasMatchingLocation) return false;
      }

      // Check business unit filter
      if (filters.businessUnits.length > 0) {
        const hasMatchingBU =
          contact.businessUnitTag && filters.businessUnits.includes(contact.businessUnitTag.id);
        if (!hasMatchingBU) return false;
      }

      // Check role filter
      if (filters.roles.length > 0) {
        const hasMatchingRole = contact.roleTag && filters.roles.includes(contact.roleTag.id);
        if (!hasMatchingRole) return false;
      }

      return true;
    });
  }, [processedContacts, filters]);

  // Contacts with location data for map
  const contactsWithLocation = React.useMemo(() => {
    return filteredContacts.filter((c) => c.lat !== undefined && c.lng !== undefined);
  }, [filteredContacts]);

  const toggleFilter = (type: keyof FilterState, tagId: string) => {
    setFilters((prev) => ({
      ...prev,
      [type]: prev[type].includes(tagId)
        ? prev[type].filter((id) => id !== tagId)
        : [...prev[type], tagId],
    }));
  };

  const clearAllFilters = () => {
    setFilters({ locations: [], businessUnits: [], roles: [] });
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const totalActiveFilters =
    filters.locations.length + filters.businessUnits.length + filters.roles.length;

  const renderTagFilter = (
    tags: ResourceMapTag[],
    selectedIds: string[],
    type: keyof FilterState,
    icon: React.ReactNode,
    label: string,
    sectionKey: keyof typeof expandedSections,
  ) => (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {selectedIds.length > 0 && (
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
              {selectedIds.length}
            </span>
          )}
        </div>
        {expandedSections[sectionKey] ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {expandedSections[sectionKey] && (
        <div className="px-3 pb-3 space-y-1 max-h-48 overflow-y-auto">
          {tags.length === 0 ? (
            <p className="text-xs text-gray-400 py-2">No {label.toLowerCase()} found</p>
          ) : (
            tags.map((tag) => (
              <label
                key={tag.id}
                className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(tag.id)}
                  onChange={() => toggleFilter(type, tag.id)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600 truncate">{tag.value}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex h-[calc(100vh-220px)] min-h-[500px]">
        {/* Left Panel - Filters */}
        <div className="w-72 border-r border-gray-200 flex flex-col">
          {/* Filter Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-700">Filter by Tags</h3>
              </div>
              {totalActiveFilters > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear all
                </button>
              )}
            </div>
            {totalActiveFilters > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {totalActiveFilters} filter{totalActiveFilters !== 1 ? "s" : ""} active
              </p>
            )}
          </div>

          {/* Filter Sections */}
          <div className="flex-1 overflow-y-auto">
            {renderTagFilter(
              roleTags,
              filters.roles,
              "roles",
              <Users className="w-4 h-4 text-purple-500" />,
              "Roles",
              "roles",
            )}
            {renderTagFilter(
              businessUnitTags,
              filters.businessUnits,
              "businessUnits",
              <Building2 className="w-4 h-4 text-orange-500" />,
              "Business Units",
              "businessUnits",
            )}
            {renderTagFilter(
              locationTags,
              filters.locations,
              "locations",
              <MapPin className="w-4 h-4 text-blue-500" />,
              "Locations",
              "locations",
            )}
          </div>
        </div>

        {/* Right Panel - Map & List */}
        <div className="flex-1 flex flex-col">
          {/* Map View */}
          <div className="flex-1 bg-gray-100 relative">
            {contactsLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">Loading contacts...</div>
              </div>
            ) : contactsWithLocation.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <MapPin className="w-12 h-12 mb-3 text-gray-300" />
                <p className="text-sm font-medium">No contacts with location data</p>
                <p className="text-xs text-gray-400 mt-1">
                  {filteredContacts.length > 0
                    ? `${filteredContacts.length} contacts found, but none have location tags`
                    : "Assign location tags to contacts to see them on the map"}
                </p>
              </div>
            ) : (
              <ResourceMapView
                contacts={contactsWithLocation}
                selectedContactId={selectedContactId}
                onContactSelect={setSelectedContactId}
              />
            )}
          </div>

          {/* Contact List */}
          <div className="h-64 border-t border-gray-200 overflow-hidden flex flex-col">
            <div className="p-3 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-sm font-semibold text-gray-700">
                Filtered Contacts ({filteredContacts.length})
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredContacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <User className="w-8 h-8 mb-2 text-gray-300" />
                  <p className="text-sm">No contacts match filters</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredContacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => setSelectedContactId(contact.id)}
                      className={`w-full p-3 text-left hover:bg-blue-50 transition-colors ${
                        selectedContactId === contact.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold flex-shrink-0">
                          {contact.profilePicture ? (
                            <img
                              src={contact.profilePicture}
                              alt={contact.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            contact.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {contact.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {contact.roleTag && (
                              <span className="truncate">{contact.roleTag.value}</span>
                            )}
                            {contact.roleTag && contact.locationTag && <span>•</span>}
                            {contact.locationTag && (
                              <span className="flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3" />
                                {contact.locationTag.value}
                              </span>
                            )}
                          </div>
                        </div>
                        {contact.lat !== undefined && (
                          <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Default view state (centered on US)
const DEFAULT_VIEW_STATE = {
  longitude: -98.5795,
  latitude: 39.8283,
  zoom: 4,
};

// Mapbox-powered Map View Component for displaying contacts
function ResourceMapView({
  contacts,
  selectedContactId,
  onContactSelect,
}: {
  contacts: ContactWithLocation[];
  selectedContactId: string | null;
  onContactSelect: (id: string) => void;
}) {
  const mapRef = React.useRef<MapRef>(null);
  const [viewState, setViewState] = React.useState(DEFAULT_VIEW_STATE);
  const [popupInfo, setPopupInfo] = React.useState<ContactWithLocation | null>(null);

  // Group contacts by approximate location for clustering
  const contactsByLocation = React.useMemo(() => {
    const groups: Record<string, ContactWithLocation[]> = {};
    contacts.forEach((contact) => {
      // Round to 3 decimal places for grouping (~100m precision)
      const key = `${contact.lat?.toFixed(3)},${contact.lng?.toFixed(3)}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(contact);
    });
    return groups;
  }, [contacts]);

  // Find selected contact
  const selectedContact = contacts.find((c) => c.id === selectedContactId);

  // Center map on selected contact
  React.useEffect(() => {
    if (selectedContact?.lat && selectedContact?.lng && mapRef.current) {
      mapRef.current.flyTo({
        center: [selectedContact.lng, selectedContact.lat],
        zoom: 14,
        duration: 1000,
      });
    }
  }, [selectedContact]);

  // Fit bounds to all markers
  const handleFitBounds = () => {
    if (contacts.length === 0 || !mapRef.current) return;

    const lngs = contacts.map((c) => c.lng).filter(Boolean) as number[];
    const lats = contacts.map((c) => c.lat).filter(Boolean) as number[];

    if (lngs.length === 0) return;

    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    mapRef.current.fitBounds(
      [
        [minLng - 0.1, minLat - 0.1],
        [maxLng + 0.1, maxLat + 0.1],
      ],
      { padding: 50, duration: 1000 },
    );
  };

  return (
    <div className="h-full relative">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt: ViewStateChangeEvent) => setViewState(evt.viewState)}
        mapStyle={MAPBOX_STYLE}
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
      >
        {/* Navigation Controls */}
        <NavigationControl position="bottom-right" />
        <GeolocateControl position="bottom-right" />

        {/* Markers - grouped by location */}
        {Object.entries(contactsByLocation).map(([key, groupContacts]) => {
          const firstContact = groupContacts[0];
          if (!firstContact.lat || !firstContact.lng) return null;

          const isSelected = groupContacts.some((c) => c.id === selectedContactId);
          const isCluster = groupContacts.length > 1;

          return (
            <Marker
              key={key}
              longitude={firstContact.lng}
              latitude={firstContact.lat}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                onContactSelect(firstContact.id);
                setPopupInfo(firstContact);
              }}
            >
              <div
                className={`
                  cursor-pointer transform transition-transform duration-200
                  ${isSelected ? "scale-125" : "hover:scale-110"}
                `}
              >
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center shadow-lg font-semibold text-sm
                    ${isSelected ? "bg-purple-600 ring-4 ring-purple-200" : "bg-purple-500"}
                    text-white
                  `}
                >
                  {isCluster ? (
                    <span>{groupContacts.length}</span>
                  ) : (
                    <span>{firstContact.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                {/* Pin shadow */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/20 rounded-full blur-sm" />
              </div>
            </Marker>
          );
        })}

        {/* Popup */}
        {popupInfo && popupInfo.lat && popupInfo.lng && (
          <Popup
            longitude={popupInfo.lng}
            latitude={popupInfo.lat}
            anchor="bottom"
            offset={[0, -20]}
            closeOnClick={false}
            onClose={() => setPopupInfo(null)}
            className="contact-popup"
          >
            <div className="p-2 min-w-[180px]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-sm flex-shrink-0">
                  {popupInfo.profilePicture ? (
                    <img
                      src={popupInfo.profilePicture}
                      alt={popupInfo.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    popupInfo.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{popupInfo.name}</h3>
                  {popupInfo.roleTag && (
                    <p className="text-xs text-gray-500 truncate">{popupInfo.roleTag.value}</p>
                  )}
                </div>
              </div>
              {popupInfo.locationTag && (
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{popupInfo.locationTag.value}</span>
                </div>
              )}
              <button
                onClick={() => {
                  onContactSelect(popupInfo.id);
                  setPopupInfo(null);
                }}
                className="text-xs text-purple-600 hover:text-purple-700 font-medium"
              >
                View Details
              </button>
            </div>
          </Popup>
        )}
      </Map>

      {/* Custom Controls Overlay */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        {/* Fit All Button */}
        <button
          onClick={handleFitBounds}
          className="bg-white rounded-lg shadow-md p-2 hover:bg-gray-50 transition-colors"
          title="Fit all contacts"
        >
          <Maximize2 className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3 text-xs">
        <div className="font-semibold text-gray-700 mb-2">Legend</div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-purple-500" />
          <span className="text-gray-600">Person</span>
        </div>
      </div>

      {/* Contact Count */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md px-3 py-2 text-xs">
        <span className="font-medium text-gray-700">
          {contacts.length} contact{contacts.length !== 1 ? "s" : ""} on map
        </span>
      </div>
    </div>
  );
}
