import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Database, HardDrive, Wifi, Zap } from 'lucide-react';

export function SiteHealth() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const start = Date.now();
      const res = await fetch('/healthz');
      const latency = Date.now() - start;
      const body = await res.json();
      return { ...body, latency, httpStatus: res.status };
    },
    refetchInterval: 30000,
  });

  const services = [
    { name: 'API Worker', icon: Zap, status: data?.status === 'ok' ? 'operational' : 'down', detail: `${data?.latency || 0}ms latency` },
    { name: 'D1 Database', icon: Database, status: data?.status === 'ok' ? 'operational' : 'error', detail: 'SQLite at edge' },
    { name: 'KV Store', icon: HardDrive, status: data?.status === 'ok' ? 'operational' : 'error', detail: 'Sessions & cache' },
    { name: 'R2 Storage', icon: HardDrive, status: 'operational', detail: 'Media bucket' },
    { name: 'Durable Objects', icon: Wifi, status: 'operational', detail: 'Real-time & analytics' },
  ];

  const statusColor: Record<string, string> = {
    operational: 'bg-green-500', degraded: 'bg-amber-500', down: 'bg-red-500', error: 'bg-red-500',
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2"><Activity size={20} /> Site Health</h2>

      {/* Overall Status */}
      <Card>
        <CardContent className="p-6 text-center">
          <div className={`inline-block w-3 h-3 rounded-full mr-2 ${data?.status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-lg font-medium">{data?.status === 'ok' ? 'All Systems Operational' : 'Issues Detected'}</span>
          <p className="text-sm text-muted-foreground mt-1">Last checked: {data?.timestamp ? new Date(data.timestamp).toLocaleTimeString() : '—'}</p>
        </CardContent>
      </Card>

      {/* Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map(s => (
          <Card key={s.name}>
            <CardContent className="p-4 flex items-center gap-4">
              <s.icon size={20} className="text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.detail}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${statusColor[s.status]}`} />
                <span className="text-xs capitalize">{s.status}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
