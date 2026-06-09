import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { History } from 'lucide-react';
import { api } from '@/lib/api';

export function ActivityLog() {
  const { data, isLoading } = useQuery({ queryKey: ['audit-log'], queryFn: () => api.admin.auditLog() });

  const actionColors: Record<string, string> = {
    create: 'bg-green-100 text-green-700', publish: 'bg-blue-100 text-blue-700',
    update: 'bg-amber-100 text-amber-700', delete: 'bg-red-100 text-red-700',
  };

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold flex items-center gap-2"><History size={20} /> Activity Log</h2>
      <Card>
        <CardContent className="p-0 divide-y">
          {(data || []).map((entry: any) => (
            <div key={entry.id} className="flex items-center gap-4 px-4 py-3">
              <Badge className={`text-xs ${actionColors[entry.action] || 'bg-gray-100 text-gray-700'}`}>{entry.action}</Badge>
              <div className="flex-1 min-w-0">
                <p className="text-sm"><span className="font-medium capitalize">{entry.resourceType}</span> {entry.resourceId?.slice(0, 8)}</p>
              </div>
              <time className="text-xs text-muted-foreground shrink-0">{new Date(entry.createdAt).toLocaleString()}</time>
            </div>
          ))}
          {(!data || data.length === 0) && <p className="text-sm text-muted-foreground p-4 text-center">No activity yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
