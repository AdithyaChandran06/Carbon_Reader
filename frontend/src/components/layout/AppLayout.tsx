import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Upload, 
  Calculator, 
  Target, 
  Shield,
  Bell,
  User,
  ChevronLeft,
  ChevronRight,
  Leaf
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Data Ingestion', href: '/data-ingestion', icon: Upload },
  { name: 'Carbon Calculation', href: '/calculation', icon: Calculator },
  { name: 'Hotspot Analysis', href: '/hotspots', icon: Target },
  { name: 'Audit & Trust', href: '/audit', icon: Shield },
];

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const currentPage = navigation.find(n => n.href === location.pathname)?.name || 'Dashboard';

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
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-600">
            <Leaf className="h-5 w-5 text-white" />
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
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full bg-muted">
              <User className="h-5 w-5" />
            </Button>
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
