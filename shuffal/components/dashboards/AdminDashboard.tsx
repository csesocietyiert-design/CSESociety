'use client';

import { useEffect, useState } from 'react';
import { useUsers, useEvents, useNotifications, useActivityLogs, Announcement } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminDashboard({ user }: any) {
  const router = useRouter();
  const { users, loading: usersLoading } = useUsers();
  const { events, loading: eventsLoading } = useEvents();
  const { notifications } = useNotifications(user?.id);
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
        if (!supabase) {
          console.error('Supabase not initialized');
          return;
        }

        console.log('Fetching dashboard stats...');

        const usersResult = await supabase.from('users').select('id', { count: 'exact', head: true });
        console.log('Users result:', usersResult);

        const eventsResult = await supabase.from('events').select('id', { count: 'exact', head: true });
        if (eventsResult.error) {
          console.warn('Could not fetch events count:', eventsResult.error.message);
        }
        console.log('Events result:', eventsResult);

        const pendingResult = await supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_verified', false);
        console.log('Pending result:', pendingResult);

        // Test if certificates table exists
        console.log('Attempting to fetch certificates...');
        const certificatesResult = await supabase.from('certificates').select('id', { count: 'exact', head: true });
        console.log('Certificates result:', certificatesResult);

        if (certificatesResult.error) {
          console.error('CERTIFICATE ERROR:', certificatesResult.error.message);
          console.error('Certificate table might not exist or missing permissions');
        }

        setPendingCount(pendingResult.count || 0);
        setStats({
          totalMembers: usersResult.count || 0,
          activeEvents: eventsResult.count || 0,
          pendingApprovals: pendingResult.count || 0,
          totalCertificates: certificatesResult.count || 0,
        });

        console.log('✅ Stats loaded:', {
          totalMembers: usersResult.count,
          activeEvents: eventsResult.count,
          pendingApprovals: pendingResult.count,
          totalCertificates: certificatesResult.count,
        });
      } catch (err) {
        console.error('❌ CRITICAL ERROR fetching stats:', err);
        console.error('Error details:', {
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : 'no stack',
        });
      }
    };

    fetchStats();

    // Set up real-time subscriptions to update stats when data changes
    if (!supabase) return;

    console.log('Setting up real-time subscriptions...');

    const certificatesSubscription = supabase
      .channel('certificates-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'certificates' },
        () => {
          console.log('Certificate changed, refetching stats...');
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
          console.log('Users changed, refetching stats...');
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
          console.log('Events changed, refetching stats...');
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
