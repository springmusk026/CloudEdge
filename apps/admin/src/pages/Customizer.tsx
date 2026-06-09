import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Loader2, RotateCcw, Monitor, Smartphone } from 'lucide-react';
import { api } from '@/lib/api';

export function Customizer() {
  const qc = useQueryClient();
  const { data: config, isLoading } = useQuery({ queryKey: ['customizer'], queryFn: () => api.admin.customizer() });
  const [form, setForm] = useState<any>(null);
  const [previewWidth, setPreviewWidth] = useState<'100%' | '375px'>('100%');

  useEffect(() => { if (config && !form) setForm(config); }, [config]);

  const saveMutation = useMutation({
    mutationFn: (data: any) => api.admin.updateCustomizer(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customizer'] }); },
  });

  if (isLoading || !form) return <div className="animate-pulse p-8">Loading customizer...</div>;

  const set = (path: string, value: any) => {
    setForm((prev: any) => {
      const clone = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let obj = clone;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return clone;
    });
  };

  // Generate preview CSS inline
  const previewCSS = generatePreviewCSS(form);

  return (
    <div className="flex h-[calc(100vh-48px)] -m-6">
      {/* Sidebar Controls */}
      <div className="w-80 border-r overflow-y-auto p-4 space-y-4 bg-card">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Customize</h2>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => setForm(config)} title="Reset"><RotateCcw size={14} /></Button>
            <Button size="sm" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Save size={14} className="mr-1" />} Save
            </Button>
          </div>
        </div>

        <Tabs defaultValue="colors">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="fonts">Fonts</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
          </TabsList>

          {/* Colors Tab */}
          <TabsContent value="colors" className="space-y-4 mt-4">
            <h3 className="text-sm font-semibold">Light Mode</h3>
            {Object.entries(form.colors || {}).map(([key, val]) => (
              <ColorField key={key} label={key} value={val as string} onChange={v => set(`colors.${key}`, v)} />
            ))}
            <Separator />
            <h3 className="text-sm font-semibold">Dark Mode</h3>
            {Object.entries(form.darkColors || {}).map(([key, val]) => (
              <ColorField key={key} label={key} value={val as string} onChange={v => set(`darkColors.${key}`, v)} />
            ))}
          </TabsContent>

          {/* Fonts Tab */}
          <TabsContent value="fonts" className="space-y-4 mt-4">
            <div className="space-y-2"><Label>Heading Font</Label><Input value={form.fonts?.heading || ''} onChange={e => set('fonts.heading', e.target.value)} /></div>
            <div className="space-y-2"><Label>Body Font</Label><Input value={form.fonts?.body || ''} onChange={e => set('fonts.body', e.target.value)} /></div>
            <div className="space-y-2"><Label>Mono Font</Label><Input value={form.fonts?.mono || ''} onChange={e => set('fonts.mono', e.target.value)} /></div>
            <Separator />
            <div className="space-y-2"><Label>Base Font Size</Label><Input value={form.fontSizes?.base || '16px'} onChange={e => set('fontSizes.base', e.target.value)} /></div>
            <div className="space-y-2"><Label>H1 Size</Label><Input value={form.fontSizes?.h1 || '3rem'} onChange={e => set('fontSizes.h1', e.target.value)} /></div>
            <div className="space-y-2"><Label>H2 Size</Label><Input value={form.fontSizes?.h2 || '2rem'} onChange={e => set('fontSizes.h2', e.target.value)} /></div>
            <div className="space-y-2"><Label>H3 Size</Label><Input value={form.fontSizes?.h3 || '1.5rem'} onChange={e => set('fontSizes.h3', e.target.value)} /></div>
            <Separator />
            <div className="space-y-2"><Label>Border Radius</Label><Input value={form.borderRadius || '0.5rem'} onChange={e => set('borderRadius', e.target.value)} /></div>
          </TabsContent>

          {/* Layout Tab */}
          <TabsContent value="layout" className="space-y-4 mt-4">
            <div className="space-y-2"><Label>Site Name</Label><Input value={form.logo?.text || ''} onChange={e => set('logo.text', e.target.value)} /></div>
            <div className="space-y-2"><Label>Logo Image URL</Label><Input value={form.logo?.imageUrl || ''} onChange={e => set('logo.imageUrl', e.target.value)} placeholder="https://..." /></div>
            <Separator />
            <div className="space-y-2"><Label>Content Max Width</Label><Input value={form.spacing?.contentWidth || '768px'} onChange={e => set('spacing.contentWidth', e.target.value)} /></div>
            <div className="space-y-2"><Label>Header Height</Label><Input value={form.spacing?.headerHeight || '64px'} onChange={e => set('spacing.headerHeight', e.target.value)} /></div>
            <Separator />
            <h3 className="text-sm font-semibold">Navigation</h3>
            {(form.navigation || []).map((item: any, i: number) => (
              <div key={i} className="flex gap-2">
                <Input value={item.label} onChange={e => { const nav = [...form.navigation]; nav[i] = { ...nav[i], label: e.target.value }; set('navigation', nav); }} placeholder="Label" className="flex-1" />
                <Input value={item.url} onChange={e => { const nav = [...form.navigation]; nav[i] = { ...nav[i], url: e.target.value }; set('navigation', nav); }} placeholder="/path" className="flex-1" />
                <Button variant="ghost" size="sm" onClick={() => { const nav = form.navigation.filter((_: any, j: number) => j !== i); set('navigation', nav); }}>×</Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => set('navigation', [...(form.navigation || []), { label: '', url: '' }])}>+ Add Link</Button>
          </TabsContent>

          {/* Code Injection Tab */}
          <TabsContent value="code" className="space-y-4 mt-4">
            <div className="space-y-2"><Label>Custom CSS</Label><Textarea value={form.customCSS || ''} onChange={e => set('customCSS', e.target.value)} className="font-mono text-xs h-32" placeholder=".my-class { ... }" /></div>
            <div className="space-y-2"><Label>Head Code Injection</Label><Textarea value={form.customHeadCode || ''} onChange={e => set('customHeadCode', e.target.value)} className="font-mono text-xs h-24" placeholder="<script>...</script>" /></div>
            <div className="space-y-2"><Label>Body Code Injection</Label><Textarea value={form.customBodyCode || ''} onChange={e => set('customBodyCode', e.target.value)} className="font-mono text-xs h-24" placeholder="<!-- Analytics etc -->" /></div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Live Preview */}
      <div className="flex-1 flex flex-col bg-muted/30">
        <div className="flex items-center justify-center gap-2 p-2 border-b bg-card">
          <Button variant={previewWidth === '100%' ? 'secondary' : 'ghost'} size="icon" onClick={() => setPreviewWidth('100%')}><Monitor size={14} /></Button>
          <Button variant={previewWidth === '375px' ? 'secondary' : 'ghost'} size="icon" onClick={() => setPreviewWidth('375px')}><Smartphone size={14} /></Button>
        </div>
        <div className="flex-1 flex items-start justify-center p-4 overflow-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300" style={{ width: previewWidth, height: '100%' }}>
            <style dangerouslySetInnerHTML={{ __html: previewCSS }} />
            <div className="preview-frame" style={{ fontFamily: form.fonts?.body, fontSize: form.fontSizes?.base, color: form.colors?.foreground, background: form.colors?.background }}>
              {/* Mock Header */}
              <header style={{ height: form.spacing?.headerHeight, borderBottom: `1px solid ${form.colors?.border}`, display: 'flex', alignItems: 'center', padding: '0 1.5rem', justifyContent: 'space-between' }}>
                <strong style={{ fontFamily: form.fonts?.heading }}>{form.logo?.text || 'CloudEdge'}</strong>
                <nav style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
                  {(form.navigation || []).slice(0, 4).map((n: any, i: number) => <span key={i} style={{ color: form.colors?.secondary }}>{n.label}</span>)}
                </nav>
              </header>
              {/* Mock Content */}
              <div style={{ maxWidth: form.spacing?.contentWidth, margin: '0 auto', padding: '2rem 1.5rem' }}>
                <h1 style={{ fontFamily: form.fonts?.heading, fontSize: form.fontSizes?.h1, fontWeight: 700, marginBottom: '0.5rem' }}>Sample Post Title</h1>
                <p style={{ color: form.colors?.secondary, fontSize: '0.875rem', marginBottom: '2rem' }}>By Alex Rivera · June 9, 2026 · 4 min read</p>
                <h2 style={{ fontFamily: form.fonts?.heading, fontSize: form.fontSizes?.h2, fontWeight: 600, marginBottom: '0.75rem' }}>Introduction</h2>
                <p style={{ lineHeight: 1.75, marginBottom: '1.25rem' }}>This is a preview of how your blog content will look with the current customization settings. Adjust colors, fonts, spacing, and layout on the left panel.</p>
                <p style={{ lineHeight: 1.75, marginBottom: '1.25rem' }}>The changes are applied in real-time. Click <strong>Save</strong> when you're happy with the result.</p>
                <blockquote style={{ borderLeft: `3px solid ${form.colors?.primary}`, paddingLeft: '1rem', fontStyle: 'italic', color: form.colors?.secondary, margin: '1.5rem 0' }}>
                  "Edge computing is the future of web development."
                </blockquote>
                <h3 style={{ fontFamily: form.fonts?.heading, fontSize: form.fontSizes?.h3, fontWeight: 600, marginBottom: '0.5rem' }}>Code Example</h3>
                <pre style={{ background: form.colors?.muted, padding: '1rem', borderRadius: form.borderRadius, fontFamily: form.fonts?.mono, fontSize: '0.85rem', overflow: 'auto' }}>
                  {`export default {\n  async fetch(request) {\n    return Response.json({ hello: "world" });\n  }\n};`}
                </pre>
                {/* Mock Card */}
                <div style={{ background: form.colors?.card, border: `1px solid ${form.colors?.border}`, borderRadius: form.borderRadius, padding: '1.5rem', marginTop: '2rem' }}>
                  <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Newsletter</h4>
                  <p style={{ color: form.colors?.secondary, fontSize: '0.875rem' }}>Get the latest posts delivered to your inbox.</p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <input disabled placeholder="you@example.com" style={{ flex: 1, padding: '0.5rem 0.75rem', border: `1px solid ${form.colors?.border}`, borderRadius: form.borderRadius, fontSize: '0.875rem' }} />
                    <button disabled style={{ padding: '0.5rem 1rem', background: form.colors?.primary, color: '#fff', borderRadius: form.borderRadius, fontSize: '0.875rem', border: 'none' }}>Subscribe</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-8 h-8 rounded border cursor-pointer" />
      <div className="flex-1">
        <Label className="text-xs capitalize">{label.replace(/([A-Z])/g, ' $1')}</Label>
        <Input value={value} onChange={e => onChange(e.target.value)} className="h-7 text-xs" />
      </div>
    </div>
  );
}

function generatePreviewCSS(config: any): string {
  return `
    .preview-frame * { transition: all 0.2s ease; }
    .preview-frame a { color: ${config.colors?.primary}; }
  `;
}
