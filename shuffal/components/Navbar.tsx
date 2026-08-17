'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useNotificationsToday } from '@/lib/hooks';

interface NavbarProps {
  user: any;
  onMenuClick: () => void;
}

export default function Navbar({ user, onMenuClick }: NavbarProps) {
  const router = useRouter();
  const { todayNotifications } = useNotificationsToday(user?.id);
  const [showNotifications, setShowNotifications] = useState(false);
  const [profileImage, setProfileImage] = useState<string>('');

  useEffect(() => {
    if (user?.profile_image_url) {
      setProfileImage(user.profile_image_url);
    }
  }, [user?.profile_image_url]);

  const todayUnreadCount = todayNotifications.filter(n => !n.is_read).length;

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
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">CSE Society</h1>
              <p className="text-xs text-slate-400">Portal</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          <div className="hidden sm:flex items-center px-3 sm:px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700 text-xs sm:text-sm">
            <span className="text-slate-400">
              {new Date().toLocaleDateString('en-IN', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              })} | MAY 2026 TERM
            </span>
          </div>

          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-slate-800 rounded-lg transition group"
          >
            <svg className="w-6 h-6 text-slate-300 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {todayUnreadCount > 0 && (
              <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            )}

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-4 top-12">
                <h3 className="text-white font-semibold mb-3">Today's Notifications</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {todayNotifications.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-4">No notifications today</p>
                  ) : (
                    todayNotifications.map((notif) => (
                      <div key={notif.id} className="p-2 bg-slate-700/50 rounded border border-slate-600 text-sm">
                        <p className="text-white font-medium">{notif.title}</p>
                        <p className="text-slate-300 text-xs mt-1">{notif.message}</p>
                        <p className="text-slate-500 text-xs mt-1">
                          {new Date(notif.created_at).toLocaleTimeString()}
                        </p>
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
