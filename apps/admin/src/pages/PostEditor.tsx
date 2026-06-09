import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ArrowLeft, Save, Send, Sparkles, Loader2, Eye } from 'lucide-react';
import { api, type Post } from '@/lib/api';
import { usePost } from '@/lib/queries';
import { RichEditor } from '@/components/RichEditor';

export function PostEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: existing } = usePost(id || '');
  const [post, setPost] = useState<Record<string, any>>({ title: '', slug: '', contentMarkdown: '', excerpt: '', status: 'draft', visibility: 'public', featured: false, tags: [], metaTitle: '', metaDescription: '' });
  const [aiLoading, setAiLoading] = useState('');

  useEffect(() => { if (existing) setPost({ ...existing, visibility: existing.visibility ?? 'public' }); }, [existing]);

  const saveMutation = useMutation({
    mutationFn: () => id ? api.posts.update(id, post) : api.posts.create(post) as any,
    onSuccess: (res: any) => { if (!id && res?.id) navigate(`/posts/${res.id}/edit`, { replace: true }); },
  });

  const publishMutation = useMutation({
    mutationFn: () => { const data = { ...post, status: 'published' }; return (id ? api.posts.update(id, data) : api.posts.create(data)) as any; },
  });

  const update = (fields: Record<string, unknown>) => setPost(p => ({ ...p, ...fields }));
  const wordCount = (post.contentHtml || '').replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
  const [showPreview, setShowPreview] = useState(false);

  // Keyboard shortcuts: Ctrl+S = save, Ctrl+Enter = publish
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveMutation.mutate(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); publishMutation.mutate(); }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [post]);

  async function aiImprove() { setAiLoading('improve'); try { const text = (post.contentHtml || '').replace(/<[^>]*>/g, ''); const { result } = await api.ai.improve(text); update({ contentHtml: `<p>${result.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>` }); } finally { setAiLoading(''); } }
  async function aiExcerpt() { setAiLoading('excerpt'); try { const text = (post.contentHtml || '').replace(/<[^>]*>/g, ''); const { excerpt } = await api.ai.excerpt(text); update({ excerpt }); } finally { setAiLoading(''); } }
  async function aiTags() { setAiLoading('tags'); try { const text = (post.contentHtml || '').replace(/<[^>]*>/g, ''); const { tags } = await api.ai.suggestTags(post.title || '', text); update({ tags }); } finally { setAiLoading(''); } }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/posts')}><ArrowLeft size={14} className="mr-1" /> Back</Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}><Eye size={14} className="mr-1" /> Preview</Button>
          <Button variant="outline" size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Save size={14} className="mr-1" />} Save <span className="text-xs text-muted-foreground ml-1">⌘S</span>
          </Button>
          <Button size="sm" onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}>
            {publishMutation.isPending ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Send size={14} className="mr-1" />} Publish <span className="text-xs text-muted-foreground ml-1">⌘↵</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-4">
          <Input placeholder="Post title..." value={post.title || ''} onChange={e => update({ title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })} className="text-2xl font-bold h-auto py-3 border-none shadow-none focus-visible:ring-0 px-0" />
          <RichEditor
            content={post.contentHtml || ''}
            onChange={(html) => update({ contentHtml: html })}
            placeholder="Start writing your post..."
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{wordCount} words · {Math.max(1, Math.round(wordCount / 250))} min read</span>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={aiImprove} disabled={!!aiLoading}><Sparkles size={12} className="mr-1" />{aiLoading === 'improve' ? '...' : 'Improve'}</Button>
              <Button variant="ghost" size="sm" onClick={aiExcerpt} disabled={!!aiLoading}>{aiLoading === 'excerpt' ? '...' : 'Excerpt'}</Button>
              <Button variant="ghost" size="sm" onClick={aiTags} disabled={!!aiLoading}>{aiLoading === 'tags' ? '...' : 'Tags'}</Button>
            </div>
          </div>
        </div>

        <Card className="h-fit">
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2"><Label>Slug</Label><Input value={post.slug || ''} onChange={e => update({ slug: e.target.value })} /></div>
            <div className="space-y-2"><Label>Excerpt</Label><Textarea value={post.excerpt || ''} onChange={e => update({ excerpt: e.target.value })} className="h-20" /></div>
            <div className="space-y-2"><Label>Visibility</Label>
              <Select value={(post.visibility ?? 'public') as string} onValueChange={v => update({ visibility: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="public">Public</SelectItem><SelectItem value="members">Members</SelectItem><SelectItem value="paid">Paid</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Tags (comma-separated)</Label><Input value={(post.tags || []).join(', ')} onChange={e => update({ tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })} /></div>
            <Separator />
            <div className="flex items-center justify-between"><Label>Featured</Label><Switch checked={post.featured || false} onCheckedChange={v => update({ featured: v })} /></div>
            <div className="space-y-2">
              <Label>Schedule Publish</Label>
              <Input type="datetime-local" value={post.scheduledAt || ''} onChange={e => update({ scheduledAt: e.target.value, status: e.target.value ? 'scheduled' : post.status })} />
              {post.scheduledAt && <p className="text-xs text-muted-foreground">Will auto-publish at this time</p>}
            </div>
            <Separator />
            <div className="space-y-2"><Label>Meta Title</Label><Input value={post.metaTitle || ''} onChange={e => update({ metaTitle: e.target.value })} /></div>
            <div className="space-y-2"><Label>Meta Description</Label><Textarea value={post.metaDescription || ''} onChange={e => update({ metaDescription: e.target.value })} className="h-16" /></div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <article className="prose prose-lg dark:prose-invert max-w-none">
            <h1>{post.title || 'Untitled'}</h1>
            <div dangerouslySetInnerHTML={{ __html: post.contentHtml || '<p>No content yet...</p>' }} />
          </article>
        </DialogContent>
      </Dialog>
    </div>
  );
}
