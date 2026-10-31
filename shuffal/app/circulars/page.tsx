import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Circulars | CSE Society IERT',
  description: 'Official circulars and academic documents from the CSE Society, IERT Prayagraj.',
};

const academicDocuments = [
  {
    title: 'Academic Calendar',
    description: 'View the academic calendar published for the department.',
    href: '/homepage/academic-calendar.pdf',
  },
  {
    title: 'CSE Syllabus (AKTU)',
    description: 'View the Computer Science and Engineering syllabus.',
    href: '/homepage/cse-syllabus-aktu.pdf',
  },
];

export default function CircularsPage() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-8 sm:py-16">
      <header className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">CSE Society · IERT Prayagraj</p>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Circulars &amp; Documents</h1>
        <p className="mt-3 max-w-2xl leading-7 text-slate-400">
          Find official society circulars and useful academic documents in one place.
        </p>
      </header>

      <section aria-labelledby="latest-circulars-heading">
        <h2 id="latest-circulars-heading" className="text-xl font-semibold text-white">Latest Circulars</h2>
        <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900/70 p-6">
          <p className="text-slate-300">There are no circulars published yet. Please check back for updates.</p>
        </div>
      </section>

      <section aria-labelledby="academic-documents-heading" className="mt-10">
        <h2 id="academic-documents-heading" className="text-xl font-semibold text-white">Academic Documents</h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {academicDocuments.map((document) => (
            <li key={document.href} className="rounded-xl border border-slate-700 bg-slate-900/70 p-5">
              <h3 className="font-semibold text-white">{document.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{document.description}</p>
              <a
                href={document.href}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-blue-400/30 px-4 py-2 text-sm font-medium text-blue-300 transition hover:border-blue-300 hover:bg-blue-500/10 hover:text-white"
              >
                View document
              </a>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-10 text-sm text-slate-400">
        <Link href="/login" className="font-medium text-blue-300 underline underline-offset-4 hover:text-white">
          Go to society login
        </Link>
      </p>
    </main>
  );
}
