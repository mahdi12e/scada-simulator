# SCADA Simulator

A mobile-friendly, simulation-only industrial dashboard built with Cloudflare Workers and D1. It generates synthetic telemetry for sample equipment and stores training events and alarms.

> Safety note: This project does not connect to PLCs, sensors, industrial networks, or real equipment. Keep this demo private while testing. Do not add real-world control functions.

## Files

- src/index.js — Worker API and dashboard
- schema.sql — D1 tables and indexes
- wrangler.jsonc — deployment configuration

## Deploy (phone-friendly)

1. In Cloudflare, open Workers & Pages and create a Worker named scada-simulator.
2. Create a D1 database named scada-simulator-db.
3. Open the D1 database Console, paste the contents of schema.sql, and execute it.
4. In wrangler.jsonc, replace REPLACE_WITH_YOUR_D1_DATABASE_ID with the database ID shown by Cloudflare.
5. In Worker settings, add a D1 binding with variable name DB and select scada-simulator-db.
6. Deploy the code using Cloudflare's Git integration, or paste src/index.js into the Worker editor and ensure the DB binding is configured.
7. Open the Worker URL and confirm the dashboard appears.

## API

- GET /api/health — service status
- GET /api/overview — synthetic telemetry and active alarm count
- GET /api/events — latest events
- POST /api/simulate/alarm — create a sample warning event
- POST /api/simulate/info — create a sample information event
- POST /api/events/:id/ack — acknowledge an event

## Notes

All telemetry is synthetic. The trend chart is a short-lived browser-side history, not a historian. The event API does not yet have user authentication, so do not expose this demo publicly until authentication and rate limiting are added. No build step or external JavaScript dependencies are required.
