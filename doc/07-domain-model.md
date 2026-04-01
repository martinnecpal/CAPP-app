# Domain Model

This document explains the relationships between manufacturing entities and the workflow they represent.

## Entity Relationship Overview

```
materials ──────────────────────────────────────────────────┐
                                                            │
cad_documents                                               │
  └── cad_revisions                                         │
           │                                                │
           └──────────────► workpieces ◄────────────────────┘
                              │   └── quality_requirements
                              │
                         process_plans
                              │   └── plan_revisions
                              │
                         plan_operations
                         ├── operation_machines ──► machines ◄── machine_groups
                         ├── operation_tools ─────► tools ◄───── tool_groups
                         │                             └── cutting_conditions ──► materials
                         └── quality_checks ──► quality_requirements
                              │
                         nc_programs
                              └── nc_program_files
                              │
                         production_orders
                              └── operation_schedule ──► machines
```

## Workflow: From Material to NC Program

### Step 1 — Define the Material

Create a material in the library (`materials`). Include mechanical properties: density, tensile strength, hardness, machinability index. Assign a `material_class` (e.g. `steel`, `aluminum`).

### Step 2 — Register the CAD Document

Create a `cad_document` record with a reference to the external file (OnShape URL, Vault path, etc.). Add a `cad_revision` with its status (`draft`, `approved`).

### Step 3 — Create the Workpiece

Link the workpiece to a material and CAD document. Record blank dimensions and weights. The `buy_to_fly_ratio` (blank weight / finished weight) is auto-calculated — important for aerospace parts.

Add `quality_requirements` for critical features (tolerances, surface finish Ra/Rz).

### Step 4 — Create a Process Plan

Create a `process_plan` for the workpiece. Set initial status to `draft`. The plan tracks total times and costs rolled up from operations.

**Plan status lifecycle:**
```
draft → in_review → approved → released → obsolete
```

Only `released` plans should be used in production.

### Step 5 — Add Operations

Add `plan_operations` in sequence order. Each operation specifies:
- `operation_type` (milling, turning, drilling, etc.)
- Setup time, machining time (auxiliary time optional)
- Fixture description (how the part is held)
- Work Coordinate System origin (wcs_x/y/z)
- Coolant type

### Step 6 — Assign Machines and Tools

For each operation:
- `operation_machines`: link one or more machines; mark one as `is_primary = true`
- `operation_tools`: link tools with specific cutting parameters (RPM, feed rate, depth of cut)

Cutting parameter suggestions can come from the `cutting_conditions` table (tool × material × operation type).

### Step 7 — Add Quality Checks

Link `quality_checks` to operations that require in-process inspection. Reference specific `quality_requirements` from the workpiece.

### Step 8 — Attach NC Programs

Create `nc_programs` linked to the process plan (and optionally to a specific operation). Record the CAM format, CNC control, postprocessor, and tool path strategy. Attach the actual file via `nc_program_files` (stored in Supabase Storage).

### Step 9 — Release the Plan

When reviewed and approved, change `process_plan.status` to `released`. Save a snapshot to `plan_revisions` before major changes.

### Step 10 — Production Orders (optional)

Create `production_orders` referencing the workpiece + released process plan. Schedule operations on specific machines via `operation_schedule`.

## Cutting Conditions Library

The `cutting_conditions` table is a three-way lookup: **tool × material × operation_type**.

It stores recommended speed/feed ranges that can be used to auto-fill `operation_tools` parameters:

```sql
SELECT vc_rec_m_min, fz_rec_mm, ap_max_mm
FROM cutting_conditions
WHERE tool_id = :tool_id
  AND material_id = :material_id
  AND operation_type = 'milling';
```

## Cost Calculation

Operation cost is estimated using machine hourly rate:

```
operation_cost = (total_time_min / 60) × machine.hourly_rate_eur
```

The `v_cost_breakdown` view computes this for each operation. The process plan stores `total_cost_eur` as the sum of all operation costs.

## Key Constraints

- `workpieces.part_number` — unique
- `process_plans.plan_number` — unique
- `plan_operations(process_plan_id, sequence_no)` — unique (no duplicate step numbers)
- `operation_tools(operation_id, tool_position)` — unique (one tool per magazine position)
- `cutting_conditions(tool_id, material_id, operation_type)` — unique
- `cad_revisions(cad_document_id, revision_code)` — unique
