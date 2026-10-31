# Vessel Watchlist

A small full-stack app for tracking vessels and logging port calls, built with
**TypeScript**, **React**, and the **Rayfin SDK** on **Microsoft Fabric**.

Users sign in with Fabric SSO (Microsoft Entra ID), build a watchlist of vessels,
log port calls with ETA / actual arrival / actual departure, tag delay reasons,
attach notes, and see delay insights by port.

> All sample data is synthetic and for illustration only. No real operational
> or client data is used anywhere in this project.

## Screenshots

| Watchlist and port calls | Delay insights |
|--------------------------|----------------|
| ![Watchlist](docs/watchlist.png) | ![Insights](docs/insights.png) |

## What it demonstrates

- **Backend defined in TypeScript.** Three entities (`Vessel`, `PortCall`,
  `VesselNote`) declared with Rayfin decorators. Rayfin generates the database
  schema, the GraphQL API, and a type-safe client from them.
- **Per-user row-level security.** Every entity carries
  `@authenticated('*', { policy: (claims, item) => claims.sub.eq(item.user_id) })`,
  so a signed-in user can only read or change their own rows.
- **One source of truth for validation.** Field rules (lengths, regexes, enum
  values) live on the entity decorators and are reused for form validation via
  `toStandardSchema`. Only rules decorators cannot express (IMO check digit,
  departure-after-arrival) are hand-written.
- **Types derived from the schema.** The `VesselType`, `PortCallStatus`, and
  `DelayReason` unions come from the entities, and compile-time exhaustiveness
  checks (`src/domain/constants.ts`) fail the build if a UI list falls out of
  sync with a `@set(...)` decorator.
- **Repository pattern.** The UI talks to a `WatchlistRepository` interface with
  two implementations: `RayfinRepository` (Fabric) and `MemoryRepository`
  (local dev without a backend, and unit tests).
- **Pure domain logic with tests.** Delay calculation, port statistics, and IMO
  validation are plain functions with unit tests.
- **Correct pagination.** `.execute()` returns one page of 100 rows, so lists go
  through cursor pagination until `hasNextPage` is false.

## Data model

```text
Vessel 1 ──── * PortCall
   1
   └────────── * VesselNote
```

| Entity | Notable fields |
|--------|----------------|
| `Vessel` | `imo` (7 digits), `name`, `vesselType`, `flag?`, `isWatched` |
| `PortCall` | `portName`, `unlocode?`, `status`, `eta`, `ata?`, `atd?`, `berth?`, `delayReason` |
| `VesselNote` | `body`, `tag?` |

Delay is **derived** (`ata - eta`, in hours) rather than stored, so it cannot
drift out of sync with the timestamps.

Design notes:

- The watchlist flag is a field on `Vessel`. Rayfin does not support
  many-to-many relationships, and a separate watchlist entity would only
  duplicate the per-user vessel row.
- IMO uniqueness per user is enforced in the repository, because entities do not
  support composite constraints.
- Every `@text` has an explicit `max`; unbounded text maps to `NVARCHAR(MAX)`,
  which Rayfin's known limitations warn can break the generated GraphQL schema.

## Project structure

```text
rayfin/
├── rayfin.yml              # Fabric service configuration
└── data/                   # Entities + schema export
src/
├── domain/                 # Pure logic: types, IMO, delay stats, validation
├── services/               # Repository interface, Rayfin + in-memory impls, auth
├── hooks/                  # useWatchlist, AuthContext
├── components/             # Forms, tables, insights
├── pages/HomePage.tsx
└── __tests__/              # Vitest unit tests
```

## Run it locally

```bash
npm install
npm run test        # unit tests
npm run lint
npm run build       # typecheck + production build
```

`npm run dev` provisions or reuses a Fabric backend and requires you to be signed
in (`npx rayfin login`).

## Deploy to Fabric

Prerequisites:

- A Fabric capacity of F2 or higher, or a Fabric trial workspace.
- A tenant admin must enable the Fabric app items (preview) setting.

```bash
npx rayfin login
npx rayfin up --workspace "<your workspace name>"
npx rayfin up status
```

`rayfin up` builds the static app, deploys it, and applies schema migrations.
Use a personal or demo workspace for portfolio work, never an employer tenant.

## Status

- **Deployed and exercised on Fabric.** The app is deployed to a personal Fabric
  trial workspace. Signing in with Fabric SSO, loading data, creating and
  updating records through `RayfinRepository`, and the Insights view were all
  checked by hand against the live backend.
- **Automated checks:** TypeScript typecheck, ESLint, 28 unit tests (domain
  logic, validation, and the in-memory repository), and a production build.
  Rayfin's own schema analyzer also accepts the entities and generates the
  expected row-level policies and relationships.
- **Known gap:** `RayfinRepository` is not covered by automated tests; it was
  only verified manually. An integration test against a local Rayfin backend is
  the obvious next step.
- **No public demo.** The hosted app uses Fabric SSO and is private to the
  tenant it is deployed in, so see the screenshots below.
