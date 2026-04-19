import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  LayoutDashboard, 
  Upload, 
  Target, 
  Shield,
  User,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Activity,
  WifiOff
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getApiStatus } from '@/services/api';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Scope 3 Intake', href: '/scope3-intake', icon: Upload },
  { name: 'Hotspot Analysis', href: '/hotspots', icon: Target },
  { name: 'Audit & Trust', href: '/audit', icon: Shield },
  // Removed: Route Optimization (not essential for Scope 3 compliance)
  // ML Insights and Live APIs consolidated into Dashboard
];

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const { data: apiHealth } = useQuery({
    queryKey: ['apiHealth'],
    queryFn: getApiStatus,
    refetchInterval: 15000,
  });

  const currentPage = navigation.find(n => n.href === location.pathname)?.name || 'Dashboard';
  const apiConnected = !!apiHealth?.message;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside 
        className={cn(
          "flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-4 border-b border-sidebar-border">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-green-600/20">
            <img src="/logo.jpg" alt="Scope Zero Logo" className="h-full w-full object-cover" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold">Scope Zero</span>
              <span className="text-xs text-sidebar-foreground/70">Carbon Accounting</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse button */}
        <div className="p-2 border-t border-sidebar-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full justify-center text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-card px-6">
          <h1 className="text-xl font-semibold text-foreground">{currentPage}</h1>
          <div className="flex items-center gap-4">
            <Badge variant={apiConnected ? 'default' : 'destructive'} className="gap-2 px-3 py-1">
              {apiConnected ? <Activity className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              {apiConnected ? 'API Connected' : 'API Offline'}
            </Badge>
            <div className="flex items-center gap-2 mr-4">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold border border-green-200">
                {user?.name?.charAt(0) || <User className="h-4 w-4" />}
              </div>
              <span className="text-sm font-medium mr-2 hidden md:block">{user?.name}</span>
              <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-red-500">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
