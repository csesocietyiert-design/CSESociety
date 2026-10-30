import { NextResponse } from 'next/server';
import { getFormSessionUser, getFormsSupabase, isValidEndDate } from '@/lib/forms-server';
import { logActivity } from '@/lib/activity-logger';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = getFormsSupabase();
    const user = await getFormSessionUser(request, supabase);
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ error: 'Only admins can extend form dates' }, { status: 403 });

    const body = await request.json();
    if (!isValidEndDate(body?.endDate)) {
      return NextResponse.json({ error: 'Enter a valid end date' }, { status: 400 });
    }

    const { data: existing, error: existingError } = await supabase
      .from('registration_forms')
      .select('title, end_date')
      .eq('id', id)
      .maybeSingle();
    if (existingError) throw existingError;
    if (!existing) return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    if (body.endDate <= existing.end_date) {
      return NextResponse.json({ error: 'The new end date must be later than the current end date' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('registration_forms')
      .update({ end_date: body.endDate })
      .eq('id', id)
      .select('id, title, end_date, created_at')
      .single();
    if (error) throw error;

    await logActivity(supabase, {
      userId: user.id,
      action: 'Registration Form Extended',
      description: `${existing.title} end date was extended to ${body.endDate}`,
      entityType: 'registration_form',
      entityId: id,
    });
    return NextResponse.json({ form: data });
  } catch (error) {
    console.error('Registration form date extension error:', error);
    return NextResponse.json({ error: 'Could not extend registration form date' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = getFormsSupabase();
    const user = await getFormSessionUser(request, supabase);
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ error: 'Only admins can delete forms' }, { status: 403 });

    const { data: existing, error: existingError } = await supabase
      .from('registration_forms')
      .select('title')
      .eq('id', id)
      .maybeSingle();
    if (existingError) throw existingError;
    if (!existing) return NextResponse.json({ error: 'Form not found' }, { status: 404 });

    const { error } = await supabase.from('registration_forms').delete().eq('id', id);
    if (error) throw error;

    await logActivity(supabase, {
      userId: user.id,
      action: 'Registration Form Deleted',
      description: `${existing.title} was deleted`,
      entityType: 'registration_form',
      entityId: id,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Registration form deletion error:', error);
    return NextResponse.json({ error: 'Could not delete registration form' }, { status: 500 });
  }
}
