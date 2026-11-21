# TDaaS Portal

A web UI for **TDaaS (Test Data as a Service)**, so anyone can request test data without a Postman collection.

## What's in it

| Screen | Endpoint | What it does |
| --- | --- | --- |
| **Health pill** (header, every page) | `GET /health-check` | Shows whether TDaaS is up. Checks on load, every 60 s, and when you press **Check now**. Any 2xx counts as up. |
| **Retrieve data** (main page) | `POST /retrieve` | Form for application name, test case ID, environment (pick a saved environment from the drop-down or type API host IP, target server IP and customer name by hand; a link prefills a Jira ticket to request a new saved environment), one or more prompts (add/remove, at least one), and **Bypass cache**. Shows a live preview of the request body. Results open in an easy view (per-prompt key/value cards with copy buttons) or the raw response, with download. |
| **Workflows** | `GET /workflows` | Type a name (e.g. `create_user`) to see whether that MCP tool is available. A smaller version of this check sits beside the Retrieve form. |
| **Suggest prompts** | `POST /suggest-prompts` | Describe the data you need; shows suggested prompts and fills them into the Retrieve form. If nothing comes back, offers a Jira ticket prefilled from [`src/templates/jira-ticket-template.txt`](src/templates/jira-ticket-template.txt). |

Light and dark themes follow the system setting and can be switched in the header. The last form values are remembered in the browser.

## Run it

```bash
npm install
cp .env.example .env.local   # then edit
npm run dev                  # http://localhost:5173
```

Try the UI without a backend: `VITE_USE_MOCKS=true npm run dev`.

Build for production with `npm run build`; the static site is written to `dist/` and can be served by any web server.

## Configuration

All settings are Vite env vars (see [`.env.example`](.env.example)):

| Variable | Default | Meaning |
| --- | --- | --- |
| `VITE_API_BASE_URL` | *(same origin)* | Base URL of the TDaaS API |
| `VITE_HEALTH_PATH` | `/health-check` | |
| `VITE_WORKFLOWS_PATH` | `/workflows` | |
| `VITE_RETRIEVE_PATH` | `/retrieve` | |
| `VITE_SUGGEST_PROMPTS_PATH` | `/suggest-prompts` | |
| `VITE_JIRA_URL` | *(none)* | Shows an **Open Jira** button next to the ticket text |
| `VITE_USE_MOCKS` | `false` | Use built-in sample responses |
| `TDAAS_PROXY_TARGET` | *(none)* | Dev server only: proxy the API paths to this backend to avoid CORS |

If the UI is served from a different origin than the API in production, the API must allow CORS from the UI's origin (or put both behind the same reverse proxy).

## Saved environments

The **Saved environment** drop-down on the Retrieve page is filled from [`src/environments.json`](src/environments.json). Each entry has `id`, `name`, `apiHostIp`, `targetServerIp` and `customerName`. The two entries there now are samples: replace them with real ones. Choosing an environment fills in the three fields; editing any of them switches the drop-down back to **Enter manually**. Rebuild after changing the file.

## Jira ticket templates

Both templates are plain text files; rebuild after changing them. Placeholders in `{{double braces}}` are filled in, and empty ones show as `<placeholder name>` for the user to complete.

- [`src/templates/jira-ticket-template.txt`](src/templates/jira-ticket-template.txt), used by Suggest prompts when no prompt is found: `{{requirement}}`, `{{application_name}}`, `{{test_case_id}}`, `{{customer_name}}`, `{{date}}`.
- [`src/templates/new-environment-ticket-template.txt`](src/templates/new-environment-ticket-template.txt), used by **Request a new saved environment**: `{{environment_name}}`, `{{api_host_ip}}`, `{{target_server_ip}}`, `{{customer_name}}`, `{{application_name}}`, `{{date}}`. The IP and customer values come from the form when they were typed by hand.

## Assumptions to confirm against the real API

The UI is written so these are easy to change, mostly in [`src/api/`](src/api) and [`src/types.ts`](src/types.ts):

- **`POST /retrieve` body keys**: `application_name`, `environment.{api_host_ip, target_server_ip, customer_name}`, `prompts` (string array), `bypass_cache`, `test_case_id`. See `toRequest()` in `src/types.ts`.
- **`/retrieve` response**: the easy view looks for a list under `results`, `data` or `items`, each with `prompt`, `workflow`/`tool` and `data`/`output`/`result`. Anything else still shows in the raw view.
- **`GET /workflows` response**: accepts a list of strings, a list of `{name, description}`, or an object holding the list under `workflows`, `tools`, `data` or `items`.
- **Suggest prompts endpoint**: `POST /suggest-prompts` with `{ "requirement": "..." }`; accepts a list of strings or `{prompts|suggestions: [...]}`. An empty list means "no prompt found" and triggers the Jira ticket path.
- **Errors**: a non-2xx response shows its `message`, `error` or `detail` field when present.
- No sign-in is handled yet.

## Stack

React 19, TypeScript, Vite. No UI framework; styles are in `src/styles.css` with light/dark tokens.
