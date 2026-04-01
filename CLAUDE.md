# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CAPP (Computer-Aided Process Planning) is a full-stack web app for managing manufacturing workflows — materials, machines, tools, workpieces, and process plans — with role-based access control (`professor`, `student`, `readonly`).

## Commands

```bash
npm run dev       # Start dev server (Express + Vite HMR) on port 5000
npm run build     # Bundle client (Vite → dist/public/) + server (esbuild → dist/index.cjs)
npm start         # Run production build
npm run check     # TypeScript type checking (tsc)
npm run db:push   # Apply Drizzle schema migrations to SQLite
```

No test or lint commands are defined.

## Architecture

### Tech Stack
- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS + Shadcn/ui (Radix UI) + Wouter (hash-based routing) + TanStack Query + React Hook Form
- **Backend:** Express 5 + Passport.js (local strategy) + Drizzle ORM + SQLite (`data.db`)
- **Alternative DB:** Supabase (PostgreSQL) — full schema and RLS policies in `capp-supabase/sql/`

### Structure

```
client/src/
  components/ui/    # 30+ Shadcn/ui primitives (do not modify generated files)
  components/       # App-specific components (Sidebar, DataTable)
  pages/            # Route-level components (Dashboard, Materials, Machines, Tools, Workpieces, Plans, Reports, Login)
  lib/
    authContext.tsx      # Auth provider; manages session, user, profile state
    supabase.ts          # Supabase client (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)
    supabaseQueries.ts   # React Query hooks for all data fetching
    queryClient.ts       # TanStack Query global config
server/
  index.ts          # Express setup, middleware, dev/prod branching; respects PORT env var (default 5000)
  routes.ts         # API route registration (stub — no endpoints yet)
  storage.ts        # DatabaseStorage class (Drizzle ORM, currently users only)
  static.ts         # Serves dist/public/ in production
  vite.ts           # Vite middleware for development
shared/
  schema.ts         # Drizzle ORM schema (shared between server and client types)
script/
  build.ts          # Production build: Vite (client) + esbuild (server)
capp-supabase/      # Supabase migration guide (Slovak) + SQL files for full schema
```

### Data Flow

- The frontend talks directly to **Supabase** via the Supabase JS client for all manufacturing data (materials, machines, tools, workpieces, plans).
- The Express backend currently only handles session-based auth (Passport local) and serves the Vite app. API routes in `server/routes.ts` are not yet implemented.
- Path aliases: `@/` → `client/src/`, `@shared/` → `shared/`, `@assets` → `attached_assets/`

### Language Note

Comments and section headers in `supabaseQueries.ts` are in Slovak (e.g., `MATERIÁLY`, `OBROBKY`, `STROJE`, `NÁSTROJE`). Some Supabase table/column names also reflect Slovak domain vocabulary.

### Database

- **Dev/SQLite:** `drizzle.config.ts` points to `./data.db`. Schema is minimal (users table only). Use `npm run db:push` after editing `shared/schema.ts`.
- **Target/Supabase:** The full production schema (machines, materials, tools, workpieces, process_plans, NC programs, RLS policies) lives in `capp-supabase/sql/`. Apply with Supabase dashboard or CLI.

### Authentication

- Frontend: Supabase Auth handles login/session; `authContext.tsx` exposes `user`, `profile`, and `loading`.
- Backend: Passport Local + Express Session is wired up but not integrated with the frontend yet.

### UI Components

All Shadcn/ui components are pre-installed in `client/src/components/ui/`. Add new ones with `npx shadcn@latest add <component>` per `components.json` config.
