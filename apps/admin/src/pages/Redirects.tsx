import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';

export function Redirects() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['redirects'], queryFn: () => api.admin.redirects() });
  const [form, setForm] = useState({ sourcePath: '', destinationUrl: '', statusCode: 301 });

  const createMutation = useMutation({
    mutationFn: () => api.admin.createRedirect(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['redirects'] }); setForm({ sourcePath: '', destinationUrl: '', statusCode: 301 }); },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Redirects</h2>

      <Card>
        <CardHeader><CardTitle className="text-base">Add Redirect</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-xs text-muted-foreground">From</label>
              <Input value={form.sourcePath} onChange={e => setForm(f => ({ ...f, sourcePath: e.target.value }))} placeholder="/old-path" />
            </div>
            <ArrowRight size={16} className="mb-2.5 text-muted-foreground" />
            <div className="flex-1 space-y-1">
              <label className="text-xs text-muted-foreground">To</label>
              <Input value={form.destinationUrl} onChange={e => setForm(f => ({ ...f, destinationUrl: e.target.value }))} placeholder="/new-path or https://..." />
            </div>
            <select value={form.statusCode} onChange={e => setForm(f => ({ ...f, statusCode: Number(e.target.value) }))} className="h-9 rounded-md border px-2 text-sm">
              <option value={301}>301</option>
              <option value={302}>302</option>
            </select>
            <Button onClick={() => createMutation.mutate()} disabled={!form.sourcePath || !form.destinationUrl}><Plus size={14} className="mr-1" /> Add</Button>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Code</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data || []).map((r: any) => (
              <TableRow key={r.sourcePath}>
                <TableCell className="font-mono text-sm">{r.sourcePath}</TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">{r.destinationUrl}</TableCell>
                <TableCell><Badge variant="outline">{r.statusCode}</Badge></TableCell>
              </TableRow>
            ))}
            {(!data || data.length === 0) && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No redirects configured.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
