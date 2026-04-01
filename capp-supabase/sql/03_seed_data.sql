-- =============================================================
-- CAPP — Vzorové dáta pre výuku
-- Spusti po 01_schema.sql a 02_rls_policies.sql
--
-- POZOR: seed dáta vkladáme priamo bez auth kontextu
-- (spúšťa sa z SQL Editor ako postgres superuser)
-- =============================================================

-- -----------------------------------------------------------
-- Materiály
-- -----------------------------------------------------------
INSERT INTO materials
  (code, name, material_class, standard, density_kg_m3,
   tensile_strength_mpa, yield_strength_mpa, hardness_hb, machinability_index)
VALUES
  ('S355JR',   'Konštrukčná oceľ S355JR',    'steel',    'EN 10025', 7850, 510, 355, 160, 72),
  ('16MnCr5',  'Cementačná oceľ 16MnCr5',     'steel',    'EN 10084', 7850, 780, 590, 220, 65),
  ('42CrMo4',  'Zušľachtená oceľ 42CrMo4',    'steel',    'EN 10083', 7850, 900, 750, 265, 60),
  ('AlSi10Mg', 'Zliatina hliníka AlSi10Mg',   'aluminum', 'EN 1706',  2680, 330, 240, 100, 150),
  ('Al7075-T6','Zliatina hliníka 7075-T6',    'aluminum', 'AMS 2770', 2810, 572, 503, 150, 140),
  ('Ti-6Al-4V','Titánová zliatina Ti-6Al-4V', 'titanium', 'AMS 4928', 4430, 950, 880, 330, 22),
  ('GG-25',    'Šedá liatina EN-GJL-250',     'cast_iron','EN 1561',  7200, 250, 165, 220, 60);

-- -----------------------------------------------------------
-- Skupiny strojov
-- -----------------------------------------------------------
INSERT INTO machine_groups (code, name, description) VALUES
  ('VMC',  'Vertikálne frézovací centrá',    'CNC frézovanie — vertikálna os vretena'),
  ('HMC',  'Horizontálne frézovací centrá',  'CNC frézovanie — horizontálna os vretena'),
  ('TURN', 'CNC sústruhy',                   'CNC sústruženie a sústružnicko-frézovanie'),
  ('GRND', 'Brúsky',                         'Povrchové, okrúhle a bezstredné brúsky');

-- -----------------------------------------------------------
-- Stroje
-- -----------------------------------------------------------
INSERT INTO machines
  (machine_group_id, code, name, manufacturer, model,
   cnc_control, cam_format,
   travel_x_mm, travel_y_mm, travel_z_mm,
   max_spindle_rpm, max_spindle_power_kw,
   tool_positions, hourly_rate_eur, location)
VALUES
  (1,'VMC-01','DMG Mori CMX 600V', 'DMG Mori','CMX 600V',
   'Heidenhain iTNC 640','heidenhain', 600,500,500, 12000,19, 30, 55,'Hala A/1'),
  (1,'VMC-02','Haas VF-3',         'Haas',    'VF-3',
   'Haas NGC',           'haas',       762,406,508, 10000,22, 24, 40,'Hala A/2'),
  (3,'TURN-01','DMG Mori CTX 450', 'DMG Mori','CTX 450',
   'Siemens 840D sl',    'siemens_840d',NULL,NULL,650, 6000,18, 12, 50,'Hala B/1'),
  (4,'GRND-01','Studer S33',       'Studer',  'S33',
   NULL,                 NULL,         NULL,NULL,NULL, NULL,5.5, NULL,35,'Hala C');

-- -----------------------------------------------------------
-- Skupiny nástrojov
-- -----------------------------------------------------------
INSERT INTO tool_groups (code, name, tool_type) VALUES
  ('EM-HM', 'Monolitné HM stopkové frézy',  'end_mill'),
  ('DRILL', 'HM vrtáky',                     'drill'),
  ('TAP',   'Závitníky',                     'tap'),
  ('FACE',  'Čelné frézy s VBD',             'face_mill'),
  ('TURN-V','Sústružnícke VBD — vonkajšok', 'turning_insert');

-- -----------------------------------------------------------
-- Nástroje
-- -----------------------------------------------------------
INSERT INTO tools
  (tool_group_id, code, name, tool_type, manufacturer, catalog_number,
   diameter_mm, cutting_length_mm, overall_length_mm, num_flutes,
   cutting_material, coating, tool_life_min, unit_cost_eur)
VALUES
  (1,'EM-D10-Z4','Stopková fréza D10 Z4', 'end_mill','Sandvik',  'R216.34-10050-10020', 10, 22,72, 4,'HM','TiAlN', 60,32),
  (1,'EM-D16-Z4','Stopková fréza D16 Z4', 'end_mill','Sandvik',  'R216.34-16050-16020', 16, 32,100,4,'HM','TiAlN', 80,48),
  (2,'DR-D8',    'HM vrták D8',           'drill',   'Kennametal','B041A0800',           8,  75,117,2,'HM','TiAlN',120,22),
  (2,'DR-D12',   'HM vrták D12',          'drill',   'Kennametal','B041A1200',           12,101,151,2,'HM','TiAlN',100,35),
  (3,'TAP-M10',  'Závitník M10×1.5',      'tap',     'OSG',       'EX-TAP-M10',         10, 20, 80,4,'HSS','TiN', 200,18),
  (4,'FACE-D63', 'Čelná fréza D63 VBD',   'face_mill','Walter',  'F4042R063Z05-02',     63, 50,200,5,'HM', NULL,  300,180);

-- -----------------------------------------------------------
-- Rezné podmienky
-- -----------------------------------------------------------
INSERT INTO cutting_conditions
  (tool_id, material_id, operation_type,
   vc_min_m_min, vc_rec_m_min, vc_max_m_min,
   fz_min_mm, fz_rec_mm, fz_max_mm,
   ap_max_mm, ae_max_mm, coolant_required, source)
SELECT t.id, m.id, 'milling',
  80,120,150, 0.03,0.06,0.10, 15,8, TRUE,
  'Sandvik Coromant katalóg 2024'
FROM tools t, materials m
WHERE t.code='EM-D16-Z4' AND m.code='S355JR';

INSERT INTO cutting_conditions
  (tool_id, material_id, operation_type,
   vc_min_m_min, vc_rec_m_min, vc_max_m_min,
   fz_min_mm, fz_rec_mm, fz_max_mm,
   ap_max_mm, coolant_required, source)
SELECT t.id, m.id, 'drilling',
  40,60,80, 0.08,0.12,0.18, 12, TRUE,
  'Kennametal katalóg 2024'
FROM tools t, materials m
WHERE t.code='DR-D12' AND m.code='AlSi10Mg';

-- -----------------------------------------------------------
-- CAD dokument + revízia
-- -----------------------------------------------------------
INSERT INTO cad_documents (doc_number, title, description, format, external_url)
VALUES ('DWG-001','Kryt prevodovky — základný diel',
        'Liatý kryt s obrábanou prírubou','step',
        'https://cad.onshape.com/documents/example');

INSERT INTO cad_revisions
  (cad_document_id, revision_code, status, released_at, change_description)
SELECT id,'A','approved', now() - INTERVAL '30 days', 'Prvá vydaná revízia'
FROM cad_documents WHERE doc_number='DWG-001';

-- -----------------------------------------------------------
-- Obrobok
-- -----------------------------------------------------------
INSERT INTO workpieces
  (part_number, name, description,
   material_id, cad_document_id, active_cad_revision_id,
   blank_type, blank_dim_x_mm, blank_dim_y_mm, blank_dim_z_mm,
   blank_weight_kg, finished_weight_kg, annual_demand, batch_size)
SELECT
  'PN-001','Kryt prevodovky',
  'Hliníkový kryt s prírubou — cvičný diel pre CAPP kurz',
  m.id, d.id, r.id,
  'casting',200,150,80, 2.5,1.8, 500,20
FROM materials m, cad_documents d, cad_revisions r
WHERE m.code='AlSi10Mg'
  AND d.doc_number='DWG-001'
  AND r.revision_code='A';

INSERT INTO quality_requirements
  (workpiece_id, feature_name, tolerance_class,
   nominal_value_mm, upper_tol_mm, lower_tol_mm,
   surface_finish_value, surface_finish_unit)
SELECT id,'Otvor príruby D50H7','IT7',
  50.000,0.025,0.000, 1.6,'Ra'
FROM workpieces WHERE part_number='PN-001';

-- -----------------------------------------------------------
-- Technologický postup
-- -----------------------------------------------------------
INSERT INTO process_plans
  (plan_number, workpiece_id, revision, status, title,
   production_type, batch_size)
SELECT 'PP-001', id, '01','approved',
  'Technologický postup — Kryt prevodovky PN-001',
  'batch',20
FROM workpieces WHERE part_number='PN-001';

-- -----------------------------------------------------------
-- Operácie
-- -----------------------------------------------------------
-- OP10 — frézovanie základnej plochy
INSERT INTO plan_operations
  (process_plan_id, sequence_no, operation_code, operation_type, name,
   description, setup_time_min, machining_time_min,
   fixture_description, coolant_type)
SELECT id,10,'OP10','milling','Frézovanie základnej plochy',
  'Frézovanie hornej plochy čelnou frézou — Ra 3.2',
  20,8,'Strojný zverák','emulsion'
FROM process_plans WHERE plan_number='PP-001';

-- OP20 — vŕtanie + závitovanie
INSERT INTO plan_operations
  (process_plan_id, sequence_no, operation_code, operation_type, name,
   description, setup_time_min, machining_time_min,
   fixture_description, coolant_type)
SELECT id,20,'OP20','drilling','Vŕtanie otvorov M10',
  'Vŕtanie 4× priechodzích otvorov a závitovanie M10×1.5',
  5,12,'Pokračovanie upnutia z Op10','emulsion'
FROM process_plans WHERE plan_number='PP-001';

-- OP30 — dokončovanie otvoru príruby
INSERT INTO plan_operations
  (process_plan_id, sequence_no, operation_code, operation_type, name,
   description, setup_time_min, machining_time_min,
   fixture_description, coolant_type)
SELECT id,30,'OP30','boring','Dokončenie otvoru príruby D50H7',
  'Vyvrtávanie príruby na D50H7 — tolerancia IT7',
  10,15,'Presné upnutie s nastavovacím tŕňom','emulsion'
FROM process_plans WHERE plan_number='PP-001';

-- Priradenie strojov
INSERT INTO operation_machines (operation_id, machine_id, is_primary)
SELECT o.id, m.id, TRUE
FROM plan_operations o, machines m
WHERE o.operation_code IN ('OP10','OP20','OP30') AND m.code='VMC-01';

-- Nástroje — OP10
INSERT INTO operation_tools
  (operation_id, tool_id, tool_position, sequence_in_op,
   spindle_speed_rpm, feed_rate_mm_min, cutting_speed_m_min,
   axial_depth_ap_mm, radial_depth_ae_mm, machining_time_min)
SELECT o.id, t.id, 1,1, 1200,400,238, 2,60, 8
FROM plan_operations o, tools t
WHERE o.operation_code='OP10' AND t.code='FACE-D63';

-- Nástroje — OP20 vrták
INSERT INTO operation_tools
  (operation_id, tool_id, tool_position, sequence_in_op,
   spindle_speed_rpm, feed_rate_mm_min, cutting_speed_m_min,
   axial_depth_ap_mm, machining_time_min)
SELECT o.id, t.id, 2,1, 1600,192,60, 80, 8
FROM plan_operations o, tools t
WHERE o.operation_code='OP20' AND t.code='DR-D12';

-- Nástroje — OP20 závitník
INSERT INTO operation_tools
  (operation_id, tool_id, tool_position, sequence_in_op,
   spindle_speed_rpm, feed_rate_mm_min, machining_time_min)
SELECT o.id, t.id, 3,2, 350,525, 4
FROM plan_operations o, tools t
WHERE o.operation_code='OP20' AND t.code='TAP-M10';

-- NC program
INSERT INTO nc_programs
  (process_plan_id, operation_id, program_number, program_name,
   cam_format, cnc_control, version, status,
   cam_source_file, postprocessor, estimated_time_min)
SELECT pp.id, op.id,
  'O0010','KRYT_PREVODOVKY_OP10',
  'heidenhain','Heidenhain iTNC 640','1.0','approved',
  'cam/kryt_prevodovky_op10.hsmx',
  'Heidenhain_iTNC640_v2.3', 8
FROM process_plans pp, plan_operations op
WHERE pp.plan_number='PP-001'
  AND op.operation_code='OP10'
  AND op.process_plan_id = pp.id;
