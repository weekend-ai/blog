# Health daily records

Public pages: `/now/`, `/zh/now/`. Owner form: `/admin/health/`.
Public API: `GET /api/health`. Private read/export/save: `/api/admin/health`.

## Cloudflare resources

- Pages project: `blog`; Git production branch: `main`.
- Production D1 binding: `HEALTH_DB` → `zinuo-health-record`.
- Database ID: `6dcfee45-2887-4437-b401-36da2c4e8059`.
- Preview deployments deliberately have no production database binding.
- Migrations `0001_records.sql` and `0002_history.sql` applied remotely; 38 historical records through 2026-09-24.
- Existing Pages environment variables and preview configuration preserved.

## Remaining login configuration

1. In Cloudflare Zero Trust, enable email one-time PIN and create a Self-hosted Access application covering both `www.zinuo.me/admin` (including descendants) and `www.zinuo.me/api/admin` (including descendants). Keep the public Now page and `/api/health` outside this application.
2. Use one Allow policy matching only `zinuo.lee@gmail.com`. No Everyone or Bypass policy.
3. Set Pages production variables `ACCESS_ISSUER=https://TEAM.cloudflareaccess.com` and `ACCESS_AUD=APPLICATION_AUD` from that application. Both routes must use that same application audience.
4. Deploy the reviewed changes through the existing Git integration. Configuration changes require a new deployment.
5. Verify an anonymous visitor cannot reach the form or write API; another email cannot log in; owner can load records and export. Test a save on an intended real measurement, then confirm the public graph updates. Also verify direct pages.dev requests cannot bypass authentication.

The API validates JWT signature, issuer, audience, expiry and exact owner email; it does not trust a plain email header. Without Access configuration, admin routes return 503; without a valid assertion they return 401. Writes additionally require same-origin JSON requests. Revision numbers prevent stale edits from overwriting newer records. There is no delete endpoint.

## Local verification

Run `npm ci`, `npm test`, `hugo --minify`, then `npx wrangler pages functions build`.
Pure Hugo preview displays the bundled history snapshot because it cannot run Pages Functions.
Use `npx wrangler d1 migrations apply HEALTH_DB --local --config tools/health.wrangler.jsonc` for a separate local database. Never test inserts or deletes against production.

Historical imports only insert missing dates. Existing records are not overwritten. The report's muscle percentage is preserved when available; otherwise the public chart labels its calculated percentage as estimated. Daily submissions do not require a Git push.

Current status: implementation and automated checks complete. Pages production `ACCESS_ISSUER=https://revitalise.cloudflareaccess.com` and `ACCESS_AUD=480c30c8ec64bae7a9ecf215a0bf2ada7ca2cdcf22f49ae1e4d3a66945dbd7de` were saved and read back on 2026-09-26. Preview configuration, D1 bindings and other environment variables were verified unchanged. User-provided Access application ID: `0af9f556-1b0c-4ecd-9134-c28a7b9aa3e0`; configured destinations cover both admin paths. The policy contents have not been independently verified. Code remains undeployed; end-to-end email login and deployed writes remain unverified.
