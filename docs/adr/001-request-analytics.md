# ADR 001: Custom Request Analytics Middleware

**Status:** Accepted
**Date:** 2026-03-22

## Context

Qivam needs visibility into API usage per developer key (traffic patterns, error rates, performance). Third-party options were evaluated:

| Option | Reason Rejected |
|---|---|
| `@api-analytics/hono` | Requires long-running background process — incompatible with Lambda |
| Datadog | Cost prohibitive at early stage |
| PostHog | Product analytics, not API-focused |

## Decision

Implement a custom structured-logging middleware (`requestAnalytics`) that writes JSON events to CloudWatch via the existing `log()` function. Per-key opt-out is available via self-service endpoints (`POST /v1/analytics/opt-out`, `POST /v1/analytics/opt-in`).

## What Gets Logged (per request)

```json
{
  "level": "info",
  "message": "api_request",
  "timestamp": "ISO string",
  "method": "GET",
  "path": "/v1/mosques/nearby",
  "status": 200,
  "responseTimeMs": 142,
  "responseSizeBytes": 1024,
  "keyPrefix": "qv_live_1",
  "userAgent": "curl/7.88",
  "clientIp": "1.2.3.4"
}
```

- `keyPrefix`: last 8 chars of `X-API-Key` header (or `null` for unauthenticated requests)
- `responseSizeBytes`: from `Content-Length` response header, else `null`
- `clientIp`: first value from `X-Forwarded-For` (set by API Gateway)

## GDPR Assessment

**Default opt-in is GDPR-compliant** for this use case:

- **Legal basis:** Legitimate interest (Article 6(1)(f)) — operating, securing, and rate-limiting the platform
- **Data subjects:** API key holders are developers/businesses (B2B), not end consumers
- **PII collected:** IP address and user-agent (both personal data under GDPR)
- **Right to object:** Self-service opt-out endpoint satisfies Article 21
- **Data residency:** AWS eu-west-1 CloudWatch — no third-party processor

### Required: Privacy Policy on Landing Page

A `/privacy` page must cover:
- What is logged per API request (the field list above)
- Legal basis: legitimate interest
- Retention: CloudWatch log group retention (recommended: 30 days — set in `MainStack.ts`)
- How to opt out: `POST /v1/analytics/opt-out` with `X-API-Key` header
- Contact for GDPR requests

## Consequences

- Analytics are free (CloudWatch costs negligible at this scale)
- No vendor lock-in
- Log querying via CloudWatch Logs Insights
- Developers have self-service control over their key's logging
- Privacy policy page required before production launch
