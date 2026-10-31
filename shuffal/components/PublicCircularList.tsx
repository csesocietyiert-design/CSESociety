'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchPublicCirculars } from '@/lib/circulars-client';
import type { CircularRecord } from '@/lib/circulars';

const academicDocuments = [
  {
    title: 'Academic Calendar',
    description: 'View the academic calendar published for the department.',
    circular_date: '2026-08-25',
    category: 'Academic',
    href: '/homepage/academic-calendar.pdf',
  },
  {
    title: 'CSE Syllabus (AKTU)',
    description: 'View the Computer Science and Engineering syllabus.',
    circular_date: '2026-08-25',
    category: 'Academic',
    href: '/homepage/cse-syllabus-aktu.pdf',
  },
];

function formatUploadDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function PublicCircularList() {
  const [circulars, setCirculars] = useState<CircularRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    let active = true;
    fetchPublicCirculars()
      .then((items) => { if (active) setCirculars(items); })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load circulars');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const retryLoading = async () => {
    setLoading(true);
    setError('');
    try {
      setCirculars(await fetchPublicCirculars());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load circulars');
    } finally {
      setLoading(false);
    }
  };

  const filteredCirculars = circulars.filter((circular) => {
    const matchesSearch = `${circular.title} ${circular.description || ''} ${circular.category}`
      .toLocaleLowerCase()
      .includes(search.trim().toLocaleLowerCase());
    return matchesSearch && (!fromDate || circular.circular_date >= fromDate) && (!toDate || circular.circular_date <= toDate);
  });
  const filteredAcademicDocuments = academicDocuments.filter((document) =>
    `${document.title} ${document.description} ${document.category}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()) &&
    (!fromDate || document.circular_date >= fromDate) &&
    (!toDate || document.circular_date <= toDate)
  );

  if (loading) {
    return <p role="status" className="py-8 text-center text-slate-400">Loading circulars...</p>;
  }

  if (error) {
    return (
      <div className="py-8">
        <p role="alert" className="text-rose-200">{error}</p>
        <button type="button" onClick={() => void retryLoading()} className="mt-3 min-h-11 text-sm font-medium text-blue-300 underline underline-offset-4">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      <form className="grid gap-4 border-b border-[#25445b] py-6 sm:grid-cols-2 lg:grid-cols-[minmax(14rem,1.5fr)_minmax(10rem,1fr)_minmax(10rem,1fr)]" onSubmit={(event) => event.preventDefault()}>
        <label className="block text-sm font-medium text-slate-200">
          Search circulars
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search circulars and documents"
            className="mt-2 min-h-11 w-full rounded-lg border border-[#36546b] bg-[#071b2b] px-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300 focus:ring-2 focus:ring-sky-300/20"
          />
        </label>
        <label className="block text-sm font-medium text-slate-200">
          From date
          <input
            type="date"
            value={fromDate}
            max={toDate || undefined}
            onChange={(event) => setFromDate(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-lg border border-[#36546b] bg-[#071b2b] px-3 text-white outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-300/20"
          />
        </label>
        <label className="block text-sm font-medium text-slate-200">
          To date
          <input
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(event) => setToDate(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-lg border border-[#36546b] bg-[#071b2b] px-3 text-white outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-300/20"
          />
        </label>
      </form>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[42rem] border-collapse text-left">
          <caption className="sr-only">Published CSE Society circulars with upload dates and share links</caption>
          <thead>
            <tr className="border-y border-[#25445b] bg-[#071b2b] text-xs uppercase tracking-wider text-slate-200 sm:text-sm">
              <th scope="col" className="w-16 px-4 py-4 text-center font-semibold">No.</th>
              <th scope="col" className="px-4 py-4 font-semibold">Circular title</th>
              <th scope="col" className="w-40 px-4 py-4 font-semibold">Date</th>
              <th scope="col" className="w-40 px-4 py-4 font-semibold">Category</th>
              <th scope="col" className="w-40 px-4 py-4 text-center font-semibold">Document</th>
            </tr>
          </thead>
          <tbody>
            {filteredCirculars.map((circular, index) => (
              <tr key={circular.id} className="border-b border-[#25445b] transition-colors hover:bg-[#123653]">
                <td className="px-4 py-5 text-center text-sm text-slate-400">{index + 1}</td>
                <td className="px-4 py-5">
                  <Link href={`/circular/${circular.id}`} className="font-semibold text-slate-100 underline decoration-slate-400/40 underline-offset-4 transition hover:text-white hover:decoration-white">
                    {circular.title}
                  </Link>
                  {circular.description && <p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-slate-400">{circular.description}</p>}
                </td>
                <td className="px-4 py-5 text-sm text-slate-300">{formatUploadDate(circular.circular_date)}</td>
                <td className="px-4 py-5 text-sm text-slate-300">{circular.category}</td>
                <td className="px-4 py-5 text-center">
                  <Link
                    href={`/circular/${circular.id}`}
                    className="inline-flex min-h-10 items-center justify-center rounded-lg bg-gradient-to-r from-sky-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-950/30 transition hover:from-sky-500 hover:to-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
                  >
                    View PDF
                  </Link>
                </td>
              </tr>
            ))}
            {filteredAcademicDocuments.map((document, index) => (
              <tr key={document.href} className="border-b border-[#25445b] transition-colors hover:bg-[#123653]">
                <td className="px-4 py-5 text-center text-sm text-slate-400">{filteredCirculars.length + index + 1}</td>
                <td className="px-4 py-5">
                  <p className="font-semibold text-slate-100">{document.title}</p>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{document.description}</p>
                </td>
                <td className="px-4 py-5 text-sm text-slate-300">{formatUploadDate(document.circular_date)}</td>
                <td className="px-4 py-5 text-sm text-slate-300">{document.category}</td>
                <td className="px-4 py-5 text-center">
                  <a
                    href={document.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#52738c] px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-[#173c59] hover:text-white"
                  >
                    View PDF
                  </a>
                </td>
              </tr>
            ))}
            {filteredCirculars.length === 0 && filteredAcademicDocuments.length === 0 && (
              <tr>
                <td colSpan={5} className="border-b border-[#25445b] px-4 py-10 text-center text-slate-300">
                  {circulars.length === 0 && academicDocuments.length === 0
                    ? 'There are no circulars or documents published yet.'
                    : 'No circulars or documents match your search and date filters.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-right text-xs text-slate-500">
        Showing {filteredCirculars.length} circulars and {filteredAcademicDocuments.length} academic documents
      </p>
    </div>
  );
}
