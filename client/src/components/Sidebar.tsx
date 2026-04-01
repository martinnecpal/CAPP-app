import { Link, useLocation } from 'wouter';
import { useAuth } from '@/lib/authContext';
import { useTheme, type AppTheme } from '@/lib/themeContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Package, Layers, Settings2, Wrench,
  ClipboardList, BarChart3, LogOut, ChevronRight, Factory
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const THEMES: { value: AppTheme; label: string; color: string }[] = [
  { value: 'green', label: 'Zelená',  color: 'hsl(183 99% 22%)' },
  { value: 'blue',  label: 'Modrá',   color: 'hsl(221 83% 53%)' },
  { value: 'red',   label: 'Červená', color: 'hsl(0 72% 51%)'   },
  { value: 'gray',  label: 'Sivá',    color: 'hsl(215 16% 37%)' },
];

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
  const { theme, setTheme } = useTheme();

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
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 justify-start text-muted-foreground hover:text-destructive"
            onClick={signOut}
            data-testid="button-logout"
          >
            <LogOut size={14} className="mr-2" />
            Odhlásiť sa
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="px-2 text-muted-foreground">
                <Settings2 size={14} />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" align="end" className="w-44 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Farebná téma</p>
              <div className="grid grid-cols-4 gap-2">
                {THEMES.map(t => (
                  <button
                    key={t.value}
                    title={t.label}
                    onClick={() => setTheme(t.value)}
                    className={cn(
                      'w-8 h-8 rounded-full ring-offset-2 transition-all',
                      theme === t.value ? 'ring-2 ring-foreground' : 'hover:scale-110'
                    )}
                    style={{ background: t.color }}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </aside>
  );
}
