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

export interface PlatformActivityLog {
  id: string;
  actorId: string | null;
  actorName: string;
  action: string;
  tableName: string;
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

export async function loadPlatformActivityLogs(): Promise<PlatformActivityLog[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('id, actor_id, action, table_name, ip_address, user_agent, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  let rows = (data ?? []) as Array<{
    id: string;
    actor_id: string | null;
    action: string | null;
    table_name: string | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
  }>;

  if (error || rows.length === 0) {
    if (error) {
      console.error('Error loading platform activity logs from audit_logs', error);
    }
    // Fallback to generic events table when audit logs are unavailable/empty.
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, user_id, action, entity_type, ip_address, user_agent, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (eventsError) {
      console.error('Error loading platform activity logs from events', eventsError);
      return [];
    }

    rows = ((events ?? []) as Array<{
      id: string;
      user_id: string | null;
      action: string | null;
      entity_type: string | null;
      ip_address: string | null;
      user_agent: string | null;
      created_at: string;
    }>).map((entry) => ({
      id: entry.id,
      actor_id: entry.user_id,
      action: entry.action,
      table_name: entry.entity_type,
      ip_address: entry.ip_address,
      user_agent: entry.user_agent,
      created_at: entry.created_at,
    }));
  }

  const actorIds = Array.from(
    new Set(rows.map((row) => row.actor_id).filter(Boolean)),
  ) as string[];

  let namesById: Record<string, string> = {};
  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', actorIds);

    namesById = Object.fromEntries(
      ((profiles ?? []) as Array<{ id: string; full_name: string | null }>).map((profile) => [
        profile.id,
        profile.full_name || 'Unknown user',
      ]),
    );
  }

  return rows.map((row) => ({
    id: row.id,
    actorId: row.actor_id,
    actorName: row.actor_id ? namesById[row.actor_id] || 'Unknown user' : 'System',
    action: row.action || 'unknown_action',
    tableName: row.table_name || 'unknown',
    ipAddress: row.ip_address ?? null,
    userAgent: row.user_agent ?? null,
    createdAt: row.created_at,
  }));
}

