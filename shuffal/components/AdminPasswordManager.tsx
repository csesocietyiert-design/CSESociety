'use client';

import { useState } from 'react';

interface AdminPasswordManagerProps {
  adminId: string;
}

interface TargetUser {
  id: string;
  cse_id: string;
  name: string;
  email: string;
  role: string;
  year?: number;
  department?: string;
  is_verified?: boolean;
}

export default function AdminPasswordManager({ adminId }: AdminPasswordManagerProps) {
  const [cseId, setCseId] = useState('');
  const [targetUser, setTargetUser] = useState<TargetUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const lookupUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setTargetUser(null);
    setLookupLoading(true);

    try {
      const response = await fetch(`/api/admin/password?adminId=${encodeURIComponent(adminId)}&cseId=${encodeURIComponent(cseId.trim())}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not find student');
      setTargetUser(result.user);
    } catch (lookupError) {
      setError(lookupError instanceof Error ? lookupError.message : 'Could not find student');
    } finally {
      setLookupLoading(false);
    }
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!targetUser) return setError('Search for a student first');
    if (newPassword.length < 6) return setError('Password must be at least 6 characters');
    if (newPassword !== confirmPassword) return setError('Passwords do not match');
    if (!confirmed) return setError('Confirm the password change before continuing');

    setLoading(true);
    try {
      const response = await fetch('/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, targetUserId: targetUser.id, newPassword }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not change password');
      setSuccess(`Password updated for ${targetUser.name}.`);
      setNewPassword('');
      setConfirmPassword('');
      setConfirmed(false);
    } catch (changeError) {
      setError(changeError instanceof Error ? changeError.message : 'Could not change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="backdrop-blur-md bg-slate-900/40 border border-slate-700/50 rounded-lg p-6">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">Admin security tool</p>
        <h3 className="mt-2 text-xl font-semibold text-white">Change Member Password</h3>
        <p className="mt-1 text-sm text-slate-400">Search a member by CSE ID, review their details, and set a new password directly.</p>
      </div>

      <form onSubmit={lookupUser} className="flex flex-col gap-3 sm:flex-row">
        <input value={cseId} onChange={(event) => setCseId(event.target.value)} placeholder="Enter student CSE ID" className="min-w-0 flex-1 border border-slate-700 bg-slate-800/70 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-amber-300" required />
        <button type="submit" disabled={lookupLoading} className="bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50">{lookupLoading ? 'Searching...' : 'Find Student'}</button>
      </form>

      {targetUser && (
        <form onSubmit={changePassword} className="mt-5 border border-slate-700 bg-slate-950/40 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><p className="text-xs uppercase tracking-wider text-slate-500">Name</p><p className="mt-1 font-medium text-white">{targetUser.name}</p></div>
            <div><p className="text-xs uppercase tracking-wider text-slate-500">CSE ID</p><p className="mt-1 font-mono text-white">{targetUser.cse_id}</p></div>
            <div><p className="text-xs uppercase tracking-wider text-slate-500">Email</p><p className="mt-1 text-sm text-slate-300">{targetUser.email}</p></div>
            <div><p className="text-xs uppercase tracking-wider text-slate-500">Role / Year</p><p className="mt-1 capitalize text-slate-300">{targetUser.role} / {targetUser.year || 'Not set'}</p></div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="New password" className="border border-slate-700 bg-slate-800/70 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-amber-300" required />
            <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm password" className="border border-slate-700 bg-slate-800/70 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-amber-300" required />
          </div>
          <label className="mt-4 flex items-start gap-3 text-sm text-slate-400"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1 h-4 w-4" /> <span>I confirm that this password change is authorized and should be applied immediately.</span></label>
          <button type="submit" disabled={loading} className="mt-5 bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50">{loading ? 'Updating password...' : 'Change Password Directly'}</button>
        </form>
      )}

      {error && <p className="mt-4 border border-rose-400/30 bg-rose-400/5 p-3 text-sm text-rose-300">{error}</p>}
      {success && <p className="mt-4 border border-emerald-400/30 bg-emerald-400/5 p-3 text-sm text-emerald-300">{success}</p>}
    </section>
  );
}
