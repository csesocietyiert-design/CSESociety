'use client';

import { useEffect, useState } from 'react';
import { usePendingApprovals, verifyUser } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';

export default function PendingApprovalsPage({ user }: any) {
  const { pendingUsers, loading, removePendingUser } = usePendingApprovals();
  const [verifying, setVerifying] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [approvalConfirm, setApprovalConfirm] = useState<any>(null);
  const [approvedUser, setApprovedUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [passwordRequests, setPasswordRequests] = useState<any[]>([]);
  const [passwordRequestLoading, setPasswordRequestLoading] = useState(true);
  const [passwordRequestError, setPasswordRequestError] = useState('');
  const [passwordRequestAction, setPasswordRequestAction] = useState<string | null>(null);

  useEffect(() => {
    const loadPasswordRequests = async () => {
      try {
        const response = await fetch(`/api/auth/change-password?adminId=${encodeURIComponent(user?.id || '')}`);
        const payload = await response.json();
        if (response.ok) setPasswordRequests(payload.requests || []);
        else setPasswordRequestError(payload.error || 'Could not load password requests');
      } finally {
        setPasswordRequestLoading(false);
      }
    };

    if (user?.id) loadPasswordRequests();
  }, [user?.id]);

  const reviewPasswordRequest = async (requestId: string, action: 'approve' | 'reject') => {
    setPasswordRequestAction(requestId);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action, adminId: user?.id }),
      });
      if (response.ok) {
        setPasswordRequests((requests) => requests.filter((request) => request.id !== requestId));
      }
    } finally {
      setPasswordRequestAction(null);
    }
  };

  const filteredUsers = pendingUsers.filter((u) =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.cse_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleApprove = async (userId: string) => {
    const userToApprove = pendingUsers.find(u => u.id === userId);
    setApprovalConfirm(userToApprove);
  };

  const confirmApproval = async () => {
    if (!approvalConfirm) return;
    
    setVerifying(approvalConfirm.id);
    const success = await verifyUser(approvalConfirm.id, user?.id);
    if (success) {
      setApprovedUser(approvalConfirm);
      removePendingUser(approvalConfirm.id);
      setSelectedUser(null);
      setShowDetails(false);
      setApprovalConfirm(null);
    }
    setVerifying(null);
  };

  const handleSelectUser = (u: any) => {
    setSelectedUser(u);
    setShowDetails(true);
  };

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Password Change Requests</h2>
            <p className="mt-1 text-sm text-slate-400">Review member requests. The password is already securely hashed and is applied only after approval.</p>
          </div>
          <span className="border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-sm font-semibold text-amber-300">{passwordRequests.length} Pending</span>
        </div>
        {passwordRequestLoading ? <p className="text-sm text-slate-500">Loading password requests...</p> : passwordRequestError ? <div className="border border-rose-400/30 bg-rose-400/5 p-5 text-sm text-rose-300">{passwordRequestError}</div> : passwordRequests.length === 0 ? <div className="border border-slate-700/50 bg-slate-900/40 p-5 text-sm text-slate-400">No password change requests are waiting for approval.</div> : <div className="grid gap-4 md:grid-cols-2">{passwordRequests.map((request) => <article key={request.id} className="border border-slate-700/70 bg-slate-900/50 p-5"><p className="font-semibold text-white">{request.users?.name || 'Member'}</p><p className="mt-1 text-sm text-slate-400">{request.users?.email || 'No email'} · {request.users?.cse_id || 'No CSE ID'}</p><p className="mt-3 text-xs text-slate-500">Requested {new Date(request.created_at).toLocaleString('en-IN')}</p><div className="mt-4 flex gap-3"><button onClick={() => reviewPasswordRequest(request.id, 'approve')} disabled={passwordRequestAction === request.id} className="flex-1 bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50">Approve</button><button onClick={() => reviewPasswordRequest(request.id, 'reject')} disabled={passwordRequestAction === request.id} className="flex-1 border border-rose-400/40 px-3 py-2 text-sm font-semibold text-rose-300 hover:border-rose-300 disabled:opacity-50">Reject</button></div></article>)}</div>}
      </section>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">Pending Approvals</h2>
          <p className="text-slate-400 mt-2">Verify new member registrations</p>
        </div>
        <div className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
          <p className="text-yellow-400 font-semibold">{filteredUsers.length} Pending</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search by name, email, or CSE ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-slate-900/40 border border-slate-700/50 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500/50 text-sm sm:text-base transition"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
          🔍
        </span>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <p className="text-slate-400">Loading pending approvals...</p>
        </div>
      ) : pendingUsers.length === 0 ? (
        <div className="backdrop-blur-md bg-slate-900/40 border border-slate-700/50 rounded-lg p-12 text-center">
          <p className="text-slate-400 text-lg">All registrations have been approved!</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="backdrop-blur-md bg-slate-900/40 border border-slate-700/50 rounded-lg p-12 text-center">
          <p className="text-slate-400 text-lg">No users found matching "{searchQuery}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((u) => (
            <div
              key={u.id}
              className="backdrop-blur-md bg-slate-900/40 border border-slate-700/50 rounded-lg p-6 hover:border-yellow-500/50 transition-colors cursor-pointer"
              onClick={() => handleSelectUser(u)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {u.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium border border-yellow-500/30 rounded-full">
                  Pending
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">{u.name}</h3>
              <p className="text-sm text-slate-400 mb-2">{u.email}</p>
              <p className="text-xs text-slate-500">CSE ID: {u.cse_id}</p>
              <p className="text-xs text-slate-500">Year: {u.year}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleApprove(u.id);
                }}
                disabled={verifying === u.id}
                className="w-full mt-4 px-3 py-2 bg-gradient-to-r from-white via-emerald-50 to-green-200 hover:from-emerald-50 hover:via-emerald-100 hover:to-green-300 disabled:opacity-50 text-emerald-800 rounded-lg text-sm font-semibold shadow-sm shadow-emerald-200/50 transition border border-emerald-200"
              >
                {verifying === u.id ? 'Approving...' : 'Approve'}
              </button>
            </div>
          ))}
        </div>
      )}

      {showDetails && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="backdrop-blur-md bg-slate-900 border border-slate-700/50 rounded-lg p-6 sm:p-8 max-w-full sm:max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Member Details</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-slate-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-slate-400 text-sm mb-1">Full Name</p>
                <p className="text-white font-medium">{selectedUser.name}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">CSE ID</p>
                <p className="text-white font-medium">{selectedUser.cse_id}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Email</p>
                <p className="text-white font-medium">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Year</p>
                <p className="text-white font-medium">{selectedUser.year}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Department</p>
                <p className="text-white font-medium">{selectedUser.department}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Role</p>
                <p className="text-white font-medium capitalize">{selectedUser.role}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-slate-400 text-sm mb-1">Registration Date</p>
                <p className="text-white font-medium">
                  {new Date(selectedUser.created_at).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  handleApprove(selectedUser.id);
                }}
                disabled={verifying === selectedUser.id}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-white via-emerald-50 to-green-200 hover:from-emerald-50 hover:via-emerald-100 hover:to-green-300 disabled:opacity-50 text-emerald-800 rounded-lg font-semibold shadow-sm shadow-emerald-200/50 transition border border-emerald-200"
              >
                {verifying === selectedUser.id ? 'Approving...' : 'Approve Registration'}
              </button>
              <button
                onClick={() => setShowDetails(false)}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {approvalConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="backdrop-blur-md bg-slate-900 border border-yellow-500/50 rounded-lg p-6 sm:p-8 max-w-full sm:max-w-md w-full">
            <h3 className="text-2xl font-bold text-white mb-4">Confirm Approval</h3>
            <p className="text-slate-300 mb-6">
              Are you sure you want to verify and approve{' '}
              <span className="font-semibold text-yellow-400">{approvalConfirm.name}</span> ({approvalConfirm.cse_id})?
            </p>
            <p className="text-sm text-slate-400 mb-6 bg-slate-800/50 p-3 rounded">
              Once approved, this user will be able to log in and access the portal.
            </p>

            <div className="flex gap-4">
              <button
                onClick={confirmApproval}
                disabled={verifying === approvalConfirm.id}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-white via-emerald-50 to-green-200 hover:from-emerald-50 hover:via-emerald-100 hover:to-green-300 disabled:opacity-50 text-emerald-800 rounded-lg font-semibold shadow-sm shadow-emerald-200/50 transition border border-emerald-200"
              >
                {verifying === approvalConfirm.id ? 'Approving...' : 'Yes, Approve'}
              </button>
              <button
                onClick={() => setApprovalConfirm(null)}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {approvedUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-emerald-400/40 bg-slate-900 p-8 text-center shadow-2xl shadow-emerald-950/40">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-400/15 text-3xl text-emerald-300">
              ✓
            </div>
            <h3 className="text-2xl font-bold text-white">Member Approved</h3>
            <p className="mt-3 text-slate-300">
              <span className="font-semibold text-emerald-300">{approvedUser.name}</span> can now log in to the portal.
            </p>
            <div className="mt-5 rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-slate-300">
              CSE ID: <span className="font-semibold text-white">{approvedUser.cse_id}</span>
            </div>
            <button
              type="button"
              onClick={() => setApprovedUser(null)}
              className="mt-6 w-full rounded-lg bg-emerald-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
