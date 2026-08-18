'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { enableNotificationSound, useRealtimeNotifications } from '@/lib/hooks';

interface NavbarProps {
  user: any;
  onMenuClick: () => void;
}

export default function Navbar({ user, onMenuClick }: NavbarProps) {
  const router = useRouter();
  const { notifications, markAllAsRead } = useRealtimeNotifications(user?.id);
  const todayNotifications = notifications.filter((notification) => {
    const notificationDate = new Date(notification.created_at);
    const today = new Date();
    return notificationDate.getFullYear() === today.getFullYear() &&
      notificationDate.getMonth() === today.getMonth() &&
      notificationDate.getDate() === today.getDate();
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [profileImage, setProfileImage] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [notificationsAcknowledgedAt, setNotificationsAcknowledgedAt] = useState<string | null>(null);

  useEffect(() => {
    if (user?.profile_image_url) {
      setProfileImage(user.profile_image_url);
    }
  }, [user?.profile_image_url]);

  useEffect(() => {
    const unlockNotificationSound = () => enableNotificationSound();
    window.addEventListener('pointerdown', unlockNotificationSound, { once: true });
    window.addEventListener('keydown', unlockNotificationSound, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlockNotificationSound);
      window.removeEventListener('keydown', unlockNotificationSound);
    };
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false
      });
      const dateString = now.toLocaleDateString('en-IN', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      setCurrentTime(`${dateString} | ${timeString}`);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const todayUnreadCount = todayNotifications.filter(n => !n.is_read).length;
  const hasUnseenNotification = todayNotifications.some(
    (notification) => !notification.is_read && (!notificationsAcknowledgedAt || notification.created_at > notificationsAcknowledgedAt)
  );

  const handleNotificationToggle = async () => {
    enableNotificationSound();
    const openingNotifications = !showNotifications;
    setShowNotifications(openingNotifications);

    if (openingNotifications && todayUnreadCount > 0 && user?.id) {
      setNotificationsAcknowledgedAt(new Date().toISOString());
      await markAllAsRead();
    }
  };

  const handleProfileHover = () => {
    if (profileImage) {
      const newWindow = window.open('', '_blank', 'width=400,height=500');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>Profile</title>
              <style>
                body { margin: 0; padding: 0; background: #1a1a1a; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                img { max-width: 100%; max-height: 100%; border-radius: 8px; }
              </style>
            </head>
            <body>
              <img src="${profileImage}" alt="Profile">
            </body>
          </html>
        `);
      }
    }
  };

  return (
    <nav className="sticky top-0 z-40 px-6 py-4 backdrop-blur-md bg-slate-900/80 border-b border-slate-700/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 hover:bg-slate-800 rounded-lg transition text-slate-300 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 relative">
              <Image
                src="/logo.png"
                alt="CSE Society Logo"
                fill
                sizes="40px"
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">CSE Society</h1>
              <p className="text-xs text-slate-300">{user?.name || 'Member'}</p>
              <p className="text-[10px] text-slate-500">Society ID: {user?.cseId || user?.cse_id || 'Not available'}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          <div className="hidden sm:flex items-center px-3 sm:px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700 text-xs sm:text-sm">
            <span className="text-slate-400">
              {currentTime}
            </span>
          </div>

          <button 
            onClick={handleNotificationToggle}
            aria-label="Notifications"
            className="relative p-2 hover:bg-slate-800 rounded-lg transition group"
          >
            <svg className="w-6 h-6 text-slate-300 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {hasUnseenNotification && (
              <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[10px] font-bold leading-4 text-white ring-2 ring-slate-900">
                {todayUnreadCount}
              </span>
            )}

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-4 top-12">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-white font-semibold">Notification History</h3>
                  <span className="text-xs text-slate-500">{notifications.length} total</span>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto text-left">
                  {notifications.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-4">No notifications</p>
                  ) : (
                    notifications.map((notif) => (
                      <div key={notif.id} className="flex items-start gap-3 border-b border-slate-700/60 px-2 py-3 last:border-0">
                        <time dateTime={notif.created_at} className="w-16 shrink-0 pt-0.5 text-left text-xs leading-4 text-slate-500">
                          {new Date(notif.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          <span className="block mt-1">
                            {new Date(notif.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </time>
                        <div className="min-w-0 flex-1 border-l border-slate-600 pl-3">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-white">{notif.title}</p>
                            <span className="text-[10px] text-slate-500">
                              {notif.sender_id === user?.id ? 'Sent' : 'Received'}
                            </span>
                          </div>
                          <p className="mt-1 text-xs font-normal leading-5 text-slate-300">{notif.message}</p>
                          <p className="mt-1 text-[10px] text-slate-500">
                            {notif.sender_id === user?.id ? `To ${notif.target_role || 'member'}` : 'From society'}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </button>

          <button
            onMouseEnter={handleProfileHover}
            className="relative group"
          >
            {profileImage ? (
              <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-slate-600 group-hover:border-blue-500 transition cursor-pointer">
                <Image
                  src={profileImage}
                  alt="Profile"
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold group-hover:ring-2 group-hover:ring-blue-400 transition">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
