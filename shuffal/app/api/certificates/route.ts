import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('certificates')
      .select('id, event_name, date, drive_link, created_by, created_at')
      .order('created_at', { ascending: false });

    if (error) {
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
    return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventName, date, driveLink, userId } = body;

    if (!eventName || !date || !driveLink || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

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
    return NextResponse.json({ error: 'Failed to create certificate' }, { status: 500 });
  }
}
