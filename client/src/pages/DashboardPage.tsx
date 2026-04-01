import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, getPlanSummary } from '@/lib/supabaseQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, Layers, Factory, Wrench, ClipboardList, CheckCircle, Clock, FileText } from 'lucide-react';
import { useAuth } from '@/lib/authContext';

function StatCard({ label, value, icon: Icon, loading }: { label: string; value: number; icon: any; loading: boolean }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4 px-5">
        <div className="flex items-center justify-between">
          <div>
            {loading ? <Skeleton className="h-7 w-12 mb-1" /> : (
              <div className="text-2xl font-bold tabular-nums" data-testid={`stat-${label}`}>{value}</div>
            )}
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </div>
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon size={18} className="text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const statusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  approved: 'default',
  released: 'default',
  draft: 'secondary',
  in_review: 'outline',
  obsolete: 'destructive',
};
const statusLabel: Record<string, string> = {
  approved: 'Schválený',
  released: 'Vydaný',
  draft: 'Návrh',
  in_review: 'V revízii',
  obsolete: 'Zastaraný',
};

export default function DashboardPage() {
  const { profile } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const s = await getDashboardStats();
      return s;
    },
  });

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['plan-summary'],
    queryFn: async () => {
      const { data, error } = await getPlanSummary();
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Vitaj, {profile?.full_name || profile?.email?.split('@')[0]} — prehľad CAPP databázy
        </p>
      </div>

      {/* KPI karty */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Materiály" value={stats?.materials ?? 0} icon={Layers} loading={statsLoading} />
        <StatCard label="Obrobky" value={stats?.workpieces ?? 0} icon={Package} loading={statsLoading} />
        <StatCard label="Stroje" value={stats?.machines ?? 0} icon={Factory} loading={statsLoading} />
        <StatCard label="Nástroje" value={stats?.tools ?? 0} icon={Wrench} loading={statsLoading} />
      </div>

      {/* Statusy postupov */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
            <CheckCircle size={20} className="text-primary" />
            <div>
              <div className="text-lg font-bold tabular-nums">{stats?.plansApproved ?? 0}</div>
              <div className="text-xs text-muted-foreground">Schválené postupy</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
            <Clock size={20} className="text-muted-foreground" />
            <div>
              <div className="text-lg font-bold tabular-nums">{stats?.plansDraft ?? 0}</div>
              <div className="text-xs text-muted-foreground">Návrhy</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
            <FileText size={20} className="text-muted-foreground" />
            <div>
              <div className="text-lg font-bold tabular-nums">{stats?.plansReleased ?? 0}</div>
              <div className="text-xs text-muted-foreground">Vydané</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabuľka postupov */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ClipboardList size={15} />
            Technologické postupy — prehľad
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {plansLoading ? (
            <div className="px-6 space-y-2 pb-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-2 text-left text-xs font-medium text-muted-foreground">Číslo postupu</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Obrobok</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Materiál</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Operácií</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Čas [min]</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(plans || []).map((p: any, i: number) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors" data-testid={`row-plan-${p.plan_number}`}>
                      <td className="px-6 py-2.5 font-medium font-mono text-xs">{p.plan_number}</td>
                      <td className="px-4 py-2.5 text-xs">{p.workpiece_name}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{p.material_code}</td>
                      <td className="px-4 py-2.5 text-xs text-right tabular-nums">{p.num_operations}</td>
                      <td className="px-4 py-2.5 text-xs text-right tabular-nums">{p.total_time_min ?? '—'}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant={statusVariant[p.status] ?? 'outline'} className="text-xs">
                          {statusLabel[p.status] ?? p.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {(!plans || plans.length === 0) && (
                    <tr><td colSpan={6} className="px-6 py-6 text-center text-sm text-muted-foreground">Žiadne postupy v databáze</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
