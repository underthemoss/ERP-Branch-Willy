# Resource Map Feature Documentation

## Overview

The Resource Map is a hierarchical tagging system that allows organizing entities (contacts, locations, business units, roles) in a tree structure. Each entry in the resource map has a unique ID and can have parent-child relationships.

## Data Model

### Core Entity: `ResourceMapResource`

```typescript
interface ResourceMapResource {
  id: string; // Unique identifier
  tenant_id: string; // Multi-tenant isolation
  resource_id: string; // Reference to external resource (if applicable)
  type: string; // Resource type
  value: string; // Display name/label
  parent_id: string | null; // Parent node for hierarchy (null = root node)
  hierarchy_id: string; // ID for hierarchy management
  hierarchy_name: string; // Name for hierarchy
  path: string[]; // Full path from root to this node
  tagType: ResourceMapTagType; // LOCATION | BUSINESS_UNIT | ROLE
  location: ResourceMapLocation; // Optional location data (only for LOCATION type)
  children: ResourceMapResource[]; // Child nodes
  parent: ResourceMapResource; // Parent node reference
}
```

### Tag Types (Enum)

```typescript
enum ResourceMapTagType {
  LOCATION = "LOCATION",
  BUSINESS_UNIT = "BUSINESS_UNIT",
  ROLE = "ROLE",
}
```

### Location Structure

**IMPORTANT**: Location is a nested object with a discriminated `kind` field. It is NOT a simple lat/lng or address string.

```typescript
interface ResourceMapLocation {
  kind: ResourceMapLocationType; // Discriminator field
  address?: ResourceMapAddress; // Present when kind = ADDRESS
  latLng?: ResourceMapLatLng; // Present when kind = LAT_LNG
  plusCode?: ResourceMapPlusCode; // Present when kind = PLUS_CODE
  geofence?: ResourceMapGeofence; // Present when kind = GEOFENCE
  interior?: ResourceMapInterior; // Present when kind = INTERIOR
}

enum ResourceMapLocationType {
  ADDRESS = "ADDRESS",
  LAT_LNG = "LAT_LNG",
  PLUS_CODE = "PLUS_CODE",
  GEOFENCE = "GEOFENCE",
  INTERIOR = "INTERIOR",
}

interface ResourceMapLatLng {
  lat: number;
  lng: number;
  accuracyMeters?: number;
}

interface ResourceMapAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  placeId?: string; // Google Places ID
}

interface ResourceMapGeofence {
  type: ResourceMapGeofenceType; // CIRCLE | POLYGON
  center?: ResourceMapLatLng; // For CIRCLE type
  radiusMeters?: number; // For CIRCLE type
  polygon?: ResourceMapLatLng[]; // For POLYGON type
}

interface ResourceMapPlusCode {
  code: string;
  localArea?: string;
}

interface ResourceMapInterior {
  floor?: string;
  spaceType?: string;
  code?: string;
  qrPayload?: string;
}

enum ResourceMapGeofenceType {
  CIRCLE = "CIRCLE",
  POLYGON = "POLYGON",
}
```

## GraphQL Schema

### Queries

```graphql
# List all entries by tag types
listResourceMapEntriesByTagType(types: [ResourceMapTagType!]!): [ResourceMapResource]

# Get single entry by ID
getResourceMapEntry(id: String!): ResourceMapResource

# List all entries (full tree)
listResourceMapEntries: [ResourceMapResource]

# List children of a parent
listResourceMapEntriesByParentId(parent_id: String!): [ResourceMapResource]
```

### Mutations

```graphql
# Create a new tag
createResourceMapTag(input: CreateResourceMapTagInput!): ResourceMapResource

# Update an existing tag
updateResourceMapTag(id: ID!, input: UpdateResourceMapTagInput!): ResourceMapResource

# Delete a tag (optional cascade to children)
deleteResourceMapTag(id: ID!, cascade: Boolean): ResourceMapResource
```

### Input Types

```graphql
input CreateResourceMapTagInput {
  value: String! # Display name
  type: ResourceMapTagType! # LOCATION | BUSINESS_UNIT | ROLE
  parentId: ID # Optional parent for hierarchy
  location: ResourceMapLocationInput # Optional location data
}

input UpdateResourceMapTagInput {
  value: String # New display name
  parentId: ID # Move to new parent
  location: ResourceMapLocationInput # Update location
}

input ResourceMapLocationInput {
  kind: ResourceMapLocationType!
  address: ResourceMapAddressInput
  latLng: ResourceMapLatLngInput
  plusCode: ResourceMapPlusCodeInput
  geofence: ResourceMapGeofenceInput
}
```

## Frontend Implementation Patterns

### Querying with Proper Location Fields

When querying resource map entries, always include the full nested location structure:

```typescript
const LIST_RESOURCE_MAP_ENTRIES_BY_TAG_TYPE = gql`
  query ListResourceMapEntriesByTagType($types: [ResourceMapTagType!]!) {
    listResourceMapEntriesByTagType(types: $types) {
      id
      value
      type
      parent_id
      path
      tagType
      location {
        kind
        latLng {
          lat
          lng
          accuracyMeters
        }
        address {
          line1
          line2
          city
          state
          postalCode
          country
          placeId
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
        plusCode {
          code
          localArea
        }
        interior {
          floor
          spaceType
          code
          qrPayload
        }
      }
      children {
        id
        value
        parent_id
      }
    }
  }
`;
```

### Transforming API Data

When transforming API data to frontend types, handle the nested location structure:

```typescript
function transformToResourceMapTag(
  resource: ResourceMapResourceFragment,
): ResourceMapTag {
  return {
    id: resource.id,
    name: resource.value || "",
    parentId: resource.parent_id || null,
    metadata: {
      locationType: resource.location?.kind || "address",
      address: resource.location?.address
        ? {
            line1: resource.location.address.line1 || "",
            city: resource.location.address.city || "",
            state: resource.location.address.state || "",
            postalCode: resource.location.address.postalCode || "",
            country: resource.location.address.country || "",
          }
        : undefined,
      coordinates: resource.location?.latLng
        ? {
            lat: resource.location.latLng.lat,
            lng: resource.location.latLng.lng,
          }
        : undefined,
      geofence: resource.location?.geofence
        ? {
            type: resource.location.geofence.type,
            center: resource.location.geofence.center,
            radiusMeters: resource.location.geofence.radiusMeters,
            polygon: resource.location.geofence.polygon,
          }
        : undefined,
    },
  };
}
```

## Common Mistakes to Avoid

### ❌ DON'T: Assume location is a simple field

```typescript
// WRONG - location is NOT a simple lat/lng
location: { lat: 123, lng: 456 }
```

### ✅ DO: Use the nested structure with kind discriminator

```typescript
// CORRECT
location: {
  kind: 'LAT_LNG',
  latLng: { lat: 123, lng: 456 }
}
```

### ❌ DON'T: Query location without nested fields

```typescript
// WRONG - won't get location data
query {
  listResourceMapEntries {
    id
    location  # This returns nothing useful!
  }
}
```

### ✅ DO: Always include full nested structure in queries

```typescript
// CORRECT
query {
  listResourceMapEntries {
    id
    location {
      kind
      latLng { lat lng }
      address { line1 city state }
    }
  }
}
```

### ❌ DON'T: Mix frontend and backend type names

```typescript
// WRONG - using wrong enum values
tagType: "location"; // lowercase
```

### ✅ DO: Use exact backend enum values

```typescript
// CORRECT
tagType: ResourceMapTagType.Location; // or 'LOCATION'
```

## File Structure

```
src/app/app/[workspace_id]/resource-map/
├── page.tsx                    # Main page component
├── components/
│   ├── types.ts               # Frontend types (ResourceMapTag, etc.)
│   ├── hooks/
│   │   └── useResourceMapTags.ts  # Data fetching hook with transforms
│   ├── LocationsTab.tsx       # Locations tab UI
│   ├── TagHierarchyTree.tsx   # Tree view component
│   ├── TagDetailDrawer.tsx    # Detail/edit panel
│   └── LocationMetadataForm.tsx # Location form fields
```

## Related Entities

Resource map entries can be associated with:

- **BusinessContact**: via `resourceMapIds: [ID!]` field and `resource_map_entries: [ResourceMapResource!]!`
- **PersonContact**: via `resourceMapIds: [ID!]` field and `resource_map_entries: [ResourceMapResource!]!`
- **Inventory**: via `resourceMapId: String` field

## Using Resource Map Entries on Contacts

### Querying resource_map_entries

When querying contacts, include `resource_map_entries` with ALL required fields including `tagType`:

```graphql
query GetContactById($id: ID!) {
  getContactById(id: $id) {
    __typename
    ... on PersonContact {
      id
      name
      email
      resourceMapIds
      resource_map_entries {
        id
        value
        tagType # CRITICAL: Needed to filter by type
        parent_id
        path
        hierarchy_name
      }
    }
    ... on BusinessContact {
      id
      name
      resourceMapIds
      resource_map_entries {
        id
        value
        tagType # CRITICAL: Needed to filter by type
        parent_id
        path
        hierarchy_name
      }
    }
  }
}
```

### Deriving Role from Resource Map Entries

The `role` field may not exist directly on PersonContact. Instead, derive role from `resource_map_entries`:

```typescript
// Helper to get role from resource_map_entries
const getPersonRole = (contact: PersonContact): string | null => {
  if (!contact.resource_map_entries) return null;
  const roleEntry = contact.resource_map_entries.find(
    (entry) => entry.tagType === "ROLE"
  );
  return roleEntry?.value || null;
};

// Usage in component
const personRole = isPerson ? getPersonRole(contact) : null;

// Display
{personRole && (
  <div className="flex items-center gap-2">
    <Briefcase className="w-5 h-5" />
    <span>{personRole}</span>
  </div>
)}
```

### Filtering by Tag Type

You can extract different tag types from `resource_map_entries`:

```typescript
// Get all locations assigned to contact
const locations =
  contact.resource_map_entries?.filter(
    (entry) => entry.tagType === "LOCATION",
  ) || [];

// Get all business units
const businessUnits =
  contact.resource_map_entries?.filter(
    (entry) => entry.tagType === "BUSINESS_UNIT",
  ) || [];

// Get roles
const roles =
  contact.resource_map_entries?.filter((entry) => entry.tagType === "ROLE") ||
  [];
```

## Common Mistakes to Avoid (Contact Queries)

### ❌ DON'T: Query resource_map_entries with only `path`

```graphql
# WRONG - Missing required fields
resource_map_entries {
  path
}
```

### ✅ DO: Include id, value, tagType, and other essential fields

```graphql
# CORRECT
resource_map_entries {
  id
  value
  tagType
  parent_id
  path
  hierarchy_name
}
```

### ❌ DON'T: Assume `role` field exists directly on PersonContact

```typescript
// WRONG - role may not be a direct field
{contact.role && <span>{contact.role}</span>}
```

### ✅ DO: Derive role from resource_map_entries with tagType === ROLE

```typescript
// CORRECT
const roleEntry = contact.resource_map_entries?.find(
  (e) => e.tagType === "ROLE"
);
{roleEntry?.value && <span>{roleEntry.value}</span>}
```

## Schema File Location

The GraphQL schema definitions are in:

- `/ERP-Branch-Willy/schema.graphql`

Generated TypeScript types are in:

- `/ERP-Branch-Willy/src/graphql/graphql.ts`
- `/ERP-Branch-Willy/src/graphql/hooks.tsx`

## Regenerating Types

After modifying `schema.graphql`, run:

```bash
npm run codegen
```

This regenerates the TypeScript types from the schema.

## Schema Synchronization (IMPORTANT!)

### The Problem

The frontend `schema.graphql` file may become out of sync with the actual backend API. This causes:

- **"GraphQL validation error"** at runtime when the query requests fields that don't exist in the backend
- **TypeScript types that lie** - you can write code that compiles but fails at runtime

### How to Sync Schema from Local Backend

When running the local backend, sync the schema before developing:

```bash
# Sync schema from local API and regenerate types
NEXT_PUBLIC_GQL_URL=http://localhost:5001/graphql npm run codegen:update-schema
npm run codegen
```

### Common Schema Mismatch Symptoms

1. **"Graphql validation error"** with no helpful message
2. Query works in GraphQL playground but fails in the app
3. Field exists in `schema.graphql` but backend returns error

### Debugging Schema Mismatches

1. Check what fields actually exist on the backend:

   ```bash
   # Introspect the actual backend schema
   curl -X POST http://localhost:5001/graphql \
     -H "Content-Type: application/json" \
     -d '{"query": "{ __type(name: \"PersonContact\") { fields { name } } }"}'
   ```

2. Compare with local `schema.graphql`:

   ```bash
   grep -A 20 "type PersonContact" schema.graphql
   ```

3. If they differ, sync the schema as shown above.

### Best Practice: Always Sync Before Major Changes

Before starting work on a feature that touches GraphQL:

```bash
# 1. Make sure local backend is running
# 2. Sync schema
NEXT_PUBLIC_GQL_URL=http://localhost:5001/graphql npm run codegen:update-schema

# 3. Regenerate types
npm run codegen

# 4. Now develop with confidence that types match reality
```

## Lessons Learned

### 2024-12-22: Contact Detail View "GraphQL validation error"

**Symptom:** Business contact detail view showed "Contact not found" due to GraphQL validation error.

**Root Cause:** The query requested `role` field on `PersonContact` and in `employees.items`, but the local backend schema didn't have this field.

**Investigation Path:**

1. Error message was unhelpful: `{"errors":[{"message":"Graphql validation error"}]}`
2. Local `schema.graphql` showed `role: String` on PersonContact
3. But local backend had removed/changed this field
4. Schema mismatch caused validation failure

**Fix:**

1. Removed `role` from direct query on PersonContact
2. Added `tagType` to `resource_map_entries` query
3. UI now derives role from `resource_map_entries.find(e => e.tagType === "ROLE")?.value`

**Prevention:**

- Always sync schema from actual backend before developing
- Use `resource_map_entries` with `tagType` for flexible attribute lookup
- Don't assume legacy fields exist - verify against running backend
