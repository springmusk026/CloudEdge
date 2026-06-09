import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { useTags, useCreateTag, useDeleteTag } from '@/lib/queries';

export function Tags() {
  const { data, isLoading } = useTags();
  const createTag = useCreateTag();
  const deleteTag = useDeleteTag();
  const [name, setName] = useState('');

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Tags</h2>
      <div className="flex gap-2">
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="New tag..." className="max-w-xs" />
        <Button onClick={() => { if (name) { createTag.mutate(name); setName(''); } }}><Plus size={14} className="mr-1" /> Add</Button>
      </div>
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {(data || []).map(tag => (
              <Badge key={tag.id} variant="secondary" className="flex items-center gap-1 text-sm py-1 px-3">
                {tag.name} <span className="text-muted-foreground">({tag.postCount ?? 0})</span>
                <button onClick={() => deleteTag.mutate(tag.id)} className="ml-1 hover:text-destructive"><X size={12} /></button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
