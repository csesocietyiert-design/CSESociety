import { createClient } from '@supabase/supabase-js';
import { createSessionCookie } from '@/lib/session';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !serviceRoleKey) {
      return Response.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const credential = body?.credential || body?.token || body?.access_token;

    if (!credential) {
      return Response.json(
        { error: 'Google credential required' },
        { status: 400 }
      );
    }

    const googleResponse = credential.includes('.')
      ? await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`)
      : await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${encodeURIComponent(credential)}`);

    if (!googleResponse.ok) {
      return Response.json(
        { error: 'Invalid Google token' },
        { status: 401 }
      );
    }

    const googleUser = await googleResponse.json();
    const email = String(googleUser.email || '').trim().toLowerCase();
    const name = googleUser.name || 'Google User';

    if (!email) {
      return Response.json(
        { error: 'Google account email not verified' },
        { status: 400 }
      );
    }

    if (googleUser.email_verified === false && googleUser.verified_email === false) {
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
        name: data.name || name,
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
