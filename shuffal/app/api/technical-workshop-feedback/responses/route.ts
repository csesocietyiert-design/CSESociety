import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import {
  createEventSupabase,
  TECHNICAL_WORKSHOP_FEEDBACK_EVENT_KEY,
} from '@/lib/technical-workshop-feedback-server';

const PAGE_SIZE = 500;
const responseHeaders = { 'Cache-Control': 'no-store' };

export async function GET(request: Request) {
  const userId = getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401, headers: responseHeaders });
  }

  let supabase: ReturnType<typeof createEventSupabase>;
  try {
    supabase = createEventSupabase();
  } catch (error) {
    console.error('Feedback export database configuration error:', error);
    return NextResponse.json({ error: 'Feedback responses are temporarily unavailable.' }, { status: 503, headers: responseHeaders });
  }

  const { data: admin, error: adminError } = await supabase
    .from('users')
    .select('role,is_verified')
    .eq('id', userId)
    .maybeSingle();
  if (adminError) {
    console.error('Feedback export admin lookup failed:', adminError);
    return NextResponse.json({ error: 'Could not verify admin access.' }, { status: 503, headers: responseHeaders });
  }
  if (!admin || String(admin.role).toLowerCase() !== 'admin' || admin.is_verified !== true) {
    return NextResponse.json({ error: 'Only verified admins can export feedback responses.' }, { status: 403, headers: responseHeaders });
  }

  const responses = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('technical_workshop_feedback')
      .select('id,society_id,overall_rating,content_rating,speaker_rating,organization_rating,highlight,suggestions,created_at')
      .eq('event_key', TECHNICAL_WORKSHOP_FEEDBACK_EVENT_KEY)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) {
      console.error('Feedback response export query failed:', error);
      return NextResponse.json({ error: 'Could not load all feedback responses.' }, { status: 500, headers: responseHeaders });
    }

    responses.push(...(data || []));
    if (!data || data.length < PAGE_SIZE) break;
  }

  return NextResponse.json({ responses }, { headers: responseHeaders });
}
