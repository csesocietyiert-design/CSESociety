import { NextResponse } from 'next/server';
import { getCircularsSupabase, isCircularId } from '@/lib/circulars-server';

export async function getCircularPdfResponse(id: string) {
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

    const { data: file, error: fileError } = await supabase.storage
      .from('society-circulars')
      .download(circular.file_path);
    if (fileError) throw fileError;

    const bytes = new Uint8Array(await file.arrayBuffer());
    return new NextResponse(bytes, {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Disposition': `inline; filename="circular-${id}.pdf"`,
        'Content-Length': String(bytes.byteLength),
        'Content-Type': 'application/pdf',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Circular PDF request failed:', error);
    return NextResponse.json({ error: 'Could not open circular' }, { status: 500 });
  }
}
