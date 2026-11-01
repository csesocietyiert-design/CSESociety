'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { getCircularDisplayDescription, getCircularDisplayTitle, type CircularRecord } from '@/lib/circulars';
import { fetchPublicCirculars } from '@/lib/circulars-client';

function formatUploadDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatCircularDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getTodayDate() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

export default function CircularManager() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [circularDate, setCircularDate] = useState(getTodayDate);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [publicAcknowledged, setPublicAcknowledged] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);
  const [circulars, setCirculars] = useState<CircularRecord[]>([]);
  const [listError, setListError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [actionError, setActionError] = useState('');
  const [activeAction, setActiveAction] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchPublicCirculars()
      .then((items) => { if (active) setCirculars(items); })
      .catch((loadError: unknown) => {
        if (active) setListError(loadError instanceof Error ? loadError.message : 'Could not load circulars');
      });
    return () => { active = false; };
  }, []);

  const selectFile = (selected: File | undefined) => {
    if (!selected) return;
    setFile(selected);
    setTitle('');
    setError('');
    setSuccess('');
  };

  const startEditing = (circular: CircularRecord) => {
    setEditingId(circular.id);
    setEditTitle(getCircularDisplayTitle(circular));
    setEditDate(circular.circular_date);
    setEditCategory(circular.category);
    setEditDescription(circular.description || '');
    setActionError('');
  };

  const saveCircularDetails = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingId) return;
    setActiveAction(editingId);
    setActionError('');
    try {
      const response = await fetch(`/api/circulars/${encodeURIComponent(editingId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          circularDate: editDate,
          category: editCategory,
          description: editDescription,
        }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Could not update circular');
      setCirculars(await fetchPublicCirculars());
      setEditingId(null);
    } catch (saveError) {
      setActionError(saveError instanceof Error ? saveError.message : 'Could not update circular');
    } finally {
      setActiveAction(null);
    }
  };

  const deleteCircular = async (circular: CircularRecord) => {
    if (!window.confirm(`Delete "${circular.title}"? This will remove its public link and PDF.`)) return;
    setActiveAction(circular.id);
    setActionError('');
    try {
      const response = await fetch(`/api/circulars/${encodeURIComponent(circular.id)}`, { method: 'DELETE' });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Could not delete circular');
      setCirculars((items) => items.filter((item) => item.id !== circular.id));
      if (editingId === circular.id) setEditingId(null);
    } catch (deleteError) {
      setActionError(deleteError instanceof Error ? deleteError.message : 'Could not delete circular');
    } finally {
      setActiveAction(null);
    }
  };

  const uploadCircular = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!file) {
      setError('Choose a PDF to upload.');
      return;
    }
    if (!publicAcknowledged) {
      setError('Confirm that this document is approved for public sharing.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.set('file', file);
      formData.set('title', title);
      formData.set('circularDate', circularDate);
      formData.set('category', category);
      formData.set('description', description);
      formData.set('publicAcknowledged', 'true');

      const response = await fetch('/api/circulars', { method: 'POST', body: formData });
      const payload = await response.json() as { circular?: CircularRecord; error?: string };
      if (!response.ok || !payload.circular) {
        throw new Error(payload.error || 'Could not publish circular');
      }

      const shareUrl = `${window.location.origin}/circular/${payload.circular.id}`;
      setSuccess(shareUrl);
      setCopied(false);
      setFile(null);
      setTitle('');
      setCircularDate(getTodayDate());
      setCategory('');
      setDescription('');
      setPublicAcknowledged(false);
      if (fileInput.current) fileInput.current.value = '';
      setCirculars(await fetchPublicCirculars());
      setListError('');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Could not publish circular');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">Admin tools</p>
        <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Manage circulars</h1>
        <p className="mt-2 text-slate-400">Upload an official PDF and create a unique public link for sharing.</p>
      </header>

      <form onSubmit={uploadCircular} className="space-y-5 rounded-2xl border border-slate-700 bg-slate-900/70 p-5 sm:p-7">
        <div>
          <label htmlFor="circular-title" className="mb-2 block text-sm font-medium text-slate-200">Circular title</label>
          <input
            id="circular-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={150}
            required
            className="min-h-11 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 text-white outline-none focus:border-blue-400"
            placeholder="Enter the official circular title (not the PDF filename)"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="circular-date" className="mb-2 block text-sm font-medium text-slate-200">Circular date</label>
            <input
              id="circular-date"
              type="date"
              value={circularDate}
              onChange={(event) => setCircularDate(event.target.value)}
              required
              className="min-h-11 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 text-white outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label htmlFor="circular-category" className="mb-2 block text-sm font-medium text-slate-200">Category</label>
            <input
              id="circular-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              maxLength={80}
              required
              className="min-h-11 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 text-white outline-none focus:border-blue-400"
              placeholder="e.g. Academic, Examination, Events"
            />
          </div>
        </div>

        <div>
          <label htmlFor="circular-description" className="mb-2 block text-sm font-medium text-slate-200">Description <span className="text-slate-500">(optional)</span></label>
          <textarea
            id="circular-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={1000}
            rows={3}
            className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white outline-none focus:border-blue-400"
            placeholder="Add a short description"
          />
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium text-slate-200">PDF document</span>
          <div
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              selectFile(event.dataTransfer.files[0]);
            }}
            className={`rounded-xl border border-dashed p-6 text-center transition ${dragging ? 'border-blue-300 bg-blue-500/10' : 'border-slate-600 bg-slate-950/50'}`}
          >
            <p className="text-sm text-slate-300">{file ? file.name : 'Drop a PDF here or choose a file'}</p>
            <p className="mt-1 text-xs text-slate-500">PDF only · maximum 4 MB</p>
            <input
              ref={fileInput}
              id="circular-file"
              type="file"
              accept="application/pdf,.pdf"
              required={!file}
              onChange={(event) => selectFile(event.target.files?.[0])}
              className="sr-only"
            />
            <button type="button" onClick={() => fileInput.current?.click()} className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:border-blue-300">
              Choose PDF
            </button>
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-lg border border-amber-400/30 bg-amber-400/5 p-4 text-sm leading-6 text-amber-100">
          <input
            type="checkbox"
            checked={publicAcknowledged}
            onChange={(event) => setPublicAcknowledged(event.target.checked)}
            className="mt-1 size-4 accent-amber-400"
          />
          <span>I confirm this PDF is approved for public sharing. It will appear on the public circulars page, and anyone can open or share it. Do not publish personal or confidential information.</span>
        </label>

        {error && <p role="alert" className="rounded-lg border border-rose-400/30 bg-rose-400/5 p-3 text-sm text-rose-200">{error}</p>}
        {success && (
          <div role="status" className="rounded-lg border border-emerald-400/30 bg-emerald-400/5 p-4 text-sm text-emerald-100">
            <p>Circular published successfully.</p>
            <a href={success} className="mt-2 block break-all font-medium underline underline-offset-4">
              {success}
            </a>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(success);
                  setCopied(true);
                } catch {
                  setError('Could not copy the link automatically. Select and copy the link above.');
                }
              }}
              className="mt-3 min-h-11 rounded-lg border border-emerald-300/30 px-4 py-2 font-medium hover:bg-emerald-300/10"
            >
              {copied ? 'Link copied' : 'Copy share link'}
            </button>
          </div>
        )}

        <button type="submit" disabled={uploading} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60">
          {uploading ? 'Uploading...' : 'Publish circular'}
        </button>
      </form>

      <section aria-labelledby="admin-circular-list">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="admin-circular-list" className="text-xl font-semibold text-white">Published circulars</h2>
          <Link href="/circulars" target="_blank" className="text-sm font-medium text-blue-300 underline underline-offset-4 hover:text-white">Open public circulars</Link>
        </div>
        {listError && <p role="alert" className="mt-4 text-sm text-rose-200">{listError}</p>}
        {actionError && <p role="alert" className="mt-4 rounded-lg border border-rose-400/30 bg-rose-400/5 p-3 text-sm text-rose-200">{actionError}</p>}
        {circulars.length === 0 && !listError ? (
          <p className="mt-4 rounded-xl border border-slate-700 bg-slate-900/70 p-5 text-sm text-slate-400">No circulars have been published yet.</p>
        ) : (
          <ol className="mt-4 space-y-3">
            {circulars.map((circular) => (
              <li key={circular.id} className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
                {editingId === circular.id ? (
                  <form onSubmit={saveCircularDetails} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="text-sm font-medium text-slate-200 sm:col-span-2">
                        Circular title
                        <input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} maxLength={150} required className="mt-2 min-h-11 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 text-white" />
                      </label>
                      <label className="text-sm font-medium text-slate-200">
                        Date
                        <input type="date" value={editDate} onChange={(event) => setEditDate(event.target.value)} required className="mt-2 min-h-11 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 text-white" />
                      </label>
                      <label className="text-sm font-medium text-slate-200">
                        Category
                        <input value={editCategory} onChange={(event) => setEditCategory(event.target.value)} maxLength={80} required className="mt-2 min-h-11 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 text-white" />
                      </label>
                      <label className="text-sm font-medium text-slate-200 sm:col-span-2">
                        Description
                        <textarea value={editDescription} onChange={(event) => setEditDescription(event.target.value)} maxLength={1000} rows={3} className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white" />
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="submit" disabled={activeAction === circular.id} className="min-h-10 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60">
                        {activeAction === circular.id ? 'Saving...' : 'Save details'}
                      </button>
                      <button type="button" onClick={() => setEditingId(null)} className="min-h-10 rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-400">
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="font-medium text-white [overflow-wrap:anywhere]">{getCircularDisplayTitle(circular)}</h3>
                      <p className="mt-1 text-xs text-slate-400">{formatCircularDate(circular.circular_date)} · {circular.category} · Uploaded {formatUploadDate(circular.uploaded_at)}</p>
                      {getCircularDisplayDescription(circular) && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-400">{getCircularDisplayDescription(circular)}</p>}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Link href={`/circular/${circular.id}`} target="_blank" className="inline-flex min-h-10 items-center rounded-lg border border-slate-600 px-3 py-2 text-sm font-medium text-blue-300 hover:border-blue-300">Open link</Link>
                      <button type="button" onClick={() => startEditing(circular)} disabled={activeAction === circular.id} className="min-h-10 rounded-lg border border-slate-600 px-3 py-2 text-sm font-medium text-slate-200 hover:border-slate-400 disabled:opacity-60">Edit</button>
                      <button type="button" onClick={() => void deleteCircular(circular)} disabled={activeAction === circular.id} className="min-h-10 rounded-lg border border-rose-400/40 px-3 py-2 text-sm font-medium text-rose-300 hover:border-rose-300 hover:bg-rose-400/10 disabled:opacity-60">
                        {activeAction === circular.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
