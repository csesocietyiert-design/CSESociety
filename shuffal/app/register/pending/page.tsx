'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function PendingVerificationPage() {
  useEffect(() => {
    // Clear pending verification flag after a delay
    const timer = setTimeout(() => {
      localStorage.removeItem('pendingVerification');
    }, 30000); // Clear after 30 seconds

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background: 'linear-gradient(90deg, #020d1a 0%, #081d31 38%, #0d2945 100%)',
      }}
    >
      {/* Top Dark Strip */}
      <div className="fixed top-0 left-0 right-0 h-16 sm:h-[70px] bg-[#020f1d] border-b border-white/10 flex items-center px-4 sm:px-8 z-50">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="h-10 w-10 sm:h-12 sm:w-12 overflow-hidden rounded-full border border-white/20 bg-white/5 flex items-center justify-center">
            <Image src="/logo.png" alt="CSE Society Logo" width={36} height={36} className="h-full w-full object-cover object-center scale-110" />
          </div>
          <div>
            <h1 className="text-base sm:text-xl font-bold text-white leading-tight">CSE Society</h1>
            <p className="text-xs text-slate-400">IERT Portal</p>
          </div>
        </div>
      </div>

      <div className="blob-container">
        <div className="blob-1 amoeba-blob"></div>
        <div className="blob-2 amoeba-blob"></div>
        <div className="blob-3 amoeba-blob"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-64px)] sm:min-h-[calc(100vh-70px)] max-w-[1360px] items-center justify-center px-4 sm:px-6 pt-20 sm:pt-[90px]">
        {/* Pending Verification Card */}
        <div className="w-[90%] sm:w-full max-w-full sm:max-w-[500px] rounded-[20px] border border-white/10 bg-[#0d2237]/80 p-6 sm:p-8 shadow-[0_0_25px_rgba(0,0,0,0.25)] backdrop-blur-sm text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-14 w-14 sm:h-20 sm:w-20 items-center justify-center overflow-hidden rounded-full border border-yellow-400/30 bg-yellow-400/10">
              <span className="text-2xl sm:text-4xl">⏳</span>
            </div>
          </div>

          <h1 className="text-[2.2rem] font-bold leading-tight text-white mb-4">
            𝑹𝒆𝒈𝒊𝒔𝒕𝒓𝒂𝒕𝒊𝒐𝒏 𝑷𝒆𝒏𝒅𝒊𝒏𝒈
          </h1>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 mb-6">
            <p className="text-yellow-200 mb-4">
              𝒀𝒐𝒖𝒓 𝒂𝒄𝒄𝒐𝒖𝒏𝒕 𝒉𝒂𝒔 𝒃𝒆𝒆𝒏 𝒄𝒓𝒆𝒂𝒕𝒆𝒅 𝒔𝒖𝒄𝒄𝒆𝒔𝒔𝒇𝒖𝒍𝒍𝒚!
            </p>
            <p className="text-slate-300 text-sm leading-relaxed">
              𝒀𝒐𝒖𝒓 𝒂𝒄𝒄𝒐𝒖𝒏𝒕 𝒊𝒔 𝒏𝒐𝒘 𝒑𝒆𝒏𝒅𝒊𝒏𝒈 𝒂𝒑𝒑𝒓𝒐𝒗𝒂𝒍 𝒃𝒚 𝒂𝒏 𝒂𝒅𝒎𝒊𝒏𝒊𝒔𝒕𝒓𝒂𝒕𝒐𝒓. 𝒐𝒏𝒄𝒆 𝒕𝒉𝒆𝒚 𝒗𝒆𝒓𝒊𝒇𝒚 𝒚𝒐𝒖𝒓 𝒅𝒆𝒕𝒂𝒊𝒍𝒔, 𝒚𝒐𝒖 𝒘𝒊𝒍𝒍 𝒃𝒆 𝒂𝒃𝒍𝒆 𝒕𝒐 𝒍𝒐𝒈𝒊𝒏.
            </p>
          </div>

          <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 mb-6">
            <p className="text-slate-400 text-sm">
              ⏱️ 𝑻𝒚𝒑𝒊𝒄𝒂𝒍𝒍𝒚 𝒂𝒖𝒆𝒑𝒓𝒐𝒗𝒆𝒅 𝒘𝒊𝒕𝒉𝒊𝒏 24 𝒉𝒐𝒖𝒓𝒔
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-slate-300 text-sm mb-4">
              𝑷𝒍𝒆𝒂𝒔𝒆 𝒄𝒉𝒆𝒄𝒌 𝒚𝒐𝒖𝒓 𝒆𝒎𝒂𝒊𝒍 𝒇𝒐𝒓 𝒄𝒐𝒏𝒇𝒊𝒓𝒎𝒂𝒕𝒊𝒐𝒏
            </p>
            <Link
              href="/login"
              className="inline-block w-full px-6 py-3 bg-[#1c8df0] hover:bg-[#157fe4] text-white rounded-md font-bold text-xl transition"
            >
              𝑹𝒆𝒕𝒖𝒓𝒏 𝒕𝒐 𝑳𝒐𝒈𝒊𝒏
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
