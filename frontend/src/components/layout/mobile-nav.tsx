import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, TrendingUp, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const mainItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Income', path: '/income', icon: TrendingUp },
  { name: 'Transactions', path: '/transactions', icon: Receipt },
];

const moreItems = [
  { name: 'Expenses', path: '/expenses' },
  { name: 'Accounts', path: '/accounts' },
  { name: 'Budgets', path: '/budgets' },
  { name: 'Goals', path: '/goals' },
  { name: 'Portfolio', path: '/portfolio' },
  { name: 'PAYE Calculator', path: '/calculator' },
  { name: 'M-Pesa Parser', path: '/mpesa' },
  { name: 'Settings', path: '/settings' },
];

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card md:hidden">
      <div className="flex items-center justify-around">
        {mainItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-4 py-2 text-xs transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.name}</span>
          </NavLink>
        ))}

        {/* More Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" className="flex h-auto flex-col items-center gap-1 px-4 py-2">
              <Menu className="h-5 w-5" />
              <span className="text-xs">More</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader>
              <SheetTitle>More Options</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-2">
              {moreItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center rounded-md px-4 py-3 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )
                  }
                >
                  {item.name}
                </NavLink>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
