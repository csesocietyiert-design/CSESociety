import { createClient } from '@supabase/supabase-js';

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
    const { title, expectedDate, authorityLetterUrl, caption, createdBy, creatorRole } = body ?? {};
    if (!title || !expectedDate || !authorityLetterUrl || !createdBy) {
      return Response.json({ error: 'Event name, expected date, authority letter, and creator are required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: creator, error: creatorError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', createdBy)
      .maybeSingle();
    if (creatorError) throw creatorError;
    const role = String(creatorRole || creator?.role || '').trim().toLowerCase();
    const isKnownLocalAdmin = ['1', '11111111-1111-4111-8111-111111111111'].includes(String(createdBy));
    if (!['admin', 'faculty'].includes(role) && !(isKnownLocalAdmin && !creatorRole)) {
      return Response.json({ error: 'Only admin or faculty can add events' }, { status: 403 });
    }

    const eventValues: Record<string, string | null> = {
      title: String(title).trim(),
      description: caption ? String(caption).trim() : null,
      caption: caption ? String(caption).trim() : null,
      authority_letter_url: String(authorityLetterUrl).trim(),
      start_date: new Date(`${expectedDate}T00:00:00`).toISOString(),
    };
    if (creator?.id) {
      eventValues.created_by = creator.id;
    }

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
    return Response.json({ event: data }, { status: 201 });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error('Event creation error:', error);
    return Response.json({ error: message }, { status: 500 });
  }
}