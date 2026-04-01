# Architecture

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite 7, TailwindCSS 3, Shadcn/ui (Radix UI) |
| Routing | Wouter (hash-based: `/#/materials`) |
| Server state | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Backend (dev) | Express 5, Passport.js (local strategy), Drizzle ORM, SQLite |
| Database (prod) | Supabase (PostgreSQL 15) |
| Auth | Supabase Auth (email/password) |
| Deployment | Vercel (static SPA) |

## Repository Layout

```
capp-app/
├── client/src/
│   ├── components/
│   │   ├── ui/             # 30+ Shadcn/ui primitives — do not modify
│   │   ├── Sidebar.tsx     # Navigation + user footer + theme switcher
│   │   └── DataTable.tsx   # Generic sortable/filterable table
│   ├── pages/              # One file per route
│   ├── lib/
│   │   ├── authContext.tsx      # Supabase Auth state (user, profile, loading)
│   │   ├── themeContext.tsx     # Colour theme (localStorage + data-theme on <html>)
│   │   ├── supabase.ts          # Supabase client singleton
│   │   ├── supabaseQueries.ts   # All data-fetching functions
│   │   ├── queryClient.ts       # TanStack Query global config
│   │   └── utils.ts             # cn() helper
│   ├── App.tsx             # Provider tree + routing shell
│   └── index.css           # Tailwind base + CSS variable themes
├── server/
│   ├── index.ts            # Express app, middleware, listens on PORT (default 5000)
│   ├── routes.ts           # API route stubs (not used by frontend yet)
│   ├── storage.ts          # DatabaseStorage — Drizzle ORM (SQLite, users only)
│   ├── static.ts           # Serves dist/public/ in production
│   └── vite.ts             # Vite HMR middleware for development
├── shared/
│   └── schema.ts           # Drizzle schema — users table; types shared client/server
├── script/
│   └── build.ts            # Production build: Vite + esbuild
├── capp-supabase/
│   ├── sql/                # Full PostgreSQL schema, RLS, seed data, views
│   └── README.md           # Supabase setup guide (Slovak)
├── doc/                    # This documentation
├── vercel.json             # Tells Vercel to serve dist/public/ as static SPA
└── CLAUDE.md               # Guidance for Claude Code AI assistant
```

## Data Flow

```
Browser
  │
  ├─── Auth requests ──────────► Supabase Auth (JWT)
  │                                     │
  ├─── All data requests ───────► Supabase PostgREST API
  │         (materials, machines,        │ RLS enforced
  │          tools, workpieces,          │ per user role
  │          process plans)              ▼
  │                               PostgreSQL (Supabase)
  │
  └─── Static files ────────────► Vercel CDN (dist/public/)
```

The Express backend is **not used on Vercel**. `vercel.json` configures Vercel to build with `npm run build` and serve `dist/public/` directly. The Express server only runs locally (`npm run dev`) for development convenience.

## Provider Tree

```tsx
<QueryClientProvider>         // TanStack Query cache
  <ThemeProvider>             // Colour theme (localStorage)
    <AuthProvider>            // Supabase session + profile
      <AppShell />            // Router + layout
      <Toaster />             // Toast notifications
    </AuthProvider>
  </ThemeProvider>
</QueryClientProvider>
```

## Path Aliases

| Alias | Resolves to |
|---|---|
| `@/` | `client/src/` |
| `@shared/` | `shared/` |
| `@assets/` | `attached_assets/` |

## Routing

Wouter with `useHashLocation` — all routes are hash-based:

| Hash | Page |
|---|---|
| `/#/` | Dashboard |
| `/#/materials` | Materials |
| `/#/workpieces` | Workpieces |
| `/#/machines` | Machines |
| `/#/tools` | Tools |
| `/#/plans` | Process Plans |
| `/#/reports` | Reports |

Hash routing means no server-side routing config is needed — the static `index.html` handles everything.
