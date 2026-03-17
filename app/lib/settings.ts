'use client';

import { supabase } from '@/lib/supabase-client';

export interface ProfileSettings {
  fullName: string;
  avatarUrl: string | null;
}

export interface LoginActivity {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

// Load the current authenticated user's basic profile from auth + public.profiles
export async function loadProfileSettings(): Promise<ProfileSettings | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('Error loading auth user', userError);
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('Error loading profile', profileError);
    // Fallback to auth metadata only
    return {
      fullName:
        (user.user_metadata?.full_name as string) ||
        user.email?.split('@')[0] ||
        'User',
      avatarUrl: null,
    };
  }

  return {
    fullName:
      profile?.full_name ||
      (user.user_metadata?.full_name as string) ||
      user.email?.split('@')[0] ||
      'User',
    avatarUrl: null,
  };
}

export async function updateProfileSettings(input: ProfileSettings) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        full_name: input.fullName,
        // Ensure NOT NULL role column is always set
        role:
          ((user.user_metadata?.role as string) || 'client') as
            | 'admin'
            | 'agent'
            | 'client'
            | 'finance',
      },
      { onConflict: 'id' },
    );

  if (error) {
    console.error('Error updating profile', error);
    throw error;
  }

  // keep auth metadata in sync for DashboardLayout
  await supabase.auth.updateUser({
    data: { full_name: input.fullName },
  });
}

export async function changePassword(currentPassword: string, newPassword: string) {
  // Supabase does not accept current password in this client call,
  // but we keep the argument for potential API-based verification later.
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    console.error('Error changing password', error);
    throw error;
  }
}

// This assumes you log sign-in events into public.audit_logs or a dedicated table.
// For now we read from audit_logs where table_name = 'auth' as a simple approximation.
export async function loadLoginActivity(): Promise<LoginActivity[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('audit_logs')
    .select('id, ip_address, user_agent, created_at')
    .eq('actor_id', user.id)
    .eq('table_name', 'auth')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error loading login activity', error);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    ipAddress: row.ip_address ?? null,
    userAgent: row.user_agent ?? null,
    createdAt: row.created_at,
  }));
}

