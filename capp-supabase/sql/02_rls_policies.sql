-- =============================================================
-- CAPP — Row Level Security (RLS) polícy
-- Nahrádza GCP IAM skupiny
--
-- Logika:
--   professor → čítanie + zápis + mazanie všetkého
--   student   → čítanie + zápis + mazanie (DDL cez SQL editor)
--   readonly  → len SELECT
--
-- Spusti v Supabase SQL Editor po 01_schema.sql
-- =============================================================

-- Pomocná funkcia — vráti rolu aktuálne prihláseného užívateľa
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- =============================================================
-- Zapni RLS na všetkých tabuľkách
-- =============================================================

ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials          ENABLE ROW LEVEL SECURITY;
ALTER TABLE cad_documents      ENABLE ROW LEVEL SECURITY;
ALTER TABLE cad_revisions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE workpieces         ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_groups     ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines           ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_groups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools              ENABLE ROW LEVEL SECURITY;
ALTER TABLE cutting_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_plans      ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_revisions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_operations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_tools    ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_checks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE nc_programs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE nc_program_files   ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_orders  ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_schedule ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- MAKRO: Pre každú tabuľku vytvoríme 4 polícy
--   SELECT  → všetci prihlásení
--   INSERT  → professor + student
--   UPDATE  → professor + student
--   DELETE  → professor + student
-- =============================================================

-- Funkcia ktorá generuje polícy pre jednu tabuľku
-- (voláme ju priamo pre každú tabuľku nižšie)

-- -----------------------------------------------------------
-- profiles — každý vidí len seba, professor vidí všetkých
-- -----------------------------------------------------------
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (id = auth.uid() OR current_user_role() = 'professor');

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid() OR current_user_role() = 'professor');

-- -----------------------------------------------------------
-- Generické polícy pre dátové tabuľky
-- SELECT: každý prihlásený
-- INSERT/UPDATE/DELETE: professor alebo student
-- -----------------------------------------------------------

-- materials
CREATE POLICY "materials_select" ON materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "materials_write"  ON materials FOR INSERT TO authenticated WITH CHECK (current_user_role() IN ('professor','student'));
CREATE POLICY "materials_update" ON materials FOR UPDATE TO authenticated USING (current_user_role() IN ('professor','student'));
CREATE POLICY "materials_delete" ON materials FOR DELETE TO authenticated USING (current_user_role() IN ('professor','student'));

-- cad_documents
CREATE POLICY "cad_doc_select" ON cad_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "cad_doc_write"  ON cad_documents FOR INSERT TO authenticated WITH CHECK (current_user_role() IN ('professor','student'));
CREATE POLICY "cad_doc_update" ON cad_documents FOR UPDATE TO authenticated USING (current_user_role() IN ('professor','student'));
CREATE POLICY "cad_doc_delete" ON cad_documents FOR DELETE TO authenticated USING (current_user_role() IN ('professor','student'));

-- cad_revisions
CREATE POLICY "cad_rev_select" ON cad_revisions FOR SELECT TO authenticated USING (true);
CREATE POLICY "cad_rev_write"  ON cad_revisions FOR INSERT TO authenticated WITH CHECK (current_user_role() IN ('professor','student'));
CREATE POLICY "cad_rev_update" ON cad_revisions FOR UPDATE TO authenticated USING (current_user_role() IN ('professor','student'));
CREATE POLICY "cad_rev_delete" ON cad_revisions FOR DELETE TO authenticated USING (current_user_role() IN ('professor','student'));

-- workpieces
CREATE POLICY "wp_select" ON workpieces FOR SELECT TO authenticated USING (true);
CREATE POLICY "wp_write"  ON workpieces FOR INSERT TO authenticated WITH CHECK (current_user_role() IN ('professor','student'));
CREATE POLICY "wp_update" ON workpieces FOR UPDATE TO authenticated USING (current_user_role() IN ('professor','student'));
CREATE POLICY "wp_delete" ON workpieces FOR DELETE TO authenticated USING (current_user_role() IN ('professor','student'));

-- quality_requirements
CREATE POLICY "qr_select" ON quality_requirements FOR SELECT TO authenticated USING (true);
CREATE POLICY "qr_write"  ON quality_requirements FOR INSERT TO authenticated WITH CHECK (current_user_role() IN ('professor','student'));
CREATE POLICY "qr_update" ON quality_requirements FOR UPDATE TO authenticated USING (current_user_role() IN ('professor','student'));
CREATE POLICY "qr_delete" ON quality_requirements FOR DELETE TO authenticated USING (current_user_role() IN ('professor','student'));

-- machine_groups
CREATE POLICY "mg_select" ON machine_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "mg_write"  ON machine_groups FOR INSERT TO authenticated WITH CHECK (current_user_role() IN ('professor','student'));
CREATE POLICY "mg_update" ON machine_groups FOR UPDATE TO authenticated USING (current_user_role() IN ('professor','student'));
CREATE POLICY "mg_delete" ON machine_groups FOR DELETE TO authenticated USING (current_user_role() IN ('professor','student'));

-- machines
CREATE POLICY "mac_select" ON machines FOR SELECT TO authenticated USING (true);
CREATE POLICY "mac_write"  ON machines FOR INSERT TO authenticated WITH CHECK (current_user_role() IN ('professor','student'));
CREATE POLICY "mac_update" ON machines FOR UPDATE TO authenticated USING (current_user_role() IN ('professor','student'));
CREATE POLICY "mac_delete" ON machines FOR DELETE TO authenticated USING (current_user_role() IN ('professor','student'));

-- tool_groups
CREATE POLICY "tg_select" ON tool_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "tg_write"  ON tool_groups FOR INSERT TO authenticated WITH CHECK (current_user_role() IN ('professor','student'));
CREATE POLICY "tg_update" ON tool_groups FOR UPDATE TO authenticated USING (current_user_role() IN ('professor','student'));
CREATE POLICY "tg_delete" ON tool_groups FOR DELETE TO authenticated USING (current_user_role() IN ('professor','student'));

-- tools
CREATE POLICY "tl_select" ON tools FOR SELECT TO authenticated USING (true);
CREATE POLICY "tl_write"  ON tools FOR INSERT TO authenticated WITH CHECK (current_user_role() IN ('professor','student'));
CREATE POLICY "tl_update" ON tools FOR UPDATE TO authenticated USING (current_user_role() IN ('professor','student'));
CREATE POLICY "tl_delete" ON tools FOR DELETE TO authenticated USING (current_user_role() IN ('professor','student'));

-- cutting_conditions
CREATE POLICY "cc_select" ON cutting_conditions FOR SELECT TO authenticated USING (true);
CREATE POLICY "cc_write"  ON cutting_conditions FOR INSERT TO authenticated WITH CHECK (current_user_role() IN ('professor','student'));
CREATE POLICY "cc_update" ON cutting_conditions FOR UPDATE TO authenticated USING (current_user_role() IN ('professor','student'));
CREATE POLICY "cc_delete" ON cutting_conditions FOR DELETE TO authenticated USING (current_user_role() IN ('professor','student'));

-- process_plans
CREATE POLICY "pp_select" ON process_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "pp_write"  ON process_plans FOR INSERT TO authenticated WITH CHECK (current_user_role() IN ('professor','student'));
CREATE POLICY "pp_update" ON process_plans FOR UPDATE TO authenticated USING (current_user_role() IN ('professor','student'));
CREATE POLICY "pp_delete" ON process_plans FOR DELETE TO authenticated USING (current_user_role() IN ('professor','student'));

-- plan_revisions
CREATE POLICY "pr_select" ON plan_revisions FOR SELECT TO authenticated USING (true);
CREATE POLICY "pr_write"  ON plan_revisions FOR INSERT TO authenticated WITH CHECK (current_user_role() IN ('professor','student'));
CREATE POLICY "pr_update" ON plan_revisions FOR UPDATE TO authenticated USING (current_user_role() IN ('professor','student'));
CREATE POLICY "pr_delete" ON plan_revisions FOR DELETE TO authenticated USING (current_user_role() IN ('professor','student'));

-- plan_operations
CREATE POLICY "po_select" ON plan_operations FOR SELECT TO authenticated USING (true);
CREATE POLICY "po_write"  ON plan_operations FOR INSERT TO authenticated WITH CHECK (current_user_role() IN ('professor','student'));
CREATE POLICY "po_update" ON plan_operations FOR UPDATE TO authenticated USING (current_user_role() IN ('professor','student'));
CREATE POLICY "po_delete" ON plan_operations FOR DELETE TO authenticated USING (current_user_role() IN ('professor','student'));

-- operation_machines
CREATE POLICY "om_select" ON operation_machines FOR SELECT TO authenticated USING (true);
CREATE POLICY "om_write"  ON operation_machines FOR INSERT TO authenticated WITH CHECK (current_user_role() IN ('professor','student'));
CREATE POLICY "om_update" ON operation_machines FOR UPDATE TO authenticated USING (current_user_role() IN ('professor','student'));
CREATE POLICY "om_delete" ON operation_machines FOR DELETE TO authenticated USING (current_user_role() IN ('professor','student'));

-- operation_tools
CREATE POLICY "ot_select" ON operation_tools FOR SELECT TO authenticated USING (true);
CREATE POLICY "ot_write"  ON operation_tools FOR INSERT TO authenticated WITH CHECK (current_user_role() IN ('professor','student'));
CREATE POLICY "ot_update" ON operation_tools FOR UPDATE TO authenticated USING (current_user_role() IN ('professor','student'));
CREATE POLICY "ot_delete" ON operation_tools FOR DELETE TO authenticated USING (current_user_role() IN ('professor','student'));

-- quality_checks
CREATE POLICY "qc_select" ON quality_checks FOR SELECT TO authenticated USING (true);
CREATE POLICY "qc_write"  ON quality_checks FOR INSERT TO authenticated WITH CHECK (current_user_role() IN ('professor','student'));
CREATE POLICY "qc_update" ON quality_checks FOR UPDATE TO authenticated USING (current_user_role() IN ('professor','student'));
CREATE POLICY "qc_delete" ON quality_checks FOR DELETE TO authenticated USING (current_user_role() IN ('professor','student'));

-- nc_programs
CREATE POLICY "nc_select" ON nc_programs FOR SELECT TO authenticated USING (true);
CREATE POLICY "nc_write"  ON nc_programs FOR INSERT TO authenticated WITH CHECK (current_user_role() IN ('professor','student'));
CREATE POLICY "nc_update" ON nc_programs FOR UPDATE TO authenticated USING (current_user_role() IN ('professor','student'));
CREATE POLICY "nc_delete" ON nc_programs FOR DELETE TO authenticated USING (current_user_role() IN ('professor','student'));

-- nc_program_files
CREATE POLICY "nf_select" ON nc_program_files FOR SELECT TO authenticated USING (true);
CREATE POLICY "nf_write"  ON nc_program_files FOR INSERT TO authenticated WITH CHECK (current_user_role() IN ('professor','student'));
CREATE POLICY "nf_update" ON nc_program_files FOR UPDATE TO authenticated USING (current_user_role() IN ('professor','student'));
CREATE POLICY "nf_delete" ON nc_program_files FOR DELETE TO authenticated USING (current_user_role() IN ('professor','student'));

-- production_orders
CREATE POLICY "pord_select" ON production_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "pord_write"  ON production_orders FOR INSERT TO authenticated WITH CHECK (current_user_role() IN ('professor','student'));
CREATE POLICY "pord_update" ON production_orders FOR UPDATE TO authenticated USING (current_user_role() IN ('professor','student'));
CREATE POLICY "pord_delete" ON production_orders FOR DELETE TO authenticated USING (current_user_role() IN ('professor','student'));

-- operation_schedule
CREATE POLICY "os_select" ON operation_schedule FOR SELECT TO authenticated USING (true);
CREATE POLICY "os_write"  ON operation_schedule FOR INSERT TO authenticated WITH CHECK (current_user_role() IN ('professor','student'));
CREATE POLICY "os_update" ON operation_schedule FOR UPDATE TO authenticated USING (current_user_role() IN ('professor','student'));
CREATE POLICY "os_delete" ON operation_schedule FOR DELETE TO authenticated USING (current_user_role() IN ('professor','student'));

-- =============================================================
-- Správa rolí — pomocné funkcie pre profesora
-- =============================================================

-- Nastav rolu používateľa (len profesor môže meniť role)
CREATE OR REPLACE FUNCTION set_user_role(target_email TEXT, new_role user_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF current_user_role() != 'professor' THEN
    RAISE EXCEPTION 'Len profesor môže meniť roly používateľov';
  END IF;
  UPDATE profiles SET role = new_role
  WHERE email = target_email;
END;
$$;

COMMENT ON FUNCTION set_user_role IS
  'Profesor zavolá: SELECT set_user_role(''student@uniba.sk'', ''student'');';

-- Zoznam všetkých používateľov (len profesor)
CREATE OR REPLACE VIEW v_users AS
SELECT id, email, full_name, role, created_at
FROM profiles
WHERE current_user_role() = 'professor' OR id = auth.uid();
