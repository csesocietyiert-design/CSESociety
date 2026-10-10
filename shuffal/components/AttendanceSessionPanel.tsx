'use client';

import Link from 'next/link';
import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react';
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
  const canManage = Boolean(user && managerRoles.has(user.role));
  const isAdmin = user?.role === adminRole;
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
    if ((endpoint === 'scan' && !canManage) || (endpoint === 'manual' && !isAdmin) || processingScan.current) return;
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
  }, [canManage, isAdmin, sessionId]);

  const markAttendanceFromQr = useCallback((qrCode: string) => {
    if (canManage) void submitCheckIn('scan', qrCode);
  }, [canManage, submitCheckIn]);

  const handleManualSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (manualCode.trim() && isAdmin) void submitCheckIn('manual', manualCode.trim());
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

      {(canManage || isAdmin) && (
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
          {isAdmin && (
          <div className="rounded-2xl border border-slate-700/70 bg-slate-900/60 p-5">
            <h2 className="text-lg font-semibold text-white">Manual check-in</h2>
            <p className="mt-1 text-sm text-slate-400">Admin-only check-in for cases where scanning is unavailable.</p>
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
            <p className="mt-1 text-sm text-slate-400">This list refreshes automatically.</p>
          </div>
          <span className="rounded-full bg-blue-500/15 px-3 py-1 text-sm font-medium text-blue-200">{attendees.length}</span>
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
