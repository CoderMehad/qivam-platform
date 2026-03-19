# Qivam

Open infrastructure for Muslim developers.

Qivam is a platform providing APIs and data services that Muslim developers can build on — masjid directories, prayer times, and more to come. The goal is a shared, trustworthy foundation so that builders in the Muslim space are not each solving the same problems from scratch.

**API documentation:** [docs.qivam.com](https://docs.qivam.com)

---

## What's available

- **Masjid directory** — searchable by name, location, and proximity
- **Prayer times** — per-mosque prayer schedules
- **Developer API keys** — vetted access for third-party applications

## For developers

Consumer apps call the Qivam API using an issued API key. The data and infrastructure are hosted and maintained centrally — you build on top, not from scratch.

To get started:

1. Read the [API documentation](https://docs.qivam.com)
2. Request a developer API key (details in the docs)
3. Build

## Tech stack

| Layer | Technology |
|---|---|
| API | [Hono](https://hono.dev) on AWS Lambda |
| Database | Neon PostgreSQL (serverless) with PostGIS |
| ORM | Drizzle |
| Validation | Zod + OpenAPI |
| Auth | Vetted API keys |
| Infrastructure | SST v2 on AWS |
| Package manager | pnpm (workspaces monorepo) |

## Repository structure

```
platform/
  packages/core/       — Domain layer: types, business logic, DB queries
  packages/functions/  — Hono app, routes, middleware
  stacks/              — Infrastructure definitions
landing/               — Landing page
docs/                  — API documentation source
```

The domain layer (`core`) has no knowledge of HTTP — it exports plain TypeScript functions. The `functions` package owns all routing and request handling.

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) to get started and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before participating.

## Security

To report a vulnerability privately, see [SECURITY.md](SECURITY.md).

## License

GNU Affero General Public License v3.0 — see [LICENSE](LICENSE).
