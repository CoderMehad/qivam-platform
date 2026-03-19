# Contributing to Qivam

Thank you for contributing. This document covers how to set up the project locally and how the contribution process works.

## Before you start

- Read the [Code of Conduct](CODE_OF_CONDUCT.md)
- Check existing issues and PRs before opening a new one
- For significant changes, open an issue first to discuss the approach

## Local setup

**Prerequisites:**

- Node.js 20+
- pnpm 9+
- A PostgreSQL database (any provider works — Neon free tier is the easiest to get started with)

**Clone and install:**

```bash
git clone https://github.com/your-org/qivam.git
cd qivam/platform
pnpm install
```

**Environment variables:**

Copy the example file and fill in your own values:

```bash
cp .env.example .env
```

Required variables are documented in `.env.example`.

**Type checking:**

```bash
pnpm typecheck
```

## Project structure

```
packages/core/       — Domain layer (pure TypeScript, no HTTP)
packages/functions/  — Hono app, routes, middleware
stacks/              — Infrastructure definitions
```

The most important architectural rule: `core` has zero knowledge of Hono, HTTP, or request/response. It exports plain functions that accept and return plain TypeScript objects. All HTTP concerns live in `functions`.

Per-module imports are used throughout — no barrel `index.ts`:

```ts
import * as Mosque from "@qivam/core/mosque";
import * as PrayerTimes from "@qivam/core/prayer-times";
```

## Database

The project currently uses `@neondatabase/serverless` as the database driver, which is optimised for Neon's HTTP transport. The Drizzle ORM queries themselves are standard PostgreSQL and work with any provider — only the connection setup in `packages/core/src/db/connection.ts` is Neon-specific. Support for a standard `pg`/`postgres` driver is planned. If you want to use a different provider in the meantime, swapping the driver in that file is the only change required.

## Coding conventions

- ESM only (`"type": "module"` everywhere)
- Strict TypeScript — no `any`, no `@ts-ignore`
- Named exports only (no default exports except config files)
- Zod for all input validation — never trust raw input
- Drizzle ORM for all database queries — no raw SQL unless genuinely necessary

## Prayer calculation

The prayer calculation library is custom-built — do not install `adhan` from npm. The implementation lives in `packages/core/src/lib/`.

## Submitting a pull request

1. Fork the repository and create a branch from `main`
2. Make your changes
3. Run `pnpm typecheck` and ensure it passes
4. Open a PR with a clear description of what changed and why
5. Keep PRs focused — one concern per PR

## Reporting bugs

Open a GitHub issue with a clear description, steps to reproduce, and expected vs actual behaviour.

For security issues, do not open a public issue — see [SECURITY.md](SECURITY.md).
