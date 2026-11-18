import { createClient } from '@supabase/supabase-js';
import { getSessionUserId } from '@/lib/session';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function getRequester(request: Request) {
  const userId = getSessionUserId(request);
  if (!userId) return null;
  const supabase = getAdminClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from('users')
    .select('id, role, is_verified')
    .eq('id', userId)
    .maybeSingle();
  return data;
}

export async function GET() {
  const supabase = getAdminClient();
  if (!supabase) return Response.json({ albums: [] });

  const { data: albums, error: albumError } = await supabase
    .from('event_photo_albums')
    .select('*')
    .order('event_date', { ascending: false });
  if (albumError) {
    return Response.json({ error: albumError.message }, { status: 500 });
  }

  const albumIds = (albums || []).map((album) => album.id);
  let photos: Array<{ id: string; album_id: string; photo_url: string; caption: string | null; sort_order: number }> = [];
  if (albumIds.length > 0) {
    const { data, error } = await supabase
      .from('event_photos')
      .select('id, album_id, photo_url, caption, sort_order')
      .in('album_id', albumIds)
      .order('sort_order', { ascending: true });
    if (error) return Response.json({ error: error.message }, { status: 500 });
    photos = data || [];
  }

  const result = (albums || []).map((album) => ({
    ...album,
    photos: photos.filter((photo) => photo.album_id === album.id),
  }));
  return Response.json({ albums: result });
}

export async function POST(request: Request) {
  const requester = await getRequester(request);
  if (!requester) return Response.json({ error: 'Authentication required' }, { status: 401 });
  if (String(requester.role).toLowerCase() !== 'admin' || requester.is_verified === false) {
    return Response.json({ error: 'Only a verified admin can add event photos' }, { status: 403 });
  }

  const body = await request.json();
  const eventName = String(body.eventName || '').trim();
  const eventDate = String(body.eventDate || '').trim();
  const description = String(body.description || '').trim();
  const photoUrls = Array.isArray(body.photoUrls)
    ? body.photoUrls.map((url: unknown) => String(url).trim()).filter(Boolean)
    : String(body.photoUrls || '').split(/\r?\n|,/).map((url) => url.trim()).filter(Boolean);

  if (!eventName || !eventDate || photoUrls.length === 0) {
    return Response.json({ error: 'Event name, date, and at least one photo link are required' }, { status: 400 });
  }

  const supabase = getAdminClient();
  if (!supabase) return Response.json({ error: 'Supabase not configured' }, { status: 500 });

  const { data: album, error: albumError } = await supabase
    .from('event_photo_albums')
    .insert({
      event_name: eventName,
      event_date: eventDate,
      description: description || null,
      cover_url: photoUrls[0],
      created_by: requester.id,
    })
    .select('*')
    .single();
  if (albumError) return Response.json({ error: albumError.message }, { status: 500 });

  const { error: photosError } = await supabase.from('event_photos').insert(
    photoUrls.map((photoUrl: string, index: number) => ({
      album_id: album.id,
      photo_url: photoUrl,
      sort_order: index,
    })),
  );
  if (photosError) {
    await supabase.from('event_photo_albums').delete().eq('id', album.id);
    return Response.json({ error: photosError.message }, { status: 500 });
  }

  return Response.json({ album }, { status: 201 });
}

export async function PATCH(request: Request) {
  const requester = await getRequester(request);
  if (!requester) return Response.json({ error: 'Authentication required' }, { status: 401 });
  if (String(requester.role).toLowerCase() !== 'admin' || requester.is_verified === false) {
    return Response.json({ error: 'Only a verified admin can edit event photos' }, { status: 403 });
  }

  const body = await request.json() as {
    albumId?: unknown;
    eventName?: unknown;
    eventDate?: unknown;
    description?: unknown;
    photoUrls?: unknown;
  };
  const albumId = String(body.albumId || '').trim();
  const eventName = String(body.eventName || '').trim();
  const eventDate = String(body.eventDate || '').trim();
  const description = String(body.description || '').trim();
  const photoUrls = Array.isArray(body.photoUrls)
    ? body.photoUrls.map((url: unknown) => String(url).trim()).filter(Boolean)
    : String(body.photoUrls || '').split(/\r?\n|,/).map((url) => url.trim()).filter(Boolean);

  if (!albumId) return Response.json({ error: 'Album ID is required' }, { status: 400 });
  if (!eventName || !eventDate || photoUrls.length === 0) {
    return Response.json({ error: 'Event name, date, and at least one photo link are required' }, { status: 400 });
  }
  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(eventDate)
    ? new Date(`${eventDate}T00:00:00.000Z`)
    : null;
  if (!parsedDate || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== eventDate) {
    return Response.json({ error: 'A valid event date is required' }, { status: 400 });
  }
  const invalidPhotoUrl = photoUrls.find((photoUrl) => {
    try {
      return !['http:', 'https:'].includes(new URL(photoUrl).protocol);
    } catch {
      return true;
    }
  });
  if (invalidPhotoUrl) {
    return Response.json({ error: 'Photo links must be valid HTTP or HTTPS URLs' }, { status: 400 });
  }

  const supabase = getAdminClient();
  if (!supabase) return Response.json({ error: 'Supabase not configured' }, { status: 500 });

  const { data: currentAlbum, error: currentAlbumError } = await supabase
    .from('event_photo_albums')
    .select('id, event_name, event_date, description, cover_url')
    .eq('id', albumId)
    .maybeSingle();
  if (currentAlbumError) return Response.json({ error: currentAlbumError.message }, { status: 500 });
  if (!currentAlbum) return Response.json({ error: 'Event album not found' }, { status: 404 });

  const { data: currentPhotos, error: currentPhotosError } = await supabase
    .from('event_photos')
    .select('id')
    .eq('album_id', albumId);
  if (currentPhotosError) return Response.json({ error: currentPhotosError.message }, { status: 500 });

  const { data: newPhotos, error: insertError } = await supabase
    .from('event_photos')
    .insert(photoUrls.map((photoUrl: string, index: number) => ({
      album_id: albumId,
      photo_url: photoUrl,
      sort_order: index,
    })))
    .select('id, album_id, photo_url, caption, sort_order');
  if (insertError) return Response.json({ error: insertError.message }, { status: 500 });

  const updatedFields = {
    event_name: eventName,
    event_date: eventDate,
    description: description || null,
    cover_url: photoUrls[0],
  };
  const { data: updatedAlbum, error: albumUpdateError } = await supabase
    .from('event_photo_albums')
    .update(updatedFields)
    .eq('id', albumId)
    .select('*')
    .single();
  if (albumUpdateError) {
    const newPhotoIds = (newPhotos || []).map((photo) => photo.id);
    const rollback = newPhotoIds.length
      ? await supabase.from('event_photos').delete().in('id', newPhotoIds)
      : { error: null };
    const rollbackMessage = rollback.error ? ` Photo cleanup also failed: ${rollback.error.message}` : '';
    return Response.json({ error: `${albumUpdateError.message}${rollbackMessage}` }, { status: 500 });
  }

  const oldPhotoIds = (currentPhotos || []).map((photo) => photo.id);
  if (oldPhotoIds.length > 0) {
    const { error: deleteError } = await supabase.from('event_photos').delete().in('id', oldPhotoIds);
    if (deleteError) {
      const [albumRollback, photoRollback] = await Promise.all([
        supabase
          .from('event_photo_albums')
          .update({
            event_name: currentAlbum.event_name,
            event_date: currentAlbum.event_date,
            description: currentAlbum.description,
            cover_url: currentAlbum.cover_url,
          })
          .eq('id', albumId),
        supabase
          .from('event_photos')
          .delete()
          .in('id', (newPhotos || []).map((photo) => photo.id)),
      ]);
      const rollbackErrors = [albumRollback.error, photoRollback.error]
        .filter((rollbackError): rollbackError is NonNullable<typeof rollbackError> => rollbackError !== null)
        .map((rollbackError) => rollbackError.message);
      const rollbackMessage = rollbackErrors.length
        ? ` Rollback also failed: ${rollbackErrors.join('; ')}`
        : '';
      return Response.json({ error: `${deleteError.message}${rollbackMessage}` }, { status: 500 });
    }
  }

  return Response.json({ album: { ...updatedAlbum, photos: newPhotos || [] } });
}

export async function DELETE(request: Request) {
  const requester = await getRequester(request);
  if (!requester) return Response.json({ error: 'Authentication required' }, { status: 401 });
  if (String(requester.role).toLowerCase() !== 'admin' || requester.is_verified === false) {
    return Response.json({ error: 'Only a verified admin can remove event photos' }, { status: 403 });
  }

  const body = await request.json();
  const albumId = String(body.albumId || '').trim();
  if (!albumId) return Response.json({ error: 'Album ID is required' }, { status: 400 });

  const supabase = getAdminClient();
  if (!supabase) return Response.json({ error: 'Supabase not configured' }, { status: 500 });
  const { error } = await supabase.from('event_photo_albums').delete().eq('id', albumId);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
