'use client';

import { useRouter } from 'next/navigation';

interface NavbarProps {
  user: any;
  onMenuClick: () => void;
}

export default function Navbar({ user, onMenuClick }: NavbarProps) {
  const router = useRouter();

  return (
    <nav className="nav-gradient sticky top-0 z-40 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 hover:bg-slate-800 rounded-lg transition text-slate-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
            <span className="text-sm text-slate-400">Welcome, </span>
            <span className="text-sm font-medium text-white ml-1">{user.name}</span>
          </div>

          <button className="relative p-2 hover:bg-slate-800 rounded-lg transition">
            <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>

          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
            {user.name.charAt(0)}
          </div>
        </div>
      </div>
    </nav>
  );
}
