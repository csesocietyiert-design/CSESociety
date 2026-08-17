import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || '';

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !serviceRoleKey) {
      return Response.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    const { token } = await request.json();

    if (!token) {
      return Response.json(
        { error: 'Google token required' },
        { status: 400 }
      );
    }

    // Verify the Google token
    const tokenVerifyUrl = `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${token}`;
    
    const googleResponse = await fetch(tokenVerifyUrl);
    
    if (!googleResponse.ok) {
      return Response.json(
        { error: 'Invalid Google token' },
        { status: 401 }
      );
    }

    const googleUser = await googleResponse.json();
    const { email, name, picture } = googleUser;

    if (!email) {
      return Response.json(
        { error: 'Google account email not verified' },
        { status: 400 }
      );
    }

    // Use service role key for backend queries
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if the email exists in the CSE Society database
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) {
      return Response.json(
        { error: 'Email not registered with CSE Society. Please register first.' },
        { status: 404 }
      );
    }

    // Verify the user is active/verified
    if (!data.is_verified) {
      return Response.json(
        { error: 'Your account is pending approval. Please wait for admin verification.' },
        { status: 403 }
      );
    }

    // User exists and is verified - return their data
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
    });
  } catch (error) {
    console.error('Google auth error:', error);
    return Response.json(
      { error: 'Google authentication failed' },
      { status: 500 }
    );
  }
}
