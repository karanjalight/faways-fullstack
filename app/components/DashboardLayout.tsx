// Dashboard layout wrapper with sidebar
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import Sidebar from './Sidebar';
import UniversalSearch from './UniversalSearch';
import NotificationBell from './NotificationBell';
import {
  ChevronDown,
  Globe2,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
} from 'lucide-react';
import { supabase } from '@/lib/supabase-client';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface UserState {
  id: string;
  name: string;
  email: string;
  role: string;
}

type ProfileRole = 'admin' | 'agent' | 'client' | 'finance';

const normalizeProfileRole = (role: unknown): ProfileRole => {
  const normalized = typeof role === 'string' ? role.toLowerCase() : '';
  if (
    normalized === 'admin' ||
    normalized === 'agent' ||
    normalized === 'client' ||
    normalized === 'finance'
  ) {
    return normalized;
  }
  return 'client';
};

const getUserState = (authUser: SupabaseUser): UserState => ({
  id: authUser.id,
  name:
    (authUser.user_metadata?.full_name as string) ||
    authUser.email?.split('@')[0] ||
    'User',
  email: authUser.email || '',
  role: (authUser.user_metadata?.role as string) || 'Client',
});

const ensureProfile = async (authUser: SupabaseUser) => {
  const userState = getUserState(authUser);
  const { error } = await supabase.from('profiles').upsert(
    {
      id: authUser.id,
      full_name: userState.name,
      role: normalizeProfileRole(userState.role),
    },
    { onConflict: 'id' },
  );

  if (error) {
    console.error('Error ensuring dashboard profile', error);
  }
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState<UserState | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    async function loadUser() {
      setLoadingUser(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // If there is no active session, take the user back to login
        router.push('/login');
        return;
      }

      await ensureProfile(user);
      setUser(getUserState(user));
      setLoadingUser(false);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
        router.push('/login');
        return;
      }
      const authUser = session.user;
      void ensureProfile(authUser);
      setUser(getUserState(authUser));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
  }

  const userInitials =
    user?.name
      ?.split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'U';

  return (
    <div className="flex h-screen font-sans overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        role={user?.role}
      />

      <div className="flex flex-1 flex-col overflow-hidden lg:pl-64">
        <div className="sticky top-0 z-30 flex  py-4 items-center justify-between border-b border-slate-500 bg-white/70 px-4 backdrop-blur lg:px-10">
          {/* Left: mobile menu + role selector */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 lg:hidden">
              <button
                onClick={() => setSidebarOpen(true)}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-500 p-2 text-slate-600 hover:bg-slate-100"
              >
                <Menu className="h-5 w-5" strokeWidth={1.8} />
              </button>
            </div>
            <div className="flex flex-row items-center gap-2  text-xs text-slate-800">
              <span className="uppercase tracking-wide">User Role</span>
              <div className=" flex flex-row items-center gap-1 rounded-full border border-slate-500 bg-white px-3 py-1 text-md py-2 font-semibold text-slate-800 ">
                <span>{user?.role ?? 'Admin'}</span>
                <ChevronDown className="h-3 w-3 text-slate-800" strokeWidth={1.8} />
              </div>
            </div>
          </div>

          {/* Center: search */}
          <div className="hidden flex-1 items-center px-6 lg:flex">
            <UniversalSearch role={user?.role} />
          </div>

          {/* Right: language, currency, theme, icons, user */}
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="hidden items-center gap-1 rounded-full border border-slate-500 bg-white px-3 py-2 text-sm text-slate-600 lg:flex">
              <Globe2 className="h-3.5 w-3.5 text-slate-800" strokeWidth={1.8} />
              <span>English</span>
              <ChevronDown className="h-3 w-3 text-slate-800" strokeWidth={1.8} />
            </div>

            <div className="hidden items-center gap-1 rounded-full border border-slate-500 bg-white px-3 py-2 text-sm text-slate-600 lg:flex">
              <span>KES</span>
              <ChevronDown className="h-3 w-3 text-slate-800" strokeWidth={1.8} />
            </div>

            <NotificationBell userId={user?.id} />

            {/* User */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-full border border-slate-500 bg-white pl-1 pr-3 py-1 text-left  hover:bg-slate-50"
                disabled={loadingUser}
              >
                <span className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-blue-200 text-xs font-semibold text-slate-700">
                  {loadingUser ? '…' : userInitials}
                </span>
                <div className="hidden flex-col text-xs leading-tight text-slate-700 sm:flex">
                  <span className="font-semibold">{user?.name ?? 'Loading user...'}</span>
                  {/* <span className="text-[11px] text-slate-800">{user?.email ?? ''}</span> */}
                </div>
                <ChevronDown className="h-3 w-3 text-slate-800" strokeWidth={1.8} />
              </button>

              {userMenuOpen && !loadingUser && user && (
                <div className="absolute right-0 z-40 mt-2 w-52 rounded-2xl border border-slate-100 bg-white p-2 text-sm shadow-lg">
                  <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-2 py-2">
                    <span className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                      {userInitials}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-900">{user.name}</span>
                      <span className="text-[11px] text-slate-800">{user.email}</span>
                    </div>
                  </div>
                  <div className="mt-1 space-y-1">
                    <button
                      className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                      onClick={() => {
                        setUserMenuOpen(false);
                        if (pathname !== '/dashboard') router.push('/dashboard');
                      }}
                    >
                      <LayoutDashboard className="h-4 w-4 text-slate-800" strokeWidth={1.8} />
                      <span>Dashboard</span>
                    </button>
                    <button
                      className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                      onClick={() => {
                        setUserMenuOpen(false);
                        router.push('/dashboard/settings');
                      }}
                    >
                      <Settings className="h-4 w-4 text-slate-800" strokeWidth={1.8} />
                      <span>Settings</span>
                    </button>
                    <button
                      className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-50"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 text-rose-500" strokeWidth={1.8} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-4 lg:py-4">{children}</main>
      </div>
    </div>
  );
}

