-- =============================================================
-- CAPP — Views pre výuku a reporting
-- Spusti po 01, 02, 03
-- =============================================================

-- V1: Súhrn technologických postupov
CREATE OR REPLACE VIEW v_process_plan_summary AS
SELECT
  pp.plan_number, pp.revision, pp.status,
  wp.part_number,
  wp.name                    AS workpiece_name,
  m.code                     AS material_code,
  m.name                     AS material_name,
  pp.production_type,
  pp.batch_size,
  COUNT(DISTINCT po.id)      AS num_operations,
  SUM(po.setup_time_min)     AS total_setup_min,
  SUM(po.machining_time_min) AS total_machining_min,
  SUM(po.total_time_min)     AS total_time_min,
  pp.released_at
FROM process_plans pp
JOIN workpieces  wp ON wp.id = pp.workpiece_id
LEFT JOIN materials   m  ON m.id  = wp.material_id
LEFT JOIN plan_operations po ON po.process_plan_id = pp.id
GROUP BY pp.id, wp.id, m.id;

-- V2: Detail operácií so strojmi a nástrojmi
CREATE OR REPLACE VIEW v_operation_detail AS
SELECT
  pp.plan_number,
  po.sequence_no,
  po.operation_code,
  po.operation_type,
  po.name                  AS operation_name,
  mac.code                 AS machine_code,
  mac.name                 AS machine_name,
  mac.cnc_control,
  t.code                   AS tool_code,
  t.name                   AS tool_name,
  t.diameter_mm,
  ot.tool_position,
  ot.spindle_speed_rpm,
  ot.feed_rate_mm_min,
  ot.cutting_speed_m_min,
  ot.axial_depth_ap_mm,
  ot.radial_depth_ae_mm,
  po.setup_time_min,
  po.machining_time_min    AS op_machining_min,
  po.total_time_min        AS op_total_min,
  po.coolant_type,
  po.fixture_description
FROM process_plans pp
JOIN plan_operations     po  ON po.process_plan_id = pp.id
LEFT JOIN operation_machines om  ON om.operation_id = po.id AND om.is_primary = TRUE
LEFT JOIN machines           mac ON mac.id = om.machine_id
LEFT JOIN operation_tools    ot  ON ot.operation_id = po.id
LEFT JOIN tools              t   ON t.id = ot.tool_id
ORDER BY pp.plan_number, po.sequence_no, ot.sequence_in_op;

-- V3: Kalkulácia nákladov
CREATE OR REPLACE VIEW v_cost_breakdown AS
SELECT
  pp.plan_number,
  wp.part_number,
  wp.name                  AS workpiece_name,
  po.sequence_no,
  po.operation_code,
  mac.code                 AS machine_code,
  mac.hourly_rate_eur,
  po.total_time_min,
  ROUND(po.setup_time_min     / 60.0 * mac.hourly_rate_eur, 2) AS setup_cost_eur,
  ROUND(po.machining_time_min / 60.0 * mac.hourly_rate_eur, 2) AS machining_cost_eur,
  ROUND(po.total_time_min     / 60.0 * mac.hourly_rate_eur, 2) AS total_op_cost_eur
FROM process_plans pp
JOIN workpieces       wp  ON wp.id  = pp.workpiece_id
JOIN plan_operations  po  ON po.process_plan_id = pp.id
LEFT JOIN operation_machines om  ON om.operation_id = po.id AND om.is_primary = TRUE
LEFT JOIN machines    mac ON mac.id = om.machine_id;

-- V4: CAD ↔ CAPP ↔ NC prepojenie
CREATE OR REPLACE VIEW v_cad_cam_link AS
SELECT
  wp.part_number,
  wp.name                  AS workpiece_name,
  d.doc_number,
  d.title                  AS cad_title,
  d.format                 AS cad_format,
  r.revision_code          AS cad_revision,
  d.external_url           AS cad_url,
  pp.plan_number,
  po.operation_code,
  nc.program_number,
  nc.cam_format,
  nc.cnc_control,
  nc.status                AS nc_status,
  nc.cam_source_file,
  nc.verified_on_machine
FROM workpieces     wp
LEFT JOIN cad_documents  d  ON d.id = wp.cad_document_id
LEFT JOIN cad_revisions  r  ON r.id = wp.active_cad_revision_id
LEFT JOIN process_plans  pp ON pp.workpiece_id = wp.id
LEFT JOIN plan_operations po ON po.process_plan_id = pp.id
LEFT JOIN nc_programs    nc ON nc.process_plan_id = pp.id
                            AND nc.operation_id = po.id;
