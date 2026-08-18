import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export interface User {
  id: string;
  cse_id: string;
  name: string;
  email: string;
  year: number;
  role: string;
  department: string;
  profile_image_url?: string;
  admission_year?: number;
  phone?: string;
  bio?: string;
  is_verified?: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  sender_id?: string | null;
  recipient_type?: string;
  target_role?: string | null;
  target_year?: number | null;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  capacity: number;
  registrations: number;
  status: string;
  created_by: string;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  created_by: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  description: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
}

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (!supabase) {
          setError('Supabase not configured');
          return;
        }
        const { data, error: err } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });

        if (err) throw err;
        setUsers(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return { users, loading, error };
}

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        if (!supabase) return;

        const { start, end } = getTodayRange();

        const { data, error: err } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .gte('created_at', start)
          .lt('created_at', end)
          .order('created_at', { ascending: false });

        if (err) throw err;
        setNotifications(data || []);

        const unread = (data || []).filter(n => !n.is_read).length;
        setUnreadCount(unread);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchNotifications();
    }
  }, [userId]);

  return { notifications, loading, unreadCount };
}

export function useNotificationHistory() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotificationHistory = async () => {
      try {
        if (!supabase) return;

        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setNotifications(data || []);
      } catch (error) {
        console.error('Error fetching notification history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotificationHistory();
  }, []);

  return { notifications, loading };
}

export function useNotificationsToday(userId: string) {
  const [todayNotifications, setTodayNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTodayNotifications = async () => {
      try {
        if (!supabase) return;

        // Fetch all notifications for user and filter in client-side
        const { data, error: err } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (err) {
          console.error('Error fetching notifications:', err);
          throw err;
        }

        // Filter for today's notifications client-side
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const filtered = (data || []).filter(notification => {
          const notifDate = new Date(notification.created_at);
          return notifDate >= today && notifDate < tomorrow;
        });

        setTodayNotifications(filtered);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-IN', { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit',
          hour12: false 
        });
        console.error(`[${timeStr} MAY 2026 TERM] Error fetching today notifications:`, errorMsg);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchTodayNotifications();
    }
  }, [userId]);

  return { todayNotifications, loading };
}

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        if (!supabase) return;

        const { data, error: err } = await supabase
          .from('events')
          .select('*');

        if (err) {
          console.error('Error fetching events:', err.message);
          setEvents([]);
          return;
        }
        setEvents(data || []);
      } catch (err) {
        console.error('Error fetching events:', err);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return { events, loading };
}

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        if (!supabase) return;

        const { data, error: err } = await supabase
          .from('announcements')
          .select('*')
          .order('created_at', { ascending: false });

        if (err) throw err;
        setAnnouncements(data || []);
      } catch (err) {
        console.error('Error fetching announcements:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  return { announcements, loading };
}

export function useActivityLogs() {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivityLogs = async () => {
      try {
        if (!supabase) return;

        const { data, error: err } = await supabase
          .from('activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (err) throw err;
        setActivityLogs(data || []);
      } catch (err) {
        console.error('Error fetching activity logs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivityLogs();
  }, []);

  return { activityLogs, loading };
}

export function useCertificates(userId: string) {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        if (!supabase) return;

        const { data, error: err } = await supabase
          .from('certificates')
          .select('*')
          .order('date', { ascending: false });

        if (err) throw err;
        setCertificates(data || []);
      } catch (err) {
        console.error('Error fetching certificates:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchCertificates();
    }
  }, [userId]);

  return { certificates, loading };
}

export function usePendingApprovals() {
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPendingUsers = async () => {
      try {
        if (!supabase) return;

        const { data, error: err } = await supabase
          .from('users')
          .select('*')
          .eq('is_verified', false)
          .order('created_at', { ascending: false });

        if (err) throw err;
        setPendingUsers(data || []);
      } catch (err) {
        console.error('Error fetching pending approvals:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingUsers();
  }, []);

  return { pendingUsers, loading };
}

export function useRealtimeNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !supabase) return;

    const fetchInitial = async () => {
      try {
        const { start, end } = getTodayRange();
        const { data, error: err } = await supabase!
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .gte('created_at', start)
          .lt('created_at', end)
          .order('created_at', { ascending: false });

        if (err) throw err;
        setNotifications(data || []);
      } catch (err) {
        console.error('Error fetching initial notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitial();

    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);
    const midnightRefresh = window.setTimeout(fetchInitial, nextMidnight.getTime() - now.getTime());

    const channelName = `notifications:${userId}:${Date.now()}`;
    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          const notificationDate = new Date(payload.new?.created_at || payload.old?.created_at);
          const currentDay = new Date();
          const isCurrentDay = notificationDate.toDateString() === currentDay.toDateString();

          if (payload.eventType === 'INSERT') {
            if (isCurrentDay) {
              setNotifications((prev) => [payload.new, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            setNotifications((prev) => {
              if (!isCurrentDay) return prev.filter((notification) => notification.id !== payload.new.id);
              return prev.map((notification) => (notification.id === payload.new.id ? payload.new : notification));
            });
          } else if (payload.eventType === 'DELETE') {
            setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      window.clearTimeout(midnightRefresh);
      void supabase!.removeChannel(subscription);
    };
  }, [userId]);

  return { notifications, loading };
}

export function useUserSettings(userId: string) {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        if (!supabase || !userId) return;

        const { data, error: err } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (err && err.code !== 'PGRST116') throw err;
        setSettings(data || { theme: 'dark', notifications_enabled: true });
      } catch (err) {
        console.error('Error fetching user settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [userId]);

  return { settings, loading };
}

export async function updateUserSettings(userId: string, updates: any) {
  try {
    if (!supabase) return;

    const { error: err } = await supabase
      .from('user_settings')
      .update(updates)
      .eq('user_id', userId);

    if (err) throw err;
    return true;
  } catch (err) {
    console.error('Error updating user settings:', err);
    return false;
  }
}

export async function verifyUser(userId: string, verifiedBy: string) {
  try {
    if (!supabase) return false;

    const { error: err } = await supabase
      .from('users')
      .update({ is_verified: true, verified_at: new Date().toISOString(), verified_by: verifiedBy })
      .eq('id', userId);

    if (err) throw err;
    return true;
  } catch (err) {
    console.error('Error verifying user:', err);
    return false;
  }
}

export async function changeUserPassword(userId: string, newPasswordHash: string, changedBy: string) {
  try {
    if (!supabase) return false;

    const [userUpdate, logCreate] = await Promise.all([
      supabase
        .from('users')
        .update({ password_hash: newPasswordHash, updated_at: new Date().toISOString() })
        .eq('id', userId),
      supabase
        .from('password_change_logs')
        .insert({ user_id: userId, changed_by: changedBy })
    ]);

    if (userUpdate.error) throw userUpdate.error;
    if (logCreate.error) throw logCreate.error;

    return true;
  } catch (err) {
    console.error('Error changing user password:', err);
    return false;
  }
}

export async function sendNotification(
  title: string,
  message: string,
  senderId: string,
  recipientType: 'all' | 'role' | 'year_representative' | 'specific',
  recipientIds?: string[],
  targetRole?: string,
  targetYear?: number
) {
  try {
    if (!recipientIds || recipientIds.length === 0) return false;

    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        message,
        senderId,
        recipientType,
        recipientIds,
        targetRole,
        targetYear,
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      const message = payload?.error || 'Failed to send notification';
      console.error('Notification API rejected request:', payload);
      throw new Error(message);
    }

    return true;
  } catch (err) {
    console.error('Error sending notification:', err);
    return false;
  }
}

export async function markNotificationsAsRead(userId: string) {
  try {
    if (!supabase) return;

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
  } catch (err) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    });
    console.error(`[${timeStr} MAY 2026 TERM] Error marking notifications as read:`, err);
  }
}
