import { createClient } from '@supabase/supabase-js';
import { getSessionUserId } from '@/lib/session';

const AKTU_PORTAL_URL = 'https://erp.aktu.ac.in/webpages/oneview/oneview.aspx?AspxAutoDetectCookieSupport=1';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const requestTimesByUser = new Map<string, number[]>();

export async function POST(request: Request) {
  const userId = getSessionUserId(request);
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseUrl || !serviceRoleKey) return Response.json({ error: 'AKTU result service is currently unavailable. Please try again later.', code: 'service_unavailable' }, { status: 503 });

  const recentRequests = (requestTimesByUser.get(userId) || []).filter((time) => Date.now() - time < 60_000);
  if (recentRequests.length >= 3) {
    return Response.json({ error: 'Please wait before checking again.', code: 'rate_limited' }, { status: 429 });
  }
  recentRequests.push(Date.now());
  requestTimesByUser.set(userId, recentRequests);

  let payload: { rollNumber?: string; dateOfBirth?: string };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: 'Please check your details.', code: 'invalid_input' }, { status: 400 });
  }

  const rollNumber = payload.rollNumber?.trim() || '';
  const dateOfBirth = payload.dateOfBirth?.trim() || '';
  if (!/^[A-Za-z0-9/-]{6,30}$/.test(rollNumber)) {
    return Response.json({ error: 'Please check your AKTU roll number.', code: 'invalid_roll_number' }, { status: 400 });
  }
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateOfBirth)) {
    return Response.json({ error: 'Please check your date of birth.', code: 'invalid_dob' }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('cse_id, email')
    .eq('id', userId)
    .maybeSingle();
  if (userError || !user) return Response.json({ error: 'AKTU result service is currently unavailable. Please try again later.', code: 'service_unavailable' }, { status: 503 });

  const { data: membership, error: membershipError } = await supabase
    .from('membership')
    .select('roll_number_aktu')
    .or(`society_id.eq.${user.cse_id},email_address.eq.${user.email},email_address_secondary.eq.${user.email}`)
    .limit(1)
    .maybeSingle();
  if (membershipError) return Response.json({ error: 'AKTU result service is currently unavailable. Please try again later.', code: 'service_unavailable' }, { status: 503 });

  const registeredRollNumber = membership?.roll_number_aktu?.trim();
  if (!registeredRollNumber || registeredRollNumber.toLowerCase() !== rollNumber.toLowerCase()) {
    return Response.json({ error: 'Please use your registered AKTU roll number.', code: 'roll_number_mismatch' }, { status: 400 });
  }

  try {
    const response = await fetch(AKTU_PORTAL_URL, {
      cache: 'no-store',
      redirect: 'manual',
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok || response.status >= 300) {
      return Response.json({
        error: 'AKTU requires you to complete the result lookup on the official portal.',
        code: 'verification_required',
        portalUrl: AKTU_PORTAL_URL,
      });
    }

    const html = await response.text();
    const requiresVerification = /captcha|verification|security code|human/i.test(html);
    return Response.json({
      error: requiresVerification
        ? 'AKTU requires you to complete the result lookup on the official portal.'
        : 'We could not read the result from AKTU right now. Please try again later.',
      code: requiresVerification ? 'verification_required' : 'unexpected_response',
      portalUrl: AKTU_PORTAL_URL,
    });
  } catch {
    return Response.json({
      error: 'AKTU result service is currently unavailable. Please try again later.',
      code: 'service_unavailable',
      portalUrl: AKTU_PORTAL_URL,
    }, { status: 503 });
  }
}