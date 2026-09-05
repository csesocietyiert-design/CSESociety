'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import LayoutWrapper from '@/components/LayoutWrapper';
import MemberAvatar from '@/components/MemberAvatar';
import { useAuthStore } from '@/lib/store';
import { useEvents, useUsers } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';

export default function ReportsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const { users, loading: usersLoading } = useUsers();
  const { events, loading: eventsLoading } = useEvents();
  const [memberRows, setMemberRows] = useState<Record<string, unknown>[]>([]);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<Record<string, unknown> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [certificateCount, setCertificateCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }
    const userRole = String(user.role || '').toLowerCase();
    const isFacultyAdmin = userRole === 'admin' || userRole === 'faculty';
    const isExecutive = userRole === 'executive' || userRole === 'vice_president' || userRole === 'general_secretary';
    const isSecretary = userRole === 'technical_secretary' || userRole === 'cultural_secretary' || userRole === 'secretary';
    const isYearRepresentative = userRole === 'year_representative' || userRole === 'yearrep';
    
    if (!isFacultyAdmin && !isExecutive && !isSecretary && !isYearRepresentative) {
      router.push('/dashboard');
    }
  }, [hasHydrated, isAuthenticated, user, router]);

  useEffect(() => {
    const loadReportTotals = async () => {
      if (!supabase) {
        setDataLoading(false);
        return;
      }

      const [certificatesResult, notificationsResponse] = await Promise.all([
        supabase.from('certificates').select('id', { count: 'exact', head: true }),
        fetch('/api/notifications'),
      ]);
      const notificationsPayload = await notificationsResponse.json();
      setCertificateCount(certificatesResult.count || 0);
      setNotificationCount(notificationsPayload.notifications?.length || 0);
      setDataLoading(false);
    };

    loadReportTotals();
  }, []);

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const response = await fetch('/api/reports/members');
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Failed to load members');
        setMemberRows((payload.members || []) as Record<string, unknown>[]);
      } catch (error) {
        setMembersError(error instanceof Error ? error.message : 'Failed to load members');
      }
    };

    void loadMembers();
  }, []);

  const memberColumns = useMemo(() => {
    const columns = new Set<string>();
    memberRows.forEach((member) => Object.keys(member).forEach((column) => columns.add(column)));
    return [...columns];
  }, [memberRows]);

  const yearOptions = useMemo(() => {
    const availableYears = memberRows.map((member) => String(member.current_year ?? member.year ?? '')).filter(Boolean);
    return [...new Set(['1st Year', '2nd Year', '3rd Year', '4th Year', ...availableYears])];
  }, [memberRows]);
  const filteredMemberRows = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return memberRows.filter((member) => {
      const memberYear = String(member.current_year ?? member.year ?? '').trim().toLowerCase();
      const matchesYear = yearFilter === 'all' || memberYear === yearFilter.trim().toLowerCase();
      const matchesSearch = !search || memberColumns.some((column) => String(member[column] ?? '').toLowerCase().includes(search));
      return matchesYear && matchesSearch;
    });
  }, [memberColumns, memberRows, searchTerm, yearFilter]);

  const verifiedCount = users.filter((student) => student.is_verified).length;
  const pendingCount = users.length - verifiedCount;
  const reportDate = new Date().toLocaleDateString('en-IN');
  const fileDate = new Date().toISOString().split('T')[0];

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredMemberRows);
    worksheet['!cols'] = memberColumns.map(() => ({ wch: 22 }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    XLSX.writeFile(workbook, `cse-society-students-${fileDate}.xlsx`);
  };

  const exportToPDF = () => {
    const pdf = new jsPDF({ orientation: 'landscape' });
    pdf.setFontSize(16);
    pdf.text('CSE Society Student Report', 14, 16);
    pdf.setFontSize(9);
    pdf.text(`Generated: ${reportDate} | Total members: ${filteredMemberRows.length}`, 14, 23);
    const headers = memberColumns;
    const widths = headers.map(() => Math.max(22, 270 / Math.max(headers.length, 1)));
    let y = 34;
    let x = 10;
    pdf.setFont('helvetica', 'bold');
    headers.forEach((header, index) => {
      pdf.text(header, x, y);
      x += widths[index];
    });
    pdf.setFont('helvetica', 'normal');
    y += 7;
    filteredMemberRows.forEach((member) => {
      if (y > 190) {
        pdf.addPage('landscape');
        y = 15;
      }
      x = 10;
      memberColumns.map((column) => String(member[column] ?? '')).forEach((value, index) => {
        const text = value.length > 28 ? `${value.slice(0, 25)}...` : value;
        pdf.text(text, x, y);
        x += widths[index];
      });
      y += 6;
    });
    pdf.save(`cse-society-students-${fileDate}.pdf`);
  };

  if (!hasHydrated || !isAuthenticated || !user || !['admin', 'faculty', 'executive'].includes(user.role)) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">Loading report...</div>;
  }

  const isLoading = usersLoading || eventsLoading || dataLoading;

  return (
    <LayoutWrapper user={user}>
      <div className="mx-auto max-w-7xl space-y-6 pb-8 text-white print:max-w-none print:bg-white print:text-black">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">CSE Society Management</p>
            <h1 className="mt-2 text-3xl font-bold text-white">Live Reports</h1>
            <p className="mt-2 text-sm text-slate-400">Real-time data from the society database, generated {reportDate}.</p>
          </div>
          <button onClick={() => router.back()} className="self-start border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-teal-400 hover:text-white">Back</button>
        </div>

        <div className="flex flex-wrap gap-3 print:hidden">
          <button onClick={() => window.print()} className="rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-teal-400">Print Student Data</button>
          <button onClick={exportToExcel} className="rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-4 py-2.5 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/25">Export Excel</button>
          <button onClick={exportToPDF} className="rounded-lg border border-rose-400/40 bg-rose-500/15 px-4 py-2.5 text-sm font-semibold text-rose-200 hover:bg-rose-500/25">Export PDF</button>
        </div>

        <section className="grid grid-cols-2 gap-4 lg:grid-cols-6 print:grid-cols-6">
          {[['Total Students', users.length, 'blue'], ['Verified Students', verifiedCount, 'green'], ['Pending Approval', pendingCount, 'amber'], ['Events', events.length, 'teal'], ['Certificates', certificateCount, 'purple'], ['Notifications', notificationCount, 'rose']].map(([label, value, color]) => (
            <div key={String(label)} className={`rounded-lg border p-5 shadow-lg backdrop-blur-md print:border-slate-300 print:bg-white ${color === 'blue' ? 'border-blue-500/30 bg-gradient-to-br from-blue-600/20 to-blue-700/10' : color === 'green' ? 'border-green-500/30 bg-gradient-to-br from-green-600/20 to-green-700/10' : color === 'amber' ? 'border-amber-500/30 bg-gradient-to-br from-amber-600/20 to-amber-700/10' : color === 'teal' ? 'border-teal-500/30 bg-gradient-to-br from-teal-600/20 to-teal-700/10' : color === 'rose' ? 'border-rose-500/30 bg-gradient-to-br from-rose-600/20 to-rose-700/10' : 'border-purple-500/30 bg-gradient-to-br from-purple-600/20 to-purple-700/10'}`}>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400 print:text-slate-600">{label}</p>
              <p className="mt-3 text-3xl font-bold text-white print:text-black">{isLoading ? '--' : value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-6 shadow-lg backdrop-blur-md print:border-slate-300 print:bg-white print:p-0 print:shadow-none">
          <div className="mb-5 flex items-center justify-between print:mb-3">
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300 print:text-slate-600">Membership records</p><h2 className="mt-2 text-xl font-semibold text-white print:text-black">All Membership Records</h2></div>
            <p className="text-sm text-slate-400 print:text-slate-600">{filteredMemberRows.length} of {memberRows.length} records</p>
          </div>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row print:hidden">
            <label className="min-w-0 flex-1">
              <span className="sr-only">Search all member details</span>
              <input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search any member detail..." className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-400" />
            </label>
            <label>
              <span className="sr-only">Filter by year</span>
              <select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-white outline-none focus:border-sky-400 sm:w-48">
                <option value="all">All years</option>
                {yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </label>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse text-left text-sm print:min-w-0">
              <thead><tr className="border-b border-slate-700 text-xs uppercase tracking-wider text-slate-400 print:border-slate-300 print:text-slate-600"><th className="px-3 py-3 font-semibold">Profile</th>{memberColumns.map((heading) => <th key={heading} className="px-3 py-3 font-semibold">{heading}</th>)}</tr></thead>
              <tbody>{filteredMemberRows.map((member, index) => <tr key={String(member.id || index)} onClick={() => setSelectedMember(member)} className="cursor-pointer border-b border-slate-800/80 text-slate-300 transition-colors hover:bg-sky-500/10 print:border-slate-200 print:text-black"><td className="px-3 py-3 align-top"><MemberAvatar name={`${String(member.first_name ?? '')} ${String(member.last_name ?? '')}`} profileImage={String(member.student_photograph ?? '')} alt="Member profile" className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-sky-500/15 text-sm font-semibold text-sky-200" /></td>{memberColumns.map((column) => <td key={column} className="max-w-xs whitespace-pre-wrap px-3 py-3 align-top">{String(member[column] ?? '')}</td>)}</tr>)}</tbody>
            </table>
            {!isLoading && membersError && <p className="py-10 text-center text-sm text-rose-300 print:text-black">Unable to load member records: {membersError}</p>}
            {!isLoading && !membersError && filteredMemberRows.length === 0 && <p className="py-10 text-center text-sm text-slate-500 print:text-slate-600">No matching member records found.</p>}
          </div>
        </section>

        {selectedMember && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm print:hidden" role="dialog" aria-modal="true" aria-label="Membership record details">
            <button type="button" aria-label="Close member details" onClick={() => setSelectedMember(null)} className="absolute inset-0 cursor-default" />
            <aside className="relative z-10 flex h-full w-full max-w-xl origin-right animate-[report-drawer-in_220ms_ease-out] flex-col border-l border-slate-700 bg-slate-900 shadow-2xl shadow-black/40">
              <div className="flex items-start justify-between gap-4 border-b border-slate-700/70 px-6 py-5">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">Membership detail</p>
                  <h2 className="mt-2 truncate text-xl font-semibold text-white">{String(selectedMember.first_name || '')} {String(selectedMember.last_name || '')}</h2>
                </div>
                <button type="button" onClick={() => setSelectedMember(null)} aria-label="Close member details" className="rounded-lg border border-slate-700 p-2 text-xl leading-none text-slate-300 transition hover:border-sky-400 hover:text-white">&times;</button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <dl className="grid gap-4 sm:grid-cols-2">
                  {memberColumns.map((column) => (
                    <div key={column} className="min-w-0 border-b border-slate-800/80 pb-3">
                      <dt className="break-words text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{column.replaceAll('_', ' ')}</dt>
                      <dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-200">{String(selectedMember[column] ?? '') || 'Not provided'}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </aside>
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}
