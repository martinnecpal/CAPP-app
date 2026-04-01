import { supabase } from './supabase';

// ─── MATERIÁLY ─────────────────────────────────────────────
export const getMaterials = () =>
  supabase.from('materials').select('*').order('code');

export const insertMaterial = (data: any) =>
  supabase.from('materials').insert(data).select().single();

export const updateMaterial = (id: number, data: any) =>
  supabase.from('materials').update(data).eq('id', id).select().single();

export const deleteMaterial = (id: number) =>
  supabase.from('materials').delete().eq('id', id);

// ─── OBROBKY ───────────────────────────────────────────────
export const getWorkpieces = () =>
  supabase
    .from('workpieces')
    .select('*, materials(code, name, material_class)')
    .order('part_number');

export const insertWorkpiece = (data: any) =>
  supabase.from('workpieces').insert(data).select().single();

export const updateWorkpiece = (id: number, data: any) =>
  supabase.from('workpieces').update(data).eq('id', id).select().single();

export const deleteWorkpiece = (id: number) =>
  supabase.from('workpieces').delete().eq('id', id);

// ─── STROJE ────────────────────────────────────────────────
export const getMachines = () =>
  supabase
    .from('machines')
    .select('*, machine_groups(code, name)')
    .order('code');

export const insertMachine = (data: any) =>
  supabase.from('machines').insert(data).select().single();

export const updateMachine = (id: number, data: any) =>
  supabase.from('machines').update(data).eq('id', id).select().single();

export const deleteMachine = (id: number) =>
  supabase.from('machines').delete().eq('id', id);

// ─── NÁSTROJE ──────────────────────────────────────────────
export const getTools = () =>
  supabase
    .from('tools')
    .select('*, tool_groups(code, name)')
    .order('code');

export const insertTool = (data: any) =>
  supabase.from('tools').insert(data).select().single();

export const updateTool = (id: number, data: any) =>
  supabase.from('tools').update(data).eq('id', id).select().single();

export const deleteTool = (id: number) =>
  supabase.from('tools').delete().eq('id', id);

// ─── TECHNOLOGICKÉ POSTUPY ─────────────────────────────────
export const getProcessPlans = () =>
  supabase
    .from('process_plans')
    .select('*, workpieces(part_number, name)')
    .order('plan_number');

export const insertProcessPlan = (data: any) =>
  supabase.from('process_plans').insert(data).select().single();

export const updateProcessPlan = (id: number, data: any) =>
  supabase.from('process_plans').update(data).eq('id', id).select().single();

export const deleteProcessPlan = (id: number) =>
  supabase.from('process_plans').delete().eq('id', id);

// ─── OPERÁCIE ──────────────────────────────────────────────
export const getOperations = (planId: number) =>
  supabase
    .from('plan_operations')
    .select('*')
    .eq('process_plan_id', planId)
    .order('sequence_no');

export const insertOperation = (data: any) =>
  supabase.from('plan_operations').insert(data).select().single();

export const updateOperation = (id: number, data: any) =>
  supabase.from('plan_operations').update(data).eq('id', id).select().single();

export const deleteOperation = (id: number) =>
  supabase.from('plan_operations').delete().eq('id', id);

// ─── VIEWS ─────────────────────────────────────────────────
export const getPlanSummary = () =>
  supabase.from('v_process_plan_summary').select('*').order('plan_number');

export const getOperationDetail = (planNumber?: string) => {
  let q = supabase.from('v_operation_detail').select('*');
  if (planNumber) q = q.eq('plan_number', planNumber);
  return q.order('plan_number').order('sequence_no');
};

export const getCostBreakdown = (planNumber?: string) => {
  let q = supabase.from('v_cost_breakdown').select('*');
  if (planNumber) q = q.eq('plan_number', planNumber);
  return q.order('plan_number').order('sequence_no');
};

// ─── DASHBOARD STATS ───────────────────────────────────────
export const getDashboardStats = async () => {
  const [materials, workpieces, machines, tools, plans] = await Promise.all([
    supabase.from('materials').select('id', { count: 'exact', head: true }),
    supabase.from('workpieces').select('id', { count: 'exact', head: true }),
    supabase.from('machines').select('id', { count: 'exact', head: true }),
    supabase.from('tools').select('id', { count: 'exact', head: true }),
    supabase.from('process_plans').select('id, status', { count: 'exact' }),
  ]);
  const plansData = plans.data || [];
  return {
    materials: materials.count ?? 0,
    workpieces: workpieces.count ?? 0,
    machines: machines.count ?? 0,
    tools: tools.count ?? 0,
    plans: plans.count ?? 0,
    plansApproved: plansData.filter((p: any) => p.status === 'approved').length,
    plansDraft: plansData.filter((p: any) => p.status === 'draft').length,
    plansReleased: plansData.filter((p: any) => p.status === 'released').length,
  };
};
