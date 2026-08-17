'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(identifier, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (response: any) => {
    setGoogleLoading(true);
    setError('');

    try {
      // Send the token to the backend for verification
      const result = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: response.access_token }),
      });

      if (!result.ok) {
        const data = await result.json();
        throw new Error(data.error || 'Google authentication failed');
      }

      const data = await result.json();
      const { user } = data;

      // Store user session
      useAuthStore.setState({
        user,
        isAuthenticated: true,
      });
      localStorage.setItem('authUser', JSON.stringify(user));

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google authentication failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleClick = async () => {
    setGoogleLoading(true);
    setError('');

    try {
      // Check if google oauth library is available
      if (!(window as any).google?.accounts?.id) {
        throw new Error('Google Sign-In not available');
      }

      // Trigger Google Sign-In
      (window as any).google.accounts.id.renderButton(
        document.getElementById('google-btn'),
        {
          type: 'standard',
          size: 'large',
          theme: 'dark',
          text: 'signin_with',
        }
      );

      // Simulate click on the rendered button
      const googleBtn = document.querySelector('[data-google-btn]') as HTMLElement;
      googleBtn?.click();
    } catch (err) {
      setError('Google Sign-In setup failed');
    } finally {
      setGoogleLoading(false);
    }
  };

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
      <div className="relative z-10 mx-auto flex flex-col md:flex-row min-h-[calc(100vh-64px)] sm:min-h-[calc(100vh-70px)] max-w-[1360px] items-center justify-center gap-6 md:gap-12 lg:gap-48 px-3 sm:px-4 md:px-6 py-8 sm:py-12 pt-20 sm:pt-[90px]">
        
        {/* Left - Login Card */}
        <div className="w-full max-w-full sm:max-w-[420px] rounded-[20px] border border-white/10 bg-[#0d2237]/80 p-5 sm:p-6 md:p-8 shadow-[0_0_25px_rgba(0,0,0,0.25)] backdrop-blur-sm">
          <div className="mb-5 flex justify-center">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/5">
              <Image src="/logo.png" alt="CSE Society Logo" width={60} height={60} className="h-full w-full object-cover object-center scale-110" />
            </div>
          </div>

          <div className="mb-6 sm:mb-8 text-center">
            <h1 className="text-lg sm:text-2xl md:text-[2.2rem] font-bold leading-snug text-white break-words">
              𝗟𝗼𝗴𝗶𝗻 𝘁𝗼 𝗖𝗦𝗘 𝗦𝗼𝗰𝗶𝗲𝘁𝘆
            </h1>
            <p className="mt-2 text-xs sm:text-sm md:text-[1.05rem] text-slate-200 leading-relaxed">
              𝑪𝒐𝒏𝒕𝒊𝒏𝒖𝒆 𝒕𝒐 𝒚𝒐𝒖𝒓 𝑪𝑺𝑬 𝑺𝒐𝒄𝒊𝒆𝒕𝒚 𝒑𝒐𝒓𝒕𝒂𝒍
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
            <div>
              <label className="mb-2 block text-xs sm:text-sm font-medium text-white">
                𝑪𝑺𝑬 𝑰𝑫 | 𝑬𝒎𝒂𝒊𝒍 𝑰𝑫
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter your ID"
                className="w-full rounded-md border border-white/10 bg-[#0a1e30] px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="mb-2 block text-xs sm:text-sm font-medium text-white">
                𝑷𝒂𝒔𝒔𝒘𝒐𝒓𝒅
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-md border border-white/10 bg-[#0a1e30] px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 text-sm sm:text-base text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-slate-300 text-base sm:text-lg hover:text-white transition"
                  disabled={loading}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs sm:text-sm text-red-200 break-words">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-[#1c8df0] py-2 sm:py-3 text-base sm:text-xl md:text-2xl font-bold text-white transition hover:bg-[#157fe4] disabled:opacity-50 active:scale-95"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-xs sm:text-sm md:text-base text-slate-200">
              Don't have an account?{' '}
              <Link href="/register" className="font-medium text-[#6bb8ff] hover:text-white transition">
                Register here
              </Link>
            </p>
          </div>
        </div>

        {/* Right - Announcements (Responsive) */}
        <div className="w-full max-w-full md:max-w-[520px] md:hidden lg:block">
          <div className="text-white">
            <h2 className="mb-6 sm:mb-8 text-xl sm:text-2xl md:text-[2.2rem] font-medium leading-snug tracking-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              Latest Updates /<br />
              Announcements
            </h2>

            <div className="space-y-4 text-white/90">
              <div className="mt-2">
                <p className="text-sm sm:text-base md:text-[1.15rem] font-medium text-white">
                  Registration Deadline for 2026 session
                </p>
                <div className="mt-2 space-y-1 text-xs sm:text-sm md:text-[1.15rem] leading-relaxed text-white/90">
                  <p>Form release date: 14 Aug 2026</p>
                  <p>Deadline: 25 August 2026</p>
                  <p>Verification: 26 August 2026</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Announcements Card */}
        <div className="w-full md:hidden backdrop-blur-md bg-slate-900/40 border border-slate-700/50 rounded-lg p-4 sm:p-6 mt-6">
          <h2 className="text-lg sm:text-xl font-medium text-white mb-4" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            📢 Latest Updates
          </h2>
          <div className="space-y-3">
            <p className="text-xs sm:text-sm font-medium text-white">
              Registration Deadline for 2026 session
            </p>
            <div className="space-y-1 text-xs sm:text-sm text-white/80">
              <p>✓ Form release: 14 Aug 2026</p>
              <p>✓ Deadline: 25 Aug 2026</p>
              <p>✓ Verification: 26 Aug 2026</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
