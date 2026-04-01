import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProcessPlans, getOperations, insertProcessPlan, updateProcessPlan, deleteProcessPlan, insertOperation, updateOperation, deleteOperation, getWorkpieces } from '@/lib/supabaseQueries';
import DataTable from '@/components/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ChevronDown, ChevronRight } from 'lucide-react';

const STATUS_LABELS: Record<string,string> = { draft:'Návrh', in_review:'V revízii', approved:'Schválený', released:'Vydaný', obsolete:'Zastaraný' };
const STATUS_VARIANT: Record<string,'default'|'secondary'|'outline'|'destructive'> = { draft:'secondary', in_review:'outline', approved:'default', released:'default', obsolete:'destructive' };
const OP_TYPES = ['milling','turning','drilling','boring','grinding','tapping','reaming','broaching','honing','edm','laser_cutting','waterjet','welding','heat_treatment','surface_treatment','inspection','assembly','other'];
const OP_LABELS: Record<string,string> = { milling:'Frézovanie', turning:'Sústruženie', drilling:'Vŕtanie', boring:'Vyvrtávanie', grinding:'Brúsenie', tapping:'Závitovanie', reaming:'Výstružníkovanie', inspection:'Kontrola', assembly:'Montáž', heat_treatment:'Tepelné sprac.', other:'Iné' };

const EMPTY_PLAN = { plan_number:'', workpiece_id:'', revision:'01', status:'draft', title:'', production_type:'batch', batch_size:'1', notes:'' };
const EMPTY_OP = { sequence_no:'', operation_code:'', operation_type:'milling', name:'', description:'', setup_time_min:'0', machining_time_min:'0', auxiliary_time_min:'0', fixture_description:'', coolant_type:'emulsion', work_instructions:'' };

export default function PlansPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [planOpen, setPlanOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [planForm, setPlanForm] = useState<any>(EMPTY_PLAN);
  const [expandedPlanId, setExpandedPlanId] = useState<number | null>(null);
  const [opOpen, setOpOpen] = useState(false);
  const [editingOp, setEditingOp] = useState<any>(null);
  const [opForm, setOpForm] = useState<any>(EMPTY_OP);
  const [currentPlanId, setCurrentPlanId] = useState<number | null>(null);

  const { data: plans, isLoading } = useQuery({
    queryKey: ['process-plans'],
    queryFn: async () => { const { data, error } = await getProcessPlans(); if (error) throw error; return data; }
  });
  const { data: workpieces } = useQuery({
    queryKey: ['workpieces'],
    queryFn: async () => { const { data } = await getWorkpieces(); return data; }
  });
  const { data: operations } = useQuery({
    queryKey: ['operations', expandedPlanId],
    enabled: expandedPlanId !== null,
    queryFn: async () => { const { data, error } = await getOperations(expandedPlanId!); if (error) throw error; return data; }
  });

  const upsertPlan = useMutation({
    mutationFn: async (f: any) => {
      const payload = { ...f, workpiece_id: Number(f.workpiece_id), batch_size: Number(f.batch_size) };
      if (editingPlan?.id) { const { error } = await updateProcessPlan(editingPlan.id, payload); if (error) throw error; }
      else { const { error } = await insertProcessPlan(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['process-plans'] }); qc.invalidateQueries({ queryKey: ['plan-summary'] }); qc.invalidateQueries({ queryKey: ['dashboard-stats'] }); setPlanOpen(false); toast({ title: 'Postup uložený' }); },
    onError: (e: any) => toast({ title: 'Chyba', description: e.message, variant: 'destructive' }),
  });
  const removePlan = useMutation({
    mutationFn: async (id: number) => { const { error } = await deleteProcessPlan(id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['process-plans'] }); toast({ title: 'Postup vymazaný' }); },
    onError: (e: any) => toast({ title: 'Chyba', description: e.message, variant: 'destructive' }),
  });

  const upsertOp = useMutation({
    mutationFn: async (f: any) => {
      const payload = { ...f, process_plan_id: currentPlanId, sequence_no: Number(f.sequence_no), setup_time_min: Number(f.setup_time_min), machining_time_min: Number(f.machining_time_min), auxiliary_time_min: Number(f.auxiliary_time_min) };
      if (editingOp?.id) { const { error } = await updateOperation(editingOp.id, payload); if (error) throw error; }
      else { const { error } = await insertOperation(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['operations', currentPlanId] }); qc.invalidateQueries({ queryKey: ['plan-summary'] }); setOpOpen(false); toast({ title: 'Operácia uložená' }); },
    onError: (e: any) => toast({ title: 'Chyba', description: e.message, variant: 'destructive' }),
  });
  const removeOp = useMutation({
    mutationFn: async (id: number) => { const { error } = await deleteOperation(id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['operations', currentPlanId] }); toast({ title: 'Operácia vymazaná' }); },
    onError: (e: any) => toast({ title: 'Chyba', description: e.message, variant: 'destructive' }),
  });

  const planColumns = [
    { key:'expand', label:'', render:(r:any) => (
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e=>{e.stopPropagation();setExpandedPlanId(expandedPlanId===r.id?null:r.id);setCurrentPlanId(r.id);}}>
        {expandedPlanId===r.id ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
      </Button>
    )},
    { key:'plan_number', label:'Číslo postupu', mono:true },
    { key:'workpiece', label:'Obrobok', render:(r:any) => r.workpieces?.part_number ?? '—' },
    { key:'revision', label:'Revízia' },
    { key:'status', label:'Status', render:(r:any) => <Badge variant={STATUS_VARIANT[r.status]??'outline'} className="text-xs">{STATUS_LABELS[r.status]??r.status}</Badge> },
    { key:'batch_size', label:'Dávka [ks]', align:'right' as const },
  ];

  return (
    <div className="p-6 max-w-6xl space-y-2">
      <DataTable title="Technologické postupy" data={plans} columns={planColumns} loading={isLoading}
        onAdd={() => { setEditingPlan(null); setPlanForm(EMPTY_PLAN); setPlanOpen(true); }}
        onEdit={row => { setEditingPlan(row); setPlanForm({ ...EMPTY_PLAN, ...row, workpiece_id: String(row.workpiece_id ?? '') }); setPlanOpen(true); }}
        onDelete={row => { if (confirm(`Vymazať postup ${row.plan_number}?`)) removePlan.mutate(row.id); }}
        searchField="plan_number" addLabel="Nový postup"
      />

      {/* Rozbalené operácie */}
      {expandedPlanId && (
        <div className="ml-8 border border-border rounded-lg overflow-hidden">
          <div className="bg-muted/50 px-4 py-2 flex items-center justify-between border-b border-border">
            <span className="text-xs font-semibold">Operácie postupu</span>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setEditingOp(null); setOpForm(EMPTY_OP); setOpOpen(true); }}>+ Pridať operáciu</Button>
          </div>
          <table className="w-full text-xs">
            <thead><tr className="border-b border-border/50">
              {['Poradie','Kód','Typ','Názov','Setup [min]','Strojný [min]','Celkom [min]','Chladenie',''].map(h=><th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground">{h}</th>)}
            </tr></thead>
            <tbody>
              {(operations||[]).map((op:any,i:number) => (
                <tr key={i} className="border-b border-border/30 hover:bg-muted/10">
                  <td className="px-3 py-2 tabular-nums font-bold">{op.sequence_no}</td>
                  <td className="px-3 py-2 font-mono">{op.operation_code}</td>
                  <td className="px-3 py-2"><Badge variant="outline" className="text-xs">{OP_LABELS[op.operation_type]??op.operation_type}</Badge></td>
                  <td className="px-3 py-2">{op.name}</td>
                  <td className="px-3 py-2 tabular-nums text-right">{op.setup_time_min}</td>
                  <td className="px-3 py-2 tabular-nums text-right">{op.machining_time_min}</td>
                  <td className="px-3 py-2 tabular-nums text-right font-medium">{op.total_time_min}</td>
                  <td className="px-3 py-2 text-muted-foreground">{op.coolant_type}</td>
                  <td className="px-3 py-2 flex gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditingOp(op); setOpForm({ ...EMPTY_OP, ...op }); setOpOpen(true); }}>✏️</Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-destructive" onClick={() => { if (confirm('Vymazať operáciu?')) removeOp.mutate(op.id); }}>🗑</Button>
                  </td>
                </tr>
              ))}
              {(!operations || operations.length === 0) && <tr><td colSpan={9} className="px-3 py-4 text-center text-muted-foreground">Žiadne operácie</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialóg — postup */}
      <Dialog open={planOpen} onOpenChange={setPlanOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingPlan?.id ? 'Upraviť postup' : 'Nový technologický postup'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div><Label className="text-xs">Číslo postupu</Label><Input className="h-8 text-sm mt-1" value={planForm.plan_number||''} onChange={e=>setPlanForm((f:any)=>({...f,plan_number:e.target.value}))}/></div>
            <div><Label className="text-xs">Revízia</Label><Input className="h-8 text-sm mt-1" value={planForm.revision||''} onChange={e=>setPlanForm((f:any)=>({...f,revision:e.target.value}))}/></div>
            <div className="col-span-2">
              <Label className="text-xs">Obrobok</Label>
              <Select value={String(planForm.workpiece_id||'')} onValueChange={v=>setPlanForm((f:any)=>({...f,workpiece_id:v}))}>
                <SelectTrigger className="h-8 text-sm mt-1"><SelectValue placeholder="Vybrať obrobok..."/></SelectTrigger>
                <SelectContent>{(workpieces||[]).map((w:any)=><SelectItem key={w.id} value={String(w.id)}>{w.part_number} — {w.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label className="text-xs">Názov postupu</Label><Input className="h-8 text-sm mt-1" value={planForm.title||''} onChange={e=>setPlanForm((f:any)=>({...f,title:e.target.value}))}/></div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={planForm.status} onValueChange={v=>setPlanForm((f:any)=>({...f,status:v}))}>
                <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(STATUS_LABELS).map(([v,l])=><SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Dávka [ks]</Label><Input type="number" className="h-8 text-sm mt-1" value={planForm.batch_size||''} onChange={e=>setPlanForm((f:any)=>({...f,batch_size:e.target.value}))}/></div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={()=>setPlanOpen(false)}>Zrušiť</Button>
            <Button size="sm" onClick={()=>upsertPlan.mutate(planForm)} disabled={upsertPlan.isPending}>{upsertPlan.isPending?'Ukladám...':'Uložiť'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialóg — operácia */}
      <Dialog open={opOpen} onOpenChange={setOpOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingOp?.id ? 'Upraviť operáciu' : 'Nová operácia'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div><Label className="text-xs">Poradie (seq. no)</Label><Input type="number" className="h-8 text-sm mt-1" value={opForm.sequence_no||''} onChange={e=>setOpForm((f:any)=>({...f,sequence_no:e.target.value}))}/></div>
            <div><Label className="text-xs">Kód operácie</Label><Input className="h-8 text-sm mt-1" value={opForm.operation_code||''} onChange={e=>setOpForm((f:any)=>({...f,operation_code:e.target.value}))}/></div>
            <div className="col-span-2">
              <Label className="text-xs">Typ operácie</Label>
              <Select value={opForm.operation_type} onValueChange={v=>setOpForm((f:any)=>({...f,operation_type:v}))}>
                <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{OP_TYPES.map(v=><SelectItem key={v} value={v}>{OP_LABELS[v]??v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label className="text-xs">Názov operácie</Label><Input className="h-8 text-sm mt-1" value={opForm.name||''} onChange={e=>setOpForm((f:any)=>({...f,name:e.target.value}))}/></div>
            {[['setup_time_min','Setup čas [min]'],['machining_time_min','Strojný čas [min]'],['auxiliary_time_min','Pomocný čas [min]'],['coolant_type','Chladenie']].map(([k,l])=>(
              <div key={k}><Label className="text-xs">{l}</Label><Input className="h-8 text-sm mt-1" type={k==='coolant_type'?'text':'number'} value={opForm[k]||''} onChange={e=>setOpForm((f:any)=>({...f,[k]:e.target.value}))}/></div>
            ))}
            <div className="col-span-2"><Label className="text-xs">Upínanie</Label><Textarea className="text-sm mt-1 min-h-[50px]" value={opForm.fixture_description||''} onChange={e=>setOpForm((f:any)=>({...f,fixture_description:e.target.value}))}/></div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={()=>setOpOpen(false)}>Zrušiť</Button>
            <Button size="sm" onClick={()=>upsertOp.mutate(opForm)} disabled={upsertOp.isPending}>{upsertOp.isPending?'Ukladám...':'Uložiť'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
