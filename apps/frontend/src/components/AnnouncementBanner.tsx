import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { X, Megaphone } from 'lucide-react';

export function AnnouncementBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { data } = useQuery({
    queryKey: ['banner'],
    queryFn: async () => { const r = await fetch('/api/v1/admin/banner'); return r.json() as Promise<{ enabled: boolean; text: string; url?: string; style?: string }>; },
    staleTime: 300_000,
  });

  if (!data?.enabled || dismissed) return null;

  const styles: Record<string, string> = {
    info: 'bg-primary text-primary-foreground',
    warning: 'bg-amber-500 text-white',
    success: 'bg-green-600 text-white',
  };

  return (
    <div className={`relative py-2.5 px-4 text-center text-sm font-medium ${styles[data.style || 'info'] || styles.info}`}>
      <Megaphone size={14} className="inline mr-2" />
      {data.url ? <a href={data.url} className="underline underline-offset-2">{data.text}</a> : data.text}
      <button onClick={() => setDismissed(true)} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100" aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  );
}
