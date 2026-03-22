# ADR 002: Domain-Driven Package Structure

**Date:** 2026-03-22
**Status:** Accepted

## Context

The original `packages/core` layout was flat inside a `src/` subdirectory:

```
packages/core/src/
  domain.ts          ← all types in one file
  mosque.ts          ← use-case functions
  auth.ts
  prayer-times.ts
  api-key.ts
  repository/
    drizzle.ts       ← all DB queries in one 700-line file
    helpers.ts
  db/
    schema.ts        ← Drizzle table definitions
    connection.ts    ← Neon DB adapter
  lib/               ← prayer calculation

packages/functions/src/
  api.ts
  types.ts
  lib/
    email.ts         ← SES adapter
    logger.ts        ← structured logger
  schemas/           ← Zod validation schemas
  middleware/
  routes/
```

As the codebase grew, two problems emerged:

1. **Navigation friction** — finding a type required knowing it was in `domain.ts`; finding a DB query required scrolling through a 700-line `drizzle.ts`; finding a Zod schema required going into `functions/`, not `core/`.

2. **Wrong layer placement** — Zod schemas lived inside `functions/` even though they describe domain shapes and carry no HTTP knowledge. Infrastructure adapters (email, logger) lived in `functions/lib/` even though they have no dependency on Hono.

## Decision

Restructure both packages to a **domain-driven layered layout** with explicit file naming conventions. Remove the `src/` subdirectory layer from both packages.

### `packages/core/` layers

| Folder | Suffix | Responsibility |
|---|---|---|
| `adapters/` | `.adapter.ts` | External infrastructure: DB connection (Neon), email (SES), logging |
| `lib/` | *(plain)* | Custom prayer calculation library — no suffix, unchanged |
| `models/` | `.model.ts` | TypeScript types only — no logic, no Zod, no Drizzle |
| `repositories/` | `.repository.ts` | All Drizzle DB queries — one file per entity, co-located with row mappers |
| `schemas/` | `.schema.ts` | Zod validation schemas for all request/response shapes, plus `drizzle.schema.ts` for Drizzle table definitions |
| `shared/` | *(plain)* | Utility functions with no layer-specific dependencies: `helpers.ts` |
| `use-cases/` | `.use-case.ts` | Business logic — one file per domain, imports from models + repositories |

`constants.ts` and `errors.ts` remain at the package root as they are shared across all layers.

### `packages/functions/` changes

- Removed the `src/` subdirectory — files now live directly under `packages/functions/`
- Schemas moved to `@qivam/core/schemas/*` — routes import from there instead of local `../schemas/`
- Infrastructure adapters (email, logger) moved to `@qivam/core/adapters/*` — routes import from there

### `packages/core/package.json` exports

All export paths that existed before continue to work unchanged. New exports added for schemas and adapters:

```json
{
  "./schemas/mosque":             "./schemas/mosque.schema.ts",
  "./schemas/api-key":            "./schemas/api-key.schema.ts",
  "./schemas/auth":               "./schemas/auth.schema.ts",
  "./schemas/common":             "./schemas/common.schema.ts",
  "./schemas/prayer-times":       "./schemas/prayer-times.schema.ts",
  "./schemas/prayer-calculation": "./schemas/prayer-calculation.schema.ts",
  "./adapters/ses":               "./adapters/ses.adapter.ts",
  "./adapters/logger":            "./adapters/logger.adapter.ts"
}
```

The `./domain` export now points to `models/index.ts` (a barrel re-exporting all model files) so existing `import type { Mosque } from "@qivam/core/domain"` usage continues to work.

## Consequences

**Good:**
- Any entity's full stack (type → DB query → business logic → Zod schema) is findable by name, not by layer
- `drizzle.schema.ts` lives in `schemas/` alongside Zod schemas — one place for all schema concerns
- Infrastructure adapters belong to `core`, reflecting that they serve the domain, not the HTTP layer
- `packages/functions/` contains only Hono app code — no utilities, no schemas
- The naming convention is self-documenting: `.repository.ts` files do DB I/O, `.use-case.ts` files do not

**Trade-offs:**
- `@aws-sdk/client-sesv2` is now a dependency of `packages/core` rather than `packages/functions`. This is correct since `ses.adapter.ts` lives in core, but it means core's dependency graph touches AWS infrastructure. Mitigation: adapters are an explicit layer boundary for this purpose.
- `@hono/zod-openapi` is now a dependency of `packages/core` for the Zod schema files that use `.openapi()` metadata. This is a Zod extension only — it adds OpenAPI annotation helpers but carries no Hono HTTP types into core.

## Alternatives Considered

**Keep `src/` layer** — Rejected. The extra indirection (`packages/core/src/`) adds nothing once the package has a proper layer structure.

**Keep schemas in `functions/`** — Rejected. Zod schemas describe domain shapes (what a `Mosque` looks like over the wire). They carry no HTTP knowledge and are re-usable outside of Hono routes.

**Keep adapters in `functions/`** — Rejected. `ses.adapter.ts` and `logger.adapter.ts` have no dependency on Hono. Moving them to core makes the logger available to use-cases directly without crossing a package boundary.
