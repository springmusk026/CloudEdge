import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSubscribers, useCampaigns } from '@/lib/queries';

export function Newsletter() {
  const { data: subs } = useSubscribers();
  const { data: campaigns } = useCampaigns();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Newsletter</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Subscribers ({subs?.total ?? 0})</CardTitle></CardHeader>
          <CardContent className="space-y-2 max-h-64 overflow-y-auto">
            {subs?.subscribers.map(sub => (
              <div key={sub.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div><p className="text-sm font-medium">{sub.name || sub.email}</p><p className="text-xs text-muted-foreground">{sub.email}</p></div>
                <span className="text-xs text-muted-foreground">{sub.cfGeoCountry || '—'}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Campaigns</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(campaigns || []).map(c => (
              <div key={c.id} className="p-3 border rounded-lg">
                <p className="text-sm font-medium">{c.subject}</p>
                <p className="text-xs text-muted-foreground mt-1">{c.status} · {c.recipientCount} recipients · {c.openCount} opens</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
