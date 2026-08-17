'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import Link from 'next/link';
import Image from 'next/image';

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentYear: '1',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-calculate admission year based on current year
  const admissionYear = useMemo(() => {
    const currentYearNum = parseInt(formData.currentYear, 10);
    return (2026 - currentYearNum + 1).toString();
  }, [formData.currentYear]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.name || !formData.email) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      await register({
        ...formData,
        admissionYear,
        currentYear: formData.currentYear,
      });
      // Redirect to pending verification page
      router.push('/register/pending');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
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
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-64px)] sm:min-h-[calc(100vh-70px)] max-w-[1360px] items-center justify-center px-4 sm:px-6 pt-16 sm:pt-[70px]">
        {/* Registration Card */}
        <div className="w-[90%] sm:w-full max-w-[420px] rounded-[20px] border border-white/10 bg-[#0d2237]/80 p-5 sm:p-6 md:p-8 shadow-[0_0_25px_rgba(0,0,0,0.25)] backdrop-blur-sm">
          <div className="mb-5 flex justify-center">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/5">
              <Image src="/logo.png" alt="CSE Society Logo" width={60} height={60} className="h-full w-full object-cover object-center scale-110" />
            </div>
          </div>

          <div className="mb-6 sm:mb-8 text-center">
            <h1 className="text-lg sm:text-2xl md:text-[2.2rem] font-bold leading-snug text-white break-words">
              𝑹𝒆𝒈𝒊𝒔𝒕𝒓𝒂𝒕𝒊𝒐𝒏 𝒇𝒐𝒓𝒎
            </h1>
            <p className="mt-2 text-xs sm:text-sm md:text-[1.05rem] text-slate-200 leading-relaxed">
              𝑱𝒐𝒊𝒏 𝑪𝑺𝑬 𝑺𝒐𝒄𝒊𝒆𝒕𝒚 𝒕𝒐𝒅𝒂𝒚
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label className="mb-2 block text-xs sm:text-sm font-medium text-white">
                𝑭𝒖𝒍𝒍 𝑵𝒂𝒎𝒆
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="𝒀𝒐𝒖𝒓 𝒇𝒖𝒍𝒍 𝒏𝒂𝒎𝒆"
                className="w-full rounded-md border border-white/10 bg-[#0a1e30] px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="mb-2 block text-xs sm:text-sm font-medium text-white">
                𝑬𝒎𝒂𝒊𝒍 𝑨𝒅𝒅𝒓𝒆𝒔𝒔
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="𝒚𝒐𝒖𝒓@𝒆𝒎𝒂𝒊𝒍.𝒄𝒐𝒎"
                className="w-full rounded-md border border-white/10 bg-[#0a1e30] px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">
                𝑪𝒖𝒓𝒓𝒆𝒏𝒕 𝑨𝒄𝒂𝒅𝒆𝒎𝒊𝒄 𝒀𝒆𝒂𝒓
              </label>
              <select
                name="currentYear"
                value={formData.currentYear}
                onChange={handleChange}
                className="w-full rounded-md border border-white/10 bg-[#0a1e30] px-4 py-3 text-base text-white focus:border-blue-400 focus:outline-none"
                required
                disabled={loading}
              >
                <option value="1">𝟏𝒔𝒕 𝒀𝒆𝒂𝒓</option>
                <option value="2">𝟐𝒏𝒅 𝒀𝒆𝒂𝒓</option>
                <option value="3">𝟑𝒓𝒅 𝒀𝒆𝒂𝒓</option>
                <option value="4">𝟒𝒕𝒉 𝒀𝒆𝒂𝒓</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">
                𝑨𝒅𝒎𝒊𝒔𝒔𝒊𝒐𝒏 𝒀𝒆𝒂𝒓 (𝑨𝒖𝒕𝒐)
              </label>
              <input
                type="text"
                value={admissionYear}
                placeholder="𝑨𝒖𝒕𝒐𝒎𝒂𝒕𝒊𝒄𝒂𝒍𝒍𝒚 𝒄𝒂𝒍𝒄𝒖𝒍𝒂𝒕𝒆𝒅"
                className="w-full rounded-md border border-white/10 bg-[#0a1e30] px-4 py-3 text-base text-slate-400 cursor-not-allowed"
                disabled
                readOnly
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">
                𝑷𝒂𝒔𝒔𝒘𝒐𝒓𝒅
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="𝑪𝒓𝒆𝒂𝒕𝒆 𝒂 𝒑𝒂𝒔𝒔𝒘𝒐𝒓𝒅 (𝒎𝒊𝒏 6 𝒄𝒉𝒂𝒓𝒂𝒄𝒕𝒆𝒓𝒔)"
                className="w-full rounded-md border border-white/10 bg-[#0a1e30] px-4 py-3 text-base text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">
                𝑪𝒐𝒏𝒇𝒊𝒓𝒎 𝑷𝒂𝒔𝒔𝒘𝒐𝒓𝒅
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="𝑪𝒐𝒏𝒇𝒊𝒓𝒎 𝒑𝒂𝒔𝒔𝒘𝒐𝒓𝒅"
                className="w-full rounded-md border border-white/10 bg-[#0a1e30] px-4 py-3 text-base text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-[#1c8df0] py-3 text-2xl font-bold text-white transition hover:bg-[#157fe4] disabled:opacity-50"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {loading ? '𝑪𝒓𝒆𝒂𝒕𝒊𝒏𝒈 𝒂𝒄𝒄𝒐𝒖𝒏𝒕...' : '𝑪𝒓𝒆𝒂𝒕𝒆 𝑨𝒄𝒄𝒐𝒖𝒏𝒕'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-base text-slate-200">
              𝑨𝒍𝒓𝒆𝒂𝒅𝒚 𝒉𝒂𝒗𝒆 𝒂𝒏 𝒂𝒄𝒄𝒐𝒖𝒏𝒕?{' '}
              <Link href="/login" className="font-medium text-[#6bb8ff] hover:text-white">
                𝑳𝒐𝒈𝒊𝒏 𝒉𝒆𝒓𝒆
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
