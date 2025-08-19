Playwright E2E (Local Realtime)

Overview
- Runs the app locally and drives the Assistant widget in a real browser.
- Uses LocalTestSession (no OpenAI calls) via `NEXT_PUBLIC_REALTIME_TEST=local`.

Prerequisites
- Node 18+
- Install Playwright browsers: `npm run e2e:install`

Run tests
- Dev server auto-start via config:
  - `npm run e2e`
- Headed mode:
  - `npm run e2e:headed`

What it does
- Opens `/`, clicks the floating Assistant button, types a flight search.
- Waits for either tool activity (Calling tool search_flights…) or a summary (e.g., “I found N flight options.”).

Notes
- The config builds and starts Next on port 3000.
- To reuse a running server: start `NEXT_PUBLIC_REALTIME_TEST=local next start -p 3000` then run `PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run e2e`.

