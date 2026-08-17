'use client';

import { useEffect, useState } from 'react';
import { usePendingApprovals, verifyUser } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';

export default function PendingApprovalsPage({ user }: any) {
  const { pendingUsers, loading } = usePendingApprovals();
  const [verifying, setVerifying] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [approvalConfirm, setApprovalConfirm] = useState<any>(null);

  const handleApprove = async (userId: string) => {
    const userToApprove = pendingUsers.find(u => u.id === userId);
    setApprovalConfirm(userToApprove);
  };

  const confirmApproval = async () => {
    if (!approvalConfirm) return;
    
    setVerifying(approvalConfirm.id);
    const success = await verifyUser(approvalConfirm.id, user?.id);
    if (success) {
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">Pending Approvals</h2>
          <p className="text-slate-400 mt-2">Verify new member registrations</p>
        </div>
        <div className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
          <p className="text-yellow-400 font-semibold">{pendingUsers.length} Pending</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <p className="text-slate-400">Loading pending approvals...</p>
        </div>
      ) : pendingUsers.length === 0 ? (
        <div className="backdrop-blur-md bg-slate-900/40 border border-slate-700/50 rounded-lg p-12 text-center">
          <p className="text-slate-400 text-lg">All registrations have been approved!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingUsers.map((u) => (
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
                className="w-full mt-4 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition"
              >
                {verifying === u.id ? 'Approving...' : 'Approve'}
              </button>
            </div>
          ))}
        </div>
      )}

      {showDetails && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="backdrop-blur-md bg-slate-900 border border-slate-700/50 rounded-lg p-8 max-w-2xl w-full max-h-96 overflow-y-auto">
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
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-medium transition"
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
          <div className="backdrop-blur-md bg-slate-900 border border-yellow-500/50 rounded-lg p-8 max-w-md w-full">
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
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-medium transition"
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
    </div>
  );
}
