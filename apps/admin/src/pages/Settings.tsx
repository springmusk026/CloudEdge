import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save } from 'lucide-react';
import { useSettings, useUpdateSettings } from '@/lib/queries';

export function Settings() {
  const { data, isLoading } = useSettings();
  const updateMutation = useUpdateSettings();
  const [form, setForm] = useState<Record<string, unknown>>({});

  const settings = { ...data, ...form } as Record<string, any>;
  const set = (key: string, val: unknown) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Settings</h2>
        <Button onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Save size={14} className="mr-2" />} Save
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Site Identity</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Site Title</Label><Input value={settings.site_title || ''} onChange={e => set('site_title', e.target.value)} /></div>
          <div className="space-y-2"><Label>Description</Label><Textarea value={settings.site_description || ''} onChange={e => set('site_description', e.target.value)} /></div>
          <div className="space-y-2"><Label>Posts per page</Label><Input type="number" value={settings.posts_per_page || 10} onChange={e => set('posts_per_page', Number(e.target.value))} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Theme</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {['minimal', 'editorial', 'magazine'].map(theme => (
              <Button key={theme} variant={settings.theme === theme ? 'default' : 'outline'} onClick={() => set('theme', theme)} className="capitalize">
                {theme}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Comments</CardTitle></CardHeader>
        <CardContent>
          <Select value={settings.comment_moderation || 'manual'} onValueChange={v => set('comment_moderation', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual approval</SelectItem>
              <SelectItem value="auto">Auto-approve</SelectItem>
              <SelectItem value="ai">AI moderation</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  );
}
