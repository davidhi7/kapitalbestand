# CLAUDE.md

## Project Overview

Kapitalbestand is a personal finance/expense tracking application with a Rust backend (Axum) and Vue 3 frontend. The UI locale is German.

## Architecture

- **backend-v2/**: Rust backend using Axum, SQLx (Postgres), axum-login for session auth, garde for validation
- **frontend/**: Vue 3 + TypeScript SPA using Vite, PrimeVue (Aura theme), Pinia stores, Tailwind CSS, Chart.js

The backend uses a `Resource` trait pattern (`backend-v2/src/app/resources.rs`) that abstracts standard CRUD endpoints (POST `/`, GET `/`, GET `/{id}`, PATCH `/{id}`, DELETE `/{id}`) for any type implementing `Resource`. The generic handlers in `resources.rs` are the single place CRUD HTTP semantics live (status codes, `Option`→404, etc.); per-resource logic lives in the `Resource` impls. Resources and their mount points (`app.rs::router`):

- `Category` → `/api/categories`
- `Shop` → `/api/shops`
- `OneoffTransaction` → `/api/transactions/oneoff`
- `RecurringTransaction` → `/api/transactions/recurring`

Per-resource API reference lives in `backend-v2/docs/` — one file per resource (`categories.md`, `shops.md`, `oneoff-transactions.md`, `recurring-transactions.md`). Update these when changing a resource's API.

**JSON convention.** Rust structs are snake_case; the wire format is camelCase via `#[serde(rename_all = "camelCase")]`. The frontend uses camelCase throughout. When adding a field, the Rust field name and the JSON/TS name differ by case only. Amounts of money are integers representing cents, e.g. `amount: 1500` means 15.00 EUR.

## Development Commands

### Backend (from `backend-v2/`)

```bash
cargo build                    # Build
cargo run                      # Run (needs DATABASE_URL in .env)
cargo test                     # Run tests (uses sqlx::test with real Postgres)
cargo test test_name           # Run a single test
cargo sqlx prepare             # Regenerate the .sqlx offline cache (needs sqlx-cli)
```

Backend tests use `#[sqlx::test]`, which spins up an isolated database per test against a running Postgres instance (configured via `DATABASE_URL` in `backend-v2/.env`). Tests seed data with SQL fixtures from `backend-v2/src/app/resources/fixtures/` via `#[sqlx::test(fixtures("base", ...))]`.

**SQLx offline cache (important):** the `query!`/`query_as!`/`query_scalar!` macros are type-checked against the DB at compile time. A committed `.sqlx/` cache lets the Docker build compile with `SQLX_OFFLINE=true` and no live DB. After changing any SQL in those macros, run `cargo sqlx prepare` against a live DB and commit the updated `.sqlx/` — otherwise the offline/Docker build fails or uses stale query metadata.

### Database

```bash
# Start dev Postgres (tmpfs, ephemeral):
backend-v2/scripts/database.sh
# Credentials: test/test on localhost:5432, database kapitalbestand-dev
```

Migrations are in `backend-v2/migrations/` and run automatically on app startup via `sqlx::migrate!`.

### Frontend (from `frontend/`)

```bash
npm run dev                    # Vite dev server
npm run build                  # Production build
npm run lint                   # ESLint
npm run lint:fix               # ESLint with auto-fix
npm run format                 # Prettier
```

## Code Style

- **Frontend**: 4-space indent, single quotes, semicolons, trailing commas off. Import order: external packages → `@/` aliases → relative. Enforced by Prettier and ESLint configs in `frontend/package.json` and `frontend/eslint.config.js`.
- **Backend**: Rust 2024 edition. Uses `anyhow` for application errors, `thiserror` for library-style errors, `garde` derive macros for request validation.

## Database Schema

Key tables: `users`, `categories`, `shops`, `oneoff_transactions`, `recurring_transactions`. All resources are scoped to a user (multi-tenant by `user_id`). Amounts are stored as integers (cents). Recurring transactions have a `recurrence_frequency` enum (`monthly`, `yearly`) with date constraints enforced at the DB level.
