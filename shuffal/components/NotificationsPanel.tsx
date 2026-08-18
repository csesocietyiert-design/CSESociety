'use client';

import { useState, useEffect } from 'react';
import { useRealtimeNotifications, sendNotification } from '@/lib/hooks';
import { useUsers } from '@/lib/hooks';

export default function NotificationsPanel({ user }: any) {
  const { notifications, loading, markAllAsRead } = useRealtimeNotifications(user?.id);
  const { users } = useUsers();
  const [activeTab, setActiveTab] = useState<'history' | 'send'>('history');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRead, setFilterRead] = useState<'all' | 'unread' | 'read'>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showSendForm, setShowSendForm] = useState(false);
  const [sendData, setSendData] = useState({
    title: '',
    message: '',
    recipientType: 'specific' as 'all' | 'role' | 'year_representative' | 'specific',
    selectedRole: '',
    selectedYear: '',
    selectedMemberId: '',
  });
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');

  const filteredNotifications = notifications.filter((notif) => {
    const notificationDate = new Date(notif.created_at);
    const notificationDateKey = `${notificationDate.getFullYear()}-${String(notificationDate.getMonth() + 1).padStart(2, '0')}-${String(notificationDate.getDate()).padStart(2, '0')}`;
    const matchesDate =
      (!fromDate || notificationDateKey >= fromDate) &&
      (!toDate || notificationDateKey <= toDate);
    const matchesSearch =
      notif.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.message?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterRead === 'all' ||
      (filterRead === 'unread' && !notif.is_read) ||
      (filterRead === 'read' && notif.is_read);

    return matchesDate && matchesSearch && matchesFilter;
  });

  const unreadCount = notifications.filter((n) => n.user_id === user?.id && !n.is_read).length;

  const handleMarkAsRead = async () => {
    await markAllAsRead();
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendError('');
    setIsSending(true);

    try {
      if (!sendData.title || !sendData.message) {
        setSendError('Title and message are required');
        setIsSending(false);
        return;
      }

      let recipientIds: string[] = [];

      if (sendData.recipientType === 'all') {
        recipientIds = users.map((u) => u.id);
      } else if (sendData.recipientType === 'role') {
        recipientIds = users
          .filter((u) => u.role === sendData.selectedRole)
          .map((u) => u.id);
      } else if (sendData.recipientType === 'year_representative') {
        recipientIds = users
          .filter((u) => u.year?.toString() === sendData.selectedYear)
          .map((u) => u.id);
      } else if (sendData.recipientType === 'specific') {
        const selectedUser = users.find(
          (u) =>
            u.cse_id === sendData.selectedMemberId ||
            u.email === sendData.selectedMemberId
        );
        if (!selectedUser) {
          setSendError('Member not found');
          setIsSending(false);
          return;
        }
        recipientIds = [selectedUser.id];
      }

      if (recipientIds.length === 0) {
        setSendError('No recipients found');
        setIsSending(false);
        return;
      }

      const success = await sendNotification(
        sendData.title,
        sendData.message,
        user?.id,
        sendData.recipientType,
        recipientIds,
        sendData.selectedRole || undefined,
        sendData.selectedYear ? parseInt(sendData.selectedYear) : undefined
      );

      if (success) {
        setSendData({
          title: '',
          message: '',
          recipientType: 'specific',
          selectedRole: '',
          selectedYear: '',
          selectedMemberId: '',
        });
        setShowSendForm(false);
        setActiveTab('history');
      } else {
        setSendError('Failed to send notification');
      }
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSending(false);
    }
  };

  const canSendNotifications = user?.role !== 'member';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">Notifications</h2>
          <p className="text-slate-400 mt-2">Manage your notifications and messages</p>
        </div>
        {unreadCount > 0 && (
          <div className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg">
            <p className="text-blue-400 font-semibold">{unreadCount} Unread</p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            activeTab === 'history'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
          }`}
        >
          History
        </button>
        {canSendNotifications && (
          <button
            onClick={() => setActiveTab('send')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'send'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            Send Notification
          </button>
        )}
      </div>

      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="backdrop-blur-md bg-slate-900/40 border border-slate-700/50 rounded-lg p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              />
              <select
                value={filterRead}
                onChange={(e) => setFilterRead(e.target.value as any)}
                className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 transition"
              >
                <option value="all">All</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
              <input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 transition"
                aria-label="Notification start date"
              />
              <input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(event) => setToDate(event.target.value)}
                className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 transition"
                aria-label="Notification end date"
              />
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAsRead}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                >
                  Mark All as Read
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-10">
              <p className="text-slate-400">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="backdrop-blur-md bg-slate-900/40 border border-slate-700/50 rounded-lg p-12 text-center">
              <p className="text-slate-400 text-lg">No notifications found</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto text-left">
              {filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`backdrop-blur-md border rounded-lg p-4 transition-colors ${
                    notif.is_read
                      ? 'bg-slate-900/20 border-slate-700/30'
                      : 'bg-blue-900/20 border-blue-500/30'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-20 shrink-0 pt-0.5 text-xs leading-5 text-slate-500">
                      <time dateTime={notif.created_at}>
                        {new Date(notif.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </time>
                      {notif.sender_id === user?.id && (
                        <span className="block text-blue-400">Me</span>
                      )}
                      {notif.sender_id === user?.id && (
                        <span className="block truncate" title={notif.target_role || undefined}>
                          {users.find((member) => member.id === notif.user_id)?.cse_id || notif.target_role || 'Member'}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 border-l border-slate-700/70 pl-4">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-sm font-bold text-white">{notif.title}</h4>
                        {!notif.is_read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-400" />}
                      </div>
                      <p className="mt-1 text-sm font-normal leading-5 text-slate-300">{notif.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'send' && canSendNotifications && (
        <div className="backdrop-blur-md bg-slate-900/40 border border-slate-700/50 rounded-lg p-6">
          <form onSubmit={handleSendNotification} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
              <input
                type="text"
                value={sendData.title}
                onChange={(e) => setSendData({ ...sendData, title: e.target.value })}
                placeholder="Notification title"
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                disabled={isSending}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Message</label>
              <textarea
                value={sendData.message}
                onChange={(e) => setSendData({ ...sendData, message: e.target.value })}
                placeholder="Notification message"
                rows={4}
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition resize-none"
                disabled={isSending}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Send To</label>
              <select
                value={sendData.recipientType}
                onChange={(e) =>
                  setSendData({
                    ...sendData,
                    recipientType: e.target.value as any,
                    selectedRole: '',
                    selectedYear: '',
                    selectedMemberId: '',
                  })
                }
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition"
                disabled={isSending}
              >
                <option value="specific">Specific Member</option>
                <option value="all">All Members</option>
                <option value="role">Specific Role</option>
                <option value="year_representative">Year Representatives</option>
              </select>
            </div>

            {sendData.recipientType === 'role' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Select Role</label>
                <select
                  value={sendData.selectedRole}
                  onChange={(e) => setSendData({ ...sendData, selectedRole: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition"
                  disabled={isSending}
                >
                  <option value="">Choose a role</option>
                  <option value="admin">Admin</option>
                  <option value="executive">Executive</option>
                  <option value="faculty">Faculty</option>
                  <option value="member">Member</option>
                </select>
              </div>
            )}

            {sendData.recipientType === 'year_representative' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Select Year</label>
                <select
                  value={sendData.selectedYear}
                  onChange={(e) => setSendData({ ...sendData, selectedYear: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition"
                  disabled={isSending}
                >
                  <option value="">Choose a year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
            )}

            {sendData.recipientType === 'specific' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Member CSE ID or Email
                </label>
                <input
                  type="text"
                  value={sendData.selectedMemberId}
                  onChange={(e) => setSendData({ ...sendData, selectedMemberId: e.target.value })}
                  placeholder="23F2601 or email@example.com"
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  disabled={isSending}
                />
              </div>
            )}

            {sendError && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                <p className="text-red-400 text-sm">{sendError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSending}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition"
            >
              {isSending ? 'Sending...' : 'Send Notification'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
