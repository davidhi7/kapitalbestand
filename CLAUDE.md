t # CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kapitalbestand is a personal finance/expense tracking application with a Rust backend (Axum) and Vue 3 frontend. The UI locale is German.

## Architecture

- **backend-v2/**: Rust backend using Axum, SQLx (Postgres), axum-login for session auth, garde for validation
- **frontend/**: Vue 3 + TypeScript SPA using Vite, PrimeVue (Aura theme), Pinia stores, Tailwind CSS, Chart.js
- **Dockerfile**: Multi-stage build — compiles the Rust backend (`backend-v2/`, with `SQLX_OFFLINE=true`) and the Vue frontend, then bundles them into a `debian:bookworm-slim` image where the backend binary serves the built frontend from `./static/` on port 8080

The backend uses a `Resource` trait pattern (`backend-v2/src/app/resources.rs`) with a `build_routes!` macro that generates standard CRUD endpoints (POST, GET, GET/:id, PATCH/:id, DELETE/:id) for any type implementing `Resource`. Resources: `Category`, `Shop`, `OneoffTransaction`, `RecurringTransaction`.

All API routes are under `/api` and require session authentication (except `/api/auth/login` and `/api/auth/register`). API responses follow `{ "status": "success", "data": ... }` format.

The frontend proxies `/api` requests to `localhost:8080` in dev mode.

## Development Commands

### Backend (from `backend-v2/`)
```bash
cargo build                    # Build
cargo run                      # Run (needs DATABASE_URL in .env)
cargo test                     # Run tests (uses sqlx::test with real Postgres)
cargo test test_name           # Run a single test
```

Backend tests use `#[sqlx::test]` which requires a running Postgres instance. The test database is configured via `DATABASE_URL` in `backend-v2/.env`.

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

### Docker (production)
```bash
docker compose up              # Starts Postgres + app on port 8080
```

## Code Style

- **Frontend**: 4-space indent, single quotes, semicolons, trailing commas off. Import order: external packages → `@/` aliases → relative. Enforced by Prettier and ESLint configs in `frontend/package.json` and `frontend/eslint.config.js`.
- **Backend**: Rust 2024 edition. Uses `anyhow` for application errors, `thiserror` for library-style errors, `garde` derive macros for request validation.

## Database Schema

Key tables: `users`, `categories`, `shops`, `oneoff_transactions`, `recurring_transactions`. All resources are scoped to a user (multi-tenant by `user_id`). Amounts are stored as integers (cents). Recurring transactions have a `recurrence_frequency` enum (`monthly`, `yearly`) with date constraints enforced at the DB level.
