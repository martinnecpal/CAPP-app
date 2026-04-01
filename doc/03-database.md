# Database

## Overview

The production database is PostgreSQL 15 hosted on Supabase. All SQL source files are in `capp-supabase/sql/`. Apply them in order via Supabase SQL Editor.

```
01_schema.sql       → ENUMs, tables, triggers, indexes
02_rls_policies.sql → Row Level Security for all tables
03_seed_data.sql    → Sample data for teaching
04_views.sql        → Reporting views
```

## ENUM Types

| ENUM | Values |
|---|---|
| `user_role` | `professor`, `student`, `readonly` |
| `material_class` | `steel`, `cast_iron`, `aluminum`, `titanium`, `nickel_alloy`, `copper_alloy`, `polymer`, `composite`, `other` |
| `operation_type` | `turning`, `milling`, `drilling`, `boring`, `grinding`, `broaching`, `reaming`, `tapping`, `honing`, `edm`, `laser_cutting`, `waterjet`, `welding`, `heat_treatment`, `surface_treatment`, `inspection`, `assembly`, `other` |
| `plan_status` | `draft`, `in_review`, `approved`, `released`, `obsolete` |
| `revision_status` | `draft`, `approved`, `superseded` |
| `cad_format` | `step`, `iges`, `parasolid`, `catia`, `solidworks`, `inventor`, `onshape`, `nx`, `creo`, `other` |
| `cam_format` | `fanuc`, `siemens_840d`, `heidenhain`, `mazak`, `okuma`, `haas`, `mitsubishi`, `fagor`, `generic_iso`, `other` |
| `tool_type` | `end_mill`, `face_mill`, `drill`, `tap`, `reamer`, `boring_bar`, `insert_holder`, `turning_insert`, `thread_mill`, `form_tool`, `special`, `other` |
| `surface_finish_unit` | `Ra`, `Rz`, `Rq` |

## Tables

### `profiles`
Extends Supabase Auth. Created automatically via trigger on `auth.users` INSERT.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | References `auth.users(id)` |
| `email` | TEXT | |
| `full_name` | TEXT | Nullable |
| `role` | user_role | Default: `student` |

### `materials`
Cutting material library.

| Column | Type | Notes |
|---|---|---|
| `code` | VARCHAR(50) | Unique identifier (e.g. `1.0503`) |
| `name` | VARCHAR(200) | |
| `material_class` | material_class | |
| `standard` | VARCHAR(100) | e.g. EN, DIN, ISO |
| `density_kg_m3` | NUMERIC(8,2) | |
| `tensile_strength_mpa` | NUMERIC(8,2) | |
| `yield_strength_mpa` | NUMERIC(8,2) | |
| `hardness_hb` | NUMERIC(6,2) | Brinell hardness |
| `machinability_index` | NUMERIC(5,2) | Relative to free-cutting steel = 100 |

### `cad_documents` + `cad_revisions`
CAD drawing registry. A document has multiple revisions; a workpiece points to one active revision.

### `workpieces`
The central entity — the part being machined.

| Column | Type | Notes |
|---|---|---|
| `part_number` | VARCHAR(100) | Unique |
| `material_id` | FK → materials | |
| `cad_document_id` | FK → cad_documents | |
| `active_cad_revision_id` | FK → cad_revisions | |
| `blank_dim_x/y/z_mm` | NUMERIC | Bounding box of raw stock |
| `blank_weight_kg` | NUMERIC | |
| `finished_weight_kg` | NUMERIC | |
| `buy_to_fly_ratio` | NUMERIC (generated) | blank / finished weight — auto-calculated |
| `annual_demand` | INT | Parts per year |

### `quality_requirements`
Tolerances and surface finish requirements per workpiece feature (child of `workpieces`).

### `machine_groups` + `machines`
Machine register. Each machine belongs to a group (e.g. "3-axis milling centres").

Key machine fields: `cnc_control`, `cam_format`, `travel_x/y/z_mm`, `max_spindle_rpm`, `tool_positions`, `hourly_rate_eur`, `availability_pct`.

### `tool_groups` + `tools`
Cutting tool library. Each tool belongs to a group.

Key tool fields: `tool_type`, `diameter_mm`, `cutting_length_mm`, `num_flutes`, `cutting_material`, `coating`, `tool_life_min`, `unit_cost_eur`, `iso_designation`.

### `cutting_conditions`
Recommended cutting parameters for a specific tool × material × operation_type combination.

| Column | Notes |
|---|---|
| `vc_min/rec/max_m_min` | Cutting speed range |
| `fz_min/rec/max_mm` | Feed per tooth range |
| `ap_max_mm` | Max axial depth of cut |
| `ae_max_mm` | Max radial depth of cut |

Unique constraint on `(tool_id, material_id, operation_type)`.

### `process_plans`
The top-level planning document for machining a workpiece.

| Column | Notes |
|---|---|
| `plan_number` | Unique identifier |
| `workpiece_id` | FK → workpieces |
| `revision` | Text code e.g. `01`, `02` |
| `status` | plan_status enum |
| `total_setup_time_min` | Rolled up from operations |
| `total_machining_time_min` | Rolled up from operations |
| `total_cost_eur` | Rolled up from operations |

### `plan_operations`
Individual machining steps within a process plan, ordered by `sequence_no`.

| Column | Notes |
|---|---|
| `operation_type` | operation_type enum |
| `setup_time_min` | Time to set up the machine |
| `machining_time_min` | Actual cutting time |
| `total_time_min` | Generated: setup + machining + auxiliary |
| `wcs_x/y/z` | Work Coordinate System origin |
| `fixture_description` | How the part is held |

### `operation_machines`
Many-to-many: operation ↔ machine. `is_primary` marks the main machine.

### `operation_tools`
Many-to-many: operation ↔ tool, with full cutting parameters per assignment.

| Column | Notes |
|---|---|
| `tool_position` | Position in tool magazine |
| `spindle_speed_rpm` | |
| `feed_rate_mm_min` | |
| `cutting_speed_m_min` | |
| `axial_depth_ap_mm` | |
| `radial_depth_ae_mm` | |

### `quality_checks`
In-process inspection steps, child of `plan_operations`.

### `nc_programs` + `nc_program_files`
NC/CNC programs output from CAM. A program is linked to a process plan and optionally to a specific operation. Files are stored in Supabase Storage with a `storage_path` reference.

### `production_orders` + `operation_schedule`
Production order management and machine scheduling. Links a workpiece + process plan to a time slot on a specific machine.

## Views

| View | Purpose |
|---|---|
| `v_process_plan_summary` | Plan list with op count, total times, workpiece+material |
| `v_operation_detail` | All operations with machine and tool details in one row |
| `v_cost_breakdown` | Per-operation cost using machine hourly rate |
| `v_cad_cam_link` | Full chain: workpiece → CAD doc → plan → operation → NC program |
| `v_users` | User list (professors see all; others see only themselves) |

## Row Level Security

All tables have RLS enabled. The `current_user_role()` function reads the caller's role from `profiles`:

```sql
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;
```

**Policy matrix:**

| Operation | `professor` | `student` | `readonly` |
|---|---|---|---|
| SELECT | ✅ | ✅ | ✅ |
| INSERT | ✅ | ✅ | ❌ |
| UPDATE | ✅ | ✅ | ❌ |
| DELETE | ✅ | ✅ | ❌ |

`profiles` is special: each user sees only their own row; professors see all rows.

## Triggers

- `on_auth_user_created` — inserts a `profiles` row when a new Supabase Auth user registers (role defaults to `student`)
- `trg_<table>_updated_at` — sets `updated_at = now()` on every UPDATE (applied to 10 tables)

## Indexes

Performance indexes exist on all foreign keys and high-selectivity filter columns: `material_class`, `process_plans.status`, `operation_type`, `operation_schedule.scheduled_start`, `cutting_conditions(tool_id, material_id)`.
