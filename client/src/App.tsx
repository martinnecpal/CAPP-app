import { Switch, Route, Router } from 'wouter';
import { useHashLocation } from 'wouter/use-hash-location';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/lib/authContext';
import { ThemeProvider } from '@/lib/themeContext';
import Sidebar from '@/components/Sidebar';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import MaterialsPage from '@/pages/MaterialsPage';
import WorkpiecesPage from '@/pages/WorkpiecesPage';
import MachinesPage from '@/pages/MachinesPage';
import ToolsPage from '@/pages/ToolsPage';
import PlansPage from '@/pages/PlansPage';
import ReportsPage from '@/pages/ReportsPage';
import { Skeleton } from '@/components/ui/skeleton';

function AppShell() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-2 w-48">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <Router hook={useHashLocation}>
      <div className="dashboard" data-testid="app-shell">
        <Sidebar />
        <main className="main">
          <Switch>
            <Route path="/" component={DashboardPage} />
            <Route path="/materials" component={MaterialsPage} />
            <Route path="/workpieces" component={WorkpiecesPage} />
            <Route path="/machines" component={MachinesPage} />
            <Route path="/tools" component={ToolsPage} />
            <Route path="/plans" component={PlansPage} />
            <Route path="/reports" component={ReportsPage} />
            <Route>
              <div className="p-6 text-muted-foreground text-sm">Stránka nenájdená</div>
            </Route>
          </Switch>
        </main>
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AppShell />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
