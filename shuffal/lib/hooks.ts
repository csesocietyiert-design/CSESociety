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
  recipient_count?: number;
  is_anonymous?: boolean;
  sent_by_me?: boolean;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string | null;
  caption?: string | null;
  authority_letter_url?: string | null;
  start_date: string;
  end_date?: string | null;
  location?: string | null;
  capacity?: number | null;
  registrations?: number | null;
  status: string;
  approval_status?: 'pending' | 'approved' | 'rejected';
  event_type?: 'general' | 'cultural' | 'technical';
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

let notificationAudioContext: AudioContext | null = null;

function getNotificationAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextConstructor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextConstructor) return null;
  notificationAudioContext ??= new AudioContextConstructor();
  return notificationAudioContext;
}

export function enableNotificationSound() {
  const audioContext = getNotificationAudioContext();
  if (audioContext?.state === 'suspended') {
    void audioContext.resume();
  }
}

function playNotificationSound() {
  const audioContext = getNotificationAudioContext();
  if (!audioContext || audioContext.state !== 'running') return;

  try {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(740, now);
    oscillator.frequency.setValueAtTime(988, now + 0.1);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.3);
  } catch {
    // Browser audio restrictions should not affect notification delivery.
  }
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
        const { start, end } = getTodayRange();
        const response = await fetch('/api/notifications');
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error || 'Failed to fetch notifications');
        const data = (payload.notifications || []).filter((notification: Notification) => notification.created_at >= start && notification.created_at < end);
        setNotifications(data);

        const unread = (data || []).filter((n: Notification) => !n.is_read).length;
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
        const response = await fetch('/api/notifications');
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error || 'Failed to fetch notification history');
        setNotifications(payload.notifications || []);
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
        const response = await fetch('/api/notifications');
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error || 'Failed to fetch notifications');
        const data = payload.notifications || [];

        // Filter for today's notifications client-side
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const filtered = (data || []).filter((notification: Notification) => {
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
          .select('*')
          .eq('approval_status', 'approved');

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

  const removePendingUser = (userId: string) => {
    setPendingUsers((users) => users.filter((user) => user.id !== userId));
  };

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

  return { pendingUsers, loading, removePendingUser };
}

export function useRealtimeNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const markAllAsRead = async () => {
    if (!userId) return;
    const success = await markNotificationsAsRead(userId);
    if (success) {
      setNotifications((currentNotifications) => currentNotifications.map((notification) => ({ ...notification, is_read: true })));
    }
  };

  useEffect(() => {
    if (!userId) return;

    const fetchInitial = async () => {
      try {
        const response = await fetch('/api/notifications');
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error || 'Failed to fetch notifications');
        setNotifications(payload.notifications || []);
      } catch (err) {
        console.error('Error fetching initial notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitial();

    const refreshInterval = window.setInterval(fetchInitial, 30000);

    return () => {
      window.clearInterval(refreshInterval);
    };
  }, [userId]);

  return { notifications, loading, markAllAsRead };
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

        if (err && err.code !== 'PGRST116' && err.code !== 'PGRST205') throw err;
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
    const response = await fetch('/api/admin/approvals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, adminId: verifiedBy }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload?.error || 'Member approval failed');
    }

    return payload?.success === true;
  } catch (err) {
    console.error('Error verifying user:', err);
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
  targetYear?: number,
  isAnonymous = false
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
        isAnonymous,
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
    const response = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload?.error || 'Could not mark notifications as read');
    }
    return true;
  } catch (err) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    });
    console.error(`[${timeStr} MAY 2026 TERM] Error marking notifications as read:`, err);
    return false;
  }
}
