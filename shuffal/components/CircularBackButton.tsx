'use client';

import { useRouter } from 'next/navigation';

export default function CircularBackButton() {
  const router = useRouter();

  const goBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/circulars');
  };

  return (
    <button
      type="button"
      onClick={goBack}
      className="mb-6 inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#52738c] px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-sky-300 hover:bg-[#123653] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
      aria-label="Go back to previous page"
    >
      <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7 7-7-7 7-7" />
      </svg>
      Back
    </button>
  );
}
