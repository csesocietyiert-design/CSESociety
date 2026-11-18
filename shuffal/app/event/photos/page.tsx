'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { useAuthStore } from '@/lib/store';

interface EventPhoto {
  id: string;
  photo_url: string;
  caption: string | null;
  sort_order: number;
}

interface EventAlbum {
  id: string;
  event_name: string;
  event_date: string;
  description: string | null;
  cover_url: string | null;
  photos: EventPhoto[];
}

const emptyForm = {
  eventName: '',
  eventDate: '',
  description: '',
  photoUrls: '',
};

async function loadEventAlbums() {
  const response = await fetch('/api/event-photos');
  const payload = await response.json() as { albums?: EventAlbum[]; error?: string };
  if (!response.ok) throw new Error(payload.error || 'Could not load event photos');
  return payload.albums || [];
}

export default function EventPhotosPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const [albums, setAlbums] = useState<EventAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingAlbumId, setDeletingAlbumId] = useState<string | null>(null);
  const [editingAlbumId, setEditingAlbumId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);

  const isAdmin = Boolean(user && user.role.toLowerCase() === 'admin');

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated || !user) {
      router.replace('/login');
      return;
    }
    if (!isAdmin) {
      router.replace('/dashboard');
    }
  }, [hasHydrated, isAuthenticated, isAdmin, router, user]);

  useEffect(() => {
    if (!hasHydrated || !isAdmin) return;
    let active = true;
    loadEventAlbums()
      .then((loadedAlbums) => {
        if (active) setAlbums(loadedAlbums);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load event photos');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [hasHydrated, isAdmin]);

  if (!hasHydrated || !isAuthenticated || !user || !isAdmin) {
    return <div className="flex min-h-screen items-center justify-center text-slate-400">Checking admin access...</div>;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const photoUrls = form.photoUrls
        .split(/\r?\n|,/)
        .map((url) => url.trim())
        .filter(Boolean);
      const response = await fetch('/api/event-photos', {
        method: editingAlbumId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, photoUrls, albumId: editingAlbumId }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not save event photos');
      setForm({ ...emptyForm });
      setEditingAlbumId(null);
      setAlbums(await loadEventAlbums());
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not save event photos');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (album: EventAlbum) => {
    setEditingAlbumId(album.id);
    setForm({
      eventName: album.event_name,
      eventDate: album.event_date,
      description: album.description || '',
      photoUrls: album.photos.map((photo) => photo.photo_url).join('\n'),
    });
    setError('');
    document.getElementById('event-photo-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCancelEditing = () => {
    setEditingAlbumId(null);
    setForm({ ...emptyForm });
    setError('');
  };

  const handleDelete = async (album: EventAlbum) => {
    if (!window.confirm(`Delete "${album.event_name}" and all ${album.photos.length} event photos? This cannot be undone.`)) return;
    setDeletingAlbumId(album.id);
    setError('');
    try {
      const response = await fetch('/api/event-photos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ albumId: album.id }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not remove album');
      setAlbums((current) => current.filter((item) => item.id !== album.id));
      if (editingAlbumId === album.id) handleCancelEditing();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not remove album');
    } finally {
      setDeletingAlbumId(null);
    }
  };

  const getPhotoPreviewUrl = (url: string) => {
    const fileMatch = url.match(/(?:drive\.google\.com\/file\/d\/|[?&]id=)([^/?&]+)/);
    return fileMatch?.[1]
      ? `https://drive.google.com/thumbnail?id=${fileMatch[1]}&sz=w1200`
      : url;
  };

  return (
    <LayoutWrapper user={user}>
      <div className="mx-auto max-w-6xl space-y-6 pb-8">
        <div className="flex items-start gap-4">
          <button type="button" onClick={() => router.push('/dashboard/events')} className="rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm text-slate-300">Back</button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">Protected gallery</p>
            <h1 className="mt-1 text-3xl font-bold text-white">Event Photos</h1>
          </div>
        </div>

        <form id="event-photo-form" onSubmit={handleSubmit} className="scroll-mt-24 rounded-xl border border-cyan-400/20 bg-slate-900/70 p-6 shadow-2xl shadow-black/20">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-cyan-300">{editingAlbumId ? 'Edit event album' : 'Add event album'}</p>
            <h2 className="mt-1 text-xl font-semibold text-white">{editingAlbumId ? 'Update photo card' : 'Create photo card'}</h2>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-slate-300">
              Event name
              <input required value={form.eventName} onChange={(event) => setForm({ ...form, eventName: event.target.value })} placeholder="Event name" className="rounded-lg border border-slate-700 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-cyan-400" />
            </label>
            <label className="grid gap-2 text-sm text-slate-300">
              Event date
              <input required type="date" value={form.eventDate} onChange={(event) => setForm({ ...form, eventDate: event.target.value })} className="rounded-lg border border-slate-700 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-cyan-400" />
            </label>
            <label className="grid gap-2 text-sm text-slate-300 md:col-span-2">
              Description <span className="text-slate-500">(optional)</span>
              <input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Short event description" className="rounded-lg border border-slate-700 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-cyan-400" />
            </label>
            <label className="grid gap-2 text-sm text-slate-300 md:col-span-2">
              Drive photo links
              <textarea required value={form.photoUrls} onChange={(event) => setForm({ ...form, photoUrls: event.target.value })} rows={7} placeholder={'https://drive.google.com/file/d/.../view\nhttps://drive.google.com/file/d/.../view'} className="rounded-lg border border-slate-700 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-cyan-400" />
              <span className="text-xs text-slate-500">Add one Google Drive photo link per line or separate links with commas.</span>
            </label>
          </div>
          {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
          <div className="mt-5 flex flex-wrap gap-3">
            <button disabled={saving} type="submit" className="rounded-lg border border-cyan-300/30 bg-cyan-500/15 px-5 py-3 text-sm font-semibold text-cyan-200 disabled:opacity-50">
              {saving ? 'Saving...' : editingAlbumId ? 'Save Changes' : 'Add Event Photos'}
            </button>
            {editingAlbumId && (
              <button disabled={saving} type="button" onClick={handleCancelEditing} className="rounded-lg border border-slate-600 bg-slate-800 px-5 py-3 text-sm font-semibold text-slate-200 disabled:opacity-50">
                Cancel
              </button>
            )}
          </div>
        </form>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Published event albums</h2>
          {loading ? (
            <p className="text-sm text-slate-500">Loading photo cards...</p>
          ) : albums.length === 0 ? (
            <p className="rounded-lg border border-slate-700/60 bg-slate-900/50 p-5 text-sm text-slate-500">No event photos added yet.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {albums.map((album) => (
                <article key={album.id} className="overflow-hidden rounded-xl border border-slate-700/70 bg-slate-900/60">
                  {album.cover_url && <img src={getPhotoPreviewUrl(album.cover_url)} alt="" className="h-44 w-full object-cover" loading="lazy" />}
                  <div className="p-5">
                    <p className="text-xs uppercase tracking-[0.14em] text-cyan-300">{new Date(`${album.event_date}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    <h3 className="mt-2 text-lg font-semibold text-white">{album.event_name}</h3>
                    {album.description && <p className="mt-2 text-sm text-slate-400">{album.description}</p>}
                    <p className="mt-3 text-xs text-slate-500">{album.photos.length} photo{album.photos.length === 1 ? '' : 's'}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(album)}
                        disabled={saving || deletingAlbumId === album.id}
                        className="rounded-lg border border-cyan-300/30 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-200 transition hover:border-cyan-200 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Edit Photos / Links
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(album)}
                        disabled={deletingAlbumId === album.id || saving}
                        className="rounded-lg border border-rose-400/40 bg-rose-500/15 px-3 py-2 text-xs font-semibold text-rose-200 transition hover:border-rose-300 hover:bg-rose-500/25 disabled:cursor-wait disabled:opacity-50"
                      >
                        {deletingAlbumId === album.id ? 'Deleting photos...' : 'Delete event and photos'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </LayoutWrapper>
  );
}
