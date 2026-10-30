import { NextResponse } from 'next/server';
import { FORM_CREATOR_ROLES } from '@/lib/forms';
import { getFormSessionUser, getFormsSupabase, isValidEndDate, isValidResourceUrl } from '@/lib/forms-server';
import { logActivity } from '@/lib/activity-logger';

const publicHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
};

export async function GET() {
  try {
    const supabase = getFormsSupabase();
    const { data, error } = await supabase
      .from('registration_forms')
      .select('id, title, end_date, document_url, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ forms: data || [] }, { headers: publicHeaders });
  } catch (error) {
    console.error(
      'Registration forms fetch error:',
      error instanceof Error ? error.message : JSON.stringify(error)
    );
    return NextResponse.json({ error: 'Could not load registration forms' }, { status: 500, headers: publicHeaders });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: publicHeaders });
}

export async function POST(request: Request) {
  try {
    const supabase = getFormsSupabase();
    const user = await getFormSessionUser(request, supabase);
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    if (!FORM_CREATOR_ROLES.has(user.role)) {
      return NextResponse.json({ error: 'Only admins and designated secretaries can create forms' }, { status: 403 });
    }

    const body = await request.json();
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    const resourceUrl = typeof body?.resourceUrl === 'string' ? body.resourceUrl.trim() : '';
    const documentUrl = typeof body?.documentUrl === 'string' ? body.documentUrl.trim() : '';
    if (
      !title ||
      title.length > 150 ||
      !isValidEndDate(body?.endDate) ||
      !isValidResourceUrl(resourceUrl) ||
      (documentUrl !== '' && !isValidResourceUrl(documentUrl))
    ) {
      return NextResponse.json(
        { error: 'Enter a form name, valid end date, required registration link, and optional valid document link' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('registration_forms')
      .insert({
        title,
        end_date: body.endDate,
        resource_url: resourceUrl,
        document_url: documentUrl || null,
        created_by: user.id,
      })
      .select('id, title, end_date, document_url, created_at')
      .single();
    if (error) throw error;

    await logActivity(supabase, {
      userId: user.id,
      action: 'Registration Form Created',
      description: `${title} was added`,
      entityType: 'registration_form',
      entityId: data.id,
    });
    return NextResponse.json({ form: data }, { status: 201 });
  } catch (error) {
    console.error('Registration form creation error:', error);
    return NextResponse.json({ error: 'Could not create registration form' }, { status: 500 });
  }
}
