# Base44 Dev Environment

## Project overview
Billapp.de — a static, client-side invoice creation app (German). No build step, no backend server of its own. All logic lives in `app.js` (ES module loaded in the browser).

## Architecture
- **Static files only**: `index.html`, `app.js`, `styles.css` served by a plain HTTP server.
- **Supabase** (loaded via CDN ESM import in `app.js`) handles auth and cloud data sync. The Supabase URL and **publishable** (public) key are hardcoded in `app.js` — no secret credentials needed to run.
- **localStorage** is used as a fallback / migration source for invoices and customers.
- No database, no API server, no environment variables required.

## Running locally
```
docker compose -f docker-compose.base44.yml up -d
```
Serves on http://localhost:3000 (maps container port 8080 → host 3000).

## Health check
`GET /` returns 200 with the `index.html` content.

## Notes
- The app requires Supabase auth (login/register) before the main invoice UI is shown. The Supabase project must have the `invoices`, `invoice_items`, and `customers` tables with RLS policies for the app to function fully.
- No secrets are needed for the dev environment — the Supabase publishable key is already in `app.js`.
