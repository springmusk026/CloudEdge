import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Eye } from 'lucide-react';
import { usePosts, useDeletePost } from '@/lib/queries';
import { api } from '@/lib/api';

export function PostsList() {
  const { data, isLoading } = usePosts({ limit: 50 });
  const deleteMutation = useDeletePost();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const bulkMutation = useMutation({
    mutationFn: async ({ ids, action }: { ids: string[]; action: string }) => {
      for (const id of ids) {
        if (action === 'delete') await api.posts.delete(id);
        else await api.posts.update(id, { status: action } as any);
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['posts'] }); setSelected(new Set()); },
  });

  const toggleSelect = (id: string) => setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const toggleAll = () => setSelected(data?.posts.length === selected.size ? new Set() : new Set(data?.posts.map(p => p.id)));

  const statusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    published: 'default', draft: 'secondary', scheduled: 'outline', archived: 'destructive',
  };

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Posts</h2>
        <Link to="/posts/new"><Button><Plus size={16} className="mr-2" /> New Post</Button></Link>
      </div>

      {/* Bulk Actions Bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted border">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <select className="h-8 w-40 rounded-md border px-2 text-sm" onChange={e => { if (e.target.value) { bulkMutation.mutate({ ids: [...selected], action: e.target.value }); e.target.value = ''; } }}>
            <option value="">Bulk action...</option>
            <option value="published">Publish</option>
            <option value="archived">Archive</option>
            <option value="draft">Move to Draft</option>
            <option value="delete">Delete</option>
          </select>
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>Cancel</Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"><input type="checkbox" checked={data?.posts.length === selected.size && selected.size > 0} onChange={toggleAll} className="rounded" /></TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Published</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.posts.map(post => (
              <TableRow key={post.id} className={selected.has(post.id) ? 'bg-muted/50' : ''}>
                <TableCell><input type="checkbox" checked={selected.has(post.id)} onChange={() => toggleSelect(post.id)} className="rounded" /></TableCell>
                <TableCell>
                  <Link to={`/posts/${post.id}/edit`} className="font-medium hover:text-primary">{post.title}</Link>
                  {post.featured && <Badge variant="outline" className="ml-2 text-xs">Featured</Badge>}
                </TableCell>
                <TableCell><Badge variant={statusVariant[post.status] || 'secondary'}>{post.status}</Badge></TableCell>
                <TableCell className="text-muted-foreground text-sm">{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : '—'}</TableCell>
                <TableCell className="text-right space-x-1">
                  <a href={`http://localhost:3000/${post.slug}`} target="_blank" rel="noopener"><Button variant="ghost" size="icon"><Eye size={14} /></Button></a>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(post.id)}><Trash2 size={14} className="text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
