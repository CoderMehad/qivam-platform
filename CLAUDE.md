# Qivam Platform

Open infrastructure for Muslim developers — SST v2 monorepo on AWS.

## Tech Stack

- **Infrastructure**: SST v2 (CDK-based), AWS `eu-west-1`
- **API**: Hono, single Lambda function behind API Gateway
- **Database**: Neon PostgreSQL (serverless) with PostGIS, Drizzle ORM
- **Driver**: `@neondatabase/serverless` (HTTP)
- **Validation**: Zod + `@hono/zod-openapi`
- **Auth**: JWT (jose), API keys
- **Email**: AWS SES (`@aws-sdk/client-sesv2`) — API key delivery
- **Storage**: S3 for mosque media
- **Package manager**: pnpm workspaces

## Project Structure

```
sst.config.ts
stacks/
  MainStack.ts
packages/core/src/
  domain.ts
  constants.ts
  mosque.ts
  auth.ts
  prayer-times.ts
  api-key.ts
  db/schema.ts
  db/connection.ts
  repository/drizzle.ts
  lib/
packages/functions/src/
  api.ts
  types.ts
  middleware/
  schemas/
  routes/
```

## Architecture Rule

`core` has zero knowledge of Hono, HTTP, request/response, or middleware. It exports plain functions that accept and return plain TypeScript objects. `functions` owns the Hono app, all routing, all middleware, all request parsing, all response formatting.

## Per-Module Imports

```ts
import * as Mosque from "@qivam/core/mosque";
import * as PrayerTimes from "@qivam/core/prayer-times";
import * as ApiKey from "@qivam/core/api-key";
```

## Commands

From `platform/`:

```bash
pnpm install
pnpm typecheck
```

From `packages/core/`:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

## Coding Conventions

- ESM only (`"type": "module"` everywhere)
- Strict TypeScript — no `any`, no `@ts-ignore`
- Named exports only (no default exports except config files)
- Zod for all input validation
- Drizzle ORM for all DB queries — no raw SQL unless necessary

## Prayer Calculation

Custom implementation only — do NOT install `adhan` from npm. Lives in `packages/core/src/lib/`.

## Security

- No end-user personal data stored
- Search coordinates processed in-memory, never persisted
- API keys vetted before approval
- List endpoints: max 20 results, cursor-based pagination
- Passwords hashed with bcrypt (cost factor 12)
