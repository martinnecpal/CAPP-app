import { useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const { error: err } = await signIn(email, password);
    if (err) setError(err);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-8 p-8 bg-card border border-border rounded-xl shadow-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <svg viewBox="0 0 48 48" width="48" height="48" aria-label="CAPP logo" fill="none">
            <rect x="4" y="4" width="40" height="40" rx="8" fill="hsl(var(--primary))" />
            <path d="M14 32 L14 16 L20 16 C26 16 30 19 30 24 C30 29 26 32 20 32 Z" fill="white" stroke="none"/>
            <rect x="32" y="16" width="3" height="16" rx="1.5" fill="white"/>
          </svg>
          <h1 className="text-xl font-bold tracking-tight">CAPP Dashboard</h1>
          <p className="text-sm text-muted-foreground">Computer-Aided Process Planning</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@university.sk"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              data-testid="input-email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Heslo</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              data-testid="input-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading} data-testid="button-login">
            {loading ? 'Prihlasujem...' : 'Prihlásiť sa'}
          </Button>
        </form>

        <p className="text-xs text-center text-muted-foreground">
          Účet vytvára pedagóg cez Supabase Dashboard → Authentication → Users
        </p>
      </div>
    </div>
  );
}
