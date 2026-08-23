import { createClient } from '@supabase/supabase-js';
import { logActivity } from '@/lib/activity-logger';
import { getSessionUserId } from '@/lib/session';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'Failed to create event';
}

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !serviceRoleKey) {
      return Response.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { title, expectedDate, authorityLetterUrl, caption } = body ?? {};
    const createdBy = getSessionUserId(request);
    if (!title || !expectedDate || !authorityLetterUrl || !createdBy) {
      return Response.json({ error: 'Event name, expected date, authority letter, and authentication are required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: creator, error: creatorError } = await supabase
      .from('users')
      .select('id, role, is_verified')
      .eq('id', createdBy)
      .maybeSingle();
    if (creatorError) throw creatorError;
    if (!creator) {
      return Response.json({ error: 'Your login session is outdated. Please log out and log in again.' }, { status: 401 });
    }
    if (creator.is_verified === false) {
      return Response.json({ error: 'Your account is not verified.' }, { status: 403 });
    }
    const role = String(creator?.role || '').trim().toLowerCase();
    if (!['admin', 'faculty', 'cultural_secretary', 'technical_secretary'].includes(role)) {
      return Response.json({ error: 'Only admin, faculty, cultural secretary, or technical secretary can add events' }, { status: 403 });
    }

    const eventValues: Record<string, string | null> = {
      title: String(title).trim(),
      description: caption ? String(caption).trim() : null,
      caption: caption ? String(caption).trim() : null,
      authority_letter_url: String(authorityLetterUrl).trim(),
      start_date: new Date(`${expectedDate}T00:00:00`).toISOString(),
      approval_status: ['cultural_secretary', 'technical_secretary'].includes(role) ? 'pending' : 'approved',
      event_type: role === 'cultural_secretary' ? 'cultural' : role === 'technical_secretary' ? 'technical' : 'general',
    };
    eventValues.created_by = creator.id;

    const { data, error } = await supabase
      .from('events')
      .insert(eventValues)
      .select('*')
      .single();
    if (error) {
      if (error.message.includes('authority_letter_url') || error.message.includes('caption')) {
        throw new Error('Events database update is required. Run shuffal/supabase/migrations/009_add_event_news_fields.sql in Supabase, then try again.');
      }
      throw error;
    }
    await logActivity(supabase, {
      userId: creator?.id || createdBy,
      action: 'Event Created',
      description: `${data.title} was added to society events`,
      entityType: 'event',
      entityId: data.id,
    });
    return Response.json({ event: data }, { status: 201 });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error('Event creation error:', error);
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    if (!supabaseUrl || !serviceRoleKey) return Response.json({ events: [] });
    const userId = getSessionUserId(request);
    if (!userId) return Response.json({ error: 'Authentication required' }, { status: 401 });
    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await supabase.from('events').select('*').eq('created_by', userId).eq('approval_status', 'pending').order('created_at', { ascending: false });
    if (error) throw error;
    return Response.json({ events: data || [] });
  } catch (error) {
    return Response.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!supabaseUrl || !serviceRoleKey) {
      return Response.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const { eventId } = await request.json();
    const userId = getSessionUserId(request);
    if (!eventId || !userId) {
      return Response.json({ error: 'Event ID and authentication are required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: requester, error: requesterError } = await supabase
      .from('users')
      .select('id, role, is_verified')
      .eq('id', userId)
      .maybeSingle();

    if (requesterError) throw requesterError;
    if (!requester || requester.is_verified === false) {
      return Response.json({ error: 'Verified users can remove events' }, { status: 403 });
    }

    const isAdminOrFaculty = ['admin', 'faculty'].includes(String(requester.role).toLowerCase());
    const isSecretary = ['cultural_secretary', 'technical_secretary'].includes(String(requester.role).toLowerCase());
    let deleteQuery = supabase.from('events').delete().eq('id', eventId);
    if (!isAdminOrFaculty && isSecretary) {
      deleteQuery = deleteQuery.eq('created_by', requester.id).eq('approval_status', 'pending');
    } else if (!isAdminOrFaculty) {
      return Response.json({ error: 'You do not have permission to remove events' }, { status: 403 });
    }

    const { error: deleteError } = await deleteQuery;

    if (deleteError) throw deleteError;
    await logActivity(supabase, {
      userId: requester.id,
      action: 'Event Removed',
      description: 'An event was removed from society events',
      entityType: 'event',
      entityId: eventId,
    });
    return Response.json({ success: true });
  } catch (error) {
    console.error('Event deletion error:', error);
    return Response.json({ error: getErrorMessage(error).replace('Failed to create event', 'Failed to remove event') }, { status: 500 });
  }
}