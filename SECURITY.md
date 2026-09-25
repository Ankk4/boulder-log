# Security Policy

## Supported versions

Security fixes are applied to the latest `master` branch of this repository.

## Threat model

Boulder Notes is a **client-only** Progressive Web App deployed as static files (GitHub Pages). There is no application backend or user authentication.

| Asset | Risk |
|-------|------|
| IndexedDB session / health / notes data | Readable by anyone with access to the browser profile, extensions, or XSS on the app origin |
| Production JS bundle | Public; must never contain API keys or other secrets |
| CSV / Sheets export | User-controlled fields could inject spreadsheet formulas if not sanitized |
| Dependencies | Supply-chain and toolchain vulnerabilities (tracked via `npm audit` and Dependabot) |

Controls in place include CSP and related meta tags, CSV formula neutralization, input length limits, UUID entity IDs, transactional session deletes, production audit gating in CI, and a Sheets stub that rejects secret API keys in the client.

## Reporting a vulnerability

Please open a GitHub issue describing the vulnerability, impact, and steps to reproduce. Do not include secrets or personal climbing/health data in reports. We will acknowledge reports and aim to address high-severity issues promptly.

## Out of scope (current architecture)

- Server-side auth, CSRF, or SQL injection (no backend)
- Full IndexedDB encryption / PIN unlock (not implemented; would be a separate feature)
- Custom response headers beyond what GitHub Pages allows (CSP is meta-based)
