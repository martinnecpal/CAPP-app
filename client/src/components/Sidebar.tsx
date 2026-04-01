import { Link, useLocation } from 'wouter';
import { useAuth } from '@/lib/authContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Package, Layers, Settings2, Wrench,
  ClipboardList, BarChart3, LogOut, ChevronRight, Factory
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { href: '/',         label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/materials',label: 'Materiály',   icon: Layers },
  { href: '/workpieces',label: 'Obrobky',    icon: Package },
  { href: '/machines', label: 'Stroje',      icon: Factory },
  { href: '/tools',    label: 'Nástroje',    icon: Wrench },
  { href: '/plans',    label: 'Postupy',     icon: ClipboardList },
  { href: '/reports',  label: 'Reporty',     icon: BarChart3 },
];

const roleLabel: Record<string, string> = {
  professor: 'Profesor',
  student: 'Študent',
  readonly: 'Read-only',
};
const roleBadgeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  professor: 'default',
  student: 'secondary',
  readonly: 'outline',
};

export default function Sidebar() {
  const [location] = useLocation();
  const { profile, signOut } = useAuth();

  return (
    <aside className="flex flex-col h-full w-56 bg-card border-r border-border">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-border">
        <svg viewBox="0 0 32 32" width="28" height="28" fill="none" aria-label="CAPP">
          <rect width="32" height="32" rx="6" fill="hsl(var(--primary))" />
          <path d="M8 22 L8 10 L14 10 C19 10 22 12.5 22 16 C22 19.5 19 22 14 22 Z" fill="white"/>
          <rect x="24" y="10" width="2.5" height="12" rx="1.25" fill="white"/>
        </svg>
        <div>
          <div className="text-sm font-bold leading-tight">CAPP</div>
          <div className="text-xs text-muted-foreground leading-tight">Process Planning</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? location === '/' : location.startsWith(href);
          return (
            <Link key={href} href={href}>
              <a
                data-testid={`nav-${label.toLowerCase()}`}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon size={15} />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight size={13} />}
              </a>
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-border space-y-2">
        <div className="px-1">
          <div className="text-xs font-medium truncate">{profile?.email}</div>
          {profile?.role && (
            <Badge variant={roleBadgeVariant[profile.role] ?? 'outline'} className="mt-1 text-xs">
              {roleLabel[profile.role] ?? profile.role}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-destructive"
          onClick={signOut}
          data-testid="button-logout"
        >
          <LogOut size={14} className="mr-2" />
          Odhlásiť sa
        </Button>
      </div>
    </aside>
  );
}
