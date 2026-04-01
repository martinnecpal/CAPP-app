import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getOperationDetail, getCostBreakdown, getPlanSummary } from '@/lib/supabaseQueries';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

function exportCSV(data: any[], filename: string) {
  if (!data?.length) return;
  const keys = Object.keys(data[0]);
  const csv = [keys.join(';'), ...data.map(r => keys.map(k => String(r[k] ?? '')).join(';'))].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [selectedPlan, setSelectedPlan] = useState<string>('all');

  const { data: plans } = useQuery({
    queryKey: ['plan-summary'],
    queryFn: async () => { const { data, error } = await getPlanSummary(); if (error) throw error; return data; }
  });

  const { data: opDetail, isLoading: opLoading } = useQuery({
    queryKey: ['op-detail', selectedPlan],
    queryFn: async () => { const { data, error } = await getOperationDetail(selectedPlan === 'all' ? undefined : selectedPlan); if (error) throw error; return data; }
  });

  const { data: costs, isLoading: costsLoading } = useQuery({
    queryKey: ['cost-breakdown', selectedPlan],
    queryFn: async () => { const { data, error } = await getCostBreakdown(selectedPlan === 'all' ? undefined : selectedPlan); if (error) throw error; return data; }
  });

  // Súhrn nákladov
  const totalCost = (costs || []).reduce((s: number, r: any) => s + (Number(r.total_op_cost_eur) || 0), 0);
  const totalTime = (costs || []).reduce((s: number, r: any) => s + (Number(r.total_time_min) || 0), 0);

  return (
    <div className="p-6 max-w-6xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Reporty & Analýzy</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Filter:</span>
          <Select value={selectedPlan} onValueChange={setSelectedPlan}>
            <SelectTrigger className="h-8 w-44 text-sm">
              <SelectValue placeholder="Všetky postupy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všetky postupy</SelectItem>
              {(plans || []).map((p: any) => <SelectItem key={p.plan_number} value={p.plan_number}>{p.plan_number}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="costs">
        <TabsList>
          <TabsTrigger value="costs">Kalkulácia nákladov</TabsTrigger>
          <TabsTrigger value="operations">Detail operácií</TabsTrigger>
          <TabsTrigger value="summary">Súhrn postupov</TabsTrigger>
        </TabsList>

        {/* TAB: KALKULÁCIA */}
        <TabsContent value="costs" className="space-y-3 mt-3">
          <div className="grid grid-cols-3 gap-3">
            <Card><CardContent className="pt-4 pb-3 px-4"><div className="text-xs text-muted-foreground">Celkový čas</div><div className="text-xl font-bold tabular-nums mt-0.5">{totalTime.toFixed(0)} <span className="text-sm font-normal text-muted-foreground">min</span></div></CardContent></Card>
            <Card><CardContent className="pt-4 pb-3 px-4"><div className="text-xs text-muted-foreground">Celkové náklady</div><div className="text-xl font-bold tabular-nums mt-0.5">{totalCost.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">€</span></div></CardContent></Card>
            <Card><CardContent className="pt-4 pb-3 px-4"><div className="text-xs text-muted-foreground">Operácií</div><div className="text-xl font-bold tabular-nums mt-0.5">{(costs||[]).length}</div></CardContent></Card>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => exportCSV(costs||[], 'capp_costs.csv')} data-testid="button-export-costs">
              <Download size={13} className="mr-1.5" /> Export CSV
            </Button>
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            {costsLoading ? <div className="p-4 space-y-2">{[...Array(4)].map((_,i)=><Skeleton key={i} className="h-9 w-full"/>)}</div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="bg-muted/50 border-b border-border">
                    {['Postup','Obrobok','Op.','Stroj','€/h','Čas [min]','Setup €','Strojný €','Celkom €'].map(h=><th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground">{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {(costs||[]).map((r:any,i:number)=>(
                      <tr key={i} className="border-b border-border/40 hover:bg-muted/20">
                        <td className="px-3 py-2 font-mono">{r.plan_number}</td>
                        <td className="px-3 py-2">{r.workpiece_name}</td>
                        <td className="px-3 py-2 font-mono">{r.operation_code}</td>
                        <td className="px-3 py-2">{r.machine_code??'—'}</td>
                        <td className="px-3 py-2 tabular-nums text-right">{r.hourly_rate_eur??'—'}</td>
                        <td className="px-3 py-2 tabular-nums text-right">{r.total_time_min}</td>
                        <td className="px-3 py-2 tabular-nums text-right">{r.setup_cost_eur??'—'}</td>
                        <td className="px-3 py-2 tabular-nums text-right">{r.machining_cost_eur??'—'}</td>
                        <td className="px-3 py-2 tabular-nums text-right font-semibold">{r.total_op_cost_eur??'—'}</td>
                      </tr>
                    ))}
                    {(!costs||costs.length===0)&&<tr><td colSpan={9} className="px-3 py-6 text-center text-muted-foreground">Žiadne dáta</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB: DETAIL OPERÁCIÍ */}
        <TabsContent value="operations" className="mt-3 space-y-3">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => exportCSV(opDetail||[], 'capp_operations.csv')} data-testid="button-export-ops">
              <Download size={13} className="mr-1.5" /> Export CSV
            </Button>
          </div>
          <div className="border border-border rounded-lg overflow-hidden">
            {opLoading ? <div className="p-4 space-y-2">{[...Array(4)].map((_,i)=><Skeleton key={i} className="h-9 w-full"/>)}</div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="bg-muted/50 border-b border-border">
                    {['Postup','Poradie','Op.','Typ','Operácia','Stroj','Nástroj','Ø','n [ot/min]','vf [mm/min]','vc [m/min]','ap','ae','Čas [min]'].map(h=><th key={h} className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {(opDetail||[]).map((r:any,i:number)=>(
                      <tr key={i} className="border-b border-border/40 hover:bg-muted/20">
                        <td className="px-2 py-2 font-mono">{r.plan_number}</td>
                        <td className="px-2 py-2 tabular-nums">{r.sequence_no}</td>
                        <td className="px-2 py-2 font-mono">{r.operation_code}</td>
                        <td className="px-2 py-2"><Badge variant="outline" className="text-xs">{r.operation_type}</Badge></td>
                        <td className="px-2 py-2">{r.operation_name}</td>
                        <td className="px-2 py-2">{r.machine_code??'—'}</td>
                        <td className="px-2 py-2">{r.tool_code??'—'}</td>
                        <td className="px-2 py-2 tabular-nums">{r.diameter_mm??'—'}</td>
                        <td className="px-2 py-2 tabular-nums">{r.spindle_speed_rpm??'—'}</td>
                        <td className="px-2 py-2 tabular-nums">{r.feed_rate_mm_min??'—'}</td>
                        <td className="px-2 py-2 tabular-nums">{r.cutting_speed_m_min??'—'}</td>
                        <td className="px-2 py-2 tabular-nums">{r.axial_depth_ap_mm??'—'}</td>
                        <td className="px-2 py-2 tabular-nums">{r.radial_depth_ae_mm??'—'}</td>
                        <td className="px-2 py-2 tabular-nums font-semibold">{r.op_total_min}</td>
                      </tr>
                    ))}
                    {(!opDetail||opDetail.length===0)&&<tr><td colSpan={14} className="px-3 py-6 text-center text-muted-foreground">Žiadne dáta</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB: SÚHRN */}
        <TabsContent value="summary" className="mt-3">
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead><tr className="bg-muted/50 border-b border-border">
                {['Číslo postupu','Obrobok','Materiál','Typ výroby','Operácií','Setup [min]','Strojný [min]','Celkom [min]','Status'].map(h=><th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground">{h}</th>)}
              </tr></thead>
              <tbody>
                {(plans||[]).map((r:any,i:number)=>(
                  <tr key={i} className="border-b border-border/40 hover:bg-muted/20">
                    <td className="px-3 py-2 font-mono">{r.plan_number}</td>
                    <td className="px-3 py-2">{r.workpiece_name}</td>
                    <td className="px-3 py-2">{r.material_code??'—'}</td>
                    <td className="px-3 py-2">{r.production_type}</td>
                    <td className="px-3 py-2 tabular-nums">{r.num_operations}</td>
                    <td className="px-3 py-2 tabular-nums">{r.total_setup_min}</td>
                    <td className="px-3 py-2 tabular-nums">{r.total_machining_min}</td>
                    <td className="px-3 py-2 tabular-nums font-semibold">{r.total_time_min}</td>
                    <td className="px-3 py-2"><Badge variant="secondary" className="text-xs">{r.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
