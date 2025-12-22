"use client";

import { graphql } from "@/graphql";
import {
  ResourceMapTagType as GqlResourceMapTagType,
  ResourceMapGeofenceType,
  ResourceMapLocationType,
  useCreateResourceMapTagMutation,
  useDeleteResourceMapTagMutation,
  useListResourceMapEntriesByTagTypeQuery,
  useUpdateResourceMapTagMutation,
} from "@/graphql/hooks";
import * as React from "react";
import type {
  LocationMetadata,
  LocationMetadataKind,
  ResourceMapTag,
  ResourceMapTagType,
  SimpleLocation,
} from "../types";

// GraphQL query to list resource map entries by tag type
graphql(`
  query ListResourceMapEntriesByTagType($types: [ResourceMapTagType!]!) {
    listResourceMapEntriesByTagType(types: $types) {
      id
      hierarchy_id
      hierarchy_name
      parent_id
      path
      value
      tagType
      location {
        kind
        address {
          line1
          line2
          city
          state
          postalCode
          country
          placeId
        }
        latLng {
          lat
          lng
          accuracyMeters
        }
        plusCode {
          code
          localArea
        }
        geofence {
          type
          center {
            lat
            lng
          }
          radiusMeters
          polygon {
            lat
            lng
          }
        }
      }
      children {
        id
        value
        tagType
        parent_id
        path
      }
    }
  }
`);

// GraphQL mutation to create a resource map tag
graphql(`
  mutation CreateResourceMapTag($input: CreateResourceMapTagInput!) {
    createResourceMapTag(input: $input) {
      id
      value
      tagType
      parent_id
      hierarchy_id
      hierarchy_name
      path
      location {
        kind
        address {
          line1
          city
          state
          postalCode
          country
        }
        latLng {
          lat
          lng
        }
      }
    }
  }
`);

// GraphQL mutation to update a resource map tag
graphql(`
  mutation UpdateResourceMapTag($id: ID!, $input: UpdateResourceMapTagInput!) {
    updateResourceMapTag(id: $id, input: $input) {
      id
      value
      tagType
      parent_id
      hierarchy_id
      hierarchy_name
      path
      location {
        kind
        address {
          line1
          city
          state
          postalCode
          country
        }
        latLng {
          lat
          lng
        }
      }
    }
  }
`);

// GraphQL mutation to delete a resource map tag
graphql(`
  mutation DeleteResourceMapTag($id: ID!, $cascade: Boolean) {
    deleteResourceMapTag(id: $id, cascade: $cascade) {
      id
    }
  }
`);

interface UseResourceMapTagsOptions {
  workspaceId: string;
  tagType: ResourceMapTagType;
  searchTerm?: string;
}

interface UseResourceMapTagsResult {
  tags: ResourceMapTag[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  createTag: (
    value: string,
    parentId?: string | null,
    locationMetadata?: LocationMetadata | null,
  ) => Promise<ResourceMapTag | null>;
  updateTag: (id: string, updates: Partial<ResourceMapTag>) => Promise<ResourceMapTag | null>;
  deleteTag: (id: string) => Promise<boolean>;
  updateTagParent: (tagId: string, newParentId: string | null) => Promise<boolean>;
}

// Map our local tag type to GraphQL enum
function mapTagTypeToGql(tagType: ResourceMapTagType): GqlResourceMapTagType {
  switch (tagType) {
    case "LOCATION":
      return GqlResourceMapTagType.Location;
    case "BUSINESS_UNIT":
      return GqlResourceMapTagType.BusinessUnit;
    case "ROLE":
      return GqlResourceMapTagType.Role;
    default:
      return GqlResourceMapTagType.Location;
  }
}

// Map our local location kind to GraphQL enum
function mapLocationKindToGql(kind: LocationMetadataKind): ResourceMapLocationType {
  switch (kind) {
    case "ADDRESS":
      return ResourceMapLocationType.Address;
    case "LAT_LNG":
      return ResourceMapLocationType.LatLng;
    case "PLUS_CODE":
      return ResourceMapLocationType.PlusCode;
    case "GEOFENCE":
      return ResourceMapLocationType.Geofence;
    default:
      return ResourceMapLocationType.Address;
  }
}

// Map our local geofence type to GraphQL enum
function mapGeofenceTypeToGql(type: "CIRCLE" | "POLYGON"): ResourceMapGeofenceType {
  return type === "CIRCLE" ? ResourceMapGeofenceType.Circle : ResourceMapGeofenceType.Polygon;
}

// Type for API response entry
interface ApiResourceMapEntry {
  id?: string | null;
  value?: string | null;
  tagType?: GqlResourceMapTagType | null;
  parent_id?: string | null;
  hierarchy_id?: string | null;
  path?: (string | null)[] | null;
  location?: {
    kind?: string | null;
    address?: {
      line1?: string | null;
      line2?: string | null;
      city?: string | null;
      state?: string | null;
      postalCode?: string | null;
      country?: string | null;
      placeId?: string | null;
    } | null;
    latLng?: {
      lat?: number | null;
      lng?: number | null;
      accuracyMeters?: number | null;
    } | null;
    plusCode?: {
      code?: string | null;
      localArea?: string | null;
    } | null;
    geofence?: {
      type?: string | null;
      center?: {
        lat?: number | null;
        lng?: number | null;
      } | null;
      radiusMeters?: number | null;
      polygon?: Array<{ lat?: number | null; lng?: number | null } | null> | null;
    } | null;
  } | null;
  children?: Array<{
    id?: string | null;
    value?: string | null;
    tagType?: GqlResourceMapTagType | null;
    parent_id?: string | null;
    path?: (string | null)[] | null;
  } | null> | null;
}

// Transform API response to ResourceMapTag format
function transformToResourceMapTag(entry: ApiResourceMapEntry | null): ResourceMapTag | null {
  if (!entry || !entry.id) return null;

  // Map GQL tag type to our local type
  let localTagType: ResourceMapTagType = "LOCATION";
  if (entry.tagType === GqlResourceMapTagType.BusinessUnit) {
    localTagType = "BUSINESS_UNIT";
  } else if (entry.tagType === GqlResourceMapTagType.Role) {
    localTagType = "ROLE";
  }

  // Transform location metadata
  let locationMetadata: LocationMetadata | null = null;
  let simpleLocation: SimpleLocation | null = null;

  if (entry.location) {
    const loc = entry.location;
    const kind = (loc.kind?.toUpperCase() || "ADDRESS") as LocationMetadataKind;

    locationMetadata = {
      kind,
      address: loc.address
        ? {
            line1: loc.address.line1 || undefined,
            line2: loc.address.line2 || undefined,
            city: loc.address.city || undefined,
            state: loc.address.state || undefined,
            postalCode: loc.address.postalCode || undefined,
            country: loc.address.country || undefined,
            placeId: loc.address.placeId || undefined,
          }
        : undefined,
      latLng: loc.latLng
        ? {
            lat: loc.latLng.lat || 0,
            lng: loc.latLng.lng || 0,
            accuracyMeters: loc.latLng.accuracyMeters || undefined,
          }
        : undefined,
      plusCode: loc.plusCode
        ? {
            code: loc.plusCode.code || "",
            localArea: loc.plusCode.localArea || undefined,
          }
        : undefined,
      geofence: loc.geofence
        ? {
            type: (loc.geofence.type?.toUpperCase() || "CIRCLE") as "CIRCLE" | "POLYGON",
            center: loc.geofence.center
              ? { lat: loc.geofence.center.lat || 0, lng: loc.geofence.center.lng || 0 }
              : undefined,
            radiusMeters: loc.geofence.radiusMeters || undefined,
            points: loc.geofence.polygon
              ?.filter((p) => p && p.lat != null && p.lng != null)
              .map((p) => ({ lat: p!.lat!, lng: p!.lng! })),
          }
        : undefined,
    };

    // Extract simple location for map display
    if (loc.latLng?.lat != null && loc.latLng?.lng != null) {
      simpleLocation = { lat: loc.latLng.lat, lng: loc.latLng.lng, kind };
    } else if (loc.geofence?.center?.lat != null && loc.geofence?.center?.lng != null) {
      simpleLocation = { lat: loc.geofence.center.lat, lng: loc.geofence.center.lng, kind };
    }
  }

  return {
    id: entry.id,
    value: entry.value || "",
    tagType: localTagType,
    parentId: entry.parent_id || null,
    hierarchyId: entry.hierarchy_id || null,
    path: (entry.path?.filter(Boolean) as string[]) || [],
    location: simpleLocation,
    locationMetadata,
    children: entry.children
      ?.map((child) => transformToResourceMapTag(child as ApiResourceMapEntry))
      .filter(Boolean) as ResourceMapTag[] | undefined,
  };
}

export function useResourceMapTags({
  workspaceId,
  tagType,
  searchTerm,
}: UseResourceMapTagsOptions): UseResourceMapTagsResult {
  const gqlTagType = mapTagTypeToGql(tagType);

  const { data, loading, error, refetch } = useListResourceMapEntriesByTagTypeQuery({
    variables: { types: [gqlTagType] },
    fetchPolicy: "cache-and-network",
  });

  const [createResourceMapTag] = useCreateResourceMapTagMutation();
  const [updateResourceMapTag] = useUpdateResourceMapTagMutation();
  const [deleteResourceMapTag] = useDeleteResourceMapTagMutation();

  // Transform and filter tags
  const tags = React.useMemo(() => {
    if (!data?.listResourceMapEntriesByTagType) return [];

    const allTags = data.listResourceMapEntriesByTagType
      .map((entry) => transformToResourceMapTag(entry))
      .filter(Boolean) as ResourceMapTag[];

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return allTags.filter(
        (tag) =>
          tag.value.toLowerCase().includes(term) ||
          tag.path.some((p) => p.toLowerCase().includes(term)),
      );
    }

    return allTags;
  }, [data, searchTerm]);

  // Create a new tag
  const createTag = React.useCallback(
    async (
      value: string,
      parentId?: string | null,
      locationMetadata?: LocationMetadata | null,
    ): Promise<ResourceMapTag | null> => {
      console.log("Creating tag:", { value, parentId, gqlTagType, locationMetadata });

      try {
        const result = await createResourceMapTag({
          variables: {
            input: {
              value,
              type: gqlTagType,
              parentId: parentId || undefined,
              location: locationMetadata
                ? {
                    kind: mapLocationKindToGql(locationMetadata.kind),
                    address: locationMetadata.address
                      ? {
                          line1: locationMetadata.address.line1,
                          line2: locationMetadata.address.line2,
                          city: locationMetadata.address.city,
                          state: locationMetadata.address.state,
                          postalCode: locationMetadata.address.postalCode,
                          country: locationMetadata.address.country,
                          placeId: locationMetadata.address.placeId,
                        }
                      : undefined,
                    latLng: locationMetadata.latLng
                      ? {
                          lat: locationMetadata.latLng.lat,
                          lng: locationMetadata.latLng.lng,
                          accuracyMeters: locationMetadata.latLng.accuracyMeters,
                        }
                      : undefined,
                    plusCode: locationMetadata.plusCode
                      ? {
                          code: locationMetadata.plusCode.code,
                          localArea: locationMetadata.plusCode.localArea,
                        }
                      : undefined,
                    geofence: locationMetadata.geofence
                      ? {
                          type: mapGeofenceTypeToGql(locationMetadata.geofence.type),
                          center: locationMetadata.geofence.center
                            ? {
                                lat: locationMetadata.geofence.center.lat,
                                lng: locationMetadata.geofence.center.lng,
                              }
                            : undefined,
                          radiusMeters: locationMetadata.geofence.radiusMeters,
                          polygon: locationMetadata.geofence.points,
                        }
                      : undefined,
                  }
                : undefined,
            },
          },
        });

        if (result.data?.createResourceMapTag) {
          await refetch();
          return transformToResourceMapTag(result.data.createResourceMapTag);
        }

        return null;
      } catch (err) {
        console.error("Failed to create tag:", err);
        throw err;
      }
    },
    [gqlTagType, createResourceMapTag, refetch],
  );

  // Update an existing tag
  const updateTag = React.useCallback(
    async (id: string, updates: Partial<ResourceMapTag>): Promise<ResourceMapTag | null> => {
      console.log("Updating tag:", { id, updates });

      try {
        const result = await updateResourceMapTag({
          variables: {
            id,
            input: {
              value: updates.value,
              parentId: updates.parentId,
              location: updates.locationMetadata
                ? {
                    kind: mapLocationKindToGql(updates.locationMetadata.kind),
                    address: updates.locationMetadata.address
                      ? {
                          line1: updates.locationMetadata.address.line1,
                          line2: updates.locationMetadata.address.line2,
                          city: updates.locationMetadata.address.city,
                          state: updates.locationMetadata.address.state,
                          postalCode: updates.locationMetadata.address.postalCode,
                          country: updates.locationMetadata.address.country,
                        }
                      : undefined,
                    latLng: updates.locationMetadata.latLng
                      ? {
                          lat: updates.locationMetadata.latLng.lat,
                          lng: updates.locationMetadata.latLng.lng,
                        }
                      : undefined,
                  }
                : undefined,
            },
          },
        });

        if (result.data?.updateResourceMapTag) {
          await refetch();
          return transformToResourceMapTag(result.data.updateResourceMapTag);
        }

        return null;
      } catch (err) {
        console.error("Failed to update tag:", err);
        throw err;
      }
    },
    [updateResourceMapTag, refetch],
  );

  // Delete a tag
  const deleteTag = React.useCallback(
    async (id: string): Promise<boolean> => {
      console.log("Deleting tag:", id);

      try {
        await deleteResourceMapTag({
          variables: { id, cascade: false },
        });
        await refetch();
        return true;
      } catch (err) {
        console.error("Failed to delete tag:", err);
        throw err;
      }
    },
    [deleteResourceMapTag, refetch],
  );

  // Update tag's parent (for drag-and-drop)
  const updateTagParent = React.useCallback(
    async (tagId: string, newParentId: string | null): Promise<boolean> => {
      console.log("Updating tag parent:", { tagId, newParentId });

      // Validate: cannot set tag as its own parent
      if (tagId === newParentId) {
        console.error("Cannot set tag as its own parent");
        return false;
      }

      // Validate: check for circular reference
      const tag = tags.find((t) => t.id === tagId);
      if (tag && newParentId) {
        const potentialParent = tags.find((t) => t.id === newParentId);
        if (potentialParent && potentialParent.path.includes(tag.value)) {
          console.error("Cannot create circular parent-child relationship");
          return false;
        }
      }

      try {
        await updateResourceMapTag({
          variables: {
            id: tagId,
            input: { parentId: newParentId },
          },
        });
        await refetch();
        return true;
      } catch (err) {
        console.error("Failed to update tag parent:", err);
        return false;
      }
    },
    [tags, updateResourceMapTag, refetch],
  );

  return {
    tags,
    loading,
    error: error || null,
    refetch,
    createTag,
    updateTag,
    deleteTag,
    updateTagParent,
  };
}
