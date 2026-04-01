# CAPP — Computer-Aided Process Planning

Web application for managing manufacturing workflows — materials, machines, tools, workpieces, and process plans — with role-based access control.

**Live:** https://project-capp.vercel.app

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS + Shadcn/ui + Wouter + TanStack Query
- **Backend:** Express 5 + Supabase (PostgreSQL + Auth)
- **Deployment:** Vercel (static SPA)

## Roles

| Role | Permissions |
|---|---|
| `professor` | Full read/write access |
| `student` | Full read/write access |
| `readonly` | Read only |

## Getting Started

```bash
cp .env.example .env      # add your Supabase credentials
npm install
npm run dev               # http://localhost:5000
```

## Database Setup

Apply SQL scripts in order via Supabase SQL Editor:

```
capp-supabase/sql/01_schema.sql
capp-supabase/sql/02_rls_policies.sql
capp-supabase/sql/03_seed_data.sql
capp-supabase/sql/04_views.sql
```

See [capp-supabase/README.md](capp-supabase/README.md) for full Supabase setup instructions.

## Commands

```bash
npm run dev       # Dev server with HMR (port 5000)
npm run build     # Production build
npm run check     # TypeScript type check
npm run db:push   # Apply Drizzle schema to SQLite
```

## Environment Variables

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
