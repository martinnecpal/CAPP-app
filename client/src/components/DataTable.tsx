import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/authContext';

interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'right';
  mono?: boolean;
}

interface Props<T> {
  title: string;
  data: T[] | undefined;
  columns: Column<T>[];
  loading: boolean;
  onAdd?: () => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  searchField?: string;
  addLabel?: string;
}

export default function DataTable<T extends Record<string, any>>({
  title, data, columns, loading, onAdd, onEdit, onDelete, searchField, addLabel = 'Pridať'
}: Props<T>) {
  const [search, setSearch] = useState('');
  const { profile } = useAuth();
  const canWrite = profile?.role === 'professor' || profile?.role === 'student';

  const filtered = searchField && search
    ? (data || []).filter(row =>
        String(row[searchField] ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : (data || []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{title}</h1>
        <div className="flex items-center gap-2">
          {searchField && (
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Hľadať..."
                className="pl-8 h-8 w-48 text-sm"
                value={search}
                onChange={e => setSearch(e.target.value)}
                data-testid="input-search"
              />
            </div>
          )}
          {canWrite && onAdd && (
            <Button size="sm" onClick={onAdd} data-testid="button-add">
              <Plus size={14} className="mr-1.5" /> {addLabel}
            </Button>
          )}
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-2">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  {columns.map(col => (
                    <th key={col.key} className={`px-4 py-2.5 text-xs font-medium text-muted-foreground ${col.align === 'right' ? 'text-right' : 'text-left'}`}>
                      {col.label}
                    </th>
                  ))}
                  {(canWrite && (onEdit || onDelete)) && (
                    <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground text-right w-20">Akcie</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    {columns.map(col => (
                      <td key={col.key} className={`px-4 py-2.5 ${col.align === 'right' ? 'text-right tabular-nums' : ''} ${col.mono ? 'font-mono text-xs' : 'text-sm'}`}>
                        {col.render ? col.render(row) : String(row[col.key] ?? '—')}
                      </td>
                    ))}
                    {(canWrite && (onEdit || onDelete)) && (
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex justify-end gap-1">
                          {onEdit && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(row)} data-testid={`button-edit-${i}`}>
                              <Pencil size={13} />
                            </Button>
                          )}
                          {onDelete && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => onDelete(row)} data-testid={`button-delete-${i}`}>
                              <Trash2 size={13} />
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={columns.length + 2} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      {search ? 'Žiadne výsledky pre zadaný filter' : 'Žiadne záznamy'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{filtered.length} záznamov</p>
    </div>
  );
}
