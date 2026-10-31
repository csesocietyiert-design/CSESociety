import { NextResponse } from 'next/server';
import { isCircularId, getCircularsSupabase } from '@/lib/circulars-server';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!isCircularId(id)) {
    return NextResponse.json({ error: 'Circular not found' }, { status: 404 });
  }

  try {
    const supabase = getCircularsSupabase();
    const { data: circular, error: circularError } = await supabase
      .from('circulars')
      .select('file_path')
      .eq('id', id)
      .maybeSingle();
    if (circularError) throw circularError;
    if (!circular) return NextResponse.json({ error: 'Circular not found' }, { status: 404 });

    const { data, error } = await supabase.storage
      .from('society-circulars')
      .createSignedUrl(circular.file_path, 60);
    if (error) throw error;

    return NextResponse.redirect(data.signedUrl, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Circular document request failed:', error);
    return NextResponse.json({ error: 'Could not open circular' }, { status: 500 });
  }
}
