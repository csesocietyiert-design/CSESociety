import { NextResponse } from 'next/server';
import { getCircularsSupabase, isCircularId } from '@/lib/circulars-server';

type RouteContext = { params: Promise<{ id: string }> };

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
