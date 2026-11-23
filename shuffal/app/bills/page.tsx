import type { Metadata } from 'next';
import CircularPageHeader from '@/components/CircularPageHeader';
import PublicBillsPage from '@/components/PublicBillsPage';

export const metadata: Metadata = {
  title: 'Bills | CSE Society IERT',
  description: 'View approved CSE Society expense bills.',
};

export default function BillsPage() {
  return (
    <main className="w-full flex-1 bg-[#0b2740]">
      <CircularPageHeader
        title="Society Bills"
        description="Approved expense bills from the CSE Society, IERT Prayagraj."
      />
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
        <PublicBillsPage />
      </div>
    </main>
  );
}
