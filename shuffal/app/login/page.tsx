'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import Link from 'next/link';
import Image from 'next/image';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

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

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || typeof window === 'undefined') return;

    const googleScriptId = 'google-gsi-script';
    const initializeGoogle = () => {
      if (!(window as any).google?.accounts?.id) return;

      (window as any).google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleSuccess,
        ux_mode: 'popup',
      });
    };

    if (document.getElementById(googleScriptId)) {
      initializeGoogle();
      return;
    }

    const script = document.createElement('script');
    script.id = googleScriptId;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    document.body.appendChild(script);
  }, []);

  const handleGoogleSuccess = async (response: any) => {
    setGoogleLoading(true);
    setError('');

    try {
      const credential = response?.credential || response?.access_token;

      if (!credential) {
        throw new Error('Google sign-in failed. No credential was returned.');
      }

      const result = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential,
          access_token: response?.access_token,
          token: response?.access_token,
        }),
      });

      const data = await result.json().catch(() => ({}));

      if (!result.ok) {
        if (result.status === 404) {
          setError('Account Not Found. Your Google account is not registered with the CSE Society. Please register first or contact the CSE Society administration.');
          return;
        }

        throw new Error(data.error || 'Google authentication failed');
      }

      const { user } = data;

      useAuthStore.setState({
        user,
        isAuthenticated: true,
      });
      localStorage.setItem('authUser', JSON.stringify(user));

      router.push('/dashboard');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Google authentication failed'
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleClick = async () => {
    setError('');

    if (!GOOGLE_CLIENT_ID) {
      setError('Google Sign-In is not configured for this site.');
      return;
    }

    if (!(window as any).google?.accounts?.id) {
      setError('Google Sign-In is not available right now. Please try again.');
      return;
    }

    setGoogleLoading(true);

    (window as any).google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        setError('Google sign-in was cancelled or is unavailable. Please try again.');
        setGoogleLoading(false);
      }
    });
  };

  return (
    <div
      className="min-h-screen relative overflow-y-auto"
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
      <div className="relative z-10 mx-auto flex flex-col md:flex-row min-h-[calc(100vh-64px)] sm:min-h-[calc(100vh-70px)] max-w-[1360px] items-center justify-center gap-7 sm:gap-8 md:gap-12 lg:gap-48 px-3 sm:px-4 md:px-6 py-8 sm:py-12 pt-48 sm:pt-[200px] md:pt-[180px]">
        {/* Left - Login Card */}
        <div className="w-[90%] sm:w-full max-w-[420px] rounded-[20px] border border-white/10 bg-[#0d2237]/80 shadow-[0_0_25px_rgba(0,0,0,0.25)] backdrop-blur-sm order-1 md:order-1 relative pt-24 sm:pt-32 md:pt-40 px-5 sm:px-6 md:px-8 pb-5 sm:pb-6 md:pb-8">
          <div className="absolute -top-16 sm:-top-24 md:-top-32 left-1/2 transform -translate-x-1/2 flex justify-center">
            <Image src="/logo.png" alt="CSE Society Logo" width={140} height={140} className="h-32 sm:h-40 md:h-48 w-32 sm:w-40 md:w-48 object-contain" priority />
          </div>

          <div className="mb-4 sm:mb-6 md:mb-8 text-center">
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
              className="w-full rounded-md bg-[#1c8df0] py-2 sm:py-3 text-sm sm:text-base md:text-lg font-bold text-white transition hover:bg-[#157fe4] disabled:opacity-50 active:scale-95"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-5 flex items-center gap-3 text-slate-400">
            <div className="h-px flex-1 bg-slate-600" />
            <span className="text-[10px] sm:text-xs font-medium uppercase tracking-[0.35em]">OR</span>
            <div className="h-px flex-1 bg-slate-600" />
          </div>

          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={loading || googleLoading}
            className="mt-4 flex w-full items-center justify-center gap-3 rounded-md border border-white/10 bg-white/5 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
              <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.9-5.4 3.9-3.2 0-5.8-2.7-5.8-6s2.6-6 5.8-6c1.8 0 3 .8 3.7 1.5l2.5-2.4C16.7 3.2 14.7 2.4 12 2.4 6.9 2.4 2.8 6.5 2.8 11.6s4.1 9.2 9.2 9.2c5.3 0 8.8-3.7 8.8-8.9 0-.6-.1-1.2-.2-1.7H12Z" />
              <path fill="#34A853" d="M3.8 7.2l3.4 2.5c.9-1.7 2.8-2.9 4.8-2.9 1.8 0 3 .8 3.7 1.5l2.5-2.4C16.7 3.2 14.7 2.4 12 2.4c-3.6 0-6.7 2.1-8.2 5.1Z" />
              <path fill="#FBBC05" d="M3.8 16.9c1.5 2.9 4.6 5.1 8.2 5.1 2.4 0 4.4-.8 5.9-2.3l-2.9-2.4c-.8.6-1.9 1-3 1-2.3 0-4.3-1.6-5-3.7l-3.2 2.3Z" />
              <path fill="#4285F4" d="M12 21.9c2.8 0 5.2-.9 6.9-2.5l-3.2-2.5c-.9.6-2.1 1-3.7 1-3.2 0-5.4-2.2-5.4-4.9H.9v2.8c1.6 3.2 4.9 5.1 11.1 5.1Z" />
            </svg>
            <span>{googleLoading ? 'Connecting...' : 'Continue with Google'}</span>
          </button>

        </div>

        {/* Mobile Announcements - Shows below the card on mobile */}
        <div className="w-[85%] md:hidden order-2 mt-3 sm:mt-4 text-white text-left">
          <h2 className="text-xl sm:text-2xl font-medium text-white mb-3 sm:mb-4" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            Latest Updates /<br />
            Announcements
          </h2>
          <div className="space-y-3">
            <p className="text-xs sm:text-sm font-medium text-white">
              Registration Deadline for 2026 session
            </p>
            <div className="space-y-1 text-xs sm:text-sm text-white/90">
              <p>Form release date: 14 Aug 2026</p>
              <p>Deadline: 25 August 2026</p>
              <p>Verification: 26 August 2026</p>
            </div>
          </div>
        </div>

        {/* Right - Announcements (Responsive) */}
        <div className="w-full max-w-full md:max-w-[520px] hidden md:block order-2 md:order-2">
          <div className="text-white">
            <h2 className="mb-6 sm:mb-8 text-xl sm:text-2xl md:text-3xl font-medium leading-snug tracking-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
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
      </div>
    </div>
  );
}
