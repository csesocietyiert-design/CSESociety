import { NextResponse } from 'next/server';
import {
  createEventSupabase,
  getEventRegistrationManager,
} from '@/lib/event-registration-server';
import { WORKSHOP_REGISTRATION } from '@/lib/workshop-registration';
import { getWorkshopRegistrationClosesAt } from '@/lib/workshop-registration-server';

const noCacheHeaders = { 'Cache-Control': 'no-store' };

export async function GET() {
  let supabase;
  try {
    supabase = createEventSupabase();
    const closesAt = await getWorkshopRegistrationClosesAt(supabase);
    return NextResponse.json({
      closesAt,
      isOpen: Date.now() < new Date(closesAt).getTime(),
      eventStartsAt: WORKSHOP_REGISTRATION.startsAt,
    }, { headers: noCacheHeaders });
  } catch (error) {
    console.error('Workshop registration deadline could not be loaded:', error);
    return NextResponse.json({ error: 'Workshop registration deadline is unavailable. The site administrator may need to apply database migration 042_workshop_registration_settings.sql.' }, { status: 503, headers: noCacheHeaders });
  }
}

export async function PATCH(request: Request) {
  const auth = await getEventRegistrationManager(request);
  if (auth.error) return auth.error;

  const { data: user, error: userError } = await auth.supabase
    .from('users')
    .select('role')
    .eq('id', auth.managerId)
    .maybeSingle();
  if (userError) {
    console.error('Workshop deadline admin role lookup failed:', userError);
    return NextResponse.json({ error: 'Could not verify admin permissions.' }, { status: 500, headers: noCacheHeaders });
  }
  if (!user || String(user.role).toLowerCase() !== 'admin') {
    return NextResponse.json({ error: 'Only admins can change the workshop deadline.' }, { status: 403, headers: noCacheHeaders });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid deadline update.' }, { status: 400, headers: noCacheHeaders });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body) || !('closesAt' in body)) {
    return NextResponse.json({ error: 'Invalid deadline update.' }, { status: 400, headers: noCacheHeaders });
  }
  const requestedClosesAt = body.closesAt;
  const closesAt = typeof requestedClosesAt === 'string' ? new Date(requestedClosesAt) : null;
  if (
    !closesAt
    || !Number.isFinite(closesAt.getTime())
    || closesAt.getTime() <= Date.now()
    || closesAt.getTime() > new Date(WORKSHOP_REGISTRATION.startsAt).getTime()
  ) {
    return NextResponse.json({ error: 'Choose a future deadline no later than the workshop start time.' }, { status: 400, headers: noCacheHeaders });
  }

  const { data, error } = await auth.supabase
    .from('workshop_registration_settings')
    .update({
      closes_at: closesAt.toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: auth.managerId,
    })
    .eq('event_key', WORKSHOP_REGISTRATION.key)
    .select('closes_at')
    .maybeSingle();

  if (error) {
    console.error('Workshop registration deadline update failed:', error);
    return NextResponse.json({ error: 'Could not update the workshop deadline.' }, { status: 500, headers: noCacheHeaders });
  }
  if (!data) {
    return NextResponse.json({ error: 'Workshop deadline settings are missing. Apply migration 042_workshop_registration_settings.sql.' }, { status: 503, headers: noCacheHeaders });
  }

  return NextResponse.json({
    closesAt: data.closes_at,
    isOpen: Date.now() < new Date(data.closes_at).getTime(),
    eventStartsAt: WORKSHOP_REGISTRATION.startsAt,
  }, { headers: noCacheHeaders });
}
