import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { EVENT_REGISTRATION } from '@/lib/event-registration';
import {
  getEventRegistrationManager,
  hashEventPassToken,
  sendEventPassEmail,
} from '@/lib/event-registration-server';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getEventRegistrationManager(request);
  if (auth.error) return auth.error;

  const { id } = await context.params;
  let method: unknown;
  try {
    method = (await request.json()).method;
  } catch {
    return NextResponse.json({ error: 'Choose email or WhatsApp pass delivery.' }, { status: 400 });
  }
  if (method !== 'email' && method !== 'whatsapp') {
    return NextResponse.json({ error: 'Choose email or WhatsApp pass delivery.' }, { status: 400 });
  }

  const { data: registration, error: loadError } = await auth.supabase
    .from('esports_event_registrations')
    .select('id, full_name, email, whatsapp_phone, participant_type, payment_status')
    .eq('id', id)
    .eq('event_key', EVENT_REGISTRATION.key)
    .maybeSingle();
  if (loadError) {
    console.error('Event pass registration lookup failed:', loadError);
    return NextResponse.json({ error: 'Could not load this registration.' }, { status: 500 });
  }
  if (!registration) return NextResponse.json({ error: 'Event registration not found.' }, { status: 404 });
  if (!['verified', 'waived'].includes(registration.payment_status)) {
    return NextResponse.json({ error: 'Verify the payment before issuing this entry pass.' }, { status: 409 });
  }
  if (method === 'whatsapp' && !registration.whatsapp_phone) {
    return NextResponse.json({ error: 'No WhatsApp number is available for this registration.' }, { status: 400 });
  }

  const token = randomBytes(32).toString('base64url');
  const tokenHash = hashEventPassToken('', token);
  const { error: saveError } = await auth.supabase
    .from('esports_event_registrations')
    .update({ pass_token_hash: tokenHash, updated_at: new Date().toISOString() })
    .eq('id', registration.id)
    .eq('event_key', EVENT_REGISTRATION.key);
  if (saveError) {
    console.error('Event pass token could not be stored:', saveError);
    return NextResponse.json({ error: 'Could not prepare the entry pass.' }, { status: 500 });
  }

  const appOrigin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '') || new URL(request.url).origin;
  const passUrl = `${appOrigin}/event-registration/pass/${token}`;
  if (method === 'email') {
    try {
      await sendEventPassEmail(registration.email, registration.full_name, passUrl, registration.id);
    } catch (mailError) {
      console.error('Event entry pass email delivery failed:', mailError);
      return NextResponse.json({ error: 'Could not send the pass email. Check SMTP configuration and try again.' }, { status: 503 });
    }

    const sentAt = new Date().toISOString();
    const { error: markError } = await auth.supabase
      .from('esports_event_registrations')
      .update({ pass_status: 'sent', pass_sent_at: sentAt, updated_at: sentAt })
      .eq('id', registration.id)
      .eq('event_key', EVENT_REGISTRATION.key);
    if (markError) {
      console.error('Event pass email was sent but pass status could not be updated:', markError);
      return NextResponse.json({ error: 'The pass email was sent, but its delivery status could not be saved. Refresh the roster before retrying.' }, { status: 500 });
    }
    return NextResponse.json({ message: 'Entry pass email sent.', passUrl, passStatus: 'sent' });
  }

  const digits = registration.whatsapp_phone.replace(/\D/g, '');
  const phone = digits.length === 10 ? `91${digits}` : digits;
  const message = `Your CSE Society E-Sports entry pass: ${passUrl} (Registration ${registration.id})`;
  return NextResponse.json({
    message: 'WhatsApp is ready to open. Send the message, then mark the pass as sent in the roster.',
    whatsappUrl: `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
    passUrl,
    passStatus: 'pending',
  });
}
