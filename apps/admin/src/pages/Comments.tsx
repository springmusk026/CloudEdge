import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, X, Trash2 } from 'lucide-react';
import { useComments, useModerateComment } from '@/lib/queries';

export function Comments() {
  const { data, isLoading } = useComments();
  const moderate = useModerateComment();

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>;

  const statusColor: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = { pending: 'outline', approved: 'default', spam: 'destructive' };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Comments</h2>
      {(data || []).map(comment => (
        <Card key={comment.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{comment.guestName || 'User'}</span>
              <Badge variant={statusColor[comment.status] || 'secondary'}>{comment.status}</Badge>
            </div>
            <div className="text-sm text-muted-foreground mb-3" dangerouslySetInnerHTML={{ __html: comment.bodyHtml }} />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => moderate.mutate({ id: comment.id, status: 'approved' })}><Check size={12} className="mr-1" /> Approve</Button>
              <Button size="sm" variant="outline" onClick={() => moderate.mutate({ id: comment.id, status: 'spam' })}><X size={12} className="mr-1" /> Spam</Button>
              <Button size="sm" variant="ghost" onClick={() => moderate.mutate({ id: comment.id, status: 'deleted' })}><Trash2 size={12} className="text-destructive" /></Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
