import { createClient } from '@supabase/supabase-js';
import { OAuth2Client } from 'google-auth-library';
import { createSessionCookie } from '@/lib/session';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const googleClient = new OAuth2Client(googleClientId);

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !serviceRoleKey || !googleClientId) {
      return Response.json(
        { error: 'Google authentication is not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const credential = typeof body?.credential === 'string' ? body.credential.trim() : '';

    if (!credential) {
      return Response.json(
        { error: 'Google ID token required' },
        { status: 400 }
      );
    }

    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: googleClientId,
      });
    } catch {
      return Response.json(
        { error: 'Invalid or expired Google ID token' },
        { status: 401 }
      );
    }
    const googleUser = ticket.getPayload();
    const email = googleUser?.email?.trim().toLowerCase();

    if (!googleUser || !email || googleUser.email_verified !== true) {
      return Response.json(
        { error: 'Google account email is not verified' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('email', email)
      .maybeSingle();

    if (error || !data) {
      return Response.json(
        { error: 'Account Not Found. Your Google account is not registered with the CSE Society. Please register first or contact the CSE Society administration.' },
        { status: 404 }
      );
    }

    if (!data.is_verified) {
      return Response.json(
        { error: 'Your account is pending approval. Please wait for admin verification.' },
        { status: 403 }
      );
    }

    return Response.json({
      user: {
        id: data.id,
        cseId: data.cse_id,
        name: data.name || googleUser.name || 'Google User',
        email: data.email,
        role: data.role,
        year: data.year,
        department: data.department,
        is_verified: data.is_verified,
      },
    }, { headers: { 'Set-Cookie': createSessionCookie(data.id) } });
  } catch (error) {
    console.error('Google auth error:', error);
    return Response.json(
      { error: 'Google authentication failed' },
      { status: 500 }
    );
  }
}
