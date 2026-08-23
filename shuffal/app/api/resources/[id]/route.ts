import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { logActivity } from '@/lib/activity-logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId } = await request.json();
    const { data: user } = await supabase.from('users').select('role').eq('id', userId).single();
    if (user?.role !== 'admin') return NextResponse.json({ error: 'Only admins can remove resources' }, { status: 403 });

    const { error } = await supabase.from('resources').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logActivity(supabase, { userId, action: 'Resource Removed', description: 'A resource was removed', entityType: 'resource', entityId: id });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete resource' }, { status: 500 });
  }
}
