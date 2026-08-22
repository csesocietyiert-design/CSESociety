'use client';

import { useState, useEffect } from 'react';
import { useUserSettings, updateUserSettings } from '@/lib/hooks';

export default function ProfileSettingsPanel({ user }: any) {
  const { settings, loading: settingsLoading } = useUserSettings(user?.id);
  const [theme, setTheme] = useState('dark');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [confirmPasswordChange, setConfirmPasswordChange] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    if (settings?.theme) {
      setTheme(settings.theme);
    }
  }, [settings]);

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
            <div className="w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl sm:text-3xl md:text-4xl mx-auto mb-4">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <h3 className="text-lg font-bold text-white">{user?.name}</h3>
            <p className="text-slate-400 text-sm mt-1">{user?.email}</p>
            <p className="text-slate-500 text-xs mt-2">CSE ID: {user?.cse_id}</p>
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
                <span className="text-white font-medium">
                  {new Date(user?.created_at).toLocaleDateString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
                <span className="text-slate-400">Email</span>
                <span className="text-white font-medium">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Department</span>
                <span className="text-white font-medium">{user?.department}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
