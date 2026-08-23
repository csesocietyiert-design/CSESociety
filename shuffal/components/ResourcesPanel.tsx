'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';

type Resource = { id: string; title: string; caption?: string | null; description?: string | null; resource_url: string; category: string; created_at: string };

export default function ResourcesPanel() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const [resources, setResources] = useState<Resource[]>([]);
  const [form, setForm] = useState({ title: '', caption: '', resourceUrl: '', category: 'General' });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/resources').then((response) => response.json()).then((data) => setResources(data.resources || [])).catch(() => setError('Failed to load resources')).finally(() => setLoading(false));
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const response = await fetch('/api/resources', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, userId: user?.id }) });
    const data = await response.json();
    if (!response.ok) { setError(data.error || 'Failed to add resource'); return; }
    setResources((current) => [data.resource, ...current]);
    setForm({ title: '', caption: '', resourceUrl: '', category: 'General' });
    setShowForm(false);
  };

  const remove = async (id: string) => {
    const response = await fetch(`/api/resources/${id}`, { method: 'DELETE' });
    if (response.ok) setResources((current) => current.filter((resource) => resource.id !== id));
  };

  return <div className="mx-auto max-w-7xl space-y-6 pb-8">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm uppercase tracking-[0.3em] text-blue-300">CSE Society</p><h1 className="mt-2 text-3xl font-bold text-white">Resources</h1><p className="mt-2 text-sm text-slate-400">Shared society documents and useful links.</p></div>{isAdmin && <button type="button" onClick={() => setShowForm((value) => !value)} className="rounded-xl border border-blue-400/40 bg-blue-500/15 px-4 py-2.5 text-sm font-semibold text-blue-100">{showForm ? 'Close' : 'Add Resource'}</button>}</div>
    {error && <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>}
    {showForm && <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-slate-700/60 bg-slate-900/50 p-5 md:grid-cols-2"><input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Document title" className="rounded-lg border border-slate-600 bg-slate-950/60 px-3 py-2.5 text-sm text-white" /><input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Category" className="rounded-lg border border-slate-600 bg-slate-950/60 px-3 py-2.5 text-sm text-white" /><input required type="url" value={form.resourceUrl} onChange={(event) => setForm({ ...form, resourceUrl: event.target.value })} placeholder="Document link" className="rounded-lg border border-slate-600 bg-slate-950/60 px-3 py-2.5 text-sm text-white md:col-span-2" /><textarea value={form.caption} onChange={(event) => setForm({ ...form, caption: event.target.value })} placeholder="Caption (optional)" rows={3} className="rounded-lg border border-slate-600 bg-slate-950/60 px-3 py-2.5 text-sm text-white md:col-span-2" /><button type="submit" className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white md:col-span-2 md:justify-self-end">Publish Document</button></form>}
    {loading ? <p className="text-center text-slate-400">Loading resources...</p> : resources.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-slate-400">No resources yet.</div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{resources.map((resource) => <article key={resource.id} className="relative rounded-2xl border border-slate-700/70 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 p-5"><div className="flex items-start justify-between gap-3"><span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-300">{resource.category}</span>{isAdmin && <button type="button" onClick={() => remove(resource.id)} className="text-xs text-red-300">Delete</button>}</div><h2 className="mt-5 text-xl font-bold text-white">{resource.title}</h2>{(resource.caption || resource.description) && <p className="mt-2 text-sm leading-6 text-slate-400">{resource.caption || resource.description}</p>}<a href={resource.resource_url} target="_blank" rel="noreferrer" className="mt-5 inline-flex text-sm font-medium text-teal-300">Open document -&gt;</a></article>)}</div>}
  </div>;
}
