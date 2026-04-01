import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMaterials, insertMaterial, updateMaterial, deleteMaterial } from '@/lib/supabaseQueries';
import DataTable from '@/components/DataTable';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const CLASS_LABELS: Record<string, string> = {
  steel: 'Oceľ', cast_iron: 'Liatina', aluminum: 'Hliník',
  titanium: 'Titán', nickel_alloy: 'Ni-zliatina', copper_alloy: 'Cu-zliatina',
  polymer: 'Polymér', composite: 'Kompozit', other: 'Iné',
};
const CLASS_COLORS: Record<string, string> = {
  steel:'bg-zinc-100 text-zinc-800', cast_iron:'bg-stone-100 text-stone-800',
  aluminum:'bg-blue-50 text-blue-700', titanium:'bg-purple-50 text-purple-700',
  nickel_alloy:'bg-yellow-50 text-yellow-800', other:'bg-gray-100 text-gray-600',
};

const EMPTY = { code:'', name:'', material_class:'steel', standard:'', density_kg_m3:'', tensile_strength_mpa:'', yield_strength_mpa:'', hardness_hb:'', machinability_index:'', notes:'' };

export default function MaterialsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY);

  const { data, isLoading } = useQuery({
    queryKey: ['materials'],
    queryFn: async () => { const { data, error } = await getMaterials(); if (error) throw error; return data; }
  });

  const upsert = useMutation({
    mutationFn: async (f: any) => {
      const payload = { ...f,
        density_kg_m3: f.density_kg_m3 ? Number(f.density_kg_m3) : null,
        tensile_strength_mpa: f.tensile_strength_mpa ? Number(f.tensile_strength_mpa) : null,
        yield_strength_mpa: f.yield_strength_mpa ? Number(f.yield_strength_mpa) : null,
        hardness_hb: f.hardness_hb ? Number(f.hardness_hb) : null,
        machinability_index: f.machinability_index ? Number(f.machinability_index) : null,
      };
      if (editing?.id) { const { error } = await updateMaterial(editing.id, payload); if (error) throw error; }
      else { const { error } = await insertMaterial(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['materials'] }); qc.invalidateQueries({ queryKey: ['dashboard-stats'] }); setOpen(false); toast({ title: editing?.id ? 'Materiál aktualizovaný' : 'Materiál pridaný' }); },
    onError: (e: any) => toast({ title: 'Chyba', description: e.message, variant: 'destructive' }),
  });

  const remove = useMutation({
    mutationFn: async (id: number) => { const { error } = await deleteMaterial(id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['materials'] }); toast({ title: 'Materiál vymazaný' }); },
    onError: (e: any) => toast({ title: 'Chyba', description: e.message, variant: 'destructive' }),
  });

  function openAdd() { setEditing(null); setForm(EMPTY); setOpen(true); }
  function openEdit(row: any) { setEditing(row); setForm({ ...EMPTY, ...row }); setOpen(true); }

  const columns = [
    { key:'code', label:'Kód', mono:true },
    { key:'name', label:'Názov' },
    { key:'material_class', label:'Trieda', render:(r:any) => <Badge className={`text-xs ${CLASS_COLORS[r.material_class]??''}`}>{CLASS_LABELS[r.material_class]??r.material_class}</Badge> },
    { key:'standard', label:'Norma' },
    { key:'tensile_strength_mpa', label:'Rm [MPa]', align:'right' as const },
    { key:'hardness_hb', label:'HB', align:'right' as const },
    { key:'machinability_index', label:'Obr. index', align:'right' as const },
  ];

  return (
    <div className="p-6 max-w-6xl">
      <DataTable title="Materiály" data={data} columns={columns} loading={isLoading}
        onAdd={openAdd} onEdit={openEdit}
        onDelete={row => { if (confirm(`Vymazať materiál ${row.code}?`)) remove.mutate(row.id); }}
        searchField="name" addLabel="Pridať materiál"
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing?.id ? 'Upraviť materiál' : 'Nový materiál'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            {[['code','Kód'],['name','Názov'],['standard','Norma']].map(([k,l])=>(
              <div key={k} className={k==='name'?'col-span-2':''}>
                <Label className="text-xs">{l}</Label>
                <Input className="h-8 text-sm mt-1" value={form[k]||''} onChange={e=>setForm((f:any)=>({...f,[k]:e.target.value}))} data-testid={`input-${k}`}/>
              </div>
            ))}
            <div>
              <Label className="text-xs">Trieda</Label>
              <Select value={form.material_class} onValueChange={v=>setForm((f:any)=>({...f,material_class:v}))}>
                <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(CLASS_LABELS).map(([v,l])=><SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {[['density_kg_m3','Hustota [kg/m³]'],['tensile_strength_mpa','Rm [MPa]'],['yield_strength_mpa','Re [MPa]'],['hardness_hb','Tvrdosť HB'],['machinability_index','Index obrobiteľ.']].map(([k,l])=>(
              <div key={k}>
                <Label className="text-xs">{l}</Label>
                <Input type="number" className="h-8 text-sm mt-1" value={form[k]||''} onChange={e=>setForm((f:any)=>({...f,[k]:e.target.value}))} data-testid={`input-${k}`}/>
              </div>
            ))}
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
