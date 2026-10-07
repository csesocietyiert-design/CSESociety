'use client';

import { usePathname } from 'next/navigation';

export default function PortalLegalBar() {
  const pathname = usePathname();
  const hasFullFooter = pathname === '/login' || pathname.startsWith('/register');

  if (hasFullFooter) return null;

  return (
    <footer className="relative z-20 mt-auto w-full border-t border-white/10 bg-[#0b1935] px-4 py-3 text-slate-400 sm:px-8">
      <div className="mx-auto grid max-w-[1428px] grid-cols-1 items-center gap-2 text-center text-[11px] sm:text-xs lg:grid-cols-3 lg:text-left">
        <p>&copy; {new Date().getFullYear()} CSE Society, IERT Prayagraj. All Rights Reserved.</p>
        <p className="lg:text-center">Affiliated with <strong className="font-semibold text-slate-300">AKTU, Lucknow</strong> | Approved by <strong className="font-semibold text-slate-300">AICTE, New Delhi</strong></p>
        <p className="lg:text-right">Designed &amp; developed by <a href="https://www.linkedin.com/in/vibhanshu-tiwari-a08777289/" target="_blank" rel="noreferrer" className="font-semibold text-amber-300 underline decoration-amber-400/50 underline-offset-2 transition hover:text-amber-200">VBHT08</a></p>
      </div>
    </footer>
  );
}