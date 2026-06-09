import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Users, MessageCircle, Eye } from 'lucide-react';
import { useDashboard } from '@/lib/queries';

export function Dashboard() {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <div className="grid grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>;

  const stats = [
    { label: 'Posts', value: data?.posts ?? 0, icon: FileText, color: 'text-blue-600' },
    { label: 'Subscribers', value: data?.subscribers ?? 0, icon: Users, color: 'text-green-600' },
    { label: 'Pending Comments', value: data?.pendingComments ?? 0, icon: MessageCircle, color: 'text-amber-600' },
    { label: 'Views Today', value: data?.recentAnalytics?.[0]?.totalViews ?? 0, icon: Eye, color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon size={18} className={color} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{value.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Recent Analytics</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data?.recentAnalytics?.map(day => (
              <div key={day.date} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{day.date}</span>
                <span className="font-medium">{day.totalViews} views / {day.uniqueVisitors} unique</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
