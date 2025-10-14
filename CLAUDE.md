# Claude Persistent Context Documentation

This file is always read by Claude before starting any new task in this project.

## How to Use

- Add any information, guidelines, project context, or instructions here that you want Claude to always consider before working on a task.
- Update this file at any time. Claude will always read the latest version before starting a new task.

---

### Project Overview

This is a typescript project, always use typescript.

This is a NextJs app router project.

This project uses prettier. After finishing a task, always run `npm run prettier:fix`

Unless told otherwise default to "use client" on UI files.

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

Generated code is imported like

```js
import { useListProjectsQuery } from "@/graphql/hooks";
```

### Testing

Always run e2e tests in headed mode so progress can be watched.

Use `npm run test:playwright` for testing.

### Code Quality

Never use `any` to fix a typescript issue.

Always run these commands to ensure code quality:

- `npm run lint` - Check linting
- `npm run prettier:check` - Check formatting
- `npm run prettier:fix` - Fix formatting issues
- `npm run test:depcheck` - Check dependencies

### Development Commands

- `npm run dev` - Run against staging backend
- `npm run dev:local-gql` - Run with local backend
- `npm run codegen` - Generate GraphQL types and hooks
- `npm run codegen:watch` - Run codegen in watch mode
- `npm run codegen:update-schema` - Pull latest schema version
