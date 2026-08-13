'use client';

import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  user: any;
}

export default function Sidebar({ open, setOpen, user }: SidebarProps) {
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const menuItems = [
    { label: 'Dashboard', href: '/dashboard', icon: 'grid' },
    { label: 'Members', href: '/dashboard/members', icon: 'users', show: user.role === 'admin' || user.role === 'executive' },
    { label: 'Events', href: '/dashboard/events', icon: 'calendar', show: true },
    { label: 'Announcements', href: '/dashboard/announcements', icon: 'bell', show: true },
    { label: 'Certificates', href: '/dashboard/certificates', icon: 'award', show: user.role === 'member' },
    { label: 'Reports', href: '/dashboard/reports', icon: 'bar-chart', show: user.role === 'admin' || user.role === 'executive' },
    { label: 'Profile', href: '/dashboard/profile', icon: 'user', show: true },
  ];

  return (
    <>
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 sidebar-gradient transition-transform duration-300 md:relative md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold text-white">CSE Society</h1>
          <p className="text-xs text-slate-400 mt-1">{user.name}</p>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems
            .filter((item) => item.show !== false)
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition"
              >
                <span className="mr-3">{getIcon(item.icon)}</span>
                {item.label}
              </Link>
            ))}
        </nav>

        <div className="absolute bottom-6 left-4 right-4 space-y-2">
          <div className="px-4 py-3 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-xs text-slate-400">Role</p>
            <p className="text-sm font-medium text-white capitalize">{user.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        ></div>
      )}
    </>
  );
}

function getIcon(name: string) {
  switch (name) {
    case 'grid':
      return '📊';
    case 'users':
      return '👥';
    case 'calendar':
      return '📅';
    case 'bell':
      return '🔔';
    case 'award':
      return '🏆';
    case 'bar-chart':
      return '📈';
    case 'user':
      return '👤';
    default:
      return '•';
  }
}
