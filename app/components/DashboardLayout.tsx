// Dashboard layout wrapper with sidebar
'use client';

import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { Button } from '@/components/ui/button';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden lg:pl-64">
        <div className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-100 bg-white/70 px-4 backdrop-blur lg:px-10">
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-2xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Faways Client Hub</p>
              <p className="text-base font-semibold text-slate-900">Care Collections</p>
            </div>
          </div>
          <div className="hidden lg:flex flex-1 items-center gap-3 text-sm text-slate-500">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-700">
              Hospitals & Doctors
            </span>
            <span className="text-slate-400">•</span>
            <span>Managed Collections Suite</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="rounded-2xl px-4">
              Support
            </Button>
            <Button variant="subtle" className="hidden rounded-2xl px-4 text-blue-700 lg:inline-flex">
              Export Snapshot
            </Button>
            <Button className="rounded-2xl px-4">New Case</Button>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}

