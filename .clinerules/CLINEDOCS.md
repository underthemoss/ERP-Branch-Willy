# Cline Persistent Context Documentation

This file is always read by Cline before starting any new task in this project.

## How to Use

- Add any information, guidelines, project context, or instructions here that you want Cline to always consider before working on a task.
- Update this file at any time. Cline will always read the latest version before starting a new task.

---

### Project Overview

This is a typescript project, always use typescript.

This is a NextJs app router project.

This project uses prettier. After finishing a task, always run `npm run prettier:fix`

Unless told otherwise default to "use client" on UI files.

Use american spelling in all copy.

### Coding Standards for MUI components

When using MUI GRID, this is the correct syntax

```js
<Grid size={{ xs: 12 }}>
```

This is wrong for our version!

```js
<Grid item xs={12}>
```

### Coding Standards for GQL Queries and Mutations

Read the ./schema.graphql file for GQL schema information

Always declare queries like this

```js
import { graphql } from "@/graphql";

graphql(`
  query ListProjects {
    listProjects {
      id
      name
      project_code
      description
      companyId
      created_at
      created_by
      updated_at
      deleted
    }
  }
`);
```

Use fetch policy fetchPolicy: "cache-and-network" by default for GQL queries

Always run `npm run codegen` after writing or changing a query

Generated code is importanted like

```js
import { useListProjectsQuery } from "@/graphql/hooks";
```

### Running e2e tests

Always run these in headed mode so i can watch progress.

---

## Google Maps Integration

The application uses Google Maps for displaying locations, address validation, and geocoding. Maps are integrated through a centralized provider that handles script loading and configuration. To use maps in any component, import the `useGoogleMaps` hook from `@/providers/GoogleMapsProvider`. This hook provides access to the API key, map ID, loading states, and error handling. The provider is already configured at the root level, so maps will work automatically throughout the app. Components can use `@react-google-maps/api` components like `GoogleMap`, `Marker`, and `InfoWindow` directly without needing to wrap them in LoadScript. For address autocomplete, the Places API is available through the provider. Always check `isReady` from the hook before rendering map components to ensure the scripts are loaded.

---

## Admin Section Guidelines

### Purpose

The Admin section (`/admin/*`) is a dedicated area for platform administrators and super users. This is where system-wide management happens - think of it as the "control room" for the entire platform, separate from the regular user workspace.

### File Structure

**All admin-related code MUST be located in the `/src/app/admin/` directory**

- Keep admin components within their feature folders (e.g., `/admin/customers/components/`)
- Shared admin components go in `/src/app/admin/components/`
- Admin section has its own layout and navigation chrome

### Visual Design Philosophy

The admin section should feel distinctly different from the main application - more professional, data-focused, and powerful:

#### **Overall Aesthetic**

- **Professional & Serious**: This is for power users managing critical platform operations
- **Data-Dense**: Prioritize information density over whitespace
- **Dark & Distinguished**: Use a darker, more sophisticated color palette to differentiate from the main app

#### **Color Palette**

- **Primary**: Deep blues and cool grays (not the bright colors of the main app)
- **Backgrounds**: Darker backgrounds (#1a1a1a to #2d2d2d range)
- **Accents**:
  - Red/Orange for warnings and critical actions
  - Green for success states
  - Amber for caution
- **Text**: Higher contrast ratios for better readability on dark backgrounds

#### **Layout Principles**

- **Fixed Sidebar Navigation**: Always visible on the left for quick access
- **Information Hierarchy**:
  - Dashboard cards for KPIs and metrics at the top
  - Data tables for detailed information below
  - Breadcrumbs for deep navigation
- **Compact Design**: Smaller fonts and tighter spacing to show more data
- **Grid-Based**: Use consistent grid layouts for predictable scanning

#### **Component Choices**

- **Tables over Cards**: For listing items (customers, users, etc.)
- **Dense Data Grids**: With inline editing capabilities where appropriate
- **Advanced Filters**: Multiple filter options always visible
- **Bulk Actions**: Checkboxes and action bars for multiple selections
- **Charts & Graphs**: For analytics and metrics visualization
- **Status Badges**: Clear visual indicators for states (active, suspended, trial, etc.)

#### **Typography**

- **Smaller Base Font**: 13-14px for body text (vs 16px in main app)
- **Monospace for Data**: IDs, codes, API keys in monospace fonts
- **Clear Hierarchy**: Distinct heading sizes but more compressed than main app

### User Experience Patterns

- **Power User Focused**: Keyboard shortcuts, bulk operations, advanced search
- **Data Export**: Always provide CSV/Excel export options
- **Audit Trails**: Show who did what and when
- **Quick Actions**: Frequently used actions should be one click away
- **Dense Information**: Show as much relevant data as possible without scrolling
- **Professional Feedback**: Toast notifications for actions, not modal popups

### Technical Considerations

- Admin routes bypass workspace context
- Admin-specific GraphQL queries without workspace filtering
- Higher data limits and longer cache times
- Session management with elevated permissions
- Comprehensive audit logging for all actions

### Remember

The admin section is the "backstage" of the platform - it should feel powerful, professional, and clearly separate from the customer-facing application. Think Bloomberg Terminal meets modern SaaS admin panel.
