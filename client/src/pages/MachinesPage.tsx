import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMachines, insertMachine, updateMachine, deleteMachine } from '@/lib/supabaseQueries';
import { supabase } from '@/lib/supabase';
import DataTable from '@/components/DataTable';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const CAM_FORMATS = ['heidenhain','siemens_840d','fanuc','haas','mazak','okuma','mitsubishi','fagor','generic_iso','other'];
const EMPTY = { code:'', name:'', manufacturer:'', model:'', cnc_control:'', cam_format:'fanuc', machine_group_id:'', max_spindle_rpm:'', max_spindle_power_kw:'', travel_x_mm:'', travel_y_mm:'', travel_z_mm:'', tool_positions:'', hourly_rate_eur:'', location:'' };

export default function MachinesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY);

  const { data, isLoading } = useQuery({
    queryKey: ['machines'],
    queryFn: async () => { const { data, error } = await getMachines(); if (error) throw error; return data; }
  });
  const { data: groups } = useQuery({
    queryKey: ['machine-groups'],
    queryFn: async () => { const { data } = await supabase.from('machine_groups').select('*').order('code'); return data; }
  });

  function num(v: any) { return v ? Number(v) : null; }

  const upsert = useMutation({
    mutationFn: async (f: any) => {
      const payload = { ...f, machine_group_id: f.machine_group_id ? Number(f.machine_group_id) : null, max_spindle_rpm: num(f.max_spindle_rpm), max_spindle_power_kw: num(f.max_spindle_power_kw), travel_x_mm: num(f.travel_x_mm), travel_y_mm: num(f.travel_y_mm), travel_z_mm: num(f.travel_z_mm), tool_positions: num(f.tool_positions), hourly_rate_eur: num(f.hourly_rate_eur), is_active: true };
      if (editing?.id) { const { error } = await updateMachine(editing.id, payload); if (error) throw error; }
      else { const { error } = await insertMachine(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['machines'] }); qc.invalidateQueries({ queryKey: ['dashboard-stats'] }); setOpen(false); toast({ title: 'Stroj uložený' }); },
    onError: (e: any) => toast({ title: 'Chyba', description: e.message, variant: 'destructive' }),
  });
  const remove = useMutation({
    mutationFn: async (id: number) => { const { error } = await deleteMachine(id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['machines'] }); toast({ title: 'Stroj vymazaný' }); },
    onError: (e: any) => toast({ title: 'Chyba', description: e.message, variant: 'destructive' }),
  });

  function openAdd() { setEditing(null); setForm(EMPTY); setOpen(true); }
  function openEdit(row: any) { setEditing(row); setForm({ ...EMPTY, ...row, machine_group_id: String(row.machine_group_id ?? '') }); setOpen(true); }

  const columns = [
    { key:'code', label:'Kód', mono:true },
    { key:'name', label:'Stroj' },
    { key:'group', label:'Skupina', render:(r:any) => r.machine_groups?.code ?? '—' },
    { key:'cnc_control', label:'CNC systém' },
    { key:'max_spindle_rpm', label:'Max n [ot/min]', align:'right' as const },
    { key:'max_spindle_power_kw', label:'P [kW]', align:'right' as const },
    { key:'hourly_rate_eur', label:'Sadzba [€/h]', align:'right' as const },
    { key:'is_active', label:'Aktívny', render:(r:any) => <Badge variant={r.is_active?'default':'secondary'}>{r.is_active?'Áno':'Nie'}</Badge> },
  ];

  return (
    <div className="p-6 max-w-6xl">
      <DataTable title="Stroje" data={data} columns={columns} loading={isLoading}
        onAdd={openAdd} onEdit={openEdit}
        onDelete={row => { if (confirm(`Vymazať stroj ${row.code}?`)) remove.mutate(row.id); }}
        searchField="name" addLabel="Pridať stroj"
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{editing?.id ? 'Upraviť stroj' : 'Nový stroj'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2 max-h-[60vh] overflow-y-auto pr-1">
            {[['code','Kód'],['name','Názov'],['manufacturer','Výrobca'],['model','Model'],['cnc_control','CNC systém']].map(([k,l])=>(
              <div key={k} className={k==='name'||k==='cnc_control'?'col-span-2':''}>
                <Label className="text-xs">{l}</Label>
                <Input className="h-8 text-sm mt-1" value={form[k]||''} onChange={e=>setForm((f:any)=>({...f,[k]:e.target.value}))} data-testid={`input-${k}`}/>
              </div>
            ))}
            <div>
              <Label className="text-xs">CAM formát</Label>
              <Select value={form.cam_format} onValueChange={v=>setForm((f:any)=>({...f,cam_format:v}))}>
                <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{CAM_FORMATS.map(v=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Skupina strojov</Label>
              <Select value={String(form.machine_group_id||'')} onValueChange={v=>setForm((f:any)=>({...f,machine_group_id:v}))}>
                <SelectTrigger className="h-8 text-sm mt-1"><SelectValue placeholder="Vybrať..."/></SelectTrigger>
                <SelectContent>{(groups||[]).map((g:any)=><SelectItem key={g.id} value={String(g.id)}>{g.code} — {g.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {[['max_spindle_rpm','Max otáčky [ot/min]'],['max_spindle_power_kw','Výkon vretena [kW]'],['travel_x_mm','Zdvih X [mm]'],['travel_y_mm','Zdvih Y [mm]'],['travel_z_mm','Zdvih Z [mm]'],['tool_positions','Zásobník (počet)'],['hourly_rate_eur','Hodinová sadzba [€]'],['location','Umiestnenie']].map(([k,l])=>(
              <div key={k}>
                <Label className="text-xs">{l}</Label>
                <Input type={k==='location'?'text':'number'} className="h-8 text-sm mt-1" value={form[k]||''} onChange={e=>setForm((f:any)=>({...f,[k]:e.target.value}))} data-testid={`input-${k}`}/>
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
