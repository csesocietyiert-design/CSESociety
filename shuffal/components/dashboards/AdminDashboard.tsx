'use client';

import { useEffect, useState } from 'react';
import { useUsers, useEvents, useNotifications, useNotificationHistory, useActivityLogs, Announcement } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminDashboard({ user }: any) {
  const router = useRouter();
  const { users, loading: usersLoading } = useUsers();
  const { events, loading: eventsLoading } = useEvents();
  const { notifications } = useNotifications(user?.id);
  const { notifications: notificationHistory, loading: notificationHistoryLoading } = useNotificationHistory();
  const { activityLogs, loading: logsLoading } = useActivityLogs();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeEvents: 0,
    pendingApprovals: 0,
    totalCertificates: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (!supabase) return;

        const usersResult = await supabase.from('users').select('id', { count: 'exact', head: true });
        const eventsResult = await supabase.from('events').select('id', { count: 'exact', head: true });
        const pendingResult = await supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_verified', false);
        const certificatesResult = await supabase.from('certificates').select('id', { count: 'exact', head: true });

        setPendingCount(pendingResult.count || 0);
        setStats({
          totalMembers: usersResult.count || 0,
          activeEvents: eventsResult.count || 0,
          pendingApprovals: pendingResult.count || 0,
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const getUserName = (id?: string | null) => {
    if (!id) return 'System';
    const matchedUser = users.find((member) => member.id === id);
    return matchedUser ? `${matchedUser.name} (${matchedUser.cse_id})` : 'Unknown user';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">Admin Dashboard</h2>
          <p className="text-slate-400 mt-2">CSE Society Management System</p>
        </div>
        <div className="text-sm text-slate-400">
          {new Date().toLocaleDateString('en-IN', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/dashboard/members">
          <div className="backdrop-blur-md bg-gradient-to-br from-blue-600/20 to-blue-700/10 border border-blue-500/30 rounded-lg p-6 hover:border-blue-400/50 transition-all duration-200 cursor-pointer hover:scale-105 transform">
            <p className="text-slate-400 text-sm font-medium mb-2">Total Members</p>
            <p className="text-4xl font-bold text-white">{stats.totalMembers}</p>
            <p className="text-xs text-blue-400 mt-2">Active in society</p>
          </div>
        </Link>

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
            <p className="text-4xl font-bold text-white">{stats.pendingApprovals}</p>
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 backdrop-blur-md bg-slate-900/40 border border-slate-700/50 rounded-lg p-6">
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

        <div className="backdrop-blur-md bg-slate-900/40 border border-slate-700/50 rounded-lg p-6">
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

      <section className="backdrop-blur-md bg-slate-900/40 border border-slate-700/50 rounded-lg p-6">
        <div className="flex flex-col gap-2 border-b border-slate-700/60 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">Communication audit</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Notification history</h3>
            <p className="mt-1 text-sm text-slate-500">Complete record of notifications sent and received by society members.</p>
          </div>
          <span className="text-xs text-slate-500">{notificationHistory.length} delivery records</span>
        </div>

        <div className="mt-4 overflow-x-auto">
          {notificationHistoryLoading ? (
            <p className="py-8 text-center text-sm text-slate-500">Loading notification history...</p>
          ) : notificationHistory.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No notifications have been recorded yet.</p>
          ) : (
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-slate-700/60 text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-3 py-3 font-medium">Notification</th>
                  <th className="px-3 py-3 font-medium">Sender</th>
                  <th className="px-3 py-3 font-medium">Recipient</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 text-right font-medium">Date and time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {notificationHistory.map((notification) => {
                  const isSentByAdmin = notification.sender_id === user?.id;
                  const isReceivedByAdmin = notification.user_id === user?.id;

                  return (
                    <tr key={notification.id} className="transition-colors hover:bg-slate-800/40">
                      <td className="max-w-[260px] px-3 py-4">
                        <p className="truncate text-sm font-medium text-slate-200">{notification.title}</p>
                        <p className="mt-1 truncate text-xs text-slate-500">{notification.message}</p>
                      </td>
                      <td className="px-3 py-4 text-sm text-slate-400">{getUserName(notification.sender_id)}</td>
                      <td className="px-3 py-4 text-sm text-slate-400">{getUserName(notification.user_id)}</td>
                      <td className="px-3 py-4">
                        <span className={`inline-flex items-center border px-2 py-1 text-xs font-medium ${isSentByAdmin ? 'border-sky-400/30 bg-sky-400/10 text-sky-300' : isReceivedByAdmin ? 'border-amber-400/30 bg-amber-400/10 text-amber-300' : notification.is_read ? 'border-teal-400/30 bg-teal-400/10 text-teal-300' : 'border-rose-400/30 bg-rose-400/10 text-rose-300'}`}>
                          {isSentByAdmin ? 'Sent' : isReceivedByAdmin ? 'Received' : notification.is_read ? 'Read' : 'Unread'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-right text-xs text-slate-500">{formatDateTime(notification.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <div className="backdrop-blur-md bg-slate-900/40 border border-slate-700/50 rounded-lg p-6">
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
        <div className="backdrop-blur-md bg-slate-900/40 border border-slate-700/50 rounded-lg p-6">
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
