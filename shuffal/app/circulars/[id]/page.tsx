import type { Metadata } from 'next';
import Link from 'next/link';
import CircularPageHeader from '@/components/CircularPageHeader';
import PublicCircularDetail from '@/components/PublicCircularDetail';

export const metadata: Metadata = {
  title: 'Society Circular | CSE Society IERT',
  description: 'Official circular from the Computer Science & Engineering Society, IERT Prayagraj.',
};

type PageProps = { params: Promise<{ id: string }> };

export default async function CircularPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <main className="w-full flex-1 bg-[#0b2740]">
      <CircularPageHeader
        title="Official Circular"
        description="Published by the CSE Society, IERT Prayagraj."
      />
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
        <PublicCircularDetail id={id} />
        <p className="mt-8 text-sm text-slate-400">
          <Link href="/circulars" className="font-medium text-sky-300 underline underline-offset-4 hover:text-white">All circulars</Link>
        </p>
      </div>
    </main>
  );
}
