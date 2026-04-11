import { Outlet, Link, useLocation } from 'react-router-dom';
import { Leaf, LayoutDashboard, QrCode, User, Activity, Gift, UserCircle } from 'lucide-react';
import clsx from 'clsx';

const allNavItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Admin Dashboard', role: 'admin' },
  { path: '/stp-health', icon: Activity, label: 'STP Dashboard', role: 'admin' },
  { path: '/collector', icon: QrCode, label: 'Collector Dashboard', role: 'collector' },
  { path: '/collector/portfolio', icon: UserCircle, label: 'My Portfolio', role: 'collector' },
  { path: '/citizen', icon: User, label: 'Citizen Dashboard', role: 'citizen' },
  { path: '/citizen/portfolio', icon: UserCircle, label: 'My Portfolio', role: 'citizen' },
  { path: '/rewards', icon: Gift, label: 'Rewards', role: 'citizen' },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative">
      {/* Sidebar background elements (circles for glow) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-sustainability-700/30 blur-[120px] pointer-events-none" />

      {/* Navigation */}
      <nav className="glass-panel m-4 md:my-6 md:ml-6 md:w-64 p-4 flex flex-row md:flex-col justify-between md:justify-start gap-4 z-10 shrink-0 sticky top-4 md:h-[calc(100vh-3rem)] overflow-y-auto">
        <div className="hidden md:flex items-center gap-3 px-2 mb-8">
          <div className="p-2 bg-emerald-500/20 rounded-xl">
            <Leaf className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight">Waste2Wallet</h1>
            <p className="text-xs text-emerald-200/60">System Dashboard</p>
          </div>
        </div>

        <div className="flex md:flex-col gap-2 w-full">
          {allNavItems.filter((item) => {
            const isCitizen = location.pathname.includes('/citizen') || location.pathname.includes('/rewards');
            const isCollector = location.pathname.includes('/collector');
            const isAdmin = location.pathname.includes('/admin') || location.pathname.includes('/stp-health');
            
            if (isCitizen) return item.role === 'citizen';
            if (isCollector) return item.role === 'collector';
            if (isAdmin) return item.role === 'admin';
            return true;
          }).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
                  isActive 
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                )}
              >
                <Icon className={clsx("w-5 h-5", isActive ? "text-emerald-400" : "text-slate-400")} />
                <span className="hidden md:block font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
        
        <div className="hidden md:mt-auto md:block">
          <div className="glass-panel p-4 text-sm mt-4 text-center">
            <p className="text-emerald-100/70 mb-2">Network Status</p>
            <div className="flex items-center justify-center gap-2 text-emerald-400 font-medium tracking-wide">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              Connected
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-6 z-10 w-full overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
