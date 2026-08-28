import { createClient } from '@supabase/supabase-js';
import { verifyPassword } from '@/lib/auth-utils';
import { createSessionCookie } from '@/lib/session';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: Request) {
  try {
    const { cseId, password } = await request.json();

    if (!cseId || !password) {
      return Response.json(
        { error: 'CSE ID and password required' },
        { status: 400 }
      );
    }

    const identifier = String(cseId).trim();
    if (!supabaseUrl || !serviceRoleKey) {
      return Response.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let data = null;
    let error = null;

    const lookupValue = identifier;

    if (lookupValue.includes('@')) {
      const emailQuery = await supabase.from('users').select('*').eq('email', lookupValue).limit(1);
      data = emailQuery.data?.[0] ?? null;
      error = emailQuery.error;
    } else {
      const cseQuery = await supabase.from('users').select('*').eq('cse_id', lookupValue).limit(1);
      data = cseQuery.data?.[0] ?? null;
      error = cseQuery.error;

      if (!data && !error) {
        const emailQuery = await supabase.from('users').select('*').eq('email', lookupValue).limit(1);
        data = emailQuery.data?.[0] ?? null;
        error = emailQuery.error;
      }
    }

    if (error || !data) {
      return Response.json(
        { error: 'Invalid Credentials' },
        { status: 401 }
      );
    }

    const passwordMatch = await verifyPassword(password, data.password_hash);
    if (!passwordMatch) {
      return Response.json(
        { error: 'Invalid Credentials' },
        { status: 401 }
      );
    }

    return Response.json({
      user: {
        id: data.id,
        cseId: data.cse_id,
        name: data.name,
        email: data.email,
        role: data.role,
        year: data.year,
        department: data.department,
        created_at: data.created_at,
        is_verified: data.is_verified,
        profile_image_url: data.profile_image_url || null,
      },
    }, { headers: { 'Set-Cookie': createSessionCookie(data.id) } });
  } catch (error) {
    console.error('Login error:', error);
    return Response.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
