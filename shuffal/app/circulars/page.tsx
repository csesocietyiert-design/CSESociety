import type { Metadata } from 'next';
import Link from 'next/link';
import PublicCircularList from '@/components/PublicCircularList';
import CircularPageHeader from '@/components/CircularPageHeader';

export const metadata: Metadata = {
  title: 'Circulars | CSE Society IERT',
  description: 'Official circulars and academic documents from the CSE Society, IERT Prayagraj.',
};

export default function CircularsPage() {
  return (
    <main className="w-full flex-1 bg-[#0b2740]">
      <CircularPageHeader
        title="Circulars"
        description="Official notices and documents from the CSE Society, IERT Prayagraj."
      />
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
        <section aria-labelledby="latest-circulars-heading">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#25445b] pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">Official notices</p>
              <h2 id="latest-circulars-heading" className="mt-1 text-2xl font-bold text-white">Latest Circulars</h2>
            </div>
            <Link href="/login" className="text-sm font-medium text-sky-300 underline underline-offset-4 transition hover:text-white">
              Society login
            </Link>
          </div>
          <PublicCircularList />
        </section>
      </div>
    </main>
  );
}
