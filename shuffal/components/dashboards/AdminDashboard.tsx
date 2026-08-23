'use client';

import { useEffect, useRef, useState } from 'react';
import { useUsers, useEvents, useRealtimeNotifications, useNotificationHistory, useActivityLogs, Announcement } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminPasswordManager from '@/components/AdminPasswordManager';

type PendingEvent = {
  id: string;
  title: string;
  caption?: string | null;
  event_type?: 'cultural' | 'technical' | 'general';
  start_date: string;
};

export default function AdminDashboard({ user }: any) {
  const router = useRouter();
  const [showPasswordManager, setShowPasswordManager] = useState(false);
  const totalMembersClickTimes = useRef<number[]>([]);
  const canManageMemberPasswords = String(user?.role || '').toLowerCase() === 'admin';
  const { users, loading: usersLoading } = useUsers();
  const { events, loading: eventsLoading } = useEvents();
  const { notifications } = useRealtimeNotifications(user?.id);
  const { notifications: notificationHistory } = useNotificationHistory();
  const { activityLogs, loading: logsLoading } = useActivityLogs();
  const todayNotifications = notificationHistory.filter((notification) => {
    const notificationDate = new Date(notification.created_at);
    const today = new Date();
    return notificationDate.getFullYear() === today.getFullYear() &&
      notificationDate.getMonth() === today.getMonth() &&
      notificationDate.getDate() === today.getDate();
  });
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [pendingEvents, setPendingEvents] = useState<PendingEvent[]>([]);
  const [eventApprovalConfirm, setEventApprovalConfirm] = useState<PendingEvent | null>(null);
  const [eventApprovalDecision, setEventApprovalDecision] = useState<'approved' | 'rejected'>('approved');
  const [eventApprovalAction, setEventApprovalAction] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeEvents: 0,
    pendingApprovals: 0,
    pendingEventApprovals: 0,
    totalCertificates: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (!supabase) return;

        const usersResult = await supabase.from('users').select('id', { count: 'exact', head: true });
        const eventsResult = await supabase.from('events').select('id', { count: 'exact', head: true }).eq('approval_status', 'approved');
        const pendingResult = await supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_verified', false);
        const pendingEventsResult = await supabase.from('events').select('id', { count: 'exact', head: true }).eq('approval_status', 'pending');
        const certificatesResult = await supabase.from('certificates').select('id', { count: 'exact', head: true });

        setPendingCount(pendingResult.count || 0);
        setStats({
          totalMembers: usersResult.count || 0,
          activeEvents: eventsResult.count || 0,
          pendingApprovals: pendingResult.count || 0,
          pendingEventApprovals: pendingEventsResult.count || 0,
          totalCertificates: certificatesResult.count || 0,
        });
      } catch (err) {
        // Silently fail
      }
    };

    fetchStats();

    // Set up real-time subscriptions to update stats when data changes
    if (!supabase) return;

    const certificatesSubscription = supabase
      .channel('certificates-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'certificates' },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    const usersSubscription = supabase
      .channel('users-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    const eventsSubscription = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      certificatesSubscription.unsubscribe();
      usersSubscription.unsubscribe();
      eventsSubscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const loadPendingEvents = async () => {
      const response = await fetch('/api/admin/event-approvals');
      const payload = await response.json();
      if (response.ok) setPendingEvents(payload.events || []);
    };
    if (user?.role === 'admin') loadPendingEvents();
  }, [user?.role]);

  const reviewPendingEvent = async () => {
    if (!eventApprovalConfirm) return;
    setEventApprovalAction(eventApprovalConfirm.id);
    try {
      const response = await fetch('/api/admin/event-approvals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: eventApprovalConfirm.id, decision: eventApprovalDecision }),
      });
      if (response.ok) setPendingEvents((current) => current.filter((event) => event.id !== eventApprovalConfirm.id));
    } finally {
      setEventApprovalAction(null);
      setEventApprovalConfirm(null);
    }
  };

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        if (!supabase) return;

        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) throw error;
        setAnnouncements(data || []);
      } catch (err) {
        console.error('Error fetching announcements:', err);
      }
    };

    fetchAnnouncements();
  }, []);

  const getEventStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'ongoing':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'completed':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleTotalMembersClick = () => {
    const now = Date.now();
    totalMembersClickTimes.current = [...totalMembersClickTimes.current.filter((time) => now - time < 3000), now];
    if (totalMembersClickTimes.current.length >= 8) {
      setShowPasswordManager(true);
      totalMembersClickTimes.current = [];
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-8">
      <section className="relative overflow-hidden rounded-lg border border-slate-700/70 bg-gradient-to-br from-blue-600/20 via-slate-900/70 to-teal-700/10 px-6 py-7 shadow-2xl shadow-black/20 backdrop-blur-md sm:px-8">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-[linear-gradient(120deg,transparent,rgba(45,212,191,0.08))]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">CSE Society Admin Portal</p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Admin Dashboard</h1>
            <p className="mt-2 text-sm leading-6 text-slate-300">Manage members, events, certificates, and society operations.</p>
          </div>
          <div className="border-t border-white/10 pt-4 text-right text-sm text-slate-400 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
            {new Date().toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="h-full backdrop-blur-md bg-gradient-to-br from-blue-600/20 to-blue-700/10 border border-blue-500/30 rounded-lg p-6">
            <p className="text-4xl font-bold text-white">{stats.totalMembers}</p>
            <button type="button" onClick={() => {
              if (canManageMemberPasswords) handleTotalMembersClick();
            }} className="mt-2 cursor-pointer select-none text-left text-sm font-medium text-blue-300 transition hover:text-blue-100">
              Total
            </button>
        </div>

        <Link href="/dashboard/events">
          <div className="backdrop-blur-md bg-gradient-to-br from-green-600/20 to-green-700/10 border border-green-500/30 rounded-lg p-6 hover:border-green-400/50 transition-all duration-200 cursor-pointer hover:scale-105 transform">
            <p className="text-slate-400 text-sm font-medium mb-2">Active Events</p>
            <p className="text-4xl font-bold text-white">{stats.activeEvents}</p>
            <p className="text-xs text-green-400 mt-2">Upcoming</p>
          </div>
        </Link>

        <Link href="/dashboard/approvals">
          <div className="backdrop-blur-md bg-gradient-to-br from-yellow-600/20 to-yellow-700/10 border border-yellow-500/30 rounded-lg p-6 hover:border-yellow-400/50 transition-all duration-200 cursor-pointer hover:scale-105 transform">
            <p className="text-slate-400 text-sm font-medium mb-2">Pending Approvals</p>
            <p className="text-4xl font-bold text-white">{stats.pendingApprovals + stats.pendingEventApprovals}</p>
            <p className="text-xs text-yellow-400 mt-2">Need review</p>
          </div>
        </Link>

        <Link href="/dashboard/certificates">
          <div className="backdrop-blur-md bg-gradient-to-br from-purple-600/20 to-purple-700/10 border border-purple-500/30 rounded-lg p-6 hover:border-purple-400/50 transition-all duration-200 cursor-pointer hover:scale-105 transform">
            <p className="text-slate-400 text-sm font-medium mb-2">Certificates</p>
            <p className="text-4xl font-bold text-white">{stats.totalCertificates}</p>
            <p className="text-xs text-purple-400 mt-2">Issued</p>
          </div>
        </Link>

        <Link href="/dashboard/resources">
          <div className="backdrop-blur-md bg-gradient-to-br from-teal-600/20 to-teal-700/10 border border-teal-500/30 rounded-lg p-6 hover:border-teal-400/50 transition-all duration-200 cursor-pointer hover:scale-105 transform">
            <p className="text-slate-400 text-sm font-medium mb-2">Resources</p>
            <p className="text-4xl font-bold text-white">View</p>
            <p className="text-xs text-teal-400 mt-2">Manage library</p>
          </div>
        </Link>
      </div>

      {pendingEvents.length > 0 && <section className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-6 shadow-lg shadow-black/10">
        <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-yellow-300">Needs review</p><h2 className="mt-2 text-xl font-semibold text-white">Pending Event Approvals</h2><p className="mt-1 text-sm text-yellow-100/70">Approve an event to publish it to all member dashboards.</p></div><span className="rounded-full border border-yellow-400/30 px-3 py-1 text-sm font-semibold text-yellow-200">{pendingEvents.length}</span></div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">{pendingEvents.map((event) => <article key={event.id} className="rounded-lg border border-yellow-500/25 bg-slate-950/35 p-5"><p className="text-xs uppercase tracking-wider text-yellow-300">{event.event_type === 'technical' ? 'Technical event' : 'Cultural event'} · {new Date(event.start_date).toLocaleDateString('en-IN')}</p><h3 className="mt-2 text-lg font-semibold text-white">{event.title}</h3>{event.caption && <p className="mt-2 text-sm text-slate-300">{event.caption}</p>}<div className="mt-4 flex gap-3"><button type="button" onClick={() => { setEventApprovalDecision('approved'); setEventApprovalConfirm(event); }} disabled={eventApprovalAction === event.id} className="flex-1 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50">Approve</button><button type="button" onClick={() => { setEventApprovalDecision('rejected'); setEventApprovalConfirm(event); }} disabled={eventApprovalAction === event.id} className="flex-1 rounded-lg border border-rose-400/40 px-3 py-2 text-sm font-semibold text-rose-300 hover:border-rose-300 disabled:opacity-50">Reject</button></div></article>)}</div>
      </section>}

      {eventApprovalConfirm && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"><div className="w-full max-w-md rounded-lg border border-yellow-500/50 bg-slate-900 p-6"><h3 className="text-xl font-bold text-white">Confirm {eventApprovalDecision === 'approved' ? 'Approval' : 'Rejection'}</h3><p className="mt-3 text-sm leading-6 text-slate-300">Are you sure you want to {eventApprovalDecision === 'approved' ? 'approve and publish' : 'reject'} <span className="font-semibold text-yellow-300">{eventApprovalConfirm.title}</span>?</p><div className="mt-6 flex gap-3"><button type="button" onClick={reviewPendingEvent} disabled={eventApprovalAction === eventApprovalConfirm.id} className="flex-1 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">Confirm</button><button type="button" onClick={() => setEventApprovalConfirm(null)} className="flex-1 rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300">Cancel</button></div></div></div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-lg border border-slate-700/50 bg-gradient-to-br from-slate-900/80 to-blue-950/30 p-6 shadow-lg shadow-black/10 backdrop-blur-md">
          <h3 className="text-lg font-bold text-white mb-4">Recent Activities</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {logsLoading ? (
              <p className="text-slate-400 text-center py-4">Loading activities...</p>
            ) : activityLogs.length === 0 ? (
              <p className="text-slate-400 text-center py-4">No recent activities</p>
            ) : (
              activityLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg hover:bg-slate-800/70 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-300">{log.action}</p>
                      {log.description && (
                        <p className="text-xs text-slate-500 mt-1">{log.description}</p>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 ml-2 whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-700/50 bg-gradient-to-br from-slate-900/80 to-teal-950/20 p-6 shadow-lg shadow-black/10 backdrop-blur-md">
          <h3 className="text-lg font-bold text-white mb-4">Quick Stats</h3>
          <div className="space-y-3">
            <div className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg">
              <p className="text-xs text-slate-400">Total Users</p>
              <p className="text-2xl font-bold text-white mt-1">{users.length}</p>
            </div>
            <div className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg">
              <p className="text-xs text-slate-400">Active Events</p>
              <p className="text-2xl font-bold text-white mt-1">
                {events.filter(e => e.status === 'active' || e.status === 'ongoing').length}
              </p>
            </div>
            <div className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg">
              <p className="text-xs text-slate-400">Unread Notifications</p>
              <p className="text-2xl font-bold text-white mt-1">
                {notifications.filter(n => !n.is_read).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {canManageMemberPasswords && showPasswordManager && (
        <div onClick={() => setShowPasswordManager(false)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Change member password">
          <div onClick={(event) => event.stopPropagation()} className="max-h-[90vh] w-full max-w-3xl overflow-y-auto">
            <div className="mb-2 flex justify-end">
              <button type="button" onClick={() => setShowPasswordManager(false)} className="border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300 hover:text-white">Close</button>
            </div>
            <AdminPasswordManager adminId={user?.id} />
          </div>
        </div>
      )}

      <section className="rounded-lg border border-slate-700/50 bg-gradient-to-br from-slate-900/80 to-rose-950/20 p-6 shadow-lg shadow-black/10 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-300">Recent activity</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Notification history</h3>
          </div>
          <Link href="/dashboard/notifications" className="text-sm font-medium text-teal-300 hover:text-teal-200">View all</Link>
        </div>
        <div className="mt-4 divide-y divide-slate-800">
          {notificationHistory.length === 0 ? (
            <p className="py-4 text-sm text-slate-500">No notification history yet.</p>
          ) : notificationHistory.slice(0, 5).map((notification) => (
            <div key={notification.id} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
              <time dateTime={notification.created_at} className="w-20 shrink-0 text-xs text-slate-500">
                {new Date(notification.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
              </time>
              <div className="min-w-0 border-l border-slate-700/70 pl-4">
                <p className="text-sm font-bold text-white">{notification.title}</p>
                <p className="mt-1 text-sm leading-5 text-slate-300">{notification.message}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 border-t border-slate-700/60 pt-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white">Today&apos;s notifications</h4>
            <span className="text-xs text-slate-500">{todayNotifications.length} today</span>
          </div>
          {todayNotifications.length === 0 ? (
            <p className="py-4 text-sm text-slate-500">No notifications today.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {todayNotifications.slice(0, 5).map((notification) => (
                <div key={`today-${notification.id}`} className="flex items-start gap-3 py-2">
                  <time dateTime={notification.created_at} className="w-16 shrink-0 text-xs text-slate-500">
                    {new Date(notification.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </time>
                  <p className="min-w-0 truncate text-sm text-slate-300">{notification.title}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="rounded-lg border border-slate-700/50 bg-gradient-to-br from-slate-900/80 to-amber-950/20 p-6 shadow-lg shadow-black/10 backdrop-blur-md">
        <h3 className="text-lg font-bold text-white mb-4">Upcoming Events</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-80 overflow-y-auto">
          {eventsLoading ? (
            <p className="text-slate-400 col-span-full text-center py-4">Loading events...</p>
          ) : events.length === 0 ? (
            <p className="text-slate-400 col-span-full text-center py-4">No events found</p>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg hover:bg-slate-800/70 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-semibold text-white flex-1">{event.title}</h4>
                  <span className={`text-xs px-2 py-1 rounded border ${getEventStatusColor(event.status)}`}>
                    {event.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-2 line-clamp-2">{event.description}</p>
                {event.caption && event.caption !== event.description && <p className="text-xs text-slate-300 mb-2 line-clamp-2">{event.caption}</p>}
                {event.authority_letter_url && <a href={event.authority_letter_url} target="_blank" rel="noreferrer" className="text-xs font-medium text-teal-300 hover:text-teal-200">Open event document -&gt;</a>}
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{formatDate(event.start_date)}</span>
                  <span>{event.registrations}/{event.capacity} registered</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {announcements.length > 0 && (
        <div className="rounded-lg border border-slate-700/50 bg-gradient-to-br from-slate-900/80 to-purple-950/20 p-6 shadow-lg shadow-black/10 backdrop-blur-md">
          <h3 className="text-lg font-bold text-white mb-4">Latest Announcements</h3>
          <div className="space-y-3">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg hover:bg-slate-800/70 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-semibold text-white flex-1">{announcement.title}</h4>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      announcement.priority === 'high'
                        ? 'bg-red-500/20 text-red-400'
                        : announcement.priority === 'normal'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-slate-500/20 text-slate-400'
                    }`}
                  >
                    {announcement.priority}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mb-2">{announcement.content}</p>
                <p className="text-xs text-slate-500">{formatDate(announcement.created_at)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
