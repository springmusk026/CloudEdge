import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Upload, Loader2 } from 'lucide-react';
import { useMedia } from '@/lib/queries';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

export function MediaLibrary() {
  const { data, isLoading } = useMedia();
  const [uploading, setUploading] = useState(false);
  const qc = useQueryClient();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { r2Key, uploadUrl } = await api.media.getUploadUrl({ filename: file.name, contentType: file.type, fileSize: file.size });
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      await api.media.confirm({ r2Key, filename: file.name, contentType: file.type, fileSize: file.size });
      qc.invalidateQueries({ queryKey: ['media'] });
    } finally { setUploading(false); }
  }

  if (isLoading) return <div className="grid grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Media Library</h2>
        <Button disabled={uploading} onClick={() => document.getElementById('file-upload')?.click()}>
          {uploading ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Upload size={14} className="mr-2" />} Upload
        </Button>
        <input id="file-upload" type="file" className="hidden" onChange={handleUpload} accept="image/*,video/*,.pdf" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {(data || []).map(item => (
          <Card key={item.id} className="overflow-hidden">
            <CardContent className="p-0">
              {item.mimeType.startsWith('image/') ? (
                <img src={item.r2Key} alt={item.altText || item.originalFilename} className="w-full aspect-square object-cover" loading="lazy" />
              ) : (
                <div className="w-full aspect-square flex items-center justify-center bg-muted text-2xl">📄</div>
              )}
              <div className="p-2">
                <p className="text-xs truncate">{item.originalFilename}</p>
                <p className="text-xs text-muted-foreground">{(item.fileSizeBytes / 1024).toFixed(0)} KB</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
