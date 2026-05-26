'use client';

import { supabase } from '@/lib/supabase-client';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  debtId?: string;
  clientId?: string;
}

type NotificationPayload = Record<string, unknown>;

type NotificationRow = {
  id: string;
  type: string;
  payload: NotificationPayload | null;
  is_read: boolean;
  created_at: string;
};

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value : undefined;

export const mapNotificationRow = (row: NotificationRow): AppNotification => {
  const payload = row.payload ?? {};

  return {
    id: row.id,
    type: row.type,
    title: asString(payload.title) ?? 'New notification',
    body: asString(payload.body) ?? 'There is a new update in your account.',
    isRead: row.is_read,
    createdAt: row.created_at,
    debtId: asString(payload.debtId),
    clientId: asString(payload.clientId),
  };
};

export async function fetchNotifications(userId: string): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, payload, is_read, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(25);

  if (error) {
    console.error('Error fetching notifications', error);
    throw error;
  }

  return ((data ?? []) as NotificationRow[]).map(mapNotificationRow);
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);

  if (error) {
    console.error('Error marking notification read', error);
    throw error;
  }
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error marking all notifications read', error);
    throw error;
  }
}
