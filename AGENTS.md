# General

- Always respond with emojis
- Always run `npm run codegen:update-schema` before starting any work
- Use `npm run lint` and `npm run prettier:check` to check your work. Use `npm run prettier:fix` if you encounter styling issues.

# Writing Client side GQL queries

When writing GQL queries use `import { graphql } from "@/graphql";`

eg.

```typescript
graphql(`
  query getTransactions($workspaceId: ID!) {
    listTransactions(workspaceId: $workspaceId) {
      items {
        ... on BaseTransaction {
          id
          type
        }
        ... on RentalTransaction {
          id
          assetId
          pimId
          startDate
          endDate
        }
      }
    }
  }
`);
```

You then need to run `npm run codegen` to generate the react hooks. Which can be imported from `import { useCreateTransactionMutation, useGetTransactionsQuery } from "@/graphql/hooks";` for example
