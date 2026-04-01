# CAPP — Project Overview

## What is CAPP?

CAPP (Computer-Aided Process Planning) is a web application for managing manufacturing workflows in an educational context (STU Bratislava). It covers the full lifecycle of a machined part:

```
Material → Workpiece → Process Plan → Operations → NC Programs
```

Users can maintain a library of materials, machines, and tools, create detailed process plans with sequenced machining operations, assign machines and tools to each operation, and generate cost estimates — all with role-based access control.

## Live Application

| Environment | URL |
|---|---|
| Production | https://project-capp.vercel.app |
| GitHub | https://github.com/martinnecpal/CAPP-app |

## User Roles

| Role | Read | Write / Delete | Notes |
|---|---|---|---|
| `professor` | All tables | All tables | Can also change user roles via `set_user_role()` |
| `student` | All tables | All tables | Cannot change roles |
| `readonly` | All tables | — | Observation only |

New users are automatically assigned the `student` role upon registration. Role changes are performed by a professor via Supabase SQL Editor:

```sql
SELECT set_user_role('student@stuba.sk', 'student');
SELECT set_user_role('colleague@stuba.sk', 'professor');
SELECT set_user_role('guest@example.com', 'readonly');
```

## Domain Entities

| Entity | Slovak | Description |
|---|---|---|
| Materials | Materiály | Metal/polymer library with mechanical properties |
| Workpieces | Obrobky | Parts to be machined; linked to material and CAD |
| Machines | Stroje | CNC machines grouped by type |
| Tools | Nástroje | Cutting tools with geometry and cutting data |
| Process Plans | Postupy | Step-by-step machining plans for a workpiece |
| Operations | Operácie | Individual machining steps within a plan |
| NC Programs | NC programy | CAM output files linked to operations |

## Language

- UI labels and navigation: Slovak
- Source code comments in `supabaseQueries.ts`: Slovak section headers
- SQL files: Slovak inline comments
- TypeScript interfaces, function names, CSS: English
