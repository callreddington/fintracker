import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Receipt,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Target,
  Briefcase,
  Calculator,
  CreditCard,
  Bell,
  ChevronDown,
  ChevronRight,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth.store';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface NavigationGroup {
  name: string;
  items: NavigationItem[];
}

interface NavigationItem {
  name: string;
  path: string;
  icon: React.ElementType;
}

const navigationGroups: NavigationGroup[] = [
  {
    name: 'Overview',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Portfolio', path: '/portfolio', icon: Briefcase },
    ],
  },
  {
    name: 'Money Flow',
    items: [
      { name: 'Income', path: '/income', icon: TrendingUp },
      { name: 'Expenses', path: '/expenses', icon: TrendingDown },
      { name: 'Accounts', path: '/accounts', icon: Wallet },
      { name: 'Transactions', path: '/transactions', icon: Receipt },
    ],
  },
  {
    name: 'Planning',
    items: [
      { name: 'Budgets', path: '/budgets', icon: PiggyBank },
      { name: 'Goals', path: '/goals', icon: Target },
      { name: 'Bill Reminders', path: '/bills', icon: Bell },
    ],
  },
  {
    name: 'Tools',
    items: [
      { name: 'PAYE Calculator', path: '/calculator', icon: Calculator },
      { name: 'M-Pesa Parser', path: '/mpesa', icon: CreditCard },
    ],
  },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('fintracker-sidebar-expanded');
    return saved ? new Set(JSON.parse(saved)) : new Set(['Overview', 'Money Flow']);
  });

  // Save expanded state to localStorage
  useEffect(() => {
    localStorage.setItem('fintracker-sidebar-expanded', JSON.stringify(Array.from(expandedGroups)));
  }, [expandedGroups]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupName)) {
        next.delete(groupName);
      } else {
        next.add(groupName);
      }
      return next;
    });
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const getUserInitials = () => {
    if (!user?.full_name) return 'U';
    return user.full_name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside className="flex w-64 flex-col border-r bg-card">
      {/* Logo & User */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        <h1 className="text-xl font-bold text-primary">FinTracker</h1>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.full_name || 'User'}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <NavLink to="/settings" className="cursor-pointer">
                Settings
              </NavLink>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto p-2">
        {navigationGroups.map((group) => {
          const isExpanded = expandedGroups.has(group.name);

          return (
            <div key={group.name} className="mb-2">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(group.name)}
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <span>{group.name}</span>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>

              {/* Group Items */}
              {isExpanded && (
                <div className="mt-1 space-y-1">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
