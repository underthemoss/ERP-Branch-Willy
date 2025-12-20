// Resource Map Tag Types
export type ResourceMapTagType = "LOCATION" | "BUSINESS_UNIT" | "ROLE";

// Location Metadata Types
export type LocationMetadataKind = "ADDRESS" | "LAT_LNG" | "PLUS_CODE" | "GEOFENCE";

export type GeofenceType = "CIRCLE" | "POLYGON";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface AddressMetadata {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  placeId?: string;
  latLng?: LatLng;
}

export interface LatLngMetadata {
  lat: number;
  lng: number;
  accuracyMeters?: number;
}

export interface PlusCodeMetadata {
  code: string;
  localArea?: string;
  latLng?: LatLng;
}

export interface GeofenceMetadata {
  type: GeofenceType;
  center?: LatLng;
  radiusMeters?: number;
  points?: LatLng[];
}

export interface LocationMetadata {
  kind: LocationMetadataKind;
  address?: AddressMetadata;
  latLng?: LatLngMetadata;
  plusCode?: PlusCodeMetadata;
  geofence?: GeofenceMetadata;
}

// Simplified location with direct lat/lng for map display
export interface SimpleLocation {
  lat: number;
  lng: number;
  kind?: LocationMetadataKind;
}

// Resource Map Tag
export interface ResourceMapTag {
  id: string;
  value: string;
  tagType: ResourceMapTagType;
  parentId: string | null;
  hierarchyId: string | null;
  path: string[];
  location?: SimpleLocation | null;
  locationMetadata?: LocationMetadata | null;
  children?: ResourceMapTag[];
  createdAt?: string;
  updatedAt?: string;
}

// Tree node for drag-and-drop
export interface TreeNode {
  id: string;
  label: string;
  parentId: string | null;
  depth: number;
  children: TreeNode[];
  data: ResourceMapTag;
  isExpanded: boolean;
}

// Drag-and-drop context
export interface DragDropContext {
  activeId: string | null;
  overId: string | null;
  isValidDrop: boolean;
}

// Map bounds for filtering
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Form state for creating/editing tags
export interface TagFormData {
  value: string;
  tagType: ResourceMapTagType;
  parentId: string | null;
  location?: LocationMetadata | null;
}

// API Input types (matching GraphQL inputs)
export interface CreateResourceMapTagInput {
  value: string;
  type: ResourceMapTagType;
  parentId?: string | null;
  location?: LocationMetadataInput | null;
}

export interface UpdateResourceMapTagInput {
  id: string;
  value?: string;
  parentId?: string | null;
  location?: LocationMetadataInput | null;
}

export interface LocationMetadataInput {
  kind: LocationMetadataKind;
  address?: AddressMetadataInput;
  latLng?: LatLngMetadataInput;
  plusCode?: PlusCodeMetadataInput;
  geofence?: GeofenceMetadataInput;
}

export interface AddressMetadataInput {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  placeId?: string;
  lat?: number;
  lng?: number;
}

export interface LatLngMetadataInput {
  lat: number;
  lng: number;
  accuracyMeters?: number;
}

export interface PlusCodeMetadataInput {
  code: string;
  localArea?: string;
  lat?: number;
  lng?: number;
}

export interface GeofenceMetadataInput {
  type: GeofenceType;
  centerLat?: number;
  centerLng?: number;
  radiusMeters?: number;
  points?: { lat: number; lng: number }[];
}
