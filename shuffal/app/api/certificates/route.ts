import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { logActivity } from '@/lib/activity-logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

async function isAdmin(userId: string) {
  const { data } = await supabase.from('users').select('role').eq('id', userId).single();
  return data?.role === 'admin';
}

export async function GET() {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials');
      return NextResponse.json({ certificates: [] });
    }

    const { data, error } = await supabase
      .from('certificates')
      .select('id, event_name, date, drive_link, created_by, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching certificates:', error);
      // Return empty array if table doesn't exist yet
      if (error.code === 'PGRST116') {
        return NextResponse.json({ certificates: [] });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      certificates: (data || []).map((cert: any) => ({
        id: cert.id,
        eventName: cert.event_name,
        date: cert.date,
        driveLink: cert.drive_link,
        createdBy: cert.created_by,
        createdAt: cert.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return NextResponse.json({ certificates: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials');
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const body = await request.json();
    const { eventName, date, driveLink, userId } = body;

    if (!eventName || !date || !driveLink || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!(await isAdmin(userId))) {
      return NextResponse.json({ error: 'Only admins can add certificates' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('certificates')
      .insert({
        event_name: eventName,
        date,
        drive_link: driveLink,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating certificate:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logActivity(supabase, {
      userId: userId,
      action: 'Certificate Added',
      description: `Certificate for ${eventName} was added`,
      entityType: 'certificate',
      entityId: data.id,
    });

    return NextResponse.json(
      {
        certificate: {
          id: data.id,
          eventName: data.event_name,
          date: data.date,
          driveLink: data.drive_link,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating certificate:', error);
    return NextResponse.json({ error: 'Failed to create certificate' }, { status: 500 });
  }
}
