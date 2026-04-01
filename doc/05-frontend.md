# Frontend

## Pages

Each page lives in `client/src/pages/` and is the direct target of a Wouter route.

| File | Route | Description |
|---|---|---|
| `LoginPage.tsx` | (no route — shown when unauthenticated) | Email/password form, calls `signIn()` from `useAuth()` |
| `DashboardPage.tsx` | `/#/` | Summary cards: counts of materials, workpieces, machines, tools, plans by status |
| `MaterialsPage.tsx` | `/#/materials` | CRUD table for the materials library |
| `WorkpiecesPage.tsx` | `/#/workpieces` | CRUD table for workpieces, shows linked material |
| `MachinesPage.tsx` | `/#/machines` | CRUD table for machines, shows machine group |
| `ToolsPage.tsx` | `/#/tools` | CRUD table for tools, shows tool group |
| `PlansPage.tsx` | `/#/plans` | CRUD table for process plans, shows workpiece |
| `ReportsPage.tsx` | `/#/reports` | Reporting views (v_process_plan_summary etc.) |

All CRUD pages follow the same pattern:
1. Fetch data with a `useQuery` hook wrapping a `supabaseQueries` function
2. Render a `<DataTable>` with columns config
3. Sheet/dialog for create/edit form (React Hook Form + Zod)
4. Optimistic `useMutation` for insert/update/delete, invalidates the query on success

## Components

### `Sidebar.tsx`
- Renders navigation links using `navItems` array
- Active link: `bg-primary text-primary-foreground`
- Footer: user email, role badge, theme settings popover, logout button
- Uses `useAuth()` for `profile` and `signOut`
- Uses `useTheme()` to show current theme and let user switch

### `DataTable.tsx`
Generic table component used by all CRUD pages. Accepts column definitions and row data; handles sorting and basic filtering.

## Data Fetching (`supabaseQueries.ts`)

All database queries are plain async functions returning a Supabase query builder result. They are called inside TanStack Query hooks in the pages.

| Function | Query |
|---|---|
| `getMaterials()` | `SELECT * FROM materials ORDER BY code` |
| `getWorkpieces()` | `SELECT *, materials(code, name, material_class) FROM workpieces ORDER BY part_number` |
| `getMachines()` | `SELECT *, machine_groups(code, name) FROM machines ORDER BY code` |
| `getTools()` | `SELECT *, tool_groups(code, name) FROM tools ORDER BY code` |
| `getProcessPlans()` | `SELECT *, workpieces(part_number, name) FROM process_plans ORDER BY plan_number` |
| `getOperations(planId)` | `SELECT * FROM plan_operations WHERE process_plan_id = planId ORDER BY sequence_no` |
| `getPlanSummary()` | `SELECT * FROM v_process_plan_summary` |
| `getOperationDetail(planNumber?)` | `SELECT * FROM v_operation_detail` (optional filter) |
| `getCostBreakdown(planNumber?)` | `SELECT * FROM v_cost_breakdown` (optional filter) |
| `getDashboardStats()` | Parallel count queries for all 5 entity types |

Each entity also has `insert*`, `update*`, `delete*` variants.

## Colour Theming (`themeContext.tsx`)

Four themes are available. The selected theme is stored in `localStorage` under the key `capp-theme` and applied as a `data-theme` attribute on `<html>`.

| Theme key | Primary colour | Slovak label |
|---|---|---|
| `green` (default) | `hsl(183 99% 22%)` — teal | Zelená |
| `blue` | `hsl(221 83% 53%)` | Modrá |
| `red` | `hsl(0 72% 51%)` | Červená |
| `gray` | `hsl(215 16% 37%)` | Sivá |

CSS overrides for non-default themes are in `index.css` under `:root[data-theme="blue"]` etc. Only `--primary`, `--primary-foreground`, `--ring`, `--accent`, `--accent-foreground` are overridden — all other design tokens stay constant.

The theme switcher UI is a `Popover` in the Sidebar footer, triggered by the `Settings2` gear icon.

## CSS Variables (Design Tokens)

Defined in `index.css` using `hsl()` component values (no `hsl()` wrapper — Tailwind consumes them as `hsl(var(--primary))`):

| Variable | Role |
|---|---|
| `--primary` | Active nav item, buttons, logo background, focus rings |
| `--accent` | Hover background on nav items |
| `--background` | Page background |
| `--card` | Sidebar, card surfaces |
| `--muted-foreground` | Secondary text, inactive nav labels |
| `--border` | All dividers and input borders |
| `--destructive` | Logout hover, delete actions |

Dark mode variables exist under `.dark` but there is no dark mode toggle in the UI yet.

## Adding a Shadcn/ui Component

```bash
npx shadcn@latest add <component-name>
```

Components are placed in `client/src/components/ui/`. Do not manually edit generated files — re-run the add command to update.
