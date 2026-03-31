# QA automation (Playwright)

This repository contains end-to-end and API contract tests for a Vikunja-style web application. The suite uses **Playwright Test** with **TypeScript**, organized so UI flows and JSON APIs share fixtures, constants, and test data where it makes sense.

---

## Architecture (high level)

| Layer | Role |
|--------|------|
| **Specs** (`tests/ui`, `tests/api`) | Describe behavior in plain test cases; orchestrate page objects or API wrappers; avoid low-level selectors here when possible. |
| **Page objects** (`pages/`) | Encapsulate locators, user actions, and UI assertions for each feature area (auth, projects). |
| **API modules** (`api/`) | Encapsulate HTTP calls and response assertions (`LoginApiUser`, `RegisterApiUser`, `ProjectApi`, low-level `registerApi`, `createApiContext`). |
| **Shared utilities** (`utils/`) | Test data factories, route/API constants, validation limits, and helpers used by both UI and API tests. |
| **Config** (`playwright.config.ts`, `config/env.ts`, `.env`) | Playwright runner settings, `baseURL` for the browser, and `API_URL` for request contexts. |

Data typically flows like this:

1. **User seeding**: Many suites register a user once via **`registerApi`** or **`ensureUserExists`** so UI login tests stay fast and deterministic.
2. **UI tests** open the app with **`baseURL`** and interact through **page objects**.
3. **API tests** create an isolated **`APIRequestContext`** per test via **`createApiContext()`**, which uses **`ENV.API_URL`**.
4. **Projects** reuse **`project_data`** (titles, descriptions, hex colors) for both UI and API tests so naming stays consistent.

---

## Folder layout and what lives where

```
qa/                           ← project root (run commands from here)
├── .env                      ← local URLs (not committed if gitignored)
├── playwright.config.ts      ← testDir, baseURL, dotenv
├── config/
│   └── env.ts                ← ENV.BASE_URL, ENV.API_URL (dotenv + process.env)
├── pages/                    ← Page Object Model (UI)
│   ├── auth/
│   │   ├── LoginPage.ts
│   │   └── RegisterPage.ts
│   └── projects/
│       └── ProjectsPage.ts
├── api/                      ← API clients / contract helpers
│   ├── users/
│   │   ├── apiClient.ts      ← request.newContext({ baseURL: ENV.API_URL })
│   │   ├── registerApi.ts    ← imperative register (used by helpers + UI seeding)
│   │   ├── LoginApiUser.ts   ← login requests + assertions
│   │   └── RegisterApiUser.ts
│   └── projects/
│       └── project.api.ts    ← Project CRUD + expectations
├── tests/
│   ├── ui/
│   │   ├── auth/
│   │   │   ├── login.spec.ts
│   │   │   └── register.spec.ts
│   │   └── projects/
│   │       └── projects.spec.ts
│   ├── api/
│   │   ├── auth/
│   │   │   ├── auth.api.spec.ts
│   │   │   └── register.api.spec.ts
│   │   ├── projects/
│   │   │   └── projects.api.spec.ts
│   │   └── helpers/
│   │       └── user.helper.ts  ← ensureUserExists, getAuthToken (uses LoginApiUser)
│   └── …
├── utils/
│   ├── test.data.ts          ← user factories (valid/invalid/security)
│   ├── project.data.ts       ← project payloads for UI + API
│   ├── types.ts
│   ├── constants/
│   │   ├── routes.constants.ts
│   │   ├── api.constants.ts
│   │   ├── auth.api.test.constants.ts
│   │   ├── projects.api.test.constants.ts
│   │   └── validation.constants.ts
│   └── helpers/
│       └── network.helper.ts
├── test-results/             ← artifacts (screenshots, traces) after runs
└── playwright-report/        ← HTML report (after `npx playwright show-report`)
```

---

## Environment variables

Create a **`.env`** file in this folder (`qa/`, same level as `playwright.config.ts`). Example:

```env
BASE_URL=http://localhost:8080
API_URL=http://localhost:8080/api/v1/
```

| Variable | Used for | Notes |
|----------|-----------|--------|
| **`BASE_URL`** | Playwright `use.baseURL` | Browser opens relative paths like `/login` against this origin. |
| **`API_URL`** | `createApiContext` / `registerApi` | Base URL for API requests (`login`, `register`, `projects`, …). Keep trailing-slash style consistent with how paths are joined. |

`dotenv` is loaded in **`playwright.config.ts`** and **`config/env.ts`**. Run tests from the **`qa`** directory so `.env` is discovered from the current working directory by default.

---

## How reviewers should run the suite

1. **Install dependencies** (from the `qa` folder):

   ```bash
   npm install
   ```

2. **Start the application** under test (or point `.env` at a deployed environment you are allowed to hit).

3. **Configure `.env`** with `BASE_URL` and `API_URL` as above.

4. **Run all tests**:

   ```bash
   npx playwright test
   ```

5. **Run by area**:

   ```bash
   npx playwright test tests/ui
   npx playwright test tests/api
   npx playwright test tests/ui/auth/login.spec.ts
   npx playwright test tests/api/projects/projects.api.spec.ts
   ```

6. **List tests without executing**:

   ```bash
   npx playwright test --list
   ```

7. **HTML report** (after a run):

   ```bash
   npx playwright show-report
   ```

The config currently sets **`headless: false`** so browsers are visible during local debugging; CI can override with `npx playwright test --headed=false` or by changing the config.

---

## Framework quality: layout, config, abstractions, reporting

- **Project layout**: Clear split between **`tests/ui`** and **`tests/api`** mirrors how engineers think about browser vs HTTP checks, while **`utils`** and **`tests/api/helpers`** prevent duplication.
- **Configuration**: Single Playwright config loads **`.env`** once and wires **`baseURL`** for UI. API code reads **`ENV.API_URL`** so contract tests hit the same backend as the SPA (when configured that way).
- **Page / flow abstractions**: UI specs talk to **`LoginPage`**, **`RegisterPage`**, **`ProjectsPage`** for navigation, fills, and expectations. API specs use **`LoginApiUser`**, **`RegisterApiUser`**, **`ProjectApi`** so status codes, bodies, and error codes stay in one place.
- **Reporting**: Playwright’s built-in **`playwright-report/`** and **`test-results/`** are used; open the HTML report with **`npx playwright show-report`**. Additional reporters (JUnit, Slack, etc.) can be added in `playwright.config.ts` if the team standardizes on them.
- **Tags**: Many tests use **`@P0`**, **`@P1`**, **`@P2`** to signal critical vs validation vs UX depth; reviewers can filter with `--grep` or future CI jobs if desired.

---

## Combined UI and API usage (where it helps)

| Pattern | Why |
|--------|-----|
| **`registerApi` + `createUser` in UI `beforeAll`** (login spec) | Faster, flakier-free login tests than registering only through the UI for every run. |
| **`ensureUserExists`** (`tests/api/helpers/user.helper.ts`) | Same “create or ignore duplicate / rate limit” behavior for API and UI parents. |
| **`getAuthToken`** (uses **`LoginApiUser`**) | API project tests obtain a bearer token the same way login API tests do. |
| **`project_data.valid.generateProject()`** | Shared titles and fields for **`projects.api.spec.ts`** and **`projects.spec.ts`**. |
| **UI projects `beforeAll` → `ensureUserExists`** | One stable user; each test logs in through the UI for a realistic session. |

Pure API tests do **not** need a browser; pure UI tests do **not** need `APIRequestContext` except indirectly via seeding helpers.

---

## Test scope and priorities (checklist)

This suite **focuses on real user journeys and API contracts**, not exhaustive combinatorial coverage. Below is what we chose to cover and why.

### Authentication (UI)

- [x] **P0**: Successful login (username and email, case variants where the product allows).
- [x] **P0**: Wrong credentials stay on login with a clear error.
- [x] **P1**: Required-field validation (empty username/password).
- [x] **P1**: Leading/trailing spaces on identifiers where accepted.
- [x] **P2**: Links to register and password reset; gated route redirects to login; long/special inputs; password visibility toggle.

**Why:** Protects the main entry to the app and aligns with common regression areas (auth, validation, navigation).

### Authentication (API)

- [x] **P0/P1/P2**: Login and register payloads mirror UI intent: success paths, duplicate user rules, missing fields, `long_token`, edge strings.

**Why:** Catches backend changes before the UI fails mysteriously; shared constants keep messages and status expectations consistent.

### Projects (UI)

- [x] **P0**: List/navigation, create (including disabled Create until title), view details, edit + save, delete from edit UI.
- [x] **P1**: Cancel create, cancel edit without saving.

**Why:** Covers the documented product flows for Vikunja-style projects; uses **`project_data`** for parity with API tests.

### Projects (API)

- [x] **P0/P1**: CRUD with bearer auth, validation (e.g. empty title), missing/invalid token, missing resources, update/delete auth headers.

**Why:** Projects are permissioned; API tests validate contracts and auth independently of the browser.

### Explicitly out of scope or light touch (examples)

- Full multilingual or accessibility audits.
- Performance/load testing (429 handling is defensive only; see below).
- Every possible field combination on register/login (selected high-value paths only).

---

## Rate limiting (HTTP 429) and assertions

In a **perfectly controlled** environment, tests would assert only the **intended** status codes and messages (for example strictly **403** for bad login, **404** for missing project, **412** for invalid project payload).

Because **this suite may run against shared or rate-limited environments** that the test author does not control, several expectations **allow `429 Too Many Requests`** alongside the “happy” error status (for example in login/register error buckets and some project API paths). That keeps runs from **failing entirely** when the backend throttles traffic, at the cost of slightly weaker strictness when rate limits fire.

---

## Test case philosophy (summary)

- **Tag with P0/P1/P2** to separate release blockers from validation and nice-to-have UX checks.
- **Prefer page objects and API wrappers** so selectors and endpoint paths change in one place.
- **Reuse factories** (`user_data`, `project_data`) so UI and API stay aligned and tests read as user stories.
- **Seed users via API** where it speeds up UI tests without hiding UI defects (login and projects still exercise real browser login).
- **Document environment limits** (429) so reviewers interpret occasional failures correctly.

For questions about a specific file, see the short headers at the top of each spec and page object; they mirror the explanations in this README.
