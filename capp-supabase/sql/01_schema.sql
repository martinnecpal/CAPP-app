-- =============================================================
-- CAPP DATABASE — Supabase / PostgreSQL 15
-- Schéma: public (Supabase default)
--
-- Spusti v Supabase SQL Editor:
--   Dashboard → SQL Editor → New query → paste → Run
-- =============================================================

-- =============================================================
-- ENUM TYPY
-- =============================================================

CREATE TYPE material_class AS ENUM (
  'steel', 'cast_iron', 'aluminum', 'titanium',
  'nickel_alloy', 'copper_alloy', 'polymer', 'composite', 'other'
);

CREATE TYPE operation_type AS ENUM (
  'turning', 'milling', 'drilling', 'boring', 'grinding',
  'broaching', 'reaming', 'tapping', 'honing', 'edm',
  'laser_cutting', 'waterjet', 'welding', 'heat_treatment',
  'surface_treatment', 'inspection', 'assembly', 'other'
);

CREATE TYPE plan_status AS ENUM (
  'draft', 'in_review', 'approved', 'released', 'obsolete'
);

CREATE TYPE revision_status AS ENUM (
  'draft', 'approved', 'superseded'
);

CREATE TYPE cad_format AS ENUM (
  'step', 'iges', 'parasolid', 'catia', 'solidworks',
  'inventor', 'onshape', 'nx', 'creo', 'other'
);

CREATE TYPE cam_format AS ENUM (
  'fanuc', 'siemens_840d', 'heidenhain', 'mazak', 'okuma',
  'haas', 'mitsubishi', 'fagor', 'generic_iso', 'other'
);

CREATE TYPE tool_type AS ENUM (
  'end_mill', 'face_mill', 'drill', 'tap', 'reamer',
  'boring_bar', 'insert_holder', 'turning_insert',
  'thread_mill', 'form_tool', 'special', 'other'
);

CREATE TYPE surface_finish_unit AS ENUM ('Ra', 'Rz', 'Rq');

-- Rola používateľa — uložená v profiles
CREATE TYPE user_role AS ENUM ('professor', 'student', 'readonly');

-- =============================================================
-- PROFILES — prepojenie na Supabase Auth
-- Každý registrovaný používateľ dostane riadok tu
-- =============================================================

CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  role        user_role NOT NULL DEFAULT 'student',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE profiles IS
  'Rozširuje Supabase Auth — rola používateľa (professor / student / readonly)';

-- Automatické vytvorenie profilu pri registrácii
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'student');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================
-- 1. MATERIÁLY
-- =============================================================

CREATE TABLE materials (
  id                   SERIAL PRIMARY KEY,
  code                 VARCHAR(50)  NOT NULL UNIQUE,
  name                 VARCHAR(200) NOT NULL,
  material_class       material_class NOT NULL,
  standard             VARCHAR(100),
  density_kg_m3        NUMERIC(8,2),
  tensile_strength_mpa NUMERIC(8,2),
  yield_strength_mpa   NUMERIC(8,2),
  hardness_hb          NUMERIC(6,2),
  machinability_index  NUMERIC(5,2),
  notes                TEXT,
  created_by           UUID REFERENCES profiles(id),
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

-- =============================================================
-- 2. CAD DOKUMENTY A REVÍZIE
-- =============================================================

CREATE TABLE cad_documents (
  id           SERIAL PRIMARY KEY,
  doc_number   VARCHAR(100) NOT NULL UNIQUE,
  title        VARCHAR(300) NOT NULL,
  description  TEXT,
  format       cad_format NOT NULL,
  external_url TEXT,        -- odkaz na OnShape, Google Drive, atď.
  vault_path   TEXT,
  created_by   UUID REFERENCES profiles(id),
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE cad_revisions (
  id               SERIAL PRIMARY KEY,
  cad_document_id  INT NOT NULL REFERENCES cad_documents(id) ON DELETE CASCADE,
  revision_code    VARCHAR(20)  NOT NULL,
  status           revision_status NOT NULL DEFAULT 'draft',
  released_at      TIMESTAMPTZ,
  released_by      UUID REFERENCES profiles(id),
  change_description TEXT,
  file_checksum    VARCHAR(64),
  file_size_bytes  BIGINT,
  thumbnail_url    TEXT,
  created_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE (cad_document_id, revision_code)
);

-- =============================================================
-- 3. OBROBKY
-- =============================================================

CREATE TABLE workpieces (
  id                     SERIAL PRIMARY KEY,
  part_number            VARCHAR(100) NOT NULL UNIQUE,
  name                   VARCHAR(300) NOT NULL,
  description            TEXT,
  material_id            INT REFERENCES materials(id),
  cad_document_id        INT REFERENCES cad_documents(id),
  active_cad_revision_id INT REFERENCES cad_revisions(id),
  blank_type             VARCHAR(50),
  blank_dim_x_mm         NUMERIC(10,3),
  blank_dim_y_mm         NUMERIC(10,3),
  blank_dim_z_mm         NUMERIC(10,3),
  blank_weight_kg        NUMERIC(10,4),
  finished_weight_kg     NUMERIC(10,4),
  buy_to_fly_ratio       NUMERIC(6,3)
    GENERATED ALWAYS AS (
      CASE WHEN finished_weight_kg > 0
           THEN blank_weight_kg / finished_weight_kg
           ELSE NULL END
    ) STORED,
  annual_demand          INT DEFAULT 0,
  batch_size             INT DEFAULT 1,
  notes                  TEXT,
  created_by             UUID REFERENCES profiles(id),
  created_at             TIMESTAMPTZ DEFAULT now(),
  updated_at             TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE quality_requirements (
  id                   SERIAL PRIMARY KEY,
  workpiece_id         INT NOT NULL REFERENCES workpieces(id) ON DELETE CASCADE,
  feature_name         VARCHAR(200) NOT NULL,
  tolerance_class      VARCHAR(20),
  nominal_value_mm     NUMERIC(12,5),
  upper_tol_mm         NUMERIC(10,5),
  lower_tol_mm         NUMERIC(10,5),
  surface_finish_value NUMERIC(8,3),
  surface_finish_unit  surface_finish_unit DEFAULT 'Ra',
  geometric_tol_type   VARCHAR(50),
  geometric_tol_mm     NUMERIC(10,5),
  datum_references     TEXT,
  notes                TEXT
);

-- =============================================================
-- 4. STROJE
-- =============================================================

CREATE TABLE machine_groups (
  id          SERIAL PRIMARY KEY,
  code        VARCHAR(50)  NOT NULL UNIQUE,
  name        VARCHAR(200) NOT NULL,
  description TEXT
);

CREATE TABLE machines (
  id                   SERIAL PRIMARY KEY,
  machine_group_id     INT REFERENCES machine_groups(id),
  code                 VARCHAR(50)  NOT NULL UNIQUE,
  name                 VARCHAR(200) NOT NULL,
  manufacturer         VARCHAR(100),
  model                VARCHAR(100),
  year_of_mfg          SMALLINT,
  cnc_control          VARCHAR(100),
  cam_format           cam_format,
  travel_x_mm          NUMERIC(8,2),
  travel_y_mm          NUMERIC(8,2),
  travel_z_mm          NUMERIC(8,2),
  max_spindle_rpm      INT,
  max_spindle_power_kw NUMERIC(6,2),
  max_torque_nm        NUMERIC(8,2),
  tool_positions       SMALLINT,
  pallet_size_mm       VARCHAR(50),
  hourly_rate_eur      NUMERIC(8,2),
  availability_pct     NUMERIC(5,2) DEFAULT 85.0,
  location             VARCHAR(100),
  is_active            BOOLEAN DEFAULT TRUE,
  notes                TEXT,
  created_by           UUID REFERENCES profiles(id),
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

-- =============================================================
-- 5. NÁSTROJE
-- =============================================================

CREATE TABLE tool_groups (
  id          SERIAL PRIMARY KEY,
  code        VARCHAR(50)  NOT NULL UNIQUE,
  name        VARCHAR(200) NOT NULL,
  tool_type   tool_type NOT NULL,
  description TEXT
);

CREATE TABLE tools (
  id                SERIAL PRIMARY KEY,
  tool_group_id     INT REFERENCES tool_groups(id),
  code              VARCHAR(100) NOT NULL UNIQUE,
  name              VARCHAR(300) NOT NULL,
  tool_type         tool_type NOT NULL,
  manufacturer      VARCHAR(100),
  catalog_number    VARCHAR(100),
  diameter_mm       NUMERIC(8,3),
  cutting_length_mm NUMERIC(8,3),
  overall_length_mm NUMERIC(8,3),
  num_flutes        SMALLINT,
  helix_angle_deg   NUMERIC(5,2),
  point_angle_deg   NUMERIC(5,2),
  cutting_material  VARCHAR(50),
  coating           VARCHAR(50),
  tool_life_min     NUMERIC(8,2),
  unit_cost_eur     NUMERIC(8,2),
  regrind_possible  BOOLEAN DEFAULT FALSE,
  regrind_cost_eur  NUMERIC(8,2),
  iso_designation   VARCHAR(100),
  notes             TEXT,
  is_active         BOOLEAN DEFAULT TRUE,
  created_by        UUID REFERENCES profiles(id),
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE cutting_conditions (
  id               SERIAL PRIMARY KEY,
  tool_id          INT NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  material_id      INT NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  operation_type   operation_type NOT NULL,
  vc_min_m_min     NUMERIC(8,2),
  vc_rec_m_min     NUMERIC(8,2),
  vc_max_m_min     NUMERIC(8,2),
  fz_min_mm        NUMERIC(10,5),
  fz_rec_mm        NUMERIC(10,5),
  fz_max_mm        NUMERIC(10,5),
  ap_max_mm        NUMERIC(8,3),
  ae_max_mm        NUMERIC(8,3),
  coolant_required BOOLEAN DEFAULT FALSE,
  source           VARCHAR(200),
  notes            TEXT,
  UNIQUE (tool_id, material_id, operation_type)
);

-- =============================================================
-- 6. TECHNOLOGICKÉ POSTUPY
-- =============================================================

CREATE TABLE process_plans (
  id                       SERIAL PRIMARY KEY,
  plan_number              VARCHAR(100) NOT NULL UNIQUE,
  workpiece_id             INT NOT NULL REFERENCES workpieces(id),
  revision                 VARCHAR(20)  NOT NULL DEFAULT '01',
  status                   plan_status NOT NULL DEFAULT 'draft',
  title                    VARCHAR(300),
  description              TEXT,
  production_type          VARCHAR(50),
  batch_size               INT DEFAULT 1,
  created_by               UUID REFERENCES profiles(id),
  approved_by              UUID REFERENCES profiles(id),
  approved_at              TIMESTAMPTZ,
  released_at              TIMESTAMPTZ,
  total_setup_time_min     NUMERIC(10,2),
  total_machining_time_min NUMERIC(10,2),
  total_cost_eur           NUMERIC(12,2),
  notes                    TEXT,
  created_at               TIMESTAMPTZ DEFAULT now(),
  updated_at               TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE plan_revisions (
  id              SERIAL PRIMARY KEY,
  process_plan_id INT NOT NULL REFERENCES process_plans(id) ON DELETE CASCADE,
  revision_code   VARCHAR(20) NOT NULL,
  changed_by      UUID REFERENCES profiles(id),
  changed_at      TIMESTAMPTZ DEFAULT now(),
  change_summary  TEXT,
  snapshot_json   JSONB,
  UNIQUE (process_plan_id, revision_code)
);

-- =============================================================
-- 7. OPERÁCIE
-- =============================================================

CREATE TABLE plan_operations (
  id                 SERIAL PRIMARY KEY,
  process_plan_id    INT NOT NULL REFERENCES process_plans(id) ON DELETE CASCADE,
  sequence_no        SMALLINT NOT NULL,
  operation_code     VARCHAR(50),
  operation_type     operation_type NOT NULL,
  name               VARCHAR(300) NOT NULL,
  description        TEXT,
  setup_time_min     NUMERIC(8,2) DEFAULT 0,
  machining_time_min NUMERIC(8,2) DEFAULT 0,
  auxiliary_time_min NUMERIC(8,2) DEFAULT 0,
  total_time_min     NUMERIC(8,2)
    GENERATED ALWAYS AS (
      setup_time_min + machining_time_min + auxiliary_time_min
    ) STORED,
  fixture_description  TEXT,
  fixture_drawing_ref  VARCHAR(100),
  datum_description    TEXT,
  wcs_x                NUMERIC(10,4),
  wcs_y                NUMERIC(10,4),
  wcs_z                NUMERIC(10,4),
  coolant_type         VARCHAR(50),
  lubrication_type     VARCHAR(50),
  cost_eur             NUMERIC(10,2),
  work_instructions    TEXT,
  safety_notes         TEXT,
  UNIQUE (process_plan_id, sequence_no),
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE operation_machines (
  id           SERIAL PRIMARY KEY,
  operation_id INT NOT NULL REFERENCES plan_operations(id) ON DELETE CASCADE,
  machine_id   INT NOT NULL REFERENCES machines(id),
  is_primary   BOOLEAN DEFAULT TRUE,
  priority     SMALLINT DEFAULT 1,
  notes        TEXT,
  UNIQUE (operation_id, machine_id)
);

CREATE TABLE operation_tools (
  id                  SERIAL PRIMARY KEY,
  operation_id        INT NOT NULL REFERENCES plan_operations(id) ON DELETE CASCADE,
  tool_id             INT NOT NULL REFERENCES tools(id),
  tool_position       SMALLINT,
  sequence_in_op      SMALLINT DEFAULT 1,
  spindle_speed_rpm   INT,
  feed_rate_mm_min    NUMERIC(8,2),
  feed_per_tooth_mm   NUMERIC(10,5),
  cutting_speed_m_min NUMERIC(8,2),
  axial_depth_ap_mm   NUMERIC(8,3),
  radial_depth_ae_mm  NUMERIC(8,3),
  num_passes          SMALLINT DEFAULT 1,
  machining_time_min  NUMERIC(8,2),
  notes               TEXT,
  UNIQUE (operation_id, tool_position)
);

CREATE TABLE quality_checks (
  id                  SERIAL PRIMARY KEY,
  operation_id        INT NOT NULL REFERENCES plan_operations(id) ON DELETE CASCADE,
  requirement_id      INT REFERENCES quality_requirements(id),
  check_description   TEXT NOT NULL,
  measurement_method  VARCHAR(100),
  acceptance_criteria TEXT,
  frequency           VARCHAR(50),
  notes               TEXT
);

-- =============================================================
-- 8. NC PROGRAMY
-- =============================================================

CREATE TABLE nc_programs (
  id                   SERIAL PRIMARY KEY,
  process_plan_id      INT NOT NULL REFERENCES process_plans(id) ON DELETE CASCADE,
  operation_id         INT REFERENCES plan_operations(id),
  program_number       VARCHAR(100) NOT NULL,
  program_name         VARCHAR(300),
  cam_format           cam_format NOT NULL,
  cnc_control          VARCHAR(100),
  version              VARCHAR(20) DEFAULT '1.0',
  status               revision_status DEFAULT 'draft',
  cam_source_file      TEXT,
  postprocessor        VARCHAR(100),
  tool_path_strategy   VARCHAR(100),
  estimated_time_min   NUMERIC(10,2),
  verified_on_machine  BOOLEAN DEFAULT FALSE,
  verified_at          TIMESTAMPTZ,
  verified_by          UUID REFERENCES profiles(id),
  created_by           UUID REFERENCES profiles(id),
  notes                TEXT,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now(),
  UNIQUE (process_plan_id, program_number, version)
);

CREATE TABLE nc_program_files (
  id               SERIAL PRIMARY KEY,
  nc_program_id    INT NOT NULL REFERENCES nc_programs(id) ON DELETE CASCADE,
  file_type        VARCHAR(20) NOT NULL,
  file_name        VARCHAR(300) NOT NULL,
  -- Supabase Storage bucket path (napr. nc-files/O0010_v1.nc)
  storage_path     TEXT,
  file_size_bytes  BIGINT,
  checksum_sha256  VARCHAR(64),
  uploaded_at      TIMESTAMPTZ DEFAULT now(),
  uploaded_by      UUID REFERENCES profiles(id),
  notes            TEXT
);

-- =============================================================
-- 9. VÝROBNÉ PRÍKAZY
-- =============================================================

CREATE TABLE production_orders (
  id              SERIAL PRIMARY KEY,
  order_number    VARCHAR(100) NOT NULL UNIQUE,
  workpiece_id    INT NOT NULL REFERENCES workpieces(id),
  process_plan_id INT NOT NULL REFERENCES process_plans(id),
  quantity        INT NOT NULL DEFAULT 1,
  priority        SMALLINT DEFAULT 5,
  due_date        DATE,
  start_date      DATE,
  status          VARCHAR(50) DEFAULT 'planned',
  notes           TEXT,
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE operation_schedule (
  id                  SERIAL PRIMARY KEY,
  production_order_id INT NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  operation_id        INT NOT NULL REFERENCES plan_operations(id),
  machine_id          INT NOT NULL REFERENCES machines(id),
  scheduled_start     TIMESTAMPTZ NOT NULL,
  scheduled_end       TIMESTAMPTZ NOT NULL,
  actual_start        TIMESTAMPTZ,
  actual_end          TIMESTAMPTZ,
  operator            VARCHAR(100),
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- =============================================================
-- 10. INDEXY
-- =============================================================

CREATE INDEX idx_materials_class       ON materials(material_class);
CREATE INDEX idx_workpieces_material   ON workpieces(material_id);
CREATE INDEX idx_workpieces_cad_doc    ON workpieces(cad_document_id);
CREATE INDEX idx_cad_revisions_doc     ON cad_revisions(cad_document_id);
CREATE INDEX idx_process_plans_wp      ON process_plans(workpiece_id);
CREATE INDEX idx_process_plans_status  ON process_plans(status);
CREATE INDEX idx_operations_plan       ON plan_operations(process_plan_id);
CREATE INDEX idx_operations_type       ON plan_operations(operation_type);
CREATE INDEX idx_op_machines           ON operation_machines(operation_id);
CREATE INDEX idx_op_tools              ON operation_tools(operation_id);
CREATE INDEX idx_op_tools_tool         ON operation_tools(tool_id);
CREATE INDEX idx_nc_plan               ON nc_programs(process_plan_id);
CREATE INDEX idx_cutting_tool_mat      ON cutting_conditions(tool_id, material_id);
CREATE INDEX idx_prod_orders_status    ON production_orders(status);
CREATE INDEX idx_op_schedule_machine   ON operation_schedule(machine_id);
CREATE INDEX idx_op_schedule_start     ON operation_schedule(scheduled_start);

-- =============================================================
-- 11. TRIGGER — auto updated_at
-- =============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'profiles','materials','cad_documents','workpieces',
    'machines','tools','process_plans','plan_operations',
    'nc_programs','production_orders'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      tbl, tbl
    );
  END LOOP;
END;
$$;
