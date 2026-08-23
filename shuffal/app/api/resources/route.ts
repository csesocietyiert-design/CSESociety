import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { logActivity } from '@/lib/activity-logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

async function isAdmin(userId: string) {
  const { data } = await supabase.from('users').select('role').eq('id', userId).single();
  return data?.role === 'admin';
}

export async function GET() {
  if (!supabaseUrl || !supabaseServiceKey) return NextResponse.json({ resources: [] });
  const { data, error } = await supabase.from('resources').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ resources: data || [] });
}

export async function POST(request: NextRequest) {
  try {
    const { title, description, resourceUrl, category, userId } = await request.json();
    if (!title || !resourceUrl || !userId) return NextResponse.json({ error: 'Title, link, and user are required' }, { status: 400 });
    if (!(await isAdmin(userId))) return NextResponse.json({ error: 'Only admins can add resources' }, { status: 403 });

    const { data, error } = await supabase.from('resources').insert({
      title: title.trim(),
      description: description?.trim() || null,
      resource_url: resourceUrl.trim(),
      category: category?.trim() || 'General',
      created_by: userId,
    }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await logActivity(supabase, { userId, action: 'Resource Added', description: `${title} was added`, entityType: 'resource', entityId: data.id });
    return NextResponse.json({ resource: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 });
  }
}
