'use client';

import Link from 'next/link';
import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { useAuthStore } from '@/lib/store';

type AttendanceSession = {
  id: string;
  eventName: string;
  date: string;
  approvalStatus: 'pending' | 'approved';
};

type Attendee = {
  id: string;
  societyId: string;
  name: string;
  year: number | null;
  markedAt: string;
  markedByRole: string;
};

const managerRoles = new Set(['general_secretary', 'cultural_secretary', 'technical_secretary']);
const adminRole = 'admin';

async function getError(response: Response, fallback: string) {
  const body = await response.json().catch(() => null) as { error?: string } | null;
  return body?.error || fallback;
}

function roleName(role: string) {
  return role.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function getExportBaseName(eventName: string, date: string) {
  const safeEventName = eventName.trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
  return `${safeEventName || 'attendance'}-${date}`;
}

function downloadJson(filename: string, content: unknown) {
  const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function QrScanner({ onScan, onError }: { onScan: (value: string) => void; onError: (message: string) => void }) {
  const scanElementId = `attendance-qr-${useId().replaceAll(':', '')}`;
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onScanRef.current = onScan;
    onErrorRef.current = onError;
  }, [onScan, onError]);

  useEffect(() => {
    let disposed = false;
    let scanner: import('html5-qrcode').Html5Qrcode | null = null;
    let starting = true;

    const startScanner = async () => {
      const { Html5Qrcode } = await import('html5-qrcode');
      if (disposed) return;
      scanner = new Html5Qrcode(scanElementId);
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => onScanRef.current(decodedText),
        () => undefined,
      );
      starting = false;
      if (disposed && scanner.isScanning) {
        await scanner.stop();
        scanner.clear();
      }
    };

    void startScanner().catch((error: unknown) => {
      starting = false;
      if (!disposed) {
        onErrorRef.current(error instanceof Error ? error.message : 'Unable to start the camera scanner');
      }
    });

    return () => {
      disposed = true;
      if (!scanner) return;
      if (starting) return;
      if (scanner.isScanning) {
        void scanner.stop()
          .then(() => scanner?.clear())
          .catch((error: unknown) => console.warn('Unable to stop attendance QR scanner:', error));
      } else {
        scanner.clear();
      }
    };
  }, [scanElementId]);

  return <div id={scanElementId} className="overflow-hidden rounded-xl" />;
}

export default function AttendanceSessionPanel({ sessionId }: { sessionId: string }) {
  const user = useAuthStore((state) => state.user);
  const role = user?.role.toLowerCase();
  const canManage = Boolean(role && managerRoles.has(role));
  const isAdmin = role === adminRole;
  const canManualCheckIn = canManage || isAdmin;
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [scanBusy, setScanBusy] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const processingScan = useRef(false);
  const lastScan = useRef<{ value: string; at: number } | null>(null);

  const loadSession = useCallback(async () => {
    try {
      const response = await fetch(`/api/attendance/${sessionId}`);
      if (!response.ok) throw new Error(await getError(response, 'Failed to load attendance'));
      const data = await response.json() as { session: AttendanceSession; attendees: Attendee[] };
      setSession(data.session);
      setAttendees(data.attendees);
      setScanError(null);
    } catch (error) {
      setScanError(error instanceof Error ? error.message : 'Failed to load attendance');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadSession(), 0);
    const interval = window.setInterval(() => void loadSession(), 4000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [loadSession]);

  const submitCheckIn = useCallback(async (endpoint: 'scan' | 'manual', value: string) => {
    if ((endpoint === 'scan' && !canManage) || (endpoint === 'manual' && !canManualCheckIn) || processingScan.current) return;
    if (session?.approvalStatus === 'approved') {
      setScanError('This attendance session is approved and check-in is closed');
      return;
    }
    if (endpoint === 'scan' && lastScan.current?.value === value && Date.now() - lastScan.current.at < 5000) return;
    processingScan.current = true;
    if (endpoint === 'scan') lastScan.current = { value, at: Date.now() };
    setScanBusy(true);
    setScanError(null);
    setScanMessage(null);

    try {
      const response = await fetch(`/api/attendance/${sessionId}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(endpoint === 'scan' ? { qrCode: value } : { societyId: value }),
      });
      if (!response.ok) throw new Error(await getError(response, 'Unable to mark attendance'));
      const data = await response.json() as { attendee: Attendee };
      setAttendees((current) => [data.attendee, ...current.filter((attendee) => attendee.id !== data.attendee.id)]);
      setScanMessage(`${data.attendee.name} marked present`);
      setManualCode('');
    } catch (error) {
      setScanError(error instanceof Error ? error.message : 'Unable to mark attendance');
    } finally {
      setScanBusy(false);
      window.setTimeout(() => { processingScan.current = false; }, 1200);
    }
  }, [canManage, canManualCheckIn, session, sessionId]);

  const markAttendanceFromQr = useCallback((qrCode: string) => {
    if (canManage) void submitCheckIn('scan', qrCode);
  }, [canManage, submitCheckIn]);

  const handleManualSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (manualCode.trim() && canManualCheckIn) void submitCheckIn('manual', manualCode.trim());
  };

  const exportBaseName = getExportBaseName(session?.eventName || 'attendance', session?.date || '');
  const exportAttendees = attendees.map((attendee) => ({
    'Society ID': attendee.societyId,
    Name: attendee.name,
    Year: attendee.year || '',
    'Marked At': new Date(attendee.markedAt).toLocaleString(),
    'Marked By': roleName(attendee.markedByRole),
  }));

  const downloadAttendanceJson = () => {
    if (!session) return;
    downloadJson(`${exportBaseName}.json`, {
      eventName: session.eventName,
      date: session.date,
      approvalStatus: session.approvalStatus,
      attendeeCount: attendees.length,
      attendees: exportAttendees,
    });
  };

  const downloadAttendanceExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(exportAttendees);
    worksheet['!cols'] = [{ wch: 16 }, { wch: 28 }, { wch: 10 }, { wch: 24 }, { wch: 24 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
    XLSX.writeFile(workbook, `${exportBaseName}.xlsx`);
  };

  const downloadAttendancePdf = () => {
    if (!session) return;
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const columns = [14, 52, 116, 142];
    let y = 20;

    pdf.setFontSize(16);
    pdf.text(session.eventName, 14, y);
    y += 9;
    pdf.setFontSize(10);
    pdf.text(`Date: ${new Date(`${session.date}T00:00:00`).toLocaleDateString('en-GB')}`, 14, y);
    pdf.text(`Present: ${attendees.length}`, pageWidth - 14, y, { align: 'right' });
    y += 10;

    const drawTableHeader = () => {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Society ID', columns[0], y);
      pdf.text('Name', columns[1], y);
      pdf.text('Year', columns[2], y);
      pdf.text('Marked At', columns[3], y);
      pdf.setFont('helvetica', 'normal');
      y += 7;
    };

    drawTableHeader();
    for (const attendee of attendees) {
      if (y > pageHeight - 14) {
        pdf.addPage();
        y = 18;
        drawTableHeader();
      }
      pdf.text(attendee.societyId, columns[0], y);
      pdf.text(pdf.splitTextToSize(attendee.name, 58), columns[1], y);
      pdf.text(attendee.year ? String(attendee.year) : '-', columns[2], y);
      pdf.text(new Date(attendee.markedAt).toLocaleString('en-GB'), columns[3], y);
      y += 7;
    }

    pdf.save(`${exportBaseName}.pdf`);
  };

  if (isLoading) {
    return <p className="py-12 text-center text-slate-400">Loading attendance session...</p>;
  }
  if (!session) {
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-5 text-red-200">
        {scanError || 'Attendance session not found'}
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <Link href="/dashboard/attendance" className="inline-flex items-center gap-2 text-sm font-medium text-blue-300 hover:text-blue-200">
        ← All attendance sessions
      </Link>

      <header className="rounded-2xl border border-slate-700/70 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 p-6">
        <p className="text-sm uppercase tracking-[0.25em] text-blue-300">Attendance Session</p>
        <h1 className="mt-2 text-3xl font-bold text-white" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
          {session.eventName}
        </h1>
        <p className="mt-3 text-sm text-slate-300">
          {new Date(`${session.date}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
            session.approvalStatus === 'approved'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
          }`}>
            {session.approvalStatus === 'approved' ? 'Approved' : 'Pending approval'}
          </span>
          <p className="text-sm text-slate-400">{attendees.length} attendee{attendees.length === 1 ? '' : 's'} marked present</p>
        </div>
        {session.approvalStatus === 'approved' && (
          <p className="mt-3 text-sm text-slate-400">This session is approved. Its event name and date are locked.</p>
        )}
      </header>

      {session.approvalStatus === 'pending' && (canManage || isAdmin) && (
        <section className={`grid gap-5 ${canManage && isAdmin ? 'lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]' : ''}`}>
          {canManage && (
          <div className="rounded-2xl border border-slate-700/70 bg-slate-900/60 p-5">
            <h2 className="text-lg font-semibold text-white">Scan member QR code</h2>
            <p className="mt-1 text-sm text-slate-400">Allow camera access and hold the member&apos;s Society ID QR code in the frame.</p>
            <div className="mx-auto mt-5 max-w-sm overflow-hidden rounded-xl bg-black">
              <QrScanner
                onScan={markAttendanceFromQr}
                onError={(message) => setScanError(message)}
              />
            </div>
          </div>
          )}
          {canManualCheckIn && (
          <div className="rounded-2xl border border-slate-700/70 bg-slate-900/60 p-5">
            <h2 className="text-lg font-semibold text-white">Manual check-in</h2>
            <p className="mt-1 text-sm text-slate-400">Enter a member&apos;s Society ID when QR scanning is unavailable.</p>
            <form onSubmit={handleManualSubmit} className="mt-5 space-y-3">
              <label className="block text-sm font-medium text-slate-200">
                Society ID
                <input
                  required
                  value={manualCode}
                  onChange={(event) => setManualCode(event.target.value)}
                  placeholder="Enter Society ID"
                  className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-950/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none"
                />
              </label>
              <button
                type="submit"
                disabled={scanBusy || !manualCode.trim()}
                className="w-full rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {scanBusy ? 'Recording...' : 'Mark Present'}
              </button>
            </form>
          </div>
          )}
        </section>
      )}

      {scanError && (
        <div role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
          {scanError}
        </div>
      )}
      {scanMessage && (
        <div role="status" className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          {scanMessage}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/50">
        <div className="flex items-center justify-between border-b border-slate-700/70 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Marked attendees</h2>
            <p className="mt-1 text-sm text-slate-400">
              {session.approvalStatus === 'approved' ? 'Approved attendance record · check-in is closed.' : 'This list refreshes automatically.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="rounded-full bg-blue-500/15 px-3 py-1 text-sm font-medium text-blue-200">{attendees.length}</span>
            {session.approvalStatus === 'approved' && (
              <>
                <button type="button" onClick={downloadAttendancePdf} className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-blue-400 hover:text-white">PDF</button>
                <button type="button" onClick={downloadAttendanceJson} className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-blue-400 hover:text-white">JSON</button>
                <button type="button" onClick={downloadAttendanceExcel} className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-blue-400 hover:text-white">Excel</button>
              </>
            )}
          </div>
        </div>
        {attendees.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th scope="col" className="px-5 py-3">Society ID</th>
                  <th scope="col" className="px-5 py-3">Name</th>
                  <th scope="col" className="px-5 py-3">Year</th>
                  <th scope="col" className="px-5 py-3">Timestamp</th>
                  <th scope="col" className="px-5 py-3">Marked By (Role)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {attendees.map((attendee) => (
                  <tr key={attendee.id} className="hover:bg-slate-800/40">
                    <td className="px-5 py-4 font-mono text-blue-200">{attendee.societyId}</td>
                    <td className="px-5 py-4 font-medium text-white">{attendee.name}</td>
                    <td className="px-5 py-4">{attendee.year ? `Year ${attendee.year}` : '—'}</td>
                    <td className="px-5 py-4">{new Date(attendee.markedAt).toLocaleString()}</td>
                    <td className="px-5 py-4">{roleName(attendee.markedByRole)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-12 text-center text-sm text-slate-400">No attendees have been marked present yet.</p>
        )}
      </section>
    </section>
  );
}
