'use client';

import { useRef, useState } from 'react';
import { useUsers } from '@/lib/hooks';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import AdminPasswordManager from './AdminPasswordManager';

const coreTeamRoles = new Set(['admin', 'faculty', 'vice_president', 'general_secretary', 'technical_secretary', 'cultural_secretary', 'treasurer', 'executive', 'secretary']);

export default function MembersPanel({ user, yearScope, hideSorting = false }: { user: any; yearScope?: number; hideSorting?: boolean }) {
  const { users, loading } = useUsers();
  const isYearRepresentative = ['year_representative', 'yearrep'].includes(String(user?.role).toLowerCase());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('all');
  const [sortBy, setSortBy] = useState<'status' | 'name' | 'cse_id' | 'email' | 'year' | 'role'>('name');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showPasswordManager, setShowPasswordManager] = useState(false);
  const totalClickTimes = useRef<number[]>([]);

  const handleTotalClick = () => {
    const now = Date.now();
    const recentClicks = [...totalClickTimes.current.filter((time) => now - time < 3000), now];
    totalClickTimes.current = recentClicks;
    if (recentClicks.length >= 8) {
      setShowPasswordManager(true);
      totalClickTimes.current = [];
    }
  };

  const scopedUsers = isYearRepresentative
    ? users.filter((u) => coreTeamRoles.has(String(u.role).toLowerCase()) || (yearScope !== undefined && u.year === yearScope))
    : users;
  const filteredUsers = scopedUsers.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.cse_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = filterYear === 'all' || u.year?.toString() === filterYear;

    return matchesSearch && matchesYear;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const compareText = (first: string | undefined, second: string | undefined) =>
      (first ?? '').localeCompare(second ?? '', undefined, { sensitivity: 'base' });

    switch (sortBy) {
      case 'status': {
        if (a.is_verified !== b.is_verified) {
          return Number(b.is_verified) - Number(a.is_verified);
        }
        return compareText(a.name, b.name);
      }
      case 'name':
        return compareText(a.name, b.name) || compareText(a.email, b.email);
      case 'cse_id':
        return compareText(a.cse_id, b.cse_id) || compareText(a.name, b.name);
      case 'email':
        return compareText(a.email, b.email) || compareText(a.name, b.name);
      case 'year': {
        const yearA = Number(a.year ?? 0);
        const yearB = Number(b.year ?? 0);
        return yearA - yearB || compareText(a.name, b.name);
      }
      case 'role':
        return compareText(a.role, b.role) || compareText(a.name, b.name);
      default:
        return 0;
    }
  });

  const stats = {
    total: scopedUsers.length,
    verified: scopedUsers.filter((u) => u.is_verified).length,
    pending: scopedUsers.filter((u) => !u.is_verified).length,
  };

  // Export functions
  const exportToJSON = () => {
    const dataToExport = sortedUsers.map((u) => ({
      name: u.name,
      cseId: u.cse_id,
      email: u.email,
      year: u.year,
      role: u.role,
      department: u.department,
      status: u.is_verified ? 'Verified' : 'Pending',
      joinedDate: new Date(u.created_at).toLocaleDateString('en-IN'),
    }));

    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `members_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToExcel = () => {
    const dataToExport = sortedUsers.map((u) => ({
      Name: u.name,
      'CSE ID': u.cse_id,
      Email: u.email,
      Year: u.year,
      Role: u.role,
      Department: u.department,
      Status: u.is_verified ? 'Verified' : 'Pending',
      'Joined Date': new Date(u.created_at).toLocaleDateString('en-IN'),
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Members');

    // Auto-size columns
    const colWidths = [
      { wch: 20 },
      { wch: 12 },
      { wch: 25 },
      { wch: 8 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
    ];
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, `members_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 10;

    // Title
    pdf.setFontSize(16);
    pdf.text('CSE Society - Members Directory', pageWidth / 2, yPosition, { align: 'center' } as any);
    yPosition += 10;

    // Export date
    pdf.setFontSize(10);
    pdf.text(`Exported on: ${new Date().toLocaleDateString('en-IN')}`, 10, yPosition);
    yPosition += 8;

    // Stats
    pdf.setFontSize(11);
    pdf.text(`Total Members: ${sortedUsers.length} | Verified: ${sortedUsers.filter((u) => u.is_verified).length} | Pending: ${sortedUsers.filter((u) => !u.is_verified).length}`, 10, yPosition);
    yPosition += 10;

    // Table headers
    const headers = ['Name', 'CSE ID', 'Email', 'Year', 'Role', 'Status'];
    const colWidths = [30, 20, 40, 10, 20, 18];
    let xPosition = 10;

    pdf.setFontSize(10);
    pdf.setFont('', 'bold');
    headers.forEach((header) => {
      pdf.text(header as string, xPosition, yPosition);
      xPosition += colWidths[headers.indexOf(header)];
    });
    yPosition += 7;
    pdf.setFont('', 'normal');

    // Table rows
    pdf.setFontSize(9);
    sortedUsers.forEach((u) => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = 10;
      }

      xPosition = 10;
      const rowData = [
        String(u.name || ''),
        String(u.cse_id || ''),
        String(u.email || ''),
        String(u.year || ''),
        String(u.role || ''),
        u.is_verified ? 'Verified' : 'Pending',
      ];

      rowData.forEach((data, idx) => {
        const cellText = data.length > 20 ? data.substring(0, 17) + '...' : data;
        pdf.text(cellText as string, xPosition, yPosition);
        xPosition += colWidths[idx];
      });
      yPosition += 6;
    });

    pdf.save(`members_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">Members Directory</h2>
          <p className="text-slate-400 mt-2">Manage CSE Society members</p>
        </div>
        <div className="grid w-full grid-cols-3 gap-1.5 sm:w-auto sm:gap-4">
          <div className="px-1.5 py-2 sm:px-3 bg-blue-500/20 border border-blue-500/30 rounded-lg text-center">
            <p className="text-blue-400 font-semibold text-sm sm:text-lg">{stats.total}</p>
            <button type="button" onClick={() => {
              if (String(user?.role || '').toLowerCase() === 'admin') handleTotalClick();
            }} className="cursor-pointer select-none text-blue-300 text-xs hover:text-blue-100">
              Total
            </button>
          </div>
          <div className="px-1.5 py-2 sm:px-3 bg-green-500/20 border border-green-500/30 rounded-lg text-center">
            <p className="text-green-400 font-semibold text-sm sm:text-lg">{stats.verified}</p>
            <p className="text-green-300 text-xs">Verified</p>
          </div>
          <div className="px-1.5 py-2 sm:px-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-center">
            <p className="text-yellow-400 font-semibold text-sm sm:text-lg">{stats.pending}</p>
            <p className="text-yellow-300 text-xs">Pending</p>
          </div>
        </div>
      </div>

      {String(user?.role || '').toLowerCase() === 'admin' && showPasswordManager && (
        <div onClick={() => setShowPasswordManager(false)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Change member password">
          <div onClick={(event) => event.stopPropagation()} className="max-h-[90vh] w-full max-w-3xl overflow-y-auto">
            <div className="mb-2 flex justify-end">
              <button type="button" onClick={() => setShowPasswordManager(false)} className="border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300 hover:text-white">Close</button>
            </div>
            <AdminPasswordManager adminId={user?.id} />
          </div>
        </div>
      )}

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
          {!hideSorting && <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'status' | 'name' | 'cse_id' | 'email' | 'year' | 'role')}
              className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 transition"
            >
              <option value="status">Approved</option>
              <option value="name">Name</option>
              <option value="cse_id">CSE ID</option>
              <option value="email">Email</option>
              <option value="year">Year</option>
              <option value="role">Role</option>
            </select>}
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterYear('all');
              setSortBy('name');
            }}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition"
          >
            Clear Filters
          </button>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap gap-2.5 mt-4">
          <button
            onClick={exportToJSON}
            className="min-w-[92px] rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-medium text-white shadow-[0_0_0_1px_rgba(255,255,255,0.05)] backdrop-blur-sm transition-all duration-200 hover:border-white/40 hover:bg-gradient-to-r hover:from-white/20 hover:to-sky-200/10 hover:shadow-[0_8px_24px_rgba(255,255,255,0.14)]"
          >
            <span className="mr-1.5">📄</span>JSON
          </button>
          <button
            onClick={exportToExcel}
            className="min-w-[92px] rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-medium text-white shadow-[0_0_0_1px_rgba(255,255,255,0.05)] backdrop-blur-sm transition-all duration-200 hover:border-white/40 hover:bg-gradient-to-r hover:from-white/20 hover:to-emerald-200/10 hover:shadow-[0_8px_24px_rgba(255,255,255,0.14)]"
          >
            <span className="mr-1.5">📊</span>Excel
          </button>
          <button
            onClick={exportToPDF}
            className="min-w-[92px] rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-medium text-white shadow-[0_0_0_1px_rgba(255,255,255,0.05)] backdrop-blur-sm transition-all duration-200 hover:border-white/40 hover:bg-gradient-to-r hover:from-white/20 hover:to-rose-200/10 hover:shadow-[0_8px_24px_rgba(255,255,255,0.14)]"
          >
            <span className="mr-1.5">📕</span>PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <p className="text-slate-400">Loading members...</p>
        </div>
      ) : sortedUsers.length === 0 ? (
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
                {sortedUsers.map((u) => (
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
