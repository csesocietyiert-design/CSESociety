'use client';

import { useState, useEffect } from 'react';
import { useRealtimeNotifications, sendNotification } from '@/lib/hooks';
import { useUsers } from '@/lib/hooks';

export default function NotificationsPanel({ user }: any) {
  const { notifications, loading, markAllAsRead } = useRealtimeNotifications(user?.id);
  const { users } = useUsers();
  const [activeTab, setActiveTab] = useState<'history' | 'send'>('history');
  const [messageMode, setMessageMode] = useState<'normal' | 'anonymous'>(user?.role === 'member' ? 'anonymous' : 'normal');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRead, setFilterRead] = useState<'all' | 'unread' | 'read'>('all');
  const [historyType, setHistoryType] = useState<'all' | 'normal' | 'anonymous'>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showSendForm, setShowSendForm] = useState(false);
  const [sendData, setSendData] = useState({
    title: '',
    message: '',
    recipientType: 'specific' as 'all' | 'role' | 'year_representative' | 'own_year' | 'specific',
    selectedRole: '',
    selectedYear: '',
    selectedMemberId: '',
    isAnonymous: false,
  });
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const isYearRepresentative = user?.role === 'year_representative' || user?.role === 'yearRep';

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
    const matchesHistoryType = historyType === 'all' || (historyType === 'anonymous' ? notif.is_anonymous : !notif.is_anonymous);

    return matchesDate && matchesSearch && matchesFilter && matchesHistoryType;
  });

  const unreadCount = notifications.filter((n) => n.user_id === user?.id && !n.is_read).length;

  const roleLabels: Record<string, string> = {
    vice_president: 'Vice President',
    general_secretary: 'General Secretary',
    treasurer: 'Treasurer',
    technical_secretary: 'Technical Secretary',
    cultural_secretary: 'Cultural Secretary',
  };

  const recipientLabel = (notification: typeof notifications[number]) => {
    if (!notification.sent_by_me && notification.sender_id !== user?.id) return 'Received';
    if (notification.recipient_type === 'all') return `All Members (${notification.recipient_count || 1})`;
    if (notification.recipient_type === 'role') return roleLabels[notification.target_role || ''] || 'Selected Role';
    if (notification.recipient_type === 'year_representative') return `Year ${notification.target_year || ''} Representatives`;
    return users.find((member) => member.id === notification.user_id)?.cse_id || 'Specific Member';
  };

  const senderLabel = (notification: typeof notifications[number]) => {
    if (notification.is_anonymous) return `Anonymous sender (Notification ID: ${notification.id})`;
    if (notification.sender_id === user?.id) return 'You';
    const sender = users.find((member) => member.id === notification.sender_id);
    return sender ? `${sender.name} (${sender.role.replaceAll('_', ' ')})` : 'Society';
  };

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

      if (messageMode === 'anonymous' || sendData.recipientType === 'own_year') {
        recipientIds = [];
      } else if (sendData.recipientType === 'all') {
        recipientIds = users.map((u) => u.id);
      } else if (sendData.recipientType === 'role') {
        recipientIds = users
          .filter((u) => u.role === sendData.selectedRole)
          .map((u) => u.id);
      } else if (sendData.recipientType === 'year_representative') {
        recipientIds = users
          .filter((u) => ['year_representative', 'yearRep'].includes(u.role) && u.year?.toString() === sendData.selectedYear)
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

      if (recipientIds.length === 0 && messageMode !== 'anonymous') {
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
        sendData.selectedYear ? parseInt(sendData.selectedYear) : undefined,
        messageMode === 'anonymous'
      );

      if (success) {
        setSendData({
          title: '',
          message: '',
          recipientType: 'specific',
          selectedRole: '',
          selectedYear: '',
          selectedMemberId: '',
          isAnonymous: false,
        });
        setMessageMode('normal');
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

  const isAdmin = user?.role === 'admin';
  const canSendAnonymously = Boolean(user?.role && !isAdmin);
  const canSendNormalNotification = Boolean(user?.role && user.role !== 'member');
  const canSendNotifications = Boolean(user?.role);

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
            Send Messages
          </button>
        )}
      </div>

      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="backdrop-blur-md bg-slate-900/40 border border-slate-700/50 rounded-lg p-4">
            <div className="mb-4 flex flex-wrap gap-2">
              {(['all', 'normal', 'anonymous'] as const).map((type) => <button key={type} type="button" onClick={() => setHistoryType(type)} className={`rounded-lg px-3 py-2 text-sm font-medium transition ${historyType === type ? 'bg-blue-600 text-white' : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'}`}>{type === 'all' ? 'All History' : type === 'normal' ? 'Normal Messages' : 'Anonymous Mail'}</button>)}
            </div>
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
              <div className="flex flex-wrap gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAsRead}
                    className="rounded-lg bg-green-600 px-4 py-2 text-white font-medium transition hover:bg-green-700"
                  >
                    Mark All as Read
                  </button>
                )}
              </div>
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
                        <span className="block text-blue-400">From: {senderLabel(notif)}</span>
                      )}
                      <span className="block truncate" title={notif.target_role || undefined}>
                        {notif.sender_id === user?.id ? `To: ${recipientLabel(notif)}` : `From: ${senderLabel(notif)}`}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 border-l border-slate-700/70 pl-4">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-sm font-bold text-white">{notif.title}</h4>
                        <div className="flex shrink-0 items-center gap-3">
                          {!notif.is_read && <span className="mt-1 h-2 w-2 rounded-full bg-blue-400" />}
                        </div>
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
          <div className="mb-5 flex flex-wrap gap-2">
            {canSendNormalNotification && <button type="button" onClick={() => setMessageMode('normal')} className={`rounded-lg px-4 py-2 text-sm font-medium transition ${messageMode === 'normal' ? 'bg-blue-600 text-white' : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'}`}>Normal Notification</button>}
            {canSendAnonymously && <button type="button" onClick={() => { setMessageMode('anonymous'); setSendData((current) => ({ ...current, recipientType: 'specific', selectedRole: '', selectedYear: '', selectedMemberId: '' })); }} className={`rounded-lg px-4 py-2 text-sm font-medium transition ${messageMode === 'anonymous' ? 'bg-amber-600 text-white' : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'}`}>Anonymous Mail</button>}
          </div>
          <p className={`mb-4 text-sm ${messageMode === 'anonymous' ? 'text-amber-200' : 'text-slate-400'}`}>{messageMode === 'anonymous' ? 'Your identity will be hidden. Anonymous mail can only be sent to one verified admin.' : 'Send a notification with your name and role visible to the recipient.'}</p>
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

            {messageMode === 'normal' && <div>
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
                {isAdmin && <option value="all">All Members</option>}
                {isYearRepresentative && <option value="own_year">My Year Members</option>}
                  <option value="role">Society Role</option>
                  <option value="year_representative">Year Representative</option>
              </select>
            </div>}

            {messageMode === 'normal' && sendData.recipientType === 'role' && (
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
                  <option value="vice_president">Vice President</option>
                  <option value="general_secretary">General Secretary</option>
                  <option value="treasurer">Treasurer</option>
                  <option value="technical_secretary">Technical Secretary</option>
                  <option value="cultural_secretary">Cultural Secretary</option>
                </select>
              </div>
            )}

            {messageMode === 'normal' && sendData.recipientType === 'year_representative' && (
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

            {messageMode === 'normal' && sendData.recipientType === 'specific' && (
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
