# ES-ERP

Tickets and order management frontend built with Next.js App Router and GraphQL.

## Local setup

```bash
nvm use 22
npm i
npm run codegen
```

To run against staging BE

`npm run dev`

To run with local running BE (port 5000)

`npm run dev:local-gql`

### Custom Local Backend Port

If your local backend is running on a different port (e.g., 5001), create a `.env.local` file:

```bash
# Keep staging API URL for Auth0 audience
NEXT_PUBLIC_API_URL=https://staging-api.equipmentshare.com

# Point to your local backend
NEXT_PUBLIC_GQL_URL=http://localhost:5001/graphql

# Auth0 Configuration
NEXT_PUBLIC_AUTH0_DOMAIN=staging-equipmentshare-erp.us.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=4M92vEL97l7LPddp488y91Wm16TCsQnA

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

Then run: `npm run dev`

> **Note:** `NEXT_PUBLIC_API_URL` must point to staging for Auth0 token validation. Only override `NEXT_PUBLIC_GQL_URL` to point to your local backend.

> BE found here [es-erp-api](https://gitlab.internal.equipmentshare.com/fleet/es-erp-api)

> Terraform found here [es-erp-terraform](https://gitlab.internal.equipmentshare.com/fleet/es-erp-terraform)

## Codegen

Graphql types and hooks are auto generated. To manually run

`npm run codegen`

To run in watch mode

`npm run codege:watch`

To pull the latest version of the schema.

`npm run codegen:update-schema`

> ### Why is only schema.graphql checked in?
>
> We want deterministic builds – every CI run regenerates the same artifacts.
>
> Generated files are large/noisy & can always be reproduced with npm run codegen.

## Linting and Quality Gates

`npm run lint`

`npm run prettier:check` or `npm run prettier:fix`

`npm run test:depcheck`

## Testing

`npm run test:playwright`
