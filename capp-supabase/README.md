# CAPP — Supabase Free Tier Setup

**Cena: 0 €/mes** (free tier — 500 MB storage, 50 000 aktívnych používateľov/mes)

---

## Štruktúra projektu

```
capp-supabase/
├── sql/
│   ├── 01_schema.sql        # Celá schéma (ENUMy, tabuľky, triggery)
│   ├── 02_rls_policies.sql  # Row Level Security — nahrádza GCP IAM
│   ├── 03_seed_data.sql     # Vzorové dáta pre výuku
│   └── 04_views.sql         # Views pre reporting
└── scripts/
    └── manage_users.sql     # Správa rolí používateľov
```

---

## Nasadenie (5 minút)

### 1. Vytvor Supabase projekt

1. Choď na [supabase.com](https://supabase.com) → **Start your project** → prihlásiť sa cez GitHub
2. **New project** → zadaj:
   - Name: `capp-edu`
   - Database Password: (ulož si ho!)
   - Region: **Central EU (Frankfurt)**
3. Počkaj ~2 minúty kým sa projekt inicializuje

### 2. Spusti SQL skripty

V Supabase dashboarde: **SQL Editor → New query**

Spusti skripty v tomto poradí — každý skopíruj, vlož a klikni **Run**:

```
1. sql/01_schema.sql
2. sql/02_rls_policies.sql
3. sql/03_seed_data.sql
4. sql/04_views.sql
```

### 3. Pripojenie

**Connection string** nájdeš v: Settings → Database → Connection string

```
postgresql://postgres:[HESLO]@db.[PROJECT-REF].supabase.co:5432/postgres
```

Alebo cez **Table Editor** priamo v dashboarde — žiadny proxy ani extra nástroje.

---

## Správa používateľov (namiesto GCP IAM)

### Registrácia študenta
1. Študent si vytvorí účet: **Authentication → Users → Invite user** (zadáš email)
   alebo pošleš link na `https://[PROJECT-REF].supabase.co/auth/v1/signup`
2. Po prvej registrácii dostane automaticky rolu `student`

### Zmena roly (profesor v SQL Editore)

```sql
-- Jeden používateľ
SELECT set_user_role('student01@stuba.sk', 'student');
SELECT set_user_role('kolega@stuba.sk', 'professor');
SELECT set_user_role('host@example.com', 'readonly');

-- Zoznam všetkých používateľov
SELECT * FROM v_users;
```

Alebo použi `scripts/manage_users.sql` pre hromadné nastavenie.

### Roly a práva

| Rola | SELECT | INSERT/UPDATE/DELETE | DDL (CREATE TABLE) |
|---|---|---|---|
| `professor` | ✅ všetko | ✅ všetko | ✅ cez SQL Editor |
| `student` | ✅ všetko | ✅ všetko | ✅ cez SQL Editor |
| `readonly` | ✅ všetko | ❌ | ❌ |

> **DDL pre študentov:** Supabase SQL Editor beží ako `postgres` superuser — študenti môžu vytvárať vlastné tabuľky priamo v editore. RLS polícy chránia len dáta cez API/klientské knižnice.

---

## Pripojenie z externých nástrojov

### DBeaver / DataGrip / pgAdmin
```
Host:     db.[PROJECT-REF].supabase.co
Port:     5432
Database: postgres
User:     postgres
Password: [tvoje heslo z kroku 1]
SSL:      required
```

### Python (psycopg2)
```python
import psycopg2
conn = psycopg2.connect(
    host="db.[PROJECT-REF].supabase.co",
    port=5432,
    dbname="postgres",
    user="postgres",
    password="[HESLO]",
    sslmode="require"
)
```

### Supabase Python klient (s Auth)
```python
from supabase import create_client
url  = "https://[PROJECT-REF].supabase.co"
key  = "[ANON KEY]"  # Settings → API → anon public
supabase = create_client(url, key)

# Prihlásenie
supabase.auth.sign_in_with_password({"email": "...", "password": "..."})

# Dopyt (RLS sa aplikuje automaticky)
data = supabase.table("workpieces").select("*").execute()
```

---

## Free Tier limity

| Limit | Hodnota | CAPP využitie |
|---|---|---|
| Storage | 500 MB | ≫ stačí (dáta << 10 MB) |
| Aktívni používatelia | 50 000/mes | stačí pre kurz |
| Bandwidth | 5 GB/mes | stačí |
| API requesty | neobmedzené | ✅ |
| Projekty | 2 | ✅ |
| Zálohy | 1 deň | ✅ |
| **Cena** | **0 €** | ✅ |

> Projekt sa **pozastaví** po 1 týždni nečinnosti na free tiere — stačí kliknúť "Restore" alebo nastaviť cron ping.

---

## Schéma tabuliek

| Tabuľka | Popis |
|---|---|
| `profiles` | Používatelia — prepojenie na Supabase Auth + rola |
| `materials` | Knižnica materiálov |
| `cad_documents` + `cad_revisions` | CAD výkresy a ich revízie |
| `workpieces` | Obrobky (materiál + CAD + rozmery) |
| `quality_requirements` | Tolerancie a požiadavky Ra/Rz |
| `machine_groups` + `machines` | Register strojov |
| `tool_groups` + `tools` | Knižnica nástrojov |
| `cutting_conditions` | Rezné podmienky (nástroj × materiál) |
| `process_plans` | Technologické postupy |
| `plan_operations` | Sekvencie operácií |
| `operation_machines` + `operation_tools` | Priradenie stroj/nástroj → operácia |
| `quality_checks` | Medzioperačná kontrola |
| `nc_programs` + `nc_program_files` | NC programy (CAM výstupy) |
| `production_orders` + `operation_schedule` | Výrobné príkazy a rozvrh |
