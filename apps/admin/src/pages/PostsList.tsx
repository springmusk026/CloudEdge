import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Trash2, Eye, Copy, Share2, MoreHorizontal, Pencil } from 'lucide-react';
import { usePosts, useDeletePost } from '@/lib/queries';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export function PostsList() {
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const { data, isLoading } = usePosts({ limit: 50, status: statusFilter || undefined });
  const deleteMutation = useDeletePost();
  const qc = useQueryClient();
  const navigate = useNavigate();
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

  const filteredPosts = (data?.posts || []).filter(p => !search || p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Posts</h2>
        <Link to="/posts/new"><Button><Plus size={16} className="mr-2" /> New Post</Button></Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search posts..." className="max-w-xs" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 rounded-md border px-3 text-sm">
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="archived">Archived</option>
        </select>
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
            {filteredPosts.map(post => (
              <TableRow key={post.id} className={selected.has(post.id) ? 'bg-muted/50' : ''}>
                <TableCell><input type="checkbox" checked={selected.has(post.id)} onChange={() => toggleSelect(post.id)} className="rounded" /></TableCell>
                <TableCell>
                  <Link to={`/posts/${post.id}/edit`} className="font-medium hover:text-primary">{post.title}</Link>
                  {post.featured && <Badge variant="outline" className="ml-2 text-xs">Featured</Badge>}
                  {post.wordCount && <span className="ml-2 text-xs text-muted-foreground">{post.wordCount} words</span>}
                </TableCell>
                <TableCell><Badge variant={statusVariant[post.status] || 'secondary'}>{post.status}</Badge></TableCell>
                <TableCell className="text-muted-foreground text-sm">{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : '—'}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger><Button variant="ghost" size="icon"><MoreHorizontal size={14} /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/posts/${post.id}/edit`)}><Pencil size={12} className="mr-2" /> Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={async () => { await api.posts.duplicate(post.id); qc.invalidateQueries({ queryKey: ['posts'] }); toast.success('Post duplicated'); }}><Copy size={12} className="mr-2" /> Duplicate</DropdownMenuItem>
                      <DropdownMenuItem onClick={async () => { const { url } = await api.posts.share(post.id); navigator.clipboard.writeText(url); toast.success('Share link copied'); }}><Share2 size={12} className="mr-2" /> Share Link</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.open(`http://localhost:3000/${post.slug}`, '_blank')}><Eye size={12} className="mr-2" /> View</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { deleteMutation.mutate(post.id); toast.success('Post deleted'); }} className="text-destructive"><Trash2 size={12} className="mr-2" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
