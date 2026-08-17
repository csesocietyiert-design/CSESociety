'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EventsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold">Events</h1>
        </div>

        <div className="card-gradient rounded-lg p-8 text-center">
          <p className="text-slate-400 mb-4">Events page coming soon</p>
          <Link
            href="/dashboard/certificates"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            View Certificates
          </Link>
        </div>
      </div>
    </div>
  );
}
