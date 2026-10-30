import { NextResponse } from 'next/server';
import { EVENT_REGISTRATION } from '@/lib/event-registration';
import { getEventRegistrationManager } from '@/lib/event-registration-server';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getEventRegistrationManager(request);
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const { data, error } = await auth.supabase
    .from('event_registrations')
    .select('payment_screenshot_path')
    .eq('id', id)
    .eq('event_key', EVENT_REGISTRATION.key)
    .maybeSingle();
  if (error) {
    console.error('Event payment proof lookup failed:', error);
    return NextResponse.json({ error: 'Could not retrieve payment proof.' }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: 'Event registration not found.' }, { status: 404 });
  if (!data.payment_screenshot_path) return NextResponse.json({ error: 'No payment screenshot was uploaded.' }, { status: 404 });

  const { data: signedUrl, error: signError } = await auth.supabase.storage
    .from('event-payment-proofs')
    .createSignedUrl(data.payment_screenshot_path, 60);
  if (signError || !signedUrl) {
    console.error('Event payment proof URL could not be signed:', signError);
    return NextResponse.json({ error: 'Could not retrieve payment proof.' }, { status: 500 });
  }

  return NextResponse.redirect(signedUrl.signedUrl);
}
