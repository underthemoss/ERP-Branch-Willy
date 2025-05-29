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

Always run `npm run codegen` after writing or changing a query

Generated code is importanted like

```js
import { useListProjectsQuery } from "@/graphql/hooks";
```
