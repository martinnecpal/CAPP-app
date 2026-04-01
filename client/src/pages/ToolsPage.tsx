import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTools, insertTool, updateTool, deleteTool } from '@/lib/supabaseQueries';
import { supabase } from '@/lib/supabase';
import DataTable from '@/components/DataTable';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const TOOL_TYPES = ['end_mill','face_mill','drill','tap','reamer','boring_bar','insert_holder','turning_insert','thread_mill','form_tool','special','other'];
const TOOL_LABELS: Record<string,string> = { end_mill:'Stopk. fréza', face_mill:'Čelná fréza', drill:'Vrták', tap:'Závitník', reamer:'Výstružník', boring_bar:'Vyvrtávač', turning_insert:'VBD sústruženie', insert_holder:'Nástrojové telo', thread_mill:'Závitová fréza', form_tool:'Tvarový nástroj', special:'Špeciálny', other:'Iný' };

const EMPTY = { code:'', name:'', tool_type:'end_mill', manufacturer:'', catalog_number:'', diameter_mm:'', cutting_length_mm:'', overall_length_mm:'', num_flutes:'', cutting_material:'HM', coating:'TiAlN', tool_life_min:'', unit_cost_eur:'', tool_group_id:'' };

export default function ToolsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY);

  const { data, isLoading } = useQuery({
    queryKey: ['tools'],
    queryFn: async () => { const { data, error } = await getTools(); if (error) throw error; return data; }
  });
  const { data: groups } = useQuery({
    queryKey: ['tool-groups'],
    queryFn: async () => { const { data } = await supabase.from('tool_groups').select('*').order('code'); return data; }
  });

  function num(v: any) { return v ? Number(v) : null; }

  const upsert = useMutation({
    mutationFn: async (f: any) => {
      const payload = { ...f, tool_group_id: f.tool_group_id ? Number(f.tool_group_id) : null, diameter_mm: num(f.diameter_mm), cutting_length_mm: num(f.cutting_length_mm), overall_length_mm: num(f.overall_length_mm), num_flutes: num(f.num_flutes), tool_life_min: num(f.tool_life_min), unit_cost_eur: num(f.unit_cost_eur), is_active: true };
      if (editing?.id) { const { error } = await updateTool(editing.id, payload); if (error) throw error; }
      else { const { error } = await insertTool(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tools'] }); qc.invalidateQueries({ queryKey: ['dashboard-stats'] }); setOpen(false); toast({ title: 'Nástroj uložený' }); },
    onError: (e: any) => toast({ title: 'Chyba', description: e.message, variant: 'destructive' }),
  });
  const remove = useMutation({
    mutationFn: async (id: number) => { const { error } = await deleteTool(id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tools'] }); toast({ title: 'Nástroj vymazaný' }); },
    onError: (e: any) => toast({ title: 'Chyba', description: e.message, variant: 'destructive' }),
  });

  function openAdd() { setEditing(null); setForm(EMPTY); setOpen(true); }
  function openEdit(row: any) { setEditing(row); setForm({ ...EMPTY, ...row, tool_group_id: String(row.tool_group_id ?? '') }); setOpen(true); }

  const columns = [
    { key:'code', label:'Kód', mono:true },
    { key:'name', label:'Nástroj' },
    { key:'tool_type', label:'Typ', render:(r:any) => <Badge variant="secondary" className="text-xs">{TOOL_LABELS[r.tool_type]??r.tool_type}</Badge> },
    { key:'diameter_mm', label:'Ø [mm]', align:'right' as const },
    { key:'cutting_material', label:'Materiál rezu' },
    { key:'coating', label:'Povlak' },
    { key:'tool_life_min', label:'Trvanliv. [min]', align:'right' as const },
    { key:'unit_cost_eur', label:'Cena [€]', align:'right' as const },
  ];

  return (
    <div className="p-6 max-w-6xl">
      <DataTable title="Nástroje" data={data} columns={columns} loading={isLoading}
        onAdd={openAdd} onEdit={openEdit}
        onDelete={row => { if (confirm(`Vymazať nástroj ${row.code}?`)) remove.mutate(row.id); }}
        searchField="name" addLabel="Pridať nástroj"
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{editing?.id ? 'Upraviť nástroj' : 'Nový nástroj'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2 max-h-[60vh] overflow-y-auto pr-1">
            {[['code','Kód'],['name','Názov'],['manufacturer','Výrobca'],['catalog_number','Kat. číslo']].map(([k,l])=>(
              <div key={k} className={k==='name'?'col-span-2':''}>
                <Label className="text-xs">{l}</Label>
                <Input className="h-8 text-sm mt-1" value={form[k]||''} onChange={e=>setForm((f:any)=>({...f,[k]:e.target.value}))} data-testid={`input-${k}`}/>
              </div>
            ))}
            <div>
              <Label className="text-xs">Typ nástroja</Label>
              <Select value={form.tool_type} onValueChange={v=>setForm((f:any)=>({...f,tool_type:v}))}>
                <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{TOOL_TYPES.map(v=><SelectItem key={v} value={v}>{TOOL_LABELS[v]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Skupina nástrojov</Label>
              <Select value={String(form.tool_group_id||'')} onValueChange={v=>setForm((f:any)=>({...f,tool_group_id:v}))}>
                <SelectTrigger className="h-8 text-sm mt-1"><SelectValue placeholder="Vybrať..."/></SelectTrigger>
                <SelectContent>{(groups||[]).map((g:any)=><SelectItem key={g.id} value={String(g.id)}>{g.code}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {[['diameter_mm','Priemer Ø [mm]'],['cutting_length_mm','Dĺžka rezu [mm]'],['overall_length_mm','Celková dĺžka [mm]'],['num_flutes','Počet zubov'],['cutting_material','Mat. rezu (HM/HSS...)'],['coating','Povlak (TiAlN...)'],['tool_life_min','Trvanlivosť [min]'],['unit_cost_eur','Cena [€]']].map(([k,l])=>(
              <div key={k}>
                <Label className="text-xs">{l}</Label>
                <Input type={['cutting_material','coating'].includes(k)?'text':'number'} className="h-8 text-sm mt-1" value={form[k]||''} onChange={e=>setForm((f:any)=>({...f,[k]:e.target.value}))} data-testid={`input-${k}`}/>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={()=>setOpen(false)}>Zrušiť</Button>
            <Button size="sm" onClick={()=>upsert.mutate(form)} disabled={upsert.isPending} data-testid="button-save">{upsert.isPending?'Ukladám...':'Uložiť'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
