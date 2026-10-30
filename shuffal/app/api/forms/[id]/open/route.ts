import { NextResponse } from 'next/server';
import { isFormExpired } from '@/lib/forms';
import { getFormSessionUser, getFormsSupabase } from '@/lib/forms-server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = getFormsSupabase();
    const { data: form, error } = await supabase
      .from('registration_forms')
      .select('resource_url, document_url, end_date')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!form) return NextResponse.json({ error: 'Form not found' }, { status: 404 });

    if (isFormExpired(form.end_date)) {
      const requestedAdminAccess = new URL(request.url).searchParams.get('admin') === '1';
      const user = requestedAdminAccess ? await getFormSessionUser(request, supabase) : null;
      if (!user || user.role !== 'admin') {
        return NextResponse.json({ error: 'Form closed' }, { status: 410 });
      }
    }

    const wantsDocument = new URL(request.url).searchParams.get('document') === '1';
    const resourceUrl = wantsDocument ? form.document_url : form.resource_url;
    if (!resourceUrl) {
      return NextResponse.json({ error: 'No document link is available for this form' }, { status: 404 });
    }

    return NextResponse.json({ resourceUrl });
  } catch (error) {
    console.error('Registration form open error:', error);
    return NextResponse.json({ error: 'Could not open registration form' }, { status: 500 });
  }
}
