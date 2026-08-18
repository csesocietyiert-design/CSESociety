import { createClient } from '@supabase/supabase-js';
import { verifyPassword } from '@/lib/auth-utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const devDemoUsers: Record<string, { password: string; user: any }> = {
  '23F2601': {
    password: 'KuchBhi',
    user: {
      id: '11111111-1111-4111-8111-111111111111',
      cseId: '23F2601',
      name: 'Admin User',
      email: 'admin@csesociety.com',
      role: 'admin',
      year: 1,
      department: 'CSE',
      is_verified: true,
      profile_image_url: null,
    },
  },
  '23F2602': {
    password: 'user123',
    user: {
      id: '22222222-2222-4222-8222-222222222222',
      cseId: '23F2602',
      name: 'Member User',
      email: 'member@csesociety.com',
      role: 'member',
      year: 1,
      department: 'CSE',
      is_verified: true,
      profile_image_url: null,
    },
  },
  '23F2603': {
    password: 'exec123',
    user: {
      id: '33333333-3333-4333-8333-333333333333',
      cseId: '23F2603',
      name: 'Executive User',
      email: 'executive@csesociety.com',
      role: 'executive',
      year: 2,
      department: 'CSE',
      is_verified: true,
      profile_image_url: null,
    },
  },
};

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
    const demoUser = devDemoUsers[identifier];
    if (demoUser && demoUser.password === password) {
      return Response.json({ user: demoUser.user });
    }

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
