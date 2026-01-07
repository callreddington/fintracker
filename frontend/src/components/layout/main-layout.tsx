import { Outlet } from 'react-router-dom';
import Sidebar from './sidebar';
import MobileNav from './mobile-nav';

export default function MainLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-background pb-16 md:pb-0">
        <div className="container mx-auto p-4 md:p-6">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
}
