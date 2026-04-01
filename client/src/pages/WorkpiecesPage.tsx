import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWorkpieces, getMaterials, insertWorkpiece, updateWorkpiece, deleteWorkpiece } from '@/lib/supabaseQueries';
import DataTable from '@/components/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const EMPTY = { part_number:'', name:'', material_id:'', blank_type:'casting', blank_dim_x_mm:'', blank_dim_y_mm:'', blank_dim_z_mm:'', blank_weight_kg:'', finished_weight_kg:'', annual_demand:'', batch_size:'1', description:'' };

export default function WorkpiecesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY);

  const { data, isLoading } = useQuery({
    queryKey: ['workpieces'],
    queryFn: async () => { const { data, error } = await getWorkpieces(); if (error) throw error; return data; }
  });
  const { data: materials } = useQuery({
    queryKey: ['materials'],
    queryFn: async () => { const { data } = await getMaterials(); return data; }
  });

  const upsert = useMutation({
    mutationFn: async (f: any) => {
      const payload = { ...f,
        material_id: f.material_id ? Number(f.material_id) : null,
        blank_dim_x_mm: f.blank_dim_x_mm ? Number(f.blank_dim_x_mm) : null,
        blank_dim_y_mm: f.blank_dim_y_mm ? Number(f.blank_dim_y_mm) : null,
        blank_dim_z_mm: f.blank_dim_z_mm ? Number(f.blank_dim_z_mm) : null,
        blank_weight_kg: f.blank_weight_kg ? Number(f.blank_weight_kg) : null,
        finished_weight_kg: f.finished_weight_kg ? Number(f.finished_weight_kg) : null,
        annual_demand: f.annual_demand ? Number(f.annual_demand) : 0,
        batch_size: f.batch_size ? Number(f.batch_size) : 1,
      };
      if (editing?.id) { const { error } = await updateWorkpiece(editing.id, payload); if (error) throw error; }
      else { const { error } = await insertWorkpiece(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['workpieces'] }); qc.invalidateQueries({ queryKey: ['dashboard-stats'] }); setOpen(false); toast({ title: 'Obrobok uložený' }); },
    onError: (e: any) => toast({ title: 'Chyba', description: e.message, variant: 'destructive' }),
  });

  const remove = useMutation({
    mutationFn: async (id: number) => { const { error } = await deleteWorkpiece(id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['workpieces'] }); toast({ title: 'Obrobok vymazaný' }); },
    onError: (e: any) => toast({ title: 'Chyba', description: e.message, variant: 'destructive' }),
  });

  function openAdd() { setEditing(null); setForm(EMPTY); setOpen(true); }
  function openEdit(row: any) { setEditing(row); setForm({ ...EMPTY, ...row, material_id: String(row.material_id ?? '') }); setOpen(true); }

  const columns = [
    { key:'part_number', label:'Číslo dielu', mono:true },
    { key:'name', label:'Názov' },
    { key:'material_code', label:'Materiál', render:(r:any)=> r.materials?.code ?? '—' },
    { key:'blank_type', label:'Typ polotovaru' },
    { key:'blank_weight_kg', label:'Hmot. pol. [kg]', align:'right' as const },
    { key:'finished_weight_kg', label:'Hmot. hot. [kg]', align:'right' as const },
    { key:'buy_to_fly_ratio', label:'B/F ratio', align:'right' as const, render:(r:any)=>r.buy_to_fly_ratio ? Number(r.buy_to_fly_ratio).toFixed(2) : '—' },
  ];

  return (
    <div className="p-6 max-w-6xl">
      <DataTable title="Obrobky" data={data} columns={columns} loading={isLoading}
        onAdd={openAdd} onEdit={openEdit}
        onDelete={row => { if (confirm(`Vymazať obrobok ${row.part_number}?`)) remove.mutate(row.id); }}
        searchField="name" addLabel="Pridať obrobok"
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{editing?.id ? 'Upraviť obrobok' : 'Nový obrobok'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <Label className="text-xs">Číslo dielu</Label>
              <Input className="h-8 text-sm mt-1" value={form.part_number||''} onChange={e=>setForm((f:any)=>({...f,part_number:e.target.value}))} data-testid="input-part_number"/>
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Názov</Label>
              <Input className="h-8 text-sm mt-1" value={form.name||''} onChange={e=>setForm((f:any)=>({...f,name:e.target.value}))} data-testid="input-name"/>
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Materiál</Label>
              <Select value={String(form.material_id||'')} onValueChange={v=>setForm((f:any)=>({...f,material_id:v}))}>
                <SelectTrigger className="h-8 text-sm mt-1"><SelectValue placeholder="Vyberte materiál"/></SelectTrigger>
                <SelectContent>{(materials||[]).map((m:any)=><SelectItem key={m.id} value={String(m.id)}>{m.code} — {m.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Typ polotovaru</Label>
              <Select value={form.blank_type||'casting'} onValueChange={v=>setForm((f:any)=>({...f,blank_type:v}))}>
                <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['casting','forging','bar','plate','tube','extrusion','additive'].map(v=><SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {[['blank_dim_x_mm','X [mm]'],['blank_dim_y_mm','Y [mm]'],['blank_dim_z_mm','Z [mm]'],['blank_weight_kg','Hm. pol. [kg]'],['finished_weight_kg','Hm. hot. [kg]'],['annual_demand','Ročný dopyt [ks]'],['batch_size','Dávka [ks]']].map(([k,l])=>(
              <div key={k}>
                <Label className="text-xs">{l}</Label>
                <Input type="number" className="h-8 text-sm mt-1" value={form[k]||''} onChange={e=>setForm((f:any)=>({...f,[k]:e.target.value}))} data-testid={`input-${k}`}/>
              </div>
            ))}
            <div className="col-span-2">
              <Label className="text-xs">Poznámky</Label>
              <Textarea className="text-sm mt-1 min-h-[60px]" value={form.description||''} onChange={e=>setForm((f:any)=>({...f,description:e.target.value}))}/>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={()=>setOpen(false)}>Zrušiť</Button>
            <Button size="sm" onClick={()=>upsert.mutate(form)} disabled={upsert.isPending} data-testid="button-save">
              {upsert.isPending ? 'Ukladám...' : 'Uložiť'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
