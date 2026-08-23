'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import LayoutWrapper from '@/components/LayoutWrapper';
import { useAuthStore } from '@/lib/store';
import { useEvents, useUsers } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';

type ReportStudent = {
  name: string;
  cse_id: string;
  email: string;
  year: string;
  role: string;
  department: string;
  status: string;
  joined: string;
};

export default function ReportsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const { users, loading: usersLoading } = useUsers();
  const { events, loading: eventsLoading } = useEvents();
  const [certificateCount, setCertificateCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }
    if (!['admin', 'faculty', 'executive'].includes(user.role)) {
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

  const studentRows = useMemo<ReportStudent[]>(() => users.map((student) => ({
    name: student.name || '',
    cse_id: student.cse_id || '',
    email: student.email || '',
    year: student.year ? `Year ${student.year}` : 'Not set',
    role: student.role || '',
    department: student.department || 'CSE',
    status: student.is_verified ? 'Verified' : 'Pending',
    joined: student.created_at ? new Date(student.created_at).toLocaleDateString('en-IN') : 'Not available',
  })), [users]);

  const verifiedCount = users.filter((student) => student.is_verified).length;
  const pendingCount = users.length - verifiedCount;
  const reportDate = new Date().toLocaleDateString('en-IN');
  const fileDate = new Date().toISOString().split('T')[0];

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(studentRows.map((student) => ({
      Name: student.name,
      'CSE ID': student.cse_id,
      Email: student.email,
      Year: student.year,
      Role: student.role,
      Department: student.department,
      Status: student.status,
      'Joined Date': student.joined,
    })));
    worksheet['!cols'] = [{ wch: 24 }, { wch: 14 }, { wch: 30 }, { wch: 12 }, { wch: 22 }, { wch: 20 }, { wch: 14 }, { wch: 16 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    XLSX.writeFile(workbook, `cse-society-students-${fileDate}.xlsx`);
  };

  const exportToPDF = () => {
    const pdf = new jsPDF({ orientation: 'landscape' });
    pdf.setFontSize(16);
    pdf.text('CSE Society Student Report', 14, 16);
    pdf.setFontSize(9);
    pdf.text(`Generated: ${reportDate} | Total students: ${studentRows.length}`, 14, 23);
    const headers = ['Name', 'CSE ID', 'Email', 'Year', 'Role', 'Department', 'Status'];
    const widths = [42, 24, 58, 20, 34, 38, 24];
    let y = 34;
    let x = 10;
    pdf.setFont('helvetica', 'bold');
    headers.forEach((header, index) => {
      pdf.text(header, x, y);
      x += widths[index];
    });
    pdf.setFont('helvetica', 'normal');
    y += 7;
    studentRows.forEach((student) => {
      if (y > 190) {
        pdf.addPage('landscape');
        y = 15;
      }
      x = 10;
      [student.name, student.cse_id, student.email, student.year, student.role, student.department, student.status].forEach((value, index) => {
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
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300 print:text-slate-600">Database records</p><h2 className="mt-2 text-xl font-semibold text-white print:text-black">All Students</h2></div>
            <p className="text-sm text-slate-400 print:text-slate-600">{studentRows.length} records</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse text-left text-sm print:min-w-0">
              <thead><tr className="border-b border-slate-700 text-xs uppercase tracking-wider text-slate-400 print:border-slate-300 print:text-slate-600">{['Name', 'CSE ID', 'Email', 'Year', 'Role', 'Department', 'Status', 'Joined'].map((heading) => <th key={heading} className="px-3 py-3 font-semibold">{heading}</th>)}</tr></thead>
              <tbody>{studentRows.map((student) => <tr key={`${student.cse_id}-${student.email}`} className="border-b border-slate-800/80 text-slate-300 print:border-slate-200 print:text-black"><td className="px-3 py-3 font-medium text-white print:text-black">{student.name}</td><td className="px-3 py-3 font-mono">{student.cse_id}</td><td className="px-3 py-3">{student.email}</td><td className="px-3 py-3">{student.year}</td><td className="px-3 py-3 capitalize">{student.role}</td><td className="px-3 py-3">{student.department}</td><td className="px-3 py-3">{student.status}</td><td className="px-3 py-3">{student.joined}</td></tr>)}</tbody>
            </table>
            {!isLoading && studentRows.length === 0 && <p className="py-10 text-center text-sm text-slate-500 print:text-slate-600">No student records found.</p>}
          </div>
        </section>
      </div>
    </LayoutWrapper>
  );
}
