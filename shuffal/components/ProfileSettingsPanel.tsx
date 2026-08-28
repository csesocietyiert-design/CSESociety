'use client';

import { useState, useEffect } from 'react';
import { useMembershipProfileDetails, useMembershipProfileImage, useUserSettings, updateUserSettings } from '@/lib/hooks';
import MemberAvatar from '@/components/MemberAvatar';

export default function ProfileSettingsPanel({ user }: any) {
  const { settings, loading: settingsLoading } = useUserSettings(user?.id);
  const membershipProfileImage = useMembershipProfileImage(user?.profile_image_url);
  const membershipProfile = useMembershipProfileDetails();
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    return window.localStorage.getItem('cse-theme') || 'dark';
  });
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [confirmPasswordChange, setConfirmPasswordChange] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isChanging, setIsChanging] = useState(false);
  const [aktuRollNumber, setAktuRollNumber] = useState('');
  const [aktuDateOfBirth, setAktuDateOfBirth] = useState('');
  const [aktuStatus, setAktuStatus] = useState('');
  const [aktuLoading, setAktuLoading] = useState(false);

  useEffect(() => {
    if (settings?.theme) {
      setTheme(settings.theme);
    }
  }, [settings]);

  const checkAktuResult = async (event: React.FormEvent) => {
    event.preventDefault();
    setAktuStatus('');
    setAktuLoading(true);

    try {
      const response = await fetch('/api/aktu/result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber: aktuRollNumber || membershipProfile?.roll_number_aktu || '', dateOfBirth: aktuDateOfBirth }),
      });
      const result = await response.json();
      if (result.code === 'verification_required' || result.code === 'service_unavailable' || result.code === 'unexpected_response') {
        setAktuStatus(result.error);
      } else if (!response.ok) {
        setAktuStatus(result.error || 'Please check your details.');
      } else {
        setAktuStatus('We could not read the result from AKTU right now. Please try again later.');
      }
    } catch {
      setAktuStatus('AKTU result service is currently unavailable. Please try again later.');
    } finally {
      setAktuLoading(false);
    }
  };

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (theme === 'auto') {
      const applyTimeTheme = () => {
        const hour = new Date().getHours();
        document.documentElement.dataset.theme = hour >= 6 && hour < 18 ? 'light' : 'dark';
      };
      applyTimeTheme();
      const refreshAtTimeChange = window.setInterval(applyTimeTheme, 60_000);
      localStorage.setItem('cse-theme', 'auto');
      return () => window.clearInterval(refreshAtTimeChange);
    } else {
      document.documentElement.dataset.theme = theme;
      localStorage.setItem('cse-theme', theme);
    }
  }, [theme]);

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme);
    const success = await updateUserSettings(user?.id, { theme: newTheme });
    if (!success) {
      setTheme(theme);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsChanging(true);

    try {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('Passwords do not match');
        setIsChanging(false);
        return;
      }

      if (passwordData.newPassword.length < 6) {
        setError('Password must be at least 6 characters');
        setIsChanging(false);
        return;
      }

      if (!confirmPasswordChange) {
        setError('Please confirm that you want to change your password');
        setIsChanging(false);
        return;
      }

      const isAdmin = user?.role === 'admin';
      const response = await fetch(isAdmin ? '/api/admin/password' : '/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isAdmin ? {
          adminId: user?.id,
          targetUserId: user?.id,
          newPassword: passwordData.newPassword,
        } : {
          userId: user?.id,
          newPassword: passwordData.newPassword,
        }),
      });
      const result = await response.json();
      const success = response.ok;

      if (success) {
        setSuccess(isAdmin ? 'Your password was changed successfully.' : 'Password change request sent to an administrator for approval.');
        setPasswordData({
          newPassword: '',
          confirmPassword: '',
        });
        setConfirmPasswordChange(false);
        setShowPasswordChange(false);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Failed to change password');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white">Profile & Settings</h2>
        <p className="text-slate-400 mt-2">Manage your account preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="backdrop-blur-md bg-slate-900/40 border border-slate-700/50 rounded-lg p-6 text-center">
            <MemberAvatar
              name={user?.name}
              profileImage={membershipProfileImage || user?.profile_image_url}
              className="mx-auto mb-4 flex h-44 w-36 items-center justify-center overflow-hidden rounded-2xl border border-sky-300/30 bg-gradient-to-br from-blue-500/20 to-purple-600/20 p-1 text-5xl font-bold text-white shadow-lg shadow-blue-950/30 sm:h-52 sm:w-44"
              imageClassName="h-full w-full rounded-xl object-cover"
            />
            <h3 className="text-lg font-bold text-white">{user?.name}</h3>
            <p className="text-slate-400 text-sm mt-1">{user?.email}</p>
            <p className="text-slate-500 text-xs mt-2">Society ID: {user?.cseId || 'Not available'}</p>
            <div className="mt-6 space-y-2">
              <div className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg">
                <p className="text-slate-400 text-xs mb-1">Role</p>
                <p className="text-white font-semibold capitalize">{user?.role}</p>
              </div>
              <div className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg">
                <p className="text-slate-400 text-xs mb-1">Year</p>
                <p className="text-white font-semibold">{user?.year}</p>
              </div>
              <div className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg">
                <p className="text-slate-400 text-xs mb-1">Status</p>
                <p className="text-green-400 font-semibold">Verified</p>
              </div>
            </div>
          </div>
          <div className="mt-6 backdrop-blur-md bg-slate-900/40 border border-slate-700/50 rounded-lg p-6 text-left">
            <h3 className="text-lg font-bold text-white mb-5">Family & Contact</h3>
            <div className="space-y-3">
              <ProfileDetail label="Father's Name" value={membershipProfile?.father_name} />
              <ProfileDetail label="Mother's Name" value={membershipProfile?.mother_name} />
              <ProfileDetail label="Father / Guardian Mobile" value={membershipProfile?.father_guardian_mobile_number} />
              <ProfileDetail label="Mobile Number" value={membershipProfile?.mobile_number} />
              <ProfileDetail label="Emergency Contact" value={membershipProfile?.emergency_contact_number} />
              <ProfileDetail label="Blood Group" value={membershipProfile?.blood_group} />
              <ProfileDetail label="Date of Birth" value={membershipProfile?.date_of_birth} />
              <ProfileDetail label="Permanent Address" value={membershipProfile?.permanent_address} multiline />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="backdrop-blur-md bg-slate-900/40 border border-slate-700/50 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-6">Appearance</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">Theme</label>
                <div className="grid grid-cols-3 gap-3">
                  {['light', 'dark', 'auto'].map((themeOption) => (
                    <button
                      key={themeOption}
                      onClick={() => handleThemeChange(themeOption)}
                      className={`px-4 py-3 rounded-lg font-medium transition ${
                        theme === themeOption
                          ? 'bg-blue-600 text-white border border-blue-500'
                          : 'bg-slate-800/50 text-slate-300 border border-slate-700/50 hover:border-slate-600'
                      }`}
                    >
                      {themeOption === 'auto' ? 'Auto' : themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>

          <div className="backdrop-blur-md bg-slate-900/40 border border-slate-700/50 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-6">Security</h3>
            <button
              onClick={() => setShowPasswordChange(!showPasswordChange)}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
            >
              {showPasswordChange ? 'Cancel' : 'Change Password'}
            </button>

            {showPasswordChange && (
              <form onSubmit={handlePasswordChange} className="mt-6 space-y-4 pt-6 border-t border-slate-700/50">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    placeholder="Enter new password"
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                    disabled={isChanging}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                    placeholder="Confirm new password"
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                    disabled={isChanging}
                  />
                </div>

                <div className="border border-amber-400/20 bg-amber-400/5 p-3 text-sm leading-5 text-slate-400">
                  {user?.role === 'admin' ? 'Your new password will be securely hashed and applied immediately.' : 'Your new password will be securely hashed and sent to an administrator for approval. It will only become active after approval.'}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="confirm-change"
                    checked={confirmPasswordChange}
                    onChange={(e) => setConfirmPasswordChange(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700"
                  />
                  <label htmlFor="confirm-change" className="text-sm text-slate-300">
                    I understand this action cannot be undone
                  </label>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
                    <p className="text-green-400 text-sm">{success}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isChanging}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-medium transition"
                >
                  {isChanging ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            )}
          </div>

          <div className="backdrop-blur-md bg-slate-900/40 border border-slate-700/50 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-6">Account Information</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
                <span className="text-slate-400">Member Since</span>
                <span className="text-white font-medium">{formatMemberSince(user?.created_at, membershipProfile?.timestamp)}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
                <span className="text-slate-400">Society ID</span>
                <span className="text-white font-medium">{user?.cseId || 'Not available'}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
                <span className="text-slate-400">Account ID</span>
                <span className="max-w-[65%] break-all text-right text-white font-medium">{user?.id || 'Not available'}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
                <span className="text-slate-400">Email</span>
                <span className="max-w-[65%] break-words text-right text-white font-medium">{user?.email || 'Not available'}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
                <span className="text-slate-400">Department</span>
                <span className="text-white font-medium">{user?.department || 'Not provided'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Academic Year</span>
                <span className="text-white font-medium">{user?.year ? `Year ${user.year}` : 'Not provided'}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

          <div className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur-md">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">Academic records</p>
                <h3 className="mt-1 text-lg font-bold text-white">AKTU Result</h3>
                <p className="mt-1 text-sm text-slate-400">Check your result securely through the official AKTU portal.</p>
              </div>
              <a
                href="https://erp.aktu.ac.in/webpages/oneview/oneview.aspx?AspxAutoDetectCookieSupport=1"
                target="_blank"
                rel="noreferrer"
                className="shrink-0 text-sm font-medium text-blue-400 transition hover:text-blue-300"
              >
                Official AKTU Portal
              </a>
            </div>
            <form onSubmit={checkAktuResult} className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <div>
                <label htmlFor="aktu-roll-number" className="mb-2 block text-sm font-medium text-slate-300">Roll Number</label>
                <input
                  id="aktu-roll-number"
                  value={aktuRollNumber || membershipProfile?.roll_number_aktu || ''}
                  onChange={(event) => setAktuRollNumber(event.target.value)}
                  placeholder="Enter AKTU roll number"
                  autoComplete="off"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label htmlFor="aktu-date-of-birth" className="mb-2 block text-sm font-medium text-slate-300">Date of Birth</label>
                <input
                  id="aktu-date-of-birth"
                  value={aktuDateOfBirth}
                  onChange={(event) => setAktuDateOfBirth(event.target.value)}
                  placeholder="DD/MM/YYYY"
                  inputMode="numeric"
                  autoComplete="off"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={aktuLoading}
                className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {aktuLoading ? 'Fetching result...' : 'Check Result'}
              </button>
            </form>
            {aktuStatus && (
              <div className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/10 p-4 text-sm leading-6 text-amber-200">
                <p>{aktuStatus}</p>
                <a
                  href="https://erp.aktu.ac.in/webpages/oneview/oneview.aspx?AspxAutoDetectCookieSupport=1"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block font-semibold text-amber-100 underline underline-offset-4"
                >
                  View on Official AKTU Portal
                </a>
              </div>
            )}
      </div>
    </div>
  );
}

function ProfileDetail({ label, value, multiline = false }: { label: string; value?: string | null; multiline?: boolean }) {
  return (
    <div className="border-b border-slate-700/50 pb-3 last:border-0 last:pb-0">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-sm font-medium text-white ${multiline ? 'leading-5' : 'break-words'}`}>{value?.trim() || 'Not provided'}</p>
    </div>
  );
}

function formatMemberSince(createdAt?: string, membershipTimestamp?: string | null) {
  const value = createdAt || membershipTimestamp;
  if (!value) return 'Not available';

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleDateString('en-IN');
}
