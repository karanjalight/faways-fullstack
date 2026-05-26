'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import {
  fetchNotifications,
  mapNotificationRow,
  markAllNotificationsRead,
  markNotificationRead,
} from '../lib/notifications';
import type { AppNotification } from '../lib/notifications';

interface NotificationBellProps {
  userId?: string;
}

type RealtimeNotificationRow = {
  id: string;
  type: string;
  payload: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
};

const formatRelativeTime = (value: string) => {
  const createdAt = new Date(value).getTime();
  const diffMs = Date.now() - createdAt;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (Number.isNaN(createdAt)) return '';
  if (diffMs < minute) return 'Just now';
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}m ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`;
  return `${Math.floor(diffMs / day)}d ago`;
};

export default function NotificationBell({ userId }: NotificationBellProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    fetchNotifications(userId)
      .then((items) => {
        if (isMounted) setNotifications(items);
      })
      .catch(() => {
        if (isMounted) setNotifications([]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const next = mapNotificationRow(payload.new as RealtimeNotificationRow);
          setNotifications((prev) => [
            next,
            ...prev.filter((notification) => notification.id !== next.id),
          ].slice(0, 25));
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  );

  const handleNotificationClick = async (notification: AppNotification) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === notification.id ? { ...item, isRead: true } : item,
      ),
    );
    setIsOpen(false);

    if (!notification.isRead) {
      markNotificationRead(notification.id).catch(() => undefined);
    }
    if (notification.debtId) {
      router.push(`/debts/${notification.debtId}`);
    }
  };

  const handleMarkAllRead = async () => {
    if (!userId || unreadCount === 0) return;
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    await markAllNotificationsRead(userId).catch(() => undefined);
  };

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-500 bg-white text-slate-600 transition hover:bg-slate-50"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
      >
        <Bell className="h-5 w-5" strokeWidth={1.8} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-11 z-50 w-[calc(100vw-2rem)] overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/70 sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Notifications</p>
              <p className="text-xs text-slate-500">
                {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount === 1 ? '' : 's'}` : 'All caught up'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent"
            >
              <CheckCheck className="h-3.5 w-3.5" strokeWidth={1.8} />
              Mark read
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto p-2">
            {isLoading ? (
              <p className="px-3 py-6 text-center text-sm text-slate-500">
                Loading notifications...
              </p>
            ) : notifications.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-slate-500">
                No notifications yet.
              </p>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className="flex w-full gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-slate-50"
                >
                  <span
                    className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                      notification.isRead ? 'bg-slate-200' : 'bg-rose-500'
                    }`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-900">
                      {notification.title}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-slate-600">
                      {notification.body}
                    </span>
                    <span className="mt-2 block text-[11px] font-medium text-slate-400">
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
