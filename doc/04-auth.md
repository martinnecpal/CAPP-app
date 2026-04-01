# Authentication

## Overview

Authentication is handled entirely by **Supabase Auth** (email/password). The frontend uses the Supabase JS client directly — no requests pass through the Express backend.

## Flow

```
1. User submits login form (LoginPage.tsx)
         │
         ▼
2. supabase.auth.signInWithPassword({ email, password })
         │
         ├── error → display message in form
         └── success → JWT stored in localStorage by Supabase client
                          │
                          ▼
3. onAuthStateChange fires in AuthProvider
         │
         ▼
4. Load profile: SELECT * FROM profiles WHERE id = auth.uid()
         │
         ▼
5. AuthProvider exposes { user, profile, session, loading }
         │
         ▼
6. AppShell renders dashboard (if user) or LoginPage (if null)
```

## AuthProvider (`client/src/lib/authContext.tsx`)

Wraps the entire app. Exposes via `useAuth()`:

| Field | Type | Description |
|---|---|---|
| `user` | `User \| null` | Raw Supabase Auth user (has `id`, `email`) |
| `profile` | `Profile \| null` | Row from `profiles` table — has `role` |
| `session` | `Session \| null` | JWT session |
| `loading` | `boolean` | True during initial session check |
| `signIn(email, password)` | async | Returns `{ error: string \| null }` |
| `signOut()` | async | Clears session and redirects to login |

## Session Persistence

Supabase JS client persists the JWT in `localStorage` automatically. On page load, `supabase.auth.getSession()` restores the session without requiring re-login. `onAuthStateChange` handles token refresh transparently.

## Role Access in Frontend

The `profile.role` value determines what the UI allows. Currently the sidebar and pages do not hide UI elements based on role — RLS on the database is the enforcement layer. Write operations simply fail (Supabase returns a 403) if a `readonly` user tries to insert/update/delete.

## Required Supabase Configuration

For auth to work on any domain (local or Vercel), that domain must be whitelisted:

1. Supabase Dashboard → **Authentication → URL Configuration**
2. **Site URL**: `https://project-capp.vercel.app`
3. **Redirect URLs**: add `https://project-capp.vercel.app/**` and `http://localhost:5000/**`

Without this, Supabase rejects login requests from unlisted origins (NetworkError in browser console).

## Adding Users

Users register via the Supabase Auth flow. To invite a user directly:
- Supabase Dashboard → **Authentication → Users → Invite user** (enter email)
- Or send them to the app's login page where they can sign up

New users get `student` role automatically. A professor can promote them:

```sql
-- In Supabase SQL Editor
SELECT set_user_role('user@stuba.sk', 'professor');
SELECT set_user_role('user@stuba.sk', 'readonly');
```

To view all users:

```sql
SELECT * FROM v_users;
```

## Express Backend Auth (unused on Vercel)

`server/index.ts` configures Passport.js (local strategy) + express-session + memorystore. This is **not connected to the frontend** and not used on Vercel. It exists as a foundation for future server-side API routes.
