'use client';

import { useState } from 'react';
import { useUsers } from '@/lib/hooks';
import Link from 'next/link';

export default function MembersPanel({ user }: any) {
  const { users, loading } = useUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.cse_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = filterYear === 'all' || u.year?.toString() === filterYear;
    const matchesRole = filterRole === 'all' || u.role === filterRole;

    return matchesSearch && matchesYear && matchesRole;
  });

  const stats = {
    total: users.length,
    verified: users.filter((u) => u.is_verified).length,
    pending: users.filter((u) => !u.is_verified).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">Members Directory</h2>
          <p className="text-slate-400 mt-2">Manage CSE Society members</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
          <div className="px-2 sm:px-3 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-center">
            <p className="text-blue-400 font-semibold text-base sm:text-lg">{stats.total}</p>
            <p className="text-blue-300 text-xs">Total</p>
          </div>
          <div className="px-2 sm:px-3 py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-center">
            <p className="text-green-400 font-semibold text-base sm:text-lg">{stats.verified}</p>
            <p className="text-green-300 text-xs">Verified</p>
          </div>
          <div className="hidden sm:block px-3 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-center">
            <p className="text-yellow-400 font-semibold text-lg">{stats.pending}</p>
            <p className="text-yellow-300 text-xs">Pending</p>
          </div>
        </div>
      </div>

      <div className="backdrop-blur-md bg-slate-900/40 border border-slate-700/50 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          <input
            type="text"
            placeholder="Search by name, email, or CSE ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 transition"
          >
            <option value="all">All Years</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 transition"
          >
            <option value="all">All Roles</option>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
            <option value="executive">Executive</option>
            <option value="faculty">Faculty</option>
          </select>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterYear('all');
              setFilterRole('all');
            }}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <p className="text-slate-400">Loading members...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="backdrop-blur-md bg-slate-900/40 border border-slate-700/50 rounded-lg p-12 text-center">
          <p className="text-slate-400 text-lg">No members found</p>
        </div>
      ) : (
        <div className="backdrop-blur-md bg-slate-900/40 border border-slate-700/50 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50 bg-slate-800/50">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">CSE ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Year</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Role</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-slate-700/20 hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-white font-medium">{u.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{u.cse_id}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{u.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{u.year}</td>
                    <td className="px-6 py-4 text-sm text-slate-300 capitalize">{u.role}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          u.is_verified
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}
                      >
                        {u.is_verified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="text-blue-400 hover:text-blue-300 font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="backdrop-blur-md bg-slate-900 border border-slate-700/50 rounded-lg p-8 max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white">{selectedUser.name}</h3>
                <p className="text-slate-400 text-sm mt-1">{selectedUser.email}</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-slate-400 text-sm mb-1">CSE ID</p>
                <p className="text-white font-medium">{selectedUser.cse_id}</p>
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
              <div>
                <p className="text-slate-400 text-sm mb-1">Status</p>
                <p className={`font-medium ${selectedUser.is_verified ? 'text-green-400' : 'text-yellow-400'}`}>
                  {selectedUser.is_verified ? 'Verified' : 'Pending Approval'}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Joined On</p>
                <p className="text-white font-medium">
                  {new Date(selectedUser.created_at).toLocaleDateString('en-IN')}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedUser(null)}
              className="w-full mt-6 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
