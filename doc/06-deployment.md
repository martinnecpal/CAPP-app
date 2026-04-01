# Deployment

## Local Development

### Prerequisites

- Node.js 20+
- A Supabase project with the schema applied (see [03-database.md](03-database.md))

### Setup

```bash
git clone git@github.com:martinnecpal/CAPP-app.git
cd CAPP-app
npm install
cp .env.example .env
# Edit .env — add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

Open **http://localhost:5000**. Vite HMR is active — frontend changes hot-reload instantly. Server changes require a process restart.

### Environment Variables

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-public-key>
```

Find these in: Supabase Dashboard → Settings → API.

The `VITE_` prefix is required — Vite only injects variables with this prefix into the browser bundle. **These values are public** (visible in the built JS). Never put secret/service-role keys here.

## Production (Vercel)

### How It Works

`vercel.json` configures Vercel to:
1. Run `npm run build` (Vite → `dist/public/`, esbuild → `dist/index.cjs`)
2. Serve `dist/public/` as a static SPA

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist/public",
  "framework": null
}
```

The Express server (`dist/index.cjs`) is **not used on Vercel** — the frontend talks directly to Supabase. Vercel is purely a static host here.

### Auto-Deploy

The GitHub repository `martinnecpal/CAPP-app` is connected to the Vercel project `stuba/project-capp`. Every push to `main` triggers an automatic production deploy.

```
git add .
git commit -m "your message"
git push           # → triggers Vercel deploy automatically
```

Monitor deployments at: https://vercel.com/stuba/project-capp

### Manual Deploy

```bash
vercel --prod
```

### Environment Variables on Vercel

Set via CLI:
```bash
echo "https://..." | vercel env add VITE_SUPABASE_URL production
echo "sb_publishable_..." | vercel env add VITE_SUPABASE_ANON_KEY production
```

Or via Dashboard: vercel.com/stuba/project-capp/settings/environment-variables

Both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set for all environments (Development, Preview, Production).

### Vercel Project Info

| Field | Value |
|---|---|
| Project | `stuba/project-capp` |
| Production URL | https://project-capp.vercel.app |
| Dashboard | https://vercel.com/stuba/project-capp |
| Node version | 24.x |

## Build System

`npm run build` runs `script/build.ts` which:

1. Deletes `dist/`
2. Runs Vite (`viteBuild()`) → outputs to `dist/public/`
3. Runs esbuild → bundles `server/index.ts` to `dist/index.cjs` (~790 KB)

The esbuild step bundles selected server dependencies (Express, Passport, Drizzle, etc.) while externalising everything else to reduce cold-start time.

## Supabase Configuration for Vercel

For Supabase Auth to accept requests from the Vercel domain:

1. Supabase Dashboard → **Authentication → URL Configuration**
2. **Site URL**: `https://project-capp.vercel.app`
3. **Redirect URLs**: `https://project-capp.vercel.app/**`

Without this, login returns a NetworkError on the production URL.

## Commands Reference

```bash
npm run dev       # Dev server (Express + Vite HMR) on port 5000
npm run build     # Production build → dist/
npm start         # Serve production build (node dist/index.cjs)
npm run check     # TypeScript type-check (tsc --noEmit)
npm run db:push   # Push Drizzle schema changes to local SQLite
vercel --prod     # Manual production deploy
vercel env ls     # List Vercel environment variables
vercel logs <url> # View deployment logs
```
