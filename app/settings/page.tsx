// Settings page
'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { supabase } from '@/lib/supabase-client';
import {
  loadProfileSettings,
  updateProfileSettings,
  changePassword,
  loadLoginActivity,
  type ProfileSettings,
  type LoginActivity,
} from '../lib/settings';

type TabKey = 'profile' | 'security' | 'activity';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [email, setEmail] = useState('');
  const [profile, setProfile] = useState<ProfileSettings | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loginActivity, setLoginActivity] = useState<LoginActivity[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setProfileLoading(true);
      setFeedback(null);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setEmail(user?.email || '');
      const settings = await loadProfileSettings();
      setProfile(settings);
      setProfileLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (activeTab !== 'activity') return;
    setActivityLoading(true);
    loadLoginActivity()
      .then(setLoginActivity)
      .finally(() => setActivityLoading(false));
  }, [activeTab]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      setProfileSaving(true);
      setFeedback(null);
      await updateProfileSettings(profile);
      setFeedback('Profile updated successfully.');
    } catch (_err) {
      setFeedback('Failed to update profile. Please try again.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!newPassword || newPassword.length < 8) {
      setFeedback('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setFeedback('New password and confirmation do not match.');
      return;
    }
    try {
      setPasswordSaving(true);
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setFeedback('Password updated successfully.');
    } catch (_err) {
      setFeedback('Failed to change password. Please try again.');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="bg-gray-50">
        {/* Page Header */}
        <div className="border-b border-gray-200 bg-white px-6 py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your account and preferences
            </p>
          </div>
        </div>

        <div className="px-6 py-8">
          <div className="mx-auto max-w-5xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 text-xs font-medium text-slate-600">
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className={`rounded-full px-3 py-1.5 ${
                    activeTab === 'profile'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Profile
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('security')}
                  className={`rounded-full px-3 py-1.5 ${
                    activeTab === 'security'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Security
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('activity')}
                  className={`rounded-full px-3 py-1.5 ${
                    activeTab === 'activity'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Last logins
                </button>
              </div>
              {feedback && (
                <p className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">
                  {feedback}
                </p>
              )}
            </div>

            {activeTab === 'profile' && (
              <div className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
                <form onSubmit={handleProfileSave} className="space-y-5">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Profile
                  </h2>
                  <p className="text-sm text-slate-600">
                    Update the details that appear across your dashboards and reports.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-800">
                        Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        disabled
                        className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-800">
                        Full name
                      </label>
                      <input
                        type="text"
                        value={profile?.fullName || ''}
                        onChange={(e) =>
                          setProfile((prev) =>
                            prev ? { ...prev, fullName: e.target.value } : prev,
                          )
                        }
                        disabled={profileLoading}
                        className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row-reverse">
                    <button
                      type="submit"
                      disabled={profileLoading || profileSaving}
                      className="inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
                    >
                      {profileSaving ? 'Saving...' : 'Save profile'}
                    </button>
                    <span className="inline-flex w-full items-center justify-start text-xs text-slate-500 sm:w-auto">
                      Changes sync to your user badge and navigation.
                    </span>
                  </div>
                </form>

                <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-2xl font-semibold text-blue-700">
                    {profile?.fullName
                      ?.split(' ')
                      .filter(Boolean)
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase() || 'U'}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-900">
                      Profile picture
                    </p>
                    <p className="text-xs text-slate-500">
                      Avatar uploads can be wired here later. For now we use your initials.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
                <form onSubmit={handlePasswordSave} className="space-y-5">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Change password
                  </h2>
                  <p className="text-sm text-slate-600">
                    Use a strong password you do not reuse on other systems.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-800">
                        Current password
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-800">
                          New password
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-800">
                          Confirm new password
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row-reverse">
                    <button
                      type="submit"
                      disabled={passwordSaving}
                      className="inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
                    >
                      {passwordSaving ? 'Updating...' : 'Update password'}
                    </button>
                    <span className="inline-flex w-full items-center justify-start text-xs text-slate-500 sm:w-auto">
                      You will stay signed in on this device after a successful update.
                    </span>
                  </div>
                </form>

                <div className="space-y-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-4 text-sm text-amber-900">
                  <p className="font-semibold">Security tips</p>
                  <ul className="list-disc space-y-1 pl-5 text-xs">
                    <li>Use at least 12 characters with a mix of letters, numbers and symbols.</li>
                    <li>Avoid using names, dates or easily guessable words.</li>
                    <li>Change your password if you notice suspicious login activity.</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Last logins
                    </h2>
                    <p className="text-sm text-slate-600">
                      Recent sign-ins for this account, including IP address and device.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActivityLoading(true);
                      loadLoginActivity()
                        .then(setLoginActivity)
                        .finally(() => setActivityLoading(false));
                    }}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Refresh
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  {activityLoading ? (
                    <p className="text-xs text-slate-500">Loading activity…</p>
                  ) : loginActivity.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      No login activity recorded yet for this account.
                    </p>
                  ) : (
                    <ul className="divide-y divide-slate-100 text-sm">
                      {loginActivity.map((entry) => (
                        <li
                          key={entry.id}
                          className="flex flex-wrap items-center justify-between gap-2 py-2"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-slate-900">
                              {entry.userAgent || 'Unknown device'}
                            </p>
                            <p className="text-xs text-slate-500">
                              {entry.ipAddress || 'Unknown IP'}
                            </p>
                          </div>
                          <p className="text-xs text-slate-500">
                            {new Date(entry.createdAt).toLocaleString()}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

