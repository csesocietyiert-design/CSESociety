import { NextResponse } from 'next/server';
import { getCircularAdmin, getCircularsSupabase, isCircularId } from '@/lib/circulars-server';

type RouteContext = { params: Promise<{ id: string }> };

function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!isCircularId(id)) {
    return NextResponse.json({ error: 'Circular not found' }, { status: 404 });
  }

  try {
    const supabase = getCircularsSupabase();
    const { data, error } = await supabase
      .from('circulars')
      .select('id, title, description, circular_date, category, uploaded_at')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Circular not found' }, { status: 404 });

    return NextResponse.json({ circular: data }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Circular request failed:', error);
    return NextResponse.json({ error: 'Could not load circular' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!isCircularId(id)) {
    return NextResponse.json({ error: 'Circular not found' }, { status: 404 });
  }

  try {
    const supabase = getCircularsSupabase();
    const admin = await getCircularAdmin(request, supabase);
    if ('error' in admin) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const body: unknown = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Enter valid circular details' }, { status: 400 });
    }

    const details = body as Record<string, unknown>;
    const title = typeof details.title === 'string' ? details.title.trim() : '';
    const category = typeof details.category === 'string' ? details.category.trim() : '';
    const description = typeof details.description === 'string' ? details.description.trim() : '';
    if (
      !title ||
      title.length > 150 ||
      /\.pdf$/i.test(title) ||
      !category ||
      category.length > 80 ||
      !isValidDate(details.circularDate) ||
      description.length > 1000
    ) {
      return NextResponse.json(
        { error: 'Enter an official circular title (not a PDF filename), a valid date, a category up to 80 characters, and a description up to 1,000 characters' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('circulars')
      .update({
        title,
        circular_date: details.circularDate,
        category,
        description: description || null,
      })
      .eq('id', id)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Circular not found' }, { status: 404 });

    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Circular update failed:', error);
    return NextResponse.json({ error: 'Could not update circular' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!isCircularId(id)) {
    return NextResponse.json({ error: 'Circular not found' }, { status: 404 });
  }

  try {
    const supabase = getCircularsSupabase();
    const admin = await getCircularAdmin(request, supabase);
    if ('error' in admin) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const { data: circular, error: lookupError } = await supabase
      .from('circulars')
      .select('file_path')
      .eq('id', id)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!circular) return NextResponse.json({ error: 'Circular not found' }, { status: 404 });

    const bucket = supabase.storage.from('society-circulars');
    const { data: storedFile, error: downloadError } = await bucket.download(circular.file_path);
    if (downloadError) throw downloadError;
    const fileBytes = new Uint8Array(await storedFile.arrayBuffer());

    const { error: removeError } = await bucket.remove([circular.file_path]);
    if (removeError) throw removeError;

    const { data: deleted, error: deleteError } = await supabase
      .from('circulars')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();
    if (deleteError || !deleted) {
      const { error: restoreError } = await bucket.upload(circular.file_path, fileBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });
      if (restoreError) {
        console.error('Could not restore a circular PDF after metadata deletion failed:', restoreError);
        return NextResponse.json(
          { error: 'Could not finish deleting the circular or restore its PDF. Contact support.' },
          { status: 500 }
        );
      }
      if (deleteError) throw deleteError;
      return NextResponse.json({ error: 'Circular not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Circular deletion failed:', error);
    return NextResponse.json({ error: 'Could not delete circular' }, { status: 500 });
  }
}
