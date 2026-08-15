import { createClient } from '@supabase/supabase-js';
import { hashPassword } from '@/lib/auth-utils';
import { generateCSEId } from '@/lib/cse-id-utils';

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

    const { name, email, password, admissionYear, currentYear } = await request.json();

    if (!name || !email || !password || !admissionYear || !currentYear) {
      return Response.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Use service role key for backend queries
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Generate CSE ID
    const cseId = await generateCSEId(admissionYear, currentYear);

    // Hash password
    const passwordHash = await hashPassword(password);

    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          cse_id: cseId,
          name,
          email,
          admission_year: parseInt(admissionYear, 10),
          year: parseInt(currentYear, 10),
          password_hash: passwordHash,
          role: 'member',
          department: 'CSE',
        },
      ])
      .select()
      .single();

    if (error) {
      return Response.json(
        { error: error.message || 'Registration failed' },
        { status: 400 }
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
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Registration failed' },
      { status: 500 }
    );
  }
}
