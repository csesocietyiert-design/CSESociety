import { createClient } from '@supabase/supabase-js';
import { verifyPassword } from '@/lib/auth-utils';

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

    const { cseId, password } = await request.json();

    if (!cseId || !password) {
      return Response.json(
        { error: 'CSE ID and password required' },
        { status: 400 }
      );
    }

    // Use service role key for backend queries
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('cse_id', cseId)
      .single();

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
        is_verified: data.is_verified,
        profile_image_url: data.profile_image_url || null,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return Response.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
