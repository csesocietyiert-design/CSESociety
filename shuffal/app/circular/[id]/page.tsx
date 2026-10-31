import type { Metadata } from 'next';
import Link from 'next/link';
import PublicCircularDetail from '@/components/PublicCircularDetail';

export const metadata: Metadata = {
  title: 'Society Circular | CSE Society IERT',
  description: 'Official circular from the Computer Science & Engineering Society, IERT Prayagraj.',
};

type PageProps = { params: Promise<{ id: string }> };

export default async function CircularPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-8 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">CSE Society · IERT Prayagraj</p>
      <PublicCircularDetail id={id} />
      <p className="mt-8 text-sm text-slate-400">
        <Link href="/circulars" className="font-medium text-blue-300 underline underline-offset-4 hover:text-white">All circulars</Link>
      </p>
    </main>
  );
}
