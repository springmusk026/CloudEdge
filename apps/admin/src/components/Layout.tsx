import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LayoutDashboard, FileText, Image, MessageCircle, Mail, Tag, Users, BarChart3, Settings, LogOut, Palette } from 'lucide-react';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/posts', label: 'Posts', icon: FileText },
  { to: '/media', label: 'Media', icon: Image },
  { to: '/comments', label: 'Comments', icon: MessageCircle },
  { to: '/newsletter', label: 'Newsletter', icon: Mail },
  { to: '/tags', label: 'Tags', icon: Tag },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/customizer', label: 'Customize', icon: Palette },
];

export function Layout() {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen">
      <aside className="w-60 border-r bg-card flex flex-col">
        <div className="p-4">
          <h1 className="text-lg font-bold">CloudEdge</h1>
          <p className="text-xs text-muted-foreground">{user?.name}</p>
        </div>
        <Separator />
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${location.pathname === to ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}>
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
        <Separator />
        <div className="p-3">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={logout}>
            <LogOut size={14} /> Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
