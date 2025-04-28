# ES-ERP

> Tickets and order management frontend built with Next.js App Router and GraphQL.

## Local setup

```bash 
nvm use 22
npm i
npm run codegen
```
To run against staging BE

`npm run dev`

To run with local running BE 

`npm run dev:local-gql`

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
