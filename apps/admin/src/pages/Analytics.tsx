import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboard } from '@/lib/queries';

export function Analytics() {
  const { data } = useDashboard();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Analytics</h2>
      <Card>
        <CardHeader><CardTitle className="text-base">Daily Views (Last 7 Days)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {data?.recentAnalytics?.map(day => (
            <div key={day.date} className="flex items-center gap-4">
              <span className="text-sm w-24 text-muted-foreground">{day.date}</span>
              <div className="flex-1 bg-muted rounded-full h-5 overflow-hidden">
                <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${Math.min(100, (day.totalViews / 700) * 100)}%` }} />
              </div>
              <span className="text-sm font-medium w-16 text-right">{day.totalViews}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
